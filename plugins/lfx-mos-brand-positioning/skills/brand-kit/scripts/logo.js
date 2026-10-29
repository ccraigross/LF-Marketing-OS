/* Find the symbol and the wordmark inside a lockup SVG, so the book can show the symbol on its own
   when no symbol crop was supplied. Renders the logo with resvg and looks for the first clear gap:
   a horizontal lockup has the symbol left of the gap, a stacked one has it above.
   Returns { symbol, wordmark } as SVG viewBox strings, or null when the logo has no clear gap. */
function viewBoxOf(svg) {
  const vb = String(svg).match(/viewBox="([^"]+)"/);
  if (vb) { const n = vb[1].trim().split(/[\s,]+/).map(Number); if (n.length === 4 && n.every(isFinite)) return n; }
  const w = +(String(svg).match(/\swidth="([\d.]+)/) || [])[1], h = +(String(svg).match(/\sheight="([\d.]+)/) || [])[1];
  return w && h ? [0, 0, w, h] : null;
}
function detectParts(svg) {
  let Resvg; try { ({ Resvg } = require("@resvg/resvg-js")); } catch (e) { return null; }
  const vb = viewBoxOf(svg); if (!vb) return null;
  const W = 1000, img = new Resvg(svg, { fitTo: { mode: "width", value: W }, background: "rgba(0,0,0,0)" }).render();
  const H = img.height, px = img.pixels, s = img.width / vb[2];
  const on = (x, y) => px[(y * img.width + x) * 4 + 3] > 24;
  const colOn = Array.from({ length: img.width }, (_, x) => { for (let y = 0; y < H; y++) if (on(x, y)) return true; return false; });
  const rowOn = Array.from({ length: H }, (_, y) => { for (let x = 0; x < img.width; x++) if (on(x, y)) return true; return false; });
  const span = (arr, a = 0, b = arr.length) => { let lo = -1, hi = -1; for (let i = a; i < b; i++) if (arr[i]) { if (lo < 0) lo = i; hi = i; } return lo < 0 ? null : [lo, hi + 1]; };
  /* first gap of at least `min` empty pixels after content starts */
  const firstGap = (arr, min) => { const c = span(arr); if (!c) return null; let run = 0;
    for (let i = c[0]; i < c[1]; i++) { if (!arr[i]) { run++; continue; } if (run >= min) return [i - run, i]; run = 0; } return null; };
  const box = (x0, x1, y0, y1) => { const pad = Math.max(x1 - x0, y1 - y0) * .04;
    const f = v => +v.toFixed(2); return [f(vb[0] + (x0 - pad) / s), f(vb[1] + (y0 - pad) / s), f((x1 - x0 + 2 * pad) / s), f((y1 - y0 + 2 * pad) / s)].join(" "); };
  const content = span(colOn), rows = span(rowOn); if (!content || !rows) return null;
  const ok = (w, h) => w / h > .4 && w / h < 2.5;
  /* horizontal lockup: symbol on the left */
  const gx = firstGap(colOn, Math.max(6, Math.round(img.width * .015)));
  if (gx) {
    const cOn = (a, b) => Array.from({ length: H }, (_, y) => { for (let x = a; x < b; x++) if (on(x, y)) return true; return false; });
    const sr = span(cOn(content[0], gx[0])), wr = span(cOn(gx[1], content[1]));
    if (sr && wr && (gx[0] - content[0]) < (content[1] - content[0]) * .6 && ok(gx[0] - content[0], sr[1] - sr[0]))
      return { symbol: box(content[0], gx[0], sr[0], sr[1]), wordmark: box(gx[1], content[1], wr[0], wr[1]), layout: "horizontal" };
  }
  /* stacked lockup: symbol on top */
  const gy = firstGap(rowOn, Math.max(6, Math.round(H * .03)));
  if (gy) {
    const rOn = (a, b) => Array.from({ length: img.width }, (_, x) => { for (let y = a; y < b; y++) if (on(x, y)) return true; return false; });
    const sc = span(rOn(rows[0], gy[0])), wc = span(rOn(gy[1], rows[1]));
    if (sc && wc && ok(sc[1] - sc[0], gy[0] - rows[0]))
      return { symbol: box(sc[0], sc[1], rows[0], gy[0]), wordmark: box(wc[0], wc[1], gy[1], rows[1]), layout: "stacked" };
  }
  return null;
}
module.exports = { detectParts, viewBoxOf };
