import { describe, expect, it } from "vitest";
import type { NormalizedTrade } from "@tradecheck/contracts";
import { analyzeExecutions, reconstructTrades } from "./index.js";

function fill(overrides: Partial<NormalizedTrade>): NormalizedTrade {
  return {
    externalId: "x",
    broker: "generic",
    symbol: "FPT",
    exchange: "HOSE",
    side: "BUY",
    executedAt: "2026-08-01T02:00:00.000Z",
    quantity: 100,
    price: 100_000,
    fee: 0,
    tax: 0,
    currency: "VND",
    ...overrides,
  };
}

describe("reconstructTrades", () => {
  it("reconstructs FIFO partial exits and leaves remaining position", () => {
    const result = reconstructTrades([
      fill({ externalId: "b1", quantity: 100, price: 100_000 }),
      fill({ externalId: "b2", executedAt: "2026-08-02T02:00:00.000Z", quantity: 100, price: 105_000 }),
      fill({ externalId: "s1", executedAt: "2026-08-03T02:00:00.000Z", side: "SELL", quantity: 150, price: 110_000 }),
    ]);

    expect(result.closedTrades).toHaveLength(2);
    expect(result.closedTrades[0]?.quantity).toBe(100);
    expect(result.closedTrades[0]?.grossPnl).toBe(1_000_000);
    expect(result.closedTrades[1]?.quantity).toBe(50);
    expect(result.closedTrades[1]?.grossPnl).toBe(250_000);
    expect(result.openPositions).toHaveLength(1);
    expect(result.openPositions[0]?.quantity).toBe(50);
    expect(result.openPositions[0]?.averagePrice).toBe(105_000);
  });

  it("deduplicates imported executions by broker and external id", () => {
    const same = fill({ externalId: "same" });
    const result = reconstructTrades([same, same]);
    expect(result.ignoredDuplicateExecutionIds).toEqual(["generic|same"]);
    expect(result.openPositions[0]?.quantity).toBe(100);
  });

  it("supports short positions for futures/derivatives style histories", () => {
    const result = reconstructTrades([
      fill({ externalId: "s1", side: "SELL", price: 120_000 }),
      fill({ externalId: "b1", side: "BUY", executedAt: "2026-08-02T02:00:00.000Z", price: 100_000 }),
    ]);
    expect(result.closedTrades[0]?.direction).toBe("SHORT");
    expect(result.closedTrades[0]?.grossPnl).toBe(2_000_000);
    expect(result.openPositions).toHaveLength(0);
  });
});

describe("analyzeExecutions", () => {
  it("calculates net pnl, win rate, expectancy and drawdown", () => {
    const result = analyzeExecutions([
      fill({ externalId: "b1", quantity: 100, price: 100_000, fee: 10_000 }),
      fill({ externalId: "s1", executedAt: "2026-08-02T02:00:00.000Z", side: "SELL", quantity: 100, price: 110_000, fee: 10_000, tax: 10_000 }),
      fill({ externalId: "b2", executedAt: "2026-08-03T02:00:00.000Z", quantity: 100, price: 120_000 }),
      fill({ externalId: "s2", executedAt: "2026-08-04T02:00:00.000Z", side: "SELL", quantity: 100, price: 115_000 }),
    ]);

    expect(result.metrics.closedTrades).toBe(2);
    expect(result.metrics.winners).toBe(1);
    expect(result.metrics.losers).toBe(1);
    expect(result.metrics.winRate).toBe(50);
    expect(result.metrics.netPnl).toBe(470_000);
    expect(result.metrics.expectancy).toBe(235_000);
    expect(result.metrics.maxDrawdown).toBe(500_000);
  });
});
