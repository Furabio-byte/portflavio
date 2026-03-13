const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const requestStore = new Map();

function getAllowedOrigin() {
  return process.env.ALLOWED_ORIGIN || "https://www.portflavio.it";
}

function setCorsHeaders(req, res) {
  const allowedOrigin = getAllowedOrigin();
  const requestOrigin = req.headers.origin;
  const origin = requestOrigin === allowedOrigin ? requestOrigin : allowedOrigin;

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");
}

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.socket?.remoteAddress || "unknown";
}

function checkRateLimit(req) {
  const now = Date.now();
  const key = getClientIp(req);
  const recentRequests = (requestStore.get(key) || []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );

  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return { ok: false, retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) };
  }

  recentRequests.push(now);
  requestStore.set(key, recentRequests);

  return { ok: true };
}

function validatePayload(payload) {
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  const website = typeof payload.website === "string" ? payload.website.trim() : "";

  if (website) {
    return { ok: false, status: 400, error: "Spam detected." };
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return { ok: false, status: 400, error: "Invalid email." };
  }

  if (!message || message.length < 3 || message.length > 5000) {
    return { ok: false, status: 400, error: "Invalid message length." };
  }

  return { ok: true, email, message };
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const allowedOrigin = getAllowedOrigin();
  if (req.headers.origin !== allowedOrigin) {
    return res.status(403).json({ error: "Forbidden origin." });
  }

  const rateLimit = checkRateLimit(req);
  if (!rateLimit.ok) {
    res.setHeader("Retry-After", rateLimit.retryAfter);
    return res.status(429).json({ error: "Too many requests. Try again later." });
  }

  const validation = validatePayload(req.body || {});
  if (!validation.ok) {
    return res.status(validation.status).json({ error: validation.error });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !toEmail || !fromEmail) {
    return res.status(500).json({ error: "Server email configuration is missing." });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: validation.email,
        subject: "Nuovo contatto da portflavio.it",
        text: `Email: ${validation.email}\n\nMessaggio:\n${validation.message}`
      })
    });

    if (!response.ok) {
      return res.status(502).json({ error: "Email provider error." });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: "Unexpected server error." });
  }
}
