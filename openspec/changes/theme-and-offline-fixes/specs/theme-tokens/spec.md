# Delta Specification: theme-tokens

## Purpose
Redefine the `--warning-foreground` and `--warning-bg` token halves in both the light (`:root`) and dark (`.dark`) blocks of `src/styles/global.css` so that warning text on warning surfaces meets WCAG 2.1 Level AA contrast. Today the two halves are swapped: light mode renders near-white ink on near-white amber, and dark mode renders near-black ink on dark amber — the canonical "black-on-black" readability bug observed on the assignment chip and the "Pesos no suman 100%" alert. Surface token names (`text-warning-foreground`, `bg-warning-bg`) are untouched; the 21 existing call-sites auto-improve with zero code edits elsewhere in the codebase.

### Verification
The new pairing MUST achieve the WCAG 2.1 AA contrast minimums as defined by the W3C:
- Normal text: contrast ratio ≥ 4.5:1.
- Large text (≥ 18pt regular or ≥ 14pt bold): contrast ratio ≥ 3:1.

Both the light and the dark pairings MUST clear the normal-text bar (≥ 4.5:1) so all warning usages — including small captions and unbolded helper copy — stay compliant. Non-warning semantic tokens (`primary`, `destructive`, `muted`, `accent`, `border`) MUST NOT be modified by this delta.

## MODIFIED Requirements

### REQ-warning-contrast-pair: Warning foreground/background contrast
The system SHALL define `--warning-foreground` and `--warning-bg` in both `:root` and `.dark` such that rendered warning text on a warning background meets WCAG 2.1 AA contrast (≥ 4.5:1 for normal text, ≥ 3:1 for large text). The two halves exchanged in the previous baseline MUST be restored to their conventional roles: `--warning-foreground` holds the high-contrast ink color that sits on top of `--warning-bg`'s tinted surface.
The system SHALL keep all other warning block entries (`--warning`, `--warning-border`), and all non-warning semantic tokens, unchanged.

#### Scenario: Light mode warning text is legible
Given the application is rendered in Light Mode
And the `:root` values are active
When a surface uses `bg-warning-bg` to draw its background
And a child element uses `text-warning-foreground` for its text
Then the rendered text-on-background contrast ratio MUST be ≥ 4.5:1 (AA normal text)
And the text MUST be visually legible without color inversion.

#### Scenario: Dark mode warning text is legible
Given the application is rendered in Dark Mode
And the `.dark` overrides are active
When a surface uses `bg-warning-bg` to draw its background
And a child element uses `text-warning-foreground` for its text
Then the rendered text-on-background contrast ratio MUST be ≥ 4.5:1 (AA normal text)
And the text MUST be visually legible without color inversion.

#### Scenario: Other warning tokens are untouched
Given the token bundle before this delta
When only `--warning-foreground` and `--warning-bg` are exchanged
Then `--warning` and `--warning-border` MUST keep their previous light and dark values
And no other semantic token (`--primary`, `--destructive`, `--muted`, `--accent`, `--border`, `--input`, `--ring`) MUST change value in either `:root` or `.dark`.

#### Scenario: Surface call-sites adopt the fix without code changes
Given 21 call-sites reference `text-warning-foreground` and `bg-warning-bg` via Tailwind utility classes
When the two token halves are exchanged
Then every existing call-site MUST render with the new legible pairing automatically
And the call-site code MUST NOT need to be edited to gain the contrast improvement.

#### Diff
Only the two halves of the warning pair are swapped in each theme block:
- `:root` (light): `--warning-foreground` and `--warning-bg` exchange values.
- `.dark`: `--warning-foreground` and `--warning-bg` exchange values.
- All other tokens in either block remain byte-identical to the baseline.
- `src/styles/global.css` line offsets for this change correspond to the light block around lines 67-68 and the dark block around lines 107-108; no stylistic or grouping change otherwise.
