# Tasks: Fix Docs Inconsistencies

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150-250 lines of documentation changes (Low risk) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Align PRD and Technical Plans | PR 1 | Phase 1 changes; self-contained documentation updates |
| 2 | Align API and Helper references | PR 1 | Phase 2, 3 and 4 changes; final cleanup |

## Phase 1: PRD and Plan Updates
- [x] 1.1 Consolidate key strategic/compliance details from `PRD-Perplexity.md` into `PRD.md` (e.g., GDPR, B2B SaaS roadmap, camera/geolocation permissions).
- [x] 1.2 Delete `docs/prd/PRD-Perplexity.md` to prevent duplication.
- [x] 1.3 Replace generic task IDs `T-01` to `T-05` with hierarchical IDs `TSK-x.y` in `docs/tech-lead/technical_plan.md`.
- [x] 1.4 Replace `T-03` references in `docs/tech-lead/deployment_branching.md` with relevant hierarchical task IDs (e.g., `TSK-3.5`).

## Phase 2: Code and QA Documentation Updates
- [x] 2.1 Update `docs/qa/testing_strategy.md` to rename `pennyAdjustment.test.ts` references to `mathHelper.test.ts`.
- [x] 2.2 In `docs/user-stories/epic-2-advanced/US-04.md`, rename `pennyAdjustment.ts/test.ts` to `mathHelper.ts/test.ts` and replace wireframe link with plain text.
- [x] 2.3 Remove the POST `/api/v1/contacts/sync` HTTP API endpoint from `docs/api/integration_contracts.md`.
- [x] 2.4 In `docs/user-stories/epic-3-cloud/US-11.md`, remove HTTP sync endpoint references, document Firestore Direct SDK client sync, and replace wireframe link.

## Phase 3: User Stories Wireframe Cleanup
- [x] 3.1 Update `docs/user-stories/epic-2-advanced/US-05.md` to `US-09.md` (replace broken wireframe links with plain text layout notes).
- [x] 3.2 Update `docs/user-stories/epic-3-cloud/US-10.md` and `US-12.md` (replace broken wireframe links with plain text layout notes).
- [x] 3.3 Update `docs/user-stories/epic-4-analytics/US-13.md` and `US-14.md` (replace broken wireframe links with plain text layout notes).

## Phase 4: Verification and Validation
- [x] 4.1 Verify with grep that no markdown file contains references to `pennyAdjustment.ts` or `.test.ts`.
- [x] 4.2 Verify with grep that no markdown file contains `POST /api/v1/contacts/sync` or the `/contacts/sync` endpoint.
- [x] 4.3 Verify that no markdown file contains broken links to `.png` files under the non-existent `docs/wireframes/` directory.
- [x] 4.4 Verify that `PRD-Perplexity.md` is deleted and that no generic task IDs `T-01` to `T-05` exist in documentation.
