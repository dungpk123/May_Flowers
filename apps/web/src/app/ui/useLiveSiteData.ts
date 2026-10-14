"use client";

import { createElement, useEffect, useState } from "react";
import type { SiteData } from "@shop-flower/data";
import { publicApiUrl } from "../apiConfig";

export function useLiveSiteData(initialData: SiteData) {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignored = false;

    async function loadLiveData() {
      try {
        const response = await fetch(`${publicApiUrl}/site-data`, {
          cache: "no-store"
        });
        if (!response.ok) return;

        const nextData = (await response.json()) as SiteData;
        if (!ignored) setData(nextData);
      } catch {
        // Keep the static data if the live API is unavailable.
      } finally {
        if (!ignored) setIsLoading(false);
      }
    }

    void loadLiveData();

    return () => {
      ignored = true;
    };
  }, []);

  return { data, isLoading };
}

export function SiteLoadingScreen() {
  return createElement(
    "main",
    { className: "site-loading-page", "aria-live": "polite", "aria-busy": true },
    createElement(
      "div",
      { className: "site-loading-card" },
      createElement("span", { className: "site-loading-spinner" }),
      createElement("strong", null, "Đang tải website"),
      createElement("p", null, "Vui lòng chờ trong giây lát.")
    )
  );
}
