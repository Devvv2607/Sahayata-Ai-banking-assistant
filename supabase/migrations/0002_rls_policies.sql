-- ===========================================================================
-- Sahayata AI — Row-Level Security policies
--
-- Tenancy model: staff only ever see their own branch's conversational data.
-- This is the DATABASE backstop; the API layer also derives branch_id from the
-- authenticated staff record and never trusts client-supplied branch ids.
--
-- Note: the backend uses the Supabase service-role key, which bypasses RLS by
-- design. These policies protect any direct client (anon-key + JWT) access.
-- ===========================================================================

-- Helper: the branch_id of the currently authenticated staff member.
create or replace function public.current_staff_branch_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
    select branch_id from public.staff where id = auth.uid();
$$;

-- --- branches: a staff member can read their own branch --------------------
create policy branches_select_own
    on public.branches for select
    using (id = public.current_staff_branch_id());

-- --- staff: read own row and colleagues in the same branch -----------------
create policy staff_select_same_branch
    on public.staff for select
    using (branch_id = public.current_staff_branch_id());

-- --- customers / customer_memory / banking_processes -----------------------
-- Synthetic, non-branch-scoped reference data: readable by any authenticated
-- staff (a returning customer may visit any branch). Writes go through the
-- service-role backend only.
create policy customers_select_authenticated
    on public.customers for select
    using (auth.role() = 'authenticated');

create policy customer_memory_select_authenticated
    on public.customer_memory for select
    using (auth.role() = 'authenticated');

create policy banking_processes_select_authenticated
    on public.banking_processes for select
    using (auth.role() = 'authenticated');

-- --- conversations: strictly branch-scoped ---------------------------------
create policy conversations_select_own_branch
    on public.conversations for select
    using (branch_id = public.current_staff_branch_id());

create policy conversations_insert_own_branch
    on public.conversations for insert
    with check (branch_id = public.current_staff_branch_id());

create policy conversations_update_own_branch
    on public.conversations for update
    using (branch_id = public.current_staff_branch_id())
    with check (branch_id = public.current_staff_branch_id());

-- --- utterances: scoped via the parent conversation's branch ---------------
create policy utterances_select_own_branch
    on public.utterances for select
    using (exists (
        select 1 from public.conversations c
        where c.id = conversation_id
          and c.branch_id = public.current_staff_branch_id()
    ));

create policy utterances_insert_own_branch
    on public.utterances for insert
    with check (exists (
        select 1 from public.conversations c
        where c.id = conversation_id
          and c.branch_id = public.current_staff_branch_id()
    ));

-- --- summaries: scoped via the parent conversation's branch ----------------
create policy summaries_select_own_branch
    on public.summaries for select
    using (exists (
        select 1 from public.conversations c
        where c.id = conversation_id
          and c.branch_id = public.current_staff_branch_id()
    ));

create policy summaries_insert_own_branch
    on public.summaries for insert
    with check (exists (
        select 1 from public.conversations c
        where c.id = conversation_id
          and c.branch_id = public.current_staff_branch_id()
    ));
