// مقررات ثبت‌نام — منبع واحد برای فرم‌های ثبت‌نام و نسخه چاپی
export const TERMS = [
  "این مرکز تابع مقررات پوششی و رفتاری آموزش و پرورش است، لذا از نظر رفتار و پوشش و حجاب کاملاً همانند مدارس می‌باشد.",
  "تکمیل فرم ثبت‌نام و واریز شهریه به منزله ثبت‌نام قطعی تلقی شده و در صورت انصراف مبلغ شهریه استرداد نخواهد شد، مگر در مواردی که از طرف آموزشگاه تعطیل یا منحل گردد.",
  "غیبت بیش از ۴ جلسه موجه یا غیر موجه در طول ترم باعث محرومیت از امتحان و در نتیجه عدم دریافت گواهینامه می‌شود.",
  "آموزشگاه در خصوص رفت و برگشت شما به کلاس هیچ‌گونه مسئولیتی ندارد.",
];

export const WEEKDAYS = [
  { value: "saturday", label: "شنبه" },
  { value: "sunday", label: "یک‌شنبه" },
  { value: "monday", label: "دوشنبه" },
  { value: "tuesday", label: "سه‌شنبه" },
  { value: "wednesday", label: "چهارشنبه" },
  { value: "thursday", label: "پنج‌شنبه" },
  { value: "friday", label: "جمعه" },
];

export function weekdaysFa(days?: string[]): string {
  if (!days || !days.length) return "";
  return days
    .map(d => WEEKDAYS.find(w => w.value === d)?.label ?? d)
    .join(" و ");
}

// "16:30" → "۱۶:۳۰"
export function timeFa(t?: string): string {
  if (!t) return "";
  return t.replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

export function scheduleSummary(s?: { days?: string[]; startTime?: string; scheduleFa?: string } | null): string {
  if (!s) return "";
  const parts: string[] = [];
  const d = weekdaysFa(s.days);
  if (d) parts.push(d);
  if (s.startTime) parts.push(`ساعت ${timeFa(s.startTime)}`);
  const built = parts.join(" — ");
  if (built && s.scheduleFa) return `${built} (${s.scheduleFa})`;
  return built || s.scheduleFa || "";
}
