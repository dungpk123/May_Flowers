import "reflect-metadata";
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Module,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Order, SiteData } from "@shop-flower/data";
import multer from "multer";
import { deleteImageByUrl, isCloudinaryConfigured, uploadImageBuffer } from "./cloudinary";
import {
  createOrder,
  readOrders,
  readSiteData,
  saveSiteData,
  readPushSubscriptions,
  removePushSubscription,
  savePushSubscription,
  storageMode,
  updateOrderStatus
} from "./storage";
import webpush from "web-push";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY ?? "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? "";
const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:admin@mayflowers.shop";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

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
  async getProducts(@Query("q") query = "", @Query("category") category = "") {
    const products = (await readSiteData()).products;
    const q = query.trim().toLowerCase();
    const categoryName = category.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        !categoryName || product.category.trim().toLowerCase() === categoryName;
      const matchesQuery =
        !q ||
        [product.name, product.category, product.description ?? ""].some((value) =>
          value.toLowerCase().includes(q)
        );

      return matchesCategory && matchesQuery;
    });
  }

  @Get("articles")
  async getArticles() {
    return (await readSiteData()).articles;
  }

  @Get("orders")
  async getOrders() {
    return readOrders();
  }

  @Post("orders")
  async createOrderEndpoint(@Body() body: any) {
    if (!body.productName || !body.ordererName || !body.ordererPhone) {
      throw new BadRequestException("Vui lòng điền đầy đủ thông tin bắt buộc.");
    }
    const order = await createOrder(body);
    await notifyNewOrder(order);
    return order;
  }

  @Get("push/config")
  pushConfig() {
    return { enabled: Boolean(vapidPublicKey && vapidPrivateKey), publicKey: vapidPublicKey };
  }

  @Post("push/subscribe")
  async subscribePush(@Body() body: any) {
    if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
      throw new BadRequestException("Subscription thông báo không hợp lệ.");
    }
    await savePushSubscription(body);
    return { ok: true };
  }

  @Delete("push/subscribe")
  async unsubscribePush(@Body("endpoint") endpoint: string) {
    if (endpoint) await removePushSubscription(endpoint);
    return { ok: true };
  }

  @Put("orders/:id/status")
  async updateStatusEndpoint(@Param("id") id: string, @Body("status") status: any) {
    const updated = await updateOrderStatus(id, status);
    if (!updated) {
      throw new BadRequestException("Không tìm thấy đơn hàng.");
    }
    return updated;
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
class AppModule { }

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

async function notifyNewOrder(order: Order) {
  if (!vapidPublicKey || !vapidPrivateKey) return;

  const subscriptions = await readPushSubscriptions();
  const payload = JSON.stringify({
    title: "Đơn hàng mới",
    body: `${order.orderCode} - ${order.productName}`,
    url: "/admin",
    orderCode: order.orderCode
  });

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, payload);
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await removePushSubscription(subscription.endpoint);
        }
      }
    })
  );
}
