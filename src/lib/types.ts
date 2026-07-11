// Domain types — shaped so a real REST/GraphQL backend can slot in later
// without touching component code. All prices in Toman.

export type ID = string;

export interface Teacher {
  id: ID;
  nameFa: string;
  nameEn: string;
  bioFa: string;
  specialties: string[];  // e.g. ["IELTS", "General English"]
  photoUrl: string;
  createdAt: string;
}

export type SemesterLevel =
  | "beginner"
  | "elementary"
  | "pre-intermediate"
  | "intermediate"
  | "upper-intermediate"
  | "advanced"
  | "ielts";

export interface Semester {
  id: ID;
  titleFa: string;
  level: SemesterLevel;
  teacherId: ID;              // legacy — primary teacher (kept for back-compat)
  teacherIds?: ID[];          // full set of teachers offering this semester
  scheduleFa: string;         // free text schedule ("شنبه و دوشنبه ۱۶-۱۸")
  startsOn: string;           // ISO yyyy-mm-dd
  endsOn: string;             // ISO yyyy-mm-dd
  capacity: number;
  seatsTaken: number;
  priceToman: number;
  mode: "in-person" | "online" | "hybrid";
  status: "open" | "closed" | "archived";
  createdAt: string;
}

export interface Registration {
  id: ID;
  semesterId: ID | null;      // null = general interest form
  fullName: string;
  fatherName?: string;
  birthCertNo?: string;       // شماره شناسنامه
  issuedFrom?: string;        // صادره از
  birthPlace?: string;        // متولد
  schoolDegree?: string;      // مدرک تحصیلی — مدرسه
  universityDegree?: string;  // مدرک تحصیلی — دانشگاه
  education?: string;         // legacy — kept for backward compat
  address?: string;
  phone: string;              // همراه
  landline?: string;          // تلفن ثابت
  nationalId?: string;
  termInterest?: string;      // ترم مورد نظر (متن آزاد)
  levelInterest?: string;     // سطح (متن آزاد)
  selectedTeacherId?: ID;     // استاد انتخاب‌شده هنگام ثبت‌نام
  note?: string;
  agreedToTerms?: boolean;
  status: "new" | "contacted" | "enrolled" | "rejected";
  createdAt: string;
}

export type BookCategory = "grammar" | "vocabulary" | "ielts" | "story" | "kids" | "reference";

export interface Book {
  id: ID;
  titleFa: string;
  titleEn?: string;
  author: string;
  level: SemesterLevel;
  category: BookCategory;
  descriptionFa: string;
  coverUrl: string;
  priceToman: number;
  stock: number;
  active: boolean;
  createdAt: string;
}

export interface CartItem {
  bookId: ID;
  qty: number;
}

export interface OrderItem {
  bookId: ID;
  titleFa: string;
  qty: number;
  unitPriceToman: number;
}

export interface Order {
  id: ID;
  refCode: string;
  customerName: string;
  phone: string;
  address: string;
  note?: string;
  items: OrderItem[];
  subtotalToman: number;
  status: "pending" | "paid" | "shipped" | "cancelled";
  paymentMethod: "zarinpal" | "cash-on-delivery";
  zarinpalAuthority?: string;
  zarinpalRefId?: string;
  createdAt: string;
}
