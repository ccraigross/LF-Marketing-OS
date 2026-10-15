---
name: presentation-template
description: "This skill should be used to \"build the presentation template\", \"make the project's PowerPoint template\", \"make a Google Slides template\", \"build the slide masters\" or \"regenerate the deck template\" for a Linux Foundation project in the LFX Marketing OS. It renders a 16:9 .pptx with 12 real slide masters and a brand-reference appendix (message house, messaging framework, ICPs, boilerplates, FAQ, brand kit) from content the other skills already produced, plus an HTML preview of every slide.\n"
metadata:
  version: "0.4.0"
---

# Presentation template

A renderer: it lays out content the drafting skills returned and never writes copy. Input: `references/render-input.md`. Code: `scripts/` (same output as the Kit prototype).

## Run
1. Check the input has `content.mh`, `content.bp`, `content.faq` and `content.kit`. If any is missing, stop and say which skill to run first (messaging-framework, boilerplates, faq, brand-kit).
2. Write the input object to a file, then:
   ```
   cd scripts && npm install        # first run only: pptxgenjs, @resvg/resvg-js
   node build.js <input.json> <out_dir>
   ```
3. The script prints JSON: `pptx` (the file), `preview` (an HTML page with every slide at 960×540) and `slides` (the slide list). Return these paths to the caller.

## What it builds
- **Appendix first** ("Appendix · brand reference · delete before presenting"): divider, message house, why now and audiences, messaging framework (when `mf` is present), ICPs (when `icp` is present), boilerplates, FAQ (answered questions only, six per slide), brand kit (logos, colors, type, voice).
- **12 slide masters** that appear in the layout menu in PowerPoint and Google Slides: title, agenda, section header, content, two columns, big statement, key numbers, quote, full-bleed image, member logos, timeline, closing. One example slide per layout, filled from the message house; anything in `[brackets]` is for the deck owner to replace.
- Colors, font and the real logo (SVG rasterized to PNG) from `content.kit` and `logos`; placeholder marks from `kit.word` when there are no logo files.

## Google Slides
Upload the .pptx to Drive and open it with Google Slides (File → Save as Google Slides). All twelve layouts appear under Slide → Apply layout. The brand font is on Google Fonts.

## Rules
- Never change the content. If the copy is wrong, it's fixed in the skill that drafted it, then the template is rebuilt.
- Unanswered FAQ questions are left out; say how many in your reply.
