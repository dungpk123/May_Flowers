"use client";

import {
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Minus,
  Phone,
  Plus,
  Send,
  ShoppingBag,
  User,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Order, Product, SiteData } from "@shop-flower/data";
import { publicApiUrl } from "../apiConfig";

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0
});

function cleanDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatPhoneDisplay(value: string) {
  const digits = cleanDigits(value);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
}

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const timeSlotOptions = [
  "Giao càng sớm càng tốt (60 - 120 phút)",
  "08:00 - 10:00",
  "10:00 - 12:00",
  "13:00 - 15:00",
  "15:00 - 17:00",
  "17:00 - 19:00",
  "19:00 - 21:00"
];

export default function OrderModal({
  isOpen,
  onClose,
  product,
  data
}: {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  data: SiteData;
}) {
  const [quantity, setQuantity] = useState(1);
  const [ordererName, setOrdererName] = useState("");
  const [ordererPhone, setOrdererPhone] = useState("");
  const [ordererEmail, setOrdererEmail] = useState("");

  const [isSameRecipient, setIsSameRecipient] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");

  const [deliveryDate, setDeliveryDate] = useState(getTodayString());
  const [deliveryTime, setDeliveryTime] = useState(timeSlotOptions[0]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [message, setMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);

  // Sync recipient with orderer when checkbox is active
  useEffect(() => {
    if (isSameRecipient) {
      setRecipientName(ordererName);
      setRecipientPhone(ordererPhone);
    }
  }, [isSameRecipient, ordererName, ordererPhone]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  // Reset states when reopening or switching products
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setErrorMessage("");
      setSubmittedOrder(null);
    }
  }, [isOpen, product.id]);

  const price = product.price ?? 0;
  const totalAmount = useMemo(() => price * quantity, [price, quantity]);

  function handleQuantityChange(delta: number) {
    setQuantity((prev) => Math.max(1, prev + delta));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessage("");

    const trimmedOrdererName = ordererName.trim();
    const trimmedOrdererPhone = ordererPhone.trim();
    const trimmedRecipientName = (isSameRecipient ? ordererName : recipientName).trim();
    const trimmedRecipientPhone = (isSameRecipient ? ordererPhone : recipientPhone).trim();
    const trimmedAddress = deliveryAddress.trim();

    if (!trimmedOrdererName) {
      setErrorMessage("Vui lòng nhập họ tên người đặt.");
      return;
    }
    if (!trimmedOrdererPhone || cleanDigits(trimmedOrdererPhone).length < 9) {
      setErrorMessage("Vui lòng nhập số điện thoại người đặt hợp lệ (tối thiểu 9 số).");
      return;
    }
    if (!trimmedRecipientName) {
      setErrorMessage("Vui lòng nhập họ tên người nhận hoa.");
      return;
    }
    if (!trimmedRecipientPhone || cleanDigits(trimmedRecipientPhone).length < 9) {
      setErrorMessage("Vui lòng nhập số điện thoại người nhận hoa hợp lệ.");
      return;
    }
    if (!deliveryDate) {
      setErrorMessage("Vui lòng chọn ngày giao hoa.");
      return;
    }
    if (!trimmedAddress) {
      setErrorMessage("Vui lòng nhập địa chỉ nhận hoa cụ thể.");
      return;
    }

    setIsSubmitting(true);

    const orderPayload = {
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      productPrice: price,
      quantity,
      totalAmount,
      ordererName: trimmedOrdererName,
      ordererPhone: trimmedOrdererPhone,
      ordererEmail: ordererEmail.trim() || undefined,
      isSameRecipient,
      recipientName: trimmedRecipientName,
      recipientPhone: trimmedRecipientPhone,
      deliveryDate,
      deliveryTime,
      deliveryAddress: trimmedAddress,
      message: message.trim() || undefined
    };

    let createdOrder: Order | null = null;

    try {
      const response = await fetch(`${publicApiUrl}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });

      if (response.ok) {
        createdOrder = await response.json();
      }
    } catch (err) {
      console.warn("Lỗi gửi đơn hàng lên server API, sẽ lưu vào bộ nhớ cục bộ:", err);
    }

    // Fallback if API was unavailable
    if (!createdOrder) {
      createdOrder = {
        id: `local_${Date.now()}`,
        orderCode: `MF-${Date.now().toString().slice(-6)}`,
        status: "pending",
        createdAt: new Date().toISOString(),
        ...orderPayload
      };
    }

    // Save to local storage backup
    try {
      const rawStored = window.localStorage.getItem("shop-flower-orders");
      const list: Order[] = rawStored ? JSON.parse(rawStored) : [];
      window.localStorage.setItem(
        "shop-flower-orders",
        JSON.stringify([createdOrder, ...list.filter((item) => item.id !== createdOrder?.id)])
      );
    } catch {
      // LocalStorage error ignore
    }

    setIsSubmitting(false);
    setSubmittedOrder(createdOrder);
  }

  if (!isOpen) return null;

  const hotlineDigits = cleanDigits(data.content.hotline || "0832591267");
  const zaloTarget = cleanDigits(data.content.zaloUrl || data.content.hotline || "0832591267");

  return (
    <div className="order-modal-backdrop" onClick={onClose} role="presentation">
      <div
        aria-modal="true"
        className="order-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        {/* Header */}
        <div className="order-modal-header">
          <h3>{product.name}</h3>
          <button
            aria-label="Đóng"
            className="order-modal-close"
            onClick={onClose}
            type="button"
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        {submittedOrder ? (
          <div className="order-modal-success">
            <div className="success-icon-wrap">
              <CheckCircle2 size={68} />
            </div>
            <h2>ĐẶT HÀNG THÀNH CÔNG!</h2>
            <p className="order-code-badge">
              Mã đơn hàng: <strong>#{submittedOrder.orderCode}</strong>
            </p>
            <p className="success-thankyou">
              Cảm ơn quý khách đã tin tưởng <strong>{data.content.brandName || "Mây Flowers"}</strong>. Đội ngũ tư vấn sẽ liên hệ ngay qua điện thoại/Zalo để xác nhận đơn và gửi ảnh thực tế trước khi giao.
            </p>

            <div className="order-summary-box">
              <div className="summary-row">
                <span>Sản phẩm:</span>
                <strong>{submittedOrder.productName} (x{submittedOrder.quantity})</strong>
              </div>
              <div className="summary-row">
                <span>Tạm tính:</span>
                <strong className="summary-price">{money.format(submittedOrder.totalAmount)}</strong>
              </div>
              <div className="summary-row">
                <span>Người nhận:</span>
                <span>{submittedOrder.recipientName} - {submittedOrder.recipientPhone}</span>
              </div>
              <div className="summary-row">
                <span>Giao lúc:</span>
                <span>{submittedOrder.deliveryTime} • {submittedOrder.deliveryDate}</span>
              </div>
              <div className="summary-row">
                <span>Địa chỉ:</span>
                <span>{submittedOrder.deliveryAddress}</span>
              </div>
              {submittedOrder.message ? (
                <div className="summary-row">
                  <span>Thông điệp:</span>
                  <em>&ldquo;{submittedOrder.message}&rdquo;</em>
                </div>
              ) : null}
            </div>

            <div className="success-action-buttons">
              {zaloTarget ? (
                <a
                  className="btn-success-zalo"
                  href={`https://zalo.me/${zaloTarget}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Send size={18} />
                  Nhắn Zalo xác nhận đơn #{submittedOrder.orderCode}
                </a>
              ) : null}
              {hotlineDigits ? (
                <a className="btn-success-phone" href={`tel:${hotlineDigits}`}>
                  <Phone size={18} />
                  Gọi Hotline {data.content.hotline}
                </a>
              ) : null}
              <button className="btn-success-close" onClick={onClose} type="button">
                Tiếp tục xem sản phẩm
              </button>
            </div>
          </div>
        ) : (
          <form className="order-modal-body" onSubmit={handleSubmit}>
            {/* Left Column: Product Summary & Stepper */}
            <div className="order-modal-product">
              <div className="order-product-image-wrap">
                <img src={product.image} alt={product.name} />
              </div>
              <h4 className="order-product-title">{product.name}</h4>
              <p className="order-product-price">{money.format(price)}</p>

              <div className="order-quantity-row">
                <span className="order-qty-label">Số lượng:</span>
                <div className="order-qty-stepper">
                  <button
                    aria-label="Giảm số lượng"
                    disabled={quantity <= 1}
                    onClick={() => handleQuantityChange(-1)}
                    type="button"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="order-qty-display">{quantity}</span>
                  <button
                    aria-label="Tăng số lượng"
                    onClick={() => handleQuantityChange(1)}
                    type="button"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="order-subtotal-card">
                <span>Tạm tính:</span>
                <strong>{money.format(totalAmount)}</strong>
              </div>

              <ul className="order-guarantees">
                <li>Giao hoa cấp tốc 60 - 120 phút</li>
                <li>Gửi ảnh chụp trước & báo giao thành công</li>
                <li>Tặng kèm thiệp & băng rôn trị giá 30.000đ</li>
                <li>Cam kết đổi trả 100% nếu hoa không tươi</li>
              </ul>
            </div>

            {/* Right Column: Order Form Inputs */}
            <div className="order-modal-form-fields">
              {errorMessage ? (
                <div className="order-form-error">{errorMessage}</div>
              ) : null}

              {/* Row 1: Orderer Info (2 cols) */}
              <div className="order-form-grid-2">
                <label className="order-field">
                  <span className="order-field-label">
                    <User size={14} /> Họ tên người đặt <strong className="req">*</strong>
                  </span>
                  <input
                    placeholder="Nguyễn Văn A"
                    required
                    type="text"
                    value={ordererName}
                    onChange={(e) => setOrdererName(e.target.value)}
                  />
                </label>

                <label className="order-field">
                  <span className="order-field-label">
                    <Phone size={14} /> Điện thoại người đặt <strong className="req">*</strong>
                  </span>
                  <input
                    placeholder="09xxx"
                    required
                    type="tel"
                    value={ordererPhone}
                    onChange={(e) => setOrdererPhone(e.target.value)}
                  />
                </label>
              </div>

              {/* Row 2: Email */}
              <label className="order-field">
                <span className="order-field-label">
                  <Mail size={14} /> Email nhận hóa đơn
                </span>
                <input
                  placeholder="email@example.com"
                  type="email"
                  value={ordererEmail}
                  onChange={(e) => setOrdererEmail(e.target.value)}
                />
              </label>

              {/* Row 3: Checkbox "Tôi cũng là người nhận hoa" */}
              <div className="order-checkbox-card">
                <label className="order-checkbox-label">
                  <input
                    checked={isSameRecipient}
                    type="checkbox"
                    onChange={(e) => setIsSameRecipient(e.target.checked)}
                  />
                  <span>Tôi cũng là người nhận hoa</span>
                </label>
              </div>

              {/* Row 4: Recipient Info (2 cols) */}
              <div className="order-form-grid-2">
                <label className="order-field">
                  <span className="order-field-label">
                    Họ tên người nhận <strong className="req">*</strong>
                  </span>
                  <input
                    disabled={isSameRecipient}
                    placeholder="Họ và tên người nhận"
                    required
                    type="text"
                    value={isSameRecipient ? ordererName : recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                  />
                </label>

                <label className="order-field">
                  <span className="order-field-label">
                    SĐT người nhận <strong className="req">*</strong>
                  </span>
                  <input
                    disabled={isSameRecipient}
                    placeholder="Số điện thoại người nhận"
                    required
                    type="tel"
                    value={isSameRecipient ? ordererPhone : recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                  />
                </label>
              </div>

              {/* Row 5: Delivery Date & Time (2 cols) */}
              <div className="order-form-grid-2">
                <label className="order-field">
                  <span className="order-field-label">
                    <Calendar size={14} /> Ngày giao <strong className="req">*</strong>
                  </span>
                  <input
                    min={getTodayString()}
                    required
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </label>

                <label className="order-field">
                  <span className="order-field-label">
                    <Clock size={14} /> Giờ giao <strong className="req">*</strong>
                  </span>
                  <select
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                  >
                    {timeSlotOptions.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Row 6: Delivery Address */}
              <label className="order-field">
                <span className="order-field-label">
                  <MapPin size={14} /> Địa chỉ nhận hoa <strong className="req">*</strong>
                </span>
                <input
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
                  required
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </label>

              {/* Row 7: Greeting Message */}
              <label className="order-field">
                <span className="order-field-label">
                  Thông điệp / Lời chúc mừng
                </span>
                <textarea
                  placeholder="Ví dụ: Chúc mừng sinh nhật bà xã, Chúc công ty khai trương hồng phát..."
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </label>

              {/* Submit Button */}
              <button
                className="order-submit-btn"
                disabled={isSubmitting}
                type="submit"
              >
                <ShoppingBag size={20} />
                <span>{isSubmitting ? "ĐANG XỬ LÝ ĐƠN HÀNG..." : "XÁC NHẬN ĐẶT HÀNG"}</span>
              </button>

              <p className="order-form-footnote">
                Hình thức thanh toán: Trả khi nhận hàng (COD) hoặc Chuyển khoản ngân hàng. Nhân viên sẽ liên hệ xác nhận chi tiết.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
