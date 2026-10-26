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

## Follow-up: a Regroup tab

Jimmy: online guides talk about regrouping the symbols after adding or taking away. Show it visually, maybe as its own tab: five I's make a V, two V's make an X, and so on, with the patterns.

- **New tab: Regroup** (after Rules). It has:
  - **A ladder of six trades:** 5 I's = V, 2 V's = X, 5 X's = L, 2 L's = C, 5 C's = D, 2 D's = M. Tap a card and the small letters slide into the big one. Tap again to undo. Nothing moves on its own.
  - **The pattern:** I ×5 → V ×2 → X ×5 → L ×2 → C ×5 → D ×2 → M. Two steps up the chain is always ten.
  - **Short forms:** IIII → IV, VIIII → IX, XXXX → XL, LXXXX → XC, CCCC → CD, DCCCC → CM.
  - **Try it:** add by regrouping, the way most guides teach it. Put the letters together, open short forms (inside each number only), sort, regroup one trade at a time, then write the short forms. It uses the same before → after rows as Fix It.
- **Checked:** the regroup method gives the simplest form for every sum up to 200 + 200. 31 logic tests pass.

## Open question

- Should Add & Subtract use regrouping too, or keep the counting-board method for adding and taking away, with Regroup as its own lesson?
