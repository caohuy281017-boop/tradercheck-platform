import { describe, expect, it } from "vitest";
import { createVibeTradingProvider } from "./index.js";

describe("UpstreamProvider", () => {
  it("fails closed when an upstream is not configured", async () => {
    const health = await createVibeTradingProvider({}).health();
    expect(health).toEqual({
      provider: "vibe-trading",
      available: false,
      detail: "not_configured",
    });
  });
});
