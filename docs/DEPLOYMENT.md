# Triển khai trên VPS 2 vCPU / 4 GB và Vercel

## Giai đoạn đầu

- `www.tradecheck.vn`: `apps/site` trên Vercel.
- `app.tradecheck.vn`: `apps/web` trên Vercel.
- `api.tradecheck.vn`: reverse proxy HTTPS đến Gateway port 8080 trên VPS.
- PostgreSQL: cùng VPS, private network, không publish port.
- Vibe-Trading: chưa chạy trên VPS chính; dùng provider cloud hoặc worker riêng.

## VPS

1. Cài Docker Engine và Compose v2 trên Ubuntu 22.04.
2. Tạo `.env` production với secret sinh ngẫu nhiên.
3. Chạy `docker compose -f infrastructure/docker/compose.yml up -d`.
4. Dùng Caddy/Nginx/Cloudflare proxy `api.tradecheck.vn` về `127.0.0.1:8080`.
5. Chỉ mở 22/80/443; SSH dùng key, hạn chế IP nếu có thể.
6. Tạo 2 GB swap, log rotation và cảnh báo khi ổ trống dưới 10 GB.

## Backup

Snapshot hàng tuần của nhà cung cấp không thay thế backup database. Chạy
`pg_dump` hằng ngày, mã hóa, chuyển ra object storage và giữ 7–14 phiên bản.
Thực hiện restore drill định kỳ.

## Vercel

Tạo hai project, root directory lần lượt là `apps/site` và `apps/web`. Frontend
chỉ nhận `NEXT_PUBLIC_API_BASE_URL`; không đưa service token/JWT secret lên
biến `NEXT_PUBLIC_*`.

## Tài nguyên

Gateway + PostgreSQL phù hợp VPS hiện tại. TradeTally rút gọn có thể được thêm
sau khi đo RAM thực tế. Vibe-Trading Docker tự dành tới 2 CPU/4 GB nên phải là
worker riêng hoặc dịch vụ on-demand.
