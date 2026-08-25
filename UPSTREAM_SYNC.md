# Cập nhật TradeTally và Vibe-Trading

## Nguyên tắc

- `upstream/versions.json` là nguồn sự thật cho phiên bản đang chấp nhận.
- Không dùng `latest` trong production.
- Không merge tự động bản upstream mới vào production.
- Adapter/contract test là hàng rào tương thích.

## Quy trình

1. Tạo issue nâng cấp, ghi phiên bản cũ/mới và changelog liên quan.
2. Cập nhật image/package trong môi trường staging.
3. Chạy health check và contract test các endpoint đang sử dụng.
4. Khôi phục database production đã ẩn danh vào staging và chạy migration dry-run.
5. Chạy fixture parser, analytics reconciliation và permission tests.
6. Quan sát staging ít nhất 24 giờ với error budget rõ ràng.
7. Backup production và deploy canary.
8. Cập nhật `versions.json` chỉ sau khi nghiệm thu.

## Nếu buộc phải sửa upstream

Giữ một fork mirror riêng và một patch stack nhỏ. Mỗi patch chỉ làm một việc,
có test, và không chứa code TradeCheck không liên quan. Feature Việt Nam vẫn
đặt ở extension; patch upstream chủ yếu thêm hook hoặc endpoint adapter.

## Contract tối thiểu

- Health endpoint.
- Auth token validation/refresh.
- Trade/portfolio read contract.
- Import acknowledgement và idempotency.
- Job submit/status/cancel đối với AI/backtest.
- Error code ổn định, timeout và retry policy.
