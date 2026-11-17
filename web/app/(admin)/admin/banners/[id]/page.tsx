import Link from "next/link";
import { notFound } from "next/navigation";
import { NotifyForm } from "@/components/admin/notify-form";
import { Button } from "@/components/ui/button";
import { BannerForm } from "@/components/admin/banner-form";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { deleteBanner, setBannerStatus } from "@/lib/actions/banners";
import { bannerLinkOptions, getBanner } from "@/lib/banners/queries";

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [banner, options] = await Promise.all([getBanner(id), bannerLinkOptions()]);
  if (!banner) notFound();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/banners" />}>All banners</Button>
        <div className="flex flex-wrap gap-2">
          <NotifyForm action={setBannerStatus}>
            <input type="hidden" name="id" value={banner.id} />
            <input type="hidden" name="status" value={banner.status === "active" ? "inactive" : "active"} />
            <Button type="submit" variant="outline">{banner.status === "active" ? "Disable" : "Enable"}</Button>
          </NotifyForm>
          <ConfirmForm action={deleteBanner} message="Delete this banner permanently? This cannot be undone.">
            <input type="hidden" name="id" value={banner.id} />
            <Button type="submit" variant="destructive">Delete</Button>
          </ConfirmForm>
        </div>
      </div>
      <BannerForm banner={banner} {...options} />
    </div>
  );
}
