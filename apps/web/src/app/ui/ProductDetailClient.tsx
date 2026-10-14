"use client";

import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  ImageIcon,
  RefreshCcw,
  ShoppingBag,
  Truck
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Product, SiteData } from "@shop-flower/data";
import { FloatingContact, Footer, Header } from "./SitePage";
import SiteHeadClient from "./SiteHeadClient";
import OrderModal from "./OrderModal";

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0
});

function zaloUrl(value: string) {
  const url = value.trim();
  if (!url) return "";
  if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
  const digits = url.replace(/\D/g, "");
  return digits ? `https://zalo.me/${digits}` : `https://${url}`;
}

function phoneUrl(value: string) {
  const phone = value.trim();
  if (!phone) return "";
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export default function ProductDetailClient({
  data,
  product
}: {
  data: SiteData;
  product: Product;
}) {
  const relatedProducts = useMemo(
    () =>
      data.products.filter(
        (item) => item.category === product.category && item.id !== product.id
      ),
    [data.products, product.category, product.id]
  );
  const productImages = useMemo(() => getProductImages(product), [product]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const activeImage = productImages[activeImageIndex] ?? productImages[0] ?? product.image;

  useEffect(() => {
    setActiveImageIndex(0);
    const params = new URLSearchParams(window.location.search);
    if (params.get("order") === "1" || params.get("dathang") === "1") {
      setIsOrderModalOpen(true);
    }
  }, [product.id]);

  function moveImage(direction: -1 | 1) {
    setActiveImageIndex((current) => {
      if (productImages.length === 0) return 0;
      return (current + direction + productImages.length) % productImages.length;
    });
  }

  return (
    <main>
      <SiteHeadClient data={data} />
      <Header data={data} query={query} setQuery={setQuery} />

      <section className="product-detail">
        <div className="product-gallery">
          <div className="product-detail-image">
            {product.badge ? <span>{product.badge}</span> : null}
            {productImages.length > 1 ? (
              <>
                <button
                  aria-label="Ảnh trước"
                  className="product-gallery-nav product-gallery-prev"
                  onClick={() => moveImage(-1)}
                  type="button"
                >
                  <ChevronLeft size={26} />
                </button>
                <button
                  aria-label="Ảnh sau"
                  className="product-gallery-nav product-gallery-next"
                  onClick={() => moveImage(1)}
                  type="button"
                >
                  <ChevronRight size={26} />
                </button>
              </>
            ) : null}
            {activeImage ? <img src={activeImage} alt={product.name} /> : null}
          </div>
          {productImages.length > 1 ? (
            <div className="product-thumbnails" aria-label="Ảnh sản phẩm">
              {productImages.map((image, index) => (
                <button
                  className={activeImageIndex === index ? "active" : ""}
                  key={`${image}-${index}`}
                  onClick={() => setActiveImageIndex(index)}
                  type="button"
                >
                  <img src={image} alt={`${product.name} ${index + 1}`} />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="product-detail-copy">
          <h1>{product.name}</h1>
          {product.price ? <strong>{money.format(product.price)}</strong> : null}

          <div className="product-detail-panel">
            <h2>Tiêu chí của chúng tôi</h2>
            <ul>
              <li>Giao hoa toàn quốc qua hệ thống đối tác địa phương.</li>
              <li>Xác nhận mẫu trước khi giao nếu khách hàng yêu cầu.</li>
              <li>Thiết kế theo dịp tặng, ngân sách và thông điệp riêng.</li>
              <li>Hỗ trợ tư vấn qua Zalo, Facebook và số điện thoại.</li>
            </ul>
          </div>

          {product.price ? (
            <button
              className="order-now-btn"
              onClick={() => setIsOrderModalOpen(true)}
              type="button"
            >
              <ShoppingBag size={22} />
              <div className="order-now-btn-text">
                <span className="order-now-btn-title">ĐẶT HÀNG NGAY</span>
                <span className="order-now-btn-desc">Giao nhanh 60 - 120 phút • Xác nhận mẫu trước khi giao</span>
              </div>
            </button>
          ) : null}

          <div className="product-contact-actions">
            {data.content.zaloUrl ? (
              <a
                className="zalo-action"
                href={zaloUrl(data.content.zaloUrl)}
                rel="noreferrer"
                target="_blank"
              >
                Nhắn Zalo
              </a>
            ) : null}
            {data.content.hotline ? (
              <a
                className="phone-action"
                href={phoneUrl(data.content.hotline)}
                rel="noreferrer"
                target="_blank"
              >
                Gọi {data.content.hotline}
              </a>
            ) : null}
          </div>
        </div>

        <CustomerBenefits />
      </section>

      {product.description ? <ProductDescription text={product.description} /> : null}

      <RelatedProductsSection money={money} products={relatedProducts} />

      {product.price ? (
        <OrderModal
          data={data}
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          product={product}
        />
      ) : null}
      <FloatingContact data={data} />
      <Footer data={data} />
    </main>
  );
}

function getProductImages(product: Product) {
  return [...(product.images ?? []), product.image].filter(
    (image, index, list): image is string =>
      typeof image === "string" && image.trim().length > 0 && list.indexOf(image) === index
  );
}

function CustomerBenefits() {
  const benefits = [
    {
      icon: Clock3,
      text: "Giao hoa cấp tốc trong vòng 60 - 120 phút"
    },
    {
      icon: Truck,
      text: "Miễn phí vận chuyển nội thành"
    },
    {
      icon: FileText,
      text: "Miễn phí thiệp, băng rôn trị giá 30,000đ"
    },
    {
      icon: ImageIcon,
      text: "Gửi hình trước và báo đơn hàng thành công"
    },
    {
      icon: RefreshCcw,
      text: "Đổi trả 100% nếu không hài lòng"
    },
    {
      icon: BadgeCheck,
      text: "Cam kết hoa tươi 3+ ngày"
    }
  ];

  return (
    <aside className="customer-benefits" aria-label="Quyền lợi khách hàng">
      <h2>Quyền lợi khách hàng</h2>
      <div className="customer-benefit-list">
        {benefits.map(({ icon: Icon, text }) => (
          <div className="customer-benefit-item" key={text}>
            <span className="customer-benefit-icon">
              <Icon size={25} />
            </span>
            <strong>{text}</strong>
          </div>
        ))}
      </div>
    </aside>
  );
}

function ProductDescription({ text }: { text: string }) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  return (
    <section className="product-description-section">
      <div className="product-description-tabs">
        <span>Mô tả</span>
      </div>
      <div className="product-description-content">
        {lines.map((line, index) => {
          const heading = line.match(/^(#{1,6})\s*(.+)$/);
          if (heading) {
            return heading[1].length <= 2 ? (
              <h2 key={`${line}-${index}`}>{renderInlineMarkdown(heading[2])}</h2>
            ) : (
              <h3 key={`${line}-${index}`}>{renderInlineMarkdown(heading[2])}</h3>
            );
          }

          if (/^[-*]\s+/.test(line)) {
            return (
              <p className="description-bullet" key={`${line}-${index}`}>
                {renderInlineMarkdown(line.replace(/^[-*]\s+/, ""))}
              </p>
            );
          }

          return <p key={`${line}-${index}`}>{renderInlineMarkdown(line)}</p>;
        })}
      </div>
    </section>
  );
}

function renderInlineMarkdown(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    return part;
  });
}

function RelatedProductsSection({
  products,
  money
}: {
  products: Product[];
  money: Intl.NumberFormat;
}) {
  if (products.length === 0) return null;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    const updateVisibleCount = () => {
      const width = window.innerWidth;
      if (width < 500) {
        setVisibleCount(2);
      } else if (width < 768) {
        setVisibleCount(3);
      } else if (width < 1024) {
        setVisibleCount(4);
      } else {
        setVisibleCount(5);
      }
    };

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  const total = products.length;
  const isSlider = total > 5;
  const maxIndex = Math.max(0, total - visibleCount);

  useEffect(() => {
    if (!isSlider || isHovered || maxIndex <= 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4000);

    return () => clearInterval(interval);
  }, [isSlider, isHovered, maxIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 40) {
      handleNext();
    } else if (diff < -40) {
      handlePrev();
    }
    setTouchStart(null);
  };

  const safeIndex = Math.min(currentIndex, maxIndex);

  return (
    <section className="related-products-section">
      <div className="related-products-header">
        <h2>Sản phẩm tương tự</h2>
      </div>

      {!isSlider ? (
        <div className="product-grid related-product-grid">
          {products.map((item) => (
            <RelatedProductCard item={item} key={item.id} money={money} />
          ))}
        </div>
      ) : (
        <div
          className="related-slider-container"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchEnd={onTouchEnd}
          onTouchStart={onTouchStart}
        >
          <button
            aria-label="Sản phẩm trước"
            className="related-slider-arrow related-slider-prev"
            onClick={handlePrev}
            type="button"
          >
            <ChevronLeft size={22} />
          </button>

          <div className="related-slider-viewport">
            <div
              className="related-slider-track"
              style={{
                transform: `translateX(calc(-${safeIndex} * (100% + 16px) / ${visibleCount}))`
              }}
            >
              {products.map((item) => (
                <div
                  className="related-slider-card-wrap"
                  key={item.id}
                  style={{
                    flex: `0 0 calc((100% - ${(visibleCount - 1) * 16}px) / ${visibleCount})`,
                    minWidth: `calc((100% - ${(visibleCount - 1) * 16}px) / ${visibleCount})`,
                    maxWidth: `calc((100% - ${(visibleCount - 1) * 16}px) / ${visibleCount})`
                  }}
                >
                  <RelatedProductCard item={item} money={money} />
                </div>
              ))}
            </div>
          </div>

          <button
            aria-label="Sản phẩm sau"
            className="related-slider-arrow related-slider-next"
            onClick={handleNext}
            type="button"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      )}
    </section>
  );
}

function RelatedProductCard({
  item,
  money
}: {
  item: Product;
  money: Intl.NumberFormat;
}) {
  return (
    <a className="product-card related-product-card" href={`/san-pham?id=${item.id}`}>
      <div className="product-image">
        {item.badge ? <span>{item.badge}</span> : null}
        <img src={getProductImages(item)[0] ?? item.image} alt={item.name} />
      </div>
      <div className="product-info">
        <h3>{item.name}</h3>
        {item.price ? <strong>{money.format(item.price)}</strong> : null}
        <em>Xem chi tiết</em>
      </div>
    </a>
  );
}
