// Jalali <-> Gregorian conversion (server side).

function div(a: number, b: number) { return Math.floor(a / b); }
function mod(a: number, b: number) { return a - Math.floor(a / b) * b; }

function jalCal(jy: number) {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
    1635, 1701, 1749, 1770, 1797, 1858, 1889, 1980, 2058, 2137, 2222,
    2276, 2372, 2456, 2540, 2635, 2696, 2737, 2825, 2882, 2903, 2963,
    3018, 3103, 3172, 3249, 3298, 3391];
  let jump = 0, leapJ = -14, jp = breaks[0];
  for (let i = 1; i < breaks.length; i++) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(jy + 621, 4) - div(div(jy + 621, 100) * 3 + 3, 4) - 150;
  return { gy: jy + 621, march: 20 + leapJ - leapG };
}

function g2d(gy: number, gm: number, gd: number) {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4)
    + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn: number) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

/** Jalali y/m/d -> ISO "yyyy-mm-dd" (Gregorian). */
export function jalaliToISO(jy: number, jm: number, jd: number): string {
  const r = jalCal(jy);
  const jdn = g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
  const g = d2g(jdn);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${g.gy}-${pad(g.gm)}-${pad(g.gd)}`;
}

/** Parses "1405/04/01" or "۱۴۰۵/۰۴/۰۱" -> ISO. Returns "" when unparseable. */
export function parseJalaliDate(raw: unknown): string {
  const s = String(raw ?? "")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .trim();
  const m = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (!m) return "";
  const [jy, jm, jd] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (jm < 1 || jm > 12 || jd < 1 || jd > 31) return "";
  return jalaliToISO(jy, jm, jd);
}
