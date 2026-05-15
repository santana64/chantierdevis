"use client";

export function SignatureLinkInput({ url }: { url: string }) {
  return (
    <input
      readOnly
      value={url}
      className="w-full rounded-xl border border-border bg-slate-50 px-3 py-2 text-xs font-mono text-foreground"
      onClick={(e) => (e.target as HTMLInputElement).select()}
    />
  );
}
