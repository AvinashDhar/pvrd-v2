import { Bell } from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate, formatNumber } from "@/lib/format";
import { listNotificationRows } from "@/lib/records";

export default async function NotificationsPage() {
  const notifications = await listNotificationRows();
  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Notifications" value={notifications.length} icon={Bell} tone="blue" />
        <StatCard label="Sent" value={notifications.filter((item) => item.status === "sent").length} icon={Bell} tone="green" />
        <StatCard label="Scheduled" value={notifications.filter((item) => item.status === "scheduled").length} icon={Bell} tone="purple" />
        <StatCard label="Drafts" value={notifications.filter((item) => item.status === "draft").length} icon={Bell} tone="orange" />
      </section>
      {notifications.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notifications yet.</p>
      ) : (
        <div className="pvrd-card overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
              <tr>
                {["Title", "Type", "Audience", "Status", "Scheduled", "Recipients"].map((col) => (
                  <th key={col} className="px-4 py-3 font-medium">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {notifications.map((item) => (
                <tr key={item.id} className="pvrd-row">
                  <td className="px-4 py-3 font-medium">{item.title}</td>
                  <td className="px-4 py-3">{item.type}</td>
                  <td className="px-4 py-3">{item.audience}</td>
                  <td className="px-4 py-3"><StatusBadge value={item.status} /></td>
                  <td className="px-4 py-3">{item.scheduledAt ? formatDate(item.scheduledAt) : "—"}</td>
                  <td className="px-4 py-3">{formatNumber(item.recipientCount ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
