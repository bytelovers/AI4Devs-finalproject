# Design: Fix Docs Inconsistencies

## Technical Approach

We will standardize and align all documentation inside the `docs/` folder to resolve technical design inconsistencies, obsolete endpoints, naming anomalies, PRD duplications, plan task IDs, and broken wireframe image links.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Contact Sync Strategy** | **API Sync Endpoint**: Requires server-side routing, controllers, security logic.<br>**Firestore Direct SDK**: Direct sync from client. Fast, uses Firebase Security Rules. | **Firestore Direct SDK**: Document contact/group sync exclusively via Firestore Direct SDK. Delete all `/api/v1/contacts/sync` endpoint contracts. |
| **Math Utility Naming** | **pennyAdjustment.ts**: Explicit but narrow scope.<br>**mathHelper.ts**: Reusable, accommodates rounding, penny adjustment, and tip calculations. | **mathHelper.ts**: Standardize helper utility to `mathHelper.ts` and test file to `mathHelper.test.ts`. Update all markdown docs. |
| **PRD Consolidation** | **Multi-file PRD**: Fragmented information.<br>**Single Consolidated PRD**: Unified source of truth. | **Consolidate in PRD.md**: Merge strategic context from `PRD-Perplexity.md` into `PRD.md` and delete `PRD-Perplexity.md`. |
| **Backlog Task IDs** | **T-0x Naming**: Disconnect from backlog task IDs.<br>**TSK-x.y Naming**: Strict hierarchical mapping to user story files. | **TSK-x.y Naming**: Map and replace high-level `T-01` to `T-05` IDs with hierarchical backlog IDs `TSK-x.y` in the technical and branching plans. |
| **Wireframe Reference** | **Broken Image Links**: References non-existent png assets.<br>**Plain Text Design Notes**: Inline descriptions/notes. | **Plain Text Design Notes**: Replace broken wireframe links in user stories with inline text notes describing UI layouts. |

## Data Flow

The contact sync data flow bypasses any backend API layer, saving directly from the local Dexie.js database through the SyncManager to Cloud Firestore:

```text
[Dexie.js (Local DB)] ──(SyncManager)──> [Firestore Direct SDK] ──(Security Rules Verification)──> [Cloud Firestore]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `docs/api/integration_contracts.md` | Modify | Remove references to `/api/v1/contacts/sync` endpoint contract. |
| `docs/prd/PRD.md` | Modify | Consolidate missing strategic and compliance details from `PRD-Perplexity.md`. |
| `docs/prd/PRD-Perplexity.md` | Delete | Remove duplicated PRD file to avoid conflicts. |
| `docs/tech-lead/technical_plan.md` | Modify | Replace `T-01` to `T-05` with `TSK-x.y` and update dependencies/branching strategy references. |
| `docs/tech-lead/deployment_branching.md` | Modify | Replace `T-03` references with the actual hierarchical task IDs (e.g., `TSK-1.3`, `TSK-1.4`, `TSK-3.5`). |
| `docs/qa/testing_strategy.md` | Modify | Rename `pennyAdjustment.ts` references to `mathHelper.ts`. |
| `docs/user-stories/epic-2-advanced/US-04.md` | Modify | Rename `pennyAdjustment.ts` references to `mathHelper.ts` and replace wireframe link with text note. |
| `docs/user-stories/epic-3-cloud/US-11.md` | Modify | Remove `/api/v1/contacts/sync` reference, align synchronization to Firestore Direct SDK, and replace wireframe link with text note. |
| `docs/user-stories/epic-2-advanced/US-05.md` to `US-09.md` | Modify | Replace broken wireframe links with plain text design notes. |
| `docs/user-stories/epic-3-cloud/US-10.md`, `US-12.md` | Modify | Replace broken wireframe links with plain text design notes. |
| `docs/user-stories/epic-4-analytics/US-13.md`, `US-14.md` | Modify | Replace broken wireframe links with plain text design notes. |

## Interfaces / Contracts

### Firestore Contact Document Schema
```typescript
interface FirestoreContact {
  id: string;      // UUID v4
  name: string;    // Contact Display Name
  phone: string;   // Verified phone number
  updatedAt: number; // UTC Epoch timestamp
}

interface FirestoreGroup {
  id: string;      // UUID v4
  name: string;    // Group Display Name
  memberIds: string[]; // Reference to FirestoreContact IDs
  updatedAt: number;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Static Audit | Inconsistencies & broken links | Custom static audit script using `grep` to verify absence of: `pennyAdjustment.ts`, `T-01` to `T-05`, `/api/v1/contacts/sync`, and `docs/wireframes/` file references in Markdown files. Ensure no broken links exist. |

## Migration / Rollout

No data migration required as we are aligning developer/product documentation only.

## Open Questions

None. All decisions have been resolved and aligned with user specifications.
