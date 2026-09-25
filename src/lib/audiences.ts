export const AUDIENCES = [
  { group: "سطح", items: [
    { v: "beginner", l: "مبتدی" },
    { v: "intermediate", l: "متوسط" },
    { v: "advanced", l: "پیشرفته" },
  ]},
  { group: "مقطع تحصیلی", items: [
    { v: "elementary", l: "دوره ابتدایی" },
    { v: "middle", l: "متوسطه اول" },
    { v: "high", l: "متوسطه دوم" },
    { v: "university", l: "دانشگاه" },
  ]},
];
export const audienceFa = (v?: string) =>
  AUDIENCES.flatMap(g => g.items).find(a => a.v === v)?.l ?? "";
