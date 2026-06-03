import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAvatarGradient(text: string) {
  if (!text) return "linear-gradient(135deg, #cbd5e1, #94a3b8)";
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 60) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 75%, 65%), hsl(${h2}, 75%, 50%))`;
}

export function getInitials(text: string) {
  if (!text) return "-";
  const trimmed = text.trim();
  if (!trimmed) return "-";
  return trimmed.charAt(0);
}
