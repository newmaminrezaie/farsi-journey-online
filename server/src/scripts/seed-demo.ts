// Idempotent demo seed — inserts a handful of teachers, semesters, and books
// only if the tables are empty. Safe to run repeatedly.
//
//   docker-compose exec api npm run seed:demo

import { prisma } from "../lib/prisma.js";

async function main() {
  const [tCount, sCount, bCount] = await Promise.all([
    prisma.teacher.count(),
    prisma.semester.count(),
    prisma.book.count(),
  ]);

  if (tCount === 0) {
    const teachers = await prisma.teacher.createManyAndReturn({
      data: [
        { nameFa: "استاد سارا رحیمی", nameEn: "Sara Rahimi", bioFa: "مدرس آیلتس و مکالمه پیشرفته با بیش از ۱۰ سال سابقه تدریس.", specialties: ["IELTS", "Speaking"] },
        { nameFa: "استاد علی محمدی", nameEn: "Ali Mohammadi", bioFa: "متخصص گرامر و ترجمه، فارغ‌التحصیل دکترای زبان‌شناسی.", specialties: ["Grammar", "Translation"] },
        { nameFa: "استاد مریم اکبری", nameEn: "Maryam Akbari", bioFa: "مدرس ویژه کودکان و نوجوانان.", specialties: ["Kids", "Teens"] },
        { nameFa: "استاد رضا نوری", nameEn: "Reza Nouri", bioFa: "مدرس سطح متوسط و پیشرفته، کارشناس آیلتس آکادمیک.", specialties: ["IELTS", "Academic Writing"] },
      ],
    });
    console.log(`teachers seeded: ${teachers.length}`);

    if (sCount === 0) {
      await prisma.semester.createMany({
        data: [
          { titleFa: "دوره فشرده آیلتس - پاییز ۱۴۰۳", level: "ielts", teacherIds: [teachers[0].id, teachers[3].id], scheduleFa: "شنبه، دوشنبه و چهارشنبه — ساعت ۱۷ تا ۱۹", startsOn: new Date("2024-10-05"), endsOn: new Date("2025-01-15"), capacity: 15, seatsTaken: 0, priceToman: 3_800_000, mode: "hybrid", status: "open" },
          { titleFa: "مکالمه انگلیسی - سطح متوسط", level: "intermediate", teacherIds: [teachers[3].id], scheduleFa: "یکشنبه و سه‌شنبه — ساعت ۱۸ تا ۲۰", startsOn: new Date("2024-10-12"), endsOn: new Date("2024-12-20"), capacity: 12, seatsTaken: 0, priceToman: 2_400_000, mode: "in-person", status: "open" },
          { titleFa: "کلاس زبان کودکان (۷ تا ۱۰ سال)", level: "beginner", teacherIds: [teachers[2].id], scheduleFa: "پنج‌شنبه‌ها — ساعت ۱۰ تا ۱۲", startsOn: new Date("2024-10-10"), endsOn: new Date("2025-02-10"), capacity: 10, seatsTaken: 0, priceToman: 1_800_000, mode: "in-person", status: "open" },
          { titleFa: "کارگاه گرامر پیشرفته", level: "advanced", teacherIds: [teachers[1].id], scheduleFa: "جمعه‌ها — ساعت ۹ تا ۱۲", startsOn: new Date("2024-11-01"), endsOn: new Date("2025-01-30"), capacity: 8, seatsTaken: 0, priceToman: 2_900_000, mode: "online", status: "open" },
        ],
      });
      console.log("semesters seeded");
    }
  } else {
    console.log(`teachers already exist (${tCount}), skipping`);
  }

  if (bCount === 0) {
    await prisma.book.createMany({
      data: [
        { titleFa: "تاچ‌استون ۱ (Touchstone 1)", titleEn: "Touchstone 1", author: "Cambridge University Press", level: "elementary", category: "grammar", descriptionFa: "کتاب اصلی دوره مکالمه سطح مقدماتی همراه با CD تمرین.", priceToman: 380_000, stock: 24, active: true },
        { titleFa: "IELTS Trainer 2", titleEn: "IELTS Trainer 2", author: "Cambridge", level: "ielts", category: "ielts", descriptionFa: "شش نمونه آزمون رسمی آیلتس با پاسخ تشریحی کامل.", priceToman: 650_000, stock: 15, active: true },
        { titleFa: "504 واژه ضروری انگلیسی", titleEn: "504 Absolutely Essential Words", author: "Barron's", level: "intermediate", category: "vocabulary", descriptionFa: "مرجع پرکاربرد یادگیری واژگان با تمرین‌های متنوع.", priceToman: 220_000, stock: 40, active: true },
        { titleFa: "Family and Friends 1", titleEn: "Family and Friends 1", author: "Oxford", level: "beginner", category: "kids", descriptionFa: "کتاب آموزش زبان کودکان همراه با فعالیت‌های تصویری.", priceToman: 320_000, stock: 20, active: true },
        { titleFa: "داستان کوتاه Oxford Bookworms 3", titleEn: "Oxford Bookworms 3", author: "Oxford", level: "pre-intermediate", category: "story", descriptionFa: "مجموعه داستان انگلیسی سطح ۳ برای تقویت خواندن.", priceToman: 180_000, stock: 30, active: true },
        { titleFa: "گرامر کاربردی مورفی (Blue)", titleEn: "English Grammar in Use", author: "Raymond Murphy", level: "intermediate", category: "grammar", descriptionFa: "معروف‌ترین کتاب مرجع گرامر انگلیسی در جهان.", priceToman: 480_000, stock: 18, active: true },
      ],
    });
    console.log("books seeded");
  } else {
    console.log(`books already exist (${bCount}), skipping`);
  }
}

main()
  .then(async () => { await prisma.$disconnect(); process.exit(0); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
