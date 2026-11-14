"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authenticateCatalogueAccount, cleanEmail, registerCatalogueAccount, updateCatalogueProfile } from "@/lib/auth/catalogue-account";
import { createUserSession, destroyUserSession, getUserSession } from "@/lib/auth/session";
import { catalogueReturnPath } from "@/lib/pricing";

export async function signup(_previous: { error: string; field?: string } | null, formData: FormData) {
  const photo = formData.get("photo");
  const result = await registerCatalogueAccount({
    name: String(formData.get("name") ?? ""),
    mobile: String(formData.get("mobile") ?? ""),
    email: cleanEmail(String(formData.get("email") ?? "")),
    city: String(formData.get("city") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
    userType: String(formData.get("userType") ?? ""),
    photo: photo instanceof File ? photo : null,
  });
  if ("error" in result) return result;

  const next = catalogueReturnPath(formData.get("next"));
  if (result.status === "pending") {
    redirect(next ? `/login?notice=pending&next=${encodeURIComponent(next)}` : "/login?notice=pending");
  }
  await createUserSession(result.userId);
  redirect(next ?? "/account");
}

export async function loginUser(_previous: { error: string; field?: string } | null, formData: FormData) {
  const result = await authenticateCatalogueAccount(String(formData.get("identifier") ?? ""), String(formData.get("password") ?? ""));
  if ("error" in result) return result;
  await createUserSession(result.userId);
  redirect(catalogueReturnPath(formData.get("next")) ?? "/account");
}

export async function logoutUser() {
  await destroyUserSession();
  redirect("/");
}

export async function updateProfile(_previous: { error: string; field?: string } | null, formData: FormData) {
  const account = await getUserSession();
  if (!account) redirect("/login");

  const photo = formData.get("photo");
  const result = await updateCatalogueProfile(account, {
    name: String(formData.get("name") ?? ""),
    email: cleanEmail(String(formData.get("email") ?? "")),
    city: String(formData.get("city") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
    photo: photo instanceof File ? photo : null,
  });
  if ("error" in result) return result;

  revalidatePath("/account");
  redirect("/account?saved=1");
}
