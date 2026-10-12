import "reflect-metadata";
import { Body, Controller, Get, Module, Put, Query } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { SiteData } from "@shop-flower/data";
import { readSiteData, saveSiteData, storageMode } from "./storage";

@Controller()
class AppController {
  @Get("health")
  health() {
    return { ok: true, service: "flower-api", storage: storageMode() };
  }

  @Get("site-data")
  async siteData() {
    return readSiteData();
  }

  @Put("site-data")
  async updateSiteData(@Body() body: SiteData) {
    return saveSiteData(body);
  }

  @Get("homepage")
  async homepage() {
    return readSiteData();
  }

  @Get("categories")
  async getCategories() {
    return (await readSiteData()).categories;
  }

  @Get("products")
  async getProducts(@Query("q") query = "") {
    const products = (await readSiteData()).products;
    const q = query.trim().toLowerCase();
    if (!q) return products;

    return products.filter((product) =>
      [product.name, product.category, product.description ?? ""].some((value) =>
        value.toLowerCase().includes(q)
      )
    );
  }

  @Get("articles")
  async getArticles() {
    return (await readSiteData()).articles;
  }
}

@Module({
  controllers: [AppController]
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000"
  });
  await app.listen(Number(process.env.PORT ?? 4000));
}

bootstrap();
