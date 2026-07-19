# Delta for split-eat-visuals

## MODIFIED Requirements

### System-Wide Visual Theme Accent and Palette
The SplitEat UI visual identity is migrated from high-contrast neon noir to a sophisticated warm dining palette. Neon, glow, and shadow emission styling are completely deprecated.

(Previously: Sage Green (#5F8575) / Warm Amber (#C88A36) hex → Emerald / Warm Amber oklch)

#### Scenario: Apply Emerald Dining Palette in Light Mode
Given the application theme is active in Light Mode
When rendering UI elements
Then the page background MUST be flat solid `oklch(0.99 0.002 240)`
And receipt and card container panels MUST use flat background color `oklch(1 0 0)`
And primary visual accents MUST use Emerald (`oklch(0.62 0.15 162)`) or Warm Amber (`oklch(0.75 0.16 80)`)
And all borders MUST be flat 1px solid styling using `oklch(0.92 0.005 240)`
And there MUST be zero neon, glow, or light-emission styling applied to any elements.

#### Scenario: Apply Emerald Dining Palette in Dark Mode
Given the application theme is active in Dark Mode
When rendering UI elements
Then the page background MUST be a deep charcoal flat solid color (e.g. `oklch(0.15 0.005 240)`)
And receipt and card panels MUST be flat solid dark backgrounds (`oklch(0.2 0.006 240)`) with flat 1px solid borders (`oklch(1 0 0 / 10%)`)
And primary visual accents MUST use Emerald (`oklch(0.72 0.16 162)`) or Warm Amber (`oklch(0.75 0.16 80)`)
And there MUST be zero neon, glow, or light-emission styling applied to any elements.

### OCR Scanner Viewport, Buttons, and Scan-line
The OCR Scanner screen features a flat viewfinder overlay and scan-line with zero glowing effects.

(Previously: Sage Green (#5F8575) / Warm Amber (#C88A36) hex → Emerald / Warm Amber oklch)

#### Scenario: OCR Viewfinder Styling
Given the OCR Scanner view is active
When rendering the viewport overlay
Then the viewfinder corner brackets MUST be styled as flat 1px solid lines using Emerald (`oklch(0.62 0.15 162)`) or Warm Amber (`oklch(0.75 0.16 80)`)
And the viewport borders MUST NOT contain any neon glows or outer box shadows.

#### Scenario: OCR Scan Line Animation
Given the OCR Scanner is scanning a receipt
When the scan-line animation is running
Then the scan-line MUST be rendered as a solid flat bar colored with Emerald (`oklch(0.62 0.15 162)`) or Warm Amber (`oklch(0.75 0.16 80)`)
And the scan-line MUST NOT apply any blur, glow, or shadow filters.

#### Scenario: OCR Control Buttons
Given control buttons are displayed on the OCR Scanner screen
When rendered
Then the buttons MUST use flat solid backgrounds of Emerald (`oklch(0.62 0.15 162)`) or Warm Amber (`oklch(0.75 0.16 80)`)
And MUST have 1px solid borders
And MUST NOT use any glowing outlines or neon text shadows.

### Item Allocation Visuals
The Item Allocation screen displays receipt items, selected rows, allocation badges, and progress orbs with flat colors and zero glow.

(Previously: Sage Green (#5F8575) / Warm Amber (#C88A36) hex → Emerald / Warm Amber oklch)

#### Scenario: Selected Item Rows
Given the Item Allocation view is open
When a receipt item row is selected by a user
Then the row background MUST be highlighted with a flat tint of Emerald (`oklch(0.62 0.15 162)`) or Warm Amber (`oklch(0.75 0.16 80)`)
And the row MUST NOT render any neon borders, glowing shadow lines, or drop shadows.

#### Scenario: Allocation Badges
Given user allocation badges are displayed next to items
When rendered
Then the badges MUST use solid flat backgrounds using Emerald (`oklch(0.62 0.15 162)`) or Warm Amber (`oklch(0.75 0.16 80)`)
And MUST have flat 1px solid borders
And MUST NOT display any glowing glow outlines.

#### Scenario: Allocation Progress Orbs
Given participant progress orbs (avatars) are displayed
When progress states change
Then the active or highlighted orbs MUST show highlight changes via flat solid borders or flat color badges
And the active or highlighted orbs MUST NOT emit any neon glow or outer box shadows.

### Waiter Dictation HUD
The Waiter Dictation HUD screen displays a horizontal participant carousel and a Bizum QR modal with dark mode optimization.

(Previously: Sage Green (#5F8575) / Warm Amber (#C88A36) hex → Emerald / Warm Amber oklch)

#### Scenario: Participant Carousel Active State
Given the Waiter Dictation HUD is active
When a participant is speaking or highlighted as active in the horizontal carousel
Then the participant avatar/container MUST be highlighted using a flat solid border of Emerald (`oklch(0.62 0.15 162)`) or Warm Amber (`oklch(0.75 0.16 80)`)
And the container MUST NOT have any neon text shadows, glow rings, or light emissions.

#### Scenario: Bizum QR Modal in Light Mode
Given the Bizum payment modal is open in Light Mode
When displaying the QR code
Then the QR code blocks MUST be rendered as high-contrast flat black on a white background
And the modal container MUST NOT display any neon highlights or glowing backgrounds.

#### Scenario: Bizum QR Modal in Dark Mode
Given the Bizum payment modal is open in Dark Mode
When displaying the QR code
Then the QR code blocks and container colors MUST be inverted to display white/light blocks on a dark background
And the modal container MUST NOT display any neon highlights, neon border glows, or outer shadows.

### Payer Wheel Selection and Animation
The Payer Wheel screen displays a spinner to select the winning payer with a custom bounce scale animation and zero glows.

(Previously: Sage Green (#5F8575) / Warm Amber (#C88A36) hex → Emerald / Warm Amber oklch)

#### Scenario: Payer Wheel Visuals
Given the Payer Wheel is active
When rendered in either theme mode
Then the wheel segments and border lines MUST be flat solid lines without glowing effects.

#### Scenario: Winner physical pulse scale animation
Given the Payer Wheel has finished spinning and selected a winner
When the winner's avatar is displayed as selected
Then the winner avatar element MUST trigger a scale animation to 1.2x size over exactly 300ms
And the animation MUST use a bounce effect (such as an elastic ease or spring physics)
And the avatar MUST NOT emit any neon, outer glow, halo, shadow pulse, or light emission effects.
