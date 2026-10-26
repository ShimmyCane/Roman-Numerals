# Convo v0.15 — Jimmy's eleventh round: the Purpose tab

Jimmy asked for a new first tab, Purpose (the pun is intended), for parents and for the child doing the learning.

## What changed

- **Purpose tab, first.** It opens by default. Four parts:
  1. **Why we are doing this website.** Jimmy's own words: lesson six for this week of October twenty-sixth, the two lessons (fixing Roman numerals by the ORMC rules, and simple addition and subtraction without changing back to our numbers), and the quiz as scaffolding. The tab numbers are Roman numerals (Tab II, Tab III, Tab IV, Tab VI), which match the new tab order, so the page has no Arabic numerals.
  2. **For the learner.** A short explanation of why, and two questions to think about and talk about in class: what they enjoy most, and what is trickiest about Roman numerals.
  3. **A note to parents.** Jimmy's note on "why are we learning this?", in his words, including the honest appraisal and "Feedback welcome. Please text me." No phone number is on the page.
  4. **Show more: every tab, in detail.** A disclosure that describes each tab and the settings.
- **Add & Subtract: two random buttons.** The dice (left) makes an easier equation with two numerals. The chili (right, 🌶️) makes a harder one with three numerals, with additions and subtractions mixed. The chili has an accessible name, "Harder random equation".
- **Add & Subtract: practice at the bottom.** "Now practice presenting this problem and its solution": Record, Stop, and each take plays back under the problem it was recorded for.
  - Recordings stay in this page's memory only. They are never uploaded, and they are gone when the page closes. Up to five takes are kept.
  - If the browser has no microphone access, or it is refused, the page says so and nothing breaks.
- **Long Ago: a quick index at the top.** One line for each part of the tab, with links to it.

## Checked

- `node tests/roman.test.js`: 38 pass. The random equation test now checks easy (two numerals) and harder (three numerals) separately, over 1,000 equations each, and checks that additions and subtractions are mixed.
- Browser check with a fake microphone: Purpose opens first; no digits in visible text on any tab except Long Ago; the chili is on the right; easy gives two numerals and harder gives three; recording saves and plays back; a refused microphone shows the message; the index links work; no page errors; no sideways scroll at phone width.

## Open questions

- Should the parents' note have a phone number, or stay as "text me"?
- Should Purpose show the lesson dates by week, so next week's lesson can be added in the same place?
