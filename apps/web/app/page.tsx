const metrics = [
  { label: "Lãi/lỗ ròng", value: "+18.420.000 ₫", note: "Sau phí và thuế", tone: "positive" },
  { label: "Tỷ lệ thắng", value: "57,8%", note: "64 giao dịch đã đóng", tone: "neutral" },
  { label: "Profit factor", value: "1,72", note: "Tăng 0,14 so với tháng trước", tone: "neutral" },
  { label: "Chi phí", value: "2.180.000 ₫", note: "10,6% lợi nhuận gộp", tone: "warning" },
];

const capabilities = [
  { icon: "↗", title: "Nhập sao kê", copy: "VNDIRECT beta · chạy trong trình duyệt", status: "Sẵn sàng" },
  { icon: "◎", title: "AI Coach", copy: "Phân tích thói quen và sai lầm giao dịch", status: "Sắp mở" },
  { icon: "⌁", title: "Backtest", copy: "Worker cô lập qua Vibe-Trading", status: "Đã khóa" },
  { icon: "◇", title: "Tool Hub", copy: "Danh mục công cụ cho nhà đầu tư Việt Nam", status: "Roadmap" },
];

export default function Dashboard() {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span>TC</span><strong>TradeCheck</strong></div>
        <nav>
          <a className="active" href="#overview">Tổng quan</a>
          <a href="#imports">Sao kê</a>
          <a href="#journal">Nhật ký</a>
          <a href="#analytics">Phân tích</a>
          <a href="#tools">Tool Hub</a>
        </nav>
        <div className="privacy"><i /> Dữ liệu được bảo vệ theo capability scope</div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">TRADING INTELLIGENCE</p>
            <h1>Chào buổi sáng, Huy.</h1>
          </div>
          <button className="importButton">＋ Nhập sao kê</button>
        </header>

        <section className="metrics" id="overview">
          {metrics.map((metric) => (
            <article className="metric" key={metric.label}>
              <p>{metric.label}</p>
              <strong className={metric.tone}>{metric.value}</strong>
              <span>{metric.note}</span>
            </article>
          ))}
        </section>

        <section className="grid">
          <article className="panel chartPanel">
            <div className="panelHeader"><div><p>ĐƯỜNG CONG TÀI KHOẢN</p><h2>Hiệu suất 90 ngày</h2></div><span>+12,4%</span></div>
            <div className="chart">
              <svg viewBox="0 0 800 250" role="img" aria-label="Biểu đồ hiệu suất minh họa">
                <defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#48e0a4" stopOpacity=".28"/><stop offset="1" stopColor="#48e0a4" stopOpacity="0"/></linearGradient></defs>
                <path className="area" d="M0 220 C70 205 95 214 145 172 S235 192 300 132 S390 158 450 92 S560 124 625 62 S735 72 800 28 L800 250 L0 250Z" />
                <path className="line" d="M0 220 C70 205 95 214 145 172 S235 192 300 132 S390 158 450 92 S560 124 625 62 S735 72 800 28" />
              </svg>
            </div>
          </article>

          <article className="panel insight">
            <p className="eyebrow">AI INSIGHT</p>
            <h2>Bạn thường thoát lệnh thắng quá sớm</h2>
            <p>Những vị thế giữ trên 4 ngày có lợi nhuận trung bình cao hơn 31%, nhưng chỉ chiếm 18% giao dịch.</p>
            <button>Xem bằng chứng →</button>
          </article>
        </section>

        <section className="capabilitySection" id="tools">
          <div className="sectionTitle"><div><p className="eyebrow">CAPABILITY REGISTRY</p><h2>Công cụ được bật theo từng giai đoạn</h2></div><span>4 modules</span></div>
          <div className="capabilities">
            {capabilities.map((item) => (
              <article key={item.title}>
                <div className="capIcon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
                <span>{item.status}</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
