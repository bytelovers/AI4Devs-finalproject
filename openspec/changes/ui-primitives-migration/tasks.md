# Tasks: UI Primitives Migration

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~5400 (48 files, ~5400 additions) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | Single PR (size:exception) — all batches are vendor-diff copies with zero behavioral changes |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: size-exception
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| A | Primitives (Button, Alert, Badge, Separator, Skeleton, Input, Label, Textarea, Progress, AspectRatio, Avatar) | PR 1 | `npx tsc --noEmit` | N/A — migration only | `git revert <batch-commit>` |
| B | Forms (Checkbox, RadioGroup, Switch, Select, Slider, InputOTP, Toggle, ToggleGroup) | PR 1 | `npx tsc --noEmit` | N/A — migration only | `git revert <batch-commit>` |
| C | Dialogs (Dialog, AlertDialog, Sheet, Drawer, Popover, HoverCard, Tooltip) | PR 1 | `npx tsc --noEmit` | N/A — migration only | `git revert <batch-commit>` |
| D | Menus (DropdownMenu, ContextMenu, Menubar, NavigationMenu, Command) | PR 1 | `npx tsc --noEmit` | N/A — migration only | `git revert <batch-commit>` |
| E | Layout (Tabs, Accordion, Collapsible, Breadcrumb, Pagination, ResizablePanels, ScrollArea, Card) | PR 1 | `npx tsc --noEmit` | N/A — migration only | `git revert <batch-commit>` |
| F | Data (Table, Calendar, DatePicker, Carousel, Chart) | PR 1 | `npx tsc --noEmit` | N/A — migration only | `git revert <batch-commit>` |
| G | Feedback (Toast, Sonner, Toaster, Sidebar) | PR 1 | `npx tsc --noEmit` | N/A — migration only | `git revert <batch-commit>` |
| H | Forms advanced (Form) | PR 1 | `npx tsc --noEmit` | N/A — migration only | `git revert <batch-commit>` |

## Phase 1: Foundation

- [ ] 1.1 Create `src/lib/utils.ts` with `cn()` helper (clsx + tailwind-merge)
- [ ] 1.2 Verify `src/components/ui/` exists and is empty; create if missing
- [ ] 1.3 Verify all 27 Radix packages are in `package.json` dependencies

## Phase 2: Copy Components (Batch A — Primitives)

- [ ] 2.1 Copy 11 standalone primitives to `src/components/ui/`: Button, Alert, Badge, Separator, Skeleton, Input, Label, Textarea, Progress, AspectRatio, Avatar
- [ ] 2.2 Replace `next/navigation` imports with `react-router-dom` equivalents where present
- [ ] 2.3 Run `npx tsc --noEmit`, fix type errors, commit batch A

## Phase 3: Copy Components (Batch B — Forms)

- [ ] 3.1 Copy 8 form components: Checkbox, RadioGroup, Switch, Select, Slider, InputOTP, Toggle, ToggleGroup
- [ ] 3.2 Run `npx tsc --noEmit`, fix type errors, commit batch B

## Phase 4: Copy Components (Batch C — Dialogs)

- [ ] 4.1 Copy 7 dialog components: Dialog, AlertDialog, Sheet, Drawer, Popover, HoverCard, Tooltip
- [ ] 4.2 Run `npx tsc --noEmit`, fix type errors, commit batch C

## Phase 5: Copy Components (Batch D — Menus)

- [ ] 5.1 Copy 5 menu components: DropdownMenu, ContextMenu, Menubar, NavigationMenu, Command
- [ ] 5.2 Run `npx tsc --noEmit`, fix type errors, commit batch D

## Phase 6: Copy Components (Batch E — Layout)

- [ ] 6.1 Copy 8 layout components: Tabs, Accordion, Collapsible, Breadcrumb, Pagination, ResizablePanels, ScrollArea, Card
- [ ] 6.2 Run `npx tsc --noEmit`, fix type errors, commit batch E

## Phase 7: Copy Components (Batch F — Data)

- [ ] 7.1 Copy 5 data components: Table, Calendar, DatePicker, Carousel, Chart (Recharts wrapper)
- [ ] 7.2 Run `npx tsc --noEmit`, fix type errors, commit batch F

## Phase 8: Copy Components (Batch G — Feedback)

- [ ] 8.1 Copy 4 feedback components: Toast, Sonner, Toaster, Sidebar
- [ ] 8.2 Replace `next-themes` imports with project's `useTheme` hook
- [ ] 8.3 Run `npx tsc --noEmit`, fix type errors, commit batch G

## Phase 9: Copy Components (Batch H — Forms Advanced)

- [ ] 9.1 Copy Form component (react-hook-form wrapper)
- [ ] 9.2 Run `npx tsc --noEmit`, fix type errors, commit batch H

## Phase 10: Verification

- [ ] 10.1 Run `npm run build` — must pass with zero errors
- [ ] 10.2 Confirm all 48 `.tsx` files present in `src/components/ui/`
- [ ] 10.3 Quick smoke test: render each component group in a test page
