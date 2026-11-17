"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { quotationAvailabilities, type QuotationAvailability } from "@/lib/db/schema";
import type { ActionNotice } from "@/lib/forms";
import { QuotationError, closeQuotation, commentOnQuotation, decideQuotation, reopenQuotation, updateQuotationItems } from "@/lib/quotations/service";

async function admin() {
  const session = await getAdminSession();
  if (!session) redirect("/login/admin");
  return session;
}

function refresh(id: string) {
  revalidatePath("/admin/quotations");
  revalidatePath(`/admin/quotations/${id}`);
}

function failure(error: unknown): ActionNotice {
  if (error instanceof QuotationError) return { error: error.message };
  throw error;
}

export async function commentOnQuotationAction(formData: FormData): Promise<ActionNotice> {
  const session = await admin();
  const id = String(formData.get("id") ?? "");
  try {
    await commentOnQuotation(id, { id: session.id, name: session.name, role: "admin" }, String(formData.get("body") ?? ""));
  } catch (error) {
    return failure(error);
  }
  refresh(id);
  return { message: "Reply sent." };
}

export async function decideQuotationAction(formData: FormData): Promise<ActionNotice> {
  const session = await admin();
  const id = String(formData.get("id") ?? "");
  const outcome = String(formData.get("outcome") ?? "");
  if (outcome !== "accepted" && outcome !== "declined") {
    return { error: "Choose accept or decline." };
  }
  try {
    await decideQuotation(id, session, outcome === "declined" ? "declined" : "accepted", String(formData.get("body") ?? ""));
  } catch (error) {
    return failure(error);
  }
  refresh(id);
  return { message: outcome === "declined" ? "Quotation declined." : "Quotation accepted." };
}

export async function closeQuotationAction(formData: FormData): Promise<ActionNotice> {
  const session = await admin();
  const id = String(formData.get("id") ?? "");
  try {
    await closeQuotation(id, { id: session.id, name: session.name, role: "admin" });
  } catch (error) {
    return failure(error);
  }
  refresh(id);
  return { message: "Quotation closed." };
}

export async function reopenQuotationAction(formData: FormData): Promise<ActionNotice> {
  const session = await admin();
  const id = String(formData.get("id") ?? "");
  try {
    await reopenQuotation(id, session);
  } catch (error) {
    return failure(error);
  }
  refresh(id);
  return { message: "Quotation reopened." };
}

export async function updateQuotationItemsAction(formData: FormData): Promise<ActionNotice> {
  const session = await admin();
  const id = String(formData.get("id") ?? "");
  const itemIds = formData.getAll("itemId").map(String);
  const updates = itemIds.map((itemId) => {
    const availability = String(formData.get(`availability-${itemId}`) ?? "");
    return {
      id: itemId,
      availability: quotationAvailabilities.includes(availability as QuotationAvailability) ? (availability as QuotationAvailability) : "unspecified",
      leadTime: String(formData.get(`lead-${itemId}`) ?? ""),
      itemNote: String(formData.get(`note-${itemId}`) ?? ""),
    };
  });
  try {
    await updateQuotationItems(id, session, updates);
  } catch (error) {
    return failure(error);
  }
  refresh(id);
  return { message: "Availability saved." };
}
