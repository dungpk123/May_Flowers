"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Category, Product, SiteData } from "@shop-flower/data";
import { Footer } from "./SitePage";
import SiteHeadClient from "./SiteHeadClient";
import { useLiveSiteData } from "./useLiveSiteData";

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
  data: initialData,
  initialCategory
}: {
  data: SiteData;
  initialCategory?: string;
}) {
  const data = useLiveSiteData(initialData);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory ?? "Tất cả");
  const [priceRange, setPriceRange] = useState("Tất cả giá");
  const [sort, setSort] = useState("default");
  const sortedCategories = useMemo(() => sortCategories(data.categories), [data.categories]);
  const activeCategory = useMemo(
    () => sortedCategories.find((item) => item.name === category),
    [category, sortedCategories]
  );
  const sectionTitle =
    category === "Tất cả"
      ? "Sản phẩm"
      : activeCategory?.displayTitle || category;

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
      <SiteHeadClient data={data} />
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
            {["Tất cả", ...sortedCategories.map((item) => item.name)].map((item) => (
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
          <div className="section-title catalog-section-title">
            <span>{sectionTitle}</span>
            <span className="section-title-spacer" />
          </div>

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
      <Footer data={data} />
    </main>
  );
}

function sortCategories(categories: Category[]) {
  return [...categories]
    .filter((category) => category.name.trim())
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.id - b.id);
}

function ProductCard({ product }: { product: Product }) {
  return (
    <a className="product-card" href={`/san-pham?id=${product.id}`}>
      <div className="product-image">
        {product.badge ? <span>{product.badge}</span> : null}
        <img src={getProductImages(product)[0] ?? product.image} alt={product.name} />
      </div>
      <div className="product-info">
        <h3>{product.name}</h3>
        {product.price ? <strong>{money.format(product.price)}</strong> : null}
        <em>Xem chi tiết</em>
      </div>
    </a>
  );
}

function getProductImages(product: Product) {
  return [...(product.images ?? []), product.image].filter(
    (image, index, list): image is string =>
      typeof image === "string" && image.trim().length > 0 && list.indexOf(image) === index
  );
}
