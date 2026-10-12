import AdminClient from "./ui/AdminClient";
import { getSiteData } from "../siteData";

export default async function AdminPage() {
  const data = await getSiteData();
  return <AdminClient initialData={data} />;
}
