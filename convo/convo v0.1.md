# Convo v0.1 — Roman Numerals

Clarifying questions after the first conversation. Jimmy: please answer inline under each question (leave the question as-is).

## Rules and content

1. **ORC Rules 1–5:** please paste the exact wording of each rule (or the ORC source). Until then the Rules tab and Fix It will use only the standard rules as placeholders, marked as such.
   - Answer:
   Rule 1: if there are a few equal basic roman numerals in a row, add them. no more than three equal basic numerals in a row are allowed.
   2: if one or a few equal smaller basic roman numerals are to the right of a greater one, we add them. No more than three smaller equal basic numerals aer allowed.
   3: if a smaller basic roman numeral is to the left of a greater one, we subtract it. It is not allowed to put a few smaller equal basic numerals to the left of a greater one.
   4: hidden for now, on purpose. Likely something that minimizes ambiguity
   5: subject to all other rules, one should write a roman numeral in the simplest possible form.

2. **Number range:** should the tool go up to 3999 (I–M with bars not needed), or only up to a smaller range such as 1–100 or 1–1000?
   - Answer:Use M, so I'm thinking up to 3000.

3. **Accepted forms:** when a student enters IIII or XXXX, should the tool accept them as valid (common on clock faces and inscriptions) and recommend IV / XL, or flag them as wrong?
   - Answer: flag as wrong, rule 1, 5. recommend the repair. This is pure math, not clock faces

## Audience and tone

4. **Age and reading level:** are the learners literally second graders, or older ORCUCLA students who want a second-grade-style visual? Any reading level to target?
   - Answer:2nd graders. Limit reading level to target

5. **Historical framing:** may the tool say that decomposition is a teaching model, not how Romans calculated (they mainly used a counting board / abacus)? Should it mention that?
   - Answer: yes. Also add a tab on historical facts, such as how romans calculated. Did they use roman numerals at all?

## Math scope

6. **Operations:** MVP is addition and subtraction of two numerals. Should it also allow multi-step problems (e.g., XL + XX − IX), or negative results (which Romans did not have as numerals)?
   - Answer: yes to multistep. append historical facts tab

7. **Result regrouping:** when cancelling leaves an unusual result (e.g., XXXI from XL − IX), should the tool always show the regroup step, or only in Quick mode / on request?
   - Answer: show the work. explain it/ trace it for a 2nd grader. Make things graphical.

## Tabs and priority

8. **MVP tabs:** I proposed Letters, Build & Break, Add & Subtract, Fix It, and Rules in the MVP, with Problem Lab and Explain & Playback later. Agree, or change?
   - Answer: add historical tab.

9. **Problem Lab:** when it comes later, should students type any sample problem, or should the teacher choose from a list?
   - Answer: allow students to type any sample problem

10. **Recording tab:** voice recording stays on the device only (no upload, no accounts). OK? Should there be a playback limit or a way to delete recordings?
    - Answer: yes

## Delivery

11. **Hosting and repo:** when the MVP is ready, should it go to its own GitHub repo (e.g., `Roman-Numerals`) and GitHub Pages, as the other kids' apps do? Any name preference?
    - Answer: yes, it will go into a separate repo when ready. Call it Roman Numerals - ORMC

12. **Progress:** should the MVP track anything (e.g., which letters a student has mastered), or stay stateless?
    - Answer: feedback on the quiz. Quizzes should allow for multiple rounds for rote memorization. Dial it in on the questions missed, quick 5 questions.
