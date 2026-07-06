# Spec: split-eat-visuals

## MODIFIED Requirements

### System-Wide Visual Theme Accent and Palette
The SplitEat UI visual identity is migrated from high-contrast neon noir to a sophisticated warm dining palette. Neon, glow, and shadow emission styling are completely deprecated.

#### Scenario: Apply Warm Dining Palette in Light Mode
Given the application theme is active in Light Mode
When rendering UI elements
Then the page background MUST be flat solid `#FFFFFF`
And receipt and card container panels MUST use flat background colors `#F4F6F5` or `#F8FAFC`
And primary visual accents MUST use Sage Green (`#5F8575`) or Warm Amber (`#C88A36`)
And all borders MUST be flat 1px solid styling
And there MUST be zero neon, glow, or light-emission styling applied to any elements.

#### Scenario: Apply Warm Dining Palette in Dark Mode
Given the application theme is active in Dark Mode
When rendering UI elements
Then the page background MUST be a deep charcoal flat solid color (e.g. `#121212`)
And receipt and card panels MUST be flat solid dark backgrounds with flat 1px solid borders
And primary visual accents MUST use Sage Green (`#5F8575`) or Warm Amber (`#C88A36`)
And there MUST be zero neon, glow, or light-emission styling applied to any elements.

### OCR Scanner Viewport, Buttons, and Scan-line
The OCR Scanner screen features a flat viewfinder overlay and scan-line with zero glowing effects.

#### Scenario: OCR Viewfinder Styling
Given the OCR Scanner view is active
When rendering the viewport overlay
Then the viewfinder corner brackets MUST be styled as flat 1px solid lines using Sage Green (`#5F8575`) or Warm Amber (`#C88A36`)
And the viewport borders MUST NOT contain any neon glows or outer box shadows.

#### Scenario: OCR Scan Line Animation
Given the OCR Scanner is scanning a receipt
When the scan-line animation is running
Then the scan-line MUST be rendered as a solid flat bar colored with Sage Green (`#5F8575`) or Warm Amber (`#C88A36`)
And the scan-line MUST NOT apply any blur, glow, or shadow filters.

#### Scenario: OCR Control Buttons
Given control buttons are displayed on the OCR Scanner screen
When rendered
Then the buttons MUST use flat solid backgrounds of Sage Green (`#5F8575`) or Warm Amber (`#C88A36`)
And MUST have 1px solid borders
And MUST NOT use any glowing outlines or neon text shadows.

### Item Allocation Visuals
The Item Allocation screen displays receipt items, selected rows, allocation badges, and progress orbs with flat colors and zero glow.

#### Scenario: Selected Item Rows
Given the Item Allocation view is open
When a receipt item row is selected by a user
Then the row background MUST be highlighted with a flat tint of Sage Green (`#5F8575`) or Warm Amber (`#C88A36`)
And the row MUST NOT render any neon borders, glowing shadow lines, or drop shadows.

#### Scenario: Allocation Badges
Given user allocation badges are displayed next to items
When rendered
Then the badges MUST use solid flat backgrounds using Sage Green (`#5F8575`) or Warm Amber (`#C88A36`)
And MUST have flat 1px solid borders
And MUST NOT display any glowing glow outlines.

#### Scenario: Allocation Progress Orbs
Given participant progress orbs (avatars) are displayed
When progress states change
Then the active or highlighted orbs MUST show highlight changes via flat solid borders or flat color badges
And the active or highlighted orbs MUST NOT emit any neon glow or outer box shadows.

### Waiter Dictation HUD
The Waiter Dictation HUD screen displays a horizontal participant carousel and a Bizum QR modal with dark mode optimization.

#### Scenario: Participant Carousel Active State
Given the Waiter Dictation HUD is active
When a participant is speaking or highlighted as active in the horizontal carousel
Then the participant avatar/container MUST be highlighted using a flat solid border of Sage Green (`#5F8575`) or Warm Amber (`#C88A36`)
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
