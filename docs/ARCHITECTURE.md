# Kiến trúc TradeCheck Platform

## Quyết định nền tảng

TradeCheck không fork 100% giao diện hoặc backend của bất kỳ upstream nào.
Mỗi upstream là một provider phía sau adapter. Frontend chỉ biết API versioned
của Gateway.

```text
Vercel
  site/blog ----\
  web app ------- Gateway (VPS) ---- TradeTally adapter ---- TradeTally
                         |\
                         | +--------- Vibe adapter -------- AI worker
                         +----------- Vietnam extension --- PostgreSQL
```

## Ranh giới

- `apps/web`: ứng dụng khách hàng; không chứa service secret.
- `apps/site`: landing page và blog; không có quyền đọc dữ liệu giao dịch.
- `services/gateway`: public API duy nhất, xác thực và policy enforcement.
- `packages/harness`: registry, policy, approval và run ledger contract.
- `packages/providers`: adapter HTTP/MCP, không chứa nghiệp vụ UI.
- `packages/parsers`: code thuần, có thể chạy trong Web Worker hoặc backend.
- `extensions/vietnam`: sàn, broker, phí/thuế và capability Việt Nam.
- `upstream`: chỉ chứa manifest phiên bản, không sửa mã upstream tại đây.

## Quy tắc dependency

1. Apps có thể phụ thuộc contracts; không phụ thuộc source của upstream.
2. Gateway phụ thuộc harness/providers/extensions.
3. Extension không được truy cập trực tiếp bảng nội bộ của TradeTally.
4. Adapter chuyển response upstream thành contract ổn định của TradeCheck.
5. Tool AI/backtest luôn asynchronous và fail-closed khi provider chưa cấu hình.

## Capability manifest

Mỗi tính năng khai báo `id`, provider, scope, plan, risk level, approval,
async và enabled. Chính sách được kiểm tra trước khi handler chạy. Route không
tự suy luận quyền từ UI.

## Database

PostgreSQL có schema `tradecheck`. Không sửa migration upstream. Dữ liệu mở
rộng liên kết bằng ID ổn định qua `trade_extensions`. Mỗi transaction của ứng
dụng phải đặt `SET LOCAL app.user_id = '<id>'` trước truy vấn để RLS hoạt động.

## AI

AI Orchestrator là một nhóm capability trong Harness, không phải quyền truy cập
tự do. Worker Vibe-Trading chạy ngoài VPS chính, chỉ nhận snapshot tối thiểu,
không có database credential và không có quyền đặt lệnh.
