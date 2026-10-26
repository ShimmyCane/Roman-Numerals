# Convo v0.7 — Roman Numerals

Jimmy's third round of feedback, and what changed. Answers to the open questions at the end go inline.

## Feedback from Jimmy

1. **Looks.** The last change only swapped colours. The looks should change far more: fonts, boxes, sizes and the whole CSS. Several temporary looks are fine, with a setting that switches between them.
2. **Letters.** Good. Keep it.
3. **Second tab: Rules.** A split screen. Five rule buttons on the left, and the examples of the rules on the right.
4. **Fix It.** No random good numeral. Start with a random bad numeral. Show the rules that are broken on the right. Each step should not replay the animation, so Play does not make everything blink. Less text, more grey-outs and arrows, so the change from one line to the next is clear.
5. **Fix It example (XXIIII).** Write it down. Then note the four I's on the board and say rule 1. The four I's grey out on the left, and the fix IV appears to the right. Then XX and IV give XXIV. Do not walk through every rule that does not apply.
6. **Build & Break.** Remove it. Its core goes into Add & Subtract.
7. **Add & Subtract.** Keep the full sum on one line, with chunks such as XL grouped. When a part breaks, show it as XL with an arrow to XXXX, and gray out the rest. Cross off what is done. For a sum like XLI + XIX, put XLI on the board, add XIX, split IX into V and IIII, cross out IX, then group the pieces into X's, V's and I's. Then regroup one step at a time to LX.
8. **Long Ago.** The counting board examples are good. Add photographs of the Greek abacus, the Roman forms IV and IX, and other objects.

## What changed

- **Looks.** Four whole stylesheets now sit in `looks/`: Sunny (serif, cream, rough tiles), Chalk (dark board, hand-written font, dashed outlines), Notebook (ruled paper, blue ink, handwriting font) and Candy (rounded pills, thick outlines, bright tiles). `base.css` has the layout only. The settings buttons swap the stylesheet. The old single stylesheet is removed.
- **Tabs.** Letters, Rules, Fix It, Add & Subtract, Quiz, Long Ago. Build & Break is gone.
- **Rules.** Left: five buttons. Right: the rule wording and its examples. Rule 4 is shown with its pairs only, because its wording has not been supplied.
- **Fix It.** Starts from a random bad numeral. Each repair shows the bad part crossed out on the left, an arrow, and the fix on the right. A list on the right names each rule as it comes up. A rule is shown only when the sequence needs it.
- **Add & Subtract.** The sum stays on a line. Chunks are crossed when done, and an arrow shows a break. The pieces sit on a board below. Regrouping is one step at a time.
- **No replay on Play.** Each step is added as a new row, and the rows already on screen are left alone.
- **Long Ago.** The photographs are not embedded. The image source could not be reached from this environment, so I linked the Wikipedia pages where the photos are, rather than guess at image URLs and licences.

## Open questions for Jimmy

1. **Looks.** Which of the four looks should be the default? Are any of them too far from what the girls liked?
2. **Rule 4.** The rule wording is still missing from the ORC unit. The Rules tab shows the pairs only, until you send the wording.
3. **Photographs.** Can you open the photo pages from Long Ago and tell me which photos you want on the page? I can embed them once I have the image files and their licences.
4. **Tab order.** I put Fix It second, after Rules, and Quiz after Add & Subtract. Is that the order you want?
