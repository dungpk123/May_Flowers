import { getSiteData } from "../siteData";
import SitePage from "../ui/SitePage";

export default async function BlogPage() {
  const data = await getSiteData();
  return <SitePage data={data} view="blog" />;
}
