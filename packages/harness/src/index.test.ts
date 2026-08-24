import { describe, expect, it } from "vitest";
import {
  CapabilityRegistry,
  HarnessRunner,
  InMemoryRunLedger,
  PolicyEngine,
} from "./index.js";

describe("HarnessRunner", () => {
  it("requires explicit approval for a high-risk capability", async () => {
    const registry = new CapabilityRegistry();
    registry.register({
      manifest: {
        id: "backtest.run",
        name: "Run backtest",
        description: "Runs generated strategy code in an isolated worker",
        provider: "vibe-trading",
        scopes: ["backtest.run"],
        plans: ["pro"],
        riskLevel: "high",
        approvalRequired: true,
        asynchronous: false,
        enabled: true,
      },
      execute: async () => ({ ok: true }),
    });

    const runner = new HarnessRunner(
      registry,
      new PolicyEngine(),
      new InMemoryRunLedger(),
      () => "run-1",
    );
    const actor = { userId: "u1", plan: "pro" as const, scopes: ["backtest.run"] };

    const first = await runner.run(actor, {
      capabilityId: "backtest.run",
      input: {},
      approved: false,
    });
    expect(first.status).toBe("approval_required");

    const second = await runner.run(actor, {
      capabilityId: "backtest.run",
      input: {},
      approved: true,
    });
    expect(second.status).toBe("completed");
  });

  it("rejects actors without the required scope", async () => {
    const registry = new CapabilityRegistry();
    registry.register({
      manifest: {
        id: "portfolio.read",
        name: "Read portfolio",
        description: "Reads a normalized portfolio snapshot",
        provider: "tradetally",
        scopes: ["portfolio.read"],
        plans: ["free", "pro"],
        riskLevel: "low",
        approvalRequired: false,
        asynchronous: false,
        enabled: true,
      },
      execute: async () => [],
    });

    const result = await new HarnessRunner(
      registry,
      new PolicyEngine(),
      new InMemoryRunLedger(),
      () => "run-2",
    ).run(
      { userId: "u1", plan: "free", scopes: [] },
      { capabilityId: "portfolio.read", input: {}, approved: false },
    );

    expect(result).toMatchObject({ status: "rejected", message: "missing_scope" });
  });
});
