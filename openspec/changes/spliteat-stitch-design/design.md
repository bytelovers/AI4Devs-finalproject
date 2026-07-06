# Design: spliteat-stitch-design

## Technical Approach

This design document establishes the "Gastro-Chroma Neon Noir" design system for SplitEat and defines the generation inputs for Stitch. The visual language uses an organic dark mode base with zero physical borders, relying on high-contrast neon accents, glassmorphic refraction, and radial glowing backlights to establish visual hierarchy.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Theme System** | **Tailwind Utility Classes**: Easy configuration, standardizes utility tokens.<br>**CSS Custom Properties**: Dynamic theme changes but lacks typescript autocomplete. | **Tailwind Extension**: Map custom design system colors directly inside `tailwind.config.ts` using CSS variable mappings declared in `variables.css`. |
| **Styling Framework** | **Standard CSS/SASS**: Maximum control but verbose.<br>**Tailwind CSS + Glassmorphism Utilities**: Rapid implementation, highly consistent class-based styles. | **Tailwind CSS + Utility Layer**: Declare class presets like `.glass-card` and `.neon-glow` inside `global.css` to wrap the custom attributes. |
| **UI Scaffolding** | **Manual CSS coding**: High effort.<br>**Stitch Screen Generator**: Fast prototyping of layout structures using prompt-driven generation. | **Stitch prompts**: Define robust prompts incorporating visual guidelines to produce screen mockups (`ScanReceipt`, `AssignItems`, `WaiterDictationHUD`, `RuletaPagador`). |

## Data Flow

The generated views interact through React state and local context stores (Dexie.js / IndexedDB) to process state transformations:

```text
[ScanReceipt.tsx] ──(OCR Extraction)──> [AssignItems.tsx] ──(Participant Allocs)──> [WaiterDictationHUD.tsx / RuletaPagador.tsx]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/styles/variables.css` | Modify | Define custom CSS variables for the color palette, glassmorphism filters, and radial glow parameters. |
| `frontend/tailwind.config.ts` | Modify | Extend tailwind colors and font families (`Outfit` and `Satoshi`/`Inter`) to match style guide. |
| `frontend/src/views/ScanReceipt.tsx` | Create | Camera viewfinder view with camera overlay mask and horizontal scan line. |
| `frontend/src/views/AssignItems.tsx` | Create | Scrollable glassmorphic receipt sheet showing item totals and clickable Split-Orbs. |
| `frontend/src/views/WaiterDictationHUD.tsx` | Create | Large text readout deck for sharing individual breakdown totals and generating QR codes. |
| `frontend/src/views/RuletaPagador.tsx` | Create | Gamified canvas/css component showing the neon splitting wheel. |

## Interfaces / Contracts

```typescript
export interface GastroChromaTheme {
  colors: {
    base: '#030708';          // Midnight Obsidian
    wasabi: '#9EFF33';        // Neon Pistachio (Energy, food, main CTAs)
    coral: '#FF5733';         // Volcanic Coral (Hot meals, splitting events)
    holoBlue: '#33D4FF';      // Holographic Blue (Precise math, QR overlay, balances)
  };
  typography: {
    display: 'Outfit, sans-serif';
    body: 'Satoshi, Inter, sans-serif';
  };
}
```

## Stitch Screen Prompts

### Base Design System Guidelines
Apply the following styles system-wide:
- **Base Background**: `#030708` (Midnight Obsidian).
- **Zero Borders**: Use tonal gradients, drop-shadow glow overlays, or backdrop blur `backdrop-filter: blur(16px)` instead of borders.
- **Card Containers**: Class `.glass-card` (semi-transparent black with light white specular highlight `rgba(255,255,255,0.03)`).
- **Typography**: Outfit for massive displays and headers; Satoshi/Inter for tables, numbers, and descriptive text.

### 1. Scan Receipt (`ScanReceipt.tsx`)
```text
System: React + Tailwind CSS.
Prompt: Create a mobile-first OCR scanner view for SplitEat.
- Use a full-screen camera viewfinder preview. Overlay a dark semi-transparent mask with a center rectangular cutout representing the ticket scan area.
- Add blinking corner brackets colored in Neon Pistachio (#9EFF33) around the cutout.
- Animate a horizontal glowing wasabi green laser line moving vertically across the cutout.
- Include a floating bottom action dock containing a glassmorphic gallery upload button and flashlight toggle.
- Put clear Satoshi instructions at the top: "Encuadra el ticket de compra dentro del marco".
```

### 2. Assign Items (`AssignItems.tsx`)
```text
System: React + Tailwind CSS.
Prompt: Create an interactive item-to-participant allocation screen.
- Layout: Top header displaying total bill amount, scrollable middle sheet, bottom persistent dock.
- Middle sheet: A glassmorphic white receipt container (#030708 background with translucent white blur overlay) displaying items with quantity, item description, and individual price.
- Highlight active items with a glowing Volcanic Coral (#FF5733) shadow.
- Bottom dock: A horizontal list of circular avatar buttons ("Split-Orbs") for comensales (e.g. "Tú", "Ana", "Carlos"), each with a distinct soft radial backlight.
- Display mathematical breakdown fractions (e.g., "1/2", "1/4") next to allocated items in Holographic Blue (#33D4FF) badges.
```

### 3. Waiter Dictation HUD (`WaiterDictationHUD.tsx`)
```text
System: React + Tailwind CSS.
Prompt: Create a high-contrast billing read-out HUD for SplitEat.
- Designed for low-light restaurant environments. Extremely large, legible typography (Outfit for names, Satoshi for breakdown list).
- Visual layout: Carousel cards representing each participant. Active card displays "Carlos pagará:" in huge font, followed by itemized lines: "2x Hamburguesas (€24.00), 1x Cerveza (€3.50)" and a large Total (€27.50) in Holographic Blue.
- Include a large glassmorphic overlay for a "Mostrar Bizum QR" button. When clicked, display a modal dialog with a glowing neon blue QR code and a single tap action to copy payment link.
```

### 4. La Ruleta del Pagador (`RuletaPagador.tsx`)
```text
System: React + Tailwind CSS.
Prompt: Create a gamified splitting wheel component.
- Center a large 3D-like spinning wheel canvas. Slices are colored obsidian and framed by glowing neon dividers in Pistachio, Volcanic Coral, and Holographic Blue.
- In the center of the wheel, place a prominent circular "GIRAR" button that glows with Volcanic Coral accent.
- Animate a neon trail highlight revolving around the rim during spin state.
- Upon completion, trigger a modal overlay with confetti particle effects announcing the payer (e.g., "¡Pagas Tú!").
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Theme resolution | Assert tailwind theme overrides match values declared in `variables.css`. |
| Component | Visual rendering | Test CSS class assertions (`glass-card`, text contrast) with Vitest. |

## Migration / Rollout
No database schema changes required. Standard frontend deployment to PWA target.

## Open Questions
- None.
