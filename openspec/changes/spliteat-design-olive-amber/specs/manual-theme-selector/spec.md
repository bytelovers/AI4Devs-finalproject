# Delta Spec: manual-theme-selector

## ADDED Requirements

### Theme Persistence and Loading
The system MUST support manual and system-based theme selection that persists across user sessions.

#### Scenario: First-time launch fallback to system theme
Given a user accesses the SplitEat application for the first time
When no theme preference is stored in `localStorage`
Then the system MUST detect the operating system theme using the `prefers-color-scheme` query
And the system MUST apply the detected theme (Light or Dark)
And the theme selector in the navigation drawer MUST select and display "System".

#### Scenario: User selects Light Theme
Given the application is loaded
When the user opens the side navigation drawer
And the user selects "Light" from the theme selector
Then the system MUST immediately apply the Light theme
And the system MUST store the value `"light"` in `localStorage` under the key `"theme"`
And the theme selector MUST display "Light" as the active selection.

#### Scenario: User selects Dark Theme
Given the application is loaded
When the user opens the side navigation drawer
And the user selects "Dark" from the theme selector
Then the system MUST immediately apply the Dark theme
And the system MUST store the value `"dark"` in `localStorage` under the key `"theme"`
And the theme selector MUST display "Dark" as the active selection.

#### Scenario: User selects System Theme
Given a user has previously selected a manual theme ("Light" or "Dark")
When the user opens the side navigation drawer
And the user selects "System" from the theme selector
Then the system MUST immediately align the application theme with the operating system's current theme preference
And the system MUST store the value `"system"` in `localStorage` under the key `"theme"`
And the theme selector MUST display "System" as the active selection.

#### Scenario: Theme persistence on reload
Given the user has stored `"dark"` theme preference in `localStorage`
When the page is refreshed or reopened
Then the application MUST render in Dark mode immediately, preventing any flash of Light mode (FOUC)
And the theme selector MUST display "Dark" as the active selection.

#### Scenario: Operating system theme change in System Mode
Given the application theme selector is set to "System"
When the operating system's theme changes between Light and Dark
Then the application theme MUST automatically update to reflect the new system theme.

#### Scenario: Operating system theme change in Manual Mode
Given the application theme selector is set to a manual option ("Light" or "Dark")
When the operating system's theme changes
Then the application theme MUST remain unchanged
And MUST continue using the user's manual selection.
