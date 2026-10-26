# Convo v0.4 — Roman Numerals

Decisions from Jimmy's answers in `convo v0.2.md` and `convo v0.3.md`, and what changed in the MVP. Jimmy: answer the new questions inline.

## Decisions

1. **Pair rule (hidden Rule 4).** Confirmed. The checker no longer names the pair rule in its messages. IL shows as its simplest form, XLIX, under Rule 5.
2. **Trades.** Only the missing piece is broken. The checker already does this: it breaks the smallest piece that is bigger than the one needed. Example: XL − IX breaks one X into VV, then one V into IIIII, and leaves X X X I = 31.
3. **Quiz feedback.** A wrong answer shows at once: ✗, the right answer highlighted, and the reason. It comes back in a later round as a similar question, not the same one. Example: letter-to-value comes back as value-to-letter.
4. **No Quick mode.** Quick check stays comprehensive. It is not a shortcut for smaller numbers.
5. **Range: MD (1500).** Jimmy said the numerals should stop at MD, with no MDLX-style numbers. The checker and the calculator now stop at 1500.
6. **Problem Lab input.** Calculator format (`XL + XX - IX`), not Arabic numerals or words. Built later.
7. **AMB = Ambiguous.** The Ambiguous items are numerals that break the rules but can be read more than one way. IL can be 49 or 51, and IC can be 99 or 101. Jimmy confirmed this.
8. **True / False / Ambiguous items.** Two answers per question: the right one and one wrong one. Mixed with the letter questions.
9. **Picture steps.** Stays as a switch in the gear panel. The tabs are not removed.
10. **True / False bank.** Claude adds the items (`TRUE_FALSE` in `app.js`). Jimmy asked for statements with only two answers, one wrong.

## Still open

1. **Range.** Is MD (1500) the cap for everything: the quiz, Build & Break, Add & Subtract and Fix It? Or should the quiz use a different range?
2. **IIV and IIX.** Both break Rule 3 (a few smaller letters before a bigger one), so they are False, not Ambiguous. Agree?
3. **Ambiguous items.** Should there be more of them? For example, numerals that read two ways, such as IIX (8 or 12).
4. **Wrong-answer delay.** About 1.5 seconds before the next question. Is that the right pace for second graders?

## Round 3 (range clarified)

- Jimmy: the limit is about **letters**, not value. "Only a few letters," not a bigger number with lots of letters. The value cap is back to 3999.
- Chosen: numerals a student types in have **at most 3 letters** (Jimmy picked "Up to 3 letters"). MDLX (4 letters) and VIII (4 letters) are flagged in Fix It as too long. Calculator results are not capped, so XL − IX = XXXI still shows.
- Open: VIII and XXIV can't be typed in under this limit (they are 4 and 5 letters). Is that intended, or should the calculator also accept longer numerals for practice?

## Round 4 (correction to Round 3)

- Jimmy: the 3-letter limit was meant for the **quick quizzes**, not for typing. A quiz numeral may use at most **three different letter types** (for example I, V and X). Typed numerals may have **up to 10 letters**.
- Applied: typed numerals up to 10 letters (MDCCCLXXXVIII, 13 letters, is flagged). Quiz statements are in `Roman.TRUE_FALSE` and a test checks each one uses at most three letter types.
- Open: none from this round.

## Round 5 (Jimmy's answers to the open questions)

1. **Range:** 3999 for everything. Confirmed.
2. **IIV and IIX:** False (they break Rule 3). Confirmed.
3. **Ambiguous items and disarranged numerals:** Jimmy says students are often asked to convert disarranged numerals correctly, and this should be part of the short quizzes. Applied: a "Fix" item shows a disarranged numeral with two answers (the correct form and one wrong one), for example Fix IIII → IV or VI. Ambiguous items now include VIX (could be read two ways).
4. **Wrong-answer delay:** 1.5 seconds. Confirmed.

Open: none.
