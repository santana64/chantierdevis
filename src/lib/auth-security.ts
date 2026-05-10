import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { addMinutes, differenceInMilliseconds } from "date-fns";
import { headers } from "next/headers";
import { prisma } from "./prisma";

type RateLimitConfig = {
  maxAttempts: number;
  windowMinutes: number;
  lockMinutes: number;
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function hashOneTimeToken(token: string) {
  return sha256(token);
}

export function createOneTimeToken() {
  return randomBytes(32).toString("base64url");
}

async function buildIdentifierHash(action: string, subject?: string | null) {
  const headerStore = await headers();
  const ipAddress = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const normalizedSubject = subject?.trim().toLowerCase() || "anonymous";
  return sha256(`${action}:${ipAddress}:${normalizedSubject}`);
}

function isWindowExpired(windowStartedAt: Date, windowMinutes: number) {
  return differenceInMilliseconds(new Date(), windowStartedAt) > windowMinutes * 60 * 1000;
}

export async function isAuthRateLimited(
  action: string,
  subject: string | null,
  config: RateLimitConfig,
) {
  const identifierHash = await buildIdentifierHash(action, subject);
  const record = await prisma.authRateLimit.findUnique({
    where: { identifierHash_action: { identifierHash, action } },
  });

  if (!record) return false;
  if (record.lockedUntil && record.lockedUntil > new Date()) return true;

  if (isWindowExpired(record.windowStartedAt, config.windowMinutes)) {
    await prisma.authRateLimit.update({
      where: { id: record.id },
      data: {
        attempts: 0,
        windowStartedAt: new Date(),
        lockedUntil: null,
      },
    });
  }

  return false;
}

export async function recordAuthFailure(
  action: string,
  subject: string | null,
  config: RateLimitConfig,
) {
  const identifierHash = await buildIdentifierHash(action, subject);
  const now = new Date();
  const record = await prisma.authRateLimit.findUnique({
    where: { identifierHash_action: { identifierHash, action } },
  });

  if (!record || isWindowExpired(record.windowStartedAt, config.windowMinutes)) {
    await prisma.authRateLimit.upsert({
      where: { identifierHash_action: { identifierHash, action } },
      create: {
        identifierHash,
        action,
        attempts: 1,
        windowStartedAt: now,
        lockedUntil: null,
      },
      update: {
        attempts: 1,
        windowStartedAt: now,
        lockedUntil: null,
      },
    });
    return;
  }

  const attempts = record.attempts + 1;
  await prisma.authRateLimit.update({
    where: { id: record.id },
    data: {
      attempts,
      lockedUntil: attempts >= config.maxAttempts ? addMinutes(now, config.lockMinutes) : null,
    },
  });
}

export async function clearAuthFailures(action: string, subject: string | null) {
  const identifierHash = await buildIdentifierHash(action, subject);
  await prisma.authRateLimit.deleteMany({
    where: { identifierHash, action },
  });
}
