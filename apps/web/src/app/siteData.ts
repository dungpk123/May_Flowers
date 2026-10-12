import { defaultSiteData, type SiteData } from "@shop-flower/data";

export async function getSiteData(): Promise<SiteData> {
  const apiUrl = process.env.API_URL ?? "http://localhost:4000";

  try {
    const response = await fetch(`${apiUrl}/site-data`, {
      cache: "no-store"
    });

    if (!response.ok) throw new Error("API returned an invalid response");
    return response.json();
  } catch {
    return defaultSiteData;
  }
}
