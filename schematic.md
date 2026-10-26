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
| 2 | **Rules** | Yes | Five rules on the left, examples of each on the right. Rule 4 shows its pairs until its wording arrives. |
| 3 | **Fix It** | Yes | Starts from a random bad numeral. Each repair greys out the bad part and puts the fix beside it. Rules broken are listed on the right. |
| 4 | **Add & Subtract** | Yes | The sum stays on a line. Parts cross off as they are done. Pieces go on a board, then regroup one step at a time. |
| 5 | **Quiz** | Yes | Letters both ways and true / false / ambiguous items. Misses come back as similar questions. Misses last until refresh or Forget my mistakes. |
| 6 | **Long Ago** | Yes | Counting board, addition and subtraction examples, zero, negative numbers, IV and IX, trivia, and Hindu-Arabic numerals. |
| 7 | **Problem Lab** | Later | Child or teacher types a sample problem (e.g., XL − XX). Step-by-step guidance with "next step" hints and an optional check. Future tab per Jimmy. |
| 8 | **Explain & Playback** | Later | Child records their explanation of a problem (voice, stays on the device), then plays it back to practice. Needs microphone permission, so hosted on GitHub Pages (not an Artifact). |

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

- 2026-10-26: Felix's page round three. Title "Felix learns about Roman numerals". Start: letters with Arabic values on a row below. Spiral: letter headings back, counter (Roman over Arabic) in the bottom-left corner, focused on I to XX with zoom out, neighbours only near the start. Steps: staircase sketched first, blocks climb. Shake: pick a number, its pieces pour into the bucket. Rods: aligned, Arabic row, colour bars matching raw and organized. Five new source-inspired tabs: Board, Clock, Maya, China, Double. Athena's Letters show Arabic values throughout. Lessons in lessons.md section 7. 38 logic tests pass.
- 2026-10-26: Felix's page added (felix.html, felix.js): reached by the F button next to the gear, returns by the A button. Tabs: Purpose (the story: ×5 and ×2 steps, a clock comparison, the road to decimal and binary), Spiral (one full turn per times ten), Steps (staircase with the ×5/×2 steps), Tiles (squares to scale by area), Rods (counting board: parts first, then the numeral). Look is kept in shared.js and carries across pages (localStorage, look name only). Pictures to find (assets.html, from Settings): a planning list of files to drop into an assets/ folder, with no placeholders in the pages yet. 38 logic tests pass.
- 2026-10-26: Schematic draft v0.1 created from the first conversation. Awaiting Jimmy's review.
- 2026-10-26: Jimmy answered convo v0.1. MVP built: `roman.js` (logic), `app.js`, `index.html`, `styles.css`, `tests/roman.test.js` (14 tests pass). Browser smoke test: no page errors, phone width has no horizontal scroll.
- 2026-10-26: Arabic numerals rule clarified: none in how-to explanations (captions, how-to text, practice, Fix It, Add & Subtract, Quiz, Purpose); allowed on Regroup, Rules, Letters and Long Ago. Letters tab gets a note on Roman numbers and variables (serifs). Long Ago gets a multiplication tidbit card (convo v0.17). Draft for review.
- 2026-10-26: Wording pass for a second grader (convo v0.16), applied across all tabs except the items Jimmy skipped. 38 logic tests pass.
- 2026-10-26: Jimmy's eleventh round (convo v0.15). New first tab, Purpose: why the site, lesson six, the questions for the learner, a note for parents, and a Show more list of every tab. Add & Subtract: dice (easy, two numerals) and chili (harder, three numerals). Record and play back presenting the problem, in memory only. Long Ago: a quick index at the top. 38 logic tests pass.
- 2026-10-26: Jimmy's tenth round (convo v0.14). Add & Subtract shows step one first, with a prompt to think; a setting shows all at once. Random equation: two in three have two numerals, one in three has three with mixed + and −. Regroup: random sum hidden (setting), pattern chain removed. Tabs: Fix It, Add & Subtract, Quiz, Letters, Rules, Regroup, Long Ago. Long Ago: multiplication with letters, Roman and place-value methods, Maya and Chinese numerals. 38 logic tests pass.
- 2026-10-26: Jimmy's ninth round (convo v0.13). Regrouping in Add & Subtract happens on one equation line: what both numbers have is crossed out in one move, trades fade the letter and underline its pieces, then what is left is written after = and regrouped there. 37 logic tests pass.
- 2026-10-26: Jimmy's eighth round (convo v0.12). Add & Subtract rows start with the full equation on their own line (parts taken away crossed out, the answer on the last row), with the working underneath. Captions use one line per sentence. Every row shows at once, with Show all to return after stepping. 36 logic tests pass. Follow-up: replacements sit over an underline. A numeral never breaks over two lines; lines shrink to fit, and long piles break only between letter kinds. How to read this moved below the working.
- 2026-10-26: Jimmy's seventh round (convo v0.11). Add & Subtract rebuilt as a counting board: the short way first (slide in, or cross out), otherwise place boxes worked from the ones up, with carry and borrow. One change per row. Checked against all sums and differences up to 300. New Regroup tab (ladder of trades, 5-2 pattern, short forms, add-by-regrouping playground). 31 logic tests pass.
- 2026-10-26: Jimmy's sixth round (convo v0.10). Step captions give the value and join pieces with '+'. The sum sits in a working window. Long Ago demos move with a slider, with nothing animating on its own. Rules: short summary left, full wording right. Letters: pairs straight away. Fix It: rules broken above the steps. Looks: Chalk removed; page widths per look. Settings: 'Ideas to try'. lessons.md records how to show a step. 27 logic tests pass.
- 2026-10-26: Jimmy's fifth round (convo v0.9). Add & Subtract: one line for the sum, expansion in place, = row for the unsorted answer, then regrouping. Rules: Jimmy's wording, Rule 4 later. Letters: pairs that exist and never exist. Quiz: IL, IC, VIX are False. Looks: Notebook removed, three new ones. Settings: text size, step speed, calm motion, letters past 1000. Long Ago: pebble animation and a plain-age timeline. 27 logic tests pass.
- 2026-10-26: Jimmy's fourth round (convo v0.8). Fix It repairs change only the smallest part that must change (LXL to XC). Add & Subtract matches same parts on both sides first and only trades when a part is missing. Long Ago: tabbed Count/Add/Subtract box, columns on wide screens, simpler text, modern-uses trivia. 25 logic tests pass.
- 2026-10-26: Jimmy's third round (convo v0.7). Four whole looks in looks/ (Sunny, Chalk, Notebook, Candy) that change fonts, borders, shapes and sizes, not just colours. Tabs: Letters, Rules (split), Fix It (bad numerals, one repair at a time), Add & Subtract (sum on a line, board below), Quiz, Long Ago. Build & Break removed. 22 logic tests pass.
- 2026-10-26: Jimmy's second round (convo v0.6). Four looks in settings. Serif font (Merriweather). Build & Break, Add & Subtract and Fix It show steps as a stacked ledger, one change per step. Fix It has random good and bad numerals, with no quiz. Rules have more examples and check and X marks. Long Ago adds counting-board demos, trivia and a Hindu-Arabic section. 26 logic tests pass.
- 2026-10-26: Jimmy's first look (convo v0.5). Dark mode removed for legibility on iPads. Quiz split into its own tab, mistakes cleared by a settings button. Build & Break and Add & Subtract gained Random and type-your-own. Fix It became a quiz. Long Ago rewritten with sources. 21 logic tests pass.
- 2026-10-26: Convo v0.2–v0.3 answers applied (convo v0.4). Pair rule (Rule 4) no longer named in messages. Range capped at MD (1500). Quick check gives two answers per question, shows the right answer at once, and repeats misses as similar questions. Quick mode dropped. Trades break only the piece needed.
