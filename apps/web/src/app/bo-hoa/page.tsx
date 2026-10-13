import { getSiteData } from "../siteData";
import CategoryPageClient from "../ui/CategoryPageClient";

export default async function BouquetsPage() {
  const data = await getSiteData();

  return (
    <CategoryPageClient
      data={data}
    />
  );
}
