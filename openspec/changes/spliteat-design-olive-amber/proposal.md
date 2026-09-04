# Proposal: spliteat-design-olive-amber

## Intent
Migrate SplitEat visual language from high-contrast neon noir to a sophisticated warm dining palette (Sage Green `#5F8575` and Warm Amber `#C88A36`), introducing a manual theme selector (localStorage persisted) and strict theme layouts.

## Scope

### In Scope
- **Warm Dining Palette**: Apply Sage Green (`#5F8575`) and Warm Amber (`#C88A36`) to 4 core screens (OCR Scanner, Allocation, Billing HUD, Payer Wheel) for Dark/Light modes.
- **Light Mode Contrast**: Use `#FFFFFF` base background with subtle grey/cream (`#F4F6F5`/`#F8FAFC`) receipt and card container panels.
- **Manual Theme Selector**: Multi-option selector (Light, Dark, System) in the side navigation drawer, persisting to `localStorage`.
- **Flat QR Modal**: High-contrast flat QR modal (black/white in Light Mode, inverted colors in Dark Mode, zero neon glows).
- **Physical Scale Pulse**: Avatar scale animation on winning payer (scale to 1.2x over 300ms with a bounce effect, no neon/glow).

### Out of Scope
- Backend billing integrations.
- Real payment/Bizum API execution.

## Capabilities

### New Capabilities
- `manual-theme-selector`: Adds manual theme options (Light/Dark/System) in the navigation drawer, persisted in localStorage.

### Modified Capabilities
- `split-eat-visuals`: Redesign of OCR Scanner, Item Allocation, Billing HUD, and Payer Wheel screens.

## Approach
- Add Sage/Amber vars to Tailwind configuration and clear all legacy neon/glow CSS variables.
- Build theme provider hook integrating `localStorage` and `prefers-color-scheme` media query.
- Render theme selector component inside side navigation drawer.
- Modify the 4 screens to use clean borders (1px) and flat solid backgrounds (no glows).
- Add CSS `@keyframes` bounce animation scaling avatar to 1.2x over 300ms.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/tailwind.config.ts` | Modified | Add Olive/Amber colors, remove neon/glow colors. |
| `frontend/src/components/Drawer` | Modified | Add ThemeSelector dropdown in the side drawer. |
| `frontend/src/components/OCRScanner` | Modified | Redesign viewfinder corners & scan line. |
| `frontend/src/components/Allocation` | Modified | Update receipt glass styling and selection chips. |
| `frontend/src/components/BillingHUD` | Modified | Inverted QR code modal container and participant borders. |
| `frontend/src/components/PayerWheel` | Modified | Update wheel colors and add 1.2x scaling animation. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Inverted QR scanning failure | Low | Verify inverted QR layout with real mobile devices. |
| Contrast violations in Light Mode | Low | Audit using a11y color checkers for `#FFFFFF` and `#F4F6F5`. |

## Rollback Plan
Revert changes using git checkout.

## Dependencies
- StitchMCP screen design assets.

## Success Criteria
- [ ] Manual theme selection (Light/Dark/System) persists in `localStorage`.
- [ ] No neon/glow elements remain in target screens.
- [ ] Light Mode features `#FFFFFF` base background and cream/grey cards.
- [ ] Winner avatar scales to 1.2x over 300ms on stop.
- [ ] QR modal displays inverted QR blocks in Dark Mode.
