// Admin utilities for notifications: view queue/history, send a test message.
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireStaff } from "../middleware/auth.js";
import { channels } from "../notify/channels.js";

const TestBody = z.object({
  channel: z.enum(["bale", "telegram"]),
  chatId: z.string().min(1).max(64),
  text: z.string().min(1).max(1000).default("پیام آزمایشی از گویا ✅"),
});

export async function registerNotifyRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireStaff);

  app.get("/status", async () => ({
    bale: { enabled: channels.bale.enabled },
    telegram: { enabled: channels.telegram.enabled, proxy: process.env.TELEGRAM_PROXY_URL ? "configured" : "none" },
  }));

  app.get("/queue", async () => {
    return prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  });

  app.post("/test", async (req, reply) => {
    const parsed = TestBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const { channel, chatId, text } = parsed.data;
    if (!channels[channel].enabled) return reply.code(400).send({ error: `${channel}_disabled` });
    const result = await channels[channel].send(chatId, text);
    return result;
  });

  app.post("/:id/retry", async (req, reply) => {
    const id = (req.params as any).id as string;
    const n = await prisma.notification.findUnique({ where: { id } });
    if (!n) return reply.code(404).send({ error: "not_found" });
    await prisma.notification.update({
      where: { id },
      data: { status: "queued", nextAttemptAt: new Date(), lastError: null },
    });
    return { ok: true };
  });
}
