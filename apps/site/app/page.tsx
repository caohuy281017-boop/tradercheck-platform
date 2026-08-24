export default function SitePage() {
  return (
    <main>
      <nav><strong>TradeCheck</strong><div><a href="#product">Sản phẩm</a><a href="/blog">Góc kiến thức</a><a className="button" href="https://app.tradecheck.vn">Mở ứng dụng</a></div></nav>
      <section className="hero">
        <p className="eyebrow">DỮ LIỆU CỦA BẠN · QUYẾT ĐỊNH CỦA BẠN</p>
        <h1>Đừng chỉ xem mình lãi hay lỗ.<br/><em>Hãy hiểu vì sao.</em></h1>
        <p className="lead">Nhập sao kê, đo hiệu suất thật sau chi phí và biến lịch sử giao dịch thành những bài học có thể hành động.</p>
        <div className="actions"><a className="primary" href="https://app.tradecheck.vn">Phân tích sao kê</a><a href="#product">Xem cách hoạt động</a></div>
      </section>
      <section className="features" id="product">
        <article><span>01</span><h2>Riêng tư từ thiết kế</h2><p>Sao kê được chuẩn hóa trong trình duyệt; hệ thống chỉ nhận dữ liệu cần thiết.</p></article>
        <article><span>02</span><h2>Hiệu suất thực</h2><p>Tách lợi nhuận gộp, phí, thuế và những hành vi đang làm giảm kết quả.</p></article>
        <article><span>03</span><h2>Mở rộng bằng module</h2><p>AI coach, backtest, scanner và tool hub được bật độc lập theo capability.</p></article>
      </section>
    </main>
  );
}
