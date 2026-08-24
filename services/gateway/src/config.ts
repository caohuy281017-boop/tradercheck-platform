import { z } from "zod";

const booleanFromString = (defaultValue = false) => z
  .preprocess((value) => {
    if (value === undefined) return defaultValue;
    if (typeof value === "boolean") return value;
    return String(value).toLowerCase() === "true";
  }, z.boolean());

const optionalUrl = z.string().url().optional().or(z.literal("").transform(() => undefined));

const ConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  APP_ORIGIN: z.string().url(),
  SITE_ORIGIN: z.string().url(),
  JWT_SECRET: z.string().min(32),
  TRADETALLY_BASE_URL: optionalUrl,
  TRADETALLY_SERVICE_TOKEN: z.string().optional(),
  VIBE_TRADING_BASE_URL: optionalUrl,
  VIBE_TRADING_SERVICE_TOKEN: z.string().optional(),
  FEATURE_TRADE_ANALYTICS: booleanFromString(true),
  FEATURE_VN_IMPORT: booleanFromString(true),
  FEATURE_AI_RESEARCH: booleanFromString(),
  FEATURE_BACKTEST: booleanFromString(),
  FEATURE_HUB: booleanFromString(),
});

export type GatewayConfig = z.infer<typeof ConfigSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): GatewayConfig {
  return ConfigSchema.parse(env);
}
