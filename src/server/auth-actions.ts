"use server";

import { addHours } from "date-fns";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import {
  clearAuthFailures,
  createOneTimeToken,
  hashOneTimeToken,
  isAuthRateLimited,
  recordAuthFailure,
} from "@/lib/auth-security";
import { sendTransactionalEmail } from "@/lib/email/send";
import { prisma } from "@/lib/prisma";
import { getAppUrl } from "@/lib/stripe";
import { stringFromForm } from "@/lib/utils";

const LOGIN_LIMIT = { maxAttempts: 6, windowMinutes: 15, lockMinutes: 15 };
const REGISTER_LIMIT = { maxAttempts: 5, windowMinutes: 60, lockMinutes: 60 };
const RESET_REQUEST_LIMIT = { maxAttempts: 5, windowMinutes: 60, lockMinutes: 60 };
const RESET_CONFIRM_LIMIT = { maxAttempts: 10, windowMinutes: 60, lockMinutes: 60 };
const VERIFY_RESEND_LIMIT = { maxAttempts: 5, windowMinutes: 60, lockMinutes: 60 };

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8),
  next: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  next: z.string().optional(),
});

const passwordResetRequestSchema = z.object({
  email: z.string().trim().email(),
});

const passwordResetConfirmSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(10),
});

function safeNext(next?: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/app";
  if (next.startsWith("/login") || next.startsWith("/register")) return "/app";
  return next;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendVerificationEmail(user: { id: string; email: string; name: string }) {
  const token = createOneTimeToken();
  const verifyUrl = `${getAppUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const subject = "Vérifiez votre email ChantierDevis";
  const html = `
    <p>Bonjour ${escapeHtml(user.name)},</p>
    <p>Confirmez votre adresse email pour sécuriser votre compte ChantierDevis.</p>
    <p><a href="${escapeHtml(verifyUrl)}">Vérifier mon email</a></p>
    <p>Ce lien expire dans 48 heures. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
  `;
  const text = `Bonjour ${user.name},\n\nConfirmez votre adresse email pour sécuriser votre compte ChantierDevis.\n\n${verifyUrl}\n\nCe lien expire dans 48 heures. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`;

  await prisma.authToken.updateMany({
    where: {
      userId: user.id,
      purpose: "EMAIL_VERIFICATION",
      consumedAt: null,
    },
    data: { consumedAt: new Date() },
  });

  await prisma.authToken.create({
    data: {
      userId: user.id,
      purpose: "EMAIL_VERIFICATION",
      tokenHash: hashOneTimeToken(token),
      expiresAt: addHours(new Date(), 48),
    },
  });

  const result = await sendTransactionalEmail({
    to: user.email,
    subject,
    html,
    text,
  });

  await prisma.$transaction([
    prisma.emailDelivery.create({
      data: {
        userId: user.id,
        toEmail: user.email,
        subject,
        status: result.status,
        provider: result.provider,
        providerMessageId: result.providerMessageId,
        errorMessage: result.errorMessage,
        sentAt: result.status === "SENT" ? new Date() : null,
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "auth.email_verification.sent",
        resource: "user",
        metadata: { emailStatus: result.status },
      },
    }),
  ]);

  return result;
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: stringFromForm(formData.get("name")),
    email: stringFromForm(formData.get("email")).toLowerCase(),
    password: stringFromForm(formData.get("password")),
    next: stringFromForm(formData.get("next")),
  });

  if (!parsed.success) redirect("/register?error=invalid");
  if (await isAuthRateLimited("register", parsed.data.email, REGISTER_LIMIT)) {
    redirect("/register?error=locked");
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    await recordAuthFailure("register", parsed.data.email, REGISTER_LIMIT);
    redirect("/register?error=exists");
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: hashPassword(parsed.data.password),
      emailVerifiedAt: null,
    },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: "auth.register", resource: "user" },
  });

  // L'email de verification est optionnel — une erreur ici ne doit pas
  // bloquer l'inscription. Le compte est cree, la session demarre.
  try {
    await sendVerificationEmail(user);
  } catch {
    // Email non critique : on log en silence et on continue
    console.error("[register] sendVerificationEmail failed silently for", user.email);
  }

  await clearAuthFailures("register", parsed.data.email);
  await createSession(user.id);
  redirect(safeNext(parsed.data.next));
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: stringFromForm(formData.get("email")).toLowerCase(),
    password: stringFromForm(formData.get("password")),
    next: stringFromForm(formData.get("next")),
  });

  if (!parsed.success) redirect("/login?error=invalid");
  if (await isAuthRateLimited("login", parsed.data.email, LOGIN_LIMIT)) {
    redirect("/login?error=locked");
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    await recordAuthFailure("login", parsed.data.email, LOGIN_LIMIT);
    redirect("/login?error=credentials");
  }

  await prisma.auditLog.create({
    data: { userId: user.id, action: "auth.login", resource: "session" },
  });
  await clearAuthFailures("login", parsed.data.email);
  await createSession(user.id);
  redirect(safeNext(parsed.data.next));
}

export async function logoutAction() {
  await destroySession();
  redirect("/login?loggedOut=1");
}

export async function resendVerificationEmailAction() {
  const user = await getCurrentUser();
  if (user.emailVerifiedAt) redirect("/app?verification=already");

  if (await isAuthRateLimited("email-verification-resend", user.email, VERIFY_RESEND_LIMIT)) {
    redirect("/app?verification=limited");
  }

  await recordAuthFailure("email-verification-resend", user.email, VERIFY_RESEND_LIMIT);
  await sendVerificationEmail(user);
  redirect("/app?verification=sent");
}

export async function requestPasswordResetAction(formData: FormData) {
  const parsed = passwordResetRequestSchema.safeParse({
    email: stringFromForm(formData.get("email")).toLowerCase(),
  });

  if (!parsed.success) redirect("/forgot-password?sent=1");

  if (await isAuthRateLimited("password-reset-request", parsed.data.email, RESET_REQUEST_LIMIT)) {
    redirect("/forgot-password?sent=1");
  }

  await recordAuthFailure("password-reset-request", parsed.data.email, RESET_REQUEST_LIMIT);

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) redirect("/forgot-password?sent=1");

  const token = createOneTimeToken();
  const resetUrl = `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const subject = "Réinitialisation de votre mot de passe ChantierDevis";
  const html = `
    <p>Bonjour ${escapeHtml(user.name)},</p>
    <p>Vous avez demandé la réinitialisation de votre mot de passe ChantierDevis.</p>
    <p><a href="${escapeHtml(resetUrl)}">Choisir un nouveau mot de passe</a></p>
    <p>Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
  `;
  const text = `Bonjour ${user.name},\n\nVous avez demandé la réinitialisation de votre mot de passe ChantierDevis.\n\n${resetUrl}\n\nCe lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`;

  await prisma.authToken.updateMany({
    where: {
      userId: user.id,
      purpose: "PASSWORD_RESET",
      consumedAt: null,
    },
    data: { consumedAt: new Date() },
  });

  await prisma.authToken.create({
    data: {
      userId: user.id,
      purpose: "PASSWORD_RESET",
      tokenHash: hashOneTimeToken(token),
      expiresAt: addHours(new Date(), 1),
    },
  });

  const result = await sendTransactionalEmail({
    to: user.email,
    subject,
    html,
    text,
  });

  await prisma.$transaction([
    prisma.emailDelivery.create({
      data: {
        userId: user.id,
        toEmail: user.email,
        subject,
        status: result.status,
        provider: result.provider,
        providerMessageId: result.providerMessageId,
        errorMessage: result.errorMessage,
        sentAt: result.status === "SENT" ? new Date() : null,
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "auth.password_reset.request",
        resource: "user",
        metadata: { emailStatus: result.status },
      },
    }),
  ]);

  redirect("/forgot-password?sent=1");
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = passwordResetConfirmSchema.safeParse({
    token: stringFromForm(formData.get("token")),
    password: stringFromForm(formData.get("password")),
  });

  if (!parsed.success) redirect("/reset-password?error=invalid");

  const tokenHash = hashOneTimeToken(parsed.data.token);
  if (await isAuthRateLimited("password-reset-confirm", tokenHash, RESET_CONFIRM_LIMIT)) {
    redirect("/reset-password?error=locked");
  }

  const authToken = await prisma.authToken.findFirst({
    where: {
      tokenHash,
      purpose: "PASSWORD_RESET",
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!authToken) {
    await recordAuthFailure("password-reset-confirm", tokenHash, RESET_CONFIRM_LIMIT);
    redirect("/reset-password?error=invalid");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: authToken.userId },
      data: {
        passwordHash: hashPassword(parsed.data.password),
        emailVerifiedAt: authToken.user.emailVerifiedAt ?? new Date(),
      },
    }),
    prisma.authToken.update({
      where: { id: authToken.id },
      data: { consumedAt: new Date() },
    }),
    prisma.appSession.deleteMany({ where: { userId: authToken.userId } }),
    prisma.auditLog.create({
      data: {
        userId: authToken.userId,
        action: "auth.password_reset.complete",
        resource: "user",
      },
    }),
  ]);

  await clearAuthFailures("password-reset-confirm", tokenHash);
  redirect("/login?reset=success");
}

export async function updateAccountAction(formData: FormData) {
  const user = await getCurrentUser();
  const name = stringFromForm(formData.get("name")).trim();
  const currentPassword = stringFromForm(formData.get("currentPassword"));
  const newPassword = stringFromForm(formData.get("newPassword"));

  const updates: { name?: string; passwordHash?: string } = {};

  if (name && name.length >= 2) {
    updates.name = name;
  }

  if (newPassword) {
    if (newPassword.length < 10) redirect("/app/settings?account=weak-password");
    const currentHash = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
    if (!currentHash?.passwordHash || !verifyPassword(currentPassword, currentHash.passwordHash)) {
      redirect("/app/settings?account=wrong-password");
    }
    updates.passwordHash = hashPassword(newPassword);
  }

  if (Object.keys(updates).length > 0) {
    await prisma.user.update({ where: { id: user.id }, data: updates });
  }

  redirect("/app/settings?account=saved");
}
