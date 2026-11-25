import type { DocStatus } from "@/lib/types";

export function todayISO(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDaysISO(days: number, now = new Date()) {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  date.setDate(date.getDate() + days);
  return todayISO(date);
}

export function daysUntil(iso: string, now = new Date()) {
  const [year, month, day] = iso.split("-").map(Number);
  const end = new Date(year, (month ?? 1) - 1, day ?? 1);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export function statusFor(iso: string, now = new Date()): DocStatus {
  const days = daysUntil(iso, now);
  if (days < 0) return "expired";
  if (days <= 30) return "expiring";
  return "valid";
}

export function formatDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function isISODate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}
