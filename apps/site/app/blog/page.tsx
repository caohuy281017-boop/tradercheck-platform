"use client";

import React, { useState, useEffect } from "react";

const posts = [
  {
    id: "p1",
    tag: "TÂM LÝ GIAO DỊCH",
    title: "Nhật ký giao dịch có thực sự giúp bạn kiếm tiền không?",
    desc: "Một phương pháp đo lường khoa học bằng dữ liệu đối soát thay vì chỉ ghi chép cảm xúc mơ hồ sau mỗi phiên.",
    readTime: "5 phút đọc",
    date: "24/08/2026",
  },
  {
    id: "p2",
    tag: "QUẢN TRỊ RỦI RO",
    title: "Chi phí ẩn trong mỗi lần mua bán chứng khoán Việt Nam",
    desc: "Cách phí môi giới 0.15% và thuế TNCN 0.1% âm thầm bào mòn hơn 10% tổng lợi nhuận gộp của bạn mỗi năm.",
    readTime: "7 phút đọc",
    date: "20/08/2026",
  },
  {
    id: "p3",
    tag: "ĐỊNH LƯỢNG & BACKTEST",
    title: "Backtest không phải lời tiên tri: Tránh bẫy Overfitting",
    desc: "Những sai lầm kinh điển khi đọc một chiến lược thuật toán có đường cong vốn quá đẹp trong quá khứ.",
    readTime: "6 phút đọc",
    date: "15/08/2026",
  },
];

export default function BlogPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const appUrl = "http://localhost:3000";

  return (
    <main>
      <nav className="site-nav">
        <div className="nav-inner">
          <a href="/" className="brand-link">
            <div className="brand-badge">TC</div>
            <span>TradeCheck</span>
          </a>

          <div className="nav-links">
            <a href="/#features">Tính năng</a>
            <a href="/#pricing">Bảng giá</a>
            <a href="/blog" style={{ color: "var(--emerald)" }}>Góc kiến thức</a>
          </div>

          <div className="nav-actions">
            <button className="theme-switch-btn" onClick={toggleTheme} title="Chuyển đổi Sáng / Tối">
              <span>{theme === "dark" ? "🌙 Tối" : "☀️ Sáng"}</span>
            </button>

            <a href={appUrl} className="btn-cta">
              <span>Mở ứng dụng →</span>
            </a>
          </div>
        </div>
      </nav>

      <section className="blog-page-wrap">
        <div className="section-heading" style={{ textAlign: "left", margin: "0 0 30px" }}>
          <p>GÓC KIẾN THỨC & PHÂN TÍCH</p>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: "800", letterSpacing: "-0.03em" }}>
            Hiểu rõ dữ liệu trước khi ra quyết định đầu tư.
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "16px", marginTop: "12px" }}>
            Tổng hợp các bài viết chuyên sâu về tâm lý hành vi trader, quản trị rủi ro và phương pháp đối soát sao kê chuẩn mực.
          </p>
        </div>

        <div className="blog-grid">
          {posts.map((post) => (
            <article key={post.id} className="blog-card">
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--emerald)", fontWeight: "700" }}>
                <span>{post.tag}</span>
                <span style={{ color: "var(--text-muted)" }}>{post.readTime}</span>
              </div>
              <h3>{post.title}</h3>
              <p>{post.desc}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>{post.date}</span>
                <a href="#" className="blog-link">Đọc bài viết →</a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="brand-badge" style={{ width: "28px", height: "28px", fontSize: "11px" }}>TC</div>
            <strong style={{ color: "var(--text-primary)" }}>TradeCheck Platform</strong>
            <span>© 2026.</span>
          </div>

          <div style={{ display: "flex", gap: "20px" }}>
            <a href="/">Trang chủ</a>
            <a href="/blog">Góc kiến thức</a>
            <a href={appUrl}>Ứng dụng</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
