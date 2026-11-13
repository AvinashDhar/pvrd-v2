import { Star } from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate } from "@/lib/format";
import { listReviewRows } from "@/lib/records";

export default async function ReviewsPage() {
  const reviews = await listReviewRows();
  const avg = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : "—";
  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total reviews" value={reviews.length} icon={Star} tone="blue" />
        <StatCard label="Average rating" value={avg} icon={Star} tone="green" />
        <StatCard label="Unreplied" value={reviews.filter((review) => !review.replied).length} icon={Star} tone="orange" />
        <StatCard label="Pending moderation" value={reviews.filter((review) => review.status === "pending").length} icon={Star} tone="red" />
      </section>
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <div className="grid gap-3">
          {reviews.map((review) => (
            <article key={review.id} className="pvrd-card p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-heading font-semibold">{review.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {review.consumer} → {review.contractor} · {formatDate(review.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#A3CB46]">{"★".repeat(review.rating)}</span>
                  <StatusBadge value={review.status} />
                  <StatusBadge value={review.replied ? "contacted" : "pending"} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
