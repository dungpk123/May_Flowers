"use client";

import { useEffect, useMemo, useState } from "react";
import type { SiteData } from "@shop-flower/data";
import { Footer, Header } from "./SitePage";
import ProductDetailClient from "./ProductDetailClient";
import SiteHeadClient from "./SiteHeadClient";
import { SiteLoadingScreen, useLiveSiteData } from "./useLiveSiteData";

export default function ProductLookupClient({ data: initialData }: { data: SiteData }) {
  const { data, isLoading } = useLiveSiteData(initialData);
  const [productId, setProductId] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const readProductId = () => {
      setProductId(new URLSearchParams(window.location.search).get("id") ?? "");
    };

    readProductId();
    window.addEventListener("popstate", readProductId);

    return () => window.removeEventListener("popstate", readProductId);
  }, []);

  const product = useMemo(
    () => data.products.find((item) => String(item.id) === productId),
    [data.products, productId]
  );

  if (isLoading) return <SiteLoadingScreen />;

  if (!product) {
    return (
      <main>
        <SiteHeadClient data={data} />
        <Header data={data} query={query} setQuery={setQuery} />
        <p className="empty-state">Không tìm thấy sản phẩm.</p>
        <Footer data={data} />
      </main>
    );
  }

  return <ProductDetailClient data={data} product={product} />;
}
