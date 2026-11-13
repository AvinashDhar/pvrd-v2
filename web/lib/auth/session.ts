import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminSessions, admins, userSessions, users } from "@/lib/db/schema";

const COOKIE = "pvrd_session";
const USER_COOKIE = "pvrd_user";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAdminSession(adminId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + WEEK_MS);

  await db.insert(adminSessions).values({
    adminId,
    tokenHash: hashToken(token),
    expiresAt,
  });

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getAdminSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  const [session] = await db
    .select({
      id: admins.id,
      name: admins.name,
      email: admins.email,
      sessionId: adminSessions.id,
    })
    .from(adminSessions)
    .innerJoin(admins, eq(adminSessions.adminId, admins.id))
    .where(and(eq(adminSessions.tokenHash, hashToken(token)), gt(adminSessions.expiresAt, new Date())))
    .limit(1);

  return session ?? null;
}

export async function destroyAdminSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await db.delete(adminSessions).where(eq(adminSessions.tokenHash, hashToken(token)));
  }
  jar.delete(COOKIE);
}

export type CatalogueAccount = {
  id: string;
  name: string;
  email: string | null;
  mobile: string;
  userType: "retailer" | "contractor" | "consumer";
  city: string | null;
  status: "pending" | "active" | "inactive" | "blocked";
  photoUrl: string | null;
  photoKey: string | null;
  blockReason: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
};

export async function createUserSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + WEEK_MS);

  await db.insert(userSessions).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
  });

  const jar = await cookies();
  jar.set(USER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getUserSession() {
  const jar = await cookies();
  const token = jar.get(USER_COOKIE)?.value;
  if (!token) return null;

  const [session] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      mobile: users.mobile,
      userType: users.userType,
      city: users.city,
      status: users.status,
      photoUrl: users.photoUrl,
      photoKey: users.photoKey,
      blockReason: users.blockReason,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(userSessions)
    .innerJoin(users, eq(userSessions.userId, users.id))
    .where(and(eq(userSessions.tokenHash, hashToken(token)), gt(userSessions.expiresAt, new Date())))
    .limit(1);

  if (!session || session.status !== "active") return null;
  return session satisfies CatalogueAccount;
}

export async function destroyUserSession() {
  const jar = await cookies();
  const token = jar.get(USER_COOKIE)?.value;
  if (token) {
    await db.delete(userSessions).where(eq(userSessions.tokenHash, hashToken(token)));
  }
  jar.delete(USER_COOKIE);
}
