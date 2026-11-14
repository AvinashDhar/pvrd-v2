import { redirect } from "next/navigation";
import { SignupForm } from "@/components/account/signup-form";
import { getUserSession } from "@/lib/auth/session";
import { catalogueReturnPath } from "@/lib/pricing";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const returnTo = catalogueReturnPath((await searchParams).next);
  const session = await getUserSession();
  if (session) redirect(returnTo ?? "/account");
  return <SignupForm returnTo={returnTo} />;
}
