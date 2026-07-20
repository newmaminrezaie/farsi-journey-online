import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireStaff } from "../middleware/auth.js";

const ItemInput = z.object({ bookId: z.string(), qty: z.number().int().min(1) });

const CreateOrder = z.object({
  customerName: z.string().min(1).max(200),
  phone: z.string().min(3).max(30),
  address: z.string().min(1).max(2000),
  note: z.string().max(2000).default(""),
  paymentMethod: z.enum(["zarinpal", "cash-on-delivery"]).default("zarinpal"),
  items: z.array(ItemInput).min(1),
});

const StatusUpdate = z.object({
  status: z.enum(["pending", "paid", "shipped", "cancelled"]),
});

function makeRef() {
  return "GY-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function registerOrdersRoutes(app: FastifyInstance) {
  // Public: create an order from the cart.
  app.post("/orders", async (req, reply) => {
    const parsed = CreateOrder.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const { items, ...rest } = parsed.data;

    const books = await prisma.book.findMany({
      where: { id: { in: items.map((i) => i.bookId) } },
    });
    if (books.length !== items.length) {
      return reply.code(400).send({ error: "invalid_books" });
    }
    const orderItems = items.map((i) => {
      const b = books.find((bk) => bk.id === i.bookId)!;
      return {
        bookId: b.id,
        titleFa: b.titleFa,
        qty: i.qty,
        unitPriceToman: b.priceToman,
      };
    });
    const subtotal = orderItems.reduce((s, i) => s + i.qty * i.unitPriceToman, 0);
    if (subtotal <= 0) return reply.code(400).send({ error: "empty_order" });

    const order = await prisma.order.create({
      data: {
        refCode: makeRef(),
        customerName: rest.customerName,
        phone: rest.phone,
        address: rest.address,
        note: rest.note,
        itemsJson: orderItems as any,
        subtotalToman: subtotal,
        paymentMethod: rest.paymentMethod,
        status: "pending",
      },
    });
    return order;
  });

  // Public: look up by refCode or id (used by the success page).
  app.get("/orders/by-ref/:ref", async (req, reply) => {
    const ref = (req.params as any).ref as string;
    const order = await prisma.order.findFirst({
      where: { OR: [{ refCode: ref }, { id: ref }] },
    });
    if (!order) return reply.code(404).send({ error: "not_found" });
    return order;
  });

  // Staff: list all orders.
  app.get("/orders", { preHandler: requireStaff }, async () => {
    return prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  });

  app.patch("/orders/:id", { preHandler: requireStaff }, async (req, reply) => {
    const id = (req.params as any).id as string;
    const parsed = StatusUpdate.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    return prisma.order.update({ where: { id }, data: { status: parsed.data.status } });
  });

  app.delete("/orders/:id", { preHandler: requireStaff }, async (req) => {
    const id = (req.params as any).id as string;
    await prisma.order.delete({ where: { id } });
    return { ok: true };
  });
}
