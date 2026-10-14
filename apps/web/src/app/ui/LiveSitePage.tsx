"use client";

import type { SiteData } from "@shop-flower/data";
import SitePage, { type SiteView } from "./SitePage";
import { SiteLoadingScreen, useLiveSiteData } from "./useLiveSiteData";

export default function LiveSitePage({
  initialData,
  view
}: {
  initialData: SiteData;
  view: SiteView;
}) {
  const { data, isLoading } = useLiveSiteData(initialData);

  if (isLoading) return <SiteLoadingScreen />;

  return <SitePage data={data} view={view} />;
}
