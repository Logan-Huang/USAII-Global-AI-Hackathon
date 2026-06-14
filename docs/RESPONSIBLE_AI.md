# Responsible AI

## Overview

AI-Powered Asylum Aid operates in a domain where errors have serious consequences for
vulnerable people. This document records each identified risk, its severity, and the
mitigations built into the design. It also describes the human-in-the-loop mechanism that is
the primary ethical safeguard. Cross-reference: [HUMAN_IN_THE_LOOP.md](HUMAN_IN_THE_LOOP.md).

---

## Risk Register

### Risk 1 — Hallucinated or Outdated Legal Guidance

**Severity:** High. Incorrect legal information in an asylum case can cause a missed deadline,
a misunderstood ground, or a fatally flawed filing. The consequences for the user can be
irreversible.

**Mitigations:**

1. **Source grounding.** The system prompt requires the model to ground every claim in the
   curated authoritative sources provided (UNHCR, USCIS, EOIR, EUAA, GOV.UK, etc.) and to
   cite the specific source so the user can verify.
2. **Explicit verification instruction.** The AI always tells the user to verify information
   with the official source directly — the link is provided.
3. **Refusal to adjudicate.** The AI will not state whether a user qualifies for asylum,
   predict outcomes, or advise on case strategy. For those questions it refers the user to an
   attorney. This is enforced via the fixed system prompt (see
   [ARCHITECTURE.md](ARCHITECTURE.md#layer-3--ai-anthropic-claude)).
4. **Persistent disclaimer.** A non-dismissible banner reads: "This is general information,
   not legal advice. Always verify with an official source and consult a qualified attorney."
5. **Human attorney in the loop.** The final decision on any case rests with a qualified
   immigration attorney, not the AI. See [HUMAN_IN_THE_LOOP.md](HUMAN_IN_THE_LOOP.md).

---

### Risk 2 — Privacy Exposure of Vulnerable Users' PII

**Severity:** High. Asylum seekers share information — country of origin, ethnicity, religion,
political opinion, legal history — that, if disclosed to the wrong party, could endanger them
or their families.

**Mitigations:**

1. **Data minimization.** The intake form collects only country of origin and current country
   as required fields. Context, ethnicity, religion, and legal history are optional and handled
   only conversationally, ephemerally within the session. They are never stored or logged.
2. **No server-side storage.** The backend is stateless. No database, no log file, no queue
   holds user input. Chat history exists only in browser memory.
3. **No PII logging.** The server logs do not record request bodies. IP addresses are used
   only for rate limiting (in memory, not persisted).
4. **Localhost-only default.** The server binds to `127.0.0.1:3000` by default. Data does not
   leave the local machine except for the HTTPS call to the Anthropic API.
5. **"Not shared with any government" notice.** The UI makes this explicit so users understand
   their information is not being forwarded to immigration authorities.
6. **Demo uses synthetic data.** No real user data was used during development or in any demo
   recording. The demo persona ("Amina") is fully fictional. See
   [AI_TOOLS_AND_DATA.md](AI_TOOLS_AND_DATA.md).

---

### Risk 3 — Over-Reliance on AI / Displacement of Human Judgment

**Severity:** High. A user who believes the AI has assessed their case may not seek attorney
representation, leading to a poorly prepared or unrepresented case.

**Mitigations:**

1. **Human-in-the-loop by design.** The AI is scoped to explanation and orientation only.
   Case-specific questions trigger an explicit "you need to speak with a qualified attorney"
   response plus a direct link to the legal-aid directory. This is not optional behavior — it
   is enforced in the system prompt.
2. **Persistent disclaimer banner.** Non-dismissible; visible throughout every session.
3. **Legal-aid directory always surfaced.** Every session shows the legal-aid directory so
   the path to a human attorney is always one click away. See
   [HUMAN_IN_THE_LOOP.md](HUMAN_IN_THE_LOOP.md).
4. **No eligibility determination.** The AI never tells a user they qualify or do not qualify.
   It explains what the legal standard is, what evidence is typically relevant, and what the
   process looks like — then directs the user to an attorney.

---

### Risk 4 — Language and Access Bias

**Severity:** Medium. If the tool only works in English it replicates the very barrier it is
trying to remove.

**Mitigations:**

1. **Multilingual by design.** The frontend supports EN, ES, AR (RTL layout), FR, and UK.
   Language auto-detected from browser preference; user can override via a selector.
2. **Model-native multilingualism.** Claude (`claude-opus-4-8`) is instructed to reply in the
   same language the user writes in. Users writing in languages beyond the five explicitly
   supported in the UI will still receive a response in their language.
3. **RTL support.** Arabic text direction (`dir="rtl"`) is handled in the frontend CSS.
4. **No registration required.** The application requires no account, no email address, and no
   phone number to use.

---

### Risk 5 — API Key Exposure / Unauthorized API Usage

**Severity:** Medium (financial and reputational harm to the team).

**Mitigations:** See [SECURITY.md](../SECURITY.md) for the full threat model and controls.
Summary: the key is environment-only, gitignored, server-side only, rate-limited, body-capped,
and the server binds to localhost by default.

---

## Responsible AI Principles Summary

| Principle | How it is applied here |
|---|---|
| Human oversight | Attorney-in-the-loop; AI scoped to information only |
| Transparency | Persistent disclaimer; cited sources; explicit "not legal advice" |
| Privacy | Data minimization; stateless; no PII logging; localhost default |
| Fairness / access | Multilingual; no registration; no cost to user |
| Safety | Hallucination risk mitigated by source grounding and attorney referral |
| Honesty | AI explicitly states its limitations on every case-specific question |

---

*See also: [HUMAN_IN_THE_LOOP.md](HUMAN_IN_THE_LOOP.md) | [ARCHITECTURE.md](ARCHITECTURE.md) | [AI_TOOLS_AND_DATA.md](AI_TOOLS_AND_DATA.md) | [SECURITY.md](../SECURITY.md)*
