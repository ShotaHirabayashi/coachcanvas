import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isToday, isTomorrow, differenceInDays } from "date-fns";
import { ja } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, "M月d日（E）", { locale: ja });
}

export function formatDateTime(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, "M月d日（E） HH:mm", { locale: ja });
}

export function formatFullDate(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, "yyyy年M月d日（E）", { locale: ja });
}

export function formatTime(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, "HH:mm");
}

export function isDateToday(dateStr: string): boolean {
  return isToday(parseISO(dateStr));
}

export function isDateTomorrow(dateStr: string): boolean {
  return isTomorrow(parseISO(dateStr));
}

export function daysSince(dateStr: string): number {
  return differenceInDays(new Date(), parseISO(dateStr));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(amount);
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/[-*+]\s/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}
