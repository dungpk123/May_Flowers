import "reflect-metadata";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Module,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FileInterceptor } from "@nestjs/platform-express";
import type { SiteData } from "@shop-flower/data";
import multer from "multer";
import { deleteImageByUrl, isCloudinaryConfigured, uploadImageBuffer } from "./cloudinary";
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

  @Post("uploads/image")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: multer.memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        if (!file.mimetype.startsWith("image/")) {
          callback(new BadRequestException("Chỉ chấp nhận file ảnh."), false);
          return;
        }

        callback(null, true);
      }
    })
  )
  async uploadImage(@UploadedFile() file?: Express.Multer.File, @Body("previousUrl") previousUrl = "") {
    if (!file) {
      throw new BadRequestException("Thiếu file ảnh.");
    }

    if (!isCloudinaryConfigured()) {
      throw new BadRequestException("Cloudinary chưa được cấu hình.");
    }

    if (previousUrl) {
      await deleteImageByUrl(previousUrl);
    }

    const result = await uploadImageBuffer(file);
    const url = result.secure_url || result.url;

    return {
      url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    };
  }
}

@Module({
  controllers: [AppController]
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = (process.env.WEB_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins
  });
  await app.listen(Number(process.env.PORT ?? 4000));
}

bootstrap();
