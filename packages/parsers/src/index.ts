import type { NormalizedTrade } from "@tradecheck/contracts";

export interface ParseIssue {
  row: number;
  code: string;
  detail: string;
}

export interface ParseResult {
  trades: NormalizedTrade[];
  issues: ParseIssue[];
}

export function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const aliases = {
  id: ["so hieu lenh", "ma lenh", "order id"],
  date: ["ngay khop", "thoi gian khop", "ngay giao dich"],
  symbol: ["ma chung khoan", "ma ck", "symbol"],
  side: ["mua ban", "loai lenh", "side"],
  quantity: ["khoi luong khop", "khoi luong", "quantity"],
  price: ["gia khop", "gia", "price"],
  fee: ["phi giao dich", "phi", "fee"],
  tax: ["thue", "tax"],
  exchange: ["san", "san giao dich", "exchange"],
} as const;

type Field = keyof typeof aliases;

function resolveColumns(headers: string[]): Partial<Record<Field, number>> {
  const normalized = headers.map(normalizeHeader);
  const columns: Partial<Record<Field, number>> = {};
  for (const [field, candidates] of Object.entries(aliases) as [Field, readonly string[]][]) {
    const index = normalized.findIndex((header) => candidates.includes(header));
    if (index >= 0) columns[field] = index;
  }
  return columns;
}

function numberFrom(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  const raw = String(value ?? "").trim().replace(/\s/g, "");
  if (!raw) return 0;
  const thousandGrouped = /^\d{1,3}([.,]\d{3})+$/.test(raw);
  const normalized = thousandGrouped
    ? raw.replace(/[.,]/g, "")
    : raw.replace(/\./g, "").replace(",", ".");
  return Number(normalized.replace(/[^0-9.-]/g, ""));
}

function cell(row: unknown[], columns: Partial<Record<Field, number>>, field: Field): unknown {
  const index = columns[field];
  return index === undefined ? undefined : row[index];
}

function parseDate(value: unknown): string | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  const text = String(value ?? "").trim();
  const match = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!match) return null;
  const [, day, month, year, hour = "0", minute = "0", second = "0"] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour) - 7, Number(minute), Number(second)));
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export function parseVnDirectRows(rows: unknown[][]): ParseResult {
  if (rows.length < 2) return { trades: [], issues: [{ row: 0, code: "empty_file", detail: "No data rows" }] };
  const headerRow = rows[0] ?? [];
  const columns = resolveColumns(headerRow.map((value) => String(value ?? "")));
  const required: Field[] = ["date", "symbol", "side", "quantity", "price"];
  const missing = required.filter((field) => columns[field] === undefined);
  if (missing.length > 0) {
    return {
      trades: [],
      issues: [{ row: 1, code: "missing_columns", detail: missing.join(",") }],
    };
  }

  const trades: NormalizedTrade[] = [];
  const issues: ParseIssue[] = [];
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    const executedAt = parseDate(cell(row, columns, "date"));
    const symbol = String(cell(row, columns, "symbol") ?? "").trim().toUpperCase();
    const sideText = normalizeHeader(String(cell(row, columns, "side") ?? ""));
    const side = sideText.includes("mua") || sideText === "buy" ? "BUY" : sideText.includes("ban") || sideText === "sell" ? "SELL" : null;
    const quantity = numberFrom(cell(row, columns, "quantity"));
    const price = numberFrom(cell(row, columns, "price"));

    if (!executedAt || !symbol || !side || quantity <= 0 || price < 0) {
      issues.push({ row: index + 1, code: "invalid_trade", detail: "Invalid date, symbol, side, quantity or price" });
      continue;
    }

    const exchangeText = String(cell(row, columns, "exchange") ?? "UNKNOWN").trim().toUpperCase();
    const exchange = ["HOSE", "HNX", "UPCOM"].includes(exchangeText)
      ? (exchangeText as "HOSE" | "HNX" | "UPCOM")
      : "UNKNOWN";
    const externalId = String(cell(row, columns, "id") ?? `vndirect-${index}`).trim();

    trades.push({
      externalId,
      broker: "vndirect",
      symbol,
      exchange,
      side,
      executedAt,
      quantity,
      price,
      fee: Math.max(0, numberFrom(cell(row, columns, "fee"))),
      tax: Math.max(0, numberFrom(cell(row, columns, "tax"))),
      currency: "VND",
    });
  }

  return { trades, issues };
}
