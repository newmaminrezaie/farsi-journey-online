import type { FastifyInstance } from "fastify";
import { z } from "zod";
import argon2 from "argon2";
import { prisma } from "../lib/prisma.js";
import { requireStaff } from "../middleware/auth.js";

const LoginBody = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(200),
});

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/login", async (req, reply) => {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_body" });
    const { username, password } = parsed.data;

    const user = await prisma.staffUser.findUnique({ where: { username } });
    if (!user || !user.active) return reply.code(401).send({ error: "invalid_credentials" });
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) return reply.code(401).send({ error: "invalid_credentials" });

    const token = app.jwt.sign(
      { sub: user.id, role: user.role, name: user.fullName },
      { expiresIn: "12h" },
    );
    reply.setCookie("hg_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      domain: process.env.COOKIE_DOMAIN || undefined,
      maxAge: 12 * 60 * 60,
    });
    return { id: user.id, username: user.username, fullName: user.fullName, role: user.role };
  });

  app.post("/logout", async (_req, reply) => {
    reply.clearCookie("hg_token", { path: "/" });
    return { ok: true };
  });

  app.get("/me", { preHandler: requireStaff }, async (req) => {
    const u = (req as any).staffUser;
    return {
      id: u.id, username: u.username, fullName: u.fullName, role: u.role,
      baleChatId: u.baleChatId, telegramChatId: u.telegramChatId, notifyOn: u.notifyOn,
    };
  });
}
