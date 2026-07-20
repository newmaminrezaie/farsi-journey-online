// Zarinpal payment gateway integration.
// Handles both registration payments (tuition + optional book) and shop orders.
// Amount conversion: Zarinpal expects Rial; our prices are Toman → multiply by 10.

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { enqueueNotification } from "../notify/enqueue.js";
import { templates } from "../notify/templates.js";

const MERCHANT = process.env.ZARINPAL_MERCHANT_ID ?? "";
const SANDBOX = String(process.env.ZARINPAL_SANDBOX ?? "false").toLowerCase() === "true";
const BASE_URL = (process.env.PUBLIC_BASE_URL ?? "https://higooya.ir").replace(/\/$/, "");

const API_HOST = SANDBOX ? "https://sandbox.zarinpal.com" : "https://api.zarinpal.com";
const PAY_HOST = SANDBOX ? "https://sandbox.zarinpal.com" : "https://www.zarinpal.com";
const REQ_URL = `${API_HOST}/pg/v4/payment/request.json`;
const VERIFY_URL = `${API_HOST}/pg/v4/payment/verify.json`;
const startPay = (auth: string) => `${PAY_HOST}/pg/StartPay/${auth}`;

const RequestBody = z.object({
  kind: z.enum(["registration", "order"]),
  targetId: z.string().min(1),
});

async function callZarinpal(url: string, body: any): Promise<any> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { errors: { raw: text, status: res.status } }; }
}

function resultRedirect(reply: any, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  return reply.redirect(`${BASE_URL}/payment/result?${qs}`);
}

export async function registerZarinpalRoutes(app: FastifyInstance) {
  // Public: start a payment. Frontend calls this and receives { url } to redirect the browser to.
  app.post("/payments/zarinpal/request", async (req, reply) => {
    if (!MERCHANT) return reply.code(500).send({ error: "zarinpal_not_configured" });
    const parsed = RequestBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const { kind, targetId } = parsed.data;

    // Resolve amount + description from the target row.
    let amountToman = 0;
    let description = "";
    let mobile = "";

    if (kind === "registration") {
      const reg = await prisma.registration.findUnique({ where: { id: targetId } });
      if (!reg) return reply.code(404).send({ error: "registration_not_found" });
      if (reg.paidAt) return reply.code(400).send({ error: "already_paid" });
      const sem = reg.semesterId ? await prisma.semester.findUnique({ where: { id: reg.semesterId } }) : null;
      const tuition = sem?.priceToman ?? 0;
      let bookTotal = 0;
      if (reg.selectedBookId) {
        const book = await prisma.book.findUnique({ where: { id: reg.selectedBookId } });
        if (book) {
          const disc = Math.round(book.priceToman * 0.05);
          bookTotal = book.priceToman - disc;
        }
      }
      amountToman = tuition + bookTotal;
      description = `ثبت‌نام آموزشگاه گویا — ${sem?.titleFa ?? ""} — ${reg.fullName}`.slice(0, 500);
      mobile = reg.phone;
    } else {
      const order = await prisma.order.findUnique({ where: { id: targetId } });
      if (!order) return reply.code(404).send({ error: "order_not_found" });
      if (order.paidAt) return reply.code(400).send({ error: "already_paid" });
      amountToman = order.subtotalToman;
      description = `سفارش کتاب گویا — ${order.refCode} — ${order.customerName}`.slice(0, 500);
      mobile = order.phone;
    }

    if (amountToman < 1000) {
      return reply.code(400).send({ error: "amount_too_low", amountToman });
    }

    const callback_url = `${BASE_URL}/api/payments/zarinpal/callback`;
    const zpBody = {
      merchant_id: MERCHANT,
      amount: amountToman * 10, // Rial
      callback_url,
      description,
      metadata: { mobile },
    };

    const zpRes = await callZarinpal(REQ_URL, zpBody);
    const authority = zpRes?.data?.authority as string | undefined;
    const code = zpRes?.data?.code;
    if (!authority || code !== 100) {
      app.log.error({ zpRes }, "zarinpal payment request failed");
      return reply.code(502).send({ error: "zarinpal_request_failed", detail: zpRes });
    }

    await prisma.paymentSession.create({
      data: { authority, kind, targetId, amountToman, status: "pending" },
    });

    return { url: startPay(authority), authority };
  });

  // Zarinpal redirects the browser back here after the user pays or cancels.
  // Query: ?Authority=xxx&Status=OK|NOK
  app.get("/payments/zarinpal/callback", async (req, reply) => {
    const q = req.query as { Authority?: string; authority?: string; Status?: string; status?: string };
    const authority = q.Authority ?? q.authority ?? "";
    const status = (q.Status ?? q.status ?? "").toUpperCase();

    const session = authority ? await prisma.paymentSession.findUnique({ where: { authority } }) : null;
    if (!session) {
      return resultRedirect(reply, { status: "failed", reason: "no_session" });
    }

    if (status !== "OK") {
      await prisma.paymentSession.update({
        where: { authority },
        data: { status: "cancelled", errorMessage: "user_cancelled" },
      });
      return resultRedirect(reply, {
        status: "cancelled",
        kind: session.kind,
        target: session.targetId,
      });
    }

    // Verify with Zarinpal.
    const vr = await callZarinpal(VERIFY_URL, {
      merchant_id: MERCHANT,
      amount: session.amountToman * 10,
      authority,
    });
    const vcode = vr?.data?.code;
    const refId = vr?.data?.ref_id ? String(vr.data.ref_id) : "";

    if (vcode !== 100 && vcode !== 101) {
      await prisma.paymentSession.update({
        where: { authority },
        data: { status: "failed", errorMessage: `verify_code_${vcode ?? "unknown"}` },
      });
      return resultRedirect(reply, {
        status: "failed",
        kind: session.kind,
        target: session.targetId,
        reason: String(vcode ?? "unknown"),
      });
    }

    // Success — mark target paid + enqueue notification, all in one transaction.
    try {
      await prisma.$transaction(async (tx) => {
        await tx.paymentSession.update({
          where: { authority },
          data: { status: "paid", refId, verifiedAt: new Date() },
        });

        if (session.kind === "registration") {
          const reg = await tx.registration.update({
            where: { id: session.targetId },
            data: {
              paidToman: session.amountToman,
              paymentRef: refId,
              paidAt: new Date(),
              status: "enrolled",
            },
          });
          const sem = reg.semesterId ? await tx.semester.findUnique({ where: { id: reg.semesterId } }) : null;
          const teacher = reg.selectedTeacherId
            ? await tx.teacher.findUnique({ where: { id: reg.selectedTeacherId } })
            : null;
          const text = templates.enrollment_paid({
            fullName: reg.fullName,
            studentNumber: reg.phone,
            courseTitle: sem?.titleFa ?? "—",
            teacherName: teacher?.nameFa ?? "—",
            semesterTitle: sem?.classCode ?? sem?.titleFa ?? "—",
            amountToman: session.amountToman,
            paymentRef: refId,
          });
          await enqueueNotification(tx, "registration_new", text);
        } else {
          const order = await tx.order.update({
            where: { id: session.targetId },
            data: {
              status: "paid",
              paidAt: new Date(),
              paymentRef: refId,
            },
          });
          const items = Array.isArray(order.itemsJson) ? (order.itemsJson as any[]) : [];
          const itemsSummary = items
            .map((i: any) => `• ${i.titleFa} × ${Number(i.qty).toLocaleString("fa-IR")}`)
            .join("\n");
          const text = templates.book_order_paid({
            refCode: order.refCode,
            customerName: order.customerName,
            phone: order.phone,
            subtotalToman: order.subtotalToman,
            itemsSummary,
          });
          await enqueueNotification(tx, "book_order_paid", text);
        }
      });
    } catch (err) {
      app.log.error({ err }, "post-verify update failed");
      return resultRedirect(reply, {
        status: "failed",
        kind: session.kind,
        target: session.targetId,
        reason: "post_verify",
      });
    }

    return resultRedirect(reply, {
      status: "ok",
      kind: session.kind,
      target: session.targetId,
      ref: refId,
      amount: String(session.amountToman),
    });
  });
}
