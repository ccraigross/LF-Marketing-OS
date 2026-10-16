# lfx-mos-website · v0.1.0

Builds a Linux Foundation project's website from its brand and positioning kit, checked for WCAG 2.2 AA, as a .zip with an offline copy editor. Use it beside `lfx-mos-brand-positioning`.

## How to run it

Replace the [brackets] with the project's details. Run it in the same conversation as the brand and positioning skills, or point it at the folder that holds their outputs.

### Option A · Kit and website in one prompt

```
Build the full brand and positioning kit for [Project name] ([domain]) with the lfx-mos-brand-positioning plugin (messaging-framework, boilerplates, faq, brand-kit), then build the website with the lfx-mos-website plugin. Sources: [website], [press release link or attached file], [deck or integrated marketing plan, if any]. Logo files: [attached SVGs or zip]. Notes: [audience, words to avoid]. Save every output to one folder, give me the website .zip, and tell me the WCAG audit result, how many placeholders are left and which sources couldn't be read.
```

### Option B · The kit already exists

**From this conversation or a folder**

```
Build the website for [Project] ([domain]) from the messaging framework, boilerplates, FAQ and brand kit [in this conversation / in the outputs folder], with the logo files [attached / in the folder]. Give me the .zip and the WCAG audit result.
```

**From the Marketing OS Kit**

```
Build the website for [Project] from its content and logos in the Marketing OS Kit. Give me the .zip and the WCAG audit result.
```

### Then make copy edits

1. Unzip and open `edit.html` in a browser. It works offline.
2. Pick a page on the left, edit the fields and watch the preview (desktop or mobile). "Before launch" lists the placeholders and avoid-list phrases left on that page.
3. Click **Download .zip**. The new zip holds the edited site and the editor, so you can keep going. Edits are also kept in your browser until you download.

### Re-check after editing

```
Here's the edited site.json for [Project]. Rebuild the website zip from it and re-run the WCAG check.
```

### What you get

- 11 pages: Home, About, Governing Board, Technical Committee, Members, Contact, Events, News, Get involved, Join, Campaign
- `edit.html`: the offline copy editor
- The project's real logos, colours and typeface from the brand kit
- Newsletter sign-up with the LF consent text, and a cookie choice bar
- JSON-LD in every page, `sitemap.xml`, `robots.txt`, `llms.txt`, a 404 page
- `ACCESSIBILITY.md` with the audit result, and `site.json` with every field

### Before launch

- Replace the [bracketed] placeholders: board, members, events and contacts the sources don't cover.
- Connect the sign-up form: add the LFX form endpoint under Site settings in the editor.
- Colours, fonts and layout can't be changed in the editor. To change them, update the brand kit and rebuild.
- A framework or brand kit change means a fresh build, which doesn't carry over copy edits from the old zip.
