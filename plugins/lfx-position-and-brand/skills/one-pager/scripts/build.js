#!/usr/bin/env node
/* Build the one pager.
   usage: node build.js <input.json> [out_dir]
   writes <Name>_One_Pager.html (letter, print-ready) and, when puppeteer is installed, <Name>_One_Pager.pdf. */
const fs = require("fs"), path = require("path");
const { toProject, contentFor } = require("./shim");
const { opHtml } = require("./sheet");

(async () => {
  const [inp, out = "."] = process.argv.slice(2);
  if (!inp) throw new Error("usage: node build.js <input.json> [out_dir]");
  const p = toProject(JSON.parse(fs.readFileSync(inp, "utf8")));
  const missing = ["mh", "bp", "kit"].filter(k => !p.content[k]);
  if (missing.length) throw new Error("Input is missing content: " + missing.join(", "));
  const k = contentFor(p, "kit"), body = opHtml(p);
  const sheet = body.slice(body.indexOf('<div class="sheet"'), body.lastIndexOf("</div></div>"));
  const name = p.name.replace(/\s*\(.*\)/, "").replace(/[^A-Za-z0-9]+/g, "_") + "_One_Pager";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${p.name} one pager</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(k.font).replace(/%20/g, "+")}:wght@300;400;500;600;700&display=swap">
<style>@page{size:8.5in 11in;margin:0}html,body{margin:0}body{background:#E9EDF2}.sheet{position:relative!important;width:816px;height:1056px;overflow:hidden;margin:24px auto;background:#fff;color:#1F2937;font-size:14px;line-height:1.5;transform:none!important}
@media print{body{background:none}.sheet{margin:0}}</style></head><body>${sheet.replace(' id="sheet"', "")}</body></html>`;
  fs.mkdirSync(out, { recursive: true });
  const htmlFile = path.join(out, name + ".html"); fs.writeFileSync(htmlFile, html);
  let pdfFile = null, note = "";
  try { const puppeteer = require("puppeteer"); const b = await puppeteer.launch({ headless: "shell", args: ["--no-sandbox"] }); const pg = await b.newPage();
    await pg.setContent(html, { waitUntil: "networkidle0", timeout: 30000 }).catch(() => {}); await pg.evaluateHandle("document.fonts.ready");
    pdfFile = path.join(out, name + ".pdf"); await pg.pdf({ path: pdfFile, width: "8.5in", height: "11in", printBackground: true, pageRanges: "1" }); await b.close();
  } catch (e) { note = "PDF skipped: " + e.message.split("\n")[0]; }
  console.log(JSON.stringify({ html: htmlFile, pdf: pdfFile, logos: !!p.logos, note }, null, 1));
})().catch(e => { console.error("ERROR: " + e.message); process.exit(1); });
