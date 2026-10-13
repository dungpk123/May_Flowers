import { getSiteData } from "../siteData";
import LiveSitePage from "../ui/LiveSitePage";

export default async function AboutPage() {
  const data = await getSiteData();
  return <LiveSitePage initialData={data} view="about" />;
}
