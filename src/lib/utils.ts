import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO, differenceInDays } from "date-fns";
import { it } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(n: number, currency = "EUR") {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(n || 0);
}

export function formatNumber(n: number, decimals = 2) {
  return new Intl.NumberFormat("it-IT", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n || 0);
}

export function formatDate(d: Date | string | null | undefined, fmt = "dd/MM/yyyy") {
  if (!d) return "—";
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, fmt, { locale: it });
}

export function formatDateTime(d: Date | string | null | undefined) {
  return formatDate(d, "dd/MM/yyyy HH:mm");
}

export function timeAgo(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? parseISO(d) : d;
  return formatDistanceToNow(date, { addSuffix: true, locale: it });
}

export function daysUntil(d: Date | string | null | undefined): number | null {
  if (!d) return null;
  const date = typeof d === "string" ? parseISO(d) : d;
  return differenceInDays(date, new Date());
}

export function initials(name: string): string {
  return name.split(" ").map(s => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function slugify(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function calcVatBreakdown(lines: { quantity: number; unitPrice: number; discountPercent?: number; vatRate: number }[]) {
  let subtotal = 0;
  let vat = 0;
  for (const l of lines) {
    const gross = (l.quantity || 0) * (l.unitPrice || 0);
    const discounted = gross * (1 - (l.discountPercent || 0) / 100);
    subtotal += discounted;
    vat += discounted * ((l.vatRate || 0) / 100);
  }
  return { subtotal: round2(subtotal), vat: round2(vat), total: round2(subtotal + vat) };
}

export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function validateItalianVAT(vat: string): boolean {
  const cleaned = (vat || "").replace(/\s/g, "").replace(/^IT/i, "");
  if (!/^\d{11}$/.test(cleaned)) return false;
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const d = parseInt(cleaned[i], 10);
    if (i % 2 === 0) sum += d;
    else { const x = d * 2; sum += x > 9 ? x - 9 : x; }
  }
  return sum % 10 === 0;
}

export function validateItalianFiscalCode(cf: string): boolean {
  const c = (cf || "").toUpperCase().trim();
  return /^[A-Z]{6}\d{2}[A-EHLMPRST]\d{2}[A-Z]\d{3}[A-Z]$/.test(c);
}

export function nextDocumentNumber(last: string | null | undefined, year?: number): string {
  const y = year ?? new Date().getFullYear();
  if (!last) return `${y}/0001`;
  const m = last.match(/(\d+)\/(\d{4})$|(\d+)$/);
  const n = m ? parseInt(m[1] || m[3] || "0", 10) + 1 : 1;
  return `${y}/${String(n).padStart(4, "0")}`;
}
