import { z } from "zod";

export const RiskLevelSchema = z.enum(["low", "medium", "high", "critical"]);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const PlanSchema = z.enum(["free", "pro", "business", "internal"]);
export type Plan = z.infer<typeof PlanSchema>;

export const CapabilityManifestSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9.-]+$/),
  name: z.string().min(1),
  description: z.string().min(1),
  provider: z.string().min(1),
  scopes: z.array(z.string()).default([]),
  plans: z.array(PlanSchema).min(1),
  riskLevel: RiskLevelSchema,
  approvalRequired: z.boolean(),
  asynchronous: z.boolean(),
  enabled: z.boolean(),
});
export type CapabilityManifest = z.infer<typeof CapabilityManifestSchema>;

export const ActorSchema = z.object({
  userId: z.string().min(1),
  plan: PlanSchema,
  scopes: z.array(z.string()),
});
export type Actor = z.infer<typeof ActorSchema>;

export const ToolRequestSchema = z.object({
  capabilityId: z.string().min(1),
  input: z.unknown(),
  approved: z.boolean().default(false),
  idempotencyKey: z.string().min(8).optional(),
});
export type ToolRequest = z.infer<typeof ToolRequestSchema>;

export const ToolResultSchema = z.object({
  runId: z.string().min(1),
  status: z.enum(["completed", "queued", "approval_required", "rejected"]),
  output: z.unknown().optional(),
  message: z.string().optional(),
});
export type ToolResult = z.infer<typeof ToolResultSchema>;

export const NormalizedTradeSchema = z.object({
  externalId: z.string().min(1),
  broker: z.string().min(1),
  symbol: z.string().min(1),
  exchange: z.enum(["HOSE", "HNX", "UPCOM", "UNKNOWN"]),
  side: z.enum(["BUY", "SELL"]),
  executedAt: z.string().datetime(),
  quantity: z.number().positive(),
  price: z.number().nonnegative(),
  fee: z.number().nonnegative().default(0),
  tax: z.number().nonnegative().default(0),
  currency: z.literal("VND"),
});
export type NormalizedTrade = z.infer<typeof NormalizedTradeSchema>;

export const UpstreamHealthSchema = z.object({
  provider: z.string(),
  available: z.boolean(),
  version: z.string().optional(),
  detail: z.string().optional(),
});
export type UpstreamHealth = z.infer<typeof UpstreamHealthSchema>;
