import { describe, expect, it } from "vitest";
import {
  parseBrokerStatement,
  parseCsvText,
  parseVnDirectRows,
  SAMPLE_STATEMENTS,
} from "./index.js";

describe("parseCsvText", () => {
  it("correctly parses CSV text with commas and quoted values", () => {
    const csv = 'Header 1,"Header, 2",Header 3\nVal 1,"Val, 2",Val 3\n';
    const rows = parseCsvText(csv);
    expect(rows).toEqual([
      ["Header 1", "Header, 2", "Header 3"],
      ["Val 1", "Val, 2", "Val 3"],
    ]);
  });
});

describe("parseBrokerStatement", () => {
  it("parses built-in VNDIRECT sample statement", () => {
    const rows = parseCsvText(SAMPLE_STATEMENTS.vndirect.csv);
    const result = parseBrokerStatement(rows);
    expect(result.broker).toBe("vndirect");
    expect(result.issues).toEqual([]);
    expect(result.trades.length).toBe(6);
    expect(result.trades[0]).toMatchObject({
      symbol: "FPT",
      side: "BUY",
      quantity: 1500,
      price: 128500,
      fee: 289125,
      tax: 0,
      currency: "VND",
    });
  });

  it("parses SSI statement with account header metadata", () => {
    const rows = parseCsvText(SAMPLE_STATEMENTS.ssi.csv);
    const result = parseBrokerStatement(rows);
    expect(result.broker).toBe("ssi");
    expect(result.issues).toEqual([]);
    expect(result.trades.length).toBe(5);
    expect(result.trades[0]).toMatchObject({
      symbol: "FPT",
      side: "SELL",
      quantity: 1000,
      price: 132000,
      fee: 198000,
      tax: 132000,
    });
  });

  it("parses VPS SmartOne statement", () => {
    const rows = parseCsvText(SAMPLE_STATEMENTS.vps.csv);
    const result = parseBrokerStatement(rows);
    expect(result.broker).toBe("vps");
    expect(result.issues).toEqual([]);
    expect(result.trades.length).toBe(5);
    expect(result.trades[0]).toMatchObject({
      symbol: "HPG",
      side: "SELL",
      quantity: 5000,
      price: 30500,
    });
  });

  it("parses TCBS statement with English/Bilingual columns", () => {
    const rows = parseCsvText(SAMPLE_STATEMENTS.tcbs.csv);
    const result = parseBrokerStatement(rows);
    expect(result.broker).toBe("tcbs");
    expect(result.issues).toEqual([]);
    expect(result.trades.length).toBe(5);
    expect(result.trades[0]).toMatchObject({
      symbol: "TCB",
      side: "BUY",
      quantity: 5000,
      price: 24800,
    });
  });

  it("supports smart custom column mapping", () => {
    const customRows = [
      ["ColA", "ColB", "ColC", "ColD", "ColE"],
      ["25/08/2026 10:00", "FPT", "Mua", "1000", "125000"],
    ];
    const result = parseBrokerStatement(customRows, {
      customMapping: {
        date: 0,
        symbol: 1,
        side: 2,
        quantity: 3,
        price: 4,
      },
    });

    expect(result.issues).toEqual([]);
    expect(result.trades.length).toBe(1);
    expect(result.trades[0]).toMatchObject({
      symbol: "FPT",
      side: "BUY",
      quantity: 1000,
      price: 125000,
      fee: 187500, // auto computed 0.15%
      tax: 0,
    });
  });

  it("fails closed when required columns are missing and returns unmappedColumns", () => {
    const badRows = [
      ["Mã chứng khoán", "Ghi chú"],
      ["FPT", "Thử nghiệm"],
    ];
    const result = parseBrokerStatement(badRows);
    expect(result.trades).toEqual([]);
    expect(result.unmappedColumns).toContain("date");
    expect(result.unmappedColumns).toContain("side");
    expect(result.unmappedColumns).toContain("quantity");
    expect(result.unmappedColumns).toContain("price");
  });
});

describe("parseVnDirectRows", () => {
  it("maintains backward compatibility", () => {
    const result = parseVnDirectRows([
      ["Số hiệu lệnh", "Ngày khớp", "Mã chứng khoán", "Mua/Bán", "Khối lượng khớp", "Giá khớp", "Phí", "Thuế", "Sàn"],
      ["A1", "23/08/2026 09:15:00", "FPT", "Mua", "1.000", "120.000", "180.000", "0", "HOSE"],
    ]);

    expect(result.issues).toEqual([]);
    expect(result.trades[0]).toMatchObject({
      externalId: "A1",
      symbol: "FPT",
      side: "BUY",
      quantity: 1000,
      price: 120000,
      fee: 180000,
      currency: "VND",
    });
  });
});

