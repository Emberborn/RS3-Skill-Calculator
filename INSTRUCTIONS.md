# RuneScape Skill Calculator
Plan training by skill, compare methods, and track progress to next level, custom goals, or `MAX`.

---

## Quick Start
1. Click `New` and create a profile named exactly after your in-game RuneScape name.
2. Click `Import RS3 High Scores` to load that character's XP into the profile.
3. Select a skill in the left panel.
4. Turn on `Goal tracking` if you want a custom target.
5. Use `Methods` to see action counts and best options.

High score import requires the active profile name to match the in-game name.

---

## Profiles
- `New`: create a profile.
- `Delete`: remove selected profile (`default` cannot be deleted).
- `Import RS3 High Scores`: pull current XP from official hiscores into the active profile.

Tip: use your RuneScape username as your profile name for quick importing.

---

## Skills Panel
- Click any skill to open it.
- Drag and drop skills to reorder.
- `Reset` in the skills header restores default order.

Skill tiles show:
- name + icon
- level status
- XP status
- mode (`[NEXT]`, `[GOAL]`, or `[LOCKED]`)
- progress bar

At `200,000,000 XP`, tiles switch to a large green `MAX` state.

---

## Virtual Levels
Use the `Virtual levels` toggle in the top bar:
- `On`: uses virtual caps (for display and level-based targeting).
- `Off`: uses real caps.

If a level-based goal exceeds real cap and virtual is turned off, the app automatically preserves the same target by switching that goal to `XP`.

---

## Current + Boosts
`Current` uses XP input directly.

From this panel you can:
- set current XP
- enable/disable `Goal tracking`
- reset per-skill settings
- configure boosts

If current XP hits `200,000,000`, goal tracking is automatically disabled.

---

## Goals
Enable `Goal tracking` to use goal cards.

### Goal Start
- choose `Level` or `XP`
- `Use Current as Goal Start` copies your current XP

### Goal End
- choose `Level`, `XP`, or `MAX`
- `MAX` means `200,000,000 XP`

When goal tracking is enabled, defaults are auto-seeded:
- Goal Start -> current XP
- Goal End -> next level (or `MAX` when already beyond active level cap XP)

---

## Methods
Methods update live from:
- current XP/level
- goal target
- enabled boosts

Header target text adapts automatically:
- `xp to level`
- `xp to goal`
- `xp to MAX`

Color meaning:
- Green: available now
- Yellow: available by your active target range

Sorting:
- Click column headers to cycle sort direction.
- Supports multi-sort (up to two active sorts).
- `Clear Filters` resets sorting.

Action links:
- Click action names to open RuneScape Wiki.
- Hover linked actions to see a small wiki preview card.

---

## Boosts
- Toggle boosts in the `Boosts` section.
- Effective XP/action and actions-needed recalculate immediately.

---

## Data & Safety
- `Export Data`: download backup snapshot.
- `Import Data`: load backup snapshot.
- `Reset All Data`: clear local saved data.

Notices:
- Bottom notices appear for automatic state adjustments and save issues.
- Use `disabled notification` in the footer to suppress them.

---

## Help
- `Version`: opens changelog.
- `Instructions`: opens this guide.
- `Report Issue`: opens issue/report link.
