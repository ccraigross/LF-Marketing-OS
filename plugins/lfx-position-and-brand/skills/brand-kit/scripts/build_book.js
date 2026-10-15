#!/usr/bin/env node
/* Build the 16-page brand kit book.
   usage: node build_book.js <input.json> [out_dir]
   writes <Name>_Brand_Kit.html (letter landscape, print-ready) and, when puppeteer is installed, <Name>_Brand_Kit.pdf. */
const fs = require("fs"), path = require("path");
const { toProject } = require("./shim");
const { kitHtmlDoc, KIT_SECTIONS } = require("./book");

(async () => {
  const [inp, out = "."] = process.argv.slice(2);
  if (!inp) throw new Error("usage: node build_book.js <input.json> [out_dir]");
  const p = toProject(JSON.parse(fs.readFileSync(inp, "utf8")));
  const missing = ["kit", "mh", "bp"].filter(k => !p.content[k]);
  if (missing.length) throw new Error("Input is missing content: " + missing.join(", "));
  const name = p.name.replace(/\s*\(.*\)/, "").replace(/[^A-Za-z0-9]+/g, "_") + "_Brand_Kit";
  const html = kitHtmlDoc(p);
  fs.mkdirSync(out, { recursive: true });
  const htmlFile = path.join(out, name + ".html"); fs.writeFileSync(htmlFile, html);
  let pdfFile = null, note = "";
  try { const puppeteer = require("puppeteer"); const b = await puppeteer.launch({ headless: "shell", args: ["--no-sandbox"] }); const pg = await b.newPage();
    await pg.setContent(html, { waitUntil: "networkidle0", timeout: 30000 }).catch(() => {}); await pg.evaluateHandle("document.fonts.ready");
    pdfFile = path.join(out, name + ".pdf"); await pg.pdf({ path: pdfFile, width: "11in", height: "8.5in", printBackground: true }); await b.close();
  } catch (e) { note = "PDF skipped: " + e.message.split("\n")[0]; }
  console.log(JSON.stringify({ html: htmlFile, pdf: pdfFile, pages: KIT_SECTIONS, logos: !!p.logos, note }, null, 1));
})().catch(e => { console.error("ERROR: " + e.message); process.exit(1); });
