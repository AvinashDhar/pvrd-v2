import { BannerForm } from "@/components/admin/banner-form";
import { bannerLinkOptions } from "@/lib/banners/queries";

export default async function NewBannerPage() {
  const options = await bannerLinkOptions();
  return <BannerForm {...options} />;
}
