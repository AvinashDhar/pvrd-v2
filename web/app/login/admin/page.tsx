import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getAdminSession } from "@/lib/auth/session";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");
  return <LoginForm />;
}
