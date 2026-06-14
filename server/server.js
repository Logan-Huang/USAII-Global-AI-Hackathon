'use strict';

// AI-Powered Asylum Aid — local proxy server.
// Serves the frontend and exposes a streaming chat endpoint that forwards to
// Claude. The API key stays server-side; user input is never stored or logged.

const path = require('path');
const express = require('express');
const config = require('./config');
const { applySecurity, apiLimiter, validateChatBody } = require('./security');
const { getResourcesForCountry } = require('./resources');
const { streamChat } = require('./claude');

const app = express();

// 1) Security headers + CORS
applySecurity(app);

// 2) JSON body parsing with a strict size cap
app.use(express.json({ limit: config.maxBodyBytes }));

// 3) Static frontend (serves public/index.html at "/")
app.use(express.static(path.join(__dirname, '..', 'public')));

// 4) Curated resources for a destination country
app.get('/api/resources', apiLimiter, (req, res) => {
  const country = typeof req.query.country === 'string' ? req.query.country : '';
  res.json(getResourcesForCountry(country));
});

// 5) Streaming chat (newline-delimited JSON)
app.post('/api/chat', apiLimiter, validateChatBody, async (req, res) => {
  const { language, profile, messages } = req.validated;
  const resources = getResourcesForCountry(profile.countryOfAsylum);

  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Accel-Buffering', 'no'); // disable proxy buffering if hosted behind nginx

  const write = (obj) => res.write(JSON.stringify(obj) + '\n');

  try {
    await streamChat({
      language,
      profile,
      messages,
      resources,
      onDelta: (text) => {
        if (text) write({ type: 'delta', text });
      },
    });
    write({ type: 'done' });
    res.end();
  } catch (err) {
    // Log only minimal, non-PII metadata.
    console.error('[chat] error:', (err && err.name) || 'Error', (err && err.status) || '');
    write({
      type: 'error',
      message: 'Sorry, something went wrong while generating a response. Please try again.',
    });
    res.end();
  }
});

// 6) Error handler (e.g., body too large)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    return res.status(413).json({ type: 'error', message: 'Your request was too large.' });
  }
  console.error('[server] error:', (err && err.name) || 'Error');
  if (res.headersSent) return res.end();
  return res.status(500).json({ type: 'error', message: 'Server error.' });
});

if (require.main === module) {
  app.listen(config.port, config.host, () => {
    console.log('\n  AI-Powered Asylum Aid');
    console.log(`  → http://${config.host}:${config.port}`);
    console.log(`  Model: ${config.model}  |  Effort: ${config.effort}  |  Bind: ${config.host} (localhost-only by default)\n`);
  });
}

module.exports = app;
