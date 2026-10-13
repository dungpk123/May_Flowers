"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Product, SiteData } from "@shop-flower/data";

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0
});

const priceRanges = [
  { label: "Tất cả giá", min: 0, max: Infinity },
  { label: "Dưới 600.000đ", min: 0, max: 600000 },
  { label: "600.000đ - 1.100.000đ", min: 600000, max: 1100000 },
  { label: "1.100.000đ - 2.000.000đ", min: 1100000, max: 2000000 },
  { label: "Trên 2.000.000đ", min: 2000000, max: Infinity }
];

export default function CategoryPageClient({
  data,
  initialCategory
}: {
  data: SiteData;
  initialCategory?: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory ?? "Tất cả");
  const [priceRange, setPriceRange] = useState("Tất cả giá");
  const [sort, setSort] = useState("default");

  useEffect(() => {
    if (initialCategory) return;

    const urlCategory = new URLSearchParams(window.location.search).get("category");
    if (urlCategory) setCategory(urlCategory);
  }, [initialCategory]);

  const filteredProducts = useMemo(() => {
    const range = priceRanges.find((item) => item.label === priceRange) ?? priceRanges[0];
    const normalizedQuery = query.trim().toLowerCase();

    const result = data.products.filter((product) => {
      const price = product.price ?? 0;
      const matchesCategory = category === "Tất cả" || product.category === category;
      const matchesPrice = price >= range.min && price < range.max;
      const matchesQuery =
        !normalizedQuery ||
        `${product.name} ${product.category} ${product.description ?? ""}`
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesPrice && matchesQuery;
    });

    return result.sort((a, b) => {
      if (sort === "price-asc") return (a.price ?? 0) - (b.price ?? 0);
      if (sort === "price-desc") return (b.price ?? 0) - (a.price ?? 0);
      if (sort === "name") return a.name.localeCompare(b.name, "vi");
      return a.id - b.id;
    });
  }, [category, data.products, priceRange, query, sort]);

  return (
    <main>
      <header className="site-header category-header">
        <a className="brand" href="/">
          <img src={data.assets.logo} alt={data.content.brandName || "Logo"} />
        </a>
        <label className="search-box">
          <Search size={19} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm kiếm sản phẩm"
          />
        </label>
      </header>

      <section className="catalog-layout">
        <aside className="catalog-sidebar">
          <h2>Lọc theo giá</h2>
          <div className="filter-list">
            {priceRanges.map((item) => (
              <label key={item.label}>
                <input
                  checked={priceRange === item.label}
                  onChange={() => setPriceRange(item.label)}
                  type="radio"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>

          <div className="filter-list category-filter-list">
            {["Tất cả", ...data.categories.map((item) => item.name)].map((item) => (
              <button
                className={category === item ? "active" : ""}
                key={item}
                onClick={() => setCategory(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </aside>

        <div className="catalog-main">
          <div className="catalog-toolbar">
            <p>{filteredProducts.length} sản phẩm</p>
            <label>
              <span>Sắp xếp</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="default">Mặc định</option>
                <option value="price-asc">Giá tăng dần</option>
                <option value="price-desc">Giá giảm dần</option>
                <option value="name">Tên A-Z</option>
              </select>
            </label>
          </div>

          <div className="product-grid catalog-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <a className="product-card" href={`/san-pham?id=${product.id}`}>
      <div className="product-image">
        {product.badge ? <span>{product.badge}</span> : null}
        <img src={product.image} alt={product.name} />
      </div>
      <div className="product-info">
        <p>{product.category}</p>
        <h3>{product.name}</h3>
        <strong>{product.price ? money.format(product.price) : "Liên hệ"}</strong>
        <em>Xem chi tiết</em>
      </div>
    </a>
  );
}
