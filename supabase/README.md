# Sahayata AI — Database (`supabase/`)

Postgres schema, Row-Level Security policies, and synthetic seed data for the Sahayata AI
demo. **No real PII** is ever stored — customers are pseudonymous (`phone_hash`).

## Files

| File | Purpose |
|---|---|
| `migrations/0001_initial_schema.sql` | All tables + enums + indexes; enables RLS on every table |
| `migrations/0002_rls_policies.sql` | RLS policies — staff only see their own branch's conversational data |
| `seed.sql` | 7 `banking_processes`, a demo branch, 2 demo customers, seeded returning-customer memory |

## Applying locally

With the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase db reset            # applies migrations/ then seed.sql to the local stack
```

Against a hosted project, run the migration files in order, then `seed.sql`, via the SQL
editor or `psql`.

## Security model

- RLS is enabled on **all** tables. `conversations`, `utterances`, and `summaries` are
  strictly branch-scoped via `current_staff_branch_id()`.
- `customers`, `customer_memory`, and `banking_processes` are readable by any authenticated
  staff (shared reference data); all writes go through the service-role backend.
- The backend's **service-role key bypasses RLS by design** — branch scoping is therefore
  *also* enforced in the API layer. RLS is the defense-in-depth backstop for any direct
  anon-key client access. See `../docs/security.md`.
