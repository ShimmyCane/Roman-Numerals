# Convo v0.3 — Roman Numerals

Jimmy's feedback on the MVP, and what changed in response. Jimmy: answer inline under each question.

## Feedback (Jimmy)

- The learners are strong math students, so "graphics" was the wrong word for the quiz. The quiz is for rote memorization.
- Quiz answers should be quick and low-load: tap the answer, then move on. Repetition is the point.
- Options can be True, False, or AMB (ambiguous). Pick the right answer, then go.
- The breaking-apart and regrouping pictures are useful, but Jimmy may remove them.

## What changed in the MVP

- **Quick check** in the Letters tab: letter ↔ value questions and True / False / Ambiguous statements, mixed. Five per round, misses come back until they are right.
- Feedback is a single ✓ or ✗ with the answer. Correct answers move on after about half a second, wrong ones after about 1.5 seconds.
- **Picture steps** is a switch in the gear panel (on by default). Off hides the board. The step text and the tally still show.
- Items are short, and long statements use a smaller prompt.

## Questions

1. **AMB meaning.** I read "AMB" as **Ambiguous**. The "Ambiguous" items are IL and IC, because the pair rule is not settled (it may be Rule 4). Is that the right reading, or did you mean something else?
2. **Ambiguous items.** Should AMB items be pairs like IL and IC, or statements where the rules really do not decide (for example, a numeral that is valid under one rule and not another)?
3. **True / False statements.** The bank is in `app.js` (`TRUE_FALSE`). Do you want to edit the list, or should I move it into a separate file for you to change?
4. **Picture steps off.** Should the Build & Break and Add & Subtract tabs keep their text-only steps when the switch is off, or should that switch remove the tabs entirely?
5. **Quiz mix.** Should the True / False / Ambiguous items be a separate round type, or stay mixed with the letter questions?
