import { notFound } from "next/navigation";
import { getSiteData } from "../../siteData";
import ProductDetailClient from "../../ui/ProductDetailClient";

export default async function ProductDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, data] = await Promise.all([params, getSiteData()]);
  const product = data.products.find((item) => String(item.id) === id);

  if (!product) notFound();

  return <ProductDetailClient data={data} product={product} />;
}
