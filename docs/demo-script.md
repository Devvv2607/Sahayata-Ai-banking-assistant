# Sahayata AI — Demo Script (3-minute walkthrough)

> Draft. Finalized in Phase 6 with believable seed data across ≥3 Indian languages.
> Scenarios below are seeded from real banking flows (account opening, loan enquiry) and use
> authentic Indian document requirements (Aadhaar, PAN, Form 60).

## Setup
- Officer logged in (preferred language: English), branch dashboard open.
- Two demo customers seeded; one is a returning customer (shows the "Previously: …" card).

## Scene 1 — Account opening (Marathi → English)  ~60s
1. Customer (Marathi): *"मला नवीन खाते उघडायचे आहे"* → transcript shows **"I want to open a new bank account."**
2. Copilot detects intent **Account Opening** (93%) and surfaces steps + required docs
   (Aadhaar, PAN, passport photo).
3. Customer: *"...पण पॅन कार्ड नाहीये."* (no PAN) → copilot adapts: suggests **Form 60** as the
   PAN alternative, marks the PAN step as missing.
4. Officer replies in English; the customer hears it spoken back in Marathi.

## Scene 2 — Loan enquiry (Gujarati → English)  ~60s
1. Customer (Gujarati): *"મારે એક નવી લોન લેવી છે."* → **"I want to take a new loan."**
2. Copilot detects **Loan Enquiry** → narrows to **Personal Loan**, shows required docs
   (identity proof, salary slips, bank statement) and guidance (ask type → check account →
   amount → rate).

## Scene 3 — Memory + summary  ~45s
1. End the session → a **bilingual summary** + action items + document checklist is generated
   and stored.
2. Start a new session for the same customer → the **"Previously: …"** card shows the prior
   visit summary.

## Scene 4 — Escalation  ~15s
- A frustrated/complaint utterance raises a visible **escalation flag** on the conversation.
