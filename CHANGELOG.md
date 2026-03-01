# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-03-01
### Added
- Skill availability lock support in `.skill` files via `Locked: true|false` (default interpreted as locked when omitted).
- Locked-skill visual state in the skills rail (`[LOCKED]` mode label + darkened tile styling).
- Center-panel mode tabs for smaller screens:
  - `Current + Boosts`
  - `Goals`
- Themed custom scrollbars for skills rail, center stack, and methods list areas.
- Responsive interface staging:
  - progressive skills-rail density shifts (`3` columns -> `2` -> `1`)
  - top horizontal skills scroller behavior for very small widths
  - compact mobile card behavior for center sections.

### Changed
- Locked-skill behavior:
  - locked skills are no longer selectable/usable in detail controls
  - locked skills remain reorderable via drag-and-drop
  - locked skills keep full-color progress bars while other tile regions are dimmed.
- Methods panel interaction/layout:
  - methods header is now fixed while only method rows scroll
  - header/body column alignment stabilized when scrollbar state changes
  - methods container height now stays constrained to panel bounds instead of expanding page height.
- Methods table readability and overflow handling:
  - tighter type-tab rail sizing
  - column width rebalance and stricter clipping for numeric columns
  - reduced `XP / Action` width with more space allocated to `Actions Needed`.
- Mobile/detail usability improvements:
  - center cards made independently scrollable where needed
  - goal sections arranged for better compact viewing on narrow screens
  - goal/current action buttons centered in compact layouts.

## [1.3.1] - 2026-02-28
### Changed
- Skill selection transitions now animate reliably without snapping by avoiding immediate skills-grid rebuild on skill click.
- Skill tile selected-state animation refined:
  - smooth fade between unselected brown and selected gold states
  - selected header title text now transitions to black for readability and back to light text when deselected
  - transition timing tuned to a visible, polished pace (`500ms`)
- Methods panel spacing/alignment adjusted so the card sits with consistent outer buffer like neighboring detail cards.
- Tab content motion reduced by removing vertical translate "bounce" during tab/content changes.

## [1.3.0] - 2026-02-28
### Added
- New `Instructions` popup view with markdown rendering and close/backdrop/`Esc` handling.
- Markdown upgrades for popup content:
  - nested list depth styling
  - lightweight code-block syntax highlighting
- Additional UI theming depth:
  - layered procedural texture overlays (CSS-only, no texture assets)
  - stronger section separation between Current/Boosts and Goal cards using a centered fade divider
  - refined top/bottom chrome framing to match main panel depth
- Skill tile selected-state emphasis:
  - gold selected header treatment
  - stronger border/glow for active skill visibility
- Satin-style progress bars (button bars and statistics bar) with cleaner, non-striped finish.

### Changed
- Virtual levels now default to `off` for new profile data.
- Profile selector styling refreshed with custom arrow and safer text padding.
- Control/theme consistency pass:
  - custom themed checkbox/radio controls
  - improved focus and hover treatment
  - browser-default bright highlight artifacts reduced where possible
- Skills panel fill behavior adjusted to remove lower hard color breaks while preserving button sizing.
- Methods area visual refresh focused on table readability:
  - stronger header depth/bevel treatment
  - improved row contrast and hover feedback
  - better non-highlighted row separation while preserving `can-now` and `can-goal` states.

## [1.2.0] - 2026-02-28
### Added
- Keep a Changelog source file loading for the `Version` view (`CHANGELOG.md`).
- Styled changelog modal popup with close, backdrop-click, and `Esc` handling.
- Grouped top-bar layout (data actions, profile/import, status).
- Bottom footer bar with `Version`, `Report Issue`, and app info text.
- Config key `window.REPORT_ISSUE_URL` for external bug-report links.
- `Reset All Data` control and `Reset Skill Settings` control in UI.
- Root MIT `LICENSE` file and footer creator/license text.

### Changed
- `Version` no longer shifts layout; it opens a modal instead.
- `Reset Skill Settings` now preserves current level/xp while resetting other skill settings.
- RS3 import fallback handling expanded and parser made more robust against line-format variance.
- Import error guidance now references both `RS3_IMPORT_PROXY` and `WIKI_API_PROXY`.
- Project structure converted to web-only root layout.

## [1.1.0] - 2026-02-28
### Added
- Data export and import backup flow with schema checks and import preview.
- Skill button drag-and-drop ordering with persisted per-profile layout.
- Reset actions for skill layout and per-skill settings.
- Save status indicator.
- Skill file validation panel for `.skill` parsing issues.
- Version/changelog popup accessible from the `Version` button.

### Changed
- Default skill type bucket is `Default`.
- Default skill order remains Attack, Constitution, Mining, Strength, and so on unless customized by drag-and-drop.
- New profile prompt now recommends using RuneScape username for high-score import.

## [1.0.0] - 2026-02-28
### Added
- Web port of the RuneScape Skill Calculator with profile support.
- Goal tracking, methods table, boosts, skill icons, and RS3 high-score import.
