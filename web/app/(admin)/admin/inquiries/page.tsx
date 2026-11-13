import { MessageSquare } from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate } from "@/lib/format";
import { listInquiryRows } from "@/lib/records";

export default async function InquiriesPage() {
  const inquiries = await listInquiryRows();
  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="All inquiries" value={inquiries.length} icon={MessageSquare} tone="blue" />
        <StatCard label="Pending" value={inquiries.filter((item) => item.status === "pending").length} icon={MessageSquare} tone="orange" />
        <StatCard label="Contacted" value={inquiries.filter((item) => item.status === "contacted").length} icon={MessageSquare} tone="purple" />
        <StatCard label="Closed" value={inquiries.filter((item) => item.status === "closed").length} icon={MessageSquare} tone="green" />
      </section>
      {inquiries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No inquiries yet.</p>
      ) : (
        <div className="pvrd-card overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
              <tr>
                {["Customer", "Type", "Subject", "Related", "Date", "Follow-up"].map((col) => (
                  <th key={col} className="px-4 py-3 font-medium">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inquiry) => (
                <tr key={inquiry.id} className="pvrd-row">
                  <td className="px-4 py-3 font-medium">{inquiry.name}</td>
                  <td className="px-4 py-3">{inquiry.type}</td>
                  <td className="px-4 py-3">{inquiry.subject}</td>
                  <td className="px-4 py-3 text-muted-foreground">{inquiry.product ?? "—"}</td>
                  <td className="px-4 py-3">{formatDate(inquiry.createdAt)}</td>
                  <td className="px-4 py-3"><StatusBadge value={inquiry.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
