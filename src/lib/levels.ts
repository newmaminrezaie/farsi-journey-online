// Institute level ladder (HiGooya). Values are stored; labels are shown.
export interface LevelDef {
  value: string;
  label: string;       // short code, e.g. "Pre A"
  fa: string;          // Persian display
  books: string;       // course books used at this level
  prefix: string;      // class-code prefix
}

export const LEVELS: LevelDef[] = [
  { value: "pre-a", label: "Pre A", fa: "Pre A", books: "Pre Phonics", prefix: "PA" },
  { value: "a", label: "A", fa: "A", books: "Phonics", prefix: "A" },
  { value: "pre-b", label: "Pre B", fa: "Pre B", books: "Phonics", prefix: "PB" },
  { value: "b", label: "B", fa: "B", books: "Family & Friends، Beehive 1–4", prefix: "B" },
  { value: "c", label: "C", fa: "C", books: "Touchstone 1–4", prefix: "C" },
  { value: "d", label: "D", fa: "D", books: "Viewpoint 1–2", prefix: "D" },
  { value: "e", label: "E", fa: "E", books: "Evolve 1–4", prefix: "E" },
];

export const LEVEL_VALUES = LEVELS.map(l => l.value);

// Legacy values kept readable so old records don't show raw slugs.
const LEGACY_FA: Record<string, string> = {
  beginner: "مقدماتی", elementary: "پایه", "pre-intermediate": "پیش‌متوسط",
  intermediate: "متوسط", "upper-intermediate": "فرا‌متوسط", advanced: "پیشرفته", ielts: "آیلتس",
};

export function levelLabel(value: string): string {
  return LEVELS.find(l => l.value === value)?.fa ?? LEGACY_FA[value] ?? value;
}

export function levelBooks(value: string): string {
  return LEVELS.find(l => l.value === value)?.books ?? "";
}

export function levelPrefix(value: string): string {
  return LEVELS.find(l => l.value === value)?.prefix ?? "GN";
}
