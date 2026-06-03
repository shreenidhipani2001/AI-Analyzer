# Mutual Fund FAQ Assistant — Problem Statement
**Product Context:** Groww (reference platform)
**Challenge:** LIP — RAG-based Mutual Fund FAQ Chatbot
**Deadline:** June 5, 2025, 11:59 PM IST

---

## Overview

Retail investors comparing mutual fund schemes are forced to navigate dense, siloed official documents (SIDs, KIMs, factsheets) scattered across AMC websites, AMFI, and SEBI portals. Meanwhile, platforms like Groww handle thousands of identical factual support queries every month — expense ratios, exit loads, ELSS lock-ins, minimum SIP amounts — with no scalable, compliant answer layer.

This project builds that answer layer: a **Retrieval-Augmented Generation (RAG) assistant** that surfaces verified, citation-backed facts from a curated corpus of official public documents. It is explicitly non-advisory — it answers "what is the expense ratio?" but refuses "should I invest?" — protecting both users and the platform from regulatory risk.

---

## Problem Being Solved

| Pain Point | Current State | What This Builds |
|---|---|---|
| Fact-finding from official docs | Manual, time-consuming, siloed | Instant cited answers in ≤3 sentences |
| Advisory vs. factual boundary | Blurred across most fintech content | Hard-coded refusal for non-factual queries |
| Source transparency | Often missing or buried | Every answer includes one official source URL |
| Support ticket volume | High for repetitive scheme FAQs | Deflectable via self-serve FAQ layer |
| PII risk in chat interfaces | Often unguarded | Explicit detection + rejection at input layer |

---

## Objective

Design and implement a lightweight, compliant RAG-based FAQ assistant that:

1. Answers **factual queries only** about mutual fund schemes and fund management
2. Retrieves exclusively from a **curated corpus of official public URLs** (AMC, AMFI, SEBI)
3. Delivers **concise, source-backed responses** (≤3 sentences + 1 citation link)
4. **Politely refuses** advisory, opinion, or return-prediction queries
5. **Never collects or stores PII** of any kind
6. Maintains **full transparency** via source dates and citation links on every response

---

## Target Users

- **Retail investors** comparing mutual fund schemes before investing
- **Customer support teams** at platforms like Groww handling repetitive factual queries
- **Content and compliance teams** who need a governed, citation-based Q&A layer
- **Fintech builders** who want a reference implementation of a compliant RAG assistant

---

## AMC and Scheme Scope

**AMC Selected:** Mirae Asset Investment Managers (India)

**Schemes Covered (5):**
1. Mirae Asset Large Cap Fund
2. Mirae Asset ELSS Tax Saver Fund
3. Mirae Asset Flexi Cap Fund
4. Mirae Asset Emerging Bluechip Fund
5. Mirae Asset NYSE FANG+ ETF Fund of Fund

These schemes cover large-cap, ELSS (tax-saving), flexi-cap, and thematic categories — sufficient to exercise all factual query types (expense ratio, exit load, ELSS lock-in, riskometer, benchmark, SIP minimums).

---

## Corpus Definition

**Target:** 15–25 official public URLs

**Source categories:**

| Category | Examples |
|---|---|
| AMC scheme factsheets | monthlyfactsheet.pdf for each scheme |
| Key Information Memorandums (KIM) | One per scheme, from AMC website |
| Scheme Information Documents (SID) | Full SID for each scheme |
| AMC help / FAQ pages | Scheme-specific help pages on Mirae Asset India site |
| AMFI scheme data pages | amfiindia.com scheme detail pages |
| SEBI riskometer guidance | SEBI circular on riskometer classification |
| Statement download guide | AMC portal guide for account/CAS statement download |
| Capital gains tax guide | AMC or CAMS guide for capital gains statement |
| Fund management data | AMC fund manager profiles, AUM disclosures, portfolio holdings pages |

**Hard rule:** No third-party blogs, aggregators, or screenshots of app back-ends. All URLs must be publicly accessible without authentication.

---

## Functional Requirements

### FR-1: Factual Query Answering

The assistant must answer the following query types accurately:

| Query Type | Example | Expected Answer Shape |
|---|---|---|
| Expense ratio | "What is the expense ratio of Mirae Asset Large Cap Fund?" | Direct ratio (regular/direct), citation, date |
| Exit load | "Is there an exit load on Mirae Asset Flexi Cap Fund?" | Load %, condition (e.g. within 1 year), citation |
| Minimum SIP | "What is the minimum SIP amount for Mirae Asset ELSS?" | Amount in ₹, frequency note if relevant, citation |
| ELSS lock-in | "What is the lock-in period for ELSS funds?" | 3 years from date of each investment, citation |
| Riskometer | "What is the riskometer level of Emerging Bluechip Fund?" | SEBI riskometer category + AMC link |
| Benchmark | "What index does Mirae Asset Large Cap Fund track?" | Benchmark name, citation |
| Statement download | "How do I download my capital gains statement?" | Step summary, link to official guide |
| NAV frequency | "How often is NAV updated for mutual funds?" | Factual regulatory answer, AMFI/SEBI citation |
| Fund manager | "Who manages Mirae Asset Large Cap Fund?" | Manager name, AMC profile link, citation |
| AUM | "What is the AUM of Mirae Asset ELSS Tax Saver Fund?" | AUM figure + as-of date from factsheet, citation |
| Portfolio holdings | "What are the top holdings of Mirae Asset Flexi Cap Fund?" | Top 5 holdings from latest factsheet, citation |
| Fund house | "What is Mirae Asset's SEBI registration number?" | AMC name, SEBI registration number, citation |

**Answer format (every response):**
```
[Factual answer in ≤3 sentences]

Source: [Official URL]
Last updated from sources: [YYYY-MM-DD]
```

### FR-2: Refusal Handling

Advisory, comparative, or return-prediction queries must receive a polite refusal. The refusal must:
- Clearly state this is a facts-only assistant
- Not leave the user empty-handed — provide a relevant educational link (AMFI investor education or SEBI)

**Refusal trigger examples:**
- "Should I invest in Mirae Asset ELSS?"
- "Which is better — Mirae Large Cap or Flexi Cap?"
- "Will this fund give 15% returns?"
- "Is now a good time to start SIP?"

**Refusal response template:**
```
This assistant answers factual questions about mutual fund schemes only — such as
expense ratios, exit loads, or SIP minimums. Questions about whether to invest,
fund comparisons, or return expectations fall outside what I can help with here.

For investor education: https://www.amfiindia.com/investor-corner
```

### FR-3: Performance Query Deflection

Return or performance questions must not trigger any computation or comparison. Response: link to the official factsheet only.

```
Performance data changes daily and is best reviewed directly from the official source.

Factsheet: [Official AMC factsheet URL]
Last updated from sources: [YYYY-MM-DD]
```

### FR-4: PII Rejection

The system must detect and drop any input containing:
- PAN numbers (format: ABCDE1234F)
- Aadhaar numbers (12-digit numeric)
- Account or folio numbers
- OTPs
- Email addresses
- Phone numbers

**Response on PII detection:**
```
For your security, please do not share personal identifiers here.
I can only answer general factual questions about mutual fund schemes.
```

### FR-5: Minimal UI

The interface must include:
- A welcome headline
- 3 example questions (clickable, pre-populated into the input)
- A persistent disclaimer banner: "Facts-only. No investment advice."
- A citation link displayed below every answer
- A "Last updated from sources" date on every response

---

## System Constraints

### Data Constraints
- **Public sources only** — AMC, AMFI, SEBI official pages
- **No third-party content** — no blogs, no aggregators, no app screenshots
- **Corpus is static + scheduled** — scraped offline, refreshed on a schedule, not live

### Privacy Constraints
- **No PII accepted** — PAN, Aadhaar, account numbers, OTPs, email, phone
- **No user data stored** — conversation history must not be persisted server-side
- **No authentication required** — the assistant is fully public-facing

### Content Constraints
- **No investment advice** — zero recommendations or opinions
- **No return comparisons** — no computation, no projection
- **No performance claims** — link to factsheet only
- **Answer length** — maximum 3 sentences per factual answer
- **Citation** — exactly 1 official URL per answer

### Transparency Constraints
- **Source date** — every answer includes "Last updated from sources: [date]"
- **Corpus date** — README must state when the corpus was last refreshed
- **Known limits** — README must document what the assistant cannot answer

---

## Success Criteria

| Criterion | Measurement |
|---|---|
| Factual accuracy | Answer matches official source document |
| Citation validity | URL resolves to the correct official page |
| Refusal correctness | Advisory queries refused 100% of the time |
| Answer brevity | ≤3 sentences on all factual responses |
| PII safety | No PII accepted or echoed in any response |
| UI disclaimer | Visible on page load and throughout session |
| Source coverage | 15–25 URLs across all required categories |

---

## Out of Scope

The following are explicitly excluded from this project:

- Real-time NAV data feeds or live price integration
- User account management or authentication
- Portfolio tracking or personalized recommendations
- Return calculation, backtesting, or performance projection
- Comparison tables across schemes
- Advice-mode prompting or tone
- Integration with Groww or any brokerage API

---

## Disclaimer

> This assistant provides factual information only, sourced from official public documents published by AMC, AMFI, and SEBI. It does not provide investment advice, return projections, or fund recommendations. Always consult a SEBI-registered investment advisor before making financial decisions. Mutual fund investments are subject to market risk.
