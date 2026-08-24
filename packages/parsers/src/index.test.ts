import { describe, expect, it } from "vitest";
import { parseVnDirectRows } from "./index.js";

describe("parseVnDirectRows", () => {
  it("normalizes a synthetic Vietnamese statement", () => {
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

  it("fails closed when required columns are missing", () => {
    const result = parseVnDirectRows([["Mã chứng khoán"], ["FPT"]]);
    expect(result.trades).toEqual([]);
    expect(result.issues[0]?.code).toBe("missing_columns");
  });
});
