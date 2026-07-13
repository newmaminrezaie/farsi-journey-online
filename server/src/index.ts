import Fastify from "fastify";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { prisma } from "./lib/prisma.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerStaffRoutes } from "./routes/staff.js";
import { registerTeachersRoutes } from "./routes/teachers.js";
import { registerSemestersRoutes } from "./routes/semesters.js";
import { registerRegistrationsRoutes } from "./routes/registrations.js";
import { registerBooksRoutes } from "./routes/books.js";
import { registerNotifyRoutes } from "./routes/notify.js";
import { registerUploadsRoutes } from "./routes/uploads.js";
import { registerSettingsRoutes } from "./routes/settings.js";
import { startNotifyWorker } from "./notify/worker.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, "../uploads");

const app = Fastify({ logger: true, trustProxy: true });

await app.register(cors, {
  origin: true,
  credentials: true,
});
await app.register(cookie);
await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? "dev-only-change-me",
  cookie: { cookieName: "hg_token", signed: false },
});
await app.register(multipart, { limits: { fileSize: 15 * 1024 * 1024 } });
await app.register(fastifyStatic, {
  root: UPLOADS_DIR,
  prefix: "/uploads/",
  decorateReply: false,
});

app.get("/api/health", async () => ({ ok: true, ts: new Date().toISOString() }));

await app.register(registerAuthRoutes, { prefix: "/api/admin/auth" });
await app.register(registerStaffRoutes, { prefix: "/api/admin/staff" });
await app.register(registerTeachersRoutes, { prefix: "/api" });
await app.register(registerSemestersRoutes, { prefix: "/api" });
await app.register(registerRegistrationsRoutes, { prefix: "/api" });
await app.register(registerBooksRoutes, { prefix: "/api" });
await app.register(registerNotifyRoutes, { prefix: "/api/admin/notify" });
await app.register(registerUploadsRoutes, { prefix: "/api/admin" });
await app.register(registerSettingsRoutes, { prefix: "/api" });

// Kick off the background notification dispatcher.
startNotifyWorker(app.log);

const port = Number(process.env.PORT ?? 3000);
app.listen({ port, host: "0.0.0.0" }).then(() => {
  app.log.info(`higooya-api listening on :${port}`);
});

// Graceful shutdown so pg connections close cleanly.
for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, async () => {
    app.log.info(`received ${sig}, closing`);
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}
