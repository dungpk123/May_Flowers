import { getSiteData } from "../siteData";
import LiveSitePage from "../ui/LiveSitePage";

export default async function BlogPage() {
  const data = await getSiteData();
  return <LiveSitePage initialData={data} view="blog" />;
}
