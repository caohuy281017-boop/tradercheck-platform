# TradeCheck Platform

Nền tảng phân tích giao dịch theo kiến trúc modular. TradeTally và
Vibe-Trading được xem là các engine phía sau adapter; frontend, hợp đồng API,
module Việt Nam, bảo mật và dữ liệu sản phẩm thuộc TradeCheck.

## Mục tiêu của scaffold

- Không fork hoặc đổi tên nguyên giao diện upstream.
- Không sửa rải rác mã nguồn TradeTally/Vibe-Trading.
- Pin phiên bản upstream và chỉ nâng cấp sau contract test.
- Frontend mới chạy trên Vercel; Gateway/PostgreSQL chạy trên VPS.
- Module AI/backtest chạy như worker độc lập khi được bật.
- Mọi capability có manifest, scope, plan, risk level và approval policy.

## Chạy local

```bash
cp .env.example .env
pnpm install
pnpm check
pnpm dev
```

- Web app: `http://localhost:3000`
- Gateway: `http://localhost:8080`
- Marketing/blog: `pnpm --filter @tradecheck/site dev` rồi mở
  `http://localhost:3001`

## Tài liệu

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/SECURITY.md`](docs/SECURITY.md)
- [`docs/UPSTREAM_SYNC.md`](docs/UPSTREAM_SYNC.md)
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- [`docs/ROADMAP.md`](docs/ROADMAP.md)

## Trạng thái

Đây là platform foundation chạy được, chưa phải sản phẩm production. Adapter
upstream mặc định không thực hiện tác vụ tài chính thật. Parser Việt Nam phải
được đối soát bằng sao kê đã ẩn danh trước khi mở cho khách hàng.
