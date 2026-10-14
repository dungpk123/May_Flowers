"use client";

import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { type Category, type Product, type SiteData } from "@shop-flower/data";
import SiteHeadClient from "./SiteHeadClient";

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
      (product) => product.name.trim() || getProductImages(product).length > 0
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
  const displayProducts = useMemo(() => [...filteredProducts].reverse(), [filteredProducts]);
  const newProducts = useMemo(
    () => displayProducts.filter((product) => isBadge(product, "mới")),
    [displayProducts]
  );
  const hotProducts = useMemo(
    () => displayProducts.filter((product) => isBadge(product, "hot")),
    [displayProducts]
  );

  return (
    <main>
      <SiteHeadClient data={data} />
      <Header data={data} query={query} setQuery={setQuery} />
      <MainNav categories={visibleCategories} />
      <FloatingContact data={data} />

      {view === "home" ? (
        <>
          <Hero data={data} />
          <CategoryGrid categories={visibleCategories} />
          <div id="products" />
          {newProducts.length > 0 ? (
            <ProductArea
              limit={10}
              moreHref="/bo-hoa"
              products={newProducts}
              title="Sản phẩm mới"
            />
          ) : null}
          {hotProducts.length > 0 ? (
            <ProductArea
              limit={10}
              moreHref="/bo-hoa"
              products={hotProducts}
              title="Sản phẩm hot"
            />
          ) : null}
          <ProductCategoryAreas categories={visibleCategories} products={displayProducts} />
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
            products={displayProducts}
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

export function Header({
  data,
  query,
  setQuery
}: {
  data: SiteData;
  query: string;
  setQuery: (value: string) => void;
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTerm = query.trim().toLowerCase();
  const searchResults = searchTerm
    ? data.products
        .filter((product) =>
          `${product.name} ${product.category} ${product.description ?? ""}`
            .toLowerCase()
            .includes(searchTerm)
        )
    : [];

  useEffect(() => {
    if (!isSearchOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isSearchOpen]);

  return (
    <header className="site-header">
      <a className="brand" href="/">
        <img src={data.assets.logo} alt={data.content.brandName || "Logo"} />
      </a>

      <div className={`search-shell ${isSearchOpen ? "is-open" : ""}`} ref={searchRef}>
        <button
          aria-label="Mở tìm kiếm"
          className="search-toggle"
          onClick={() => setIsSearchOpen(true)}
          type="button"
        >
          <Search size={20} />
        </button>
        <label className="search-box">
          <Search size={19} />
          <input
            autoFocus={isSearchOpen}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm kiếm sản phẩm"
            onFocus={() => setIsSearchOpen(true)}
          />
        </label>
        {isSearchOpen && searchTerm ? (
          <div className="search-results" role="listbox">
            {searchResults.length > 0 ? (
              searchResults.map((product) => (
                <a
                  href={`/san-pham?id=${product.id}`}
                  key={product.id}
                  onClick={() => setIsSearchOpen(false)}
                >
                  <img src={getProductImages(product)[0] ?? product.image} alt="" />
                  <span>{product.name}</span>
                </a>
              ))
            ) : (
              <p>Không tìm thấy sản phẩm phù hợp.</p>
            )}
          </div>
        ) : null}
      </div>
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
  const backgrounds = (data.assets.backgroundImages?.length
    ? data.assets.backgroundImages
    : [data.assets.background]
  ).filter((image) => /^https?:\/\//i.test(image.trim()));
  const slideCount = backgrounds.length;
  const goToSlide = (direction: -1 | 1) => {
    setActiveSlide((current) => (current + direction + slideCount) % slideCount);
  };

  useEffect(() => {
    if (slideCount < 2) return;
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slideCount);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [slideCount]);

  return (
    <section className="hero hero-gallery">
      <div
        className="hero-backgrounds"
      >
        {backgrounds.map((image, index) => (
          <img
            alt=""
            className={index === activeSlide ? "active" : ""}
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
  const background = /^https?:\/\//i.test(data.assets.background.trim())
    ? data.assets.background
    : "";

  return (
    <section
      className="page-hero"
      style={{
        backgroundImage: background ? `url(${background})` : undefined
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

  const total = categories.length;
  const isSlider = total > 5;
  const maxIndex = Math.max(0, total - visibleCount);

  // Tự động di chuyển danh mục sau 3.8s nếu có trên 5 danh mục và không bị hover
  useEffect(() => {
    if (!isSlider || isHovered || maxIndex <= 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 3800);

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

  if (!isSlider) {
    return (
      <>
        <SectionTitle title="Danh mục sản phẩm" />
        <section className="category-grid">
          {categories.map((category) => (
            <a
              className="category-card"
              href={`/bo-hoa?category=${encodeURIComponent(category.name)}`}
              key={category.id}
            >
              {category.image ? <img src={category.image} alt={category.name} /> : null}
              <strong>{category.name}</strong>
            </a>
          ))}
        </section>
      </>
    );
  }

  const safeIndex = Math.min(currentIndex, maxIndex);

  return (
    <>
      <SectionTitle title="Danh mục sản phẩm" />
      <section
        className="category-slider-container"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchEnd={onTouchEnd}
        onTouchStart={onTouchStart}
      >
        <button
          aria-label="Danh mục trước"
          className="category-slider-arrow category-slider-prev"
          onClick={handlePrev}
          type="button"
        >
          <ChevronLeft size={22} />
        </button>

        <div className="category-slider-viewport">
          <div
            className="category-slider-track"
            style={{
              transform: `translateX(calc(-${safeIndex} * (100% + 14px) / ${visibleCount}))`
            }}
          >
            {categories.map((category) => (
              <a
                className="category-card category-slider-card"
                href={`/bo-hoa?category=${encodeURIComponent(category.name)}`}
                key={category.id}
                style={{
                  flex: `0 0 calc((100% - (${visibleCount - 1} * 14px)) / ${visibleCount})`
                }}
              >
                {category.image ? <img src={category.image} alt={category.name} /> : null}
                <strong>{category.name}</strong>
              </a>
            ))}
          </div>
        </div>

        <button
          aria-label="Danh mục sau"
          className="category-slider-arrow category-slider-next"
          onClick={handleNext}
          type="button"
        >
          <ChevronRight size={22} />
        </button>
      </section>
    </>
  );
}

function ProductCategoryAreas({
  categories,
  products
}: {
  categories: Category[];
  products: Product[];
}) {
  const categoryNames = new Set(categories.map((category) => category.name));
  const groups = categories
    .map((category) => ({
      category,
      products: products.filter((product) => product.category === category.name)
    }))
    .filter((group) => group.products.length > 0);
  const otherProducts = products.filter((product) => !categoryNames.has(product.category));

  return (
    <>
      {groups.map(({ category, products: categoryProducts }) => (
        <ProductArea
          key={category.id}
          limit={10}
          moreHref={`/bo-hoa?category=${encodeURIComponent(category.name)}`}
          products={categoryProducts}
          title={category.name}
        />
      ))}
      {otherProducts.length > 0 ? (
        <ProductArea
          limit={10}
          moreHref="/bo-hoa"
          products={otherProducts}
          title="Sản phẩm khác"
        />
      ) : null}
    </>
  );
}

function ProductArea({
  limit,
  moreHref,
  products,
  title
}: {
  limit?: number;
  moreHref?: string;
  products: Product[];
  title: string;
}) {
  const displayedProducts = limit ? products.slice(0, limit) : products;
  const hasMore = limit ? products.length > limit : false;
  const remainingCount = products.length - (limit ?? 0);

  return (
    <section className="product-section">
      <SectionTitle moreHref={moreHref} title={title} />
      {products.length === 0 ? (
        <EmptyState text="Chưa có sản phẩm phù hợp." />
      ) : (
        <>
          <div className="product-grid">
            {displayedProducts.map((product) => (
              <a className="product-card" href={`/san-pham?id=${product.id}`} key={product.id}>
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
            ))}
          </div>

          {hasMore ? (
            <div className="product-see-more-wrap">
              <a
                className="product-see-more-btn"
                href={moreHref || `/bo-hoa?category=${encodeURIComponent(title)}`}
              >
                <span>Xem thêm {remainingCount} sản phẩm &ldquo;{title}&rdquo;</span>
                <ChevronRight size={18} />
              </a>
            </div>
          ) : null}
        </>
      )}
    </section>
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

function SectionTitle({
  moreHref,
  sliderControls,
  title
}: {
  moreHref?: string;
  sliderControls?: React.ReactNode;
  title: string;
}) {
  return (
    <div className="section-title">
      <span>
        <CheckCircle2 size={16} /> {title}
      </span>
      {sliderControls ? (
        sliderControls
      ) : moreHref ? (
        <a href={moreHref}>
          Xem thêm <ChevronRight size={16} />
        </a>
      ) : (
        <span className="section-title-spacer" />
      )}
    </div>
  );
}

export function Footer({ data }: { data: SiteData }) {
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

export function FloatingContact({ data }: { data: SiteData }) {
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

function isBadge(product: Product, badge: string) {
  return (product.badge ?? "").trim().toLowerCase() === badge;
}

function getProductImages(product: Product) {
  return [...(product.images ?? []), product.image].filter(
    (image, index, list): image is string =>
      typeof image === "string" && image.trim().length > 0 && list.indexOf(image) === index
  );
}

function sortCategories(categories: Category[]) {
  return [...categories].sort(
    (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.id - b.id
  );
}
