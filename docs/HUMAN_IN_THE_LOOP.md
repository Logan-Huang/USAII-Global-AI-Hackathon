# Human in the Loop

## Design Principle

Human-in-the-loop is not a disclaimer added at the end of this project — it is a design
constraint that shaped every decision in the architecture. The AI explains and orients; a
human attorney decides.

Asylum cases are high-stakes legal proceedings where a wrong decision can result in deportation
to a country where someone faces persecution. No AI system — however capable — should
determine eligibility, predict outcomes, or substitute for the judgment of a qualified
immigration attorney. This application is designed from the ground up around that constraint.

---

## What the AI Does (and Does Not Do)

| The AI does | The AI does not do |
|---|---|
| Explain the asylum process in plain language | Determine whether the user qualifies for asylum |
| Deliver a personalized checklist and next steps | Predict the outcome of a case |
| Translate legal concepts into the user's native language | Advise on legal strategy |
| Cite authoritative official sources for every claim | Replace the judgment of an attorney |
| Surface the legal-aid directory in every session | Store or transmit any personal information |
| State clearly when a question requires an attorney | |

---

## Implementation

### System Prompt Guardrail

The AI operates under a fixed system prompt that includes the following instructions (in
effect):

- "You are a legal information assistant, not a lawyer. You provide general information about
  asylum processes. You do not provide legal advice and you do not determine whether the user
  qualifies for asylum protection."
- "For any question that requires a case-specific legal judgment — including eligibility,
  strategy, or the strength of a claim — respond by explaining that the user needs to consult
  a qualified immigration attorney, and provide the legal-aid directory link."
- "Always end your response with a 'Next step' that directs the user to contact a qualified
  attorney or accredited representative."

This prompt is fixed server-side and cannot be overridden by user input.

### Persistent UI Guardrail

A banner visible throughout every session reads:

> "This is general information, not legal advice. Always verify information with an official
> source and consult a qualified attorney before making decisions about your case."

The banner cannot be dismissed. It is rendered before the chat interface loads and persists
through the session.

### Legal-Aid Directory Routing

Every session surfaces the legal-aid directory (populated from `GET /api/resources`). On any
case-specific question — eligibility, filing deadlines, evidence strategy — the AI explicitly
states that a qualified attorney is needed and links directly to:

- ImmigrationLawHelp.org (US)
- LawHelp.org (US)
- ASAP — Asylum Seeker Advocacy Project (US)
- RAICES (US)
- ILRC — Immigrant Legal Resource Center (US)
- Refugee Council UK (UK)
- EUAA Legal Aid Directory (EU)
- IRCC legal-aid resources (Canada)
- Refugee Council of Australia / RACS (Australia)

---

## Why This Matters for the Rubric

The HS rubric explicitly asks about AI reasoning and responsible design. Human-in-the-loop
here is not a checkbox — it is the mechanism that makes deployment of AI in a high-stakes
legal context ethical.

An AI that told a user "you qualify for asylum" without attorney review could:

- Give false hope that leads to inaction on a real deadline.
- Give false confidence that leads to a poorly prepared case.
- Expose the user to harm if the AI's legal information was outdated or jurisdiction-wrong.

By limiting the AI to explanation and orientation — and routing all case-specific decisions to
a human attorney — this application captures the access and language benefits of AI without
taking on the liability of legal adjudication.

---

## Cross-Reference

For the full risk/mitigation analysis that supports this design, see
[RESPONSIBLE_AI.md](RESPONSIBLE_AI.md). For the technical implementation of the system prompt
and routing, see [ARCHITECTURE.md](ARCHITECTURE.md#layer-3--ai-anthropic-claude).

---

*See also: [PROJECT.md](PROJECT.md) | [ARCHITECTURE.md](ARCHITECTURE.md) | [RESPONSIBLE_AI.md](RESPONSIBLE_AI.md)*
