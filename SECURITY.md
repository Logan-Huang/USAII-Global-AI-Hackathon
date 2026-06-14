# Security

## Scope

This document covers the threat model and security controls for AI-Powered Asylum Aid in its
default local-proxy configuration, and provides a hardening checklist for teams that want to
host the application publicly.

---

## Threat Model (Local Configuration)

The application runs a Node.js proxy bound to `127.0.0.1:3000`. The primary asset to protect
is the **Anthropic API key**, which is a paid credential with a spend limit. Secondary concerns
are the privacy of users and the integrity of the AI output.

| Threat | Likelihood (local) | Impact | Mitigation |
|---|---|---|---|
| API key exposed in source code / git history | Low (gitignored) | High (financial) | Key in `.env`; `.env` in `.gitignore`; never hardcoded |
| API key exposed in browser | None (architecture) | High | Key held server-side only; never sent to client |
| Key leaked via a committed `.env` | Low (explicit warning) | High | `.gitignore` + README warning + this document |
| Prompt injection via user input | Medium | Medium | Input validated/sanitized; max 4,000 chars per message; fixed system prompt server-side |
| DoS via request flooding | Low (localhost) | Medium | Per-IP rate limit: 20 req / 60 s (`express-rate-limit`) |
| Oversized request body | Low (localhost) | Low | Body capped at 16 KB |
| XSS / clickjacking from the frontend | Low (no dynamic HTML from API) | Medium | Helmet security headers (CSP, X-Frame-Options, etc.) |
| PII leakage from logs | N/A | High | No request bodies logged; IP used only for in-memory rate limiting |
| Network interception | Low (localhost) | Low | Server binds to 127.0.0.1; traffic never leaves the machine |

---

## API Key Handling

1. **Store in `.env` only.** Copy `.env.example` to `.env` and paste your key there.
   The `.env` file is listed in `.gitignore` and must never be committed.

2. **Never hardcode the key** in any source file, config, or comment.

3. **Set a spend limit.** In the [Anthropic Console](https://console.anthropic.com), set a
   monthly spend limit on the key before using it. This caps financial exposure if the key is
   accidentally exposed.

4. **Rotate immediately if leaked.** If you accidentally commit the key, push it to a public
   repo, or share it in a screenshot:
   a. Go to the Anthropic Console and invalidate the key immediately.
   b. Generate a new key.
   c. Update `.env` with the new key.
   d. If the commit is in git history, rewrite history with `git filter-repo` or contact your
      git host to purge the secret. Do not assume deleting the file in a new commit is enough.

5. **The key is never sent to the browser.** The proxy architecture ensures all Anthropic API
   calls are made server-side. The browser only talks to `127.0.0.1:3000`.

---

## Defenses in Place

| Defense | Implementation |
|---|---|
| API key server-side only | `server/config.js` loads from `process.env`; never referenced in client code |
| Localhost-only bind | `HOST=127.0.0.1` (default in `.env.example` and `config.js`) |
| Input validation | Field length caps: 4,000 chars/message, 200 chars/profile field, 30 messages/request |
| Body size cap | 16 KB maximum (`express.json({ limit: config.maxBodyBytes })`) |
| Per-IP rate limiting | 20 requests per 60-second window (`express-rate-limit`) |
| Security headers | Helmet middleware on every response (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) |
| CORS policy | Restricted to `ALLOWED_ORIGIN` (empty = same-origin localhost) |
| No PII logging | Request bodies not logged; no persistent IP log |
| Gitignored secrets | `.env`, `*.key`, `*.pem` in `.gitignore` |

---

## Before You Host This Publicly

If you move from localhost to a publicly accessible server, complete every item on this
checklist before exposing the service:

- **Use platform secrets, not a committed `.env`.** Deploy to a platform (Render, Railway,
  Fly.io, Vercel, etc.) and set `ANTHROPIC_API_KEY` as an environment secret in the platform
  dashboard. Never commit `.env` to any repository.

- **Enable HTTPS.** Terminate TLS at a reverse proxy (nginx, Caddy) or use a platform that
  provides it automatically. Never run the Node server on HTTP over a public network.

- **Tighten rate limits.** Lower `RATE_LIMIT_MAX` and/or `RATE_LIMIT_WINDOW_MS` for public
  traffic. Consider separate limits per route (e.g., stricter on `/api/chat`).

- **Add bot protection on `/api/chat`.** Integrate a CAPTCHA / proof-of-work challenge
  (e.g., Cloudflare Turnstile or hCaptcha) to prevent automated abuse of the AI endpoint.

- **Use a dedicated scoped API key with a spend limit.** Create a separate key for production
  with a spend limit sized for expected traffic. Do not reuse development keys.

- **Lock CORS to your deployed origin.** Set `ALLOWED_ORIGIN` to your exact production domain
  (e.g., `https://your-app.example.com`). Do not leave it blank or set it to `*`.

- **Change the bind address.** Set `HOST=0.0.0.0` (or your specific interface) only when
  behind a reverse proxy that handles TLS and CORS. Never expose the Node process directly.

- **Enable monitoring and alerting.** Set up spend alerts in the Anthropic Console. Monitor
  server logs for anomalous request volumes. Alert on HTTP 429 (rate limit hit) spikes.

- **Consider serverless functions for the proxy.** A serverless function (Vercel Edge
  Functions, Cloudflare Workers, AWS Lambda) reduces the attack surface compared to a
  long-running Node process: it auto-scales, has no persistent state to compromise, and
  benefits from the platform's DDoS protection.

- **Review your logging configuration.** Ensure no production log sink captures request
  bodies. This project logs no PII by design; verify this holds in your deployment pipeline.

---

*See also: [docs/RESPONSIBLE_AI.md](docs/RESPONSIBLE_AI.md) | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | [.env.example](.env.example)*
