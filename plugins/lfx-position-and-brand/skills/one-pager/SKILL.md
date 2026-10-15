---
name: one-pager
description: "This skill should be used to \"build the one pager\", \"make a project one-sheet\", \"make a one-page PDF for members and partners\" or \"regenerate the one pager\" for a Linux Foundation project in the LFX Marketing OS. It renders a letter-size page (HTML and PDF) from the message house, the 50-word boilerplate and the brand kit.\n"
metadata:
  version: "0.4.0"
---

# One pager

A renderer: it lays out content the drafting skills returned and never writes copy. Input: `references/render-input.md`. Code: `scripts/` (same output as the Kit prototype).

## Run
1. Check the input has `content.mh`, `content.bp` and `content.kit`. If any is missing, stop and say which skill to run first.
2. Write the input object to a file, then:
   ```
   cd scripts && npm install        # first run only; installs puppeteer for the PDF
   node build.js <input.json> <out_dir>
   ```
3. The script prints JSON with `html` (always) and `pdf` (when headless Chrome is available; otherwise `note` says why it was skipped). The HTML is print-ready at 8.5 × 11 in, so "Print → Save as PDF" gives the same result.

## Layout (fixed, one page)
- Dark band in `kit.dark`: real logo (or placeholder mark), brand line in `kit.accent`, umbrella message.
- The 50-word boilerplate (`bp[2]`).
- The three pillars, each with title, supporting message and the first two proof points; first pillar ruled in `kit.spark`.
- "Who it's for": the four audiences from `mh.aud`.
- Footer: "Get involved" and the domain.

## Rules
- The one pager has no copy of its own: it always pulls from the message house and the 50-word boilerplate, so edits are made there and the page is rebuilt.
- Never change the content. Fix copy in the drafting skill, then rebuild.
- If the page overflows (long pillar copy), say so; the fix is shorter copy in the message house, not a smaller font.
