import { redirect } from "next/navigation";
import { SignupForm } from "@/components/account/signup-form";
import { getUserSession } from "@/lib/auth/session";

export default async function SignupPage() {
  const session = await getUserSession();
  if (session) redirect("/account");
  return <SignupForm />;
}
