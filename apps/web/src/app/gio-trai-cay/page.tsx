import { getSiteData } from "../siteData";
import CategoryPageClient from "../ui/CategoryPageClient";

export default async function FruitPage() {
  const data = await getSiteData();

  return (
    <CategoryPageClient
      data={data}
      initialCategory="Giỏ trái cây"
    />
  );
}
