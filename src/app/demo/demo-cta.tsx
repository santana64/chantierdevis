"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";

const CTA_URL = "/register?next=/app/quotes/new&utm_source=demo&utm_medium=cta&utm_campaign=demo_to_register";

export function DemoCTA({ label, size = "lg", position }: { label: string; size?: "sm" | "lg"; position: string }) {
  return (
    <Link
      href={CTA_URL}
      onClick={() => track("demo_cta_click", { position, label })}
      className={
        size === "lg"
          ? "inline-flex items-center gap-2 rounded-xl bg-green-500 px-8 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-green-600"
          : "inline-flex items-center gap-1.5 rounded-lg bg-green-500 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-green-600"
      }
    >
      {label}
      <ArrowRight aria-hidden className="h-4 w-4" />
    </Link>
  );
}

export function StickyBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0f1f31]/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between gap-4">
      <p className="text-sm font-semibold text-white hidden sm:block">
        Prêt à créer votre propre devis ?
      </p>
      <div className="flex items-center gap-3 mx-auto sm:mx-0">
        <Link
          href={CTA_URL}
          onClick={() => track("demo_cta_click", { position: "sticky_bar", label: "sticky" })}
          className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-green-600"
        >
          Créer mon premier devis gratuitement
          <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
        <p className="text-xs text-white/40 hidden md:block">0 € · Sans carte</p>
      </div>
    </div>
  );
}

export function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 30);
    return () => clearInterval(timer);
  }, [target]);

  return <>{count.toLocaleString("fr-FR")}{suffix}</>;
}
