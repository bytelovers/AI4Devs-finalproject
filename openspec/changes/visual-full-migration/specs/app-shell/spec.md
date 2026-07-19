# Spec Delta: app-shell

## MODIFIED Requirements

### Requirement: Mobile-first layout

The application shell MUST render as a mobile-first layout constrained to max-w-md mx-auto, eliminating the desktop sidebar and adopting framer-motion AnimatePresence for route transitions.

#### Scenario: Mobile viewport constraint

- **WHEN** the AppShell renders on any viewport
- **THEN** the main content container MUST have `max-w-md mx-auto` class
- **AND** the top-level wrapper MUST have `min-h-dvh bg-background`
- **AND** safe-area insets MUST be applied via `safe-top` and `safe-bottom` classes on the main and nav regions
- **AND** NO desktop sidebar or responsive `lg:` breakpoints SHALL be rendered

(Previously: dual desktop sidebar + mobile NavigationBar layout with `lg:pl-64` breakpoints)

#### Scenario: Page transitions with framer-motion

- **WHEN** a route transition begins
- **THEN** the main content area MUST wrap children in `AnimatePresence mode="wait"`
- **AND** each route MUST render via `motion.div` with:
  - `initial={{ opacity: 0, y: 8 }}`
  - `animate={{ opacity: 1, y: 0 }}`
  - `exit={{ opacity: 0, y: -8 }}`
  - `transition={{ duration: 0.2 }}`
- **AND** the motion.div MUST have `key={pathname}` from useLocation

(Previously: static children prop with no animation wrapper)
