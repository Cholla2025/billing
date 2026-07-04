import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");
  const demo = process.env.NEXT_PUBLIC_DEMO_ROLE_SWITCH !== "false";
  return <LoginForm demo={demo} />;
}
