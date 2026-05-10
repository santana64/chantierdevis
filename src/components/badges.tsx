import { AlertTriangle, CheckCircle2, Clock3, FilePenLine, Send, XCircle } from "lucide-react";
import { getQuoteStatusLabel } from "@/domain/quotes";
import type { ComplianceStatus, QuoteStatus } from "@/domain/quotes/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<QuoteStatus, string> = {
  DRAFT: "border-slate-200 bg-slate-50 text-slate-700",
  READY: "border-blue-200 bg-blue-50 text-blue-800",
  SENT: "border-amber-200 bg-amber-50 text-amber-900",
  ACCEPTED: "border-green-200 bg-green-50 text-green-800",
  REFUSED: "border-red-200 bg-red-50 text-red-800",
  EXPIRED: "border-red-200 bg-red-50 text-red-700",
  ARCHIVED: "border-slate-200 bg-slate-50 text-slate-500",
};

const statusIcons: Record<QuoteStatus, typeof FilePenLine> = {
  DRAFT: FilePenLine,
  READY: CheckCircle2,
  SENT: Send,
  ACCEPTED: CheckCircle2,
  REFUSED: XCircle,
  EXPIRED: Clock3,
  ARCHIVED: Clock3,
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const Icon = statusIcons[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        statusStyles[status],
      )}
    >
      <Icon aria-hidden className="h-3 w-3" />
      {getQuoteStatusLabel(status)}
    </span>
  );
}

export function ComplianceBadge({ status }: { status: ComplianceStatus }) {
  const styles: Record<ComplianceStatus, string> = {
    INCOMPLETE: "border-red-200 bg-red-50 text-red-800",
    WARNING: "border-amber-200 bg-amber-50 text-amber-900",
    READY: "border-green-200 bg-green-50 text-green-800",
  };
  const labels: Record<ComplianceStatus, string> = {
    INCOMPLETE: "À compléter",
    WARNING: "Points à vérifier",
    READY: "Prêt à envoyer",
  };
  const Icon = status === "READY" ? CheckCircle2 : AlertTriangle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        styles[status],
      )}
    >
      <Icon aria-hidden className="h-3 w-3" />
      {labels[status]}
    </span>
  );
}

export function MarginBadge({ marginRate }: { marginRate: number }) {
  const style =
    marginRate >= 35
      ? "border-green-200 bg-green-50 text-green-800"
      : marginRate >= 20
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-red-200 bg-red-50 text-red-800";
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums",
        style,
      )}
    >
      {marginRate.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %
    </span>
  );
}
