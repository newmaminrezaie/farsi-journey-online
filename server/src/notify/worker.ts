// Background dispatcher — polls the notifications table every 10s and sends
// queued rows through the appropriate channel. Handles retry with backoff.

import type { FastifyBaseLogger } from "fastify";
import { prisma } from "../lib/prisma.js";
import { channels } from "./channels.js";

const POLL_MS = 10_000;
const BATCH = 20;
const MAX_ATTEMPTS = 6;
// backoff schedule in ms — used as (attempts+1) index, capped at last entry
const BACKOFF_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000, 6 * 60 * 60_000, 12 * 60 * 60_000];

export function startNotifyWorker(log: FastifyBaseLogger) {
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const due = await prisma.notification.findMany({
        where: { status: "queued", nextAttemptAt: { lte: new Date() } },
        orderBy: { createdAt: "asc" },
        take: BATCH,
      });

      for (const n of due) {
        const channel = channels[n.channel];
        if (!channel.enabled) {
          // provider was disabled after row was enqueued — mark failed, don't spin.
          await prisma.notification.update({
            where: { id: n.id },
            data: { status: "failed", lastError: `channel ${n.channel} disabled` },
          });
          continue;
        }

        const result = await channel.send(n.recipientChatId, n.text);
        if (result.ok) {
          await prisma.notification.update({
            where: { id: n.id },
            data: { status: "sent", sentAt: new Date(), lastError: null },
          });
          continue;
        }

        const attempts = n.attempts + 1;
        if (!result.retryable || attempts >= MAX_ATTEMPTS) {
          await prisma.notification.update({
            where: { id: n.id },
            data: { status: "failed", attempts, lastError: result.error },
          });
        } else {
          const delay = BACKOFF_MS[Math.min(attempts - 1, BACKOFF_MS.length - 1)];
          await prisma.notification.update({
            where: { id: n.id },
            data: {
              attempts,
              lastError: result.error,
              nextAttemptAt: new Date(Date.now() + delay),
            },
          });
        }
      }
    } catch (e) {
      log.error({ err: e }, "notify worker tick failed");
    } finally {
      running = false;
    }
  };

  const interval = setInterval(tick, POLL_MS);
  interval.unref?.();
  log.info("notify worker started");
  // fire once immediately
  void tick();
}
