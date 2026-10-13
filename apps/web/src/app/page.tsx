import { getSiteData } from "./siteData";
import LiveSitePage from "./ui/LiveSitePage";

export default async function Home() {
  const data = await getSiteData();
  return <LiveSitePage initialData={data} view="home" />;
}
