/* editor.js — the offline copy editor inside edit.html.
   Reads site.json from the page, edits copy only (colours, fonts and layout come from the brand kit), previews with SiteGen,
   and downloads a new .zip that contains the updated site and this editor again. No network, no dependencies.
   Keep this file free of the literal sequences "</scr" + "ipt" and "<!" + "--": it is embedded inside a script tag. */
(function () {
  "use strict";
  var S = window.SiteGen;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var original = JSON.parse(document.getElementById("site-data").textContent);
  var SRC = { engine: document.getElementById("sitegen").textContent, editor: document.getElementById("site-editor").textContent };
  var KEY = "lfx-mos-website:" + S.slug(original.project.name) + ":" + ((original.meta && original.meta.generated_at) || "");
  var site = clone(original), cur = "home", mobile = false, timer = null, uid = 0;
  var PAGE_KEYS = S.PAGES.map(function (p) { return p.key; }).concat(["settings"]);
  var label = function (k) { return k === "settings" ? "Site settings" : S.PAGES.filter(function (p) { return p.key === k; })[0].title; };

  function store(v) { try { if (v === undefined) return localStorage.getItem(KEY); if (v === null) localStorage.removeItem(KEY); else localStorage.setItem(KEY, v); } catch (e) { return null; } }
  function get(o, path) { return path.split(".").reduce(function (a, k) { return a == null ? undefined : a[k]; }, o); }
  function set(o, path, v) { var ks = path.split("."), a = o; ks.slice(0, -1).forEach(function (k, i) { if (a[k] == null) a[k] = /^\d+$/.test(ks[i + 1]) ? [] : {}; a = a[k]; }); a[ks[ks.length - 1]] = v; }
  function say(msg) { var s = document.getElementById("status"); if (s) { s.textContent = ""; setTimeout(function () { s.textContent = msg; }, 30); } }
  var dirty = function () { return JSON.stringify(site) !== JSON.stringify(original); };

  /* ------------------------------------------------------------ shell */
  var app = document.getElementById("app");
  var draft = null; try { draft = JSON.parse(store() || "null"); } catch (e) { draft = null; }
  if (draft && !S.isSite(draft)) draft = null;
  app.innerHTML =
    '<header class="bar"><h1>Edit the ' + esc(site.project.name) + ' website</h1><span class="status" id="status" role="status" aria-live="polite"></span><span class="sp"></span>' +
    '<button type="button" class="btn" id="open">Open site.json</button><input type="file" id="file" accept=".json,application/json" hidden aria-label="Choose a site.json file">' +
    '<button type="button" class="btn" id="dljson">Download site.json</button><button type="button" class="btn" id="reset">Reset to generated copy</button>' +
    '<button type="button" class="btn primary" id="dlzip">Download .zip</button></header>' +
    (draft && JSON.stringify(draft) !== JSON.stringify(original) ? '<div style="padding:12px 16px 0"><div class="notice" id="draftbox"><span>You have unsaved edits from an earlier session in this browser.</span><button type="button" class="btn sm" id="restore">Restore my edits</button><button type="button" class="btn sm" id="discard">Discard them</button></div></div>' : "") +
    '<div class="layout"><nav class="pages" aria-label="Pages" id="pages"></nav>' +
    '<section class="fields" aria-labelledby="fh"><h2 id="fh" tabindex="-1" style="margin:0;font-size:18px;color:var(--ink)"></h2><div class="checks" id="checks"></div><div id="form" class="fields"></div></section>' +
    '<section class="preview" aria-label="Preview"><div class="ptools"><span class="addr" id="addr"></span>' +
    '<button type="button" class="btn sm" id="wd" aria-pressed="true">Desktop</button><button type="button" class="btn sm" id="wm" aria-pressed="false">Mobile</button></div>' +
    '<div class="frame" id="frame"><iframe id="pv" title="Preview of the page"></iframe></div>' +
    '<p class="status" style="margin-top:8px">The preview uses the same engine as the zip. Colours, fonts and layout come from the brand kit and are checked for WCAG 2.2 AA; copy edits here can\'t change them.</p></section></div>';

  /* ------------------------------------------------------------ page list + checks */
  function counts() {
    var c = S.check(site), by = {};
    c.placeholders.concat(c.avoid, c.seo, c.links).forEach(function (x) { by[x.page] = (by[x.page] || 0) + 1; });
    return { c: c, by: by };
  }
  function renderNav() {
    var k = counts().by;
    document.getElementById("pages").innerHTML = PAGE_KEYS.map(function (p) {
      var n = k[p] || 0;
      return '<button type="button" data-p="' + p + '"' + (p === cur ? ' aria-current="true"' : "") + '><span>' + esc(label(p)) + '</span>' + (n ? '<span class="cnt"><span class="sr-only">, </span>' + n + '<span class="sr-only"> to fix</span></span>' : "") + "</button>";
    }).join("");
  }
  function fieldLabel(path) {
    var best = null;
    (S.FIELDS[cur] || []).forEach(function (f) { if (path === f.k || path.indexOf(f.k + ".") === 0) best = f; });
    if (!best) return path;
    if (best.t !== "objs") return best.l;
    var rest = path.slice(best.k.length + 1).split("."), i = +rest[0], key = rest[1], sub = (best.keys.filter(function (x) { return x[0] === key; })[0] || [key, key])[1];
    return best.l + " " + (i + 1) + ": " + sub;
  }
  function renderChecks() {
    var c = counts().c, page = cur, items = [];
    c.placeholders.filter(function (x) { return x.page === page; }).forEach(function (x) { items.push([x.field, "Replace placeholder " + x.text + " in " + fieldLabel(x.field)]); });
    c.avoid.filter(function (x) { return x.page === page; }).forEach(function (x) { items.push([x.field, '"' + x.phrase + '" is on the avoid list' + (x.use ? ': use "' + x.use + '"' : "") + " (" + fieldLabel(x.field) + ")"]); });
    c.seo.filter(function (x) { return x.page === page; }).forEach(function (x) { items.push(["pages." + page + ".seo_description", x.issue]); });
    c.links.filter(function (x) { return x.page === page; }).forEach(function (x) { items.push([x.field, "Link isn't a web address, site path or #anchor: " + x.url]); });
    var total = c.total;
    document.getElementById("checks").innerHTML = '<h2>Before launch</h2>' + (items.length
      ? '<ul>' + items.map(function (it) { return '<li>' + esc(it[1]) + ' <button type="button" class="btn sm" data-go="' + esc(it[0]) + '">Go to field</button></li>'; }).join("") + "</ul>"
      : '<p class="ok" style="margin:0;font-size:13px">Nothing to fix on this page.</p>') +
      '<p class="status" style="margin:6px 0 0">' + total + " item" + (total === 1 ? "" : "s") + " across the site.</p>";
  }

  /* ------------------------------------------------------------ form */
  function input(path, lab, type, hint) {
    var id = "f" + (++uid), v = get(site, path);
    if (type === "lines") v = (v || []).join("\n");
    var ctl = type === "text" ? '<input type="text" id="' + id + '" data-path="' + esc(path) + '" value="' + esc(v) + '">'
      : '<textarea id="' + id + '" data-path="' + esc(path) + '"' + (type === "lines" ? ' data-lines="1"' : "") + (hint ? ' aria-describedby="' + id + 'h"' : "") + ">" + esc(v) + "</textarea>";
    if (type === "text" && hint) ctl = ctl.replace("<input ", '<input aria-describedby="' + id + 'h" ');
    return '<div class="f"><label for="' + id + '">' + esc(lab) + "</label>" + ctl + (hint ? '<span class="hint" id="' + id + 'h">' + esc(hint) + "</span>" : "") + "</div>";
  }
  var single = function (l) { return l.replace(/\s*\(.*\)$/, "").replace(/ies$/, "y").replace(/s$/, ""); };
  function objs(f) {
    var list = get(site, f.k) || [], name = single(f.l);
    return '<fieldset><legend>' + esc(f.l) + "</legend>" + (f.h ? '<span class="hint" style="font-size:12.5px;color:var(--muted)">' + esc(f.h) + "</span>" : "") +
      list.map(function (o, i) {
        return '<div class="obj"><div class="objbar"><b>' + esc(name) + " " + (i + 1) + "</b>" +
          '<button type="button" class="btn sm" data-move="' + esc(f.k) + '" data-i="' + i + '" data-d="-1"' + (i === 0 ? " disabled" : "") + ' aria-label="Move ' + esc(name) + " " + (i + 1) + ' up">Up</button>' +
          '<button type="button" class="btn sm" data-move="' + esc(f.k) + '" data-i="' + i + '" data-d="1"' + (i === list.length - 1 ? " disabled" : "") + ' aria-label="Move ' + esc(name) + " " + (i + 1) + ' down">Down</button>' +
          '<button type="button" class="btn sm" data-del="' + esc(f.k) + '" data-i="' + i + '" aria-label="Remove ' + esc(name) + " " + (i + 1) + '">Remove</button></div>' +
          f.keys.map(function (k) { return input(f.k + "." + i + "." + k[0], k[1], k[2] || "text"); }).join("") + "</div>";
      }).join("") + '<div><button type="button" class="btn sm" data-add="' + esc(f.k) + '">Add ' + esc(name.toLowerCase()) + "</button></div></fieldset>";
  }
  function renderForm(focusPath) {
    document.getElementById("fh").textContent = label(cur);
    document.getElementById("form").innerHTML = (S.FIELDS[cur] || []).map(function (f) { return f.t === "objs" ? objs(f) : input(f.k, f.l, f.t, f.h); }).join("");
    if (focusPath) { var el = document.querySelector('[data-path="' + focusPath + '"]') || document.querySelector('[data-add="' + focusPath + '"]'); if (el) el.focus(); }
  }

  /* ------------------------------------------------------------ preview */
  function renderPreview() {
    var key = cur === "settings" ? "home" : cur, pv = document.getElementById("pv"), y = 0;
    try { y = pv.contentWindow ? pv.contentWindow.scrollY : 0; } catch (e) { y = 0; }
    pv.onload = function () { try { pv.contentWindow.scrollTo(0, y); } catch (e) { /* cross-origin in some browsers: ignore */ } };
    pv.srcdoc = S.page(site, key, { preview: true });
    pv.title = "Preview of the " + label(key) + " page";
    var path = S.PAGES.filter(function (p) { return p.key === key; })[0].path;
    document.getElementById("addr").textContent = (site.project.domain || "example.org") + path;
    fit();
  }
  /* render the preview at real width (1280 desktop, 390 mobile) and scale it to the space available */
  function fit() {
    var fr = document.getElementById("frame"), pv = document.getElementById("pv"); if (!fr) return;
    var W = mobile ? 390 : 1280, avail = fr.parentNode.clientWidth || W, s = Math.min(1, avail / W), H = Math.max(480, window.innerHeight - 150);
    fr.style.width = Math.round(W * s) + "px"; fr.style.height = H + "px";
    pv.style.width = W + "px"; pv.style.height = Math.round(H / s) + "px"; pv.style.transform = "scale(" + s + ")"; pv.style.transformOrigin = "0 0";
  }
  window.addEventListener("resize", fit);
  function refresh(now) {
    clearTimeout(timer);
    var go = function () { renderPreview(); renderChecks(); renderNav(); if (dirty()) store(JSON.stringify(site)); };
    if (now) go(); else timer = setTimeout(go, 250);
  }
  function show(key, focusHeading) {
    cur = key; renderNav(); renderForm(); refresh(true);
    if (focusHeading) document.getElementById("fh").focus();
  }

  /* ------------------------------------------------------------ events */
  app.addEventListener("input", function (e) {
    var el = e.target, path = el.getAttribute && el.getAttribute("data-path"); if (!path) return;
    set(site, path, el.hasAttribute("data-lines") ? el.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean) : el.value);
    refresh(false);
  });
  app.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button") : null; if (!b) return;
    if (b.hasAttribute("data-p")) return show(b.getAttribute("data-p"));
    if (b.hasAttribute("data-go")) { var t = document.querySelector('[data-path="' + b.getAttribute("data-go") + '"]'); if (t) t.focus(); return; }
    var k, list, i;
    if (b.hasAttribute("data-add")) {
      k = b.getAttribute("data-add"); list = get(site, k) || []; var f = (S.FIELDS[cur] || []).filter(function (x) { return x.k === k; })[0], o = {};
      f.keys.forEach(function (kk) { o[kk[0]] = kk[2] === "lines" ? [] : ""; }); list.push(o); set(site, k, list);
      renderForm(k + "." + (list.length - 1) + "." + f.keys[0][0]); say(single(f.l) + " " + list.length + " added"); return refresh(true);
    }
    if (b.hasAttribute("data-del")) {
      k = b.getAttribute("data-del"); i = +b.getAttribute("data-i"); list = get(site, k) || []; list.splice(i, 1); set(site, k, list);
      renderForm(list.length ? k + "." + Math.max(0, i - 1) + "." + Object.keys(list[Math.max(0, i - 1)])[0] : k); say("Removed"); return refresh(true);
    }
    if (b.hasAttribute("data-move")) {
      k = b.getAttribute("data-move"); i = +b.getAttribute("data-i"); var d = +b.getAttribute("data-d"); list = get(site, k) || [];
      var x = list[i]; list[i] = list[i + d]; list[i + d] = x; set(site, k, list);
      renderForm(); var nb = document.querySelector('[data-move="' + k + '"][data-i="' + (i + d) + '"][data-d="' + d + '"]') || document.querySelector('[data-move="' + k + '"][data-i="' + (i + d) + '"]');
      if (nb) nb.focus(); say("Moved to position " + (i + d + 1)); return refresh(true);
    }
    if (b.id === "wd" || b.id === "wm") { mobile = b.id === "wm"; document.getElementById("wd").setAttribute("aria-pressed", String(!mobile)); document.getElementById("wm").setAttribute("aria-pressed", String(mobile)); return fit(); }
    if (b.id === "restore") { site = clone(draft); document.getElementById("draftbox").parentNode.remove(); show(cur); return say("Earlier edits restored"); }
    if (b.id === "discard") { store(null); document.getElementById("draftbox").parentNode.remove(); return say("Earlier edits discarded"); }
    if (b.id === "reset") { if (window.confirm("Reset every page to the copy generated from the messaging framework? Your edits in this browser will be lost.")) { site = clone(original); store(null); show(cur); say("Reset to the generated copy"); } return; }
    if (b.id === "open") return document.getElementById("file").click();
    if (b.id === "dljson") return download(JSON.stringify(stamp(clone(site)), null, 2), "site.json", "application/json");
    if (b.id === "dlzip") {
      var s2 = stamp(clone(site)), slug = S.slug(s2.project.short || s2.project.name) + "-website";
      var bytes = S.zip(S.files(s2, { engine: SRC.engine, editor: SRC.editor }), slug + "/");
      download(bytes, slug + ".zip", "application/zip"); return say("Downloaded " + slug + ".zip");
    }
  });
  function stamp(s) { if (JSON.stringify(s) !== JSON.stringify(original)) { s.meta = s.meta || {}; s.meta.edited_at = new Date().toISOString(); if (s.meta.audit) s.meta.audit.edited = true; } return s; }
  function download(data, name, type) {
    var url = URL.createObjectURL(new Blob([data], { type: type })), a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  document.getElementById("file").addEventListener("change", function (e) {
    var f = e.target.files && e.target.files[0]; if (!f) return; var r = new FileReader();
    r.onload = function () { try { var s = JSON.parse(r.result); if (!S.isSite(s)) throw new Error("not a site.json"); site = s; show("home"); say("Opened " + f.name); } catch (err) { say("That file isn't a site.json from this tool."); } };
    r.readAsText(f); e.target.value = "";
  });
  window.addEventListener("message", function (e) {
    var k = e.data && e.data.lfxPage; if (k && PAGE_KEYS.indexOf(k) >= 0) show(k, true);
  });
  window.addEventListener("beforeunload", function (e) { if (dirty()) { store(JSON.stringify(site)); } });

  show("home");
})();
