import { redirect } from "next/navigation";
import { UserLoginForm } from "@/components/account/login-form";
import { getUserSession } from "@/lib/auth/session";
import { catalogueReturnPath } from "@/lib/pricing";

const notices: Record<string, string> = {
  pending: "Account created. An administrator must approve a carpenter or contractor account before it can sign in.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; next?: string }>;
}) {
  const { notice, next } = await searchParams;
  const returnTo = catalogueReturnPath(next);
  const session = await getUserSession();
  if (session) redirect(returnTo ?? "/account");
  return <UserLoginForm notice={notice ? notices[notice] : undefined} returnTo={returnTo} />;
}
