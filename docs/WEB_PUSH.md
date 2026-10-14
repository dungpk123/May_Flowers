# Bật thông báo đơn hàng cho PWA quản trị

## 1. Tạo VAPID keys

Chạy một lần ở máy phát triển:

```bash
npx web-push generate-vapid-keys
```

Giữ kín `privateKey`. Không commit key vào Git và không đưa private key vào frontend.

## 2. Cấu hình API trên Render

Trong Render service `shop-flower-api`, thêm các Environment Variables:

```text
VAPID_SUBJECT=mailto:admin@mayflowers.shop
VAPID_PUBLIC_KEY=<publicKey được tạo ở bước 1>
VAPID_PRIVATE_KEY=<privateKey được tạo ở bước 1>
WEB_ORIGIN=https://mayflowers.shop,http://localhost:3000
```

Sau đó bấm **Manual Deploy** để API chạy lại. Kiểm tra:

```text
https://shop-flower-api.onrender.com/push/config
```

Kết quả đúng có dạng `{"enabled":true,"publicKey":"..."}`.

## 3. Cài PWA và bật thông báo

1. Mở `https://mayflowers.shop/admin` bằng Chrome hoặc Edge.
2. Bấm **Cài PWA** và hoàn tất cài đặt.
3. Bấm **Bật thông báo đơn hàng** rồi chọn **Cho phép**.
4. Giữ máy có Internet. Khi khách đặt hàng, API sẽ gửi thông báo đến các thiết bị đã bật.

Thông báo Web Push chỉ hoạt động trên HTTPS hoặc `localhost`. Nếu trình duyệt đã từng chặn quyền, hãy mở quyền thông báo của website và cho phép lại.
