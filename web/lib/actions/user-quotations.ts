"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth/session";
import { formError, type FormState } from "@/lib/forms";
import { catalogueReturnPath } from "@/lib/pricing";
import {
  addToBucket,
  closeQuotation,
  commentOnQuotation,
  parseQuantity,
  QuotationError,
  removeBucketItem,
  requestQuotation,
  setBucketQuantity,
} from "@/lib/quotations/service";

function login(next: string): never {
  redirect(`/login?next=${encodeURIComponent(next)}`);
}

async function account(next: string) {
  const session = await getUserSession();
  if (!session) login(next);
  return session;
}

function failure(error: unknown): string {
  if (error instanceof QuotationError) return error.message;
  throw error;
}

function refresh(paths: string[]) {
  for (const path of paths) revalidatePath(path);
  revalidatePath("/admin/quotations");
}

export async function addToQuotationBucket(_previous: FormState, formData: FormData): Promise<FormState> {
  const productId = String(formData.get("productId") ?? "");
  const next = catalogueReturnPath(formData.get("next")) ?? (productId ? `/products/${productId}` : "/products");
  const session = await getUserSession();
  if (!session) login(next);
  const quantity = parseQuantity(formData.get("quantity"));
  if (!quantity) return formError("Enter a quantity from 1 to 999.", "quantity");
  const variantId = String(formData.get("variantId") ?? "").trim() || null;
  try {
    await addToBucket(session.id, { productId, variantId, quantity });
  } catch (error) {
    return formError(failure(error), variantId ? "variantId" : "quantity");
  }
  refresh(["/quotations/bucket"]);
  redirect("/quotations/bucket?added=1");
}

export async function updateBucketQuantity(formData: FormData) {
  const session = await account("/quotations/bucket");
  const itemId = String(formData.get("itemId") ?? "");
  const quantity = parseQuantity(formData.get("quantity"));
  if (!quantity) redirect("/quotations/bucket?error=Enter%20a%20quantity%20from%201%20to%20999.");
  try {
    await setBucketQuantity(session.id, itemId, quantity);
  } catch (error) {
    redirect(`/quotations/bucket?error=${encodeURIComponent(failure(error))}`);
  }
  refresh(["/quotations/bucket"]);
  redirect("/quotations/bucket");
}

export async function removeBucketLine(formData: FormData) {
  const session = await account("/quotations/bucket");
  try {
    await removeBucketItem(session.id, String(formData.get("itemId") ?? ""));
  } catch (error) {
    redirect(`/quotations/bucket?error=${encodeURIComponent(failure(error))}`);
  }
  refresh(["/quotations/bucket"]);
  redirect("/quotations/bucket");
}

export async function requestUserQuotation(formData: FormData) {
  const session = await account("/quotations/bucket");
  const note = String(formData.get("note") ?? "");
  let id = "";
  try {
    id = await requestQuotation(session, note);
  } catch (error) {
    redirect(`/quotations/bucket?error=${encodeURIComponent(failure(error))}`);
  }
  refresh(["/quotations", "/quotations/bucket", `/quotations/${id}`]);
  redirect(`/quotations/${id}`);
}

export async function commentAsUser(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const session = await account(`/quotations/${id}`);
  try {
    await commentOnQuotation(id, { id: session.id, name: session.name, role: "user" }, String(formData.get("body") ?? ""));
  } catch (error) {
    redirect(`/quotations/${id}?error=${encodeURIComponent(failure(error))}`);
  }
  refresh(["/quotations", `/quotations/${id}`]);
  redirect(`/quotations/${id}`);
}

export async function closeUserQuotation(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const session = await account(`/quotations/${id}`);
  try {
    await closeQuotation(id, { id: session.id, name: session.name, role: "user" });
  } catch (error) {
    redirect(`/quotations/${id}?error=${encodeURIComponent(failure(error))}`);
  }
  refresh(["/quotations", `/quotations/${id}`]);
  redirect(`/quotations/${id}`);
}
