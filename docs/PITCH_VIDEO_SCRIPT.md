# Pitch Video Script

**Project:** AI-Powered Asylum Aid  
**Track:** USAII Global AI Hackathon 2026 — High School / Community / Direction A  
**Target length:** 3–5 minutes  
**Team records the actual video.** This document is the beat-by-beat script.

> IMPORTANT: Use the synthetic persona "Amina" throughout. Do not use any real person's
> name, photo, story, or data. "Amina" is entirely fictional.

---

## Beat 1 — Hook / Problem (~30 seconds)

**Rubric criterion scored: Problem Understanding & Context (30%)**

**[On screen: plain background or a world map with conflict zones marked]**

**SPEAKER:**

Every year, millions of people flee persecution — because of their race, their religion, their
nationality, their political beliefs, or who they are. International law gives them the right
to seek asylum. But the law alone is not enough.

Imagine you just arrived in a new country. You don't speak the language well. You don't know
the legal system. You're scared. And the information you need — the forms, the deadlines, the
process — is scattered across dozens of government websites, written in dense legal language
that even lawyers find hard to read.

This is the reality for asylum seekers today. Help is available. But it is almost impossible
to find.

---

## Beat 2 — Solution Overview (~30 seconds)

**Rubric criterion scored: Solution Design & Architecture (20%) / Impact & Insight (20%)**

**[On screen: app homepage or logo]**

**SPEAKER:**

We built AI-Powered Asylum Aid — a web application that turns confusing legal information into
plain language, a personalized checklist, and clear next steps, in the user's own language.

You tell it your country of origin and where you are now. It explains what the asylum process
looks like for you, gives you the steps to take, points you to authoritative official sources,
and connects you with real human legal help.

It is not a lawyer. It is the guide you need to find the lawyer — and to walk in the door
prepared.

---

## Beat 3 — Live Demo Walkthrough (~2 to 2.5 minutes)

**Rubric criterion scored: Solution Design & Architecture (20%) / Impact & Insight (20%)**

**[Screen recording of the running app]**

### 3a. Intake (~20 seconds)

**SPEAKER:**

Meet Amina. She is a fictional asylum seeker — our demo persona — originally from a country
where she faced persecution. She has just arrived in the United States.

She opens the app. She selects her language — Arabic. The interface switches to right-to-left
layout automatically.

She fills in: country of origin, United States as her current country. She optionally adds a
brief note about her situation. She clicks "Get guidance."

**[Show: intake form being filled; language selector switching to AR; RTL layout active]**

### 3b. Streaming response — plain-language explanation (~30 seconds)

**SPEAKER:**

The app streams back a response in Arabic — in real time. No waiting. No page reload.

It explains: what asylum is, how the US process works, what the one-year filing deadline means,
and what the five legal grounds are — in plain language, not legalese.

**[Show: streaming text appearing in Arabic in the chat interface]**

### 3c. Checklist and next steps (~30 seconds)

**SPEAKER:**

Then it delivers Amina's checklist. Step one: file Form I-589 with USCIS before the one-year
deadline. Step two: gather evidence of persecution — documents, statements, country-condition
reports. Step three: contact an immigration attorney or accredited representative.

Each step is specific to her situation — not a generic FAQ.

**[Show: numbered checklist rendered in the UI]**

### 3d. Authoritative sources and "Find legal help" (~30 seconds)

**SPEAKER:**

At the bottom, the app surfaces links to USCIS, EOIR, ImmigrationLawHelp.org, ASAP, and
RAICES — the authoritative official and legal-aid sources for her destination. These are not
random web results. They are curated, verified links.

And there — always visible — is the "Find legal help" button. One click to the legal-aid
directory.

**[Show: resources panel with links; "Find legal help" button highlighted]**

---

## Beat 4 — AI Architecture and "Why AI?" (~30 seconds)

**Rubric criterion scored: AI Reasoning (20%) / Solution Design & Architecture (20%)**

**[On screen: simple architecture diagram: Browser → Proxy → Claude API]**

**SPEAKER:**

Under the hood: the browser sends Amina's situation to a local Node.js proxy — the API key
never reaches the browser. The proxy validates and sanitizes the input, then streams the
request to Anthropic Claude, model claude-opus-4-8.

Why AI? Because a static FAQ or a decision tree cannot do what Amina needs. Asylum situations
vary across dozens of country pairs, five Convention grounds, and constantly changing policy.
No rule set can enumerate that space. And no FAQ can translate complex immigration law into
plain Arabic — in real time, personalized to Amina's specific country of origin and
destination. Only an LLM can translate, personalize, and synthesize at the same time.

We explicitly considered a simpler approach and rejected it for those reasons.

---

## Beat 5 — Responsible AI and Human in the Loop (~30 seconds)

**Rubric criterion scored: Responsible AI (10%) / AI Reasoning (20%)**

**[On screen: app with disclaimer banner visible; then the "see an attorney" AI response]**

**SPEAKER:**

Notice the banner at the top of every screen: "This is general information, not legal advice.
Always verify with an official source and consult a qualified attorney."

That is not just a disclaimer. It is the architecture. When Amina asks "do I qualify?" — the
AI doesn't answer. It explains the legal standard, what evidence matters, and then says: for
that question, you need a qualified attorney. Here is how to find one.

The AI explains and orients. A human attorney decides. That is the human-in-the-loop design,
and it is why this tool is safe to deploy in a high-stakes legal context.

We also built for privacy: no user data is stored, no PII is logged, the server runs locally
by default, and the demo uses entirely synthetic data.

---

## Beat 6 — Impact and Close (~20 seconds)

**Rubric criterion scored: Impact & Insight (20%) / Problem Understanding & Context (30%)**

**[On screen: app closing screen or team slide]**

**SPEAKER:**

Asylum seekers are some of the most legally vulnerable people in the world. The law gives them
rights. Complexity, language barriers, and fear take those rights away.

AI-Powered Asylum Aid gives the information back — in their language, in plain terms, with a
checklist they can act on and a path to the attorney who will represent them.

Help is hard to find. We are making it obvious.

[TODO: team names, school/organization, and any closing slide content.]

---

## Script Notes for the Team

- Keep each beat to its target time. The full video must be 3–5 minutes.
- "Amina" must be clearly identified as a synthetic/fictional persona at the start of the
  demo beat (Beat 3) and in any video description. Do not use real user data.
- Record in a quiet environment with screen capture running clearly.
- The demo requires the app to be running locally (`npm start`). Have a valid (but spend-
  limited) API key loaded in `.env` before recording.
- The rubric column above maps each beat to its criterion — make sure each beat is confident
  and clear on its specific point.
- [TODO: record the video before June 21, 2026 (submission deadline).]

---

*See also: [PROJECT.md](PROJECT.md) | [ARCHITECTURE.md](ARCHITECTURE.md) | [HUMAN_IN_THE_LOOP.md](HUMAN_IN_THE_LOOP.md) | [RESPONSIBLE_AI.md](RESPONSIBLE_AI.md)*
