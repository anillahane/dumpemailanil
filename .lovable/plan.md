# Phase 1 — Foundation: Normalized Schema + Secure Data Access

**Goal:** move from "one JSONB blob per audit + permissive RLS + hardcoded master data" to a properly normalized, query-able, secured schema that mirrors how Salesforce will eventually model these objects. Auth stays as-is (will be replaced by Salesforce session context later).

**Estimated effort:** 3–5 working days. No breaking UX changes — all current pages keep working.

---

## 1. Database changes (one migration)

### 1.1 New master-data tables (replace `mockData.ts` constants)

| Table | Purpose | Key columns |
|---|---|---|
| `branches` | Branch directory | `code` (PK text), `name`, `region`, `is_active` |
| `audit_types` | Audit type catalogue | `code` (PK), `name`, `description`, `is_active` |
| `checkpoint_library` | Master BRD checkpoints | `id` (uuid), `audit_type_code` (FK), `category`, `sub_category`, `checkpoint_text`, `weight`, `display_order`, `is_active` |
| `app_users` | App-side user directory (mirrors Salesforce users later) | `id` (uuid), `external_id` (text, unique — will hold SF user id), `name`, `email`, `role` (enum) |
| `user_roles` | RBAC (separate from `app_users`, per security best practice) | `user_id` (FK), `role` (enum: `admin`, `auditor`, `reviewer`, `approver`, `viewer`) |

### 1.2 Normalize the `audits` table

Keep `audits` row, but **extract checkpoints and audit trail into child tables**:

| Table | Purpose | Key columns |
|---|---|---|
| `audit_checkpoints` | One row per checkpoint result | `id`, `audit_id` (FK), `library_checkpoint_id` (FK), `result` (enum: `compliant`/`non_compliant`/`na`), `score`, `auditor_remarks`, `evidence_url` |
| `audit_trail` | Append-only history | `id`, `audit_id` (FK), `actor_user_id`, `action`, `from_stage`, `to_stage`, `notes`, `created_at` |
| `audit_attachments` | Files linked to an audit | `id`, `audit_id`, `file_path` (storage), `uploaded_by`, `mime_type` |

Drop these JSONB columns from `audits`: `checkpoints`, `audit_trail`. Keep `report_data` JSONB only for free-form report header text (or split into proper columns in Phase 2).

Add: `created_by`, `updated_by`, `assigned_to_user_id`, `branch_code` (FK), `audit_type_code` (FK), proper foreign keys + indexes on (`status`, `workflow_stage`, `branch_code`, `assigned_to_user_id`).

### 1.3 RLS — replace permissive policies

Current state: every table has `USING (true)` for all roles. That's a **prod-blocker**.

New policy model using a `has_role(user_id, role)` SECURITY DEFINER function:

- `audits` SELECT: admin/reviewer/approver see all; auditor sees only rows where `assigned_to_user_id = auth.uid()` or `created_by = auth.uid()`
- `audits` INSERT/UPDATE: admin/auditor only; auditor restricted to own rows
- `audit_checkpoints`: inherit visibility from parent audit (via EXISTS subquery)
- `audit_trail`: insert-only for authenticated users; select follows audit visibility
- Master tables (`branches`, `audit_types`, `checkpoint_library`): SELECT for all authenticated; INSERT/UPDATE/DELETE admin only
- `user_roles`: SELECT own row; admin can manage all

### 1.4 Triggers

- `update_updated_at` already exists — attach to all new tables
- Audit trail trigger: on `audits` UPDATE, auto-insert into `audit_trail` when `workflow_stage` or `status` changes

---

## 2. Code changes (file-by-file)

### 2.1 New files

```
src/lib/
  branchStore.ts          fetchBranches(), invalidates on master-data change
  auditTypeStore.ts       fetchAuditTypes()
  checkpointLibraryStore.ts  fetchCheckpointsForAuditType(code)
  userStore.ts            fetchUsers(), fetchUserRoles()
  auditCheckpointStore.ts CRUD on audit_checkpoints (replaces JSONB ops)
  auditTrailStore.ts      appendTrail(), fetchTrail(auditId)
src/hooks/
  useBranches.ts          react-query wrapper
  useAuditTypes.ts
  useCheckpointLibrary.ts
  useAudit.ts             single-audit fetch + mutation hooks
  useAuditList.ts         list with filters, replaces ad-hoc useEffect+fetch
```

### 2.2 Refactored files

| File | Change |
|---|---|
| `src/data/mockData.ts` | Delete `BRANCHES`, `AUDIT_TYPES`, `MOCK_AUDITS` constants. Keep only TS types. Add deprecation comment. |
| `src/data/brdCheckpoints.ts` | Delete file — content seeded into `checkpoint_library` table. |
| `src/lib/auditStore.ts` | Rewrite: `fetchAudits` joins `audit_checkpoints` count and computes score server-side via a view. Remove JSONB checkpoint handling. |
| `src/pages/AuditDetailsPage.tsx` | Replace local checkpoint state with `useAuditCheckpoints(auditId)`. Replace `persistReport` JSONB writes with row-level updates on `audit_checkpoints`. |
| `src/pages/ScheduledAuditsPage.tsx`, `OpenAuditsPage.tsx`, `DeferredAuditsPage.tsx`, `AuditViewPage.tsx`, `GenericAuditListPage.tsx` | Replace `useEffect(fetchAudits…)` with `useAuditList({ status })` (react-query — caching, retry, loading states). |
| `src/pages/ScheduleAuditPage.tsx` | Branch + audit-type dropdowns load from `useBranches()` / `useAuditTypes()`. |
| `src/pages/AdminSetupPage.tsx` | Wire to real CRUD on `branches`, `audit_types`, `checkpoint_library`. |
| `src/contexts/AuthContext.tsx` | Add a `currentUserId` and `roles[]` shape that the eventual SF integration will populate. Keep mock login for now but make role come from `user_roles` query. |

### 2.3 Seed data migration

A second migration seeds:
- existing `BRANCHES` array → `branches`
- existing `AUDIT_TYPES` → `audit_types`
- existing `BRD_CHECKPOINTS` → `checkpoint_library`
- existing `MOCK_AUDITS` → `audits` + `audit_checkpoints` (one-time backfill)

---

## 3. Cross-cutting concerns

### 3.1 React Query everywhere
Remove all `useState + useEffect + fetchX().then(setX)` patterns. Standard hooks give us caching, refetch on focus, optimistic updates, and consistent loading/error UI.

### 3.2 Centralized error handling
Add `src/lib/queryClient.ts` with global `onError` → toast. Remove per-page `.catch(() => setRows([]))` swallowing.

### 3.3 Type safety
After migration, `src/integrations/supabase/types.ts` regenerates automatically. Replace all `Record<string, unknown>` and `unknown[]` in `auditStore.ts` with generated `Tables<'audits'>` etc.

### 3.4 Computed score as a DB view
Create view `audit_scores_v` that aggregates `audit_checkpoints` → score + rating per audit. PDF export and dashboard read from this view → guaranteed consistency.

---

## 4. What this unlocks for Salesforce migration

| Lovable construct | Future Salesforce mapping |
|---|---|
| `audits` table | `Audit__c` custom object |
| `audit_checkpoints` | `Audit_Checkpoint__c` (master-detail to Audit__c) |
| `checkpoint_library` | `Checkpoint_Library__c` (custom metadata type) |
| `branches`, `audit_types` | Custom metadata types |
| `user_roles` + `has_role()` | Permission sets + `WITH SECURITY_ENFORCED` SOQL |
| `audit_trail` trigger | Apex trigger on `Audit__c` writing `Audit_History__c` |

One-to-one mapping → Phase 2 (SF migration) becomes mechanical.

---

## 5. Out of scope for Phase 1 (deferred)

- Replacing mock auth with real Supabase Auth (you said SF will handle this)
- Storage bucket for evidence files (`audit_attachments.file_path` will be added but UI upload is Phase 2)
- Edge functions / scheduled jobs
- Realtime subscriptions
- Audit report PDF redesign

---

## 6. Deliverables

1. **2 migrations**: `0001_normalize_schema.sql` (DDL + RLS), `0002_seed_master_data.sql` (data backfill)
2. **~12 new/refactored source files** (listed in §2)
3. **Deletion** of `brdCheckpoints.ts` and mock arrays from `mockData.ts`
4. **Updated** `types.ts` (auto-generated)
5. **Smoke test pass**: every existing page loads, schedule → draft → submit → approve → publish flow still works end-to-end against the new schema

---

## 7. Suggested execution order

1. Write & apply migration 1 (schema + RLS)
2. Write & apply migration 2 (seed)
3. Build new stores + hooks (no UI changes yet)
4. Refactor list pages (lowest risk)
5. Refactor `AuditDetailsPage` (highest risk — do last with full smoke test)
6. Delete dead code from `mockData.ts` / `brdCheckpoints.ts`
7. Run security linter, fix any remaining warnings

---

**Ready to start?** If you approve, I'll begin with step 1 (the schema + RLS migration) and pause for your review before applying it.
