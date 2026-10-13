import { v2 as cloudinary } from "cloudinary";

let configured = false;

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function ensureCloudinaryConfigured() {
  if (configured || !isCloudinaryConfigured()) return;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });

  configured = true;
}

export async function uploadImageBuffer(
  file: Express.Multer.File,
  folder = "shop-flower/uploads"
) {
  ensureCloudinaryConfigured();

  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured.");
  }

  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

  return cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "image",
    use_filename: true,
    unique_filename: true,
    overwrite: false
  });
}
