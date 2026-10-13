"use client";

import { useEffect, useState } from "react";
import type { SiteData } from "@shop-flower/data";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function useLiveSiteData(initialData: SiteData) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    let ignored = false;

    async function loadLiveData() {
      try {
        const response = await fetch(`${apiUrl}/site-data`, {
          cache: "no-store"
        });
        if (!response.ok) return;

        const nextData = (await response.json()) as SiteData;
        if (!ignored) setData(nextData);
      } catch {
        // Keep the static data if the live API is unavailable.
      }
    }

    void loadLiveData();

    return () => {
      ignored = true;
    };
  }, []);

  return data;
}
