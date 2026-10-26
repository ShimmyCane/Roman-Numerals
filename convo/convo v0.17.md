# Convo v0.17: the Arabic numerals rule, plus a typography note and a multiplication tidbit

Jimmy's clarification of the Arabic numerals rule:

- **No Arabic numerals in the explanations of how to do the problems.** That covers the step captions, the how-to text, the practice section, Fix It, Add & Subtract and the Quiz. Words and Roman numerals only.
- **Arabic numerals are fine** on the Regroup tab, on the Rules and Letters tabs, and on the Long Ago tab. Those are quick reference, like flashcards, and the trivia.
- The Purpose tab explains the site to parents and the learner, so it stays without Arabic numerals (its tab names use Roman numerals).

Checked in the browser: Purpose, Fix It, Add & Subtract, Quiz, Letters, Rules, Regroup each show no Arabic numerals in their visible text. Long Ago shows them. The step text of a full run of Add & Subtract and Fix It has none.

## What changed

- **Letters tab: "Writing the letters: Roman numbers and variables".** A short note. In math a letter can stand for a number we do not know yet, a variable, like x. Roman numbers are capitals that stand straight up (X is ten). Variables are small letters that lean to the right (x is unknown). Serifs, the little feet on the ends of letters, help tell them apart.
- **Long Ago: "Did the Romans multiply?"** A short card, linked from the index at the top, with more examples to come later. It says that most historians think they multiplied on the counting board with pebbles, and maybe by doubling and halving, and that no Roman method on paper is known.

## For review before merging

- Should the Letters note sit on the Letters tab (as it does now), or on the Purpose tab, or on Long Ago?
- Should the Letters and Rules tabs show the values in Arabic numerals too (for example I = 1), since they are now allowed to? I have not added them.
- Is the multiplication card enough, or should there be a separate tidbit section for future expansion?

## Checked

- `node tests/roman.test.js`: 38 pass.
- Browser: no page errors; the digit rule holds on each tab as above.
