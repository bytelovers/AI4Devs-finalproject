# Exploration: spliteat-design-olive-amber

This exploration defines the visual redesign of the SplitEat mobile application screens in Stitch. The goal is to migrate from the high-contrast, glowing "Gastro-Chroma Neon Noir" aesthetic to a sophisticated, warm dining palette of Sage/Olive Green (`#5F8575`) and Warm Amber (`#C88A36`), while completely removing neon/glow effects. We establish the revised prompt guidelines for generating both Soft Dark and Light Mode versions of the 4 core screens using the "Sage & Slate Utility" design system (`assets/606dc423e09a4fe28b7febcadbdfd73a`).

---

## 1. Aesthetic Shift Overview

| Attribute | Old Visual Language (Neon Noir) | New Visual Language (Calm Utility) |
|---|---|---|
| **Base Background** | Midnight Obsidian (`#030708`) | Soft Slate (`#111415`) / Soft Cream (`#F4F6F5`) |
| **Primary Accent** | Neon Pistachio (`#9EFF33`) | Sage/Olive Green (`#5F8575`) |
| **Secondary Accent** | Volcanic Coral (`#FF5733`) | Warm Amber (`#C88A36`) |
| **Tertiary Accent** | Holographic Blue (`#33D4FF`) | Slate Grey (`#8B928E` / `#414844`) |
| **Shadows & Elevation** | Glowing radial lights, drop shadow glows | Tonal surfaces, backdrop blur, standard flat shadows |
| **Borders** | Borderless or neon glowing dividers | 1px clean strokes, glassmorphic outlines, zero glow |
| **Gamified Elements** | High-energy neon animations, laser lines | Sophisticated organic rotations, flat vector shapes |

---

## 2. Analysis of Source Screens & Neon/Glow Removal

We analyzed the original screens from project `projects/2271552663752997368`:

1. **OCR Scanner (`45fd90cbaaec49edb50860615e8a04ee` & `aa4bbe32689f42f0b5e04649debc66ee`)**:
   - *Neon Traces*: Viewfinder corners are `#A4E06A` (Neon Green); scan line has `shadow-[0_0_8px_rgba(164,224,106,0.3)]`; shimmer text shifts to `#a4e06a`; main capture button has `shadow-[0_0_25px_rgba(155,251,47,0.4)]`.
   - *Removal Plan*: Viewfinder corners become solid `#5F8575`. Scan line is a flat Sage Green line with `shadow-none`. Shimmer animation is removed or simplified to a clean text opacity fade. Capture button has a standard flat dark or light border, with zero neon shadow.

2. **Item Allocation (`d21fbe1e02784008b4e0149e548a7dc6` & `68a3c29c1cb54105a11fabe0220ab4a0`)**:
   - *Neon Traces*: Selected items use `.coral-active` (`#FF8469`); badge allocations use holographic blue (`#66D5F2`); "CONFIRM" button uses a secondary neon shadow.
   - *Removal Plan*: Active selected items use a solid background of Sage Green (`#5F8575`) with white text. badge allocations use muted slate grey chips. The "CONFIRM" button is flat Sage Green with a standard soft shadow.

3. **Billing HUD (`77d4417fd0c146de9d5bd188274d63ce` & `bcbcb62018fe4bf1b293ecdcc6e94601`)**:
   - *Neon Traces*: Active participant card has an active glowing ring; total pay value is neon blue (`#66D5F2`); "Mostrar Bizum QR" triggers a neon blue glow modal with a neon blue QR code image.
   - *Removal Plan*: Active participant card uses a solid, non-glowing Sage Green border stroke. Total value is colored in Warm Amber (`#C88A36`). Bizum QR modal displays a standard, high-contrast, black-and-white flat QR code on a solid white square card.

4. **La Ruleta del Pagador (`a3dfc23db16240658c454a21c8394f8c` & `12b8e30288334839acc2466f8744fc33`)**:
   - *Neon Traces*: Slices divider strokes are neon green, coral, and blue; center button has `glow-coral` shadow; winning modal has a neon pistachio border glow.
   - *Removal Plan*: Wheel slices are divided by clean white or slate strokes. Center button has zero box-shadow glow. Winning modal is a clean slate card with a standard grey shadow.

---

## 3. Revised Stitch Prompts (8 Screens)

### 1. Scan Receipt - Soft Dark Mode
```text
System: React + Tailwind CSS. Design System: Sage & Slate Utility.
Prompt: Create a mobile-first OCR scanner view for SplitEat in Soft Dark Mode.
- Base background is a soft dark slate (#111415).
- Overlay a semi-transparent black mask with a central rectangular cutout representing the ticket scan area.
- Add solid, thin corner brackets colored in Sage Green (#5F8575) around the viewfinder cutout. No glowing effects.
- Animate a solid, thin, non-glowing Sage Green horizontal line moving vertically across the cutout.
- Include a floating bottom action dock using dark glassmorphism (surface color #111415 with backdrop-filter: blur(24px) and 1px top stroke border). It contains a gallery upload icon, a flashlight toggle, and a flat primary camera capture button in Sage Green (#5F8575) with white text and zero glowing shadow.
- Put clear Satoshi instructions at the top: "Encuadra el ticket de compra dentro del marco" in soft white, using Outfit for headers and Inter for descriptions.
```

### 2. Scan Receipt - Light Mode
```text
System: React + Tailwind CSS. Design System: Sage & Slate Utility.
Prompt: Create a mobile-first OCR scanner view for SplitEat in Light Mode.
- Base background is a soft light cream (#F4F6F5).
- Overlay a semi-transparent white mask (rgba(244,246,245,0.7)) with a central rectangular cutout.
- Add solid, thin corner brackets colored in Sage Green (#5F8575) around the viewfinder cutout. No glowing effects.
- Animate a solid, thin, non-glowing Sage Green horizontal line moving vertically across the cutout.
- Include a floating bottom action dock using light translucent glassmorphism (white base with backdrop-filter: blur(24px) and a thin grey border). It contains a gallery upload icon, a flashlight toggle, and a flat primary camera capture button in Sage Green (#5F8575) with white text and a standard soft grey drop shadow (no glow).
- Put clear instructions at the top: "Encuadra el ticket de compra dentro del marco" in deep charcoal (#1C201E), using Outfit for headers and Inter for descriptions.
```

### 3. Assign Items - Soft Dark Mode
```text
System: React + Tailwind CSS. Design System: Sage & Slate Utility.
Prompt: Create an interactive item-to-participant allocation screen for SplitEat in Soft Dark Mode.
- Base background is a soft dark slate (#111415).
- Layout: Top header displaying "Grand Total" in label-sm caps and a total amount (e.g. €284.50) in large Outfit font colored in Warm Amber (#C88A36).
- Scrollable middle container shows a receipt styled as a dark glass panel (backdrop-filter: blur(30px), surface border rgba(255,255,255,0.08)) displaying items with quantity, item description, and individual price in soft white.
- Highlight active selected items with a solid, non-glowing Sage Green (#5F8575) background and white text.
- Badges indicating allocation fractions (e.g., "2/4") are styled as flat, muted slate grey chips.
- Bottom dock: A horizontal list of circular avatar buttons for participants, with the active participant highlighted by a clean 2px Sage Green (#5F8575) border stroke (no glowing orbs). A flat "CONFIRM" action button in solid Sage Green (#5F8575) with white text sits next to them.
```

### 4. Assign Items - Light Mode
```text
System: React + Tailwind CSS. Design System: Sage & Slate Utility.
Prompt: Create an interactive item-to-participant allocation screen for SplitEat in Light Mode.
- Base background is a soft light cream (#F4F6F5).
- Layout: Top header displaying "Grand Total" and a total amount (e.g. €284.50) in large Outfit font colored in Warm Amber (#C88A36).
- Scrollable middle container shows a receipt styled as a clean white panel with a very thin grey border (border-black/5) displaying items in deep charcoal (#1C201E).
- Highlight active selected items with a solid Sage Green (#5F8575) background and white text.
- Badges indicating allocation fractions (e.g., "2/4") are styled as flat chips in soft Sage Green (10% opacity Sage Green background with solid Sage Green text).
- Bottom dock: A horizontal list of circular avatar buttons for participants on a soft white translucent dock with a thin grey border. Active user is highlighted with a 2px Sage Green border stroke (no glow). A flat "CONFIRM" button in solid Sage Green (#5F8575) with white text sits next to them.
```

### 5. Waiter Dictation HUD - Soft Dark Mode
```text
System: React + Tailwind CSS. Design System: Sage & Slate Utility.
Prompt: Create a high-contrast billing read-out HUD for SplitEat in Soft Dark Mode.
- Base background is a soft dark slate (#111415).
- Visual layout: Carousel cards representing each participant. The active card displays the participant's avatar highlighted with a clean, flat 2px Sage Green (#5F8575) border (no active glow ring).
- Below the carousel, display "Carlos pagará:" in Outfit font, followed by a large total value "€27.50" in Warm Amber (#C88A36) (no blue neon).
- Display itemized lines (e.g., "2x Hamburguesas (€24.00), 1x Cerveza (€3.50)") on a dark glass card with clear text hierarchy (Outfit for titles, Inter for details).
- Include a prominent bottom button: "Mostrar Bizum QR" styled in dark glass with a Sage Green border.
- When clicked, display a modal dialog with a flat, high-contrast, black-and-white QR code on a solid white square card with a simple close button, clear of any neon styling.
```

### 6. Waiter Dictation HUD - Light Mode
```text
System: React + Tailwind CSS. Design System: Sage & Slate Utility.
Prompt: Create a high-contrast billing read-out HUD for SplitEat in Light Mode.
- Base background is a soft light cream (#F4F6F5).
- Visual layout: Carousel cards representing each participant. The active card has a clean 2px Sage Green (#5F8575) border highlight.
- Below the carousel, display "Carlos pagará:" in deep charcoal, followed by the total value "€27.50" in large Warm Amber (#C88A36) Outfit typography.
- Itemized breakdown lines are displayed on a solid white card with deep charcoal text and a very subtle drop shadow.
- Include a prominent bottom button: "Mostrar Bizum QR" styled with a solid Sage Green background and white text.
- Bizum QR modal displays a flat, high-contrast black-and-white QR code on a solid white square card with a simple close button, clear of any neon styling.
```

### 7. La Ruleta del Pagador - Soft Dark Mode
```text
System: React + Tailwind CSS. Design System: Sage & Slate Utility.
Prompt: Create a gamified splitting wheel component for SplitEat in Soft Dark Mode.
- Base background is a soft dark slate (#111415).
- Visual layout: Center a large spinning wheel component. Wheel slices are styled in slate and dark olive, separated by clean, thin white lines (no glowing neon dividers).
- The pointer arrow at the top of the wheel is styled in Warm Amber (#C88A36).
- In the center of the wheel, place a prominent circular "GIRAR" button styled with a solid Warm Amber (#C88A36) background and white text (no glow shadows).
- No glowing trails or laser line animations.
- Upon spin completion, trigger a modal overlay styled as a clean dark glass card with a standard grey shadow (no glowing neon pistachio frames), announcing the payer (e.g., "¡Pagas Tú! Marta").
```

### 8. La Ruleta del Pagador - Light Mode
```text
System: React + Tailwind CSS. Design System: Sage & Slate Utility.
Prompt: Create a gamified splitting wheel component for SplitEat in Light Mode.
- Base background is a soft light cream (#F4F6F5).
- Visual layout: Center a large spinning wheel component. Slices are colored in soft pastel green and warm amber tones, separated by clean, thin white or grey lines.
- The pointer arrow at the top is styled in Warm Amber (#C88A36).
- Center circular "GIRAR" button is styled with a solid Warm Amber (#C88A36) background and white text (no glow).
- Upon spin completion, trigger a modal overlay styled as a clean white card with a standard soft drop shadow, announcing the payer (e.g., "¡Pagas Tú! Marta").
```

---

## 4. Implementation & Verification Plan

### Implementation Steps
1. **Design System Configuration**: Verify that `assets/606dc423e09a4fe28b7febcadbdfd73a` is correctly applied to project `projects/13347196082764773274` using the StitchMCP tools.
2. **Screen Generation**: Run `generate_screen_from_text` for each of the 8 prompts in target project `projects/13347196082764773274`.
3. **Synchronize Frontend variables**: Ensure local `frontend/src/styles/variables.css` and `frontend/tailwind.config.ts` reflect the dining palette (Sage Green `#5F8575` and Warm Amber `#C88A36`) and remove neon variables (`--pastel-coral`, `--pastel-blue`, etc.).

### Component Verification Checks
- **Class Check**: Assert that no CSS class name contains `glow`, `neon`, or active glowing shadows.
- **Contrast Check**: Check contrast ratios for text on Sage Green and Warm Amber backgrounds.
- **Mode Matching**: Verify that the generated HTML has the appropriate `class="dark"` for Soft Dark Mode and lacks it or has `class="light"` for Light Mode.
