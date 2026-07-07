// One-time seed data so the site looks alive on first boot.
// Images are Unsplash URLs. When the VPS is fully offline you can swap these
// for bundled local images without touching component code.

import { storage } from "./storage";
import type { Book, Semester, Teacher } from "./types";

const K = {
  teachers: "higooya:teachers",
  semesters: "higooya:semesters",
  books: "higooya:books",
  seeded: "higooya:seeded:v1",
};

// Unsplash source (free) — pre-fetch to bundle locally if truly offline.
const img = (q: string, w = 800) =>
  `https://images.unsplash.com/${q}?auto=format&fit=crop&w=${w}&q=80`;

const teachers: Teacher[] = [
  {
    id: "tch_sara", nameFa: "استاد سارا رحیمی", nameEn: "Sara Rahimi",
    bioFa: "مدرس آیلتس و مکالمه پیشرفته با بیش از ۱۰ سال سابقه تدریس.",
    specialties: ["IELTS", "Speaking"],
    photoUrl: img("photo-1573496359142-b8d87734a5a2"),
    createdAt: new Date().toISOString(),
  },
  {
    id: "tch_ali", nameFa: "استاد علی محمدی", nameEn: "Ali Mohammadi",
    bioFa: "متخصص گرامر و ترجمه، فارغ التحصیل مقطع دکترای زبان‌شناسی.",
    specialties: ["Grammar", "Translation"],
    photoUrl: img("photo-1531123897727-8f129e1688ce"),
    createdAt: new Date().toISOString(),
  },
  {
    id: "tch_maryam", nameFa: "استاد مریم اکبری", nameEn: "Maryam Akbari",
    bioFa: "مدرس ویژه کودکان و نوجوانان، مسلط به روش‌های نوین آموزش زبان.",
    specialties: ["Kids", "Teens"],
    photoUrl: img("photo-1580489944761-15a19d654956"),
    createdAt: new Date().toISOString(),
  },
  {
    id: "tch_reza", nameFa: "استاد رضا نوری", nameEn: "Reza Nouri",
    bioFa: "مدرس زبان انگلیسی سطح متوسط و پیشرفته، کارشناس آیلتس آکادمیک.",
    specialties: ["IELTS", "Academic Writing"],
    photoUrl: img("photo-1560250097-0b93528c311a"),
    createdAt: new Date().toISOString(),
  },
];

const semesters: Semester[] = [
  {
    id: "sem_ielts_f", titleFa: "دوره فشرده آیلتس - پاییز ۱۴۰۳",
    level: "ielts", teacherId: "tch_sara",
    scheduleFa: "شنبه، دوشنبه و چهارشنبه — ساعت ۱۷ تا ۱۹",
    startsOn: "2024-10-05", endsOn: "2025-01-15",
    capacity: 15, seatsTaken: 8, priceToman: 3_800_000,
    mode: "hybrid", status: "open",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sem_conv_1", titleFa: "مکالمه انگلیسی - سطح متوسط",
    level: "intermediate", teacherId: "tch_reza",
    scheduleFa: "یکشنبه و سه‌شنبه — ساعت ۱۸ تا ۲۰",
    startsOn: "2024-10-12", endsOn: "2024-12-20",
    capacity: 12, seatsTaken: 5, priceToman: 2_400_000,
    mode: "in-person", status: "open",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sem_kids", titleFa: "کلاس زبان کودکان (۷ تا ۱۰ سال)",
    level: "beginner", teacherId: "tch_maryam",
    scheduleFa: "پنج‌شنبه‌ها — ساعت ۱۰ تا ۱۲",
    startsOn: "2024-10-10", endsOn: "2025-02-10",
    capacity: 10, seatsTaken: 3, priceToman: 1_800_000,
    mode: "in-person", status: "open",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sem_grammar", titleFa: "کارگاه گرامر پیشرفته",
    level: "advanced", teacherId: "tch_ali",
    scheduleFa: "جمعه‌ها — ساعت ۹ تا ۱۲",
    startsOn: "2024-11-01", endsOn: "2025-01-30",
    capacity: 8, seatsTaken: 2, priceToman: 2_900_000,
    mode: "online", status: "open",
    createdAt: new Date().toISOString(),
  },
];

const books: Book[] = [
  {
    id: "bk_touchstone", titleFa: "تاچ‌استون ۱ (Touchstone 1)", titleEn: "Touchstone 1",
    author: "Cambridge University Press", level: "elementary", category: "grammar",
    descriptionFa: "کتاب اصلی دوره مکالمه سطح مقدماتی همراه با CD تمرین.",
    coverUrl: img("photo-1544947950-fa07a98d237f", 600),
    priceToman: 380_000, stock: 24, active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "bk_ielts_trainer", titleFa: "IELTS Trainer 2", titleEn: "IELTS Trainer 2",
    author: "Cambridge", level: "ielts", category: "ielts",
    descriptionFa: "شش نمونه آزمون رسمی آیلتس با پاسخ تشریحی کامل.",
    coverUrl: img("photo-1512820790803-83ca734da794", 600),
    priceToman: 650_000, stock: 15, active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "bk_502", titleFa: "504 واژه ضروری انگلیسی", titleEn: "504 Absolutely Essential Words",
    author: "Barron's", level: "intermediate", category: "vocabulary",
    descriptionFa: "مرجع پرکاربرد یادگیری واژگان با تمرین‌های متنوع.",
    coverUrl: img("photo-1495446815901-a7297e633e8d", 600),
    priceToman: 220_000, stock: 40, active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "bk_family", titleFa: "Family and Friends 1", titleEn: "Family and Friends 1",
    author: "Oxford", level: "beginner", category: "kids",
    descriptionFa: "کتاب آموزش زبان کودکان همراه با فعالیت‌های تصویری.",
    coverUrl: img("photo-1503676260728-1c00da094a0b", 600),
    priceToman: 320_000, stock: 20, active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "bk_story", titleFa: "داستان کوتاه Oxford Bookworms 3", titleEn: "Oxford Bookworms 3",
    author: "Oxford", level: "pre-intermediate", category: "story",
    descriptionFa: "مجموعه داستان انگلیسی سطح ۳ برای تقویت خواندن.",
    coverUrl: img("photo-1519682337058-a94d519337bc", 600),
    priceToman: 180_000, stock: 30, active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "bk_grammar", titleFa: "گرامر کاربردی مورفی (Blue)", titleEn: "English Grammar in Use",
    author: "Raymond Murphy", level: "intermediate", category: "grammar",
    descriptionFa: "معروف‌ترین کتاب مرجع گرامر انگلیسی در جهان.",
    coverUrl: img("photo-1497633762265-9d179a990aa6", 600),
    priceToman: 480_000, stock: 18, active: true,
    createdAt: new Date().toISOString(),
  },
];

export function seedIfEmpty() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(K.seeded)) return;
  storage.set("teachers", teachers);
  storage.set("semesters", semesters);
  storage.set("books", books);
  localStorage.setItem(K.seeded, "1");
}
