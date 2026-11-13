import { redirect } from "next/navigation";
import { UserLoginForm } from "@/components/account/login-form";
import { getUserSession } from "@/lib/auth/session";

const notices: Record<string, string> = {
  pending: "Account created. An administrator must approve a carpenter or contractor account before it can sign in.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const session = await getUserSession();
  if (session) redirect("/account");
  const { notice } = await searchParams;
  return <UserLoginForm notice={notice ? notices[notice] : undefined} />;
}
