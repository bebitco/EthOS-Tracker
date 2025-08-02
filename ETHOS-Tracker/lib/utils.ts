import { clsx, type ClassValue } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatPrice(price: number, decimals: number = 2): string {
  return price.toFixed(decimals)
}

export function formatChange(change: number): string {
  return `${change > 0 ? "+" : ""}${change.toFixed(2)}%`
}