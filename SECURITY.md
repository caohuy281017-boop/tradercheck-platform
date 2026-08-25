# Security baseline

## Trước khi có khách hàng thật

- Hoàn thiện threat model cho đăng nhập, upload, admin và AI worker.
- Thay `InMemoryRunLedger` bằng PostgreSQL append-only ledger.
- Tích hợp identity provider hoặc session service đã được kiểm định.
- Không phát hành endpoint tạo JWT công khai trong Gateway.
- Bật MFA/passkey cho admin và tách domain quản trị.
- Test mọi truy vấn theo tenant/user; RLS là lớp phòng thủ thứ hai.

## Dữ liệu sao kê

- Parser ưu tiên chạy trong Web Worker.
- Không gửi tên, số tài khoản, email hoặc file gốc nếu không cần.
- Từ chối XLSM và file có macro; giới hạn kích thước/mime/signature.
- Tạo fingerprint chống import trùng, không dùng nội dung file làm log.
- CSV export phải chống formula injection.
- Nếu lưu file phục vụ hỗ trợ, mã hóa và có TTL xóa tự động.

## Network và secrets

- Chỉ reverse proxy được mở cổng 443; Gateway bind localhost trên VPS.
- PostgreSQL và upstream service ở private Docker network.
- CORS allowlist chính xác, không dùng wildcard với credentials.
- TLS/HSTS/CSP, rate limit, request size limit và request ID bắt buộc.
- Secret không nằm trong Git, log hoặc frontend environment.
- Mỗi adapter có token riêng và quyền tối thiểu; hỗ trợ xoay vòng.

## AI và generated code

- Backtest chạy worker/VM riêng với root filesystem read-only.
- Không mount socket Docker, home directory hoặc production secrets.
- Giới hạn CPU, RAM, PID, thời gian và network egress.
- Chỉ read-only market/broker connector; đặt lệnh mặc định bị cấm.
- Tool rủi ro cao cần approval rõ ràng và ledger đầy đủ.
- Kết quả hiển thị nguồn, thời điểm dữ liệu và cảnh báo không phải tư vấn.

## Vận hành

- Dependency/container scan trong CI; không auto-deploy upstream.
- Backup PostgreSQL hằng ngày ra nơi khác, mã hóa và test restore.
- Dùng image pin theo digest/tag; log rotation và disk alert.
- Có staging, canary/blue-green và rollback image.
- Migration theo expand → migrate → contract; không migration phá hủy cùng release.
