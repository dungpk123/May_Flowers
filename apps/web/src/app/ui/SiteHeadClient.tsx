"use client";

import { useEffect } from "react";
import type { SiteData } from "@shop-flower/data";

export default function SiteHeadClient({ data }: { data: SiteData }) {
  useEffect(() => {
    const title =
      data.content.siteTitle?.trim() ||
      data.content.brandName?.trim() ||
      "May Flowers";

    document.title = title;

    if (!data.assets.logo) return;

    let icon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!icon) {
      icon = document.createElement("link");
      icon.rel = "icon";
      document.head.appendChild(icon);
    }

    icon.href = data.assets.logo;
  }, [data.assets.logo, data.content.brandName, data.content.siteTitle]);

  return null;
}
