// Persian HTML templates for notification events.
// Kept separate from business logic so copy tweaks are one-file changes.

export interface EnrollmentPaidVars {
  fullName: string;
  studentNumber: string;
  courseTitle: string;
  teacherName: string;
  semesterTitle: string;
  amountToman: number;
  paymentRef: string;
}

export interface BookOrderVars {
  refCode: string;
  customerName: string;
  phone: string;
  subtotalToman: number;
  itemsSummary: string;
}

export interface RegistrationNewVars {
  fullName: string;
  studentNumber: string;
  phone: string;
  courseTitle: string;
  teacherName: string;
}

const fmt = (n: number) => n.toLocaleString("fa-IR");

export const templates = {
  enrollment_paid(v: EnrollmentPaidVars): string {
    return [
      "✅ <b>ثبت‌نام جدید (پرداخت‌شده)</b>",
      `دانش‌آموز: ${v.fullName} (شماره ${v.studentNumber})`,
      `دوره: ${v.courseTitle} — استاد ${v.teacherName}`,
      `ترم: ${v.semesterTitle}`,
      `مبلغ پرداختی: ${fmt(v.amountToman)} تومان`,
      `شناسه پرداخت: <code>${v.paymentRef}</code>`,
    ].join("\n");
  },

  registration_new(v: RegistrationNewVars): string {
    return [
      "📝 <b>درخواست ثبت‌نام جدید</b>",
      `دانش‌آموز: ${v.fullName} (${v.studentNumber})`,
      `تلفن: ${v.phone}`,
      `دوره: ${v.courseTitle} — ${v.teacherName}`,
    ].join("\n");
  },

  book_order_paid(v: BookOrderVars): string {
    return [
      "📚 <b>سفارش کتاب (پرداخت‌شده)</b>",
      `کد پیگیری: <code>${v.refCode}</code>`,
      `مشتری: ${v.customerName} — ${v.phone}`,
      `مبلغ: ${fmt(v.subtotalToman)} تومان`,
      "اقلام:",
      v.itemsSummary,
    ].join("\n");
  },

  book_order_new(v: BookOrderVars): string {
    return [
      "🛒 <b>سفارش کتاب جدید (پرداخت در محل)</b>",
      `کد پیگیری: <code>${v.refCode}</code>`,
      `مشتری: ${v.customerName} — ${v.phone}`,
      `مبلغ: ${fmt(v.subtotalToman)} تومان`,
      "اقلام:",
      v.itemsSummary,
    ].join("\n");
  },
};
