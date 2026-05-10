import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AuthenticatedAppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const company = await prisma.companyProfile.findUnique({
    where: { userId: user.id },
    select: { companyName: true },
  });
  return <AppShell user={user} companyName={company?.companyName ?? null}>{children}</AppShell>;
}
