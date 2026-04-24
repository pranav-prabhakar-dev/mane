import * as cheerio from "cheerio";

export interface ProductMetadata {
  title?: string;
  image?: string;
  price?: number;
  currency?: string;
  sourceUrl: string;
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

function toAbsolute(maybeUrl: string | undefined, base: string) {
  if (!maybeUrl) return undefined;
  try {
    return new URL(maybeUrl, base).toString();
  } catch {
    return undefined;
  }
}

function parsePrice(raw: unknown): number | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "number" && !Number.isNaN(raw)) return raw;
  if (typeof raw !== "string") return undefined;
  // Strip currency symbols, thousands separators; keep first number
  const cleaned = raw.replace(/[^\d.,-]/g, "").replace(/,(?=\d{3}(\D|$))/g, "");
  const normalized = cleaned.replace(",", ".");
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) return undefined;
  const n = parseFloat(match[0]);
  return Number.isFinite(n) ? n : undefined;
}

function extractJsonLd($: cheerio.CheerioAPI): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const text = $(el).contents().text();
    if (!text) return;
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) out.push(...parsed);
      else out.push(parsed);
    } catch {
      // Some sites embed multiple JSON objects or have trailing commas; ignore
    }
  });
  return out;
}

function findProductJsonLd(
  blocks: Array<Record<string, unknown>>,
): Record<string, unknown> | undefined {
  const walk = (node: unknown): Record<string, unknown> | undefined => {
    if (!node || typeof node !== "object") return undefined;
    if (Array.isArray(node)) {
      for (const item of node) {
        const found = walk(item);
        if (found) return found;
      }
      return undefined;
    }
    const obj = node as Record<string, unknown>;
    const t = obj["@type"];
    const isProduct =
      t === "Product" ||
      (Array.isArray(t) && t.includes("Product")) ||
      typeof obj.offers === "object";
    if (isProduct) return obj;
    if (obj["@graph"]) return walk(obj["@graph"]);
    return undefined;
  };
  for (const block of blocks) {
    const found = walk(block);
    if (found) return found;
  }
  return undefined;
}

export async function fetchProductMetadata(
  url: string,
): Promise<ProductMetadata> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL");
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    throw new Error("Only http(s) URLs are supported");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  let html = "";
  try {
    const res = await fetch(parsed.toString(), {
      headers: {
        "User-Agent": UA,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Upstream responded ${res.status}`);
    }
    html = await res.text();
  } finally {
    clearTimeout(timeout);
  }

  const $ = cheerio.load(html);
  const base = parsed.toString();

  const og = (prop: string) =>
    $(`meta[property="og:${prop}"]`).attr("content") ||
    $(`meta[name="og:${prop}"]`).attr("content");
  const tw = (name: string) =>
    $(`meta[name="twitter:${name}"]`).attr("content") ||
    $(`meta[property="twitter:${name}"]`).attr("content");
  const meta = (name: string) =>
    $(`meta[name="${name}"]`).attr("content") ||
    $(`meta[property="${name}"]`).attr("content");
  const itemprop = (name: string) =>
    $(`[itemprop="${name}"]`).attr("content") ||
    $(`[itemprop="${name}"]`).first().attr("content") ||
    $(`[itemprop="${name}"]`).first().text().trim();

  // JSON-LD Product
  const ld = findProductJsonLd(extractJsonLd($));
  let title: string | undefined;
  let image: string | undefined;
  let price: number | undefined;
  let currency: string | undefined;

  if (ld) {
    title = (ld.name as string) || title;
    const img = ld.image;
    if (typeof img === "string") image = img;
    else if (Array.isArray(img) && img.length) {
      image = typeof img[0] === "string" ? (img[0] as string) : undefined;
    } else if (img && typeof img === "object" && "url" in img) {
      image = (img as { url?: string }).url;
    }
    const offers = ld.offers as
      | Record<string, unknown>
      | Array<Record<string, unknown>>
      | undefined;
    const firstOffer = Array.isArray(offers) ? offers[0] : offers;
    if (firstOffer && typeof firstOffer === "object") {
      price = parsePrice(firstOffer.price ?? firstOffer.lowPrice);
      const c = firstOffer.priceCurrency;
      if (typeof c === "string") currency = c;
    }
  }

  // Fallbacks
  title =
    title ||
    og("title") ||
    tw("title") ||
    $("title").first().text().trim() ||
    undefined;

  image =
    toAbsolute(image, base) ||
    toAbsolute(og("image"), base) ||
    toAbsolute(tw("image"), base) ||
    toAbsolute($('link[rel="image_src"]').attr("href"), base) ||
    undefined;

  if (price === undefined) {
    price =
      parsePrice(og("price:amount")) ??
      parsePrice(meta("product:price:amount")) ??
      parsePrice(itemprop("price")) ??
      undefined;
  }
  if (!currency) {
    currency =
      og("price:currency") ||
      meta("product:price:currency") ||
      itemprop("priceCurrency") ||
      undefined;
  }

  return {
    title: title?.trim(),
    image,
    price,
    currency: currency?.trim().toUpperCase(),
    sourceUrl: base,
  };
}
