# Input contract

The same renderer input the `lfx-mos-brand-positioning` renderers take, so one assembled object (or one folder of skill outputs) feeds the one pager, the deck template and the website.

```json
{
  "project": { "name": "Akrites", "domain": "akrites.org", "short": "Akrites" },
  "content": {
    "mh":  { "umbrella": "…", "line": "…", "pillars": [{ "t": "…", "m": "…", "p": [["proof", "Website"]] }], "found": "…", "aud": [["Audience", "Lead with"]] },
    "mf":  { "mission": "…", "vision": "…", "tagline": "…", "goals": [{ "id": "membership", "vp": "…", "key": "…", "bite": "…" }], "say": [], "avoid": [["Avoid", "Use"]] },
    "icp": [ "…optional…" ],
    "nums": [["4", "steps from intake to disclosure"], ["[00]", "[metric, from LFX]"]],
    "bp":  [{ "l": "One-liner", "max": 15, "t": "…" }, { "l": "25 words", "t": "…" }, { "l": "50 words", "t": "…" }, { "l": "100 words", "t": "…" }],
    "faq": [["Group", [["Question?", "Answer.", "Website"], ["Unanswered?", null, null]]]],
    "kit": { "colors": [["Name", "#1C1634", "Role"]], "font": "Saira", "fontNote": "…", "attrs": [["Attribute", "How it shows up"]], "dark": "#1C1634", "accent": "#AA9CE5", "spark": "#F9B30E", "word": "AKRITES" }
  },
  "logos": { "light": "<svg …>", "dark": "<svg …>", "symbol": "0 0 300 176.5", "file": "akrites.zip" }
}
```

| Field | Required | Used for |
|---|---|---|
| `project.name`, `project.domain` | yes | Titles, canonical URLs, sitemap, llms.txt, JSON-LD. Domain without `https://`. |
| `project.short` | no | Nav, buttons ("Join Akrites"). Defaults to the name without a parenthetical. |
| `content.mh` | yes | Hero, pillars, About sections and audiences. |
| `content.bp` | yes | Read by position: `bp[1]` SEO descriptions, `bp[2]` site description, `bp[3]` About intro. |
| `content.kit` | yes | `dark`, `accent`, `spark`, `font`. Colours go through the WCAG tokens in `sitegen.js`. |
| `content.mf` | no | Mission, vision, goal-led intros and closing CTA; `avoid` list check. |
| `content.nums` | no | Key numbers band; `[00]` placeholders are skipped. |
| `content.faq` | no | Home FAQ and FAQPage structured data (answered questions only). |
| `content.icp` | no | Recorded in `meta.from`; not rendered in v0.1. |
| `logos.light` / `logos.dark` | no | SVG **text**. `dark` is the white/reversed logo for the footer; falls back to `light`, recoloured where needed. |
| `logos.symbol` | no | viewBox that crops the symbol out of `light`; becomes the favicon. |

## site.json
The build turns the input into `site.json`, which is inside every zip and is what `edit.html` edits. `node build.js site.json <out_dir>` rebuilds from it. Shape: `{ version, project, brand, social, signup, announcement, pages: { home, about, governing_board, technical_committee, members, contact, events, blog, get_involved, join, campaign }, voice, meta }`. The editable fields per page are `FIELDS` in `scripts/sitegen.js`.
