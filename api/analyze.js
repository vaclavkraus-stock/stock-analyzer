import Anthropic from "@anthropic-ai/sdk";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limiter: 10 requestů za hodinu per IP
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  analytics: true,
});

// Ticker sanitizace — pouze A-Z, 0-9, tečka, max 10 znaků
const TICKER_REGEX = /^[A-Z0-9.]{1,10}$/;

export default async function handler(req, res) {
  // Pouze POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Rate limiting podle IP
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "anonymous";

  const { success, limit, remaining, reset } = await ratelimit.limit(ip);

  // Přidat rate limit hlavičky do response
  res.setHeader("X-RateLimit-Limit", limit);
  res.setHeader("X-RateLimit-Remaining", remaining);
  res.setHeader("X-RateLimit-Reset", new Date(reset).toISOString());

  if (!success) {
    return res.status(429).json({
      error: "Příliš mnoho požadavků. Zkus to za hodinu.",
      resetAt: new Date(reset).toISOString(),
    });
  }

  // Validace body
  const { messages, model, max_tokens, tools } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Chybí messages." });
  }

  // Vytáhnout ticker z promptu a validovat
  const promptText = messages[0]?.content || "";
  const tickerMatch = promptText.match(/Search the web for "([^"]+)"/);
  if (tickerMatch) {
    const ticker = tickerMatch[1].toUpperCase();
    if (!TICKER_REGEX.test(ticker)) {
      return res.status(400).json({ error: "Neplatný ticker symbol." });
    }
  }

  // Request size limit (~50KB max)
  const bodySize = JSON.stringify(req.body).length;
  if (bodySize > 50000) {
    return res.status(413).json({ error: "Request příliš velký." });
  }

  try {
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await client.messages.create({
      model: model || "claude-sonnet-4-20250514",
      max_tokens: max_tokens || 5000,
      tools: tools || [],
      messages,
    });

    return res.status(200).json(response);
  } catch (err) {
    console.error("Anthropic API error:", err);

    // Neodhalovat detaily chyby klientovi
    if (err.status === 529) {
      return res.status(503).json({ error: "API přetíženo, zkus za chvíli." });
    }
    if (err.status === 401) {
      return res.status(500).json({ error: "Chyba konfigurace serveru." });
    }

    return res.status(500).json({ error: "Interní chyba serveru." });
  }
}