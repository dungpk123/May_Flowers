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
    return repairSiteDataEncoding((await response.json()) as SiteData);
  } catch {
    try {
      const dataFile = join(process.cwd(), "../../apps/api/data/site-data.json");
      return repairSiteDataEncoding(JSON.parse(await readFile(dataFile, "utf8")) as SiteData);
    } catch {
      return defaultSiteData;
    }
  }
}

const cp437Chars =
  "\u00c7\u00fc\u00e9\u00e2\u00e4\u00e0\u00e5\u00e7\u00ea\u00eb\u00e8\u00ef\u00ee\u00ec\u00c4\u00c5" +
  "\u00c9\u00e6\u00c6\u00f4\u00f6\u00f2\u00fb\u00f9\u00ff\u00d6\u00dc\u00a2\u00a3\u00a5\u20a7\u0192" +
  "\u00e1\u00ed\u00f3\u00fa\u00f1\u00d1\u00aa\u00ba\u00bf\u2310\u00ac\u00bd\u00bc\u00a1\u00ab\u00bb" +
  "\u2591\u2592\u2593\u2502\u2524\u2561\u2562\u2556\u2555\u2563\u2551\u2557\u255d\u255c\u255b\u2510" +
  "\u2514\u2534\u252c\u251c\u2500\u253c\u255e\u255f\u255a\u2554\u2569\u2566\u2560\u2550\u256c\u2567" +
  "\u2568\u2564\u2565\u2559\u2558\u2552\u2553\u256b\u256a\u2518\u250c\u2588\u2584\u258c\u2590\u2580" +
  "\u03b1\u00df\u0393\u03c0\u03a3\u03c3\u00b5\u03c4\u03a6\u0398\u03a9\u03b4\u221e\u03c6\u03b5\u2229" +
  "\u2261\u00b1\u2265\u2264\u2320\u2321\u00f7\u2248\u00b0\u2219\u00b7\u221a\u207f\u00b2\u25a0\u00a0";

const cp437Lookup = new Map(
  [...cp437Chars].map((char, index) => [char, index + 128] as const)
);

function repairSiteDataEncoding(data: SiteData): SiteData {
  return repairEncodingValue(data) as SiteData;
}

function repairEncodingValue(value: unknown): unknown {
  if (typeof value === "string") return repairMojibake(value);
  if (Array.isArray(value)) return value.map(repairEncodingValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, repairEncodingValue(item)])
    );
  }

  return value;
}

function repairMojibake(value: string) {
  if (!/[╞├ß║╗░│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀æ]/.test(value)) {
    return value;
  }

  const bytes: number[] = [];
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 128) {
      bytes.push(code);
      continue;
    }

    const byte = cp437Lookup.get(char);
    if (byte === undefined) return value;
    bytes.push(byte);
  }

  return Buffer.from(bytes).toString("utf8");
}
