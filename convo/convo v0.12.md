# Convo v0.12 — Jimmy's eighth round

Jimmy: "OK, I think Add & Subtract is getting there, but I still want you to start with the full equation, use multiple lines if needed per explanation, but I want to see everything at once."

## What changed

- **The full equation on every row.** Each Add & Subtract row now opens with the whole equation on its own line (for example XCVI − XCIII), with the working (before → after letters, or the place boxes) on the lines under it, in one window.
  - Taking away: the parts of the second number are crossed out in the equation as they are taken away. A short form in the second number is opened in the equation too (IX shows as V I I I I) so each letter has its own tile.
  - The last row shows the equation with = and the answer (XCVI − XCIII = III).
  - Longer sums (XL + XX − IX): each row shows what is still to work. When a pair is done, its answer takes its place (LX − IX).
  - Works in both methods (Regrouping and Counting board).
- **One line per sentence.** A caption with two sentences ("Not enough I's. Trade one V for I + I + I + I + I.") is written on two lines.
- **Everything at once.** A new sum shows all its rows straight away, with no inner scroll box. Back, Next step and Play steps still walk through it, and Show all brings every row back.
- **Checked:** for every take-away up to one hundred twenty, every letter of the second number is crossed out by the end. 36 logic tests pass. Browser check: no page errors, no digits outside Long Ago, no sideways scroll on a phone.

## Open question

- Should the Fix It and Regroup tabs also show every row at once, or keep revealing one row at a time?

## Follow-up: underline replacements, never split a numeral

Jimmy: replaced parts fade out, and the blocks that did the replacing get an underline. A Roman numeral should never be broken over two rows. Several numerals or sub-expressions on separate lines are fine. When the screen is tight, make the text and bubbles smaller so each row fits, and move a panel to the bottom if that gives more room.

- **Underline for replacements.** Letters that were just put in sit together over one bracket-shaped underline, in the after board, in the equation (IX opened to VIIII) and in the place boxes (the new value, and a letter that moved up). The parts they replaced stay faded on the before side. This also shows on the Fix It and Regroup tabs.
- **One numeral, one line.** Each line of working (equation, before → after, place box) shrinks its letters and bubbles until it fits the width.
  - Before → after sits on one line. If that would make the letters too small, the after numeral goes under the before one.
  - A long equation keeps a readable size and puts whole numbers on separate lines. It never breaks inside a number.
  - A very long pile of letters (only when adding, for example LXXXXXXXVIIIIIII) breaks only where the letter changes. A run of X's or I's always stays together.
- **More width.** "How to read this" now sits below the working on Add & Subtract, not beside it. Phones get less padding around the rows.
- **Also fixed:** the Candy look was a little wider than a phone screen because of the entry box.
- **Checked:** at 1024, 768, 390 and 320 wide, in several looks, no numeral or run is split, there are no page errors, and the page has no sideways scroll. 36 logic tests pass.
