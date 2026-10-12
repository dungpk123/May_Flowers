import { getSiteData } from "../siteData";
import SitePage from "../ui/SitePage";

export default async function AboutPage() {
  const data = await getSiteData();
  return <SitePage data={data} view="about" />;
}
