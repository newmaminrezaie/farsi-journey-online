// Async CRUD API over localStorage. Signatures mimic a REST client so you can
// swap the implementations to `fetch('/api/...')` later without changing any
// component that calls these functions.

import { storage, uid, refCode } from "./storage";
import type {
  Book, CartItem, Order, OrderItem, Registration, Semester, Teacher,
} from "./types";

const KEYS = {
  teachers: "teachers",
  semesters: "semesters",
  registrations: "registrations",
  books: "books",
  orders: "orders",
  cart: "cart",
  adminSession: "admin:session",
};

const delay = <T>(v: T, ms = 120) => new Promise<T>((r) => setTimeout(() => r(v), ms));

// ---------- Teachers ----------
export const teachersApi = {
  async list(): Promise<Teacher[]> { return delay(storage.get<Teacher[]>(KEYS.teachers, [])); },
  async get(id: string): Promise<Teacher | undefined> { return (await this.list()).find(t => t.id === id); },
  async create(input: Omit<Teacher, "id" | "createdAt">): Promise<Teacher> {
    const all = await this.list();
    const t: Teacher = { ...input, id: uid("tch"), createdAt: new Date().toISOString() };
    storage.set(KEYS.teachers, [t, ...all]);
    return t;
  },
  async update(id: string, patch: Partial<Teacher>): Promise<Teacher | undefined> {
    const all = await this.list();
    const next = all.map(t => t.id === id ? { ...t, ...patch } : t);
    storage.set(KEYS.teachers, next);
    return next.find(t => t.id === id);
  },
  async remove(id: string): Promise<void> {
    storage.set(KEYS.teachers, (await this.list()).filter(t => t.id !== id));
  },
};

// ---------- Semesters ----------
export const semestersApi = {
  async list(): Promise<Semester[]> { return delay(storage.get<Semester[]>(KEYS.semesters, [])); },
  async listOpen(): Promise<Semester[]> { return (await this.list()).filter(s => s.status === "open"); },
  async get(id: string): Promise<Semester | undefined> { return (await this.list()).find(s => s.id === id); },
  async create(input: Omit<Semester, "id" | "createdAt" | "seatsTaken">): Promise<Semester> {
    const all = await this.list();
    const s: Semester = { ...input, id: uid("sem"), seatsTaken: 0, createdAt: new Date().toISOString() };
    storage.set(KEYS.semesters, [s, ...all]);
    return s;
  },
  async update(id: string, patch: Partial<Semester>): Promise<Semester | undefined> {
    const all = await this.list();
    const next = all.map(s => s.id === id ? { ...s, ...patch } : s);
    storage.set(KEYS.semesters, next);
    return next.find(s => s.id === id);
  },
  async remove(id: string): Promise<void> {
    storage.set(KEYS.semesters, (await this.list()).filter(s => s.id !== id));
  },
};

// ---------- Registrations ----------
export const registrationsApi = {
  async list(): Promise<Registration[]> { return delay(storage.get<Registration[]>(KEYS.registrations, [])); },
  async create(input: Omit<Registration, "id" | "createdAt" | "status">): Promise<Registration> {
    const all = await this.list();
    const r: Registration = { ...input, id: uid("reg"), status: "new", createdAt: new Date().toISOString() };
    storage.set(KEYS.registrations, [r, ...all]);
    // increment seatsTaken if bound to a semester
    if (r.semesterId) {
      const sem = await semestersApi.get(r.semesterId);
      if (sem) await semestersApi.update(sem.id, { seatsTaken: sem.seatsTaken + 1 });
    }
    return r;
  },
  async updateStatus(id: string, status: Registration["status"]): Promise<void> {
    const all = await this.list();
    storage.set(KEYS.registrations, all.map(r => r.id === id ? { ...r, status } : r));
  },
  async remove(id: string): Promise<void> {
    storage.set(KEYS.registrations, (await this.list()).filter(r => r.id !== id));
  },
};

// ---------- Books ----------
export const booksApi = {
  async list(): Promise<Book[]> { return delay(storage.get<Book[]>(KEYS.books, [])); },
  async listActive(): Promise<Book[]> { return (await this.list()).filter(b => b.active); },
  async get(id: string): Promise<Book | undefined> { return (await this.list()).find(b => b.id === id); },
  async create(input: Omit<Book, "id" | "createdAt">): Promise<Book> {
    const all = await this.list();
    const b: Book = { ...input, id: uid("bk"), createdAt: new Date().toISOString() };
    storage.set(KEYS.books, [b, ...all]);
    return b;
  },
  async update(id: string, patch: Partial<Book>): Promise<Book | undefined> {
    const all = await this.list();
    const next = all.map(b => b.id === id ? { ...b, ...patch } : b);
    storage.set(KEYS.books, next);
    return next.find(b => b.id === id);
  },
  async remove(id: string): Promise<void> {
    storage.set(KEYS.books, (await this.list()).filter(b => b.id !== id));
  },
};

// ---------- Cart (client-only) ----------
export const cartApi = {
  read(): CartItem[] { return storage.get<CartItem[]>(KEYS.cart, []); },
  add(bookId: string, qty = 1) {
    const items = this.read();
    const existing = items.find(i => i.bookId === bookId);
    if (existing) existing.qty += qty;
    else items.push({ bookId, qty });
    storage.set(KEYS.cart, items);
  },
  setQty(bookId: string, qty: number) {
    const items = this.read().map(i => i.bookId === bookId ? { ...i, qty } : i).filter(i => i.qty > 0);
    storage.set(KEYS.cart, items);
  },
  remove(bookId: string) {
    storage.set(KEYS.cart, this.read().filter(i => i.bookId !== bookId));
  },
  clear() { storage.set(KEYS.cart, []); },
};

// ---------- Orders ----------
export const ordersApi = {
  async list(): Promise<Order[]> { return delay(storage.get<Order[]>(KEYS.orders, [])); },
  async get(refOrId: string): Promise<Order | undefined> {
    return (await this.list()).find(o => o.id === refOrId || o.refCode === refOrId);
  },
  async createFromCart(input: {
    customerName: string; phone: string; address: string; note?: string;
    paymentMethod: Order["paymentMethod"];
  }): Promise<Order> {
    const cart = cartApi.read();
    const books = await booksApi.list();
    const items: OrderItem[] = cart.map(ci => {
      const b = books.find(bk => bk.id === ci.bookId)!;
      return { bookId: b.id, titleFa: b.titleFa, qty: ci.qty, unitPriceToman: b.priceToman };
    });
    const subtotal = items.reduce((s, i) => s + i.qty * i.unitPriceToman, 0);
    const all = await this.list();
    const order: Order = {
      id: uid("ord"),
      refCode: refCode(),
      customerName: input.customerName, phone: input.phone, address: input.address, note: input.note,
      items, subtotalToman: subtotal,
      status: "pending",
      paymentMethod: input.paymentMethod,
      createdAt: new Date().toISOString(),
    };
    storage.set(KEYS.orders, [order, ...all]);
    cartApi.clear();
    return order;
  },
  async updateStatus(id: string, status: Order["status"]): Promise<void> {
    const all = await this.list();
    storage.set(KEYS.orders, all.map(o => o.id === id ? { ...o, status } : o));
  },
};

// ---------- Admin auth (mock) ----------
export const authApi = {
  DEFAULT_USER: "admin",
  DEFAULT_PASS: "higooya1403",
  isLoggedIn(): boolean { return storage.get<boolean>(KEYS.adminSession, false); },
  login(user: string, pass: string): boolean {
    const ok = user === this.DEFAULT_USER && pass === this.DEFAULT_PASS;
    if (ok) storage.set(KEYS.adminSession, true);
    return ok;
  },
  logout() { storage.remove(KEYS.adminSession); },
};

// Helper: money formatting (Toman, Persian digits)
export function formatToman(n: number): string {
  return n.toLocaleString("fa-IR") + " تومان";
}
