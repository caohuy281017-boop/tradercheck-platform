import type { NormalizedTrade } from "@tradecheck/contracts";

export type BrokerType = "vndirect" | "ssi" | "vps" | "tcbs" | "generic";

export interface ParseIssue {
  row: number;
  code: string;
  detail: string;
}

export interface ParseResult {
  broker: BrokerType;
  trades: NormalizedTrade[];
  issues: ParseIssue[];
  rawHeaders?: string[];
  unmappedColumns?: string[];
}

export interface ColumnMapping {
  id?: number;
  date?: number;
  symbol?: number;
  side?: number;
  quantity?: number;
  price?: number;
  fee?: number;
  tax?: number;
  exchange?: number;
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

export const BROKER_ALIASES = {
  id: [
    "so hieu lenh",
    "ma lenh",
    "order id",
    "so lenh",
    "ma gd",
    "ref no",
    "id",
    "order no",
    "order number",
    "ma dat lenh",
  ],
  date: [
    "ngay khop",
    "thoi gian khop",
    "ngay giao dich",
    "ngay gd",
    "date",
    "time",
    "matched date",
    "thoi gian",
    "ngay",
    "trans date",
    "ngay gio",
    "matched time",
  ],
  symbol: [
    "ma chung khoan",
    "ma ck",
    "symbol",
    "ma cp",
    "ticker",
    "ma",
    "chung khoan",
    "stock",
    "sec code",
  ],
  side: [
    "mua ban",
    "loai lenh",
    "side",
    "chieu",
    "lenh",
    "action",
    "type",
    "loai gd",
    "mua b",
    "b m",
    "buy sell",
  ],
  quantity: [
    "khoi luong khop",
    "khoi luong",
    "quantity",
    "kl khop",
    "so luong",
    "kl",
    "volume",
    "matched qty",
    "matched volume",
    "qty",
    "sl",
  ],
  price: [
    "gia khop",
    "gia",
    "price",
    "gia dat",
    "don gia",
    "gia khop tb",
    "avg price",
    "matched price",
    "match price",
  ],
  fee: [
    "phi giao dich",
    "phi",
    "fee",
    "phi thuc thu",
    "phi tam tinh",
    "trading fee",
    "broker fee",
    "phi moi gioi",
  ],
  tax: [
    "thue",
    "tax",
    "thue tncn",
    "thue ban",
    "income tax",
    "pit",
  ],
  exchange: [
    "san",
    "san giao dich",
    "exchange",
    "san gd",
    "market",
    "san niem yet",
  ],
} as const;

export type Field = keyof typeof BROKER_ALIASES;

export function resolveColumns(headers: string[]): Partial<Record<Field, number>> {
  const normalized = headers.map(normalizeHeader);
  const columns: Partial<Record<Field, number>> = {};
  for (const [field, candidates] of Object.entries(BROKER_ALIASES) as [Field, readonly string[]][]) {
    const index = normalized.findIndex((header) => candidates.includes(header));
    if (index >= 0) columns[field] = index;
  }
  return columns;
}

export function numberFrom(value: unknown): number {
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

export function parseDate(value: unknown): string | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  const text = String(value ?? "").trim();
  if (!text) return null;

  // Format: DD/MM/YYYY or DD-MM-YYYY with optional HH:mm:ss
  const matchDmy = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (matchDmy) {
    const [, day, month, year, hour = "0", minute = "0", second = "0"] = matchDmy;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour) - 7, Number(minute), Number(second)));
    return Number.isFinite(date.getTime()) ? date.toISOString() : null;
  }

  // Format: YYYY-MM-DD with optional HH:mm:ss
  const matchYmd = text.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (matchYmd) {
    const [, year, month, day, hour = "0", minute = "0", second = "0"] = matchYmd;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour) - 7, Number(minute), Number(second)));
    return Number.isFinite(date.getTime()) ? date.toISOString() : null;
  }

  const direct = new Date(text);
  return Number.isFinite(direct.getTime()) ? direct.toISOString() : null;
}

/**
 * Fast & safe CSV string parser that handles quoted strings and commas
 */
export function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === "," || char === "\t" || char === ";") && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++; // skip newline pair
      }
      currentRow.push(currentField.trim());
      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Finds the index of the row containing the column headers
 */
export function findHeaderRowIndex(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i] ?? [];
    const normalized = row.map((val) => normalizeHeader(String(val ?? "")));
    const hasSymbol = normalized.some((h) => (BROKER_ALIASES.symbol as readonly string[]).includes(h));
    const hasSide = normalized.some((h) => (BROKER_ALIASES.side as readonly string[]).includes(h));
    const hasQuantity = normalized.some((h) => (BROKER_ALIASES.quantity as readonly string[]).includes(h));
    const hasPrice = normalized.some((h) => (BROKER_ALIASES.price as readonly string[]).includes(h));

    if ((hasSymbol && hasSide) || (hasSymbol && hasQuantity) || (hasQuantity && hasPrice)) {
      return i;
    }
  }
  return 0;
}

/**
 * Detects broker from raw text or headers
 */
export function detectBroker(rows: unknown[][]): BrokerType {
  const headerIdx = findHeaderRowIndex(rows);
  const metadataText = rows
    .slice(0, Math.max(headerIdx + 1, 3))
    .map((r) => r.join(" "))
    .join(" ")
    .toLowerCase();

  if (metadataText.includes("iboard") || metadataText.includes("chứng khoán ssi") || metadataText.includes("chung khoan ssi") || metadataText.includes("ctcp ck ssi")) {
    return "ssi";
  }
  if (metadataText.includes("smartone") || metadataText.includes("vps") || metadataText.includes("chứng khoán vps")) {
    return "vps";
  }
  if (metadataText.includes("dstock") || metadataText.includes("vndirect") || metadataText.includes("chứng khoán vndirect")) {
    return "vndirect";
  }
  if (metadataText.includes("tcinvest") || metadataText.includes("tcbs") || metadataText.includes("kỹ thương") || metadataText.includes("ky thuong")) {
    return "tcbs";
  }

  // Check ID prefix in data rows if any
  const firstDataRow = rows[headerIdx + 1] ?? [];
  const rowStr = firstDataRow.join(" ").toLowerCase();
  if (rowStr.includes("vnd-")) return "vndirect";
  if (rowStr.includes("ssi-")) return "ssi";
  if (rowStr.includes("vps-")) return "vps";
  if (rowStr.includes("tcbs-")) return "tcbs";

  return "generic";
}

/**
 * Main flexible broker statement parser
 */
export function parseBrokerStatement(
  rows: unknown[][],
  options: {
    broker?: BrokerType;
    customMapping?: Partial<Record<Field, number>>;
  } = {},
): ParseResult {
  if (rows.length < 2) {
    return {
      broker: options.broker ?? "generic",
      trades: [],
      issues: [{ row: 0, code: "empty_file", detail: "Tập tin không có dữ liệu giao dịch." }],
    };
  }

  const detectedBroker = options.broker ?? detectBroker(rows);
  const headerIndex = options.customMapping ? 0 : findHeaderRowIndex(rows);
  const headerRow = rows[headerIndex] ?? [];
  const rawHeaders = headerRow.map((value) => String(value ?? "").trim());

  const columns: Partial<Record<Field, number>> = options.customMapping ?? resolveColumns(rawHeaders);

  const required: Field[] = ["date", "symbol", "side", "quantity", "price"];
  const missing = required.filter((field) => columns[field] === undefined);

  if (missing.length > 0) {
    return {
      broker: detectedBroker,
      trades: [],
      rawHeaders,
      unmappedColumns: missing,
      issues: [
        {
          row: headerIndex + 1,
          code: "missing_columns",
          detail: `Thiếu các cột bắt buộc: ${missing.join(", ")}`,
        },
      ],
    };
  }

  const trades: NormalizedTrade[] = [];
  const issues: ParseIssue[] = [];

  for (let index = headerIndex + 1; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    if (row.length === 0 || row.every((c) => String(c ?? "").trim() === "")) continue;

    const rawDate = cell(row, columns, "date");
    const executedAt = parseDate(rawDate);
    const symbol = String(cell(row, columns, "symbol") ?? "").trim().toUpperCase();
    const sideText = normalizeHeader(String(cell(row, columns, "side") ?? ""));
    const isBuy = sideText.includes("mua") || sideText === "buy" || sideText === "b" || sideText === "m";
    const isSell = sideText.includes("ban") || sideText === "sell" || sideText === "s";
    const side = isBuy ? "BUY" : isSell ? "SELL" : null;
    const quantity = numberFrom(cell(row, columns, "quantity"));
    const price = numberFrom(cell(row, columns, "price"));

    if (!executedAt || !symbol || !side || quantity <= 0 || price <= 0) {
      // If it's a summary or footer row, skip gracefully without breaking
      if (symbol.includes("TONG") || symbol.includes("TOTAL") || symbol === "") {
        continue;
      }
      issues.push({
        row: index + 1,
        code: "invalid_trade",
        detail: `Dòng ${index + 1}: Ngày, Mã CK, Chiều, Khối lượng hoặc Giá không hợp lệ.`,
      });
      continue;
    }

    const exchangeRaw = String(cell(row, columns, "exchange") ?? "HOSE").trim().toUpperCase();
    const exchange = ["HOSE", "HNX", "UPCOM"].includes(exchangeRaw)
      ? (exchangeRaw as "HOSE" | "HNX" | "UPCOM")
      : "HOSE";

    const externalId = String(cell(row, columns, "id") ?? `${detectedBroker}-${index}`).trim();

    // Calculate auto fee/tax if not explicitly provided
    const tradeValue = quantity * price;
    let fee = Math.max(0, numberFrom(cell(row, columns, "fee")));
    let tax = Math.max(0, numberFrom(cell(row, columns, "tax")));

    // Standard VN fee ~0.15% if 0, tax 0.1% for SELL if 0
    if (fee === 0) fee = Math.round(tradeValue * 0.0015);
    if (tax === 0 && side === "SELL") tax = Math.round(tradeValue * 0.001);

    trades.push({
      externalId,
      broker: detectedBroker,
      symbol,
      exchange,
      side,
      executedAt,
      quantity,
      price,
      fee,
      tax,
      currency: "VND",
    });
  }

  return {
    broker: detectedBroker,
    trades,
    issues,
    rawHeaders,
  };
}

/**
 * Backward-compatible wrapper for VNDIRECT
 */
export function parseVnDirectRows(rows: unknown[][]): ParseResult {
  return parseBrokerStatement(rows, { broker: "vndirect" });
}

/**
 * Built-in Sample Datasets for 1-Click Demo / Testing
 */
export const SAMPLE_STATEMENTS: Record<BrokerType, { name: string; filename: string; csv: string }> = {
  vndirect: {
    name: "VNDIRECT (Dstock)",
    filename: "vndirect_statement_sample.csv",
    csv: `Số hiệu lệnh,Ngày khớp,Mã chứng khoán,Mua/Bán,Khối lượng khớp,Giá khớp,Phí,Thuế,Sàn
VND-001,25/08/2026 09:30:15,FPT,Mua,1500,128500,289125,0,HOSE
VND-002,24/08/2026 14:22:10,MWG,Bán,2000,68400,205200,136800,HOSE
VND-003,22/08/2026 09:30:00,HPG,Mua,5000,29800,223500,0,HOSE
VND-004,20/08/2026 11:10:45,SSI,Bán,3000,34200,153900,102600,HOSE
VND-005,18/08/2026 13:45:20,VNM,Bán,1000,67500,101250,67500,HOSE
VND-006,15/08/2026 10:05:30,TCB,Mua,4000,24500,147000,0,HOSE`,
  },
  ssi: {
    name: "SSI (iBoard)",
    filename: "ssi_iboard_export_sample.csv",
    csv: `CÔNG TY CỔ PHẦN CHỨNG KHOÁN SSI - BÁO CÁO LỊCH SỬ KHỚP LỆNH
Số tài khoản: 003C982188 - Khách hàng: NGUYEN VAN A
Từ ngày: 01/08/2026 Đến ngày: 25/08/2026
Mã lệnh,Thời gian khớp,Mã CK,Loại lệnh,KL khớp,Giá khớp TB,Phí GD,Thuế,Sàn GD
SSI-8821,25/08/2026 10:15:00,FPT,Bán,1000,132000,198000,132000,HOSE
SSI-8820,23/08/2026 13:45:00,SSI,Mua,2000,33800,101400,0,HOSE
SSI-8819,20/08/2026 09:40:00,MWG,Mua,1500,66500,149625,0,HOSE
SSI-8818,18/08/2026 14:10:00,MBB,Bán,3000,25200,113400,75600,HOSE
SSI-8817,15/08/2026 10:25:00,VHM,Mua,1000,42500,63750,0,HOSE`,
  },
  vps: {
    name: "VPS (SmartOne)",
    filename: "vps_smartone_trades_sample.csv",
    csv: `Mã GD,Ngày GD,Mã CP,Lệnh,Khối lượng,Giá,Phí môi giới,Thuế TNCN,Sàn
VPS-9012,25/08/2026 09:20:00,HPG,Bán,5000,30500,228750,152500,HOSE
VPS-9011,22/08/2026 11:15:00,FPT,Mua,1000,126000,189000,0,HOSE
VPS-9010,19/08/2026 14:30:00,MWG,Bán,2000,69000,207000,138000,HOSE
VPS-9009,16/08/2026 10:05:00,VND,Mua,4000,18500,111000,0,HOSE
VPS-9008,12/08/2026 09:50:00,STB,Bán,2500,31200,117000,78000,HOSE`,
  },
  tcbs: {
    name: "TCBS (TCInvest)",
    filename: "tcbs_tcinvest_statement_sample.csv",
    csv: `Order ID,Matched Time,Ticker,Side,Matched Volume,Matched Price,Fee,Tax,Exchange
TCBS-771,2026-08-25 10:00:00,TCB,BUY,5000,24800,186000,0,HOSE
TCBS-772,2026-08-23 14:15:00,MSN,BUY,1000,74500,111750,0,HOSE
TCBS-773,2026-08-20 11:30:00,FPT,SELL,1000,131500,197250,131500,HOSE
TCBS-774,2026-08-17 09:45:00,HPG,SELL,3000,30200,135900,90600,HOSE
TCBS-775,2026-08-14 13:20:00,VPB,BUY,4000,19200,115200,0,HOSE`,
  },
  generic: {
    name: "Mẫu Bảng Tính Tự Tạo (CSV)",
    filename: "custom_trade_sheet.csv",
    csv: `Ngày,Mã,Chiều,Số lượng,Đơn giá,Phí,Thuế
25/08/2026 09:15:00,FPT,Mua,1000,128000,192000,0
23/08/2026 14:00:00,MWG,Bán,1500,68000,153000,102000
20/08/2026 10:30:00,HPG,Mua,3000,29500,132750,0
18/08/2026 11:20:00,SSI,Bán,2000,34500,103500,69000`,
  },
};

