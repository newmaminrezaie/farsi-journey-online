// One-time seed data so the site looks alive on first boot.
// Images are bundled local assets so the VPS can serve the site without
// relying on external image hosts.

import { storage } from "./storage";
import type { Book, Semester, Teacher } from "./types";
import { localImages } from "@/assets/local";

const K = {
  teachers: "higooya:teachers",
  semesters: "higooya:semesters",
  books: "higooya:books",
  seeded: "higooya:seeded:v2",
};

const teachers: Teacher[] = [
  {
    id: "tch_sara", nameFa: "استاد سارا رحیمی", nameEn: "Sara Rahimi",
    bioFa: "مدرس آیلتس و مکالمه پیشرفته با بیش از ۱۰ سال سابقه تدریس.",
    specialties: ["IELTS", "Speaking"],
    photoUrl: localImages.teachers.sara,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tch_ali", nameFa: "استاد علی محمدی", nameEn: "Ali Mohammadi",
    bioFa: "متخصص گرامر و ترجمه، فارغ التحصیل مقطع دکترای زبان‌شناسی.",
    specialties: ["Grammar", "Translation"],
    photoUrl: localImages.teachers.ali,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tch_maryam", nameFa: "استاد مریم اکبری", nameEn: "Maryam Akbari",
    bioFa: "مدرس ویژه کودکان و نوجوانان، مسلط به روش‌های نوین آموزش زبان.",
    specialties: ["Kids", "Teens"],
    photoUrl: localImages.teachers.maryam,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tch_reza", nameFa: "استاد رضا نوری", nameEn: "Reza Nouri",
    bioFa: "مدرس زبان انگلیسی سطح متوسط و پیشرفته، کارشناس آیلتس آکادمیک.",
    specialties: ["IELTS", "Academic Writing"],
    photoUrl: localImages.teachers.reza,
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
    coverUrl: localImages.books.touchstone,
    priceToman: 380_000, stock: 24, active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "bk_ielts_trainer", titleFa: "IELTS Trainer 2", titleEn: "IELTS Trainer 2",
    author: "Cambridge", level: "ielts", category: "ielts",
    descriptionFa: "شش نمونه آزمون رسمی آیلتس با پاسخ تشریحی کامل.",
    coverUrl: localImages.books.ielts,
    priceToman: 650_000, stock: 15, active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "bk_502", titleFa: "504 واژه ضروری انگلیسی", titleEn: "504 Absolutely Essential Words",
    author: "Barron's", level: "intermediate", category: "vocabulary",
    descriptionFa: "مرجع پرکاربرد یادگیری واژگان با تمرین‌های متنوع.",
    coverUrl: localImages.books.words,
    priceToman: 220_000, stock: 40, active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "bk_family", titleFa: "Family and Friends 1", titleEn: "Family and Friends 1",
    author: "Oxford", level: "beginner", category: "kids",
    descriptionFa: "کتاب آموزش زبان کودکان همراه با فعالیت‌های تصویری.",
    coverUrl: localImages.books.family,
    priceToman: 320_000, stock: 20, active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "bk_story", titleFa: "داستان کوتاه Oxford Bookworms 3", titleEn: "Oxford Bookworms 3",
    author: "Oxford", level: "pre-intermediate", category: "story",
    descriptionFa: "مجموعه داستان انگلیسی سطح ۳ برای تقویت خواندن.",
    coverUrl: localImages.books.story,
    priceToman: 180_000, stock: 30, active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "bk_grammar", titleFa: "گرامر کاربردی مورفی (Blue)", titleEn: "English Grammar in Use",
    author: "Raymond Murphy", level: "intermediate", category: "grammar",
    descriptionFa: "معروف‌ترین کتاب مرجع گرامر انگلیسی در جهان.",
    coverUrl: localImages.books.grammar,
    priceToman: 480_000, stock: 18, active: true,
    createdAt: new Date().toISOString(),
  },
];

export function seedIfEmpty() {
  if (typeof window === "undefined") return;
  const existingTeachers = storage.get<Teacher[]>("teachers", []);
  const existingBooks = storage.get<Book[]>("books", []);

  if (existingTeachers.length) {
    const teacherImageById = Object.fromEntries(teachers.map(t => [t.id, t.photoUrl]));
    storage.set("teachers", existingTeachers.map(t => ({ ...t, photoUrl: teacherImageById[t.id] ?? t.photoUrl })));
  } else {
    storage.set("teachers", teachers);
  }

  if (!storage.get<Semester[]>("semesters", []).length) storage.set("semesters", semesters);

  if (existingBooks.length) {
    const bookImageById = Object.fromEntries(books.map(b => [b.id, b.coverUrl]));
    storage.set("books", existingBooks.map(b => ({ ...b, coverUrl: bookImageById[b.id] ?? b.coverUrl })));
  } else {
    storage.set("books", books);
  }

  localStorage.setItem(K.seeded, "1");
}
