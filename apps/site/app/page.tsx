"use client";

import React, { useState } from "react";

const APP_URL = "http://localhost:3000";

const accordionData = [
  {
    icon: "✨",
    tag: "AI HABIT COACH",
    label: "Phân Tích Điểm Mù Tâm Lý",
    desc: "Tự động phát hiện hành vi gồng lỗ, chốt non và over-trading dựa trên 64 lệnh đối soát thực tế.",
    metric: "▲ +31% ROI khi gồng đúng xu hướng",
  },
  {
    icon: "📈",
    tag: "EQUITY CURVE",
    label: "Đường Cong Tăng Trưởng Vốn",
    desc: "SVG tương tác mô phỏng tài sản thực tế sau khi khấu trừ phí môi giới 0.15% và thuế TNCN 0.1%.",
    metric: "90 Ngày: +18.42% Net P&L",
  },
  {
    icon: "🏷️",
    tag: "TAX & FEE ENGINE",
    label: "Bóc Tách Phí & Thuế Chuẩn VN",
    desc: "Đo lường chính xác từng đồng phí CTCK và thuế chuyển nhượng theo chuẩn thị trường Việt Nam.",
    metric: "Tiết kiệm ~4.2M ₫ / quý",
  },
  {
    icon: "🔒",
    tag: "PRIVACY BY DESIGN",
    label: "Bảo Mật Dữ Liệu Tuyệt Đối",
    desc: "Sao kê xử lý 100% trong WebWorker trình duyệt. Không có thông tin cá nhân nào rời máy bạn.",
    metric: "Zero-Knowledge Client-Side",
  },
];

const features = [
  { icon: "📥", metric: "~15ms", title: "Parser WebWorker", desc: "Chuẩn hóa CSV/XLSX trong bộ nhớ trình duyệt với fingerprint SHA-256.", specs: ["VNDIRECT, SSI, VPS, TCBS", "Chống trùng lặp & macro", "@tradecheck/parsers engine"] },
  { icon: "🏷️", metric: "Chuẩn VN", title: "Bóc Tách Phí & Thuế", desc: "Tự động tách 0.15% phí CTCK và 0.1% thuế TNCN, hiển thị Net P&L chính xác.", specs: ["Phí môi giới theo từng lệnh", "Thuế TNCN chuyển nhượng", "So sánh Lãi Gộp vs Ròng"] },
  { icon: "✨", metric: "Vibe AI", title: "AI Habit & Bias Coach", desc: "Phát hiện gồng lỗ, chốt non, over-trading — dựa trên dữ liệu lịch sử giao dịch.", specs: ["Model: Qwen-72B Vibe Engine", "Holding Duration vs ROI", "Tỷ lệ R:R & Kỷ luật Stop Loss"] },
  { icon: "🧩", metric: "Modular", title: "Kiến Trúc Adapter", desc: "Tách biệt Gateway, Registry và AI Worker. Không mutation upstream, mở rộng không giới hạn.", specs: ["Fastify + Zod Contracts", "Scopes-based RBAC", "Vietnam Extension Hub"] },
  { icon: "🔒", metric: "RLS", title: "PostgreSQL Row-Level Security", desc: "Dữ liệu từng nhà đầu tư cô lập vật lý ở tầng database với SET LOCAL app.user_id.", specs: ["Schema tradecheck RLS", "Audit Ledger append-only", "AES-256 GCM at rest"] },
  { icon: "⌁", metric: "Sandbox", title: "Worker Backtest", desc: "Kiểm thử chiến lược trong container cô lập — không database access, không đặt lệnh thật.", specs: ["Fail-closed policy engine", "Isolated WebWorker Docker", "Zero execution privileges"] },
];

const testimonials = [
  { initials: "TH", name: "Trần Hoàng Minh", role: "Full-time Trader · HOSE", quote: "Trước đây tôi chỉ nhìn lãi gộp mà không biết phí thuế đã ngốn hơn 12% lợi nhuận. TradeCheck bóc tách từng đồng rõ ràng và cực chuẩn.", metric: "🎯 Win Rate: 62% (+8%)" },
  { initials: "LH", name: "Lê Hải Nam", role: "Quản lý Danh mục", quote: "AI Coach chỉ đúng bệnh tôi hay chốt lời non sau 2 ngày. Nhờ điều chỉnh chiến lược theo khuyến nghị, ROI quý 2 tăng vọt.", metric: "📈 ROI: +24.5%" },
  { initials: "VA", name: "Vũ Tuấn Anh", role: "Quantitative Analyst", quote: "Kiến trúc modular và bảo mật client-side rất chuẩn kỹ thuật. Dữ liệu sao kê không bị upload linh tinh — hoàn toàn tin tưởng.", metric: "🔒 Bảo mật RLS" },
];

const tickers = [
  { label: "VN-INDEX", val: "1,285.60", chg: "+0.66%", up: true },
  { label: "VN30", val: "1,324.15", chg: "+0.85%", up: true },
  { label: "HNX", val: "228.40", chg: "+0.32%", up: true },
  { label: "FPT", val: "128.5", chg: "+2.4%", up: true },
  { label: "MWG", val: "68.4", chg: "-0.9%", up: false },
  { label: "HPG", val: "29.8", chg: "+1.1%", up: true },
  { label: "SSI", val: "34.2", chg: "+0.6%", up: true },
  { label: "VHM", val: "42.1", chg: "-0.5%", up: false },
  { label: "VIC", val: "38.7", chg: "+0.3%", up: true },
  { label: "TCB", val: "24.5", chg: "+0.8%", up: true },
];

export default function SitePage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [openAcc, setOpenAcc] = useState<number>(0);
  const [annual, setAnnual] = useState(false);
  const [activeNav, setActiveNav] = useState("home");
  const [broker, setBroker] = useState("VNDIRECT");
  const [parsed, setParsed] = useState(false);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <>
      <div data-theme={theme} style={{ minHeight: "100vh" }}>

        {/* ── FLOATING NAVBAR ────────────────────────────── */}
        <header className="site-header">
          <nav className="nav-island">
            <div className="nav-brand">
              <div className="nav-logo">TC</div>
              <span className="nav-name">TradeCheck</span>
            </div>

            <div className="nav-links">
              {[
                { id: "home", label: "Trang chủ", href: "#hero" },
                { id: "features", label: "Hệ thống", href: "#features" },
                { id: "demo", label: "Demo", href: "#demo" },
                { id: "pricing", label: "Bảng giá", href: "#pricing" },
                { id: "blog", label: "Blog", href: "/blog" },
              ].map(({ id, label, href }) => (
                <a
                  key={id}
                  href={href}
                  className={`nav-link ${activeNav === id ? "active" : ""}`}
                  onClick={() => setActiveNav(id)}
                >
                  {label}
                </a>
              ))}
            </div>

            <div className="nav-actions">
              <button className="btn-icon" onClick={toggleTheme} title="Đổi giao diện">
                {theme === "dark" ? "🌙" : "☀️"}
              </button>
              <a href={APP_URL} className="btn-cta">
                Mở Dashboard →
              </a>
            </div>
          </nav>
        </header>

        {/* ── PAGE BODY ───────────────────────────────────── */}
        <div className="page-wrap">

          {/* ── HERO ──────────────────────────────────────── */}
          <section className="hero-section" id="hero">
            <div className="hero-bg-blob" />

            <div className="hero-content">
              {/* LEFT — headline */}
              <div className="hero-left">
                <div className="hero-badge fade-up">
                  <span className="badge-dot" />
                  MỚI: AI HABIT COACH & ĐỐI SOÁT T+2.5
                </div>

                <h1 className="hero-h1 fade-up fade-up-d1">
                  Đừng chỉ nhìn<br />
                  lãi hay lỗ.{" "}
                  <span className="grad-text">Hãy hiểu<br />chính xác vì sao.</span>
                </h1>

                <p className="hero-lead fade-up fade-up-d2">
                  Chuẩn hóa sao kê chứng khoán Việt Nam, bóc tách phí môi giới 0.15% và thuế 0.1%,
                  phát hiện điểm mù tâm lý bằng AI Coach — với bảo mật Client-Side tuyệt đối.
                </p>

                <div className="hero-btns fade-up fade-up-d3">
                  <a href={APP_URL} className="btn-primary-hero">
                    🚀 Khởi chạy Dashboard ngay
                  </a>
                  <a href="#demo" className="btn-outline">
                    ⚡ Thử bóc tách sao kê
                  </a>
                </div>

                <div className="hero-stats fade-up fade-up-d4">
                  <div className="hero-stat">
                    <strong className="mono text-em">64+</strong>
                    <span>Lệnh đối soát mẫu</span>
                  </div>
                  <div className="hero-stat">
                    <strong className="mono text-em">~15ms</strong>
                    <span>Parser WebWorker</span>
                  </div>
                  <div className="hero-stat">
                    <strong className="mono">100% RLS</strong>
                    <span>Dữ liệu riêng tư</span>
                  </div>
                </div>
              </div>

              {/* RIGHT — accordion showcase */}
              <div className="hero-right fade-up fade-up-d2">
                <div className="accordion-stack">
                  {accordionData.map((item, i) => (
                    <div
                      key={i}
                      className={`acc-card ${openAcc === i ? "open" : ""}`}
                      onClick={() => setOpenAcc(openAcc === i ? -1 : i)}
                    >
                      <div className="acc-header">
                        <div className="acc-header-left">
                          <div className="acc-icon">{item.icon}</div>
                          <div>
                            <span className="acc-label">{item.label}</span>
                            <span className="acc-tag">{item.tag}</span>
                          </div>
                        </div>
                        <span className="acc-toggle">+</span>
                      </div>

                      <div className="acc-body">
                        <div className="acc-body-inner">
                          <p className="acc-desc">{item.desc}</p>
                          <span className="acc-metric">✦ {item.metric}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── BROKERS STRIP ─────────────────────────────── */}
          <div className="brokers-section">
            <span className="brokers-label">Tương thích sao kê</span>
            {["VNDIRECT D-Stock", "SSI iBoard", "VPS SmartOne", "TCBS TCInvest", "HSC ONE", "Vietcap"].map(b => (
              <div key={b} className="broker-chip">
                <span className="broker-chip-dot" />
                {b}
              </div>
            ))}
          </div>

          <div className="section-divider" />

          {/* ── FEATURES ──────────────────────────────────── */}
          <section className="features-section" id="features">
            <div className="section-head">
              <div className="section-eyebrow">⚡ TRADECHECK INFRASTRUCTURE</div>
              <h2 className="section-title">
                Hệ Sinh Thái Đối Soát<br />&amp; Phân Tích Kỷ Luật
              </h2>
              <p className="section-desc">
                Kiến trúc Modular Adapter — tách biệt Gateway, Capability Registry và AI Worker cô lập hoàn toàn.
              </p>
            </div>

            <div className="features-grid">
              {features.map((f, i) => (
                <article key={i} className="cyber-card">
                  <span className="c tl" /><span className="c tr" /><span className="c bl" /><span className="c br" />
                  <div className="cyber-card-top">
                    <div className="cyber-icon">{f.icon}</div>
                    <span className="cyber-metric mono">{f.metric}</span>
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                  <ul className="cyber-specs">
                    {f.specs.map((s, j) => <li key={j}>{s}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <div className="section-divider" />

          {/* ── LIVE DEMO ──────────────────────────────────── */}
          <section className="demo-section" id="demo">
            <div className="section-head">
              <div className="section-eyebrow">🧪 TRẢI NGHIỆM TRỰC TIẾP</div>
              <h2 className="section-title">Thử Đối Soát Sao Kê Ngay</h2>
              <p className="section-desc">
                Chọn CTCK, nạp file mẫu — xem kết quả tách phí, thuế và nhận định AI Coach tức thì.
              </p>
            </div>

            <div className="demo-glass">
              <div className="demo-grid">
                {/* Drop zone */}
                <div>
                  <div className="demo-broker-tabs">
                    {["VNDIRECT", "SSI", "VPS", "TCBS"].map(b => (
                      <button
                        key={b}
                        className={`broker-tab ${broker === b ? "active" : ""}`}
                        onClick={() => { setBroker(b); setParsed(true); }}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                  <div className="demo-dropzone" onClick={() => setParsed(true)}>
                    <div className="demo-dropzone-icon">📂</div>
                    <h4>{parsed ? `✓ Đã nạp sao kê mẫu ${broker}` : "Click hoặc kéo file CSV vào đây"}</h4>
                    <p>Định dạng: CSV / XLSX · Xử lý tại trình duyệt · Không upload server</p>
                  </div>
                </div>

                {/* Result panel */}
                <div className="demo-result">
                  <div className="demo-result-header">
                    <span className="demo-live-dot">KẾT QUẢ ĐỐI SOÁT THỰC TẾ</span>
                    <span className="mono" style={{ fontSize: "11px", color: "var(--clr-text-3)" }}>
                      Parser: 14.8ms
                    </span>
                  </div>

                  <div className="demo-row">
                    <span>CTCK nguồn:</span>
                    <strong className="mono">{broker}</strong>
                  </div>
                  <div className="demo-row">
                    <span>Số lệnh đã khớp:</span>
                    <strong className="mono">64 giao dịch</strong>
                  </div>
                  <div className="demo-row">
                    <span>Phí + Thuế TNCN:</span>
                    <strong className="mono" style={{ color: "var(--clr-text-3)" }}>−2.180.000 ₫</strong>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--clr-text-3)", marginBottom: "4px" }}>NET P&amp;L SAU KHẤU TRỪ</div>
                    <div className="demo-pnl-big mono">+18.420.000 ₫</div>
                    <div style={{ fontSize: "12px", color: "var(--clr-em)" }}>↑ +18.42% tổng vốn ban đầu</div>
                  </div>

                  <div className="demo-ai-box">
                    <div className="demo-ai-tag">✨ AI HABIT COACH NHẬN ĐỊNH:</div>
                    <p className="demo-ai-text">
                      Lệnh FPT giữ 6 ngày (+8.45M) chuẩn trend. Tuy nhiên bạn có xu hướng chốt non MWG &amp; SSI trước 2 ngày — bỏ lỡ ~31% lợi nhuận tiềm năng.
                    </p>
                  </div>

                  <a href={APP_URL} className="btn-plan-primary">
                    Xem toàn bộ Dashboard chi tiết →
                  </a>
                </div>
              </div>
            </div>
          </section>

          <div className="section-divider" />

          {/* ── PRICING ───────────────────────────────────── */}
          <section className="pricing-section" id="pricing">
            <div className="section-head">
              <div className="section-eyebrow">💎 BẢNG GIÁ</div>
              <h2 className="section-title">Gói Dịch Vụ Phù Hợp Hành Trình Của Bạn</h2>
              <p className="section-desc">Tiết kiệm tới 20% khi chọn chu kỳ thanh toán năm.</p>
            </div>

            <div className="pricing-toggle">
              <button className={`ptoggle-btn ${!annual ? "active" : ""}`} onClick={() => setAnnual(false)}>
                Hàng Tháng
              </button>
              <button className={`ptoggle-btn ${annual ? "active" : ""}`} onClick={() => setAnnual(true)}>
                Hàng Năm <span className="save-badge">−20%</span>
              </button>
            </div>

            <div className="pricing-grid">
              {/* Free */}
              <div className="price-card">
                <div className="price-plan">Free Trader</div>
                <div className="price-tagline">Dành cho nhà đầu tư cá nhân bắt đầu ghi chép nhật ký.</div>
                <div className="price-amount mono">0 ₫ <small>/ tháng</small></div>
                <ul className="price-features">
                  {["Nhập sao kê VNDIRECT, SSI, VPS, TCBS", "Bóc tách Net P&L, phí CTCK & thuế 0.1%", "Đường cong vốn 90 ngày SVG tương tác", "Lưu trữ cục bộ bảo mật hoàn toàn"].map(f => (
                    <li key={f}><span className="ck">✓</span>{f}</li>
                  ))}
                </ul>
                <a href={APP_URL} className="btn-plan-ghost">Bắt đầu miễn phí</a>
              </div>

              {/* Pro */}
              <div className="price-card featured">
                <span className="featured-badge">PHỔ BIẾN NHẤT</span>
                <div className="price-plan">Pro Trader</div>
                <div className="price-tagline">Trader chuyên nghiệp cần AI Coach &amp; phân tích sâu.</div>
                <div className="price-amount em mono">
                  {annual ? "159.000 ₫" : "199.000 ₫"} <small>/ tháng</small>
                </div>
                <ul className="price-features">
                  {[
                    "Toàn bộ tính năng Free Trader",
                    "AI Habit Coach phân tích điểm mù tâm lý",
                    "Đối soát không giới hạn số lệnh",
                    "P&L chuyên sâu theo chu kỳ & mã CK",
                    "Quyền truy cập sớm Backtest Sandbox",
                  ].map(f => <li key={f}><span className="ck">✓</span>{f}</li>)}
                </ul>
                <a href={APP_URL} className="btn-plan-primary">Nâng cấp Pro Trader</a>
              </div>

              {/* Enterprise */}
              <div className="price-card">
                <div className="price-plan">Enterprise / Fund</div>
                <div className="price-tagline">Đội ngũ quản lý quỹ, room tư vấn &amp; tổ chức đầu tư.</div>
                <div className="price-amount mono">Liên hệ <small>/ năm</small></div>
                <ul className="price-features">
                  {[
                    "Báo cáo danh mục đa tài khoản",
                    "PostgreSQL riêng với Audit Ledger",
                    "Tùy biến AI &amp; Custom Contract Schema",
                    "Triển khai Private VPS On-Premise",
                  ].map(f => <li key={f}><span className="ck">✓</span>{f}</li>)}
                </ul>
                <a href="mailto:contact@tradecheck.vn" className="btn-plan-ghost">Liên hệ tư vấn</a>
              </div>
            </div>
          </section>

          <div className="section-divider" />

          {/* ── TESTIMONIALS ──────────────────────────────── */}
          <section className="testimonials-section">
            <div className="section-head">
              <div className="section-eyebrow">💬 ĐÁNH GIÁ THỰC TẾ</div>
              <h2 className="section-title">Cộng Đồng Trader Nói Gì</h2>
              <p className="section-desc">
                Phản hồi từ nhà đầu tư cá nhân và chuyên viên phân tích tại Việt Nam.
              </p>
            </div>
            <div className="testimonials-grid">
              {testimonials.map((t, i) => (
                <div key={i} className="testi-card">
                  <div className="testi-user">
                    <div className="testi-avatar">{t.initials}</div>
                    <div>
                      <div className="testi-name">{t.name}</div>
                      <div className="testi-role">{t.role}</div>
                    </div>
                  </div>
                  <p className="testi-quote">&ldquo;{t.quote}&rdquo;</p>
                  <span className="testi-metric">{t.metric}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── FOOTER ────────────────────────────────────── */}
          <footer className="site-footer">
            <div className="footer-grid">
              <div className="footer-brand">
                <div className="footer-brand-row">
                  <div className="nav-logo">TC</div>
                  <span className="footer-brand-name">TradeCheck Platform</span>
                </div>
                <p className="footer-tagline">
                  Hệ thống đối soát giao dịch và phân tích hành vi trader chuyên nghiệp tại thị trường chứng khoán Việt Nam.
                </p>
                <div className="footer-status">
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--clr-em)", display: "inline-block", animation: "pulse-dot 2s infinite" }} />
                  All Systems Operational · 99.9% Uptime
                </div>
              </div>
              <div className="footer-col">
                <h5>Nền Tảng</h5>
                <ul>
                  <li><a href="#features">Kiến trúc Hệ thống</a></li>
                  <li><a href="#demo">Demo Đối Soát</a></li>
                  <li><a href="#pricing">Bảng giá</a></li>
                  <li><a href={APP_URL}>Dashboard Live</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <h5>Hỗ Trợ CTCK</h5>
                <ul>
                  <li><a href="#">VNDIRECT D-Stock</a></li>
                  <li><a href="#">SSI iBoard</a></li>
                  <li><a href="#">VPS SmartOne</a></li>
                  <li><a href="#">TCBS TCInvest</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <h5>Tài Nguyên</h5>
                <ul>
                  <li><a href="/blog">Góc Kiến Thức</a></li>
                  <li><a href="http://localhost:8080/health" target="_blank">Gateway Health</a></li>
                  <li><a href="mailto:contact@tradecheck.vn">Liên hệ Hỗ trợ</a></li>
                </ul>
              </div>
            </div>
            <div className="footer-bottom">
              <span>© 2026 TradeCheck VN. All rights reserved.</span>
              <div style={{ display: "flex", gap: 20 }}>
                <a href="#">Điều khoản</a>
                <a href="#">Bảo mật dữ liệu</a>
              </div>
            </div>
          </footer>
        </div>

        {/* ── LIVE TICKER BAR ───────────────────────────── */}
        <div className="ticker-bar">
          <div className="ticker-track">
            {[...tickers, ...tickers].map((t, i) => (
              <div key={i} className="ticker-item">
                <span className="mono">{t.label}</span>
                <strong className="mono">{t.val}</strong>
                <span className={t.up ? "up mono" : "dn mono"}>{t.chg}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
