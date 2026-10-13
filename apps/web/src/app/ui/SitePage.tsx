"use client";

import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search
} from "lucide-react";
import { useMemo, useState } from "react";
import { type Category, type Product, type SiteData } from "@shop-flower/data";

export type SiteView = "home" | "about" | "bouquets" | "fruit" | "blog" | "contact";

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0
});

function externalUrl(value: string) {
  const url = value.trim();
  if (!url) return "";
  if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
  return `https://${url}`;
}

function zaloUrl(value: string) {
  const url = value.trim();
  if (!url) return "";
  if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
  const digits = url.replace(/\D/g, "");
  return digits ? `https://zalo.me/${digits}` : externalUrl(url);
}

function phoneUrl(value: string) {
  const phone = value.trim();
  if (!phone) return "";
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export default function SitePage({ data, view }: { data: SiteData; view: SiteView }) {
  const [query, setQuery] = useState("");
  const visibleCategories = useMemo(
    () => sortCategories(data.categories.filter((category) => category.name.trim())),
    [data.categories]
  );

  const filteredProducts = useMemo(() => {
    const validProducts = data.products.filter(
      (product) => product.name.trim() || product.image.trim()
    );
    const baseProducts = filterProductsByView(validProducts, view);
    const q = query.trim().toLowerCase();
    if (!q) return baseProducts;

    return baseProducts.filter((product) =>
      `${product.name} ${product.category} ${product.description ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [data.products, query, view]);

  return (
    <main>
      <Header data={data} query={query} setQuery={setQuery} />
      <MainNav categories={visibleCategories} />

      {view === "home" ? (
        <>
          <Hero data={data} />
          <FloatingContact data={data} />
          <CategoryGrid categories={visibleCategories} />
          <ProductArea
            products={filteredProducts}
            title="Sản phẩm"
          />
          <Cta data={data} />
          <ArticleGrid data={data} compact />
        </>
      ) : null}

      {view === "about" ? (
        <ContentPage
          title={data.content.aboutTitle || "Giới thiệu"}
          content={data.content.aboutContent}
        />
      ) : null}

      {view === "bouquets" || view === "fruit" ? (
        <>
          <PageHero
            title={view === "bouquets" ? "Bó hoa" : "Giỏ trái cây"}
            data={data}
          />
          <ProductArea
            products={filteredProducts}
            title={view === "bouquets" ? "Bó hoa" : "Giỏ trái cây"}
          />
        </>
      ) : null}

      {view === "blog" ? (
        <>
          <PageHero title="Blog" data={data} />
          <ArticleGrid data={data} />
        </>
      ) : null}

      {view === "contact" ? (
        <ContentPage
          title={data.content.contactTitle || "Liên hệ"}
          content={data.content.contactContent}
          extra={
            <div className="contact-lines">
              {data.content.hotline ? <p>Số điện thoại: {data.content.hotline}</p> : null}
              {data.content.email ? <p>Email: {data.content.email}</p> : null}
              {data.content.address ? <p>Địa chỉ: {data.content.address}</p> : null}
            </div>
          }
        />
      ) : null}

      <Footer data={data} />
    </main>
  );
}

function Header({
  data,
  query,
  setQuery
}: {
  data: SiteData;
  query: string;
  setQuery: (value: string) => void;
}) {
  return (
    <header className="site-header">
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
  );
}

function MainNav({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <nav className="main-nav category-nav">
      {categories.map((category) => (
        <a href={`/bo-hoa?category=${encodeURIComponent(category.name)}`} key={category.id}>
          {category.name}
        </a>
      ))}
    </nav>
  );
}

function Hero({ data }: { data: SiteData }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const backgrounds = data.assets.backgroundImages?.length
    ? data.assets.backgroundImages
    : [data.assets.background];
  const slideCount = backgrounds.length;
  const goToSlide = (direction: -1 | 1) => {
    setActiveSlide((current) => (current + direction + slideCount) % slideCount);
  };

  return (
    <section className="hero hero-gallery">
      <div
        className="hero-backgrounds"
        style={{ transform: `translateX(-${activeSlide * 100}%)` }}
      >
        {backgrounds.map((image, index) => (
          <img
            alt=""
            key={`${image}-${index}`}
            src={image}
          />
        ))}
      </div>
      {slideCount > 1 ? (
        <>
          <button
            aria-label="Ảnh trước"
            className="hero-nav hero-nav-prev"
            onClick={() => goToSlide(-1)}
            type="button"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            aria-label="Ảnh sau"
            className="hero-nav hero-nav-next"
            onClick={() => goToSlide(1)}
            type="button"
          >
            <ChevronRight size={24} />
          </button>
        </>
      ) : null}
      <div className="hero-actions">
        <a className="primary-action" href="#products">
          Xem sản phẩm <ArrowRight size={18} />
        </a>
      </div>
    </section>
  );
}

function PageHero({ title, data }: { title: string; data: SiteData }) {
  return (
    <section
      className="page-hero"
      style={{
        backgroundImage: `url(${data.assets.background})`
      }}
    >
      <h1>{title}</h1>
    </section>
  );
}

function CategoryGrid({ categories }: { categories: Category[] }) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <>
      <SectionTitle title="Danh mục sản phẩm" />
      <section className="category-grid">
        {categories.map((category) => (
          <a className="category-card" href={`/bo-hoa?category=${encodeURIComponent(category.name)}`} key={category.id}>
            {category.image ? <img src={category.image} alt={category.name} /> : null}
            <strong>{category.name}</strong>
          </a>
        ))}
      </section>
    </>
  );
}

function ProductArea({
  products,
  title
}: {
  products: Product[];
  title: string;
}) {
  return (
    <div id="products">
      <section className="product-section">
        <SectionTitle title={title} />
        {products.length === 0 ? (
          <EmptyState text="Chưa có sản phẩm phù hợp." />
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <a className="product-card" href={`/san-pham?id=${product.id}`} key={product.id}>
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
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Cta({ data }: { data: SiteData }) {
  if (!data.content.ctaTitle && !data.content.ctaDescription) return null;

  return (
    <section className="custom-cta">
      <div>
        {data.content.ctaEyebrow ? <p>{data.content.ctaEyebrow}</p> : null}
        {data.content.ctaTitle ? <h2>{data.content.ctaTitle}</h2> : null}
        {data.content.ctaDescription ? <span>{data.content.ctaDescription}</span> : null}
      </div>
      {data.content.hotline ? (
        <a href={phoneUrl(data.content.hotline)} rel="noreferrer" target="_blank">
          Gửi yêu cầu ngay
        </a>
      ) : null}
    </section>
  );
}

function ArticleGrid({ data, compact = false }: { data: SiteData; compact?: boolean }) {
  if (data.articles.length === 0) {
    return compact ? null : <EmptyState text="Chưa có bài viết." />;
  }

  return (
    <>
      <SectionTitle title="Bài viết - Tin tức" />
      <section className="article-grid">
        {data.articles.map((article) => (
          <article className="article-card" key={article.id}>
            <img src={article.image} alt={article.title} />
            <div>
              <h3>{article.title}</h3>
              <p>{article.excerpt}</p>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}

function ContentPage({
  title,
  content,
  extra
}: {
  title: string;
  content: string;
  extra?: React.ReactNode;
}) {
  return (
    <section className="content-page">
      <h1>{title}</h1>
      {content ? <p>{content}</p> : <EmptyState text="Nội dung đang được cập nhật." />}
      {extra}
    </section>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="section-title">
      <span>
        <CheckCircle2 size={16} /> {title}
      </span>
      <span className="section-title-spacer" />
    </div>
  );
}

function Footer({ data }: { data: SiteData }) {
  return (
    <footer>
      <div>
        <h3>{data.content.footerTitle || data.content.brandName || "Website hoa"}</h3>
        {data.content.footerDescription ? <p>{data.content.footerDescription}</p> : null}
      </div>
      <div>
        <h4>Thông tin liên hệ</h4>
        {data.content.address ? <p>{data.content.address}</p> : null}
        {data.content.email ? <p>{data.content.email}</p> : null}
        {data.content.hotline ? <p>{data.content.hotline}</p> : null}
      </div>
      <div>
        <h4>Kết nối</h4>
        <div className="footer-socials">
          {data.content.zaloUrl ? (
            <a href={zaloUrl(data.content.zaloUrl)} rel="noreferrer" target="_blank">
              <img src={data.assets.zaloIcon} alt="Zalo" />
            </a>
          ) : null}
          {data.content.facebookUrl ? (
            <a href={externalUrl(data.content.facebookUrl)} rel="noreferrer" target="_blank">
              <img src={data.assets.facebookIcon} alt="Facebook" />
            </a>
          ) : null}
          {data.content.hotline ? (
            <a href={phoneUrl(data.content.hotline)} rel="noreferrer" target="_blank">
              <img src={data.assets.phoneIcon} alt="Số điện thoại" />
            </a>
          ) : null}
        </div>
      </div>
    </footer>
  );
}

function FloatingContact({ data }: { data: SiteData }) {
  return (
    <div className="floating-contact" aria-label="Liên hệ nhanh">
      {data.content.zaloUrl ? (
        <a href={zaloUrl(data.content.zaloUrl)} aria-label="Zalo" rel="noreferrer" target="_blank">
          <img src={data.assets.zaloIcon} alt="" />
        </a>
      ) : null}
      {data.content.facebookUrl ? (
        <a href={externalUrl(data.content.facebookUrl)} aria-label="Facebook" rel="noreferrer" target="_blank">
          <img src={data.assets.facebookIcon} alt="" />
        </a>
      ) : null}
      {data.content.hotline ? (
        <a href={phoneUrl(data.content.hotline)} aria-label="Số điện thoại" rel="noreferrer" target="_blank">
          <img src={data.assets.phoneIcon} alt="" />
        </a>
      ) : null}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="empty-state">{text}</p>;
}

function filterProductsByView(products: Product[], view: SiteView) {
  if (view === "bouquets") {
    return products.filter((product) => product.category.toLowerCase().includes("bó hoa"));
  }

  if (view === "fruit") {
    return products.filter((product) =>
      product.category.toLowerCase().includes("trái cây")
    );
  }

  return products;
}

function sortCategories(categories: Category[]) {
  return [...categories].sort(
    (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.id - b.id
  );
}
