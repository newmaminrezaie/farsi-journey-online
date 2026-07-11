// Minimal Gregorian ⇄ Jalali conversion (Kazimierz M. Borkowski algorithm)
// Adapted from https://jdf.scr.ir/  — implemented locally, no external calls.

export function toJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 355666 + 365 * gy + Math.floor((gy2 + 3) / 4)
    - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400)
    + gd + g_d_m[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return [jy, jm, jd];
}

export function toGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  jy += 1595;
  let days = -355668 + 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4)
    + jd + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const sal_a = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) gd -= sal_a[gm];
  return [gy, gm, gd];
}

const FA_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

const toFaDigits = (s: string) => s.replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[+d]);

/** Format an ISO date "yyyy-mm-dd" as e.g. "۱۵ مهر ۱۴۰۳" */
export function formatJalali(iso: string | null | undefined): string {
  if (!iso) return "";
  const clean = String(iso).slice(0, 10);
  const [gy, gm, gd] = clean.split("-").map(Number);
  if (!gy || !gm || !gd) return "";
  const [jy, jm, jd] = toJalali(gy, gm, gd);
  return toFaDigits(`${jd} ${FA_MONTHS[jm - 1]} ${jy}`);
}

/** Convert a [year, month, day] Jalali tuple to an ISO Gregorian date string. */
export function jalaliTupleToIso(jy: number, jm: number, jd: number): string {
  const [gy, gm, gd] = toGregorian(jy, jm, jd);
  return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
}
