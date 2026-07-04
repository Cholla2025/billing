import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Platform from "@/components/Platform";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <Platform role={session.role} />;
}
