# Design: spliteat-design-olive-amber

## Technical Approach

Migrate SplitEat visual theme to a warm dining palette (Sage Green `#5F8575`, Warm Amber `#C88A36`) and implement a manual theme selector (Light/Dark/System).
- **Tailwind configuration**: Configure theme colors mapping to CSS variables to support dynamic runtime themes.
- **Prevent FOUC**: Inject a synchronous script in `index.html` `<head>` checking `localStorage.theme` and `prefers-color-scheme` media query before DOM rendering.
- **Stitch Assets**: Build screens using Stitch Project ID `projects/13347196082764773274` and Design System Asset ID `assets/606dc423e09a4fe28b7febcadbdfd73a` ("Sage & Slate Utility").

## Architecture Decisions

| Option | Tradeoff | Decision |
|---|---|---|
| **Theme persistence & layout management**<br>1. Standard React state & `useEffect`<br>2. Head inline `<script>` + `useTheme` hook | Option 1: Causes Light/Dark flicker (FOUC) on load.<br>Option 2: Blocks rendering slightly, but prevents FOUC. | **Option 2**. Synchronous head script sets `.dark`/`.light` class, synchronized via `useTheme` hook. |
| **Visual migration (zero neon)**<br>1. Inline Tailwind override overrides.<br>2. CSS Variables mapped in theme config. | Option 1: Leads to duplicate Tailwind classes across files.<br>Option 2: Mappings are central, supports standard classNames. | **Option 2**. Update `variables.css` to link Sage/Amber colors to CSS custom vars. |
| **Inverted QR code in Dark Mode**<br>1. Pure CSS `filter: invert(1)`<br>2. Dynamic JS canvas generation | Option 1: Highly lightweight, zero bundle overhead.<br>Option 2: Increases JS payload and CPU usage. | **Option 1**. Apply `.dark` class wrapper filter `invert(1) hue-rotate(180deg)` on a standard B&W QR image. |
| **Winner pulse scale animation**<br>1. Framer Motion / JS animation library<br>2. Native CSS `@keyframes` | Option 1: Precise spring physics, increases package size.<br>Option 2: Native performance, zero extra dependencies. | **Option 2**. CSS `@keyframes winner-bounce` with `cubic-bezier(0.175, 0.885, 0.32, 1.275)` for 1.2x scale over 300ms. |

## Data Flow

```
[localStorage / prefers-color-scheme] 
         │ (synchronous check in index.html)
         ▼
[document.documentElement class dark/light]
         │
         ├──→ [CSS Variables / Tailwind Theme]
         │
         ▼
[useTheme Hook] ──→ [ThemeSelector Dropdown] ──→ [localStorage update]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/tailwind.config.ts` | Create | Map `sage` and `amber` colors to CSS variables. |
| `frontend/src/styles/variables.css` | Modify | Define dining colors `#5F8575`, `#C88A36`, backgrounds, remove neon variables. |
| `frontend/src/styles/global.css` | Modify | Strip neon animations/glow shadow definitions. Add winner scale transition classes. |
| `frontend/index.html` | Modify | Inject head inline script block to check theme synchronously and add class. |
| `frontend/src/hooks/useTheme.ts` | Create | Hook providing `theme` (light/dark/system) and `setTheme` with storage synchronization. |
| `frontend/src/components/ThemeSelector.tsx` | Create | Selector dropdown for Light/Dark/System, responsive, with ARIA tags. |
| `frontend/src/components/Drawer.tsx` | Modify | Place `ThemeSelector` component within the navigation drawer footer. |
| `frontend/src/views/OCRScanner.tsx` | Modify | Update viewfinder borders and scan line to flat Sage Green. Remove glows. |
| `frontend/src/views/Allocation.tsx` | Modify | Highlight selected rows with Sage tint, use flat slate badges and progress orbs. |
| `frontend/src/views/BillingHUD.tsx` | Modify | Muted active cards, Warm Amber totals, inverted QR modal. |
| `frontend/src/views/PayerWheel.tsx` | Modify | Flat segments, pointer to Amber, animate winner avatar with bounce. |

## Interfaces / Contracts

```typescript
type Theme = 'light' | 'dark' | 'system';

interface ThemeContextProps {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}
```

## Stitch Prompts (Target ID: `projects/13347196082764773274`)

- **Scan Receipt - Soft Dark**: Mobile-first OCR view, soft dark slate (`#111415`) bg, thin Sage Green (`#5F8575`) viewfinder corner brackets (no glow), flat Sage Green scan-line, dark glass bottom dock.
- **Scan Receipt - Light**: Mobile-first OCR view, light cream (`#F4F6F5`) bg, Sage Green (`#5F8575`) viewfinder corners, light translucent dock.
- **Assign Items - Soft Dark**: Allocation screen, `#111415` bg, Amber (`#C88A36`) totals, dark glass panel receipt list, active items highlighted in Sage Green (`#5F8575`), flat slate chips.
- **Assign Items - Light**: Allocation screen, `#F4F6F5` bg, Amber totals, white receipt panel, active items highlighted in Sage Green.
- **Waiter HUD - Soft Dark**: Billing HUD, active avatar highlighted with flat Sage Green (`#5F8575`) border (no glow), total in Warm Amber (`#C88A36`), Bizum QR modal with inverted white blocks on dark background.
- **Waiter HUD - Light**: Billing HUD, `#F4F6F5` bg, Sage Green active avatar border, total in Warm Amber, QR modal with black QR blocks on white card.
- **Payer Wheel - Soft Dark**: Spin wheel, slate/dark olive segments divided by clean thin white lines, Warm Amber center button and pointer, no glows. Winner overlay uses clean dark glass card.
- **Payer Wheel - Light**: Spin wheel, pastel green/warm amber slices, Amber center button/pointer. Winner overlay uses clean white card with grey shadow.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `useTheme` Hook | Test setting 'light', 'dark', 'system'. Mock `window.matchMedia` and `localStorage`. |
| Visual | Theme styles & A11y | Validate color contrast (AA) for text against Sage/Amber background. |
| E2E | FOUC and selection | Test theme persistence across reload and system preference changes. |

## Migration / Rollout

No database migrations. Front-end assets deployed atomically via classic SPA staging.
