import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function centsFromEurosInput(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").replace(",", ".").trim();
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100);
}

export function numberFromForm(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function stringFromForm(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}
