/**
 * Shared date/time formatting utilities — matches Nuxt utils/date.ts behavior.
 *
 * All functions that deal with "local" time (createdAt, appointmentDate, etc.)
 * strip the timezone indicator from the ISO string so the raw server value is
 * displayed without browser-side timezone conversion.  This matches the Nuxt
 * `formatThaiDateTimeLocal` behaviour.
 *
 * `fmtTimeBangkok` mirrors Nuxt `formatTime` which converts to Asia/Bangkok.
 */

/* ── Date only: dd/mm/YYYY+543 (from ISO string, no Date object) ── */
export function fmtDateThai(d: any): string {
  if (!d || typeof d !== "string") return "-";
  try {
    const dateStr = d.includes("T") ? d.split("T")[0] : d;
    if (!dateStr) return "-";
    const [year, month, day] = dateStr.split("-").map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return "-";
    if (month < 1 || month > 12 || day < 1 || day > 31) return "-";
    return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year + 543}`;
  } catch {
    return "-";
  }
}

/* ── Date + time: "dd/mm/YYYY+543 - HH:MM น."  (strip TZ, raw local) ── */
export function fmtDateTimeThai(d: any): string {
  if (!d || typeof d !== "string") return "-";
  try {
    const local = d.replace("Z", "").replace(/[+-]\d{2}:\d{2}$/, "");
    const date = new Date(local);
    if (isNaN(date.getTime())) return "-";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear() + 543;
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} - ${hh}:${min} น.`;
  } catch {
    return "-";
  }
}

/* ── Time only: "HH:MM:SS"  (extract from ISO string, strip TZ) ── */
export function fmtTimeDirect(d: any): string {
  if (!d || typeof d !== "string") return "-";
  try {
    if (!d.includes("T")) return "-";
    const timePart = d.split("T")[1];
    if (!timePart) return "-";
    const timeOnly = timePart
      .replace(/\.\d{3}Z?$/, "")
      .replace(/[+-]\d{2}:\d{2}$/, "")
      .replace(/Z$/, "");
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeOnly)) return timeOnly;
    if (/^\d{2}:\d{2}$/.test(timeOnly)) return `${timeOnly}:00`;
    return "-";
  } catch {
    return "-";
  }
}

/* ── Time in Bangkok timezone: "HH:MM"  (matches Nuxt formatTime) ── */
export function fmtTimeBangkok(d: any): string {
  if (!d || typeof d !== "string") return "-";
  try {
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return "-";
    return dateObj.toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "-";
  }
}

/* ── Human-friendly date: "19 ธ.ค. 2568" ── */
const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

export function fmtDateThaiLong(d: any): string {
  if (!d || typeof d !== "string") return "-";
  try {
    const dateStr = d.includes("T") ? d.split("T")[0] : d;
    if (!dateStr) return "-";
    const [year, month, day] = dateStr.split("-").map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return "-";
    return `${String(day).padStart(2, "0")} ${THAI_MONTHS_SHORT[month - 1]} ${year + 543}`;
  } catch {
    return "-";
  }
}

/* ── Age calculator ── */
export function calcAge(birthday: string | undefined | null): string {
  if (!birthday) return "-";
  try {
    const b = new Date(birthday);
    if (isNaN(b.getTime())) return "-";
    const now = new Date();
    let years = now.getFullYear() - b.getFullYear();
    if (
      now.getMonth() < b.getMonth() ||
      (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())
    ) {
      years--;
    }
    return String(years);
  } catch {
    return "-";
  }
}

/* ── Birthday: "dd/mm/YYYY+543" (same as fmtDateThai but handles non-string) ── */
export function formatBirthdayThai(birthday: string | undefined | null): string {
  if (!birthday || typeof birthday !== "string") return "-";
  return fmtDateThai(birthday);
}
