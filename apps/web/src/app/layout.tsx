import type { Metadata } from "next";
import DisableServiceWorker from "./ui/DisableServiceWorker";
import "./styles.css";

export const metadata: Metadata = {
  title: "Happy Flower - Hoa tươi và quà tặng",
  description:
    "Website bán hoa tươi, giỏ trái cây và quà tặng được dựng bằng Next.js và NestJS."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <DisableServiceWorker />
        {children}
      </body>
    </html>
  );
}
