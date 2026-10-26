# Convo v0.11 — Roman Numerals

Jimmy's seventh round: Add & Subtract was still confusing.

## Feedback from Jimmy

1. **Changes blend into one line.** Each change should be its own line. For example, XL is crossed out to X + X + X + X, and the next line continues from there.
2. **It does not find the short way.** X + LXXV should just slide the X in among the other X's. Instead it took five steps to expand and merge.
3. **Needless expansion.** XXIX + XXII opened IX into VIIII for no reason, which made it harder to follow.
4. **Maybe think of it as an abacus.** "If you are having such a hard time programming it, I'm never going to get my daughter to get this right."

## What changed

- **The short way first.** If the letters just slide together and are already in simplest form, that is one step: "Slide X in among the letters of LXXV: LXXXV." For taking away, if every part of the second number is in the first one, those parts are crossed out and what is left is the answer.
- **Otherwise, a counting board in letters.** The numbers are lined up by place in boxes: thousands, hundreds, tens and ones. The work starts in the ones and moves up, one place per step.
  - **Adding:** "Ones: IX (9) + II (2) = 11. Write XI." Then "XI has one X in it, which is 10. Move the X up to the tens. I stays in the ones."
  - **Taking away:** "Ones: I is less than IX. Borrow one X from the tens: XL becomes XXX, and I becomes XI." Then "Ones: XI (11) − IX (9) = 2. Write II."
- **One change per row.** Each row shows all the place boxes. The box that changed is highlighted, showing old → new. A letter that moves up arrives highlighted in its new place.
- **No needless opening.** XXIX + XXII never writes VIIII. IX is used whole, as 9.
- **Checked.** Every sum and difference up to 300 (134,850 cases) gives the right answer. The longest takes 8 steps (I + CXCIX, which carries twice).

## Open questions for Jimmy

1. **Is the counting-board way right for the class?** It replaces the earlier "break everything into single letters, then rebuild" model. It is closer to how the Romans worked on a board, and it needs far fewer steps.
2. **Values in brackets.** The captions say "IX (9) + II (2) = 11". Is the Arabic number in brackets helpful for second graders, or should it be hidden?
