"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  findHeaderRowIndex,
  parseBrokerStatement,
  parseCsvText,
  SAMPLE_STATEMENTS,
  type BrokerType,
  type Field,
  type ParseResult,
} from "@tradecheck/parsers";
import type { NormalizedTrade } from "@tradecheck/contracts";
import { analyzeExecutions } from "@tradecheck/trading-core";

const requiredFields: Array<{ field: Field; label: string }> = [
  { field: "date", label: "Ngày / giờ khớp" },
  { field: "symbol", label: "Mã giao dịch" },
  { field: "side", label: "Mua / Bán" },
  { field: "quantity", label: "Khối lượng" },
  { field: "price", label: "Giá khớp" },
];

function money(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function number(value: number, digits = 2) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits }).format(value);
}

function duration(ms: number) {
  const hours = ms / 3_600_000;
  if (hours < 24) return `${number(hours, 1)} giờ`;
  return `${number(hours / 24, 1)} ngày`;
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <small>{hint}</small> : null}
    </article>
  );
}

export default function Page() {
  const [executions, setExecutions] = useState<NormalizedTrade[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Partial<Record<Field, number>>>({});
  const [filename, setFilename] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const analysis = useMemo(() => analyzeExecutions(executions), [executions]);
  const metrics = analysis.metrics;
  const totalCosts = executions.reduce((sum, item) => sum + item.fee + item.tax, 0);

  function prepareRows(nextRows: string[][], nextFilename: string, broker?: BrokerType) {
    setRows(nextRows);
    setFilename(nextFilename);
    setMapping({});
    const result = parseBrokerStatement(nextRows, broker ? { broker } : {});
    setParsed(result);
  }

  function loadSample(broker: BrokerType) {
    const sample = SAMPLE_STATEMENTS[broker];
    prepareRows(parseCsvText(sample.csv), sample.filename, broker);
    setImportOpen(true);
  }

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["csv", "txt", "tsv"].includes(extension)) {
      setNotice("Hiện bản build này nhận CSV/TSV/TXT. File XLSX sẽ được thêm ở connector tiếp theo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const nextRows = parseCsvText(text);
      prepareRows(nextRows, file.name);
      setImportOpen(true);
    };
    reader.readAsText(file, "UTF-8");
  }

  function applyMapping() {
    if (!rows.length) return;
    const headerIndex = findHeaderRowIndex(rows);
    const result = parseBrokerStatement(rows.slice(headerIndex), { customMapping: mapping });
    setParsed(result);
  }

  function confirmImport() {
    if (!parsed?.trades.length) return;
    setExecutions((current) => [...current, ...parsed.trades]);
    setNotice(`Đã nhập ${parsed.trades.length} executions từ ${parsed.broker.toUpperCase()}. Engine sẽ tự loại bản ghi trùng.`);
    setImportOpen(false);
    setParsed(null);
    setRows([]);
    setMapping({});
    if (inputRef.current) inputRef.current.value = "";
  }

  const needsMapping = Boolean(parsed?.unmappedColumns?.length);

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <div className="brand">TRADERCHECK</div>
          <p>Trading Performance Intelligence</p>
        </div>
        <div className="actions">
          <button className="ghost" onClick={() => loadSample("generic")}>Dùng dữ liệu mẫu</button>
          <button className="primary" onClick={() => inputRef.current?.click()}>Nhập lịch sử giao dịch</button>
          <input ref={inputRef} hidden type="file" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values" onChange={handleFile} />
        </div>
      </header>

      {notice ? (
        <div className="notice">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)}>×</button>
        </div>
      ) : null}

      {executions.length === 0 ? (
        <section className="hero">
          <div className="eyebrow">FREE CORE · KHÔNG CẦN KẾT NỐI TÀI KHOẢN BROKER</div>
          <h1>Đưa lịch sử giao dịch vào.<br />Biết chính xác bạn đang kiếm và mất tiền như thế nào.</h1>
          <p>
            TraderCheck chuẩn hóa file từ nhiều nguồn về một schema chung, reconstruct vị thế theo FIFO,
            sau đó tính P&L, win rate, expectancy, profit factor và drawdown bằng code deterministic.
          </p>
          <div className="heroActions">
            <button className="primary large" onClick={() => inputRef.current?.click()}>Phân tích file CSV miễn phí</button>
            <button className="ghost large" onClick={() => loadSample("ssi")}>Thử mẫu SSI</button>
          </div>
          <div className="steps">
            <div><b>01</b><span>Upload</span><small>CSV/TSV từ broker hoặc file tự tạo</small></div>
            <div><b>02</b><span>Normalize</span><small>Tự nhận diện cột hoặc map thủ công</small></div>
            <div><b>03</b><span>Reconstruct</span><small>Ghép fills thành closed/open positions</small></div>
            <div><b>04</b><span>Understand</span><small>Analytics từ dữ liệu thật của bạn</small></div>
          </div>
        </section>
      ) : (
        <>
          <section className="summaryHeader">
            <div>
              <div className="eyebrow">PERFORMANCE OVERVIEW</div>
              <h1>Hiệu suất giao dịch của bạn</h1>
              <p>{executions.length} executions · {metrics.closedTrades} closed trades · {analysis.openPositions.length} open positions</p>
            </div>
            <button className="primary" onClick={() => inputRef.current?.click()}>＋ Nhập thêm dữ liệu</button>
          </section>

          <section className="metrics">
            <Metric label="NET P&L" value={money(metrics.netPnl)} hint={`Sau ${money(totalCosts)} phí & thuế`} />
            <Metric label="WIN RATE" value={`${number(metrics.winRate)}%`} hint={`${metrics.winners} thắng · ${metrics.losers} thua`} />
            <Metric label="PROFIT FACTOR" value={metrics.profitFactor === null ? "∞" : number(metrics.profitFactor)} hint="Gross profit / |gross loss|" />
            <Metric label="EXPECTANCY / TRADE" value={money(metrics.expectancy)} hint="Giá trị kỳ vọng mỗi closed trade" />
            <Metric label="MAX DRAWDOWN" value={money(metrics.maxDrawdown)} hint={`${number(metrics.maxDrawdownPct)}% theo realized equity`} />
            <Metric label="AVG HOLDING" value={duration(metrics.averageHoldingMs)} hint="Thời gian giữ lệnh trung bình" />
          </section>

          <section className="grid two">
            <article className="panel">
              <div className="panelTitle">
                <div><span>REALIZED EQUITY</span><h2>Đường cong hiệu suất</h2></div>
                <strong>{money(metrics.netPnl)}</strong>
              </div>
              {metrics.equityCurve.length ? (
                <div className="equityList">
                  {metrics.equityCurve.slice(-12).map((point, index) => (
                    <div className="equityRow" key={`${point.at}-${index}`}>
                      <time>{new Date(point.at).toLocaleDateString("vi-VN")}</time>
                      <div className="track"><i style={{ width: `${Math.max(3, Math.min(100, 50 + (point.equity / Math.max(Math.abs(metrics.netPnl), 1)) * 45))}%` }} /></div>
                      <b className={point.equity >= 0 ? "pos" : "neg"}>{money(point.equity)}</b>
                    </div>
                  ))}
                </div>
              ) : <div className="empty">Chưa có vị thế nào được đóng. Import thêm cả lệnh mua và bán để engine reconstruct P&L.</div>}
            </article>

            <article className="panel">
              <div className="panelTitle"><div><span>WHAT MATTERS</span><h2>Điểm nổi bật</h2></div></div>
              <div className="insights">
                <div><span>Giao dịch tốt nhất</span><b className="pos">{metrics.bestTrade ? `${metrics.bestTrade.symbol} · ${money(metrics.bestTrade.netPnl)}` : "—"}</b></div>
                <div><span>Giao dịch tệ nhất</span><b className="neg">{metrics.worstTrade ? `${metrics.worstTrade.symbol} · ${money(metrics.worstTrade.netPnl)}` : "—"}</b></div>
                <div><span>Lãi trung bình</span><b>{money(metrics.averageWin)}</b></div>
                <div><span>Lỗ trung bình</span><b>{money(metrics.averageLoss)}</b></div>
                <div><span>Executions trùng bị bỏ</span><b>{analysis.ignoredDuplicateExecutionIds.length}</b></div>
              </div>
              <div className="aiPlaceholder">
                <span>AI REVIEW · NEXT MODULE</span>
                <p>AI sẽ chỉ giải thích metrics và patterns đã được engine tính sẵn; không tự tính tiền và không có quyền đặt lệnh.</p>
              </div>
            </article>
          </section>

          <section className="grid two">
            <article className="panel">
              <div className="panelTitle"><div><span>OPEN BOOK</span><h2>Vị thế đang mở</h2></div><strong>{analysis.openPositions.length}</strong></div>
              <div className="tableWrap">
                <table>
                  <thead><tr><th>Mã</th><th>Hướng</th><th>KL</th><th>Giá vốn</th><th>Mở từ</th></tr></thead>
                  <tbody>
                    {analysis.openPositions.length ? analysis.openPositions.map((position) => (
                      <tr key={`${position.symbol}-${position.direction}-${position.openedAt}`}>
                        <td><b>{position.symbol}</b><small>{position.broker.toUpperCase()}</small></td>
                        <td>{position.direction}</td>
                        <td>{number(position.quantity, 4)}</td>
                        <td>{money(position.averagePrice)}</td>
                        <td>{new Date(position.openedAt).toLocaleString("vi-VN")}</td>
                      </tr>
                    )) : <tr><td colSpan={5} className="emptyCell">Không có vị thế mở.</td></tr>}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="panel">
              <div className="panelTitle"><div><span>JOURNAL CORE</span><h2>Closed trades</h2></div><strong>{analysis.closedTrades.length}</strong></div>
              <div className="tableWrap">
                <table>
                  <thead><tr><th>Mã</th><th>Hướng</th><th>KL</th><th>Entry → Exit</th><th>Net P&L</th></tr></thead>
                  <tbody>
                    {analysis.closedTrades.length ? [...analysis.closedTrades].reverse().slice(0, 20).map((trade) => (
                      <tr key={trade.id}>
                        <td><b>{trade.symbol}</b><small>{new Date(trade.closedAt).toLocaleDateString("vi-VN")}</small></td>
                        <td>{trade.direction}</td>
                        <td>{number(trade.quantity, 4)}</td>
                        <td>{money(trade.entryPrice)} → {money(trade.exitPrice)}</td>
                        <td className={trade.netPnl >= 0 ? "pos" : "neg"}><b>{money(trade.netPnl)}</b></td>
                      </tr>
                    )) : <tr><td colSpan={5} className="emptyCell">Chưa có closed trade.</td></tr>}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        </>
      )}

      {importOpen ? (
        <div className="modalBackdrop" onMouseDown={(event) => event.target === event.currentTarget && setImportOpen(false)}>
          <section className="modal">
            <header>
              <div><span>SMART IMPORT</span><h2>Kiểm tra dữ liệu trước khi nhập</h2><p>{filename || "Dữ liệu mẫu"}</p></div>
              <button className="close" onClick={() => setImportOpen(false)}>×</button>
            </header>

            <div className="brokerSamples">
              {(Object.keys(SAMPLE_STATEMENTS) as BrokerType[]).map((broker) => (
                <button key={broker} onClick={() => loadSample(broker)}>{broker.toUpperCase()}</button>
              ))}
            </div>

            {parsed ? (
              <>
                <div className="importStats">
                  <div><span>Broker nhận diện</span><b>{parsed.broker.toUpperCase()}</b></div>
                  <div><span>Executions hợp lệ</span><b>{parsed.trades.length}</b></div>
                  <div><span>Cảnh báo</span><b>{parsed.issues.length}</b></div>
                </div>

                {needsMapping ? (
                  <div className="mapping">
                    <h3>File này chưa khớp schema. Xác nhận các cột:</h3>
                    {requiredFields.map(({ field, label }) => (
                      <label key={field}>
                        <span>{label}</span>
                        <select value={mapping[field] ?? ""} onChange={(event) => setMapping((current) => ({ ...current, [field]: Number(event.target.value) }))}>
                          <option value="">-- Chọn cột --</option>
                          {(parsed.rawHeaders ?? rows[findHeaderRowIndex(rows)] ?? []).map((header, index) => <option key={`${header}-${index}`} value={index}>{header || `Cột ${index + 1}`}</option>)}
                        </select>
                      </label>
                    ))}
                    <button className="ghost" onClick={applyMapping}>Áp dụng mapping</button>
                  </div>
                ) : null}

                {parsed.issues.length ? (
                  <div className="issues">{parsed.issues.slice(0, 5).map((issue, index) => <p key={`${issue.row}-${index}`}>⚠ {issue.detail}</p>)}</div>
                ) : null}

                <div className="preview">
                  <table>
                    <thead><tr><th>Thời gian</th><th>Mã</th><th>Side</th><th>KL</th><th>Giá</th><th>Phí + thuế</th></tr></thead>
                    <tbody>{parsed.trades.slice(0, 8).map((trade) => (
                      <tr key={`${trade.broker}-${trade.externalId}`}>
                        <td>{new Date(trade.executedAt).toLocaleString("vi-VN")}</td>
                        <td><b>{trade.symbol}</b></td>
                        <td>{trade.side}</td>
                        <td>{number(trade.quantity, 4)}</td>
                        <td>{money(trade.price)}</td>
                        <td>{money(trade.fee + trade.tax)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>

                <footer>
                  <p>File được parse trong trình duyệt ở flow hiện tại. Hãy kiểm tra preview trước khi xác nhận.</p>
                  <div><button className="ghost" onClick={() => setImportOpen(false)}>Hủy</button><button className="primary" disabled={!parsed.trades.length || needsMapping} onClick={confirmImport}>Nhập & phân tích</button></div>
                </footer>
              </>
            ) : <div className="empty">Không có dữ liệu để preview.</div>}
          </section>
        </div>
      ) : null}
    </main>
  );
}
