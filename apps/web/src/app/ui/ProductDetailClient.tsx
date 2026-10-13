"use client";

import { Search } from "lucide-react";
import { useMemo } from "react";
import type { Product, SiteData } from "@shop-flower/data";

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
      data.products
        .filter((item) => item.category === product.category && item.id !== product.id)
        .slice(0, 4),
    [data.products, product.category, product.id]
  );

  return (
    <main>
      <header className="site-header detail-header">
        <a className="brand detail-brand" href="/">
          <img src={data.assets.logo} alt={data.content.brandName || "Logo"} />
        </a>
        <label className="search-box">
          <Search size={19} />
          <input placeholder="Tìm kiếm sản phẩm" />
        </label>
      </header>

      <section className="product-detail">
        <div className="product-detail-image">
          {product.badge ? <span>{product.badge}</span> : null}
          <img src={product.image} alt={product.name} />
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
      </section>

      {product.description ? <ProductDescription text={product.description} /> : null}

      {relatedProducts.length > 0 ? (
        <section className="related-products">
          <h2>Sản phẩm tương tự</h2>
          <div className="product-grid">
            {relatedProducts.map((item) => (
              <a className="product-card" href={`/san-pham?id=${item.id}`} key={item.id}>
                <div className="product-image">
                  {item.badge ? <span>{item.badge}</span> : null}
                  <img src={item.image} alt={item.name} />
                </div>
                <div className="product-info">
                  <h3>{item.name}</h3>
                  {item.price ? <strong>{money.format(item.price)}</strong> : null}
                  <em>Xem chi tiết</em>
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </main>
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
