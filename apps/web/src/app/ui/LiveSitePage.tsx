"use client";

import type { SiteData } from "@shop-flower/data";
import SitePage, { type SiteView } from "./SitePage";
import { useLiveSiteData } from "./useLiveSiteData";

export default function LiveSitePage({
  initialData,
  view
}: {
  initialData: SiteData;
  view: SiteView;
}) {
  const data = useLiveSiteData(initialData);

  return <SitePage data={data} view={view} />;
}
