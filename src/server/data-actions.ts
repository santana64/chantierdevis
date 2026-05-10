"use server";

import { redirect } from "next/navigation";
import { destroySession, getCurrentUser, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stringFromForm } from "@/lib/utils";

export async function requestDataExportAction() {
  const user = await getCurrentUser();
  await prisma.dataRequest.create({
    data: { userId: user.id, type: "EXPORT", status: "COMPLETED", completedAt: new Date() },
  });
  redirect("/app/data/export");
}

export async function deleteAccountAction(formData: FormData) {
  const user = await getCurrentUser();
  const confirmation = stringFromForm(formData.get("confirmation"));
  const password = stringFromForm(formData.get("password"));

  if (confirmation !== "SUPPRIMER") redirect("/app/data?error=confirmation");
  if (!verifyPassword(password, user.passwordHash)) redirect("/app/data?error=password");

  await prisma.dataRequest.create({
    data: { userId: user.id, type: "DELETION", status: "REQUESTED" },
  });
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "data.account_deletion.requested",
      resource: "user",
      metadata: { confirmation: true },
    },
  });
  await prisma.user.delete({ where: { id: user.id } });
  await destroySession();
  redirect("/?accountDeleted=1");
}
