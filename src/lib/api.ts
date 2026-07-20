// HTTP API client — talks to the Fastify backend at /api/*.
// Same function signatures as before so components need no change.
// Cart + Orders remain local (Zarinpal integration is a later phase).

import { storage, uid, refCode } from "./storage";
import type {
  Book, CartItem, Employee, Order, OrderItem, Registration, Semester, Teacher,
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
    if (res.status === 401) {
      try { window.dispatchEvent(new CustomEvent("hg:session-expired")); } catch {}
    }
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

// ---------- Employees ----------
export const employeesApi = {
  list: (): Promise<Employee[]> => http("/employees"),
  get: (id: string): Promise<Employee> => http(`/employees/${id}`),
  create: (input: Omit<Employee, "id" | "createdAt">): Promise<Employee> =>
    http("/employees", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, patch: Partial<Employee>): Promise<Employee> =>
    http(`/employees/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  remove: (id: string): Promise<void> =>
    http(`/employees/${id}`, { method: "DELETE" }).then(() => undefined),
};

// ---------- Semesters ----------
export const semestersApi = {
  list: (): Promise<Semester[]> => http("/semesters"),
  listOpen: async (): Promise<Semester[]> => (await http<Semester[]>("/semesters")).filter(s => s.status !== "archived"),
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
  markPaid: (id: string, paidToman: number, paymentRef = ""): Promise<Registration> =>
    http(`/registrations/${id}/payment`, { method: "POST", body: JSON.stringify({ paidToman, paymentRef }) }),
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

// ---------- Orders (backend-backed, real payment flow) ----------
export const ordersApi = {
  list: (): Promise<Order[]> => http<any[]>("/orders").then(rs => rs.map(mapOrder)),
  get: async (refOrId: string): Promise<Order | undefined> => {
    try { return mapOrder(await http<any>(`/orders/by-ref/${encodeURIComponent(refOrId)}`)); }
    catch { return undefined; }
  },
  async createFromCart(input: {
    customerName: string; phone: string; address: string; note?: string;
    paymentMethod: Order["paymentMethod"];
  }): Promise<Order> {
    const cart = cartApi.read();
    const order = mapOrder(await http<any>("/orders", {
      method: "POST",
      body: JSON.stringify({
        customerName: input.customerName,
        phone: input.phone,
        address: input.address,
        note: input.note ?? "",
        paymentMethod: input.paymentMethod,
        items: cart.map(i => ({ bookId: i.bookId, qty: i.qty })),
      }),
    }));
    cartApi.clear();
    return order;
  },
  updateStatus: (id: string, status: Order["status"]): Promise<void> =>
    http(`/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }).then(() => undefined),
  remove: (id: string): Promise<void> =>
    http(`/orders/${id}`, { method: "DELETE" }).then(() => undefined),
};

function mapOrder(row: any): Order {
  return {
    id: row.id,
    refCode: row.refCode,
    customerName: row.customerName,
    phone: row.phone,
    address: row.address,
    note: row.note,
    items: Array.isArray(row.itemsJson) ? row.itemsJson : (row.items ?? []),
    subtotalToman: row.subtotalToman,
    status: row.status,
    paymentMethod: row.paymentMethod,
    zarinpalRefId: row.paymentRef,
    createdAt: row.createdAt,
  };
}

// ---------- Payments (Zarinpal) ----------
export const paymentsApi = {
  async startZarinpal(kind: "registration" | "order", targetId: string): Promise<{ url: string; authority: string }> {
    return http("/payments/zarinpal/request", {
      method: "POST",
      body: JSON.stringify({ kind, targetId }),
    });
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
export function formatToman(n: number | null | undefined): string {
  return (Number(n) || 0).toLocaleString("fa-IR") + " تومان";
}
