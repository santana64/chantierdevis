import { NextResponse } from "next/server";
import { hashOneTimeToken } from "@/lib/auth-security";
import { prisma } from "@/lib/prisma";
import { getAppUrl } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const appUrl = getAppUrl();

  if (!token) {
    return NextResponse.redirect(`${appUrl}/login?verify=invalid`);
  }

  const authToken = await prisma.authToken.findFirst({
    where: {
      tokenHash: hashOneTimeToken(token),
      purpose: "EMAIL_VERIFICATION",
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!authToken) {
    return NextResponse.redirect(`${appUrl}/login?verify=invalid`);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: authToken.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.authToken.update({
      where: { id: authToken.id },
      data: { consumedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: {
        userId: authToken.userId,
        action: "auth.email_verification.complete",
        resource: "user",
      },
    }),
  ]);

  return NextResponse.redirect(`${appUrl}/login?verify=success`);
}
