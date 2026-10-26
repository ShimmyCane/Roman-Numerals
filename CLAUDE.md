# Roman Numerals — Claude Code pointer

Purpose: a visual, kid-friendly web tool for the ORMC Roman numerals unit. Decompose numerals into their parts, add and subtract, repair malformed numerals, and review letters and rules I–M.

- Design: `schematic.md` (draft v0.1, awaiting review)
- Questions and answers: `convo/` (current: `convo v0.1.md`). Never compact an old convo; start a new version.
- AI notes: `04 AI/Roman Numerals/brief.md` and `lessons.md`

How to run: open `index.html` in a browser (tablet width). No build step, no server.
Logic tests: `node tests/roman.test.js` (pure logic in `roman.js`; the page is `index.html` + `app.js` + `styles.css`).

Rules:
- The ORC Rules 1–5 wording is not yet supplied. Do not invent rule text; ask Jimmy first.
- Calculation is a teaching model. Label it as such in the UI and docs; do not present it as a documented Roman method.
- No student data is stored or uploaded. Recordings (later tab) stay on the device.
