# Project: AI-Powered Asylum Aid

## Event

USAII Global AI Hackathon 2026 — High School Track  
Brief: Community — "Help is Hard to Find — Make Support Obvious."  
Direction: Direction A — Crisis-to-Action Translator

---

## Problem Understanding & Context

### The Problem

Asylum seekers are entitled to protection under international law, yet the path to applying is
almost impossible to navigate alone. Three interlocking barriers stand in the way:

**1. Complexity and jurisdiction fragmentation.** Asylum law is not one system — it is dozens.
A person who fled persecution and ended up in the United States faces USCIS, EOIR, and DOJ
rules, deadlines measured in days, and country-of-origin conditions that change week to week.
Someone in the European Union faces a different Convention interpretation in every member state.
Canada, the United Kingdom, and Australia each operate separate regimes. No single document
explains all of these, and no static FAQ can keep up with them.

**2. Language barriers.** Official government forms and instructions are written in the dominant
language of the country of asylum — English, French, German, Spanish. Asylum seekers may
speak Arabic, Tigrinya, Pashto, Ukrainian, or dozens of other languages, and professional
interpretation services are expensive and scarce.

**3. Fear and distrust.** Sharing personal information — country of origin, ethnicity, religion,
political opinion — with any system is terrifying when you fled persecution because of those
facts. The fear of data being shared with a government or used against you is not irrational; it
is learned from lived experience.

The result is an entitlement gap: people who qualify for asylum protection never file because
they do not understand the process, cannot read the forms, and are afraid to ask.

### Who This Affects

[TODO: cite current UNHCR statistics — e.g., global forcibly displaced persons figure.]  
Asylum seekers are among the most legally vulnerable people in the world. They are often
unrepresented in legal proceedings, and access to qualified legal representation is a
significant factor in case outcomes. [TODO: cite source for representation rates and outcome
data — e.g., TRAC Immigration, EOIR statistics, or a peer-reviewed study.]

### Chosen Direction

Direction A — Crisis-to-Action Translator: turn confusing and stressful legal information into
plain language, a personalized checklist, and clear next steps, while routing users to real
human legal help.

---

## Solution Overview

AI-Powered Asylum Aid is a web application where a user enters their situation — country of
origin, current country, and optional context — and chats with an AI assistant that:

1. **Explains** the asylum process for their destination country in plain language, in the
   user's own language.
2. **Delivers** a personalized, step-by-step checklist and immediate next steps based on the
   five Convention grounds (race/ethnicity, religion, nationality, particular social group,
   political opinion).
3. **Links** to authoritative official and legal-aid resources specific to their destination
   (UNHCR, USCIS, EOIR, ImmigrationLawHelp.org, EUAA, GOV.UK, and others).
4. **Routes** users to qualified human attorneys and legal-aid organizations.

The application is explicitly **not a lawyer**. It provides legal **information**, not legal
**advice**. It never determines eligibility. It always directs users to a qualified attorney
for case-specific decisions.

---

## Why AI? (Could Simpler AI Help?)

> This section directly addresses the HS rubric criterion: "Why AI? Could simpler AI help?"

A static FAQ, a keyword search, or a decision-tree chatbot cannot accomplish what this
application requires. Here is why each simpler alternative was considered and rejected:

| Approach | Why it fails |
|---|---|
| Static FAQ / information site | Cannot adapt to the user's specific country pair, language, or situation. A Guatemalan national now in Mexico faces a completely different process than a Syrian national now in Germany. A static page cannot bridge that gap. |
| Keyword search | Can surface documents but cannot explain them in plain language, summarize a five-step checklist, or translate jurisdiction-specific legal concepts into the user's native language in real time. |
| Decision tree / rule-based bot | Asylum situations vary across five Convention grounds, dozens of country-pairs, and continuously changing conditions. The enumeration space is effectively infinite. A hard-coded tree becomes stale the moment a policy changes and cannot handle novel situations. |

An LLM is necessary for three capabilities that no simpler system provides:

- **Translation of legal language into plain language** — converting dense immigration
  statutes, regulatory guidance, and procedural rules into clear prose a non-lawyer can act on,
  in the user's native language.
- **Personalization** — synthesizing the user's country of origin, destination country, and
  stated circumstances into guidance that is specific to them, not generic.
- **Synthesis** — pulling together scattered, multi-source information into a coherent, ordered
  checklist and set of next steps in real time.

The model used is Anthropic Claude (`claude-opus-4-8`), with a fixed system prompt that
enforces plain language, structured output, multilingual replies, grounding in curated
authoritative sources, and the human-in-the-loop guardrail.

---

## Impact & Insight

### Intended Impact

- Reduce the entitlement gap: help people who qualify for asylum understand that they qualify
  and what to do next.
- Lower the language barrier: support English, Spanish, Arabic (RTL), French, and Ukrainian
  out of the box, with the model able to respond in additional languages the user writes in.
- Reduce fear of information exposure: stateless design (no PII stored, no data shared with
  any government), localhost-first architecture, and a visible "not shared with any government"
  notice.
- Bridge to human legal help: every session surfaces the legal-aid directory, because an
  attorney makes the case-defining decisions.

### Measurable Proxies

[TODO: define and record metrics for the demo — e.g., number of test users who successfully
identified their next step within one session, languages tested, etc.]

### Limitations & Honest Scope

This is a demonstration-scale application, not a deployed service. It runs locally by default.
Going to production requires the hardening steps in [SECURITY.md](../SECURITY.md). The AI
guidance is only as current as the curated authoritative sources it is grounded in; users are
always told to verify with the official source and an attorney.

---

## Team

[TODO: list team member names — 2 to 5 members required; solo submissions are disqualified.]

## Qualifier Code

[TODO: enter the team's Qualifier approval code from the June 7–10 qualification phase.]

---

*See also: [ARCHITECTURE.md](ARCHITECTURE.md) | [HUMAN_IN_THE_LOOP.md](HUMAN_IN_THE_LOOP.md) | [RESPONSIBLE_AI.md](RESPONSIBLE_AI.md) | [AI_TOOLS_AND_DATA.md](AI_TOOLS_AND_DATA.md)*
