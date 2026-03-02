# Changelog

All notable changes to this project will be documented in this file.

---

## [1.4.9] - 2026-03-02

### Added
- Wiki import failure visibility and recovery:
  - Skills that fail wiki method import now show `[DATA ERR]`
  - Skills header now shows active data error count
  - Failed skill buttons include error/next-retry tooltip
  - Clicking a failed skill triggers an immediate retry
  - Automatic background retry with exponential backoff

### Changed
- Method data source migration:
  - `.skill` files are now treated as boost/config sources
  - Method rows are sourced from wiki module imports for enabled skills
- Methods tabs and sorting:
  - Removed synthetic `All` tab
  - Default method sort is now `Req Lvl` across method tabs
- Boost targeting:
  - Added `Apply-Type` and `Apply-Action` support for boosts
  - Targeted boosts now apply per matching method row only
  - Boost factor display shows `Varies by method` when targeted boosts are active
- Wiki parsing and import reliability:
  - Improved train-method parsing for `if/elseif` branch modules
  - Added support for branch-local `methods = { ... }` tables
  - Added support for local table returns (`return <TableName>`)
  - Added Lua comment stripping and comma-number parsing to prevent dropped imports

### Skill-Specific
- Invention:
  - Wiki links for `Disassembling`/`Siphoning` method types now open:
    - `https://runescape.wiki/w/Calculator:Equipment_experience_by_tier`
- Slayer:
  - Imported methods now use `requiredLevel = 1` for row coloring
  - Creature level is appended to method names as `(CB: N)`
- Divination:
  - Added boon boost entries with targeted application to matching conversion methods

---

## [1.4.8] - 2026-03-02

### Boosts
- Added `XP-Flat` support:
  - Boosts can now add a flat XP amount per action (in addition to percent/multiplier)
- Added boost conflict schema for gear logic:
  - `Slots`
  - `Set-Name`
  - `Set-Pieces`
  - `Set-Bonus`
- Added slot-based auto-swap behavior:
  - Enabling a conflicting slot boost now unticks competing boosts instead of disabling them
- Added set fallback behavior:
  - If a full set bonus is active and a conflicting piece is enabled, set bonus is removed and compatible set pieces are restored automatically
- Added automatic set promotion:
  - When all required set slots are covered, set bonus auto-activates and piece boosts are unticked
  - Includes a bottom notification when auto-activation occurs
- Improved boost list UX:
  - Boost panel now preserves scroll position after toggles

---

## [1.4.7] - 2026-03-02

### Changed
- Boosts panel behavior:
  - Boost entries now scroll inside the Boosts pane
  - Prevents boost content from overflowing past the panel bounds

### Skills
- Cooking:
  - Cooking methods and boosts are now fully implemented
  - Cooking content is now available for use in the live app

---

## [1.4.6] - 2026-03-02

### Added
- Methods `All` view improvements:
  - Added fixed `All` tab at the end of method types
  - Includes all methods in one combined list
  - Defaults to `Req Lvl` sort when no other method sort is active
- Methods tab-order controls:
  - Added `Reset Tabs` button in the Methods header
  - Restores method tab order to default skill-file type order

### Changed
- Methods panel layout:
  - Moved `Clear Filters` and `Reset Tabs` into the Methods header (right side)
  - Prevented controls from pushing the method list down
- Topbar layout and branding:
  - Improved left/center/right topbar alignment and responsive stretching
  - Updated app branding visuals with larger icon sizing
  - Refreshed logo and favicon with a no-text emblem and subtle accent color
- Virtual-level and goal sync behavior:
  - Restored and hardened conversion logic when turning virtual levels off
  - Goal End now reliably converts Level targets above real cap to XP while preserving target XP
  - Goal Start now applies the same Level-to-XP preservation behavior
  - Re-render flow now keeps Current header and goal statistics synchronized after toggle changes

---

## [1.4.5] - 2026-03-01

### Added
- Methods `All` tab:
  - Added at the end of each skill's method type tabs
  - Combines all method entries into one list
  - Defaults to `Req Lvl` sorting for quick global review
- Methods tab-order reset:
  - Added `Reset Tabs` button in the Methods header
  - Restores method type tabs to default skill-file order

### Changed
- Methods controls layout:
  - Moved `Clear Filters` and `Reset Tabs` into the Methods header (right side)
  - Prevents the controls row from pushing the method list downward

---

## [1.4.4] - 2026-03-01

### Changed
- Top bar layout behavior:
  - Restored centered Profile section
  - Left controls now stretch dynamically from the logo toward center
  - Right controls now stretch dynamically toward the right edge
  - Improved alignment consistency across responsive breakpoints

---

## [1.4.3] - 2026-03-01

### Added
- Wiki-style hover preview cards in the Methods table:
  - Follow the mouse cursor
  - Show item image and description
  - Provide instant in-app information without leaving the calculator
- Option to disable bottom notifications:
  - Toggle available in footer
  - Saved per profile

### Changed
- Improved goal behavior and flow:
  - Goal tracking now initializes with smarter defaults
  - Methods panel updates dynamically based on goal type (level, goal, or MAX)
  - Reaching 200M XP now switches UI into a clear MAX state
- Improved virtual level handling:
  - Goal targets automatically adjust when switching between real and virtual levels
- Improved goal input experience:
  - Fields no longer override while typing
  - Corrections apply only after finishing input
- Improved notifications:
  - Multiple notifications now queue instead of replacing each other
  - Display timing improved for readability
- Improved layout:
  - Better spacing and sizing for the skills panel on desktop

---

## [1.4.2] - 2026-03-01

### Added
- MAX goal mode:
  - Set goals directly to 200,000,000 XP
- Bottom notification system:
  - Displays important system updates and errors
- Notification queue:
  - Multiple messages now appear in sequence instead of being replaced
- Option to disable notifications per profile

### Changed
- Goal defaults improved:
  - Goal Start defaults to current XP
  - Goal End defaults to next level or MAX when appropriate
- Methods panel improvements:
  - Displays progress toward next level, goal, or MAX
  - Automatically adjusts based on goal mode
- MAX state improvements:
  - Skills now clearly show MAX at 200M XP
  - Progress bars behave correctly beyond level cap
- Virtual level consistency:
  - All displays now correctly reflect virtual vs real levels
- UI behavior improvements:
  - Selected tab (Current + Boosts / Goals) now persists
  - Removed forced tab switching
- Input improvements:
  - Goal fields no longer interrupt typing
- Improved save handling feedback:
  - Only successful saves are reported
  - Errors are surfaced to the user
- Improved layout:
  - Better spacing and readability in the skills panel

---

## [1.4.1] - 2026-03-01

### Added
- RuneScape-style cursor system:
  - Different cursor icons for actions (click, info, invalid, drag, etc.)
  - Visual feedback based on interaction type

### Changed
- Simplified input workflow:
  - Current input is now XP-focused
  - Goal inputs dynamically adjust based on selected mode (Level / XP)
- Improved section headers:
  - Current shows level directly in the title
  - Methods shows XP remaining to target
- Methods calculations improved:
  - Uses next level when not tracking a goal
  - Uses goal when goal tracking is enabled
- Improved disabled input styling for clarity

---

## [1.4.0] - 2026-03-01

### Added
- Locked skill support:
  - Locked skills are visually distinct and cannot be selected
- Responsive layout modes:
  - Desktop, tablet, and mobile layouts
  - Dynamic column adjustments for skill grid
- Custom scrollable panels:
  - Methods, skills, and details now scroll independently

### Changed
- Improved Methods panel:
  - Fixed header with scrolling content
  - Better alignment and readability
- Improved table layout:
  - Better column sizing and overflow handling
- Improved mobile usability:
  - Compact layouts for smaller screens
  - Better spacing and navigation

---

## [1.3.1] - 2026-02-28

### Changed
- Improved animations:
  - Smooth skill selection transitions
  - Cleaner visual feedback when selecting skills
- Improved layout spacing:
  - More consistent panel alignment
- Reduced unnecessary motion:
  - Removed bounce effects for cleaner UI

---

## [1.3.0] - 2026-02-28

### Added
- Instructions panel:
  - Built-in help with formatted content
- Improved UI visuals:
  - Better panel separation and depth
  - Enhanced selected-skill highlighting
- Updated progress bars:
  - Cleaner, more modern appearance

### Changed
- Improved controls:
  - Better checkbox and input styling
  - Cleaner hover and focus behavior
- Improved Methods table:
  - Better contrast and readability
  - Clearer row states and highlighting

---

## [1.2.0] - 2026-02-28

### Added
- Changelog viewer inside the app
- Footer with version info and links
- Reset controls for data and skill settings

### Changed
- Version now opens in a popup instead of shifting layout
- Improved import reliability and error feedback

---

## [1.1.0] - 2026-02-28

### Added
- Data export/import system
- Drag-and-drop skill reordering
- Save status indicator
- Validation feedback for data issues
- Built-in changelog viewer

---

## [1.0.0] - 2026-02-28

### Added
- RuneScape Skill Calculator (web version)
- Profile system
- Goal tracking
- Methods table with XP calculations
- Boost support
- RS3 high-score import
