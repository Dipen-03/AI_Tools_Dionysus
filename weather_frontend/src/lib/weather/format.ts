// Helpers for formatting ISO timestamps using the API's returned timezone-aware
// values. Open-Meteo returns ISO strings already shifted to the location's
// timezone (e.g. "2024-06-01T14:00"), so we treat them as naive local strings.

function parseNaiveLocal(iso: string): Date {
  // Open-Meteo returns e.g. "2024-06-01T14:00" — Date parses as local time. Good.
  // For "2024-06-01" (daily) we append T00:00 to be safe.
  const s = iso.length === 10 ? `${iso}T00:00` : iso;
  return new Date(s);
}

export function formatLocalTime(iso: string, fmt: "HH:mm" | "ha" | "weekday-short" | "weekday-short+date" = "HH:mm"): string {
  const d = parseNaiveLocal(iso);
  const hours = d.getHours();
  const minutes = d.getMinutes();

  if (fmt === "HH:mm") {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  if (fmt === "ha") {
    const h = hours % 12 === 0 ? 12 : hours % 12;
    return `${h}${hours < 12 ? "am" : "pm"}`;
  }
  if (fmt === "weekday-short") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[d.getDay()];
  }
  // weekday-short+date
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

export function formatNowLocal(localIso: string): string {
  return formatLocalTime(localIso, "HH:mm");
}
