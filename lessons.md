# Lessons learned: Roman Numerals

One place for what we learned while building this tool. Newest rules are added to the matching section. Each lesson names the round it came from, so you can trace it back in `convo/`.

## 1. Showing a step (Add & Subtract, Fix It)

These came from Jimmy's feedback on the `XCV − LIV` and `XCVI − XCIII` steps (rounds 4 to 6). The steps failed because the words did not match what was on screen. "Break XC into LXXXX" ran the pieces together and gave no value.

1. **Say what changes, to which part.** One change per step. "Take away L" names the letter and the side.
2. **Give the value, so the child can check.** "XC is 90. Write it as L + X + X + X + X."
3. **Separate the pieces with "+".** "LXXXX" must never read as one word.
4. **Keep the whole sum visible.** The changed part is highlighted, and an arrow shows what it became.
5. **Put the working on its own surface.** A bordered working window holds the sum. The caption sits outside it.
6. **Use the same words everywhere.** "Take away", "trade", "both sides have", "put together". Do not switch words between steps.
7. **Show what is left after each step.** The child should be able to see the result, not only the action.
8. **Match first, expand only when needed.** Same parts on both sides cross out together. Trade only when a part is missing (round 6).
9. **Fix It names only the rule that is needed.** `XXIIII` shows "4 I's in a row", then `XXIV`. It does not walk through every rule (round 3).
10. **Change only the smallest part that must change.** LXLVII becomes XCVII by changing LXL to XC, and VII stays (round 4).
11. **Find the shortest path first, then show it.** A person adding X + LXXV just slides the X in. Check that short way before any longer method, and use it when the result is already in simplest form (round 7).
12. **Work by place, like a counting board.** Line the numbers up in thousands, hundreds, tens and ones, and work from the ones up. A place that reaches ten moves one letter up. A place that is short borrows from above. This avoids opening IX into VIIII when nothing needs it (round 7).
13. **One change per row.** Each row shows the whole state again. The part that changed shows old → new. A letter that moves up arrives highlighted in its new place, without crossing out the whole place (round 7).
14. **If it is hard to program, it is hard to teach.** When the steps keep getting longer and stranger, the method is wrong, not the wording. Go back to how a person would do it by hand (round 7).
15. **Test with real examples before shipping.** Read every caption in order, as a child would, and ask whether you could explain the step to someone who has not seen it.

## 2. Animation

1. **One picture, moved by the user.** A slider (or a mouse position) moves through the stages, like a GIF. Nothing starts on its own (round 6).
2. **Show what changes, not everything.** New pebbles drop into place. Pebbles that go away fade. Pebbles that stay do not move (round 6).
3. **Do not replay on Play.** Rows already on screen are not rebuilt, so their tiles do not blink again (round 3).
4. **Be critical about every animation.** If it does not show the maths, remove it. Offer a "calm motion" setting for anyone who does not want motion (rounds 3 and 5).

## 3. Product decisions from Jimmy

1. **Do not invent rule text.** CLAUDE.md says ask first. Use Jimmy's own wording from convo v0.1, and mark anything missing as "coming later" (round 5).
2. **Rule 4 is ORMC, not ORC, and is left blank for now.** Do not guess its content (round 5).
3. **Pick one approach and say why.** Jimmy did not want a list of five options (round 1). Make the call, then explain it in one line.
4. **Do not show what is not needed.** Letters past 1000 confused students, because an overlined I equals M. Keep it out of the settings and mention it once in Long Ago (round 5).
5. **Quiz statements are True or False.** A statement that is badly written is False, not ambiguous. IL, IC and VIX are not well written (round 5).
6. **No quiz on the Letters tab.** Show the pairs that exist straight away, with their values. A button shows the pairs that never exist (round 5).
7. **Keep the trivia for second graders.** Drop the Exchequer. Keep Super Bowl numbering, clocks, and a few Latin words such as *calculi*, *nulla*, *acceptum* and *expensum* (round 4).
8. **Settings are a place to try ideas.** Put proposed changes there as toggles, so Jimmy can keep or drop each one (round 6).

## 4. Visual design

1. **Dark mode can make letters unreadable.** White letters on grey were a problem on an iPad. Keep tile letters dark on every look (round 1).
2. **Roman numerals in a serif face.** Jimmy wanted the serif strokes. Candy, Poster, Garden and Sunny use one (rounds 2 and 6).
3. **Change the whole look, not only the colours.** Each look is a full stylesheet that sets fonts, borders, shapes, sizes and page width. `base.css` holds only the layout (round 3).
4. **Fix It needs full width.** A rules panel at the side gets squeezed. Put "Rules broken" above the steps (round 6).
5. **Set page width per look.** Folder is 80%, Candy 90%, and Garden is a narrow column (round 6).
6. **Blob shapes do not suit every box.** Tile corners stretch a note or a working window into an oval. Use plain radii for boxes (round 6).

## 5. Sources and facts

1. **Do not embed images you cannot verify.** The image agent could not reach Wikipedia, so the page links to the pages that hold the photos instead (round 4).
2. **Mark popular-web facts.** Dates from popular web pages are flagged on the page for checking before class use (round 2).
3. **Hedge the accounting claim.** Scholars still debate how far Roman accounts balanced. Say that (round 2).

## 6. Process and git

1. **Check the working tree first.** Note "changed on disk" messages and run `git status` before editing. Those notes can come from a sync, not from a user edit (rounds 5 and 6).
2. **Never commit to a branch whose PR is merged.** Round 5's extra commit landed on a merged branch, and was moved to `claude/roman-numerals-round-6` from `main`. Start every round on a new branch from `main`. Check `git branch --show-current` before committing (round 6).
3. **Do not force-push to fix a mistake.** Move the commit to a new branch and leave the old remote branch alone, then say so (round 6).
4. **Draft PR, then merge only when asked.** Open a draft PR for each round. Mark it ready and merge only when Jimmy says "Merge". GitHub will not merge a draft (rounds 1 to 6).
5. **Keep model names out of commits and PRs.** The Co-Authored-By line uses the generic `Claude <noreply@anthropic.com>` (round 1).

## 7. Testing

1. **Check a method against every case, not a few.** The counting-board method was checked against every sum and difference up to 300 (134,850 cases), and against how many steps each takes (round 7).
2. **Run the logic tests after every change.** `node tests/roman.test.js` covers the converter, the checker, the calculator, and the repairs. There are 27 tests as of round 6.
3. **Run a headless browser check on each changed screen.** Check for page errors, horizontal overflow at 1024px and 390px, and screenshot each changed tab. Open hidden panels before clicking into them (rounds 3 to 6).
4. **Check each look defines every variable.** A look missing a variable falls back to something unexpected. A quick script catches it (round 3).
