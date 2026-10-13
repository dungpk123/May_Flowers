import { defaultSiteData, type SiteData } from "@shop-flower/data";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function getSiteData(): Promise<SiteData> {
  const apiUrl = process.env.API_URL ?? "http://localhost:4000";

  try {
    const response = await fetch(`${apiUrl}/site-data`, {
      cache: "no-store"
    });

    if (!response.ok) throw new Error("API returned an invalid response");
    return response.json();
  } catch {
    try {
      const dataFile = join(process.cwd(), "../../apps/api/data/site-data.json");
      return JSON.parse(await readFile(dataFile, "utf8")) as SiteData;
    } catch {
      return defaultSiteData;
    }
  }
}
