# Convo v0.2 — Roman Numerals

Decisions taken from `convo v0.1.md` when building the MVP, plus new questions. Jimmy: answer inline under each question.

## Decisions from v0.1 (built into the MVP)

- **Rules 1, 2, 3, 5** are on the Rules tab, in plain words, with examples. **Rule 4 is not shown anywhere**, as requested.
- **Range:** 1 to 3999 (MMM is the top of the 1–3000 range you asked for, but the checker and converter accept up to 3999 so results like 2500 + 1500 still show).
- **Flagged as wrong:** IIII and XXXX (Rules 1 and 5), VV (Rule 5), VIIII (Rule 2), IIV (Rule 3). Each one is repaired to its simplest form.
- **Teaching model:** labelled on Build & Break and in the Long Ago tab. Long Ago also answers "did Romans use Roman numerals?" and covers the counting board.
- **Multi-step** Add & Subtract (e.g., XL + XX - IX), and every step is shown: decompose, add or take away, trade when a piece is missing, put pieces together, simplest form.
- **Quiz:** 5 questions per round, letter-to-value and value-to-letter. Missed questions come back in the next round until answered right.
- **Repo name** when spun out: "Roman Numerals - ORMC" (the MVP lives here for now).

## What the MVP does not do yet

- Problem Lab (typed sample problems with guidance) and Explain & Playback (on-device recording) are later tabs, as agreed.

## New questions

1. **Subtractive pairs (placeholder).** The validator allows only I before V or X, X before L or C, and C before D or M. The ORC wording for Rule 3 does not list these pairs. Is this the right rule, or is it part of the hidden Rule 4? If it is Rule 4, I will move it out of the visible messages (the Fix It text currently names "Rule 3").
2. **Trades in Add & Subtract.** A missing piece is traded for smaller pieces (X → VV, V → IIIII). Is that how you want students to see it, or should we use only X → IIIIIIIIII style trades?
3. **Quiz feedback.** A wrong answer reappears in the next round. Should it also reappear within the same round?
4. **Quick mode.** I did not build Quick mode (smaller numbers). Do you want it for the MVP?
5. **Problem Lab text.** When it is built, should students type in the same format as the calculator (XL + XX - IX), or in words?
