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
          <p>{product.category}</p>
          <h1>{product.name}</h1>
          <strong>{product.price ? money.format(product.price) : "Liên hệ"}</strong>
          {product.description ? <span>{product.description}</span> : null}

          <div className="product-detail-panel">
            <h2>Thông tin dịch vụ</h2>
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
                  <p>{item.category}</p>
                  <h3>{item.name}</h3>
                  <strong>{item.price ? money.format(item.price) : "Liên hệ"}</strong>
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
