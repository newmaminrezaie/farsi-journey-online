// Notification channel abstraction.
// - Bale: reachable from Iran directly, primary channel.
// - Telegram: api.telegram.org is blocked from Iran; routed through
//   TELEGRAM_PROXY_URL (http/https/socks5). If TELEGRAM_BOT_TOKEN is unset,
//   the Telegram channel is disabled and no requests are made.

import { Agent, ProxyAgent, fetch as undiciFetch } from "undici";
import { SocksProxyAgent } from "socks-proxy-agent";

export type SendResult =
  | { ok: true }
  | { ok: false; retryable: boolean; error: string };

export interface NotifyChannelImpl {
  name: "bale" | "telegram";
  enabled: boolean;
  send(chatId: string, htmlText: string): Promise<SendResult>;
}

// ---------- Bale ----------

const BALE_BASE = "https://tapi.bale.ai";
const baleAgent = new Agent({ connectTimeout: 10_000, headersTimeout: 15_000, bodyTimeout: 15_000 });

export const baleChannel: NotifyChannelImpl = {
  name: "bale",
  get enabled() {
    return Boolean(process.env.BALE_BOT_TOKEN);
  },
  async send(chatId, htmlText) {
    const token = process.env.BALE_BOT_TOKEN;
    if (!token) return { ok: false, retryable: false, error: "BALE_BOT_TOKEN not set" };
    try {
      const res = await undiciFetch(`${BALE_BASE}/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: htmlText, parse_mode: "HTML" }),
        dispatcher: baleAgent,
      });
      return await interpretResponse(res);
    } catch (e: any) {
      return { ok: false, retryable: true, error: `bale network: ${e?.message ?? String(e)}` };
    }
  },
};

// ---------- Telegram (via proxy) ----------

const TG_BASE = "https://api.telegram.org";

function buildTelegramDispatcher(): Agent | ProxyAgent | null {
  const url = process.env.TELEGRAM_PROXY_URL?.trim();
  if (!url) {
    // No proxy configured — direct connect will fail from Iran but is fine
    // for a VPS in another region. Return default agent with timeouts.
    return new Agent({ connectTimeout: 10_000, headersTimeout: 20_000, bodyTimeout: 20_000 });
  }
  if (url.startsWith("socks")) {
    // undici doesn't ship a SOCKS dispatcher; use socks-proxy-agent via node fetch's
    // agent adapter is not compatible with undici — we fall back to global.fetch
    // when a SOCKS proxy is set. See telegramChannel.send.
    return null;
  }
  return new ProxyAgent({ uri: url, connectTimeout: 10_000, headersTimeout: 20_000, bodyTimeout: 20_000 });
}

const telegramDispatcher = buildTelegramDispatcher();

export const telegramChannel: NotifyChannelImpl = {
  name: "telegram",
  get enabled() {
    return Boolean(process.env.TELEGRAM_BOT_TOKEN);
  },
  async send(chatId, htmlText) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return { ok: false, retryable: false, error: "TELEGRAM_BOT_TOKEN not set" };
    const proxyUrl = process.env.TELEGRAM_PROXY_URL?.trim();

    try {
      const url = `${TG_BASE}/bot${token}/sendMessage`;
      const body = JSON.stringify({ chat_id: chatId, text: htmlText, parse_mode: "HTML" });

      if (proxyUrl?.startsWith("socks")) {
        // Use node's built-in fetch with a SOCKS agent (via `dispatcher` isn't
        // supported — use https module fallback). We use a small XHR via undici
        // is not possible for SOCKS, so use node's http/https through the agent.
        const { request } = await import("node:https");
        const agent = new SocksProxyAgent(proxyUrl);
        const result = await new Promise<{ status: number; text: string }>((resolve, reject) => {
          const req = request(
            url,
            { method: "POST", agent, headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } },
            (res) => {
              let data = "";
              res.setEncoding("utf8");
              res.on("data", (c) => (data += c));
              res.on("end", () => resolve({ status: res.statusCode ?? 0, text: data }));
            },
          );
          req.on("error", reject);
          req.setTimeout(20_000, () => req.destroy(new Error("timeout")));
          req.write(body);
          req.end();
        });
        return interpretStatus(result.status, result.text);
      }

      const res = await undiciFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        dispatcher: telegramDispatcher ?? undefined,
      });
      return await interpretResponse(res);
    } catch (e: any) {
      return { ok: false, retryable: true, error: `telegram network: ${e?.message ?? String(e)}` };
    }
  },
};

// ---------- shared helpers ----------

async function interpretResponse(res: Response | Awaited<ReturnType<typeof undiciFetch>>): Promise<SendResult> {
  const status = (res as any).status as number;
  const text = await (res as any).text();
  return interpretStatus(status, text);
}

function interpretStatus(status: number, text: string): SendResult {
  if (status >= 200 && status < 300) {
    try {
      const j = JSON.parse(text);
      if (j?.ok === false) {
        // Bot API returns 200 with { ok:false, error_code, description }
        const code = j.error_code ?? 0;
        return { ok: false, retryable: code >= 500, error: `bot api: ${j.description ?? "unknown"}` };
      }
    } catch {
      // non-JSON success — treat as ok
    }
    return { ok: true };
  }
  if (status >= 500) return { ok: false, retryable: true, error: `http ${status}: ${text.slice(0, 300)}` };
  return { ok: false, retryable: false, error: `http ${status}: ${text.slice(0, 300)}` };
}

export const channels: Record<"bale" | "telegram", NotifyChannelImpl> = {
  bale: baleChannel,
  telegram: telegramChannel,
};
