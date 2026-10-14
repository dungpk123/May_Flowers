import AdminClient from "./ui/AdminClient";
import { getSiteData } from "../siteData";

export default async function AdminPage() {
  const data = await getSiteData();
  return (
    <>
      <link rel="manifest" href="/admin-manifest.webmanifest" />
      <meta name="theme-color" content="#488949" />
      <AdminClient initialData={data} />
    </>
  );
}
