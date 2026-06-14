'use strict';

// Centralized, environment-driven configuration.
// Secrets come from .env (gitignored) and live ONLY on the server.
require('dotenv').config({ quiet: true });

const config = {
  host: process.env.HOST || '127.0.0.1',
  port: parseInt(process.env.PORT || '3000', 10),

  // Anthropic
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: process.env.CLAUDE_MODEL || 'claude-opus-4-8',

  // Security
  allowedOrigin: (process.env.ALLOWED_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '20', 10),

  // Request limits
  maxBodyBytes: 16 * 1024, // 16kb
  maxMessages: 30, // cap conversation history length per request
  maxMessageChars: 4000, // cap a single message
  maxFieldChars: 200, // cap a single profile field
  maxOutputTokens: 8192, // streaming, so generous; leaves room for adaptive thinking + a structured answer
  effort: process.env.CLAUDE_EFFORT || 'medium', // low | medium | high | max
};

// Fail fast and loudly if the key is missing — never run without it.
if (!config.apiKey) {
  console.error(
    '\n[FATAL] ANTHROPIC_API_KEY is not set.\n' +
      'Copy .env.example to .env and paste your rotated key, then restart.\n'
  );
  process.exit(1);
}

module.exports = config;
