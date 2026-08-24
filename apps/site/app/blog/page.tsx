const posts = [
  ["Nhật ký giao dịch có giúp bạn kiếm tiền không?", "Một phương pháp đo lường thay vì chỉ ghi chép cảm xúc."],
  ["Chi phí ẩn trong mỗi lần mua bán", "Cách phí và thuế làm thay đổi hiệu suất thực."],
  ["Backtest không phải lời tiên tri", "Những lỗi phổ biến khi đọc một chiến lược có kết quả quá đẹp."],
];

export default function BlogPage() {
  return <main><nav><strong>TradeCheck</strong><div><a href="/">Trang chủ</a><a href="/blog">Góc kiến thức</a></div></nav><section className="blog"><p className="eyebrow">GÓC KIẾN THỨC</p><h1>Hiểu dữ liệu trước khi ra quyết định.</h1><div className="posts">{posts.map(([title,copy],index)=><article key={title}><span>0{index+1}</span><h2>{title}</h2><p>{copy}</p><a href="#">Đọc bài →</a></article>)}</div></section></main>;
}
