# Convo v0.10 — Roman Numerals

Jimmy's sixth round of feedback, and what changed.

## Feedback from Jimmy

1. **Long Ago animations.** They were not right. For adding, the picture should show the board before, the new pebbles coming down, and then the count. One picture that moves with the mouse (left, middle, right), like a GIF. Nothing should start on its own.
2. **Add & Subtract.** The working window was better before: a small screen for the working, separate from the text. The steps must say things clearly. "Break XC into LXXXX" ran together and was unclear. Think about the basic needs of communication, write them down as a lesson, and then apply them.
3. **Rules.** Summarise on the left. The full rule, as typed, on the right, with examples.
4. **Letters.** No tapping. Show the pairs that exist straight away, with their numbers. A button shows the pairs that never exist.
5. **Looks.** Candy, Folder and Garden are the favourites. Use serif letters for the Roman numerals. Drop Chalk. Poster could work, especially for Fix It.
6. **Fix It.** The rules broken must not be squeezed. Put them at the top, not at the side.
7. **Settings.** Propose changes from a fresh look, inside the settings.
8. **Past 1000.** Leave it out of the settings. An overlined I is 1000, which is the same as M, so it is confusing. Mention it in Long Ago.
9. **Widths.** Folder at 80%, Candy at 90%. Garden reads well for Long Ago.

## What changed

- **Lesson.** `lessons.md` (repo root) holds the rules for showing a step: say the change, give the value, separate the pieces with "+", keep the sum visible, use one working window, use the same words everywhere, show the result, and test the captions in order. The CLAUDE.md pointer names a file outside this repo, so this copy lives in the repo.
- **Add & Subtract.** Captions give the value and join the pieces: "XC is 90. Write it as L + X + X + X + X." Trades say what they are worth: "Trade one V (5) for I + I + I + I + I, which is also 5." The sum sits in a working window, with the caption outside it.
- **Long Ago.** One picture per demo, moved by a slider. Pebbles that come in drop down into place. Pebbles that go out fade. Nothing animates on its own. The "Past 1000" card explains the overline.
- **Rules.** Short summaries on the left. The full wording, as typed, on the right.
- **Letters.** The seven letters, then the pairs that exist with their values, grouped by the small letter. "Show pairs that never exist" shows the rest.
- **Fix It.** "Rules broken" sits above the steps, in one full-width row.
- **Looks.** Chalk removed. Sunny, Candy, Folder, Garden and Poster are left. Garden's numerals are serif. Each look sets its own page width (Folder 80%, Candy 90%).
- **Settings.** Removed "letters past 1000". Added "Ideas to try": read each step aloud, bigger tiles, and show only the current step. Each one is a guess; tell me which to keep.

## Open questions for Jimmy

1. **Ideas to try.** Which of the three should stay? Are there others you would try?
2. **Look.** Which one should be the default: Candy, Folder, Garden, Poster or Sunny?
3. **Rule 4.** Still to come.
