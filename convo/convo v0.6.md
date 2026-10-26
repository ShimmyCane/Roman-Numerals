# Convo v0.6 — Roman Numerals

Jimmy's second round of feedback on the revised MVP, and what changed. Answers to the open questions at the end go inline.

## Feedback from Jimmy

1. **Looks.** Keep the lighter look, but show other variations to try.
2. **Font.** Use a serif font (one with the small finishing strokes), for all the text.
3. **Quiz.** Working well. Keep it.
4. **Build & Break.** Show the random numeral first. Each step goes directly below the one before, one step at a time, and the screen is big enough to hold the steps. Each step changes one letter type.
5. **Add & Subtract.** Same as Build & Break, with a bigger screen. Show both numbers, break both into parts, subtract, then build the answer back up.
6. **Fix It.** Not a quiz. It should work like Build & Break, with a random good numeral and a random bad numeral. The rules and their examples come with it.
7. **Rules.** More examples. Keep the arrows. Use a green check for right and a red X for wrong. The current X looked like the number 10.
8. **Long Ago.** Show the counting board. Give examples of addition and subtraction on it. Keep acceptum and expensum. Add more trivia. Add a section on Hindu-Arabic numerals, comparing them with Roman numerals. This section is more theory, but a student taking the class would want it.

## What changed

- **Looks.** Settings has four looks: Sunny (the lighter one), Bold, Mint and Night. Tile letters stay dark on every look.
- **Font.** Merriweather, a serif font, loaded from Google Fonts. It falls back to Georgia if the font does not load.
- **Build & Break, Add & Subtract, Fix It.** Each step is one row, stacked top to bottom with the newest at the bottom. Next adds a row, Back removes one, Play steps adds one every 1.5 seconds. Older rows stay on the screen and the list scrolls.
- **Steps change one thing at a time.** Breaking a pair (XL into XXXX) is one step. Each take-away is one step. A trade is one step. Each merge is one step. The second number of a subtraction gets its own row before any take-away.
- **Fix It.** Two random buttons: a good numeral and a bad one. The bad numeral's steps name each rule it breaks before the rebuild. The quiz is gone from Fix It.
- **Rules.** More examples per rule, with arrows and marks drawn as shapes (a green check, a red X). The IIV example became IIX, because IIV has no clear intended value.
- **Long Ago.** The counting board is drawn by the page. The page shows addition (23 + 14, and 27 + 18 with a trade), and subtraction (40 − 18 with a trade). It also has trivia, a comparison table with Roman and Hindu-Arabic numerals, a timeline, and sources.
- **Settings.** Forget my mistakes now clears only the quiz misses. Fix It has no misses to forget.

## Open questions for Jimmy

1. **Looks.** Which of the four looks do the girls like best? Should any of them become the default?
2. **Rules wording.** Still waiting for the ORC Rules 1–5 wording (carried over from convo v0.5).
3. **Hindu-Arabic facts.** Some dates come from popular web pages. Should I check them against a history text before the page is used in class?
4. **Trivia.** Are the trivia items the right kind, or would the class prefer other examples?
