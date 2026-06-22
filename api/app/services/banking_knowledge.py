"""In-process banking knowledge base (F4 + F10 grounding).

Mirrors the seeded ``banking_processes`` rows (see ``supabase/seed.sql``). Used to ground the
LLM's intent/guidance/document analysis in Phase 1 before the DB-backed lookup exists. Both
sources derive from the same canonical content.
"""

from __future__ import annotations

from app.models.turn import BankingProcess

BANKING_PROCESSES: list[BankingProcess] = [
    BankingProcess(
        intent_key="account_opening",
        display_name="Account Opening",
        required_documents=[
            "Aadhaar card",
            "PAN card (or Form 60 if unavailable)",
            "Passport-size photograph",
        ],
        steps=[
            "Ask for Aadhaar",
            "Ask for PAN (offer Form 60 if missing)",
            "Capture mobile number",
            "Select account type (Savings/Current)",
            "Collect documents and signature",
        ],
        keywords=["open account", "new account", "savings account", "current account", "khata"],
    ),
    BankingProcess(
        intent_key="loan_enquiry",
        display_name="Loan Enquiry",
        required_documents=["Identity proof", "Income proof / salary slips", "Bank statement"],
        steps=[
            "Ask loan type (Home/Auto/Personal)",
            "Check existing account relationship",
            "Ask required loan amount",
            "Inform applicable interest rate",
            "List required documents",
        ],
        keywords=["loan", "personal loan", "home loan", "auto loan", "interest rate", "karz"],
    ),
    BankingProcess(
        intent_key="debit_card_request",
        display_name="Debit Card Request",
        required_documents=["Account number", "Identity proof"],
        steps=[
            "Verify account ownership",
            "Confirm card variant",
            "Confirm mailing/branch delivery",
            "Submit request",
        ],
        keywords=["debit card", "atm card", "new card", "card request"],
    ),
    BankingProcess(
        intent_key="kyc_update",
        display_name="KYC Update",
        required_documents=["Updated Aadhaar / address proof", "Recent photograph"],
        steps=[
            "Verify identity",
            "Capture updated address proof",
            "Update contact details",
            "Submit KYC update",
        ],
        keywords=["kyc", "update address", "update details", "re-kyc", "address change"],
    ),
    BankingProcess(
        intent_key="complaint",
        display_name="Complaint",
        required_documents=["Account/transaction reference"],
        steps=[
            "Record complaint details",
            "Capture transaction reference",
            "Acknowledge and assign ticket",
            "Inform expected resolution time",
        ],
        keywords=["complaint", "problem", "issue", "fraud", "wrong", "not working", "shikayat"],
    ),
    BankingProcess(
        intent_key="balance_enquiry",
        display_name="Balance Enquiry",
        required_documents=["Account number", "Identity verification"],
        steps=[
            "Verify account ownership",
            "Confirm identity",
            "Provide balance / mini-statement",
        ],
        keywords=["balance", "how much", "statement", "mini statement"],
    ),
    BankingProcess(
        intent_key="fund_transfer",
        display_name="Fund Transfer",
        required_documents=["Account number", "Beneficiary details", "Identity verification"],
        steps=[
            "Verify source account",
            "Capture beneficiary details",
            "Confirm amount and mode (NEFT/RTGS/IMPS)",
            "Authorize and submit",
        ],
        keywords=["transfer", "send money", "neft", "rtgs", "imps", "paisa bhejo"],
    ),
]


def all_processes() -> list[BankingProcess]:
    return BANKING_PROCESSES


def as_llm_context() -> list[dict[str, object]]:
    """Shape the knowledge base for ``LLMProvider.analyze_turn``."""
    return [p.model_dump() for p in BANKING_PROCESSES]
