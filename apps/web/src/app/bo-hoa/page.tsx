import { getSiteData } from "../siteData";
import CategoryPageClient from "../ui/CategoryPageClient";

export default async function BouquetsPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [data, params] = await Promise.all([getSiteData(), searchParams]);

  return (
    <CategoryPageClient
      data={data}
      initialCategory={params.category}
    />
  );
}
