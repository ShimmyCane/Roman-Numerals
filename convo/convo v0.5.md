# Convo v0.5 — Roman Numerals

Jimmy's feedback on the MVP (first look), and what changed. Answers to the open questions at the end go inline.

## Feedback from Jimmy

1. **Graphics.** The users are a group of second-grade girls on iPads. The gray background with white letters is not legible.
2. **Tabs.** The first tab should only teach the letters. The quiz comes next, in its own tab.
3. **Quiz memory.** The quiz forgets earlier attempts on refresh. It builds mistakes only from the current session. A setting lets the user also forget the mistakes.
4. **Build & Break.** Unclear what it is. It should work the same way as Add & Subtract. One mode is generated at random, the other is typed in by hand.
5. **Fix It.** Should be a quiz: random malformed numerals, with the user typing the fix. Keep the focus on wrong and ambiguous numerals.
6. **Long Ago.** More description and supporting evidence (links to where a numeral was seen). Describe the counting board and the columns, with a graphic or a link. Explain zero and negative numbers, and what Romans did for them. Put the question "is this app how the Romans did it?" first.

## What changed

- **Graphics.** Dark mode is removed. The page is light, with a solid cream background and dark ink text. The tiles are pastel with dark letters, and the letters are larger.
- **Tabs.** Letters, Quiz, Build & Break, Add & Subtract, Fix It, Rules, Long Ago. The Letters tab only teaches. The Quiz tab holds the letter and true / false / ambiguous questions.
- **Quiz memory.** Misses live in memory only, so a refresh clears them. Nothing is stored on the device.
- **Settings.** A "Forget my mistakes" button clears the quiz misses and the Fix It misses. Picture steps, Sounds and Show errors stay.
- **Build & Break and Add & Subtract.** Each has a Random button and a type-your-own box, and both use the same steps (Back, Play steps, Next, Undo).
  - Random numerals run 4 to 499. Above that they go past the 10-letter limit.
  - Random sums use terms up to 99. A difference is never below 1.
- **Fix It.** A quiz shows a disarranged numeral (IIII, VIIII, XXXX and so on). The user types the simplest form. A miss comes back two questions later. "Check your own" stays below.
- **Long Ago.** Rewritten, with the counting board drawn, the zero and negative-number answers, and a list of sources. The sources were found by web search; see the page for the links.
- **Rules.** A note says the wording is a working summary until the ORC wording is supplied.

## Open questions for Jimmy

1. **Rules wording.** The Rules tab text was written by Claude, not supplied by ORC. CLAUDE.md says to ask before inventing rule text. Can you send the ORC Rules 1–5 wording?
2. **Fix It mix.** Should Fix It also include ambiguous numerals such as IL or VIX, or only the disarranged ones?
3. **Random range.** Is 4 to 499 right for Build & Break, or should it go up to 3999 with the letter limit relaxed?
4. **"Woman" in the feedback.** The request said "how the woman did it." I read this as "the Romans." Confirm?
