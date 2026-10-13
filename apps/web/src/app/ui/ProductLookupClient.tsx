"use client";

import { useEffect, useMemo, useState } from "react";
import type { SiteData } from "@shop-flower/data";
import ProductDetailClient from "./ProductDetailClient";

export default function ProductLookupClient({ data }: { data: SiteData }) {
  const [productId, setProductId] = useState("");

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

  if (!product) {
    return (
      <main>
        <header className="site-header detail-header">
          <a className="brand detail-brand" href="/">
            <img src={data.assets.logo} alt={data.content.brandName || "Logo"} />
          </a>
        </header>
        <p className="empty-state">Không tìm thấy sản phẩm.</p>
      </main>
    );
  }

  return <ProductDetailClient data={data} product={product} />;
}
