import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to a human readable string
 */
export function formatDate(date: Date): string {
  const today = new Date();
  const isToday = date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
  
  // Format for the date portion
  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric"
  };
  
  // Format for the time portion
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "numeric"
  };
  
  // If it's today, just show the time
  if (isToday) {
    return `Today at ${new Intl.DateTimeFormat("en-US", timeOptions).format(date)}`;
  }
  
  // Otherwise show the full date and time
  const dateStr = new Intl.DateTimeFormat("en-US", dateOptions).format(date);
  const timeStr = new Intl.DateTimeFormat("en-US", timeOptions).format(date);
  
  return `${dateStr} – ${timeStr}`;
}
