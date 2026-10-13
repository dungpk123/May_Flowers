import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { config } from "dotenv";
import mysql, {
  type Pool,
  type PoolConnection,
  type RowDataPacket
} from "mysql2/promise";
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
const databaseName = normalizeDatabaseName(process.env.DATABASE_NAME || "shop_flower");

const pool = databaseUrl ? createPool(databaseUrl, databaseName) : null;

let databaseReady = false;
let databaseAvailable = Boolean(pool);

type Db = Pool | PoolConnection;

export function storageMode() {
  return databaseAvailable ? "tidb-mysql" : "json-file";
}

export async function readSiteData(): Promise<SiteData> {
  if (!pool) return readJsonFile();

  try {
    await ensureDatabase();
    const [assetsRows, contentRows, categoryRows, productRows, articleRows] =
      await Promise.all([
        queryRows<DbAssetsRow>(
          pool,
          "select logo, background, backgroundImages, zaloIcon, facebookIcon, phoneIcon from site_assets where id = 1"
        ),
        queryRows<DbContentRow>(pool, "select * from site_content where id = 1"),
        queryRows<DbCategoryRow>(pool, "select * from categories order by sort_order, id"),
        queryRows<DbProductRow>(pool, "select * from products order by id"),
        queryRows<DbArticleRow>(pool, "select * from articles order by id")
      ]);

    return normalizeSiteData({
      assets: assetsFromRow(assetsRows[0]),
      content: contentFromRow(contentRows[0]),
      categories: categoryRows.map(categoryFromRow),
      products: productRows.map(productFromRow),
      articles: articleRows.map(articleFromRow)
    });
  } catch (error) {
    databaseAvailable = false;
    console.warn("TiDB/MySQL unavailable, falling back to JSON file.", error);
    return readJsonFile();
  }
}

export async function saveSiteData(data: SiteData): Promise<SiteData> {
  const nextData = normalizeSiteData(data);

  if (!pool || !databaseAvailable) {
    saveJsonFile(nextData);
    return nextData;
  }

  const client = await pool.getConnection();
  try {
    await ensureDatabase(client);
    await client.beginTransaction();

    await upsertAssets(client, nextData.assets);
    await upsertContent(client, nextData.content);
    await replaceCategories(client, nextData.categories);
    await replaceProducts(client, nextData.products);
    await replaceArticles(client, nextData.articles);

    await client.commit();
    return nextData;
  } catch (error) {
    await client.rollback().catch(() => undefined);
    databaseAvailable = false;
    console.warn("TiDB/MySQL save failed, falling back to JSON file.", error);
    saveJsonFile(nextData);
    return nextData;
  } finally {
    client.release();
  }
}

async function ensureDatabase(client?: PoolConnection) {
  if (!pool || databaseReady) return;

  await ensureDatabaseExists();

  const db = client ?? pool;
  await db.query(`
    create table if not exists site_assets (
      id int primary key,
      logo text not null,
      background text not null,
      backgroundImages json null,
      zaloIcon text not null,
      facebookIcon text not null,
      phoneIcon text not null,
      updated_at timestamp not null default current_timestamp on update current_timestamp
    )
  `);

  await addColumnIfMissing(
    db,
    "site_assets",
    "backgroundImages",
    "json null after background"
  );

  await db.query(`
    create table if not exists site_content (
      id int primary key,
      brand_name text not null,
      tagline text not null,
      hotline text not null,
      zalo_url text not null,
      facebook_url text not null,
      address text not null,
      email text not null,
      hero_title text not null,
      hero_subtitle text not null,
      hero_description text not null,
      cta_eyebrow text not null,
      cta_title text not null,
      cta_description text not null,
      footer_title text not null,
      footer_description text not null,
      about_title text not null,
      about_content text not null,
      contact_title text not null,
      contact_content text not null,
      updated_at timestamp not null default current_timestamp on update current_timestamp
    )
  `);

  await db.query(`
    create table if not exists categories (
      id bigint primary key,
      name text not null,
      display_title text null,
      image text not null,
      sort_order int not null default 0,
      created_at timestamp not null default current_timestamp,
      updated_at timestamp not null default current_timestamp on update current_timestamp
    )
  `);

  await addColumnIfMissing(db, "categories", "display_title", "text null after name");
  await addColumnIfMissing(db, "categories", "sort_order", "int not null default 0 after image");

  await db.query(`
    create table if not exists products (
      id bigint primary key,
      name text not null,
      category text not null,
      price int null,
      image text not null,
      badge text null,
      description text null,
      created_at timestamp not null default current_timestamp,
      updated_at timestamp not null default current_timestamp on update current_timestamp
    )
  `);

  await db.query(`
    create table if not exists articles (
      id bigint primary key,
      title text not null,
      image text not null,
      excerpt text not null,
      content text null,
      created_at timestamp not null default current_timestamp,
      updated_at timestamp not null default current_timestamp on update current_timestamp
    )
  `);

  await seedIfEmpty(db);
  databaseReady = true;
}

async function ensureDatabaseExists() {
  if (!databaseUrl) return;

  const adminPool = createPool(databaseUrl, undefined);
  try {
    await adminPool.query(`create database if not exists \`${databaseName}\``);
  } finally {
    await adminPool.end();
  }
}

async function seedIfEmpty(db: Db) {
  const rows = await queryRows<{ count: number | string }>(
    db,
    "select count(*) as count from products"
  );
  const hasProducts = Number(rows[0]?.count ?? 0) > 0;
  if (hasProducts) return;

  await saveSeedRows(db, readJsonFile());
}

async function saveSeedRows(db: Db, data: SiteData) {
  await upsertAssets(db, data.assets);
  await upsertContent(db, data.content);
  await replaceCategories(db, data.categories);
  await replaceProducts(db, data.products);
  await replaceArticles(db, data.articles);
}

async function upsertAssets(db: Db, assets: SiteAssets) {
  await db.query(
    `
      insert into site_assets (
        id, logo, background, backgroundImages, zaloIcon, facebookIcon, phoneIcon, updated_at
      )
      values (1, ?, ?, ?, ?, ?, ?, current_timestamp)
      on duplicate key update
        logo = values(logo),
        background = values(background),
        backgroundImages = values(backgroundImages),
        zaloIcon = values(zaloIcon),
        facebookIcon = values(facebookIcon),
        phoneIcon = values(phoneIcon),
        updated_at = current_timestamp
    `,
    [
      assets.logo,
      assets.background,
      JSON.stringify(assets.backgroundImages?.length ? assets.backgroundImages : [assets.background]),
      assets.zaloIcon,
      assets.facebookIcon,
      assets.phoneIcon
    ]
  );
}

async function upsertContent(db: Db, content: SiteContent) {
  await db.query(
    `
      insert into site_content (
        id, brand_name, tagline, hotline, zalo_url, facebook_url, address, email,
        hero_title, hero_subtitle, hero_description, cta_eyebrow, cta_title,
        cta_description, footer_title, footer_description, about_title,
        about_content, contact_title, contact_content, updated_at
      )
      values (
        1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, current_timestamp
      )
      on duplicate key update
        brand_name = values(brand_name),
        tagline = values(tagline),
        hotline = values(hotline),
        zalo_url = values(zalo_url),
        facebook_url = values(facebook_url),
        address = values(address),
        email = values(email),
        hero_title = values(hero_title),
        hero_subtitle = values(hero_subtitle),
        hero_description = values(hero_description),
        cta_eyebrow = values(cta_eyebrow),
        cta_title = values(cta_title),
        cta_description = values(cta_description),
        footer_title = values(footer_title),
        footer_description = values(footer_description),
        about_title = values(about_title),
        about_content = values(about_content),
        contact_title = values(contact_title),
        contact_content = values(contact_content),
        updated_at = current_timestamp
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

async function replaceCategories(db: Db, categories: Category[]) {
  await db.query("delete from categories");

  for (const category of categories) {
    await db.query(
      `
        insert into categories (id, name, display_title, image, sort_order, updated_at)
        values (?, ?, ?, ?, ?, current_timestamp)
      `,
      [
        category.id,
        category.name,
        category.displayTitle || category.name,
        category.image,
        category.sortOrder
      ]
    );
  }
}

async function replaceProducts(db: Db, products: Product[]) {
  await db.query("delete from products");

  for (const product of products) {
    await db.query(
      `
        insert into products (id, name, category, price, image, badge, description, updated_at)
        values (?, ?, ?, ?, ?, ?, ?, current_timestamp)
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

async function replaceArticles(db: Db, articles: Article[]) {
  await db.query("delete from articles");

  for (const article of articles) {
    await db.query(
      `
        insert into articles (id, title, image, excerpt, content, updated_at)
        values (?, ?, ?, ?, ?, current_timestamp)
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

function createPool(url: string, database: string | undefined) {
  const parsed = new URL(url);
  const sslDisabled = process.env.DATABASE_SSL === "false";

  return mysql.createPool({
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 4000,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_LIMIT || 10),
    queueLimit: 0,
    charset: "utf8mb4",
    timezone: "Z",
    ssl: sslDisabled ? undefined : { rejectUnauthorized: true }
  });
}

function normalizeDatabaseName(name: string) {
  const normalized = name.trim() || "shop_flower";
  if (!/^[A-Za-z0-9_]+$/.test(normalized)) {
    throw new Error("DATABASE_NAME can only contain letters, numbers, and underscores.");
  }
  return normalized;
}

async function queryRows<T extends RowDataPacket | object>(
  db: Db,
  sql: string,
  params: unknown[] = []
) {
  const [rows] = await db.query(sql, params);
  return rows as T[];
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
  const assets = { ...defaultSiteData.assets, ...data.assets };
  const backgroundImages =
    assets.backgroundImages?.filter((item) => item.trim().length > 0) ??
    (assets.background ? [assets.background] : []);

  return {
    ...defaultSiteData,
    ...data,
    assets: {
      ...assets,
      background: backgroundImages[0] ?? assets.background,
      backgroundImages
    },
    content: { ...defaultSiteData.content, ...data.content },
    categories: (data.categories ?? [])
      .map((category, index) => {
        const sortOrder = Number(category.sortOrder);
        return {
          ...category,
          displayTitle: category.displayTitle || category.name,
          sortOrder: Number.isFinite(sortOrder) && sortOrder > 0 ? sortOrder : index + 1
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    products: data.products ?? [],
    articles: data.articles ?? []
  };
}

type DbAssetsRow = {
  logo: string;
  background: string;
  backgroundImages?: string | null;
  zaloIcon: string;
  facebookIcon: string;
  phoneIcon: string;
};

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
  id: string | number;
  name: string;
  display_title?: string | null;
  image: string;
  sort_order?: string | number | null;
};

type DbProductRow = {
  id: string | number;
  name: string;
  category: string;
  price: number | null;
  image: string;
  badge: string | null;
  description: string | null;
};

type DbArticleRow = {
  id: string | number;
  title: string;
  image: string;
  excerpt: string;
  content: string | null;
};

function assetsFromRow(row?: DbAssetsRow): SiteAssets {
  if (!row) return defaultSiteData.assets;

  return {
    logo: row.logo,
    background: row.background,
    backgroundImages: parseBackgroundImages(row.backgroundImages, row.background),
    zaloIcon: row.zaloIcon,
    facebookIcon: row.facebookIcon,
    phoneIcon: row.phoneIcon
  };
}

async function addColumnIfMissing(
  db: Db,
  table: string,
  column: string,
  definition: string
) {
  const rows = await queryRows<{ count: number | string }>(
    db,
    `
      select count(*) as count
      from information_schema.columns
      where table_schema = ? and table_name = ? and column_name = ?
    `,
    [databaseName, table, column]
  );

  if (Number(rows[0]?.count ?? 0) > 0) return;

  await db.query(`alter table \`${table}\` add column \`${column}\` ${definition}`);
}

function parseBackgroundImages(value: string | null | undefined, fallback: string) {
  if (!value) return fallback ? [fallback] : [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string" && item.length > 0);
    }
  } catch {
    return fallback ? [fallback] : [];
  }

  return fallback ? [fallback] : [];
}

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
    displayTitle: row.display_title || row.name,
    sortOrder: Number(row.sort_order ?? 0),
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
