import "server-only";

import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { addDays } from "date-fns";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

export const SESSION_COOKIE = "cd_session";
export const DEMO_USER_EMAIL = "demo@chantierdevis.fr";
export const DEMO_USER_PASSWORD = "Demo-chantier-2026!";

const SESSION_DAYS = 30;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash?: string | null) {
  if (!storedHash) return false;
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const headerStore = await headers();
  const expiresAt = addDays(new Date(), SESSION_DAYS);

  await prisma.appSession.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      userAgent: headerStore.get("user-agent"),
      ipAddress: headerStore.get("x-forwarded-for")?.split(",")[0]?.trim(),
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.appSession.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getOptionalCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.appSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.appSession.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function getCurrentUser() {
  const user = await getOptionalCurrentUser();
  if (!user) redirect("/login?next=/app");
  return user;
}
