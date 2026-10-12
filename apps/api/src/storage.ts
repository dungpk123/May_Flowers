import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { config } from "dotenv";
import { Pool, type PoolClient } from "pg";
import {
  defaultSiteData,
  type Article,
  type Category,
  type Product,
  type SiteAssets,
  type SiteContent,
  type SiteData
} from "@shop-flower/data";

config({ path: join(process.cwd(), ".env") });
config({ path: join(process.cwd(), "..", "..", ".env") });

const dataFile = join(__dirname, "..", "data", "site-data.json");
const databaseUrl = process.env.DATABASE_URL;

const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl:
        process.env.DATABASE_SSL === "true"
          ? { rejectUnauthorized: false }
          : undefined
    })
  : null;

let databaseReady = false;
let databaseAvailable = Boolean(pool);

export function storageMode() {
  return databaseAvailable ? "postgresql" : "json-file";
}

export async function readSiteData(): Promise<SiteData> {
  if (!pool) return readJsonFile();

  try {
    await ensureDatabase();
    const [assetsResult, contentResult, categoriesResult, productsResult, articlesResult] =
      await Promise.all([
        pool.query<SiteAssets>(
          'select logo, background, "zaloIcon", "facebookIcon", "phoneIcon" from site_assets where id = 1'
        ),
        pool.query<DbContentRow>("select * from site_content where id = 1"),
        pool.query<DbCategoryRow>("select * from categories order by id"),
        pool.query<DbProductRow>("select * from products order by id"),
        pool.query<DbArticleRow>("select * from articles order by id")
      ]);

    return normalizeSiteData({
      assets: assetsResult.rows[0] ?? defaultSiteData.assets,
      content: contentFromRow(contentResult.rows[0]),
      categories: categoriesResult.rows.map(categoryFromRow),
      products: productsResult.rows.map(productFromRow),
      articles: articlesResult.rows.map(articleFromRow)
    });
  } catch (error) {
    databaseAvailable = false;
    console.warn("PostgreSQL unavailable, falling back to JSON file.", error);
    return readJsonFile();
  }
}

export async function saveSiteData(data: SiteData): Promise<SiteData> {
  const nextData = normalizeSiteData(data);

  if (!pool || !databaseAvailable) {
    saveJsonFile(nextData);
    return nextData;
  }

  const client = await pool.connect();
  try {
    await ensureDatabase(client);
    await client.query("begin");

    await upsertAssets(client, nextData.assets);
    await upsertContent(client, nextData.content);
    await replaceCategories(client, nextData.categories);
    await replaceProducts(client, nextData.products);
    await replaceArticles(client, nextData.articles);

    await client.query("commit");
    return nextData;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    databaseAvailable = false;
    console.warn("PostgreSQL save failed, falling back to JSON file.", error);
    saveJsonFile(nextData);
    return nextData;
  } finally {
    client.release();
  }
}

async function ensureDatabase(client?: PoolClient) {
  if (!pool || databaseReady) return;

  const db = client ?? pool;
  await db.query(`
    create table if not exists site_assets (
      id integer primary key,
      logo text not null default '',
      background text not null default '',
      "zaloIcon" text not null default '',
      "facebookIcon" text not null default '',
      "phoneIcon" text not null default '',
      updated_at timestamptz not null default now()
    )
  `);

  await db.query(`
    create table if not exists site_content (
      id integer primary key,
      brand_name text not null default '',
      tagline text not null default '',
      hotline text not null default '',
      zalo_url text not null default '',
      facebook_url text not null default '',
      address text not null default '',
      email text not null default '',
      hero_title text not null default '',
      hero_subtitle text not null default '',
      hero_description text not null default '',
      cta_eyebrow text not null default '',
      cta_title text not null default '',
      cta_description text not null default '',
      footer_title text not null default '',
      footer_description text not null default '',
      about_title text not null default '',
      about_content text not null default '',
      contact_title text not null default '',
      contact_content text not null default '',
      updated_at timestamptz not null default now()
    )
  `);

  await db.query(`
    create table if not exists categories (
      id bigint primary key,
      name text not null default '',
      image text not null default '',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);

  await db.query(`
    create table if not exists products (
      id bigint primary key,
      name text not null default '',
      category text not null default '',
      price integer,
      image text not null default '',
      badge text,
      description text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);

  await db.query(`
    create table if not exists articles (
      id bigint primary key,
      title text not null default '',
      image text not null default '',
      excerpt text not null default '',
      content text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);

  await migrateLegacyJsonData(db);
  databaseReady = true;
}

async function migrateLegacyJsonData(db: PoolClient | Pool) {
  const productCount = await db.query<{ count: string }>("select count(*) from products");
  const hasProducts = Number(productCount.rows[0]?.count ?? 0) > 0;
  if (hasProducts) return;

  const legacyExists = await db.query<{ exists: boolean }>(`
    select exists (
      select 1
      from information_schema.tables
      where table_schema = 'public' and table_name = 'site_data'
    )
  `);

  if (!legacyExists.rows[0]?.exists) {
    await saveSeedRows(db, defaultSiteData);
    return;
  }

  const legacy = await db.query<{ data: SiteData }>(
    "select data from site_data where id = 1"
  );
  await saveSeedRows(db, normalizeSiteData(legacy.rows[0]?.data ?? defaultSiteData));
}

async function saveSeedRows(db: PoolClient | Pool, data: SiteData) {
  await upsertAssets(db, data.assets);
  await upsertContent(db, data.content);
  await replaceCategories(db, data.categories);
  await replaceProducts(db, data.products);
  await replaceArticles(db, data.articles);
}

async function upsertAssets(db: PoolClient | Pool, assets: SiteAssets) {
  await db.query(
    `
      insert into site_assets (id, logo, background, "zaloIcon", "facebookIcon", "phoneIcon", updated_at)
      values (1, $1, $2, $3, $4, $5, now())
      on conflict (id) do update set
        logo = excluded.logo,
        background = excluded.background,
        "zaloIcon" = excluded."zaloIcon",
        "facebookIcon" = excluded."facebookIcon",
        "phoneIcon" = excluded."phoneIcon",
        updated_at = now()
    `,
    [
      assets.logo,
      assets.background,
      assets.zaloIcon,
      assets.facebookIcon,
      assets.phoneIcon
    ]
  );
}

async function upsertContent(db: PoolClient | Pool, content: SiteContent) {
  await db.query(
    `
      insert into site_content (
        id, brand_name, tagline, hotline, zalo_url, facebook_url, address, email,
        hero_title, hero_subtitle, hero_description, cta_eyebrow, cta_title,
        cta_description, footer_title, footer_description, about_title,
        about_content, contact_title, contact_content, updated_at
      )
      values (
        1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, now()
      )
      on conflict (id) do update set
        brand_name = excluded.brand_name,
        tagline = excluded.tagline,
        hotline = excluded.hotline,
        zalo_url = excluded.zalo_url,
        facebook_url = excluded.facebook_url,
        address = excluded.address,
        email = excluded.email,
        hero_title = excluded.hero_title,
        hero_subtitle = excluded.hero_subtitle,
        hero_description = excluded.hero_description,
        cta_eyebrow = excluded.cta_eyebrow,
        cta_title = excluded.cta_title,
        cta_description = excluded.cta_description,
        footer_title = excluded.footer_title,
        footer_description = excluded.footer_description,
        about_title = excluded.about_title,
        about_content = excluded.about_content,
        contact_title = excluded.contact_title,
        contact_content = excluded.contact_content,
        updated_at = now()
    `,
    [
      content.brandName,
      content.tagline,
      content.hotline,
      content.zaloUrl,
      content.facebookUrl,
      content.address,
      content.email,
      content.heroTitle,
      content.heroSubtitle,
      content.heroDescription,
      content.ctaEyebrow,
      content.ctaTitle,
      content.ctaDescription,
      content.footerTitle,
      content.footerDescription,
      content.aboutTitle,
      content.aboutContent,
      content.contactTitle,
      content.contactContent
    ]
  );
}

async function replaceCategories(db: PoolClient | Pool, categories: Category[]) {
  await db.query("delete from categories");

  for (const category of categories) {
    await db.query(
      `
        insert into categories (id, name, image, updated_at)
        values ($1, $2, $3, now())
      `,
      [category.id, category.name, category.image]
    );
  }
}

async function replaceProducts(db: PoolClient | Pool, products: Product[]) {
  await db.query("delete from products");

  for (const product of products) {
    await db.query(
      `
        insert into products (id, name, category, price, image, badge, description, updated_at)
        values ($1, $2, $3, $4, $5, $6, $7, now())
      `,
      [
        product.id,
        product.name,
        product.category,
        product.price ?? null,
        product.image,
        product.badge ?? null,
        product.description ?? null
      ]
    );
  }
}

async function replaceArticles(db: PoolClient | Pool, articles: Article[]) {
  await db.query("delete from articles");

  for (const article of articles) {
    await db.query(
      `
        insert into articles (id, title, image, excerpt, content, updated_at)
        values ($1, $2, $3, $4, $5, now())
      `,
      [
        article.id,
        article.title,
        article.image,
        article.excerpt,
        article.content ?? null
      ]
    );
  }
}

function readJsonFile(): SiteData {
  if (!existsSync(dataFile)) {
    saveJsonFile(defaultSiteData);
    return defaultSiteData;
  }

  try {
    return normalizeSiteData(JSON.parse(readFileSync(dataFile, "utf8")) as SiteData);
  } catch {
    return defaultSiteData;
  }
}

function saveJsonFile(data: SiteData) {
  mkdirSync(dirname(dataFile), { recursive: true });
  writeFileSync(dataFile, JSON.stringify(data, null, 2), "utf8");
}

function normalizeSiteData(data: SiteData): SiteData {
  return {
    ...defaultSiteData,
    ...data,
    assets: { ...defaultSiteData.assets, ...data.assets },
    content: { ...defaultSiteData.content, ...data.content },
    categories: data.categories ?? [],
    products: data.products ?? [],
    articles: data.articles ?? []
  };
}

type DbContentRow = {
  brand_name: string;
  tagline: string;
  hotline: string;
  zalo_url: string;
  facebook_url: string;
  address: string;
  email: string;
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  cta_eyebrow: string;
  cta_title: string;
  cta_description: string;
  footer_title: string;
  footer_description: string;
  about_title: string;
  about_content: string;
  contact_title: string;
  contact_content: string;
};

type DbCategoryRow = {
  id: string;
  name: string;
  image: string;
};

type DbProductRow = {
  id: string;
  name: string;
  category: string;
  price: number | null;
  image: string;
  badge: string | null;
  description: string | null;
};

type DbArticleRow = {
  id: string;
  title: string;
  image: string;
  excerpt: string;
  content: string | null;
};

function contentFromRow(row?: DbContentRow): SiteContent {
  if (!row) return defaultSiteData.content;

  return {
    brandName: row.brand_name,
    tagline: row.tagline,
    hotline: row.hotline,
    zaloUrl: row.zalo_url,
    facebookUrl: row.facebook_url,
    address: row.address,
    email: row.email,
    heroTitle: row.hero_title,
    heroSubtitle: row.hero_subtitle,
    heroDescription: row.hero_description,
    ctaEyebrow: row.cta_eyebrow,
    ctaTitle: row.cta_title,
    ctaDescription: row.cta_description,
    footerTitle: row.footer_title,
    footerDescription: row.footer_description,
    aboutTitle: row.about_title,
    aboutContent: row.about_content,
    contactTitle: row.contact_title,
    contactContent: row.contact_content
  };
}

function categoryFromRow(row: DbCategoryRow): Category {
  return {
    id: Number(row.id),
    name: row.name,
    image: row.image
  };
}

function productFromRow(row: DbProductRow): Product {
  return {
    id: Number(row.id),
    name: row.name,
    category: row.category,
    price: row.price ?? undefined,
    image: row.image,
    badge: row.badge ?? undefined,
    description: row.description ?? undefined
  };
}

function articleFromRow(row: DbArticleRow): Article {
  return {
    id: Number(row.id),
    title: row.title,
    image: row.image,
    excerpt: row.excerpt,
    content: row.content ?? undefined
  };
}
