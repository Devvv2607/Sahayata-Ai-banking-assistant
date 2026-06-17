-- ===========================================================================
-- Sahayata AI — synthetic seed data (demo only, no real PII).
-- Idempotent: safe to run multiple times.
-- ===========================================================================

-- --- Banking knowledge base (F4 + F10) ------------------------------------
-- Document requirements reflect real Indian retail-banking flows (Aadhaar, PAN,
-- Form 60 as the PAN alternative, etc.).

insert into public.banking_processes (intent_key, display_name, required_documents, steps, keywords)
values
(
    'account_opening',
    'Account Opening',
    '["Aadhaar card", "PAN card (or Form 60 if unavailable)", "Passport-size photograph"]'::jsonb,
    '["Ask for Aadhaar", "Ask for PAN (offer Form 60 if missing)", "Capture mobile number", "Select account type (Savings/Current)", "Collect documents and signature"]'::jsonb,
    array['open account', 'new account', 'savings account', 'current account', 'khata']
),
(
    'loan_enquiry',
    'Loan Enquiry',
    '["Identity proof", "Income proof / salary slips", "Bank statement"]'::jsonb,
    '["Ask loan type (Home/Auto/Personal)", "Check existing account relationship", "Ask required loan amount", "Inform applicable interest rate", "List required documents"]'::jsonb,
    array['loan', 'personal loan', 'home loan', 'auto loan', 'interest rate', 'karz']
),
(
    'debit_card_request',
    'Debit Card Request',
    '["Account number", "Identity proof"]'::jsonb,
    '["Verify account ownership", "Confirm card variant", "Confirm mailing/branch delivery", "Submit request"]'::jsonb,
    array['debit card', 'atm card', 'new card', 'card request']
),
(
    'kyc_update',
    'KYC Update',
    '["Updated Aadhaar / address proof", "Recent photograph"]'::jsonb,
    '["Verify identity", "Capture updated address proof", "Update contact details", "Submit KYC update"]'::jsonb,
    array['kyc', 'update address', 'update details', 're-kyc', 'address change']
),
(
    'complaint',
    'Complaint',
    '["Account/transaction reference"]'::jsonb,
    '["Record complaint details", "Capture transaction reference", "Acknowledge and assign ticket", "Inform expected resolution time"]'::jsonb,
    array['complaint', 'problem', 'issue', 'fraud', 'wrong', 'not working', 'shikayat']
),
(
    'balance_enquiry',
    'Balance Enquiry',
    '["Account number", "Identity verification"]'::jsonb,
    '["Verify account ownership", "Confirm identity", "Provide balance / mini-statement"]'::jsonb,
    array['balance', 'how much', 'statement', 'mini statement']
),
(
    'fund_transfer',
    'Fund Transfer',
    '["Account number", "Beneficiary details", "Identity verification"]'::jsonb,
    '["Verify source account", "Capture beneficiary details", "Confirm amount and mode (NEFT/RTGS/IMPS)", "Authorize and submit"]'::jsonb,
    array['transfer', 'send money', 'neft', 'rtgs', 'imps', 'paisa bhejo']
)
on conflict (intent_key) do update set
    display_name       = excluded.display_name,
    required_documents = excluded.required_documents,
    steps              = excluded.steps,
    keywords           = excluded.keywords;

-- --- Demo branch ----------------------------------------------------------
insert into public.branches (id, name, city)
values ('11111111-1111-1111-1111-111111111111', 'Sahayata Demo Branch — Pune Camp', 'Pune')
on conflict (id) do nothing;

-- --- Demo customers (synthetic; phone_hash is a fake hashed key) -----------
insert into public.customers (id, display_name, preferred_language, phone_hash)
values
    ('22222222-2222-2222-2222-222222222222', 'Demo Customer (Marathi)', 'mr',
        encode(digest('demo-marathi-9876500001', 'sha256'), 'hex')),
    ('33333333-3333-3333-3333-333333333333', 'Demo Customer (Gujarati)', 'gu',
        encode(digest('demo-gujarati-9876500002', 'sha256'), 'hex'))
on conflict (id) do nothing;

-- --- Seed memory for the returning-customer demo (F8) ----------------------
insert into public.customer_memory (customer_id, key_facts, last_visit_summary, visit_count)
values (
    '22222222-2222-2222-2222-222222222222',
    '{"language": "Marathi", "no_pan": true, "prefers": "Savings account"}'::jsonb,
    'Customer enquired about opening a Savings account. Has Aadhaar but no PAN; advised Form 60 as the alternative.',
    1
)
on conflict (customer_id) do nothing;
