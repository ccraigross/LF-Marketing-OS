---
name: brand-kit
description: "This skill should be used to \"draft a brand kit\", \"pull brand colors and fonts\", \"make the brand kit for a project\" or \"build the brand kit PDF\" for a Linux Foundation project in the LFX Marketing OS. It reads the project's real logo files, website and brand page, returns the kit tokens (colors, typeface, voice) as JSON, and renders the 16-page brand kit book as HTML and PDF.\n"
metadata:
  version: "0.4.0"
---

# Brand kit

Two parts. **Draft** the tokens (stateless: input in, JSON out, never a database write). **Render** the book from those tokens with `scripts/`.

## Part 1 · Draft `kit`
Input: the shared input object (project, sources, `context.mf` / `context.mh`) plus `logos` (SVG text, see `references/render-input.md`).
Output:
```json
{
  "kit": { "colors": [["Navy", "#1A3A6B", "Logo and dark grounds"], ["White", "#FFFFFF", "Page"], ["Coral", "#F26B4F", "Accent, used sparingly"]],
           "font": "Inter", "fontNote": "…", "attrs": [["Attribute", "How it shows up in copy"]],
           "dark": "#1A3A6B", "accent": "#F26B4F", "spark": "#F26B4F", "word": "PROJECT" },
  "report": { "sources_read": [], "sources_failed": [], "gaps": [], "notes": "" }
}
```
1. **Logos.** Collect every fill and stroke color from the SVGs. No logo files: say so in `report.gaps`; the book uses placeholder marks until they're uploaded. Never draw, describe or reconstruct a logo.
2. **Brand page and site.** The project's `/brand` page if it exists, then the home page and its CSS. Prefer published palette values and the named typeface.
3. **Colors.** 4–5: first the primary dark, second white (or the light ground), then accents. Name each as the brand page does, or plainly. Give each a role. Every hex comes from the logo SVG, the brand page or the site CSS.
4. **Typeface.** The brand's typeface if it's on Google Fonts; otherwise the nearest Google Fonts family, and say so in `fontNote`.
5. **Voice.** Four `attrs` from the messaging framework (positioning, sound bites, say / avoid) and message house in `context`, plus the site's own writing; one sentence each on how it shows up in copy.
6. **Tokens.** `dark` = primary dark, `accent` = main accent, `spark` = the highlight used once per view, `word` = the short name in capitals.

Rules: no invented colors, fonts or marks; every value has a source. US English, sentence case.

## Part 2 · Render the book
Input: `references/render-input.md` (needs `content.kit`, `content.mh`, `content.bp`, and `logos` when available).
```
cd scripts && npm install        # first run only; installs puppeteer for the PDF
node build_book.js <input.json> <out_dir>
```
Prints JSON with `html` (always, print-ready at 11 × 8.5 in) and `pdf` (when headless Chrome is available).

16 pages: cover, contents, logo system, colorways, clear space and minimum size, symbol and symbol in shape, partnership lockup, watchouts, color palette, color contrast (WCAG ratios computed from the palette), typography, iconography, imagery and graphic elements, example usage, voice in brief, back cover.

The book never changes copy or tokens; fix them in Part 1 and re-render.
