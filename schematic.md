# Roman Numerals — Schematic (draft for review)

Status: **MVP revised after Jimmy's first look (`convo/convo v0.5.md`).** Tabs: Letters, Quiz, Build & Break, Add & Subtract, Fix It, Rules, Long Ago. Problem Lab and Explain & Playback are not built yet.

## 1. Purpose

A fast, visual, kid-friendly web tool that supports an ORCUCLA Roman numerals unit. Students already had one week on the topic. This tool covers the three things they must leave with:

1. **Memorize** the letters I to M and their values.
2. **Know the rules** (ORC Rules 1–5, wording still to be supplied).
3. **Do basic math** by breaking numbers into their pieces, combining or cancelling pieces, and rebuilding a numeral.

Audience: second-grade feel (big shapes, animation, little text). The learners are ORCUCLA students, so the tool must be approachable without reading much. Confirm in the convo.

## 2. Core teaching model (the "decompose → calculate → recompose" method)

Jimmy's model, restated:

1. **Decompose** a numeral into its real parts. XL (40) becomes XXXX.
2. **Calculate** on the parts. For XL − XX, cross off two X's from the four, leaving two X's.
3. **Recompose** the result into a legal numeral using the rules. XX (20) is valid.

### Validation of the interpretation

- **Sound as a teaching model.** It treats each subtractive pair (IV, XL, CM…) as a single value that can be expanded into its additive parts. Expanding and cancelling pieces is a legitimate way to compute with the notation, and it works for every example checked (XL − XX = XX).
- **Not a documented Roman method.** Romans calculated mainly on counting boards / abacus (calculi) and wrote totals with additive notation. The subtractive forms (IV, IX, XL, XC…) were common only later and were used inconsistently. Inscriptions and clock faces still use IIII for 4 today. The tool should say it is a *teaching model*, not a historical algorithm.
- **Where it can break** (these are the "ambiguity" cases):
  - IIII vs IV, XXXX vs XL — both are used in practice. The tool should accept both, then recommend the standard form.
  - Cancelling can leave a result that is not in standard form. Example: XL − IX = 40 − 9 = 31. Break one X into ten I's, cancel nine I's, and the remainder is three X's and one I, which is XXXI. Regrouping (e.g., ten I's into one X) is a required step, not an extra.

## 3. Tabs (MVP vs. later)

| # | Tab | MVP? | What it does |
|---|---|---|---|
| 1 | **Letters** | Yes | Learn I, V, X, L, C, D, M and their values. Tap a letter to hear its value. Learn only, no quiz. |
| 1b | **Quiz** | Yes | Letters both ways and true / false / ambiguous items. Misses come back as similar questions. Misses last until refresh or Forget my mistakes. |
| 2 | **Build & Break** | Yes | Random numeral or typed numeral. Decomposes into pieces, then recomposes into the simplest form. Back / Play / Next steps. |
| 3 | **Add & Subtract** | Yes | Random sum or typed sum. Pieces move onto a board, pairs cancel (subtract) or merge (add), then the result regroups and recomposes. |
| 4 | **Fix It** | Yes | Quiz: a disarranged numeral (e.g., IIII), type the simplest form. Also check your own numeral and name the rule it breaks. |
| 5 | **Rules** | Yes | Rules 1–5 as short picture cards with one worked example each. Wording from ORC. |
| 6 | **Problem Lab** | Later | Child or teacher types a sample problem (e.g., XL − XX). Step-by-step guidance with "next step" hints and an optional check. Future tab per Jimmy. |
| 7 | **Explain & Playback** | Later | Child records their explanation of a problem (voice, stays on the device), then plays it back to practice. Needs microphone permission, so hosted on GitHub Pages (not an Artifact). |

## 4. Screen layout (iPad first)

Follows `02 Refs/Skills/ipad_website.md` and Jimmy's preferences:

- Top: tab row, big touch targets (48–68px). Tabs are the only navigation, no nested menus.
- Main area: the **play board** (the numeral and its pieces) front and center. Two-column play/reference: board on the left, the rule or letter reference on the right.
- Bottom: **Undo** (prominent) and the step caption (short, one sentence, a picture helps).
- **Floating ⚙️ gear** in the lower-right. It opens a drawer with: Quick mode (smaller numbers), Show errors toggle, Sounds on/off, Reset progress.
- Errors appear at the bottom of the screen, only when "Show errors" is on.

## 5. Visual and sound style

- Palette: pastel vanilla, sage, peach, mint, coral. No harsh black/white.
- Shapes: rough, hand-drawn look (slightly wobbly lines, soft rounded shapes). Not sharp wireframes. Implementation options: a rough-drawing library (e.g., rough.js from cdnjs) or SVG turbulence filters. Pick in the MVP.
- Pieces: each letter is a chunky tile. Cancelled pieces fade or "pop" out.
- Animations: decompose splits a tile into its parts; cancelling slides the pair off; recompose stacks parts into the numeral. Each step has a short caption and a sound (Web Audio, synthesized, no files).
- Tactile depth: `box-shadow: 0 4px 0 ...`.

## 6. Architecture

- Plain HTML, CSS, vanilla JS. No build step, no server.
- Core logic in one pure JS module: `toParts(n)`, `toNumeral(parts)`, `validate(str)`, `fixSteps(str)`. Unit-testable in a browser console or a tiny test page.
- No Supabase in the MVP. No student data is stored. Progress, if added later, uses localStorage with a visible note.
- Hosted on GitHub Pages when the MVP is ready (per the family/kids web app defaults).
- Future Explain & Playback recording stays on the device (MediaRecorder + object URLs). Nothing is uploaded.

## 7. Proposed MVP scope (after approval)

Build tabs 1–5 with the core model:
- Build & Break for numbers 1–3999 (or the agreed range), with a Quick mode.
- Add & Subtract for two numerals.
- Fix It with the rule-violation list.
- Letters and Rules, using ORC wording once supplied.
- Gear panel, Undo, error panel at bottom, sounds.

Not in the MVP: Problem Lab, Explain & Playback, accounts, data storage.

Verification plan for the MVP: check every conversion against a known table (1–3999 sample set), test XL − XX, XXXX − IX, and each invalid example in Fix It, and confirm the page works at tablet width with no horizontal scroll.

## 8. Open questions

See `convo/convo v0.1.md`. Key ones: ORC Rules 1–5 wording, the number range, which numeral forms are accepted, and the audience age.

## 9. Status log

- 2026-10-26: Schematic draft v0.1 created from the first conversation. Awaiting Jimmy's review.
- 2026-10-26: Jimmy answered convo v0.1. MVP built: `roman.js` (logic), `app.js`, `index.html`, `styles.css`, `tests/roman.test.js` (14 tests pass). Browser smoke test: no page errors, phone width has no horizontal scroll.
- 2026-10-26: Jimmy's first look (convo v0.5). Dark mode removed for legibility on iPads. Quiz split into its own tab, mistakes cleared by a settings button. Build & Break and Add & Subtract gained Random and type-your-own. Fix It became a quiz. Long Ago rewritten with sources. 21 logic tests pass.
- 2026-10-26: Convo v0.2–v0.3 answers applied (convo v0.4). Pair rule (Rule 4) no longer named in messages. Range capped at MD (1500). Quick check gives two answers per question, shows the right answer at once, and repeats misses as similar questions. Quick mode dropped. Trades break only the piece needed.
