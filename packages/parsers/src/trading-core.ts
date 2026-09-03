import type { NormalizedTrade } from "@tradecheck/contracts";

export interface ClosedTrade {
  id: string;
  symbol: string;
  broker: string;
  exchange: string;
  currency: string;
  direction: "LONG" | "SHORT";
  openedAt: string;
  closedAt: string;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  grossPnl: number;
  fees: number;
  taxes: number;
  netPnl: number;
  returnPct: number;
  holdingMs: number;
  entryExecutionIds: string[];
  exitExecutionIds: string[];
}

export interface OpenPosition {
  symbol: string;
  broker: string;
  exchange: string;
  currency: string;
  direction: "LONG" | "SHORT";
  quantity: number;
  averagePrice: number;
  openedAt: string;
  executionIds: string[];
}

export interface ReconstructionResult {
  closedTrades: ClosedTrade[];
  openPositions: OpenPosition[];
  ignoredDuplicateExecutionIds: string[];
}

export interface PerformanceMetrics {
  closedTrades: number;
  winners: number;
  losers: number;
  breakeven: number;
  winRate: number;
  grossProfit: number;
  grossLoss: number;
  netPnl: number;
  averageWin: number;
  averageLoss: number;
  expectancy: number;
  profitFactor: number | null;
  maxDrawdown: number;
  maxDrawdownPct: number;
  averageHoldingMs: number;
  bestTrade: ClosedTrade | null;
  worstTrade: ClosedTrade | null;
  equityCurve: Array<{ at: string; equity: number; drawdown: number }>;
}

type Lot = {
  side: "LONG" | "SHORT";
  quantity: number;
  price: number;
  openedAt: string;
  executionId: string;
  feePerUnit: number;
  taxPerUnit: number;
  broker: string;
  exchange: string;
  currency: string;
};

function stableExecutionKey(fill: NormalizedTrade): string {
  return `${fill.broker}|${fill.externalId}`;
}

function compareFills(a: NormalizedTrade, b: NormalizedTrade): number {
  const time = Date.parse(a.executedAt) - Date.parse(b.executedAt);
  if (time !== 0) return time;
  return stableExecutionKey(a).localeCompare(stableExecutionKey(b));
}

function allocateCost(total: number, fillQuantity: number): number {
  if (!Number.isFinite(total) || total <= 0 || fillQuantity <= 0) return 0;
  return total / fillQuantity;
}

export function reconstructTrades(fills: NormalizedTrade[]): ReconstructionResult {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const lotsBySymbol = new Map<string, Lot[]>();
  const closedTrades: ClosedTrade[] = [];

  for (const fill of [...fills].sort(compareFills)) {
    const key = stableExecutionKey(fill);
    if (seen.has(key)) {
      duplicates.push(key);
      continue;
    }
    seen.add(key);

    const lots = lotsBySymbol.get(fill.symbol) ?? [];
    const desiredSide: Lot["side"] = fill.side === "BUY" ? "LONG" : "SHORT";
    const closingSide: Lot["side"] = desiredSide === "LONG" ? "SHORT" : "LONG";
    let remaining = fill.quantity;
    const exitFeePerUnit = allocateCost(fill.fee, fill.quantity);
    const exitTaxPerUnit = allocateCost(fill.tax, fill.quantity);

    while (remaining > 0) {
      const lotIndex = lots.findIndex((lot) => lot.side === closingSide && lot.quantity > 0);
      if (lotIndex < 0) break;

      const lot = lots[lotIndex]!;
      const matched = Math.min(remaining, lot.quantity);
      const entryValue = lot.price * matched;
      const exitValue = fill.price * matched;
      const grossPnl = lot.side === "LONG" ? exitValue - entryValue : entryValue - exitValue;
      const entryFees = (lot.feePerUnit + lot.taxPerUnit) * matched;
      const exitFees = (exitFeePerUnit + exitTaxPerUnit) * matched;
      const fees = lot.feePerUnit * matched + exitFeePerUnit * matched;
      const taxes = lot.taxPerUnit * matched + exitTaxPerUnit * matched;
      const netPnl = grossPnl - entryFees - exitFees;
      const basis = Math.max(entryValue, Number.EPSILON);

      closedTrades.push({
        id: `${lot.executionId}:${fill.externalId}:${matched}:${closedTrades.length}`,
        symbol: fill.symbol,
        broker: fill.broker,
        exchange: String(fill.exchange),
        currency: fill.currency,
        direction: lot.side,
        openedAt: lot.openedAt,
        closedAt: fill.executedAt,
        quantity: matched,
        entryPrice: lot.price,
        exitPrice: fill.price,
        grossPnl,
        fees,
        taxes,
        netPnl,
        returnPct: (netPnl / basis) * 100,
        holdingMs: Math.max(0, Date.parse(fill.executedAt) - Date.parse(lot.openedAt)),
        entryExecutionIds: [lot.executionId],
        exitExecutionIds: [fill.externalId],
      });

      lot.quantity -= matched;
      remaining -= matched;
      if (lot.quantity <= 1e-12) lots.splice(lotIndex, 1);
    }

    if (remaining > 0) {
      lots.push({
        side: desiredSide,
        quantity: remaining,
        price: fill.price,
        openedAt: fill.executedAt,
        executionId: fill.externalId,
        feePerUnit: allocateCost(fill.fee, fill.quantity),
        taxPerUnit: allocateCost(fill.tax, fill.quantity),
        broker: fill.broker,
        exchange: String(fill.exchange),
        currency: fill.currency,
      });
    }

    lotsBySymbol.set(fill.symbol, lots);
  }

  const openPositions: OpenPosition[] = [];
  for (const [symbol, lots] of lotsBySymbol.entries()) {
    for (const direction of ["LONG", "SHORT"] as const) {
      const group = lots.filter((lot) => lot.side === direction && lot.quantity > 0);
      if (group.length === 0) continue;
      const quantity = group.reduce((sum, lot) => sum + lot.quantity, 0);
      const value = group.reduce((sum, lot) => sum + lot.quantity * lot.price, 0);
      const first = group.reduce((min, lot) => Date.parse(lot.openedAt) < Date.parse(min.openedAt) ? lot : min);
      openPositions.push({
        symbol,
        broker: first.broker,
        exchange: first.exchange,
        currency: first.currency,
        direction,
        quantity,
        averagePrice: value / quantity,
        openedAt: first.openedAt,
        executionIds: group.map((lot) => lot.executionId),
      });
    }
  }

  return {
    closedTrades: closedTrades.sort((a, b) => Date.parse(a.closedAt) - Date.parse(b.closedAt)),
    openPositions,
    ignoredDuplicateExecutionIds: duplicates,
  };
}

export function calculatePerformance(closedTrades: ClosedTrade[]): PerformanceMetrics {
  const ordered = [...closedTrades].sort((a, b) => Date.parse(a.closedAt) - Date.parse(b.closedAt));
  const winners = ordered.filter((trade) => trade.netPnl > 0);
  const losers = ordered.filter((trade) => trade.netPnl < 0);
  const breakeven = ordered.length - winners.length - losers.length;
  const grossProfit = winners.reduce((sum, trade) => sum + trade.netPnl, 0);
  const grossLoss = losers.reduce((sum, trade) => sum + trade.netPnl, 0);
  const netPnl = ordered.reduce((sum, trade) => sum + trade.netPnl, 0);

  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;
  let maxDrawdownPct = 0;
  const equityCurve = ordered.map((trade) => {
    equity += trade.netPnl;
    peak = Math.max(peak, equity);
    const drawdown = peak - equity;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
    const denom = Math.max(Math.abs(peak), Number.EPSILON);
    maxDrawdownPct = Math.max(maxDrawdownPct, (drawdown / denom) * 100);
    return { at: trade.closedAt, equity, drawdown };
  });

  const bestTrade = ordered.length ? ordered.reduce((best, trade) => trade.netPnl > best.netPnl ? trade : best) : null;
  const worstTrade = ordered.length ? ordered.reduce((worst, trade) => trade.netPnl < worst.netPnl ? trade : worst) : null;

  return {
    closedTrades: ordered.length,
    winners: winners.length,
    losers: losers.length,
    breakeven,
    winRate: ordered.length ? (winners.length / ordered.length) * 100 : 0,
    grossProfit,
    grossLoss,
    netPnl,
    averageWin: winners.length ? grossProfit / winners.length : 0,
    averageLoss: losers.length ? grossLoss / losers.length : 0,
    expectancy: ordered.length ? netPnl / ordered.length : 0,
    profitFactor: grossLoss < 0 ? grossProfit / Math.abs(grossLoss) : grossProfit > 0 ? null : 0,
    maxDrawdown,
    maxDrawdownPct,
    averageHoldingMs: ordered.length ? ordered.reduce((sum, trade) => sum + trade.holdingMs, 0) / ordered.length : 0,
    bestTrade,
    worstTrade,
    equityCurve,
  };
}

export function analyzeExecutions(fills: NormalizedTrade[]) {
  const reconstruction = reconstructTrades(fills);
  return {
    ...reconstruction,
    metrics: calculatePerformance(reconstruction.closedTrades),
  };
}
