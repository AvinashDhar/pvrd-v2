import { and, count, eq, like, or, sql, type SQL } from "drizzle-orm";
import { Users } from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { UserControls } from "@/components/admin/user-controls";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { accountStatuses, users, userTypes } from "@/lib/db/schema";
import { roleLabel } from "@/lib/auth/access";
import { formatDate } from "@/lib/format";

function asNumber(value: unknown) {
  return Number(value ?? 0);
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; status?: string; error?: string }>;
}) {
  const filters = await searchParams;
  const q = filters.q?.trim() ?? "";
  const type = userTypes.find((item) => item === filters.type);
  const status = accountStatuses.find((item) => item === filters.status);
  const where: SQL[] = [];
  if (q) {
    const term = `%${q.replace(/[%_]/g, "")}%`;
    where.push(or(like(users.name, term), like(users.mobile, term), like(users.email, term))!);
  }
  if (type) where.push(eq(users.userType, type));
  if (status) where.push(eq(users.status, status));

  const [totals] = await db
    .select({
      total: count(),
      retailers: sql<number>`sum(case when ${users.userType} = 'retailer' then 1 else 0 end)`,
      contractors: sql<number>`sum(case when ${users.userType} = 'contractor' then 1 else 0 end)`,
      pending: sql<number>`sum(case when ${users.status} = 'pending' then 1 else 0 end)`,
    })
    .from(users);

  const rows = await db
    .select()
    .from(users)
    .where(where.length ? and(...where) : undefined)
    .orderBy(sql`${users.createdAt} desc`);

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={asNumber(totals?.total)} icon={Users} tone="blue" />
        <StatCard label="Retailers" value={asNumber(totals?.retailers)} icon={Users} tone="green" />
        <StatCard label="Contractors" value={asNumber(totals?.contractors)} icon={Users} tone="orange" />
        <StatCard label="Waiting for approval" value={asNumber(totals?.pending)} icon={Users} tone="purple" />
      </section>

      <form className="flex min-w-0 flex-wrap items-center gap-2" action="/admin/users">
        <Input name="q" defaultValue={q} placeholder="Search name, mobile, or email" className="w-full min-w-0 sm:w-64" />
        <select name="type" defaultValue={type ?? ""} className="pvrd-select sm:w-auto sm:shrink-0">
          <option value="">All types</option>
          {userTypes.map((item) => (
            <option key={item} value={item}>
              {roleLabel(item)}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} className="pvrd-select sm:w-auto sm:shrink-0">
          <option value="">All statuses</option>
          {accountStatuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      {filters.error === "reason" ? (
        <p className="text-sm text-destructive">A block needs a short reason.</p>
      ) : null}

      <div className="pvrd-card overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
            <tr>
              {["User", "Type", "Mobile", "City", "Registered", "Status", ""].map((col) => (
                <th key={col || "actions"} className="px-4 py-3 font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No accounts match this filter.
                </td>
              </tr>
            ) : (
              rows.map((user) => (
                <tr key={user.id} className="pvrd-row">
                  <td className="px-4 py-3">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email || "No email"}</p>
                    {user.blockReason ? (
                      <p className="text-xs text-destructive">Blocked: {user.blockReason}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{roleLabel(user.userType)}</td>
                  <td className="px-4 py-3">{user.mobile}</td>
                  <td className="px-4 py-3">{user.city}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={user.status} />
                  </td>
                  <td className="px-4 py-3">
                    <UserControls id={user.id} status={user.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
