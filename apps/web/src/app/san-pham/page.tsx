import { getSiteData } from "../siteData";
import ProductLookupClient from "../ui/ProductLookupClient";

export default async function ProductPage() {
  const data = await getSiteData();

  return <ProductLookupClient data={data} />;
}
