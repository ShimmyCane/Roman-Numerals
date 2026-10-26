# Convo v0.16 — wording for a second grader

Jimmy reviewed a list of proposed wording changes across all the tabs. Approved, with these skipped: 3 (Rules broken), 4 (Simplest form), 6 (the record note), 8 (How to read this, regrouping), 14 and 15 (the quiz text), and 20 (the Regroup "too many in a row" heading). Item 12 (trade or swap) was a question, so "trade" stays.

## What changed

- **Purpose:** the learner paragraph is shorter; "You will not change them into our numbers" is its own sentence.
- **Fix It:** "Random wrong numeral" (button and the Show more text).
- **Add & Subtract:** "Now practice explaining this problem and its answer"; "Make a problem first, then explain it."; the counting board line is "line up the tens and ones, and work one column at a time"; "These are two ways to practice. Change between them in settings."
- **Letters:** "Pairs that are real"; "Show pairs that are not allowed".
- **Rules:** "These rules come from the ORMC unit notes. Rule IV is coming later." The rule wording itself is unchanged.
- **Regroup:** heading "Trade many small letters for one bigger letter"; "Try it: add by putting letters together"; the steps note is shorter; the button is "Add it".
- **Long Ago:** the table says "letters only" and "Counting board (stones)".
- **Settings:** "How to add and take away"; "Put letters together (regroup)"; "Counting board (by tens and ones)"; "Show all steps at once (off: one step at a time)"; "Show the random button".
- **Step captions:** "Line up the columns. Start with the ones."; "Put the columns together"; "Get one X from the tens"; "The whole problem:"; "Put the biggest letters first."; "Write it the long way" (replaces "Open it up").

## Checked

- `node tests/roman.test.js`: 38 pass (four assertions updated to the new captions; the borrow check also accepts "get one").
- Browser check: no digits outside Long Ago, no page errors, no split numerals, no sideways scroll, and the practice box still records and plays back.
