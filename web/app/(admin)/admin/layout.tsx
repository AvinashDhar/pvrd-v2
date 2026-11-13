import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/shell";
import { getAdminSession } from "@/lib/auth/session";
import { adminSearchIndex } from "@/lib/records";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/login/admin");
  const search = await adminSearchIndex();
  return (
    <AdminShell admin={{ name: session.name, email: session.email }} search={search}>
      {children}
    </AdminShell>
  );
}
