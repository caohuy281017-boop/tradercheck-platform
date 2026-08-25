"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  parseBrokerStatement,
  parseCsvText,
  SAMPLE_STATEMENTS,
  type BrokerType,
  type Field,
  type ParseResult,
} from "@tradecheck/parsers";

interface TradeRecord {
  id: string;
  date: string;
  symbol: string;
  exchange: "HOSE" | "HNX" | "UPCOM";
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  fee: number;
  tax: number;
  netPnl?: number | undefined;
  status: "MATCHED" | "SETTLED";
}

interface ChartPoint {
  date: string;
  value: number;
  drawdown: number;
  change: string;
  event?: string;
}

const sampleTrades: TradeRecord[] = [
  { id: "VN-89214", date: "25/08/2026 10:15", symbol: "FPT", exchange: "HOSE", side: "SELL", quantity: 1500, price: 128500, fee: 289125, tax: 192750, netPnl: 8450000, status: "SETTLED" },
  { id: "VN-89201", date: "24/08/2026 14:22", symbol: "MWG", exchange: "HOSE", side: "SELL", quantity: 2000, price: 68400, fee: 205200, tax: 136800, netPnl: 5200000, status: "SETTLED" },
  { id: "VN-89188", date: "22/08/2026 09:30", symbol: "HPG", exchange: "HOSE", side: "BUY", quantity: 5000, price: 29800, fee: 223500, tax: 0, status: "MATCHED" },
  { id: "VN-89170", date: "20/08/2026 11:10", symbol: "SSI", exchange: "HOSE", side: "SELL", quantity: 3000, price: 34200, fee: 153900, tax: 102600, netPnl: 2600000, status: "SETTLED" },
  { id: "VN-89155", date: "18/08/2026 13:45", symbol: "VNM", exchange: "HOSE", side: "SELL", quantity: 1000, price: 67500, fee: 101250, tax: 67500, netPnl: -950000, status: "SETTLED" },
  { id: "VN-89120", date: "15/08/2026 10:05", symbol: "FPT", exchange: "HOSE", side: "BUY", quantity: 2000, price: 122800, fee: 368400, tax: 0, status: "MATCHED" },
  { id: "VN-89098", date: "12/08/2026 14:00", symbol: "TCB", exchange: "HOSE", side: "SELL", quantity: 2500, price: 24500, fee: 91875, tax: 61250, netPnl: 3120000, status: "SETTLED" },
];

const chartData90D: ChartPoint[] = [
  { date: "01/06", value: 100000000, drawdown: 0, change: "+0 ₫" },
  { date: "15/06", value: 104200000, drawdown: 0, change: "+4.200.000 ₫", event: "Chốt lời FPT +4.2M" },
  { date: "30/06", value: 102800000, drawdown: -1.34, change: "-1.400.000 ₫", event: "Cắt lỗ VNM -1.4M" },
  { date: "15/07", value: 109500000, drawdown: 0, change: "+6.700.000 ₫", event: "Sóng Bán lẻ MWG +6.7M" },
  { date: "31/07", value: 107200000, drawdown: -2.1, change: "-2.300.000 ₫", event: "Phí & Thuế tháng 7" },
  { date: "10/08", value: 112400000, drawdown: 0, change: "+5.200.000 ₫", event: "Chốt lời TCB +5.2M" },
  { date: "25/08", value: 118420000, drawdown: 0, change: "+6.020.000 ₫", event: "Chốt lời FPT & MWG" },
];

const pipelineNodes = [
  {
    id: "raw_statement",
    step: "BƯỚC 1: NGUỒN DỮ LIỆU",
    title: "Sao kê Broker",
    badge: "VNDIRECT / SSI / VPS / TCBS",
    desc: "File CSV/XLSX trích xuất từ các công ty chứng khoán Việt Nam.",
    security: "Không tải file gốc lên server; bảo vệ 100% danh tính.",
    latency: "< 50ms",
    samplePayload: {
      format: "vndirect_csv_v2",
      checksum: "sha256_e821b...839",
      rowsCount: 64,
      currency: "VND",
    },
  },
  {
    id: "browser_parser",
    step: "BƯỚC 2: CLIENT WORKER",
    title: "Parser Trình Duyệt",
    badge: "@tradecheck/parsers",
    desc: "WebWorker chuẩn hóa tiếng Việt, tách phí môi giới 0.15% và thuế 0.1%.",
    security: "Loại bỏ mã macro, kiểm tra fingerprint chống trùng lặp.",
    latency: "~ 15ms",
    samplePayload: {
      symbol: "FPT",
      exchange: "HOSE",
      side: "BUY",
      quantity: 1000,
      price: 120000,
      fee: 180000,
      tax: 0,
    },
  },
  {
    id: "gateway_policy",
    step: "BƯỚC 3: API GATEWAY",
    title: "Gateway & Policy Engine",
    badge: "Fastify + JWT + Scopes",
    desc: "Kiểm tra quyền actor, rate-limit, gán request ID và ghi audit event.",
    security: "Fail-closed adapter, tự động redact token và headers nhạy cảm.",
    latency: "~ 25ms",
    samplePayload: {
      actorId: "usr_vietnam_pro_01",
      plan: "pro",
      scopes: ["trades.write", "analytics.read"],
      approvalGate: "verified",
    },
  },
  {
    id: "db_ledger",
    step: "BƯỚC 4: POSTGRESQL RLS",
    title: "Audit Ledger & Database",
    badge: "Schema tradecheck (RLS)",
    desc: "Lưu trữ snapshot giao dịch, trade extensions và audit ledger append-only.",
    security: "Row Level Security cô lập hoàn toàn giữa các tenant/user.",
    latency: "~ 12ms",
    samplePayload: {
      table: "tradecheck.trade_extensions",
      rlsContext: "SET LOCAL app.user_id = 'usr_01'",
      auditStatus: "logged",
    },
  },
  {
    id: "ai_coach",
    step: "BƯỚC 5: AI VIBE WORKER",
    title: "AI Habit Coach",
    badge: "Vibe-Trading Container",
    desc: "Phân tích thói quen vào lệnh, phát hiện lỗi tâm lý gồng lỗ/chốt non.",
    security: "Worker cô lập không có database credentials & không quyền đặt lệnh.",
    latency: "Async queue",
    samplePayload: {
      model: "vibe-trading-qwen-72b",
      insightFound: "Early profit exit on trades > 4 days holding",
      confidence: "94.2%",
    },
  },
];

export default function App() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "pipeline" | "journal" | "tools">("overview");
  const [timeframe, setTimeframe] = useState<"1W" | "1M" | "3M" | "6M" | "1Y" | "ALL">("3M");
  const [chartMode, setChartMode] = useState<"equity" | "drawdown">("equity");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<(typeof pipelineNodes)[number]>(pipelineNodes[1]!);
  const [searchSymbol, setSearchSymbol] = useState("");
  const [selectedTrade, setSelectedTrade] = useState<TradeRecord | null>(null);

  // Dynamic trades state initialized with sampleTrades
  const [trades, setTrades] = useState<TradeRecord[]>(sampleTrades);

  // Importer Modal State
  const [importerOpen, setImporterOpen] = useState(false);
  const [activeBrokerSample, setActiveBrokerSample] = useState<BrokerType>("vndirect");
  const [parsedResult, setParsedResult] = useState<ParseResult | null>(null);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [customMapping, setCustomMapping] = useState<Partial<Record<Field, number>>>({});
  const [isMappingMode, setIsMappingMode] = useState(false);
  const [importStatusMsg, setImportStatusMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize theme with document data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Load sample statement by broker
  const loadBrokerSample = (broker: BrokerType) => {
    setActiveBrokerSample(broker);
    const sample = SAMPLE_STATEMENTS[broker];
    if (sample) {
      const rows = parseCsvText(sample.csv);
      setRawRows(rows);
      const result = parseBrokerStatement(rows, { broker });
      setParsedResult(result);
      setIsMappingMode(result.unmappedColumns && result.unmappedColumns.length > 0 ? true : false);
    }
  };

  // Auto load first sample when opening modal
  useEffect(() => {
    if (importerOpen && !parsedResult) {
      loadBrokerSample("vndirect");
    }
  }, [importerOpen]);

  // Handle uploaded file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const rows = parseCsvText(text);
      setRawRows(rows);
      const result = parseBrokerStatement(rows);
      setParsedResult(result);
      if (result.unmappedColumns && result.unmappedColumns.length > 0) {
        setIsMappingMode(true);
      } else {
        setIsMappingMode(false);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  // Apply custom mapping
  const handleApplyCustomMapping = () => {
    if (rawRows.length < 2) return;
    const result = parseBrokerStatement(rawRows, { customMapping });
    setParsedResult(result);
    if (!result.unmappedColumns || result.unmappedColumns.length === 0) {
      setIsMappingMode(false);
    }
  };

  // Approve & add trades to journal
  const handleApproveImport = () => {
    if (!parsedResult || parsedResult.trades.length === 0) return;

    const newRecords: TradeRecord[] = parsedResult.trades.map((t, idx) => {
      const dateObj = new Date(t.executedAt);
      const dateStr = `${String(dateObj.getDate()).padStart(2, "0")}/${String(dateObj.getMonth() + 1).padStart(2, "0")}/${dateObj.getFullYear()} ${String(dateObj.getHours()).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`;

      let netPnl: number | undefined = undefined;
      if (t.side === "SELL") {
        netPnl = Math.round(t.quantity * t.price * 0.05 - t.fee - t.tax);
      }

      return {
        id: t.externalId || `VN-${Date.now()}-${idx}`,
        date: dateStr,
        symbol: t.symbol,
        exchange: t.exchange === "UNKNOWN" ? "HOSE" : t.exchange,
        side: t.side,
        quantity: t.quantity,
        price: t.price,
        fee: t.fee,
        tax: t.tax,
        netPnl,
        status: "SETTLED",
      };
    });

    setTrades((prev) => [...newRecords, ...prev]);
    setImportStatusMsg(`✓ Đã nạp thành công ${newRecords.length} lệnh giao dịch từ ${parsedResult.broker.toUpperCase()}!`);
    setTimeout(() => {
      setImportStatusMsg(null);
      setImporterOpen(false);
    }, 1200);
  };

  // SVG Chart Dimensions
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 25;

  const minVal = chartMode === "equity" ? 98000000 : -3;
  const maxVal = chartMode === "equity" ? 122000000 : 0.5;

  const points = chartData90D.map((item, idx) => {
    const x = paddingX + (idx / (chartData90D.length - 1)) * (svgWidth - paddingX * 2);
    const val = chartMode === "equity" ? item.value : item.drawdown;
    const y = svgHeight - paddingY - ((val - minVal) / (maxVal - minVal)) * (svgHeight - paddingY * 2);
    return { x, y, data: item };
  });

  const pathD = points.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[idx - 1]!;
    const cx1 = prev.x + (pt.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (pt.x - prev.x) / 2;
    const cy2 = pt.y;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1]!.x} ${svgHeight - paddingY} L ${points[0]!.x} ${svgHeight - paddingY} Z`;

  const filteredTrades = trades.filter((t) =>
    searchSymbol ? t.symbol.toLowerCase().includes(searchSymbol.toLowerCase()) : true
  );

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="app-sidebar">
        <div className="brand-section">
          <div className="brand-badge">TC</div>
          <div className="brand-title">
            <span className="brand-name">TradeCheck</span>
            <span className="brand-tag">Trading Intelligence</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <span className="nav-icon">📈</span>
            <span>Tổng quan</span>
          </button>

          <button
            className={`nav-item ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            <span className="nav-icon">📊</span>
            <span>Phân tích P&L</span>
            <span className="nav-count">Live</span>
          </button>

          <button
            className={`nav-item ${activeTab === "pipeline" ? "active" : ""}`}
            onClick={() => setActiveTab("pipeline")}
          >
            <span className="nav-icon">🗺️</span>
            <span>Sơ đồ Pipeline</span>
            <span className="nav-count">5 Nodes</span>
          </button>

          <button
            className={`nav-item ${activeTab === "journal" ? "active" : ""}`}
            onClick={() => setActiveTab("journal")}
          >
            <span className="nav-icon">📑</span>
            <span>Nhật ký & Đối soát</span>
          </button>

          <button
            className={`nav-item ${activeTab === "tools" ? "active" : ""}`}
            onClick={() => setActiveTab("tools")}
          >
            <span className="nav-icon">🧩</span>
            <span>Tool Hub & AI</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          {/* Theme Switcher Toggle */}
          <div className="theme-toggle-row">
            <span>Chế độ giao diện</span>
            <button className="theme-switch-btn" onClick={toggleTheme}>
              <span>{theme === "dark" ? "🌙 Tối" : "☀️ Sáng"}</span>
            </button>
          </div>

          <div className="security-card">
            <div className="security-status">
              <div className="status-dot-pulse" />
              <span>RLS Protected</span>
            </div>
            <p>Dữ liệu giao dịch được mã hóa. Parser chạy client WebWorker.</p>
          </div>

          <div className="user-profile">
            <div className="user-avatar">TH</div>
            <div className="user-info">
              <span className="user-name">Nguyễn Huy</span>
              <span className="user-role">PRO TRADER · VIETNAM</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="main-viewport">
        <div className="main-content">
          {/* Top Ticker Bar (Disciplined Monochrome) */}
          <div className="market-ticker-bar">
            <div className="ticker-item">
              <span className="market-badge-live">
                <span className="status-dot-pulse" />
                HOSE LIVE
              </span>
              <span className="ticker-label">VN-INDEX:</span>
              <strong className="ticker-val positive-val mono">1,285.60 (+0.66%)</strong>
            </div>

            <div className="ticker-item">
              <span className="ticker-label">VN30:</span>
              <strong className="ticker-val positive-val mono">1,324.15 (+0.85%)</strong>
            </div>

            <div className="ticker-item">
              <span className="ticker-label">Thanh khoản:</span>
              <strong className="ticker-val mono">18.420 Tỷ ₫</strong>
            </div>

            <div className="ticker-item">
              <span className="ticker-label">FPT:</span>
              <strong className="ticker-val positive-val mono">128.5 (+2.4%)</strong>
            </div>

            <div className="ticker-item">
              <span className="ticker-label">HPG:</span>
              <strong className="ticker-val positive-val mono">29.8 (+1.1%)</strong>
            </div>
          </div>

          {/* Top Header */}
          <header className="top-header">
            <div className="header-greeting">
              <p>AI TRADING INTELLIGENCE · VIETNAM MARKET</p>
              <h1>Bảng Điều Khiển Giao Dịch</h1>
            </div>

            <div className="header-actions">
              <button className="btn-secondary" onClick={toggleTheme} title="Chuyển đổi Sáng / Tối">
                <span>{theme === "dark" ? "☀️ Giao diện Sáng" : "🌙 Giao diện Tối"}</span>
              </button>

              <button className="btn-secondary" onClick={() => setActiveTab("pipeline")}>
                <span>🗺️ Sơ đồ Kiến trúc</span>
              </button>

              <button className="btn-primary" onClick={() => setImporterOpen(true)}>
                <span>＋ Nhập sao kê mới</span>
              </button>
            </div>
          </header>

          {/* Metrics Overview Cards */}
          <section className="metrics-grid">
            <article className="glass-panel metric-card">
              <div className="metric-header">
                <span>LÃI/LỖ RÒNG (NET P&L)</span>
                <div className="metric-icon-bubble">₫</div>
              </div>
              <div className="metric-value positive-val mono">+18.420.000 ₫</div>
              <div className="metric-meta">
                <span className="badge-tag badge-positive">▲ +18.42%</span>
                <span>Sau khấu trừ phí & thuế</span>
              </div>
            </article>

            <article className="glass-panel metric-card">
              <div className="metric-header">
                <span>TỶ LỆ THẮNG (WIN RATE)</span>
                <div className="metric-icon-bubble">🎯</div>
              </div>
              <div className="metric-value mono">57,8%</div>
              <div className="metric-meta">
                <span className="badge-tag badge-neutral">37 Thắng</span>
                <span>trên tổng số 64 lệnh</span>
              </div>
            </article>

            <article className="glass-panel metric-card">
              <div className="metric-header">
                <span>PROFIT FACTOR</span>
                <div className="metric-icon-bubble">⚡</div>
              </div>
              <div className="metric-value mono">1,72</div>
              <div className="metric-meta">
                <span className="badge-tag badge-positive">+0,14</span>
                <span>vượt chuẩn kỳ vọng</span>
              </div>
            </article>

            <article className="glass-panel metric-card">
              <div className="metric-header">
                <span>PHÍ & THUẾ TẠM TÍNH</span>
                <div className="metric-icon-bubble">🏷️</div>
              </div>
              <div className="metric-value mono">2.180.000 ₫</div>
              <div className="metric-meta">
                <span className="badge-tag badge-neutral">10,6% Gộp</span>
                <span>Phí 0.15% + Thuế 0.1%</span>
              </div>
            </article>
          </section>

          {/* View Tab Filter Bar */}
          <div className="view-tabs-bar">
            <div className="pill-tabs">
              <button
                className={`pill-tab ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                📈 Tổng quan
              </button>
              <button
                className={`pill-tab ${activeTab === "analytics" ? "active" : ""}`}
                onClick={() => setActiveTab("analytics")}
              >
                📊 Phân tích Chi tiết
              </button>
              <button
                className={`pill-tab ${activeTab === "pipeline" ? "active" : ""}`}
                onClick={() => setActiveTab("pipeline")}
              >
                🗺️ Sơ đồ Kiến trúc & Luồng
              </button>
              <button
                className={`pill-tab ${activeTab === "journal" ? "active" : ""}`}
                onClick={() => setActiveTab("journal")}
              >
                📑 Nhật ký Lệnh ({trades.length})
              </button>
              <button
                className={`pill-tab ${activeTab === "tools" ? "active" : ""}`}
                onClick={() => setActiveTab("tools")}
              >
                🧩 Tool Hub
              </button>
            </div>

            <div className="timeframe-group">
              {(["1W", "1M", "3M", "6M", "1Y", "ALL"] as const).map((tf) => (
                <button
                  key={tf}
                  className={`tf-btn ${timeframe === tf ? "active" : ""}`}
                  onClick={() => setTimeframe(tf)}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <>
              <div className="dashboard-grid-split">
                {/* Interactive Dynamic Equity Curve Chart */}
                <article className="glass-panel chart-panel">
                  <div className="panel-title-row">
                    <div>
                      <h3>Đường Cong Tăng Trưởng Tài Khoản (Equity Curve)</h3>
                      <p className="panel-subtitle">Hiệu suất thực tế sau khi đối soát sao kê 90 ngày</p>
                    </div>

                    <div className="chart-legend-stats">
                      <div className="chart-stat-item">
                        <span>Giá trị cuối</span>
                        <strong className="positive-val mono">118.420.000 ₫</strong>
                      </div>
                      <div className="chart-stat-item">
                        <span>Max Drawdown</span>
                        <strong className="negative-val mono">-2,1%</strong>
                      </div>
                    </div>
                  </div>

                  {/* Mode Toggles */}
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <button
                      className={`btn-secondary ${chartMode === "equity" ? "active" : ""}`}
                      style={{ padding: "4px 10px", fontSize: "11px" }}
                      onClick={() => setChartMode("equity")}
                    >
                      Đường cong Vốn (₫)
                    </button>
                    <button
                      className={`btn-secondary ${chartMode === "drawdown" ? "active" : ""}`}
                      style={{ padding: "4px 10px", fontSize: "11px" }}
                      onClick={() => setChartMode("drawdown")}
                    >
                      Mức sụt giảm (Drawdown %)
                    </button>
                  </div>

                  {/* Dynamic SVG Visualizer */}
                  <div
                    className="svg-chart-wrapper"
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--emerald)" stopOpacity={theme === "dark" ? "0.25" : "0.15"} />
                          <stop offset="100%" stopColor="var(--emerald)" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="lineStrokeGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="var(--emerald-dark)" />
                          <stop offset="100%" stopColor="var(--emerald)" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      {[0.25, 0.5, 0.75].map((factor) => {
                        const y = paddingY + factor * (svgHeight - paddingY * 2);
                        return (
                          <line
                            key={factor}
                            x1={paddingX}
                            y1={y}
                            x2={svgWidth - paddingX}
                            y2={y}
                            className="chart-grid-line"
                          />
                        );
                      })}

                      {/* Area & Stroke */}
                      <path d={areaD} fill="url(#chartGradient)" />
                      <path
                        d={pathD}
                        fill="none"
                        stroke="url(#lineStrokeGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />

                      {/* Data Points */}
                      {points.map((pt, idx) => (
                        <g key={idx}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={hoveredIndex === idx ? 6 : 3.5}
                            fill={hoveredIndex === idx ? "#ffffff" : "var(--emerald)"}
                            stroke={theme === "dark" ? "#080b0e" : "#ffffff"}
                            strokeWidth="2"
                            style={{ cursor: "pointer", transition: "all 0.15s ease" }}
                            onMouseEnter={() => setHoveredIndex(idx)}
                          />

                          {/* Event Marker */}
                          {pt.data.event && (
                            <text
                              x={pt.x}
                              y={pt.y - 10}
                              textAnchor="middle"
                              className="chart-axis-text"
                            >
                              📍
                            </text>
                          )}

                          {/* Date Label on X Axis */}
                          <text
                            x={pt.x}
                            y={svgHeight - 6}
                            textAnchor="middle"
                            className="chart-axis-text"
                          >
                            {pt.data.date}
                          </text>
                        </g>
                      ))}

                      {/* Crosshair Line */}
                      {hoveredIndex !== null && points[hoveredIndex] && (
                        <line
                          x1={points[hoveredIndex]!.x}
                          y1={paddingY}
                          x2={points[hoveredIndex]!.x}
                          y2={svgHeight - paddingY}
                          stroke="var(--emerald)"
                          strokeDasharray="3 3"
                          strokeWidth="1.5"
                        />
                      )}
                    </svg>

                    {/* Interactive Tooltip Overlay */}
                    {hoveredIndex !== null && points[hoveredIndex] && (
                      <div
                        className="chart-tooltip-hover"
                        style={{
                          left: `${(points[hoveredIndex]!.x / svgWidth) * 100}%`,
                          top: `${(points[hoveredIndex]!.y / svgHeight) * 100}%`,
                        }}
                      >
                        <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                          Ngày {points[hoveredIndex]!.data.date}
                        </div>
                        <div style={{ fontSize: "14px", fontWeight: "800", color: "var(--emerald)", marginTop: "2px" }} className="mono">
                          {formatVND(points[hoveredIndex]!.data.value)}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                          Thay đổi: <strong className="positive-val">{points[hoveredIndex]!.data.change}</strong>
                        </div>
                        {points[hoveredIndex]!.data.event && (
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", borderTop: "1px solid var(--border-subtle)", paddingTop: "4px" }}>
                            {points[hoveredIndex]!.data.event}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </article>

                {/* AI Coaching & Insight Card (Disciplined Monochrome Emerald) */}
                <article className="glass-panel ai-insights-panel">
                  <div className="ai-header-tag">
                    <span className="ai-spark-icon">✨</span>
                    <span>AI TRADING COACH INSIGHT</span>
                  </div>

                  <h2 className="ai-insight-headline">
                    Bạn thường thoát lệnh thắng quá sớm (+31% tiềm năng bị bỏ lỡ)
                  </h2>

                  <p className="ai-insight-body">
                    Qua 64 lệnh đối soát, các vị thế giữ trên <strong>4 ngày</strong> (như FPT, MWG) mang lại lợi nhuận trung bình cao hơn 31%, nhưng hiện chỉ chiếm 18% tổng số giao dịch do xu hướng chốt non bảo toàn vốn.
                  </p>

                  <div className="ai-evidence-list">
                    <div className="ai-evidence-item">
                      <span>Lệnh giữ 1 - 2 ngày (T+2.5):</span>
                      <strong className="mono">+1.2M tb / lệnh</strong>
                    </div>
                    <div className="ai-evidence-item">
                      <span>Lệnh giữ {">"} 4 ngày (Trend):</span>
                      <strong className="positive-val mono">+4.8M tb / lệnh</strong>
                    </div>
                    <div className="ai-evidence-item">
                      <span>Tỷ lệ R:R khuyến nghị:</span>
                      <strong className="positive-val mono">2.5 : 1</strong>
                    </div>
                  </div>

                  <div className="ai-actions-row">
                    <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => setActiveTab("journal")}>
                      Xem bằng chứng chi tiết 64 lệnh →
                    </button>
                  </div>
                </article>
              </div>

              {/* Symbol Breakdown Row */}
              <div className="multi-card-row">
                <article className="glass-panel breakdown-card">
                  <div className="panel-title-row">
                    <div>
                      <h3>Top Cổ Phiếu Sinh Lời</h3>
                      <p className="panel-subtitle">Đóng góp P&L theo mã chứng khoán</p>
                    </div>
                  </div>

                  <div className="symbol-list">
                    <div className="symbol-item">
                      <div className="symbol-ticker">
                        <span>FPT</span>
                        <span className="symbol-exchange">HOSE</span>
                      </div>
                      <div>
                        <div className="symbol-pnl positive-val mono">+8.450.000 ₫</div>
                        <div className="symbol-vol mono">Tỷ trọng: 38.5%</div>
                      </div>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: "85%" }} />
                    </div>

                    <div className="symbol-item">
                      <div className="symbol-ticker">
                        <span>MWG</span>
                        <span className="symbol-exchange">HOSE</span>
                      </div>
                      <div>
                        <div className="symbol-pnl positive-val mono">+5.200.000 ₫</div>
                        <div className="symbol-vol mono">Tỷ trọng: 28.2%</div>
                      </div>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: "62%" }} />
                    </div>

                    <div className="symbol-item">
                      <div className="symbol-ticker">
                        <span>SSI</span>
                        <span className="symbol-exchange">HOSE</span>
                      </div>
                      <div>
                        <div className="symbol-pnl positive-val mono">+2.600.000 ₫</div>
                        <div className="symbol-vol mono">Tỷ trọng: 14.1%</div>
                      </div>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: "35%" }} />
                    </div>
                  </div>
                </article>

                <article className="glass-panel breakdown-card">
                  <div className="panel-title-row">
                    <div>
                      <h3>Phân Bổ Thắng / Thua</h3>
                      <p className="panel-subtitle">Tỷ trọng hiệu suất 64 lệnh</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", marginTop: "16px" }}>
                    <div style={{ position: "relative", width: "120px", height: "120px" }}>
                      <svg viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="rgba(244, 63, 94, 0.2)"
                          strokeWidth="3.5"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="var(--emerald)"
                          strokeWidth="3.5"
                          strokeDasharray="57.8, 100"
                        />
                      </svg>
                      <div style={{ position: "absolute", inset: "0", display: "grid", placeItems: "center", flexDirection: "column" }}>
                        <span style={{ fontSize: "18px", fontWeight: "800" }} className="mono">57.8%</span>
                        <span style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "-4px" }}>WIN RATE</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "9px", height: "9px", borderRadius: "2px", background: "var(--emerald)" }} />
                        <span>37 Lệnh Thắng (+24.8M)</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "9px", height: "9px", borderRadius: "2px", background: "var(--rose)" }} />
                        <span>27 Lệnh Thua (-6.4M)</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "9px", height: "9px", borderRadius: "2px", background: "var(--text-muted)" }} />
                        <span>Phí Thuế (-2.18M)</span>
                      </div>
                    </div>
                  </div>
                </article>

                <article className="glass-panel breakdown-card">
                  <div className="panel-title-row">
                    <div>
                      <h3>Sức Khỏe Kỷ Luật Giao Dịch</h3>
                      <p className="panel-subtitle">Chỉ số đo lường rủi ro</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "10px" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                        <span style={{ color: "var(--text-muted)" }}>Tuân thủ Stop Loss:</span>
                        <strong className="positive-val mono">92% (Rất tốt)</strong>
                      </div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: "92%" }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                        <span style={{ color: "var(--text-muted)" }}>Không Over-trading (Tối đa 3 lệnh/ngày):</span>
                        <strong className="positive-val mono">88%</strong>
                      </div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: "88%" }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                        <span style={{ color: "var(--text-muted)" }}>Tỷ lệ gồng lãi (Holding Efficiency):</span>
                        <strong className="mono" style={{ color: "var(--text-secondary)" }}>64% (Cần cải thiện)</strong>
                      </div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: "64%" }} />
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </>
          )}

          {/* TAB 2: ANALYTICS & P&L BREAKDOWN */}
          {activeTab === "analytics" && (
            <div className="glass-panel" style={{ padding: "28px", marginBottom: "24px" }}>
              <div className="panel-title-row" style={{ marginBottom: "24px" }}>
                <div>
                  <p className="eyebrow">DEEP TRADING ANALYTICS</p>
                  <h2>Phân Tích Chi Tiết Hiệu Suất Theo Tháng & Chu Kỳ</h2>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <span className="badge-tag badge-positive">Tổng Lãi Ròng: +18.420.000 ₫</span>
                  <span className="badge-tag badge-neutral">ROI: +18.42%</span>
                </div>
              </div>

              {/* Monthly P&L Bar Chart Visualizer */}
              <div style={{ marginTop: "16px", marginBottom: "32px" }}>
                <h3 style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
                  LỢI NHUẬN RÒNG THEO THÁNG (VND)
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px", alignItems: "flex-end", height: "180px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
                  {[
                    { month: "Tháng 3", val: 3200000, pos: true },
                    { month: "Tháng 4", val: 4100000, pos: true },
                    { month: "Tháng 5", val: -1200000, pos: false },
                    { month: "Tháng 6", val: 5600000, pos: true },
                    { month: "Tháng 7", val: 2400000, pos: true },
                    { month: "Tháng 8", val: 4320000, pos: true },
                  ].map((item) => (
                    <div key={item.month} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", height: "100%", justifyContent: "flex-end" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: item.pos ? "var(--emerald)" : "var(--rose)" }} className="mono">
                        {item.pos ? `+${(item.val / 1000000).toFixed(1)}M` : `${(item.val / 1000000).toFixed(1)}M`}
                      </span>
                      <div
                        style={{
                          width: "100%",
                          maxWidth: "44px",
                          height: `${Math.abs(item.val) / 6000000 * 120}px`,
                          borderRadius: "4px 4px 0 0",
                          background: item.pos
                            ? "linear-gradient(180deg, var(--emerald) 0%, rgba(var(--emerald-rgb), 0.35) 100%)"
                            : "linear-gradient(180deg, var(--rose) 0%, rgba(var(--rose-rgb), 0.35) 100%)",
                        }}
                      />
                      <span style={{ fontSize: "11.5px", color: "var(--text-muted)", fontWeight: "600" }}>{item.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fee & Tax Breakdown Table */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div style={{ background: "var(--bg-input)", padding: "18px", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
                  <h4 style={{ fontSize: "14px", marginBottom: "12px", color: "var(--emerald)", fontWeight: "800" }}>Đối Soát Chi Phí Giao Dịch Việt Nam</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12.5px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Phí môi giới CTCK (Trung bình 0.15%):</span>
                      <strong className="mono">1.450.000 ₫</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Thuế TNCN chuyển nhượng (0.1% giá trị bán):</span>
                      <strong className="mono">730.000 ₫</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", paddingTop: "8px" }}>
                      <span>Tổng khấu trừ:</span>
                      <strong className="mono">2.180.000 ₫ (10.6% Lãi Gộp)</strong>
                    </div>
                  </div>
                </div>

                <div style={{ background: "var(--bg-input)", padding: "18px", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
                  <h4 style={{ fontSize: "14px", marginBottom: "12px", color: "var(--text-primary)", fontWeight: "800" }}>Khuyến Nghị Tối Ưu Hóa Thuế & Phí</h4>
                  <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                    Tần suất giao dịch của bạn ở mức vừa phải (0.7 lệnh/ngày). Việc duy trì chiến lược nắm giữ theo trend giúp bạn tiết kiệm khoảng <strong>4.200.000 ₫</strong> tiền thuế và phí môi giới mỗi quý so với giao dịch T+0 / lướt sóng hàng ngày.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM PIPELINE & ARCHITECTURE DIAGRAM */}
          {activeTab === "pipeline" && (
            <div className="glass-panel diagram-viewport">
              <div className="diagram-header">
                <div>
                  <p className="eyebrow">INTERACTIVE ARCHITECTURE DIAGRAM</p>
                  <h2>Sơ Đồ Luồng Dữ Liệu & Ranh Giới Hệ Thống TradeCheck</h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "12.5px", marginTop: "4px" }}>
                    Click vào từng nút để xem chi tiết manifest, mã Zod schema, ranh giới bảo mật và payload tương ứng.
                  </p>
                </div>
                <span className="badge-tag badge-positive">Modular Adapter v0.1.0</span>
              </div>

              {/* Dynamic Interactive Pipeline Flow */}
              <div className="pipeline-flow-container">
                {pipelineNodes.map((node, index) => (
                  <React.Fragment key={node.id}>
                    <div
                      className={`pipeline-node ${selectedNode.id === node.id ? "selected" : ""}`}
                      onClick={() => setSelectedNode(node)}
                    >
                      <span className="node-step-tag">{node.step}</span>
                      <h4 className="node-title">{node.title}</h4>
                      <span className="node-badge">{node.badge}</span>
                      <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                        {node.desc}
                      </p>
                    </div>

                    {index < pipelineNodes.length - 1 && (
                      <div className="pipeline-arrow">➔</div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Interactive Node Inspector Panel */}
              <div className="node-inspector-panel">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span className="badge-tag badge-positive">{selectedNode.step}</span>
                    <h3 style={{ fontSize: "16px" }}>{selectedNode.title}</h3>
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: "1.6", marginBottom: "12px" }}>
                    {selectedNode.desc}
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
                    <div>
                      <strong style={{ color: "var(--emerald)" }}>Quy tắc bảo mật: </strong>
                      <span style={{ color: "var(--text-muted)" }}>{selectedNode.security}</span>
                    </div>
                    <div>
                      <strong style={{ color: "var(--text-primary)" }}>Thời gian xử lý: </strong>
                      <span className="mono">{selectedNode.latency}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginBottom: "6px", fontWeight: "700" }}>
                    SAMPLE RUNTIME CONTRACT / JSON PAYLOAD:
                  </div>
                  <pre className="inspector-code-block">
                    {JSON.stringify(selectedNode.samplePayload, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TRADE JOURNAL */}
          {activeTab === "journal" && (
            <div className="glass-panel journal-panel">
              <div className="table-filter-bar">
                <div>
                  <p className="eyebrow">TRADE JOURNAL & RECONCILIATION</p>
                  <h2>Nhật Ký Khớp Lệnh & Đối Soát Sao Kê</h2>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <div className="search-input-wrap">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="Tìm theo mã CK (FPT, MWG...)"
                      className="search-input"
                      value={searchSymbol}
                      onChange={(e) => setSearchSymbol(e.target.value)}
                    />
                  </div>

                  <button className="btn-primary" onClick={() => setImporterOpen(true)}>
                    ＋ Nhập sao kê
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="trade-table">
                  <thead>
                    <tr>
                      <th>Mã Lệnh</th>
                      <th>Thời Gian</th>
                      <th>Mã CK</th>
                      <th>Sàn</th>
                      <th>Loại Lệnh</th>
                      <th>Khối Lượng</th>
                      <th>Giá Khớp</th>
                      <th>Phí (0.15%)</th>
                      <th>Thuế (0.1%)</th>
                      <th>P&L Ròng</th>
                      <th>Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrades.map((t) => (
                      <tr
                        key={t.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => setSelectedTrade(t)}
                      >
                        <td className="mono" style={{ color: "var(--emerald)", fontWeight: "700" }}>{t.id}</td>
                        <td style={{ color: "var(--text-muted)" }}>{t.date}</td>
                        <td>
                          <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>{t.symbol}</strong>
                        </td>
                        <td>
                          <span style={{ fontSize: "10px", padding: "2px 5px", borderRadius: "4px", background: "var(--bg-input)", fontWeight: "700" }}>
                            {t.exchange}
                          </span>
                        </td>
                        <td>
                          <span className={`side-badge ${t.side === "BUY" ? "side-buy" : "side-sell"}`}>
                            {t.side === "BUY" ? "MUA" : "BÁN"}
                          </span>
                        </td>
                        <td className="mono">{t.quantity.toLocaleString("vi-VN")}</td>
                        <td className="mono">{t.price.toLocaleString("vi-VN")} ₫</td>
                        <td className="mono" style={{ color: "var(--text-muted)" }}>{t.fee.toLocaleString("vi-VN")} ₫</td>
                        <td className="mono" style={{ color: "var(--text-muted)" }}>{t.tax.toLocaleString("vi-VN")} ₫</td>
                        <td className="mono" style={{ fontWeight: "800" }}>
                          {t.netPnl !== undefined ? (
                            <span className={t.netPnl >= 0 ? "positive-val" : "negative-val"}>
                              {t.netPnl >= 0 ? `+${t.netPnl.toLocaleString("vi-VN")}` : t.netPnl.toLocaleString("vi-VN")} ₫
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>-</span>
                          )}
                        </td>
                        <td>
                          <span className="badge-tag badge-positive">✓ Đã khớp</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: TOOL HUB */}
          {activeTab === "tools" && (
            <div className="glass-panel" style={{ padding: "28px" }}>
              <div className="panel-title-row" style={{ marginBottom: "20px" }}>
                <div>
                  <p className="eyebrow">CAPABILITY REGISTRY & TOOL HUB</p>
                  <h2>Danh Mục Module & Công Cụ Nền Tảng</h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "12.5px" }}>
                    Quản lý các module capability theo chính sách phân quyền và rủi ro.
                  </p>
                </div>
              </div>

              <div className="capability-grid">
                <article className="glass-panel cap-card">
                  <div className="cap-icon-box">↗</div>
                  <h4>Nhập Sao Kê Việt Nam</h4>
                  <p>Chuẩn hóa sao kê từ VNDIRECT, SSI, VPS, TCBS chạy bảo mật ngay trên trình duyệt.</p>
                  <div className="cap-footer">
                    <span className="badge-tag badge-positive">Sẵn sàng (Active)</span>
                    <span className="mono" style={{ color: "var(--text-muted)" }}>trades.write</span>
                  </div>
                </article>

                <article className="glass-panel cap-card">
                  <div className="cap-icon-box">⚡</div>
                  <h4>AI Trading Coach</h4>
                  <p>Phân tích nhật ký, phát hiện điểm mù tâm lý và tính toán xác suất giữ lệnh.</p>
                  <div className="cap-footer">
                    <span className="badge-tag badge-positive">Vibe Engine</span>
                    <span className="mono" style={{ color: "var(--text-muted)" }}>ai.research</span>
                  </div>
                </article>

                <article className="glass-panel cap-card">
                  <div className="cap-icon-box">⌁</div>
                  <h4>Worker Backtest</h4>
                  <p>Chạy thuật toán và kiểm thử chiến lược trên môi trường sandbox cô lập an toàn.</p>
                  <div className="cap-footer">
                    <span className="badge-tag badge-neutral">Cần Approval</span>
                    <span className="mono" style={{ color: "var(--text-muted)" }}>backtest.run</span>
                  </div>
                </article>

                <article className="glass-panel cap-card">
                  <div className="cap-icon-box">◇</div>
                  <h4>Quét Tín Hiệu VN-INDEX</h4>
                  <p>Lọc cổ phiếu bứt phá đỉnh 52 tuần, dòng tiền lớn và cảnh báo phân kỳ RSI.</p>
                  <div className="cap-footer">
                    <span className="badge-tag badge-neutral">Roadmap Q4</span>
                    <span className="mono" style={{ color: "var(--text-muted)" }}>hub.catalog</span>
                  </div>
                </article>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Enhanced Multi-Broker Statement Importer Modal */}
      {importerOpen && (
        <div className="modal-backdrop" onClick={() => setImporterOpen(false)}>
          <div className="modal-content modal-content-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "24px" }}>📥</span>
                <div>
                  <h2>Nhập Sao Kê Giao Dịch Đa Sàn</h2>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Hỗ trợ SSI (iBoard), VPS (SmartOne), VNDIRECT (Dstock), TCBS (TCInvest) & CSV Tự tạo
                  </span>
                </div>
              </div>
              <button className="close-btn" onClick={() => setImporterOpen(false)}>✕</button>
            </div>

            {/* Quick 1-Click Sample Dataset Selector */}
            <div className="broker-selector-bar">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-secondary)" }}>
                  💡 CHỌN NHANH DỮ LIỆU SAO KÊ MẪU ĐỂ TEST NGAY (1-CLICK):
                </span>
                <span className="badge-tag badge-neutral">Demo Sandbox</span>
              </div>
              <div className="broker-chips">
                {(["vndirect", "ssi", "vps", "tcbs", "generic"] as const).map((bKey) => (
                  <button
                    key={bKey}
                    type="button"
                    className={`broker-chip ${activeBrokerSample === bKey && !fileInputRef.current?.value ? "active" : ""}`}
                    onClick={() => {
                      if (fileInputRef.current) fileInputRef.current.value = "";
                      loadBrokerSample(bKey);
                    }}
                  >
                    <span>{bKey === "vndirect" ? "🟠" : bKey === "ssi" ? "🔵" : bKey === "vps" ? "🔴" : bKey === "tcbs" ? "🟡" : "📑"}</span>
                    {SAMPLE_STATEMENTS[bKey].name}
                  </button>
                ))}
              </div>
            </div>

            {/* Drag & Drop Real File Upload */}
            <div
              className="dropzone-box"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .txt"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
              <div className="dropzone-icon">📂</div>
              <strong style={{ fontSize: "14.5px", display: "block", marginBottom: "4px" }}>
                Hoặc tải lên file CSV sao kê thật của bạn
              </strong>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Click hoặc kéo thả file vào đây. Toàn bộ quá trình bóc tách diễn ra tại trình duyệt (100% Client-side).
              </span>
            </div>

            {/* Smart Column Mapping Trigger or Mode */}
            {isMappingMode && parsedResult?.rawHeaders && (
              <div className="mapping-box">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "13px", color: "var(--amber)" }}>
                    ⚠️ Khớp cột thông minh (Smart Column Mapping):
                  </strong>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Chọn cột tương ứng trong file của bạn
                  </span>
                </div>

                <div className="mapping-grid">
                  {(["date", "symbol", "side", "quantity", "price", "fee", "tax", "exchange"] as const).map((field) => (
                    <div key={field} className="mapping-field">
                      <label>
                        {field === "date" ? "Ngày khớp (*)" :
                         field === "symbol" ? "Mã CK (*)" :
                         field === "side" ? "Mua/Bán (*)" :
                         field === "quantity" ? "Khối lượng (*)" :
                         field === "price" ? "Giá khớp (*)" :
                         field === "fee" ? "Phí giao dịch" :
                         field === "tax" ? "Thuế TNCN" : "Sàn"}
                      </label>
                      <select
                        className="mapping-select"
                        value={customMapping[field] ?? ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? undefined : Number(e.target.value);
                          setCustomMapping((prev) => ({ ...prev, [field]: val }));
                        }}
                      >
                        <option value="">-- Chưa gán --</option>
                        {parsedResult.rawHeaders?.map((hdr, idx) => (
                          <option key={idx} value={idx}>
                            Cột {idx + 1}: {hdr || `(Trống ${idx + 1})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  style={{ alignSelf: "flex-end", fontSize: "12px", padding: "8px 16px" }}
                  onClick={handleApplyCustomMapping}
                >
                  Áp Dụng Mapping & Bóc Tách Lại
                </button>
              </div>
            )}

            {/* Parsed Result Preview */}
            {parsedResult && parsedResult.trades.length > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: "700", fontSize: "13px" }}>
                      Xem trước dữ liệu bóc tách:
                    </span>
                    <span className="badge-tag badge-positive">
                      Sàn: {parsedResult.broker.toUpperCase()}
                    </span>
                    <span className="badge-tag badge-neutral">
                      {parsedResult.trades.length} lệnh hợp lệ
                    </span>
                  </div>

                  <button
                    type="button"
                    style={{ background: "transparent", border: 0, color: "var(--emerald)", fontSize: "12px", cursor: "pointer", textDecoration: "underline" }}
                    onClick={() => setIsMappingMode(!isMappingMode)}
                  >
                    {isMappingMode ? "Ẩn bảng khớp cột" : "Tùy chỉnh khớp cột"}
                  </button>
                </div>

                {/* Summary Metrics */}
                <div className="preview-summary-grid">
                  <div className="preview-stat-card">
                    <span className="preview-stat-label">Tổng lệnh khớp</span>
                    <span className="preview-stat-val">{parsedResult.trades.length} lệnh</span>
                  </div>
                  <div className="preview-stat-card">
                    <span className="preview-stat-label">Mua / Bán</span>
                    <span className="preview-stat-val" style={{ color: "var(--emerald)" }}>
                      {parsedResult.trades.filter((t) => t.side === "BUY").length} M / {parsedResult.trades.filter((t) => t.side === "SELL").length} B
                    </span>
                  </div>
                  <div className="preview-stat-card">
                    <span className="preview-stat-label">Tổng phí môi giới</span>
                    <span className="preview-stat-val">
                      {formatVND(parsedResult.trades.reduce((acc, t) => acc + t.fee, 0))}
                    </span>
                  </div>
                  <div className="preview-stat-card">
                    <span className="preview-stat-label">Tổng thuế TNCN</span>
                    <span className="preview-stat-val" style={{ color: "var(--amber)" }}>
                      {formatVND(parsedResult.trades.reduce((acc, t) => acc + t.tax, 0))}
                    </span>
                  </div>
                </div>

                {/* Mini Preview Table */}
                <div className="preview-table-box">
                  <table>
                    <thead>
                      <tr>
                        <th>Mã Lệnh</th>
                        <th>Ngày Khớp</th>
                        <th>Mã CK</th>
                        <th>Chiều</th>
                        <th>Khối Lượng</th>
                        <th>Giá Khớp</th>
                        <th>Phí GD</th>
                        <th>Thuế</th>
                        <th>Sàn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedResult.trades.map((t, idx) => (
                        <tr key={idx}>
                          <td className="mono" style={{ color: "var(--text-muted)" }}>{t.externalId}</td>
                          <td className="mono">{new Date(t.executedAt).toLocaleDateString("vi-VN")}</td>
                          <td style={{ fontWeight: "700" }}>{t.symbol}</td>
                          <td>
                            <span className={`side-badge ${t.side === "BUY" ? "side-buy" : "side-sell"}`}>
                              {t.side === "BUY" ? "MUA" : "BÁN"}
                            </span>
                          </td>
                          <td className="mono" style={{ textAlign: "right" }}>{t.quantity.toLocaleString("vi-VN")}</td>
                          <td className="mono" style={{ textAlign: "right" }}>{t.price.toLocaleString("vi-VN")} ₫</td>
                          <td className="mono" style={{ textAlign: "right" }}>{t.fee.toLocaleString("vi-VN")} ₫</td>
                          <td className="mono" style={{ textAlign: "right" }}>{t.tax.toLocaleString("vi-VN")} ₫</td>
                          <td><span className="badge-tag badge-neutral">{t.exchange}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "14px", borderTop: "1px solid var(--border-subtle)" }}>
              <div>
                {importStatusMsg ? (
                  <span style={{ color: "var(--emerald)", fontWeight: "700", fontSize: "13px" }}>
                    {importStatusMsg}
                  </span>
                ) : (
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    🛡️ Approval Gate: Kiểm tra tính hợp lệ trước khi ghi nhận vào hệ thống.
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="pill-tab"
                  onClick={() => setImporterOpen(false)}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!parsedResult || parsedResult.trades.length === 0}
                  onClick={handleApproveImport}
                >
                  ✓ Duyệt & Nạp {parsedResult?.trades.length || 0} Lệnh Vào Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trade Detail Modal */}
      {selectedTrade && (
        <div className="modal-backdrop" onClick={() => setSelectedTrade(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi Tiết Khớp Lệnh: {selectedTrade.symbol}</h2>
              <button className="close-btn" onClick={() => setSelectedTrade(null)}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Mã giao dịch:</span>
                <div className="mono" style={{ fontWeight: "700", color: "var(--emerald)" }}>{selectedTrade.id}</div>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Thời gian khớp:</span>
                <div className="mono">{selectedTrade.date}</div>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Loại lệnh / Sàn:</span>
                <div>
                  <span className={`side-badge ${selectedTrade.side === "BUY" ? "side-buy" : "side-sell"}`}>
                    {selectedTrade.side === "BUY" ? "MUA" : "BÁN"}
                  </span>{" "}
                  <strong>{selectedTrade.exchange}</strong>
                </div>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Khối lượng:</span>
                <div className="mono" style={{ fontWeight: "700" }}>{selectedTrade.quantity.toLocaleString("vi-VN")} CP</div>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Giá khớp:</span>
                <div className="mono" style={{ fontWeight: "700" }}>{selectedTrade.price.toLocaleString("vi-VN")} ₫</div>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Phí & Thuế đối soát:</span>
                <div className="mono">
                  {(selectedTrade.fee + selectedTrade.tax).toLocaleString("vi-VN")} ₫
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
              <button className="btn-secondary" onClick={() => setSelectedTrade(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
