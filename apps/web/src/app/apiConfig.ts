export const publicApiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://shop-flower-api.onrender.com"
    : "http://localhost:4000");
