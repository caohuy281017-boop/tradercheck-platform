# TradeCheck Platform — bàn giao foundation

## Đã hoàn thành

- Monorepo sạch, không dựa trên giao diện Hisaab/TradeTally.
- Frontend ứng dụng mới và site/blog tách project Vercel.
- Gateway Fastify với Helmet, CORS allowlist, rate limit, JWT và log redaction.
- Capability Registry có scope, plan, risk, approval, async và feature flag.
- HTTP adapter fail-closed cho TradeTally và Vibe-Trading.
- Extension Việt Nam và parser VNDIRECT fixture tổng hợp.
- PostgreSQL schema riêng, audit/AI run/trade extension cùng RLS nền.
- Docker Compose VPS, CI, upstream version manifest và tài liệu vận hành.

## Đã xác minh

- 7/7 test đạt.
- Gateway TypeScript build đạt.
- Frontend ứng dụng build production đạt.
- Landing/blog build production đạt.
- `pnpm audit --audit-level high`: không phát hiện lỗ hổng đã biết.
- Git commit foundation: `f9925fe` (commit bàn giao có thể thay đổi nếu file này
  được commit bổ sung).

## Chưa được phép coi là production

- `InMemoryRunLedger` phải chuyển sang PostgreSQL repository.
- Chưa có identity/session production hoặc màn hình đăng nhập.
- Adapter mới kiểm tra health; chưa map API nghiệp vụ TradeTally/Vibe-Trading.
- Async job queue chưa được triển khai.
- Parser chưa đối soát sao kê thật.
- Docker Compose chưa chạy trong môi trường làm việc vì không có Docker daemon;
  cần kiểm tra thực tế trên VPS Ubuntu 22.04.
- Chưa cấu hình domain, Vercel, reverse proxy, backup và monitoring thật.

## Input cần từ chủ dự án

1. Domain dự kiến và quyền quản trị DNS/Vercel.
2. Sao kê VNDIRECT/SSI/VPS/TCBS đã ẩn danh.
3. Lựa chọn identity provider hoặc quy trình đăng nhập mong muốn.
4. Chọn cổng thanh toán và gói giá cho pilot.
5. Quyết định chạy TradeTally như service riêng hay chỉ tái sử dụng một số API.
