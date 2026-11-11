# Archive: Felix's page lessons, round by round

Moved here from `lessons.md` when the lessons were consolidated. Nothing is deleted; each entry keeps the round it came from. The short version is in `lessons.md`, section 8.

## Felix's page, rounds F1 to F8

These came from the conversation that built Felix's page: the F button, the art tabs, the pictures planning page, and the source-inspired tabs.

### Working with the person

1. **Brainstorm or build: watch for the switch.** The conversation began as "not a coding exercise". When the requests turned into "test these ideas, run them all", that was the cue to build. Say which reading you took (round F1).
2. **Spoken requests garble names.** "Felix", "Athena's page", "acid folder" (assets), "ORCUCLA" (ORMC). Take the most likely reading, say it in one line, and fix it when corrected. The unit is **ORMC** (round F1).
3. **Merge only when asked.** Open a PR for every round. Merge when the person says "merge", not before. A merged PR is finished; new work goes on a new branch from `main` (rounds F2 to F5).
4. **Update the PR description when the PR changes.** Later pushes left the first description out of date (round F2).

### Writing for a six-year-old

1. **As few words as possible.** One heading, one line, a picture. Explanations and links go on a Grown-ups tab (round F3).
2. **Roman and Arabic on separate lines, never "X 10".** Roman on top, Arabic below. This applies to labels, counters and captions (round F5).
3. **Numbers go outside the tile, on their own row below.** The tile holds only the letter (round F5).
4. **Name things plainly.** "Raw" (the beads as letters) and "Organized" (the numeral) beat "Parts" and "Short" (round F4).

### The visual ideas

1. **The letters step ×5, ×2, ×5, ×2.** Every two steps make ×10. This is the thread through the whole page: the spiral (one turn per ×10), the stairs, the counting board's lines and spaces, Maya bars and dots, and Chinese rods with a crossing five (rounds F1 and F5).
2. **Focus first, zoom out on request.** The spiral is set to the numbers up to XX. Neighbours show only near the start (ahead to XV, behind to XX); after that only the number itself. A zoom button shows more (round F5).
3. **A counter in a fixed corner** (Roman, then Arabic) gives a steady place to look while the picture moves (round F5).
4. **Stairs need a sketch first.** Draw the staircase, then let a block climb each step; bars of different heights did not read as stairs (round F5).
5. **Pour the pieces, not every unit.** One stone per unit lost the numeral. The bucket now fills with the numeral's own pieces (D, C, X, IX), pairs kept whole, each sized by value (round F5).
6. **Colour-match raw and organized.** The same colour bar sits under a column's beads, its raw letters (XXXX) and its organized form (XL), so the regrouping is visible at a glance (round F5).
7. **Say when scale is bent.** Small pieces get a minimum size so their letters stay readable. That breaks the true scale for I, V and X; the large ones stay to scale (round F5).

### Checking the work

1. **Check geometry claims against the picture.** V sits seven-tenths of a turn round the spiral, more than halfway. The first draft said "less than half" (round F1).
2. **SVG attributes cannot read CSS variables.** `fill="var(--x)"` does nothing; set colours as inline styles (round F1).
3. **Attach the tab buttons before anything else.** "Stuck on the first tab" could not be reproduced here, but if any later setup throws, the tabs still work (round F4).
4. **Test where the person tests.** The page is opened as a file on an iPad. Test `file://` and touch, not only a local server. Ask for the browser and any console error when a bug does not reproduce (round F4).

### Sources

1. **Use only links you actually found.** Library links written from memory were replaced with the ones a search returned (round F2).
2. **Say when a page was not opened.** The page-reading tool could not reach Wikipedia and other sites from here, so facts for the new tabs came from search results and the links are labelled as not opened (round F5).
3. **Credit the inspiration on the tab itself.** Each source-inspired tab ends with a small "Inspired by" line, and the Grown-ups tab lists all sources by tab (round F5).
4. **Keep the doubt.** Nobody is sure why clocks use IIII, and historians are not sure Romans multiplied by doubling. The tabs say so (round F5).

### Round F6

1. **Make the size carry the meaning.** A ×5 step is a big step (five units up) and a ×2 step a small one (two units up). Equal steps hid the pattern.
2. **Leave the picture open when there is more.** The stairs carry on past M, fading, instead of closing off.
3. **Direct touch beats buttons.** Drag the clock hands rather than tapping ±5 minutes.
4. **Phones: tall buttons, no double-tap zoom.** Quick taps on iPhone zoomed the page. `touch-action: manipulation` on buttons, and twice-height buttons where a child taps repeatedly.
5. **Let things move like things.** The shake pieces float, bump and settle in a narrow cup, following the tilt of the phone, instead of being placed in sorted rows.
6. **Pause on ideas that do not land yet.** Halve and double is liked but not yet clear; it waits for a different approach.

### Round F7

1. **Scale the picture to the idea.** Shake pieces are sized on a log scale, so 1 and 1000 both fit. The stairs already multiply, so they match.
2. **Let the child switch the progression.** Roman and Arabic labels on the same stairs let a student compare the two directly.
3. **Put the tuning in settings.** Shake sensitivity is a setting, not a hard-coded number, because phones and hands differ.
4. **Shorten words that repeat the number.** "X is worth ten (10)" became "X is worth 10". The word is in the Letters tab's other text; the number alone is clearer for a young reader.
5. **Keep a todo list.** Ideas that are not designed yet (the merging game) go to `TODO.md`, not into the tool.

### Round F8

1. **Start small, and let the child open more.** Rods begin at I to X (ones and tens). A setting adds hundreds and thousands, so the first screen is not overwhelming.
2. **One row per press.** Halving and doubling shows one row at a time, from the buttons, never on a timer. Each row says what changes ("13 is odd: keep 6"), and the kept numbers are added at the end.
3. **Keep the controls in one place.** Random, back and next sit above the picture, the same on Maya, China and halving.
4. **Keep the starting state inside the range.** The rods began at 47 and had to be fixed to VII, so the range has to be set before the first screen.
