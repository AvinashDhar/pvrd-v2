import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/account/profile-form";
import { getUserSession } from "@/lib/auth/session";
import { isTradeAccount } from "@/lib/pricing";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const account = await getUserSession();
  if (!account) redirect("/login");
  const { saved } = await searchParams;
  return <ProfileForm account={account} saved={saved === "1"} trade={isTradeAccount(account.userType)} />;
}
