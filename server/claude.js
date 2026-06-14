'use strict';

// Thin wrapper around the Anthropic SDK. The API key lives only here (via config,
// from .env) and is never exposed to the client. Responses are streamed.

const AnthropicPkg = require('@anthropic-ai/sdk');
const Anthropic = AnthropicPkg.Anthropic || AnthropicPkg.default || AnthropicPkg;
const config = require('./config');
const { buildSystemPrompt } = require('./prompts');

const client = new Anthropic({ apiKey: config.apiKey });

// Run one streaming request, forwarding text deltas to onDelta, and resolve with
// the final message.
function runStream(params, onDelta) {
  const stream = client.messages.stream(params);
  if (typeof onDelta === 'function') {
    stream.on('text', (delta) => onDelta(delta));
  }
  return stream.finalMessage();
}

/**
 * Stream a chat completion. Calls onDelta(text) for each text chunk and resolves
 * with the final message. Throws on a non-recoverable API error.
 *
 * Robustness: we prefer adaptive thinking + the effort control (best quality on
 * Opus 4.8). If the API rejects those enhanced params with a 400 (e.g. an SDK
 * version that doesn't surface them on this endpoint), we automatically retry a
 * minimal, broadly-supported request so a parameter mismatch never breaks the
 * experience. Parameter-validation 400s occur before any text streams, so the
 * fallback does not duplicate output.
 */
async function streamChat({ language, profile, messages, resources, onDelta }) {
  const system = buildSystemPrompt({ language, profile, resources });

  const baseParams = {
    model: config.model,
    max_tokens: config.maxOutputTokens,
    // Fixed system prompt is identical across turns of a conversation, so cache it.
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  };

  // Preferred: Opus 4.8 adaptive thinking + effort control.
  const preferredParams = {
    ...baseParams,
    thinking: { type: 'adaptive' },
    output_config: { effort: config.effort },
  };

  try {
    return await runStream(preferredParams, onDelta);
  } catch (err) {
    if (err && err.status === 400) {
      console.error('[claude] enhanced params rejected (400); retrying minimal request');
      return runStream(baseParams, onDelta);
    }
    throw err;
  }
}

module.exports = { streamChat, client };
