#!/usr/bin/env node
/* Build the presentation template.
   usage: node build.js <input.json> [out_dir]
   writes <Name>_Presentation_Template.pptx and <Name>_slides_preview.html, prints a JSON summary. */
const fs = require("fs"), path = require("path");
const PptxGenJS = require("pptxgenjs");
const { Resvg } = require("@resvg/resvg-js");
const { toProject } = require("./shim");
const { pptxDeck, deckName, ptSlides } = require("./deck");

function svgToPng(svg, h) {
  const r = new Resvg(svg, { fitTo: { mode: "height", value: h } }).render();
  return { data: "data:image/png;base64," + Buffer.from(r.asPng()).toString("base64"), ratio: r.width / r.height };
}
(async () => {
  const [inp, out = "."] = process.argv.slice(2);
  if (!inp) throw new Error("usage: node build.js <input.json> [out_dir]");
  const p = toProject(JSON.parse(fs.readFileSync(inp, "utf8")));
  const missing = ["mh", "bp", "faq", "kit"].filter(k => !p.content[k]);
  if (missing.length) throw new Error("Input is missing content: " + missing.join(", "));
  if (p.logos) { const a = svgToPng(p.logos.light, 240), b = svgToPng(p.logos.dark || p.logos.light, 240); p._png = { light: a.data, dark: b.data, ratio: a.ratio }; } else p._png = null;
  fs.mkdirSync(out, { recursive: true });
  const file = path.join(out, deckName(p) + ".pptx");
  await pptxDeck(new PptxGenJS(), p).writeFile({ fileName: file });
  const slides = ptSlides(p), k = p.content.kit;
  const preview = path.join(out, deckName(p) + "_slides_preview.html");
  fs.writeFileSync(preview, `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${p.name} presentation template</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(k.font).replace(/%20/g, "+")}:wght@300;400;500;600;700&family=Inter:wght@400;600&display=swap">
<style>body{margin:0;padding:24px;background:#E9EDF2;font:13px Inter,sans-serif}figure{margin:0 0 24px}figcaption{margin:6px 0 0;color:#475569}.s{box-shadow:0 2px 12px rgba(0,0,0,.15)}</style></head><body>
${slides.map((s, i) => `<figure><div class="s">${s.html}</div><figcaption>${i + 1}. ${s.group}: ${s.name}</figcaption></figure>`).join("\n")}</body></html>`);
  console.log(JSON.stringify({ pptx: file, preview, slides: slides.map(s => `${s.group}: ${s.name}`), logos: !!p.logos }, null, 1));
})().catch(e => { console.error("ERROR: " + e.message); process.exit(1); });
