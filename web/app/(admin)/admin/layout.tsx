import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FlashToast } from "@/components/admin/flash-toast";
import { AdminShell } from "@/components/admin/shell";
import { getAdminSession } from "@/lib/auth/session";
import { readFlash } from "@/lib/flash";
import { countQuotationsAwaitingAdmin } from "@/lib/quotations/service";
import { adminSearchIndex } from "@/lib/records";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/login/admin");
  const [search, awaiting, notice] = await Promise.all([adminSearchIndex(), countQuotationsAwaitingAdmin(), readFlash()]);
  return (
    <AdminShell admin={{ name: session.name, email: session.email }} search={search} awaiting={awaiting}>
      <FlashToast notice={notice} />
      {children}
    </AdminShell>
  );
}
