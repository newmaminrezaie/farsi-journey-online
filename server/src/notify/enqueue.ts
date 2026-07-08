// Enqueues notifications inside the caller's transaction. Never sends inline
// so payment flows aren't blocked by a slow bot API or a dead proxy.

import type { Prisma, PrismaClient, NotifyEvent } from "@prisma/client";
import { channels } from "./channels.js";

type Tx = Prisma.TransactionClient | PrismaClient;

function parseCsv(env: string | undefined): string[] {
  return (env ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * Enqueue a rendered notification text for delivery.
 * Fan-out logic:
 *   - Every active staff user with the event in `notifyOn` and a chat ID for
 *     an enabled channel gets a queued row.
 *   - If nobody is subscribed for that (event, channel), fall back to the
 *     env-configured admin chat IDs.
 */
export async function enqueueNotification(
  tx: Tx,
  event: NotifyEvent,
  text: string,
): Promise<void> {
  const staff = await tx.staffUser.findMany({
    where: { active: true, notifyOn: { has: event } },
    select: { baleChatId: true, telegramChatId: true },
  });

  const rows: { event: NotifyEvent; channel: "bale" | "telegram"; recipientChatId: string; text: string }[] = [];

  for (const chName of ["bale", "telegram"] as const) {
    if (!channels[chName].enabled) continue;

    const idField = chName === "bale" ? "baleChatId" : "telegramChatId";
    const subscribed = staff
      .map((s) => (s as any)[idField] as string | null)
      .filter((v): v is string => Boolean(v));

    const chatIds = subscribed.length
      ? subscribed
      : parseCsv(chName === "bale" ? process.env.BALE_ADMIN_CHAT_IDS : process.env.TELEGRAM_ADMIN_CHAT_IDS);

    for (const chatId of chatIds) {
      rows.push({ event, channel: chName, recipientChatId: chatId, text });
    }
  }

  if (rows.length === 0) return;
  await tx.notification.createMany({ data: rows });
}
