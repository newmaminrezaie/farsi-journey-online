// HTTP API client — talks to the Fastify backend at /api/*.
// Same function signatures as before so components need no change.
// Cart + Orders remain local (Zarinpal integration is a later phase).

import { storage, uid, refCode } from "./storage";
import type {
  Book, CartItem, Order, OrderItem, Registration, Semester, Teacher,
} from "./types";

const KEYS = {
  orders: "orders",
  cart: "cart",
  adminSession: "admin:session",
};

// ---------- fetch helper ----------
async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: init?.body ? { "Content-Type": "application/json", ...(init?.headers || {}) } : init?.headers,
    ...init,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try { const j = await res.json(); msg = (j as any)?.error?.formErrors?.join?.(", ") || JSON.stringify(j); } catch {}
    throw new Error(`API ${res.status}: ${msg}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------- Teachers ----------
export const teachersApi = {
  list: (): Promise<Teacher[]> => http("/teachers"),
  get: (id: string): Promise<Teacher> => http(`/teachers/${id}`),
  create: (input: Omit<Teacher, "id" | "createdAt">): Promise<Teacher> =>
    http("/teachers", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, patch: Partial<Teacher>): Promise<Teacher> =>
    http(`/teachers/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  remove: (id: string): Promise<void> =>
    http(`/teachers/${id}`, { method: "DELETE" }).then(() => undefined),
};

// ---------- Semesters ----------
export const semestersApi = {
  list: (): Promise<Semester[]> => http("/semesters"),
  listOpen: async (): Promise<Semester[]> => (await http<Semester[]>("/semesters")).filter(s => s.status === "open"),
  get: (id: string): Promise<Semester> => http(`/semesters/${id}`),
  create: (input: Omit<Semester, "id" | "createdAt" | "seatsTaken"> & { seatsTaken?: number }): Promise<Semester> =>
    http("/semesters", { method: "POST", body: JSON.stringify({ seatsTaken: 0, ...input }) }),
  update: (id: string, patch: Partial<Semester>): Promise<Semester> =>
    http(`/semesters/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  remove: (id: string): Promise<void> =>
    http(`/semesters/${id}`, { method: "DELETE" }).then(() => undefined),
};

// ---------- Registrations ----------
export const registrationsApi = {
  list: (): Promise<Registration[]> => http("/registrations"),
  create: (input: Omit<Registration, "id" | "createdAt" | "status">): Promise<Registration> =>
    http("/registrations", { method: "POST", body: JSON.stringify(input) }),
  updateStatus: (id: string, status: Registration["status"]): Promise<void> =>
    http(`/registrations/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }).then(() => undefined),
  remove: (id: string): Promise<void> =>
    http(`/registrations/${id}`, { method: "DELETE" }).then(() => undefined),
};

// ---------- Books ----------
export const booksApi = {
  list: (): Promise<Book[]> => http("/books"),
  listActive: async (): Promise<Book[]> => (await http<Book[]>("/books")).filter(b => b.active),
  get: (id: string): Promise<Book> => http(`/books/${id}`),
  create: (input: Omit<Book, "id" | "createdAt">): Promise<Book> =>
    http("/books", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, patch: Partial<Book>): Promise<Book> =>
    http(`/books/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  remove: (id: string): Promise<void> =>
    http(`/books/${id}`, { method: "DELETE" }).then(() => undefined),
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

// ---------- Orders (local-only — Zarinpal wiring pending) ----------
export const ordersApi = {
  async list(): Promise<Order[]> { return storage.get<Order[]>(KEYS.orders, []); },
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

// ---------- Admin auth ----------
export const authApi = {
  isLoggedIn(): boolean { return storage.get<boolean>(KEYS.adminSession, false); },
  async login(user: string, pass: string): Promise<boolean> {
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass }),
      });
      if (!res.ok) return false;
      storage.set(KEYS.adminSession, true);
      return true;
    } catch { return false; }
  },
  async logout() {
    try { await fetch("/api/admin/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    storage.remove(KEYS.adminSession);
  },
  async verify(): Promise<boolean> {
    try {
      const res = await fetch("/api/admin/auth/me", { credentials: "include" });
      const ok = res.ok;
      if (ok) storage.set(KEYS.adminSession, true);
      else storage.remove(KEYS.adminSession);
      return ok;
    } catch { return false; }
  },
};

// Helper: money formatting (Toman, Persian digits)
export function formatToman(n: number): string {
  return n.toLocaleString("fa-IR") + " تومان";
}
