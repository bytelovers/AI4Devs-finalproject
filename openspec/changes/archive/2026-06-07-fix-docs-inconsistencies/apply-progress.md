# Apply Progress: Fix Docs Inconsistencies

- **Change Name**: `fix-docs-inconsistencies`
- **Timestamp**: 2026-06-07T23:23:00+02:00
- **Status**: `success` (All Phases 1 to 4 completed and verified)

---

## 1. Completed Tasks

### Phase 1: PRD and Plan Updates
- **Task 1.1**: Consolidated GDPR compliance details, B2B SaaS roadmap points, and camera/geolocation permission details from `docs/prd/PRD-Perplexity.md` into `docs/prd/PRD.md`.
- **Task 1.2**: Deleted `docs/prd/PRD-Perplexity.md` to prevent duplication.
- **Task 1.3**: Replaced generic task IDs `T-01` to `T-05` with hierarchical IDs `TSK-1.1` to `TSK-5.1` (including updating dependency references) in `docs/tech-lead/technical_plan.md`.
- **Task 1.4**: Replaced references to `T-03` with hierarchical task ID `TSK-3.5` in `docs/tech-lead/deployment_branching.md`.

### Phase 2: Code and QA Documentation Updates
- **Task 2.1**: Renamed all occurrences of `pennyAdjustment.test.ts` to `mathHelper.test.ts` in `docs/qa/testing_strategy.md`.
- **Task 2.2**: Renamed `pennyAdjustment.ts/test.ts` references to `mathHelper.ts/test.ts` in `docs/user-stories/epic-2-advanced/US-04.md` and replaced the non-existent wireframe link with a descriptive plain text layout note.
- **Task 2.3**: Removed the HTTP API contract for `POST /api/v1/contacts/sync` from `docs/api/integration_contracts.md`.
- **Task 2.4**: Updated `docs/user-stories/epic-3-cloud/US-11.md` to remove references to the HTTP synchronization API, documented the direct Firestore SDK sync instead, and replaced the wireframe link with a plain text layout note.

### Phase 3: User Stories Wireframe Cleanup
- **Task 3.1**: Replaced broken wireframe image links with descriptive layout notes in `docs/user-stories/epic-2-advanced/US-05.md` through `US-09.md`.
- **Task 3.2**: Replaced broken wireframe image links with descriptive layout notes in `docs/user-stories/epic-3-cloud/US-10.md` and `US-12.md`.
- **Task 3.3**: Replaced broken wireframe image links with descriptive layout notes in `docs/user-stories/epic-4-analytics/US-13.md` and `US-14.md`.

### Phase 4: Verification and Validation
- **Task 4.1**: Ran `grep` searches to verify that no references to `pennyAdjustment.ts` or `pennyAdjustment.test.ts` remain (except as the `pennyAdjustment` database schema field, which is correct).
- **Task 4.2**: Verified via `grep` that no occurrences of `POST /api/v1/contacts/sync` or the `/contacts/sync` endpoint remain in the documentation.
- **Task 4.3**: Verified via `grep` that no markdown file contains broken links to `.png` files under the non-existent `docs/wireframes/` directory.
- **Task 4.4**: Verified that `PRD-Perplexity.md` is deleted and that no generic task IDs `T-01` to `T-05` exist in the documentation.

---

## 2. Files Changed

| File Path | Action | Description |
|-----------|--------|-------------|
| `docs/prd/PRD.md` | Modified | Merged compliance/strategic details from Perplexity PRD. |
| `docs/prd/PRD-Perplexity.md` | Deleted | Removed duplicate PRD. |
| `docs/tech-lead/technical_plan.md` | Modified | Updated task IDs from generic `T-xx` to hierarchical `TSK-x.y`. |
| `docs/tech-lead/deployment_branching.md` | Modified | Updated task ID references. |
| `docs/qa/testing_strategy.md` | Modified | Replaced `pennyAdjustment.test.ts` references with `mathHelper.test.ts`. |
| `docs/user-stories/epic-2-advanced/US-04.md` | Modified | Replaced helper filenames with `mathHelper` and updated wireframe link. |
| `docs/api/integration_contracts.md` | Modified | Removed contacts synchronization API endpoint section. |
| `docs/user-stories/epic-3-cloud/US-11.md` | Modified | Removed synchronization API, added Firestore SDK details, updated wireframe. |
| `docs/user-stories/epic-2-advanced/US-05.md` | Modified | Cleaned up wireframe links with text notes. |
| `docs/user-stories/epic-2-advanced/US-06.md` | Modified | Cleaned up wireframe links with text notes. |
| `docs/user-stories/epic-2-advanced/US-07.md` | Modified | Cleaned up wireframe links with text notes. |
| `docs/user-stories/epic-2-advanced/US-08.md` | Modified | Cleaned up wireframe links with text notes. |
| `docs/user-stories/epic-2-advanced/US-09.md` | Modified | Cleaned up wireframe links with text notes. |
| `docs/user-stories/epic-3-cloud/US-10.md` | Modified | Cleaned up wireframe links with text notes. |
| `docs/user-stories/epic-3-cloud/US-12.md` | Modified | Cleaned up wireframe links with text notes. |
| `docs/user-stories/epic-4-analytics/US-13.md` | Modified | Cleaned up wireframe links with text notes. |
| `docs/user-stories/epic-4-analytics/US-14.md` | Modified | Cleaned up wireframe links with text notes. |
| `openspec/changes/fix-docs-inconsistencies/tasks.md` | Modified | Checked off completed tasks. |

---

## 3. Deviations and Issues
- **Deviations**: None. All changes precisely match the instructions in the tasks and action plan.
- **Issues**: None.

---

## 4. Remaining Work
- **Remaining Tasks**: None.
- **Workload / PR Boundary**: Resolved as a single consolidated PR (Low risk, documentation-only change).

---

## 5. Next Recommended Step
- Proceed to validation and archive. Recommended tool call/phase: `sdd-verify` (or `/sdd-verify`).
