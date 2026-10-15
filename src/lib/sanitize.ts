// Input cleaning for free-text form fields before they hit the API.
// Keeps Persian ZWNJ (\u200C) intact — it's valid orthography (e.g. رجب‌نژاد).

/** Strip C0/C1 control chars (keeps \t \n \r), BOM and zero-width chars except ZWNJ. */
export function sanitizeText(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .replace(/[\u200B\u200D\uFEFF]/g, "")
    .trim();
}

/** Convert Persian/Arabic digits to ASCII and drop everything that isn't a digit. */
export function normalizeDigits(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val)
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[^\d]/g, "");
}
