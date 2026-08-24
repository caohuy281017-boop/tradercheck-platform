import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import { ActorSchema, ToolRequestSchema } from "@tradecheck/contracts";
import {
  CapabilityRegistry,
  HarnessRunner,
  InMemoryRunLedger,
  PolicyEngine,
} from "@tradecheck/harness";
import {
  createTradeTallyProvider,
  createVibeTradingProvider,
} from "@tradecheck/providers";
import { createVietnamCapabilities } from "@tradecheck/vietnam";
import type { GatewayConfig } from "./config.js";

export async function buildApp(config: GatewayConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === "production" ? "info" : "warn",
      redact: [
        "req.headers.authorization",
        "req.headers.cookie",
        "res.headers.set-cookie",
        "*.serviceToken",
      ],
    },
    bodyLimit: 1_048_576,
    requestIdHeader: "x-request-id",
  });

  await app.register(helmet, { global: true });
  await app.register(cors, {
    origin: [config.APP_ORIGIN, config.SITE_ORIGIN],
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
  });
  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
  });
  await app.register(jwt, { secret: config.JWT_SECRET });

  const tradeTally = createTradeTallyProvider({
    ...(config.TRADETALLY_BASE_URL ? { baseUrl: config.TRADETALLY_BASE_URL } : {}),
    ...(config.TRADETALLY_SERVICE_TOKEN
      ? { serviceToken: config.TRADETALLY_SERVICE_TOKEN }
      : {}),
  });
  const vibeTrading = createVibeTradingProvider({
    ...(config.VIBE_TRADING_BASE_URL ? { baseUrl: config.VIBE_TRADING_BASE_URL } : {}),
    ...(config.VIBE_TRADING_SERVICE_TOKEN
      ? { serviceToken: config.VIBE_TRADING_SERVICE_TOKEN }
      : {}),
  });

  const registry = new CapabilityRegistry();
  for (const capability of createVietnamCapabilities(
    {
      tradeAnalytics: config.FEATURE_TRADE_ANALYTICS,
      vnImport: config.FEATURE_VN_IMPORT,
      aiResearch: config.FEATURE_AI_RESEARCH,
      backtest: config.FEATURE_BACKTEST,
      hub: config.FEATURE_HUB,
    },
    { tradeTally, vibeTrading },
  )) {
    registry.register(capability);
  }

  const runner = new HarnessRunner(
    registry,
    new PolicyEngine(),
    new InMemoryRunLedger(),
  );

  app.get("/health", async () => ({ status: "ok", service: "tradecheck-gateway" }));
  app.get("/api/v1/upstreams/health", async () => ({
    upstreams: await Promise.all([tradeTally.health(), vibeTrading.health()]),
  }));
  app.get("/api/v1/capabilities", async () => ({
    capabilities: registry.list().filter(({ enabled }) => enabled),
  }));

  app.post("/api/v1/tools/run", {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.code(401).send({ error: "unauthorized" });
      }
    },
    handler: async (request, reply) => {
      const actor = ActorSchema.safeParse(request.user);
      const toolRequest = ToolRequestSchema.safeParse(request.body);
      if (!actor.success || !toolRequest.success) {
        return reply.code(400).send({ error: "invalid_request" });
      }
      const result = await runner.run(actor.data, toolRequest.data);
      return reply.code(result.status === "rejected" ? 403 : 200).send(result);
    },
  });

  app.setErrorHandler((error, _request, reply) => {
    app.log.error({ err: error }, "request_failed");
    return reply.code(500).send({ error: "internal_error" });
  });

  return app;
}
