import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import type { GatewayConfig } from "./config.js";

const config: GatewayConfig = {
  NODE_ENV: "test",
  PORT: 8080,
  APP_ORIGIN: "http://localhost:3000",
  SITE_ORIGIN: "http://localhost:3001",
  JWT_SECRET: "test-secret-that-is-at-least-32-characters",
  FEATURE_TRADE_ANALYTICS: true,
  FEATURE_VN_IMPORT: true,
  FEATURE_AI_RESEARCH: false,
  FEATURE_BACKTEST: false,
  FEATURE_HUB: false,
};

describe("gateway", () => {
  it("exposes only enabled capabilities", async () => {
    const app = await buildApp(config);
    const response = await app.inject({ method: "GET", url: "/api/v1/capabilities" });
    expect(response.statusCode).toBe(200);
    const ids = response.json().capabilities.map((item: { id: string }) => item.id);
    expect(ids).toContain("trades.import.vn");
    expect(ids).not.toContain("backtest.run");
    await app.close();
  });

  it("protects tool execution with JWT", async () => {
    const app = await buildApp(config);
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/tools/run",
      payload: { capabilityId: "analytics.trading-summary", input: {} },
    });
    expect(response.statusCode).toBe(401);
    await app.close();
  });
});
