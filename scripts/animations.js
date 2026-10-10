/* Manapad Coastal Energy Hub — illustrations, map overlays and scene animations.
   - Map overlay layers are built from window.SITE (image-pixel coordinates).
   - Illustrations are original SVG, generated from small reusable helpers.
   - Each scene exposes enter(ctx)/exit(ctx). ctx tracks timers and rAF so nothing
     keeps running after a scene becomes inactive. */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const S = window.SITE;

  /* ---------------------------------------------------------------- helpers */
  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "style") n.setAttribute("style", attrs[k]);
      else n.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(n);
    return n;
  }
  const pts = (s) => s.trim().split(/\s+/).map((p) => p.split(",").map(Number));
  const polyD = (arr, close) => "M" + arr.map((p) => p.join(",")).join(" L") + (close ? " Z" : "");
  function smoothD(arr) { // Catmull-Rom to cubic Bezier, open path
    let d = `M${arr[0][0]},${arr[0][1]}`;
    for (let i = 0; i < arr.length - 1; i++) {
      const p0 = arr[i - 1] || arr[i], p1 = arr[i], p2 = arr[i + 1], p3 = arr[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
    }
    return d;
  }
  function setLen(path) { try { const L = Math.ceil(path.getTotalLength()); path.style.setProperty("--len", L); } catch (e) { /* not rendered yet */ } }
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const reduced = () => document.documentElement.classList.contains("reduce-motion") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Tween a group along an SVG path. Resolves when done or when ctx is disposed. */
  function moveAlong(ctx, node, path, dur, opts) {
    opts = opts || {};
    const L = path.getTotalLength();
    const from = opts.reverse ? 1 : 0, to = opts.reverse ? 0 : 1;
    const place = (t) => {
      const u = from + (to - from) * t, p = path.getPointAtLength(u * L);
      let a = 0;
      if (opts.rotate) {
        const q = path.getPointAtLength(Math.min(L, Math.max(0, u * L + (opts.reverse ? -1 : 1))));
        a = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
      }
      node.setAttribute("transform", `translate(${p.x.toFixed(2)},${p.y.toFixed(2)})${opts.rotate ? ` rotate(${a.toFixed(1)})` : ""}${opts.scale ? ` scale(${opts.scale})` : ""}`);
    };
    if (reduced()) { place(1); return Promise.resolve(); }
    return new Promise((res) => {
      const t0 = performance.now();
      const step = (now) => {
        if (!ctx.alive()) return res();
        const t = Math.min(1, (now - t0) / dur);
        place(opts.linear ? t : easeInOut(t));
        if (t < 1) ctx.raf(step); else res();
      };
      ctx.raf(step);
    });
  }

  /* ------------------------------------------------- shared SVG symbols */
  function buildSymbols() {
    const holder = el("svg", { width: 0, height: 0, "aria-hidden": "true", style: "position:absolute;width:0;height:0;overflow:hidden" });
    document.body.prepend(holder);
    holder.innerHTML = `
    <defs>
      <!-- FRP fishing boat, side view, bow to the right. Outboard at stern. -->
      <g id="boat-body">
        <path d="M8,26 Q150,36 292,2 Q264,42 232,56 L40,60 Q14,58 8,26 Z" fill="#ece6d6"/>
        <path d="M8,26 Q150,36 292,2 L286,12 Q150,44 10,35 Z" fill="#2e6e8e"/>
        <path d="M30,56 L232,54 Q226,57 220,60 L40,61 Z" fill="#7a3b2e"/>
        <path d="M70,32 L70,38 M130,35 L130,41 M190,31 L190,37" stroke="#b8b09c" stroke-width="2"/>
        <rect x="-14" y="28" width="7" height="34" fill="#2a2f34"/>
        <path d="M-18,60 h16 l-3,8 h-10 z" fill="#2a2f34"/>
      </g>
      <symbol id="sym-boat" viewBox="-30 -10 340 90">
        <use href="#boat-body"/>
        <rect x="-22" y="6" width="26" height="22" rx="5" fill="#3a4148"/>
      </symbol>
      <symbol id="sym-boat-e" viewBox="-30 -10 340 90">
        <use href="#boat-body"/>
        <rect x="-22" y="6" width="26" height="22" rx="5" fill="#d9d4c6"/>
        <rect x="-22" y="16" width="26" height="4" fill="#57c46e"/>
        <rect x="40" y="18" width="34" height="14" rx="2" fill="#e9b23f" transform="rotate(4 57 25)"/>
      </symbol>
      <!-- Standing person, silhouette (colour via fill on <use>) -->
      <symbol id="sym-person" viewBox="0 0 40 100">
        <circle cx="20" cy="10" r="7.5"/>
        <path d="M11,21 Q20,17 29,21 L31,52 L9,52 Z"/>
        <path d="M9,50 L31,50 L33,92 L7,92 Z"/>
        <path d="M11,23 L4,52 L8,53 L15,30 Z M29,23 L36,52 L32,53 L25,30 Z"/>
        <path d="M10,92 h8 v6 h-9 z M22,92 h8 v6 h-9 z"/>
      </symbol>
      <symbol id="sym-jerry" viewBox="0 0 40 50">
        <path d="M4,10 L30,10 L36,16 L36,48 L4,48 Z" fill="#9b4a36"/>
        <path d="M10,4 h12 v6 h-12 z M28,4 l6,0 l0,8 l-4,0 z" fill="#7a3a2b"/>
        <path d="M8,18 L32,44 M32,18 L8,44" stroke="#7a3a2b" stroke-width="2"/>
      </symbol>
    </defs>`;
  }

  /* Battery module — deliberately generic: no handle, size or connector implied. */
  function battery(parent, x, y, s, soc, extraClass) {
    const g = el("g", { transform: `translate(${x},${y}) scale(${s})`, class: "batt " + (extraClass || "") }, parent);
    el("rect", { x: -18, y: -26, width: 36, height: 52, rx: 4, fill: "#26323b", stroke: "#cfd6da", "stroke-width": 1.6 }, g);
    el("rect", { x: -8, y: -31, width: 16, height: 5, rx: 1.5, fill: "#cfd6da" }, g);
    const col = soc > 0.6 ? "#57c46e" : soc > 0.3 ? "#e9b23f" : "#e98c5a";
    const n = 4;
    for (let i = 0; i < n; i++) {
      const on = (i + 1) / n <= soc + 0.01;
      el("rect", { x: -11, y: 15 - i * 11, width: 22, height: 8, rx: 1, fill: on ? col : "rgba(255,255,255,.08)", class: "seg" }, g);
    }
    return g;
  }
  function setSoc(g, soc) {
    const col = soc > 0.6 ? "#57c46e" : soc > 0.3 ? "#e9b23f" : "#e98c5a";
    g.querySelectorAll(".seg").forEach((r, i) => r.setAttribute("fill", (i + 1) / 4 <= soc + 0.01 ? col : "rgba(255,255,255,.08)"));
  }

  /* Isometric box. F = bottom-front vertex. w along right axis, d along left axis. */
  const ISO = { r: [0.866, -0.5], l: [-0.866, -0.5] };
  function isoBox(parent, F, w, d, h, c) {
    const [fx, fy] = F;
    const R = [fx + ISO.r[0] * w, fy + ISO.r[1] * w], L = [fx + ISO.l[0] * d, fy + ISO.l[1] * d];
    const RL = [R[0] + ISO.l[0] * d, R[1] + ISO.l[1] * d];
    const up = (p) => [p[0], p[1] - h];
    const g = el("g", null, parent);
    el("path", { d: polyD([F, L, up(L), up(F)], true), fill: c.left }, g);
    el("path", { d: polyD([F, R, up(R), up(F)], true), fill: c.right }, g);
    el("path", { d: polyD([up(F), up(R), up(RL), up(L)], true), fill: c.top }, g);
    if (c.edge) el("path", { d: polyD([up(L), up(F), up(R)]) + " M" + F + " L" + up(F), fill: "none", stroke: c.edge, "stroke-width": 1 }, g);
    return { g, F, R, L, h, rightFace: `matrix(.866 -.5 0 1 ${fx} ${fy - h})`, leftFace: `matrix(-.866 -.5 0 1 ${fx} ${fy - h})` };
  }

  /* ============================================================ MAP LAYERS */
  const layers = {};
  function layer(name) { const g = el("g", { id: "L-" + name, "data-layer": name }); document.getElementById("map-layers").appendChild(g); layers[name] = g; return g; }

  function buildMapLayers() {
    const defs = document.getElementById("map-defs");
    defs.innerHTML = `
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
      <marker id="route-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#57c46e"/></marker>
      <clipPath id="split-clip"><rect x="1128" y="0" width="714" height="910"/></clipPath>`;

    const Y = pts(S.yellowZone), G = pts(S.boatRoute);
    const yD = polyD(Y, true);

    // L-site: interpretation of the yellow hand marking
    let g = layer("site");
    el("path", { d: yD, class: "zone-fill" }, g);
    el("path", { d: yD, class: "zone-glow" }, g);
    el("path", { d: yD, class: "zone-edge draw", style: "--dd:.3s" }, g);

    // L-siteQuiet: same boundary, thin, for the masterplan (interpreted, not buildable as a whole)
    g = layer("siteQuiet");
    el("path", { d: yD, class: "zone-edge zone-edge--quiet" }, g);

    // L-route: the green hand marking as an animated corridor
    const routeD = smoothD(G);
    g = layer("route");
    el("path", { d: routeD, class: "route-under" }, g);
    el("path", { id: "route-path", d: routeD, class: "route-line", "marker-end": "url(#route-arrow)" }, g);

    // L-siteLabels (scene 4)
    g = layer("siteLabels");
    el("path", { d: "M1180,560 L1330,470", class: "leader", "stroke-width": 1.4 }, g);
    el("text", { x: 1338, y: 466, class: "lbl", style: "font-size:19px", text: "Proposed solar + BESS zone" }, g);
    el("path", { d: "M1430,740 L1500,660", class: "leader", "stroke-width": 1.4 }, g);
    el("text", { x: 1500, y: 652, class: "lbl", "text-anchor": "middle", style: "font-size:19px", text: "Proposed boat access" }, g);
    el("text", { x: 1500, y: 672, class: "lbl-mono", "text-anchor": "middle", style: "font-size:13px", text: "sea → channel mouth" }, g);

    // L-solar: conceptual tables only on dry sand
    g = layer("solar");
    const ang = S.solarAngle, hub = S.solarHub;
    let maxd = 0; const all = [];
    Object.keys(S.solarBlocks).forEach((k) => S.solarBlocks[k].forEach((p) => { const d = Math.hypot(p[0] - hub[0], p[1] - hub[1]); maxd = Math.max(maxd, d); all.push([p, d]); }));
    all.forEach(([p, d]) => {
      el("rect", { x: p[0] - 7, y: p[1] - 3, width: 14, height: 6, class: "panel", transform: `rotate(${ang} ${p[0]} ${p[1]})`, style: `--pd:${(0.2 + (1 - d / maxd) * 0 + d / maxd * 2.2).toFixed(2)}s` }, g);
    });
    // block outlines (oriented bounding boxes)
    const rad = ang * Math.PI / 180, ca = Math.cos(rad), sa = Math.sin(rad);
    Object.keys(S.solarBlocks).forEach((k) => {
      const P = S.solarBlocks[k]; let umin = 1e9, umax = -1e9, vmin = 1e9, vmax = -1e9;
      P.forEach(([x, y]) => { const u = (x - 1130) * ca + (y - 600) * sa, v = -(x - 1130) * sa + (y - 600) * ca; umin = Math.min(umin, u); umax = Math.max(umax, u); vmin = Math.min(vmin, v); vmax = Math.max(vmax, v); });
      umin -= 10; umax += 10; vmin -= 6; vmax += 6;
      const toXY = (u, v) => [+(1130 + u * ca - v * sa).toFixed(1), +(600 + u * sa + v * ca).toFixed(1)];
      el("path", { d: polyD([toXY(umin, vmin), toXY(umax, vmin), toXY(umax, vmax), toXY(umin, vmax)], true), class: "block-edge" }, g);
    });

    // L-rays (scene 6): restrained light streaks falling onto the array
    g = layer("rays");
    [[1010, 560], [1060, 585], [1110, 600], [1160, 630], [1205, 655], [1150, 560], [1215, 610], [1255, 700]].forEach((p, i) => {
      el("line", { x1: p[0] + 34, y1: p[1] - 46, x2: p[0] + 6, y2: p[1] - 8, class: "ray", style: `--rd:${(i * 0.37).toFixed(2)}s` }, g);
    });

    // L-jetty: ~250 berths in two rows along the channel side of the yellow zone
    g = layer("jetty");
    const J = S.jetty;
    el("path", { d: J.spine, class: "jetty-deck draw", style: "--dd:.1s" }, g);
    el("path", { d: J.pontoon, class: "jetty-deck draw", style: "--dd:.5s" }, g);
    J.gangways.forEach(([a, b]) => el("path", { d: `M${a[0]},${a[1]} L${b[0]},${b[1]}`, class: "jetty-gang" }, g));
    J.fingers.forEach(([x1, y1, x2, y2]) => el("path", { d: `M${x1},${y1} L${x2},${y2}`, class: "jetty-finger" }, g));
    const fleet = el("g", { class: "fleet" }, g);
    const HULL = ["#efe9da", "#dfeaee", "#8fbcd2", "#4b88a6", "#c9694f"];
    J.boats.forEach(([x, y, a, col, row, order]) => {
      const b = el("g", { transform: `translate(${x},${y}) rotate(${a})` }, fleet);
      // inner group glides in along the boat's own axis (local +x = out into the channel)
      const m = el("g", { class: "berth", style: `--bd:calc(var(--jb, .3s) + ${(order * 0.022 + row * 0.6).toFixed(2)}s)` }, b);
      el("path", { d: "M-4.3,0 Q-3.1,-1.2 -1.4,-1.2 L3.9,-1.05 L3.9,1.05 L-1.4,1.2 Q-3.1,1.2 -4.3,0 Z", class: "berth-hull", fill: HULL[col] }, m);
      el("path", { d: "M-2.6,0 L3.2,0", class: "berth-keel" }, m);
      el("rect", { x: 3.9, y: -.55, width: 1, height: 1.1, class: "berth-motor" }, m);
    });
    J.peds.forEach(([x, y, row, c]) => {
      const p = el("g", { class: "ped", style: `--pd2:calc(var(--jb, .3s) + ${(2.2 + (24 - c) * 0.11 + row * 0.6).toFixed(2)}s)` }, g);
      el("rect", { x: x - 1.1, y: y - 1.1, width: 2.2, height: 2.2, class: "ped-body" }, p);
      el("circle", { cx: x, cy: y, r: .7, class: "ped-led", style: `--cd:${((c * 0.13) % 2.4).toFixed(2)}s` }, p);
    });
    // charging feeders along the jetty (power, gold)
    el("path", { d: J.spine, class: "jetty-feed" }, g);

    // L-shoreFleet: opposite-shore row of moored boats (slide 10). Same hull drawing and
    // palette as the jetty berths; static, faded in with the layer.
    g = layer("shoreFleet");
    {
      const HULL = ["#efe9da", "#dfeaee", "#8fbcd2", "#4b88a6", "#c9694f"];
      S.shoreRow.forEach(([x, y, a, col]) => {
        const b = el("g", { transform: `translate(${x},${y}) rotate(${a})` }, g);
        el("path", { d: "M-4.3,0 Q-3.1,-1.2 -1.4,-1.2 L3.9,-1.05 L3.9,1.05 L-1.4,1.2 Q-3.1,1.2 -4.3,0 Z", class: "berth-hull", fill: HULL[col] }, b);
        el("path", { d: "M-2.6,0 L3.2,0", class: "berth-keel" }, b);
        el("rect", { x: 3.9, y: -.55, width: 1, height: 1.1, class: "berth-motor" }, b);
      });
    }

    // L-bess: BESS enclosures + power conversion (indicative footprint only)
    g = layer("bess");
    const b = S.bess, pc = S.pcs;
    el("rect", { x: b.x - 6, y: b.y - 6, width: b.w + 12, height: b.h + 12, rx: 2, class: "fire-gap" }, g);
    el("rect", { x: b.x, y: b.y, width: b.w, height: b.h / 2 - 1, class: "fac-bess" }, g);
    el("rect", { x: b.x, y: b.y + b.h / 2 + 1, width: b.w, height: b.h / 2 - 1, class: "fac-bess" }, g);
    el("rect", { x: pc.x, y: pc.y, width: pc.w, height: pc.h, class: "fac-pcs" }, g);
    el("circle", { cx: b.x + b.w - 3, cy: b.y + 3, r: 1.4, class: "fac-led" }, g);
    el("circle", { cx: b.x + b.w - 3, cy: b.y + b.h / 2 + 4, r: 1.4, class: "fac-led", style: "animation-delay:.8s" }, g);

    // L-swap: charging + swapping facility
    g = layer("swap");
    const w = S.swap;
    el("rect", { x: w.x, y: w.y, width: w.w, height: w.h, class: "fac-swap" }, g);
    for (let i = 0; i < 6; i++) el("rect", { x: w.x + 4 + i * 4.4, y: w.y + 4, width: 3, height: 5, fill: i < 4 ? "#57c46e" : "#e9b23f", opacity: .9 }, g);
    el("path", { d: `M${w.x + 3},${w.y + w.h - 5} h${w.w - 6}`, stroke: "#cfd6da", "stroke-width": 1 }, g);

    // L-access: internal service track + external access (unknown)
    g = layer("access");
    el("path", { d: smoothD([[1180, 700], [1236, 742], [1280, 770], [1296, 800], [1305, 815]]), class: "track draw", style: "--dd:.1s" }, g);
    el("path", { d: "M1305,815 L1318,846", class: "track", opacity: .5 }, g);
    el("text", { x: 1324, y: 862, class: "lbl-mono", text: "external access: route TBD" }, g);

    // L-walk: operational circulation to the landing point
    g = layer("walk");
    el("path", { d: smoothD([[S.swap.x + 4, S.swap.y + S.swap.h / 2], [1230, 770], S.landing]), class: "walk" }, g);
    el("circle", { cx: S.landing[0], cy: S.landing[1], r: 3, fill: "none", stroke: "#d8d2c2", "stroke-width": 1 }, g);

    // L-flow: power flow (not battery movement): PV -> PCS/EMS -> BESS -> chargers
    g = layer("flow");
    el("path", { d: smoothD([hub, [1236, 700], [pc.x + pc.w / 2, pc.y]]), class: "flow" }, g);
    el("path", { d: `M${pc.x + pc.w},${pc.y + 4} L${b.x},${b.y + 5}`, class: "flow" }, g);
    el("path", { d: smoothD([[pc.x, pc.y + pc.h - 2], [1280, 782], [S.swap.x + S.swap.w, S.swap.y + 8]]), class: "flow" }, g);
    el("path", { d: smoothD([[pc.x, pc.y + 6], [1240, 752], [1208, 741]]), class: "flow" }, g);
    el("circle", { cx: hub[0], cy: hub[1], r: 3, class: "flow-dot" }, g);

    // L-callouts: masterplan labels
    g = layer("callouts");
    const call = (ax, ay, lx, ly, t, sub, anchor) => {
      el("path", { d: `M${ax},${ay} L${lx},${ly + 3}`, class: "leader" }, g);
      el("circle", { cx: ax, cy: ay, r: 1.8, fill: "#f4f0e6" }, g);
      el("text", { x: lx, y: ly, class: "lbl", "text-anchor": anchor || "start", text: t }, g);
      if (sub) el("text", { x: lx, y: ly + 11, class: "lbl-mono", "text-anchor": anchor || "start", text: sub }, g);
    };
    call(1185, 600, 1300, 520, "Solar PV area", "tables on dry sand only");
    call(1330, 768, 1345, 660, "BESS + power conversion", "fire separation to design");
    call(1258, 790, 1112, 838, "Charger + switch room", "feeds jetty pedestals", "end");
    call(1428, 745, 1398, 712, "Boat access corridor", "depth + tides unverified");
    call(1240, 745, 1300, 790, "Service track", "concept");
    call(1060, 690, 1040, 742, "Jetty · ~250 boats", "plug-in charging at every berth", "end");

    // L-eng: pending assessments (engineering annotation mode)
    g = layer("eng");
    const tag = (tx, ty, ax, ay, t) => {
      const gg = el("g", { class: "eng-tag" }, g);
      el("line", { x1: ax, y1: ay, x2: tx, y2: ty }, gg);
      el("circle", { cx: ax, cy: ay, r: 1.6, fill: "#e98c5a" }, gg);
      const wpx = t.length * 4.6 + 10;
      el("rect", { x: tx - wpx / 2, y: ty - 7.5, width: wpx, height: 11, rx: 1.5 }, gg);
      el("text", { x: tx, y: ty + 0.6, class: "lbl-warn", "text-anchor": "middle", "dominant-baseline": "middle", text: t }, gg);
    };
    tag(995, 452, 930, 520, "LAND OWNERSHIP + USABLE AREA · TBD");
    tag(1205, 420, 1150, 540, "CRZ + ENVIRONMENTAL CLEARANCE · PENDING");
    tag(1235, 508, 1200, 600, "SOLAR RESOURCE + SHADING · TO MEASURE");
    tag(1400, 562, 1325, 680, "TIDE · STORM SURGE · EROSION · UNASSESSED");
    tag(1410, 598, 1291, 771, "GRID CONNECTION · AVAILABILITY UNKNOWN");
    tag(1410, 628, 1330, 772, "BESS SITING + FIRE STRATEGY · TO DESIGN");
    tag(1405, 830, 1352, 830, "CHANNEL DEPTH + TIDAL ACCESS · UNVERIFIED");
    tag(1000, 810, 1110, 715, "SHORE POWER: EARTHING · IP RATING · ISOLATION");
    tag(860, 600, 1010, 600, "SOIL BEARING + FOUNDATIONS · UNASSESSED");
    tag(880, 790, 1060, 690, "BERTHS: CHANNEL WIDTH, DEPTH, MOORING · TO SURVEY");
    tag(1290, 846, 1300, 815, "EMERGENCY + MAINTENANCE ACCESS · TBD");
    tag(825, 525, 780, 565, "COMMUNITY ACCEPTANCE · CONSULTATION");

    // L-boat: boat marker (moved by scene 9)
    g = layer("boat");
    const boat = el("g", { id: "boat-marker", class: "boat-marker", transform: `translate(${G[0][0]},${G[0][1]})` }, g);
    el("path", { d: "M-24,0 L-34,-4 M-24,0 L-34,4", class: "wake" }, boat);
    el("path", { d: "M-10,-3.2 L6,-3.4 Q11,-2 13,0 Q11,2 6,3.4 L-10,3.2 Z", class: "hull" }, boat);
    el("path", { d: "M-9,-1.1 L8,-1.3 L8,1.3 L-9,1.1 Z", class: "stripe" }, boat);
    el("rect", { x: -14, y: -1.6, width: 4, height: 3.2, rx: .6, class: "motor" }, boat);
    el("rect", { x: -3.5, y: -1.5, width: 5, height: 3, rx: .5, class: "batt" }, boat);   // onboard battery (stays in the boat)
    // charging point at the existing landing: pedestal, status light and cable (scene 9)
    const ped = el("g", null, g);
    el("path", { id: "mp-cable", d: "M0,0", class: "mp-cable" }, ped);
    el("path", { id: "mp-cable-hi", d: "M0,0", class: "mp-cable-hi" }, ped);
    el("rect", { x: S.chargePedestal[0] - 1.9, y: S.chargePedestal[1] - 1.9, width: 3.8, height: 3.8, rx: .5, class: "mp-ped" }, ped);
    el("circle", { id: "mp-led", cx: S.chargePedestal[0], cy: S.chargePedestal[1], r: 1.05, fill: "#3a4148" }, ped);

    // L-future: possible later services (dashed = not in pilot scope)
    g = layer("future");
    const shore = [[640, 392], [700, 455], [770, 520], [835, 588], [900, 655], [965, 722], [1035, 785], [1105, 838]];
    el("path", { d: smoothD(shore), class: "future-dash" }, g);
    shore.forEach((p, i) => el("circle", { cx: p[0], cy: p[1], r: 3.2, class: "lamp", style: `--ld:${(i * 0.3).toFixed(1)}s` }, g));
    el("text", { x: 985, y: 700, class: "lbl", text: "Waterfront lighting" }, g);
    el("text", { x: 985, y: 712, class: "lbl-mono", text: "possible later · not in pilot" }, g);
    const ring = (x, y, r, t, sub, anchor) => {
      el("circle", { cx: x, cy: y, r, class: "future-ring" }, g);
      el("text", { x: anchor === "end" ? x - r - 5 : x + r + 5, y: y - 1, class: "lbl", "text-anchor": anchor || "start", text: t }, g);
      el("text", { x: anchor === "end" ? x - r - 5 : x + r + 5, y: y + 10, class: "lbl-mono", "text-anchor": anchor || "start", text: sub }, g);
    };
    ring(760, 600, 16, "Technical service point", "location TBD", "end");
    ring(845, 515, 14, "Cold storage for catch", "subject to load assessment");
    ring(905, 760, 16, "Shared energy services", "needs load + grid study", "end");
    el("path", { d: smoothD([[S.bess.x, S.bess.y + 10], [1150, 790], [921, 765]]), class: "future-dash" }, g);

    // L-pilot: label for the initial scope on the settlement view
    g = layer("pilotLabel");
    el("text", { x: 1255, y: 862, class: "lbl", fill: "#e9b23f", "text-anchor": "middle", text: "Initial pilot: hub + jetty + corridor" }, g);

    // L-hubPin: wide-view marker
    g = layer("hubPin");
    el("circle", { cx: 1128, cy: 612, r: 120, fill: "none", stroke: "#e9b23f", "stroke-width": 2, "stroke-dasharray": "6 6" }, g);
    el("text", { x: 1128, y: 470, class: "lbl", "text-anchor": "middle", style: "font-size:16px", text: "Coastal energy hub · concept" }, g);

    // split-screen UI
    const sui = document.getElementById("split-ui");
    el("line", { x1: 1128, y1: 0, x2: 1128, y2: 910, class: "split-line" }, sui);
    el("text", { x: 1118, y: 380, class: "split-tag", "text-anchor": "end", text: "ORIGINAL MARKINGS" }, sui);
    el("text", { x: 1138, y: 380, class: "split-tag", text: "CONCEPT" }, sui);
    sui.style.display = "none";

    // measure drawable paths once laid out
    requestAnimationFrame(() => document.querySelectorAll("#map-layers .draw").forEach(setLen));
  }

  /* =========================================================== ILLUSTRATIONS */
  const ILLUS = {};

  ILLUS.community = (svg) => {
    svg.innerHTML = `
    <defs>
      <linearGradient id="c-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#162640"/><stop offset=".45" stop-color="#5a4a62"/><stop offset=".78" stop-color="#d4875a"/><stop offset="1" stop-color="#f3bd78"/></linearGradient>
      <linearGradient id="c-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b7a78"/><stop offset=".25" stop-color="#3d5670"/><stop offset="1" stop-color="#1b3247"/></linearGradient>
      <linearGradient id="c-sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9c8160"/><stop offset="1" stop-color="#5f4c37"/></linearGradient>
      <radialGradient id="c-sun"><stop offset="0" stop-color="#fff2cf"/><stop offset=".35" stop-color="#ffd593" stop-opacity=".9"/><stop offset="1" stop-color="#ffb46b" stop-opacity="0"/></radialGradient>
      <linearGradient id="c-shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#07121c" stop-opacity=".85"/><stop offset=".55" stop-color="#07121c" stop-opacity=".1"/><stop offset="1" stop-color="#07121c" stop-opacity="0"/></linearGradient>
      <linearGradient id="c-shade2" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#07121c" stop-opacity="0"/><stop offset="1" stop-color="#07121c" stop-opacity=".8"/></linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#c-sky)"/>
    <circle cx="1180" cy="430" r="190" fill="url(#c-sun)"/>
    <circle cx="1180" cy="432" r="38" fill="#fff0c8"/>
    <g class="plx plx-1" fill="#2c2a38">
      <path d="M-140,452 L-140,420 L40,420 L40,404 L110,404 L110,424 L170,424 L170,398 L250,398 L250,430 L330,430 L330,412 L390,412 L390,436 L470,436 L470,445 L-40,452 Z"/>
      <path d="M282,398 L282,318 L292,300 L302,318 L302,398 Z M288,292 h8 v-14 h4 v14 h8 v4 h-8 v4 h-4 v-4 h-8 z"/>
      <path d="M250,398 L250,350 L282,350 L282,398 Z M302,398 L302,356 L330,356 L330,412 Z"/>
      <path d="M520,446 q4,-60 0,-90 m0,0 q-30,-6 -48,10 m48,-10 q28,-12 48,4 m-48,-4 q-12,-26 -34,-30 m34,30 q16,-24 40,-22" stroke="#2c2a38" stroke-width="5" fill="none"/>
      <path d="M600,446 q-2,-48 4,-76 m0,0 q-26,-2 -40,12 m40,-12 q24,-8 42,8 m-42,-8 q-6,-22 -26,-30" stroke="#2c2a38" stroke-width="4" fill="none"/>
    </g>
    <g class="plx plx-2">
      <rect x="-100" y="440" width="1800" height="230" fill="url(#c-sea)"/>
      <path d="M1120,445 L1240,445 L1300,660 L1060,660 Z" fill="#ffd9a0" opacity=".16"/>
      <path class="wave" d="M-40,500 q60,-8 120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0"/>
      <path class="wave" d="M-40,560 q80,-10 160,0 t160,0 t160,0 t160,0 t160,0 t160,0 t160,0 t160,0 t160,0 t160,0 t160,0" style="animation-delay:-2s"/>
      <path class="wave" d="M-40,625 q90,-12 180,0 t180,0 t180,0 t180,0 t180,0 t180,0 t180,0 t180,0 t180,0 t180,0" style="animation-delay:-4s"/>
      <use href="#sym-boat" x="1330" y="468" width="120" height="32" opacity=".7"/>
    </g>
    <g class="plx plx-3">
      <path d="M-40,660 Q400,630 800,650 T1640,640 L1640,940 L-40,940 Z" fill="url(#c-sand)"/>
      <path d="M-40,660 Q400,630 800,650 T1640,640" stroke="#d9c49c" stroke-width="3" fill="none" opacity=".5"/>
      <g transform="translate(780,600) rotate(-6)"><use href="#sym-boat" width="520" height="138"/></g>
      <g transform="translate(220,690) rotate(4)"><use href="#sym-boat" width="440" height="116"/></g>
      <g transform="translate(1180,700) rotate(-3)"><use href="#sym-boat" width="380" height="100"/></g>
      <ellipse cx="1040" cy="806" rx="70" ry="16" fill="#3a5248"/>
      <path d="M980,800 l120,-4 M990,808 l110,0 M1000,795 l20,20 M1030,792 l20,20 M1060,792 l20,22" stroke="#6b8a7c" stroke-width="2"/>
      <g transform="translate(700,750) scale(.9)"><use href="#sym-jerry" width="40" height="50"/></g>
      <g transform="translate(735,758) scale(.9)"><use href="#sym-jerry" width="40" height="50"/></g>
      <g fill="#14181e">
        <use href="#sym-person" x="760" y="632" width="56" height="140" transform="rotate(-22 788 702)"/>
        <use href="#sym-person" x="820" y="636" width="56" height="140" transform="rotate(-18 848 706)"/>
        <use href="#sym-person" x="1100" y="680" width="52" height="130"/>
        <use href="#sym-person" x="1150" y="690" width="48" height="122"/>
        <use href="#sym-person" x="560" y="700" width="54" height="134"/>
      </g>
    </g>
    <rect width="1600" height="900" fill="url(#c-shade)"/>
    <rect width="1600" height="900" fill="url(#c-shade2)"/>`;
  };

  /* Scene 3: the challenge — one beach panorama, three spotlit beats */
  ILLUS.challenge = (svg) => {
    const puffs = Array.from({ length: 6 }, (_, i) => `<circle class="puff" cx="0" cy="0" r="${9 + (i % 3) * 3}" fill="#8b8f94" opacity="0" style="--i:${i}"/>`).join("");
    const ticks = Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="-21" x2="0" y2="-25" stroke="#93a3ae" stroke-width="2" transform="rotate(${i * 30})"/>`).join("");
    svg.innerHTML = `
    <defs>
      <linearGradient id="ch-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16243a"/><stop offset=".5" stop-color="#5d4c5a"/><stop offset=".85" stop-color="#c98a5c"/><stop offset="1" stop-color="#e2ac74"/></linearGradient>
      <linearGradient id="ch-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d7273"/><stop offset=".3" stop-color="#3a536a"/><stop offset="1" stop-color="#1a3145"/></linearGradient>
      <linearGradient id="ch-sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a805f"/><stop offset="1" stop-color="#4f3f2f"/></linearGradient>
      <radialGradient id="ch-sun"><stop offset="0" stop-color="#fff0cc"/><stop offset=".4" stop-color="#ffcf8f" stop-opacity=".7"/><stop offset="1" stop-color="#ffb06b" stop-opacity="0"/></radialGradient>
      <linearGradient id="ch-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07121c" stop-opacity=".8"/><stop offset=".3" stop-color="#07121c" stop-opacity="0"/></linearGradient>
      <filter id="ch-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="55"/></filter>
      <mask id="ch-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="900">
        <rect width="1600" height="900" fill="#fff"/>
        <g id="ch-spot" style="transform: translate(690px, 600px)"><ellipse rx="390" ry="290" fill="#000" filter="url(#ch-blur)"/></g>
      </mask>
    </defs>
    <rect width="1600" height="900" fill="url(#ch-sky)"/>
    <circle cx="1250" cy="425" r="170" fill="url(#ch-sun)"/>
    <circle cx="1250" cy="428" r="28" fill="#fff0c8" opacity=".9"/>
    <g fill="#2a2834" opacity=".9">
      <path d="M560,436 L560,416 L620,416 L620,404 L690,404 L690,420 L760,420 L760,410 L830,410 L830,436 Z"/>
      <path d="M720,410 L720,350 L728,336 L736,350 L736,410 Z M724,330 h8 v-10 h3 v10 h7 v3 h-7 v3 h-3 v-3 h-8 z"/>
    </g>
    <rect y="430" width="1600" height="220" fill="url(#ch-sea)"/>
    <path d="M1180,432 L1320,432 L1380,640 L1120,640 Z" fill="#ffd9a0" opacity=".12"/>
    <path class="wave" d="M-40,500 q60,-8 120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0"/>
    <path class="wave" d="M-40,570 q80,-10 160,0 t160,0 t160,0 t160,0 t160,0 t160,0 t160,0 t160,0 t160,0 t160,0 t160,0" style="animation-delay:-3s"/>

    <!-- departing boat with exhaust (beat 2: cost) -->
    <g id="ch-seaboat" style="transform: translate(1040px, 452px)">
      <path d="M-30,48 q-40,-4 -80,2 M-24,54 q-50,2 -100,10" stroke="rgba(255,255,255,.35)" stroke-width="2" fill="none"/>
      <g id="ch-smoke" transform="translate(4,22)">${puffs}</g>
      <use href="#sym-boat" x="-20" y="10" width="240" height="64"/>
      <use href="#sym-person" x="70" y="-14" width="22" height="48" fill="#14181e"/>
    </g>

    <path d="M-40,646 Q420,612 820,628 T1640,610 L1640,940 L-40,940 Z" fill="url(#ch-sand)"/>
    <path d="M-40,646 Q420,612 820,628 T1640,610" stroke="#d9c49c" stroke-width="3" fill="none" opacity=".45"/>

    <!-- fuel stall + queue + clock (beat 3: time) -->
    <path d="M120,476 L400,476 L380,444 L140,444 Z" fill="#7a3b2e"/>
    <rect x="140" y="476" width="240" height="170" fill="#3e352d"/>
    <rect x="140" y="584" width="240" height="14" fill="#6e5a43"/>
    ${[170, 222, 274].map((x) => `<rect x="${x}" y="600" width="40" height="52" fill="#2f5a74"/><ellipse cx="${x + 20}" cy="600" rx="20" ry="6" fill="#4b7c96"/><path d="M${x},618 h40 M${x},636 h40" stroke="#244659" stroke-width="2"/>`).join("")}
    <g transform="translate(336,520)"><circle r="18" fill="#e9b23f"/><path d="M0,-10 C6,-2 8,3 8,6 A8,8 0 0 1 -8,6 C-8,3 -6,-2 0,-10 Z" fill="#3e352d"/></g>
    <g transform="translate(212,522)"><circle r="30" fill="#0e2636" stroke="#f4f0e6" stroke-width="4"/>${ticks}
      <line x1="0" y1="0" x2="0" y2="-15" stroke="#f4f0e6" stroke-width="4" stroke-linecap="round" transform="rotate(50)"/>
      <g id="ch-clock"><line x1="0" y1="0" x2="0" y2="-24" stroke="#e98c5a" stroke-width="3" stroke-linecap="round"/></g><circle r="4" fill="#f4f0e6"/></g>
    <g fill="#12161c">
      <use href="#sym-person" x="402" y="540" width="46" height="116"/>
      <use href="#sym-person" x="452" y="546" width="44" height="110"/>
      <use href="#sym-person" x="500" y="542" width="46" height="114"/>
    </g>
    <use href="#sym-jerry" x="430" y="626" width="26" height="32"/><use href="#sym-jerry" x="480" y="628" width="24" height="30"/><use href="#sym-jerry" x="530" y="626" width="26" height="32"/>

    <!-- boat on the sand being fuelled + carrier walking (beat 1: by hand) -->
    <g transform="translate(800,606)"><use href="#sym-boat" width="460" height="122"/></g>
    <g transform="translate(762,600)">
      <use href="#sym-person" x="-26" y="-6" width="52" height="130" fill="#12161c" transform="rotate(12 0 60)"/>
      <g id="ch-can" style="transform: translate(30px, 8px) rotate(-38deg)"><use href="#sym-jerry" x="-4" y="-10" width="34" height="42"/></g>
      <path id="ch-drip" d="M62,18 L68,40" stroke="#c9a24a" stroke-width="3" stroke-linecap="round" stroke-dasharray="3 6"/>
    </g>
    <g id="ch-walker" style="transform: translate(560px, 0px)">
      <g id="ch-bob">
        <use href="#sym-person" x="0" y="560" width="52" height="132" fill="#12161c"/>
        <use href="#sym-jerry" x="40" y="626" width="30" height="38"/>
      </g>
    </g>

    <!-- fuel gauge readout (beat 2: cost) -->
    <g transform="translate(1388,250)">
      <rect x="-118" y="-98" width="236" height="156" rx="6" fill="rgba(7,18,28,.78)" stroke="rgba(244,240,230,.2)"/>
      <path d="M-78,20 A78,78 0 0 1 78,20" fill="none" stroke="#2a4a5c" stroke-width="14"/>
      <path d="M-78,20 A78,78 0 0 1 -40,-48" fill="none" stroke="#e98c5a" stroke-width="14"/>
      <text x="-90" y="44" style="font:600 14px var(--f-mono);fill:#93a3ae">E</text>
      <text x="82" y="44" style="font:600 14px var(--f-mono);fill:#93a3ae">F</text>
      <text x="0" y="-74" text-anchor="middle" style="font:500 12px var(--f-mono);fill:#93a3ae;letter-spacing:.18em">FUEL · EVERY TRIP</text>
      <g transform="translate(0,20)"><g id="ch-needle" style="transform: rotate(70deg)"><line x1="0" y1="0" x2="0" y2="-66" stroke="#f4f0e6" stroke-width="4" stroke-linecap="round"/></g><circle r="7" fill="#f4f0e6"/></g>
    </g>

    <rect width="1600" height="900" fill="url(#ch-top)"/>
    <rect class="ch-dim" width="1600" height="900" fill="#07121c" mask="url(#ch-mask)"/>`;
  };

  /* Scene 7: energy system — isometric, left-to-right power path, staged sequence */
  ILLUS.bess = (svg) => {
    const R = [0.866, -0.5], Lx = [-0.866, -0.5];
    const add = (p, v, k) => [p[0] + v[0] * k, p[1] + v[1] * k];
    const up = (p, h) => [p[0], p[1] - h];
    const P = (a) => a.map((p) => p.map((n) => +n.toFixed(1)).join(",")).join(" ");
    svg.innerHTML = `<defs>
      <filter id="b7-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2"/></filter>
      <filter id="b7-shadow" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="9"/></filter>
      <radialGradient id="b7-amb" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#2e6e8e" stop-opacity=".28"/><stop offset="1" stop-color="#2e6e8e" stop-opacity="0"/></radialGradient>
      <radialGradient id="b7-floorfade" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#fff"/><stop offset=".75" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <mask id="b7-floormask"><rect x="0" y="20" width="1600" height="800" fill="url(#b7-floorfade)"/></mask>
      ${[["steelL", "#3a5060", "#26363f"], ["steelR", "#4a6474", "#2f4350"], ["steelT", "#6c8594", "#58707f"],
         ["bessL", "#1f5d78", "#143e51"], ["bessR", "#2b7697", "#1a4c63"], ["bessT", "#4a9bbd", "#3a86a6"],
         ["cabL", "#45423a", "#2f2d28"], ["cabR", "#57534a", "#3a3833"], ["cabT", "#767165", "#6a665b"],
         ["contL", "#b9c1c6", "#949da3"], ["contR", "#dce2e5", "#b7c0c5"], ["contT", "#eef2f3", "#dfe5e7"],
         ["kioskL", "#6f8573", "#56695a"], ["kioskR", "#8aa08e", "#6b8170"], ["kioskT", "#a7b9aa", "#97ab9a"],
         ["plinthL", "#8f8a80", "#6f6a61"], ["plinthR", "#a7a297", "#86817a"], ["plinthT", "#c3beb3", "#b3aea3"],
         ["pv", "#25507f", "#132b4b"], ["sea", "#173a50", "#0d2232"]]
        .map(([id, a, b]) => `<linearGradient id="b7-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`).join("")}
      <linearGradient id="b7-sweep" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff6d8" stop-opacity=".38"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    </defs>`;
    const root = el("g", null, svg);
    const H = {};   // handles for the animation engine

    // ambient light + faint isometric floor grid
    el("ellipse", { cx: 800, cy: 560, rx: 760, ry: 300, fill: "url(#b7-amb)" }, root);
    const floor = el("g", { mask: "url(#b7-floormask)", opacity: .5 }, root);
    for (let k = -14; k <= 30; k++) {
      const o = k * 46;
      el("path", { d: `M${o - 400},${880 + 0} l${0.866 * 1800},${-0.5 * 1800}`, stroke: "rgba(147,163,174,.14)", "stroke-width": 1 }, floor);
      el("path", { d: `M${o + 1200},${880} l${-0.866 * 1800},${-0.5 * 1800}`, stroke: "rgba(147,163,174,.14)", "stroke-width": 1 }, floor);
    }

    // generic isometric box with gradients, edge highlights and a soft ground shadow
    const box = (parent, F, w, d, h, mat) => {
      const Rv = add(F, R, w), Lv = add(F, Lx, d), RL = add(Rv, Lx, d);
      const g = el("g", null, parent);
      el("polygon", { points: P([F, Rv, RL, Lv].map((p) => [p[0] + 16, p[1] + 9])), fill: "#000", opacity: .55, filter: "url(#b7-shadow)" }, g);
      el("polygon", { points: P([F, Lv, up(Lv, h), up(F, h)]), fill: `url(#b7-${mat}L)` }, g);
      el("polygon", { points: P([F, Rv, up(Rv, h), up(F, h)]), fill: `url(#b7-${mat}R)` }, g);
      el("polygon", { points: P([up(F, h), up(Rv, h), up(RL, h), up(Lv, h)]), fill: `url(#b7-${mat}T)` }, g);
      el("polyline", { points: P([up(Lv, h), up(F, h), up(Rv, h)]), fill: "none", stroke: "rgba(255,255,255,.42)", "stroke-width": 1.3 }, g);
      el("polyline", { points: P([up(Lv, h), up(RL, h), up(Rv, h)]), fill: "none", stroke: "rgba(255,255,255,.16)", "stroke-width": 1 }, g);
      el("line", { x1: F[0], y1: F[1], x2: F[0], y2: F[1] - h, stroke: "rgba(255,255,255,.22)", "stroke-width": 1 }, g);
      return { g, F, Rv, Lv, RL, h, top: [up(F, h), up(Rv, h), up(RL, h), up(Lv, h)],
        right: el("g", { transform: `matrix(.866 -.5 0 1 ${F[0]} ${F[1] - h})` }, g),
        left: el("g", { transform: `matrix(-.866 -.5 0 1 ${F[0]} ${F[1] - h})` }, g) };
    };
    // concrete plinth under equipment (top flush with the equipment base)
    const plinth = (parent, F, w, d) => box(parent, [F[0], F[1] + 11], w + 8, d + 8, 7, "plinth");   // 4-unit margin on every side
    const label = (x, name, sub, parent) => {
      el("text", { x, y: 772, "text-anchor": "middle", class: "sys-name sys-lbl", text: name }, parent);
      if (sub) el("text", { x, y: 796, "text-anchor": "middle", class: "sys-sub sys-lbl", text: sub }, parent);
    };

    // ---------- jetty, water and boat (far right; drawn first so equipment overlaps correctly)
    const jet = el("g", { class: "cmp", "data-c": "jetty" }, root);
    const wm = el("mask", { id: "b7-watermask" }, svg.querySelector("defs"));
    const wg = el("radialGradient", { id: "b7-waterfade", cx: "1480", cy: "690", r: "190", gradientUnits: "userSpaceOnUse", gradientTransform: "translate(1480 690) scale(1.25 .8) translate(-1480 -690)" }, svg.querySelector("defs"));
    el("stop", { offset: .55, "stop-color": "#fff", "stop-opacity": 1 }, wg); el("stop", { offset: 1, "stop-color": "#fff", "stop-opacity": 0 }, wg);
    el("rect", { x: 1280, y: 520, width: 320, height: 300, fill: "url(#b7-waterfade)" }, wm);
    el("polygon", { points: "1290,812 1290,744 1600,566 1600,812", fill: "url(#b7-sea)", mask: "url(#b7-watermask)" }, jet);
    el("path", { d: "M1340,770 q20,-6 40,0 t40,0 M1450,730 q20,-6 40,0 t40,0 M1500,780 q20,-6 40,0 t40,0", stroke: "rgba(255,255,255,.1)", "stroke-width": 1.5, fill: "none" }, jet);
    const D0 = [1335, 712], D1 = add(D0, R, 240), D2 = add(D1, Lx, 44), D3 = add(D0, Lx, 44);
    el("polygon", { points: P([D0, D1, up(D1, -8), up(D0, -8)]), fill: "#5b5242" }, jet);
    el("polygon", { points: P([D0, D1, D2, D3]), fill: "#8a7d63" }, jet);
    el("polyline", { points: P([D3, D0, D1]), fill: "none", stroke: "rgba(255,255,255,.3)", "stroke-width": 1 }, jet);
    for (let t = 20; t < 240; t += 44) { const p = add(D0, R, t); el("rect", { x: p[0] - 2, y: p[1] + 6, width: 4, height: 26, fill: "#3a352c" }, jet); }
    // boat: hull projected on the deck axis, floating clear of the jetty edge
    const bc = [1499, 668], hull = [add(add(bc, R, 78), [0, 0], 0), add(add(bc, R, 46), Lx, 15), add(add(bc, R, -70), Lx, 15), add(add(bc, R, -76), Lx, 0), add(add(bc, R, -70), Lx, -15), add(add(bc, R, 46), Lx, -15)];
    el("polygon", { points: P(hull.map((p) => [p[0] + 6, p[1] + 6])), fill: "#000", opacity: .35, filter: "url(#b7-shadow)" }, jet);
    el("polygon", { points: P(hull), fill: "#efe9da", stroke: "#0b2232", "stroke-width": 1 }, jet);
    el("polygon", { points: P([add(add(bc, R, 40), Lx, 10), add(add(bc, R, -64), Lx, 10), add(add(bc, R, -64), Lx, -10), add(add(bc, R, 40), Lx, -10)]), fill: "#2e6e8e", opacity: .55 }, jet);
    const ob = add(bc, R, -84); el("rect", { x: ob[0] - 6, y: ob[1] - 8, width: 12, height: 16, rx: 2, fill: "#d9d4c6", stroke: "#0b2232" }, jet);
    // pedestals
    H.peds = [50, 120, 190].map((t) => {
      const b = add(add(D0, R, t), Lx, 14);
      el("rect", { x: b[0] - 3.5, y: b[1] - 36, width: 7, height: 36, fill: "#cfd6da" }, jet);
      el("rect", { x: b[0] - 10, y: b[1] - 60, width: 20, height: 26, rx: 3, fill: "#e7e2d4", stroke: "#0b2232", "stroke-width": .8 }, jet);
      el("rect", { x: b[0] - 6, y: b[1] - 55, width: 12, height: 7, fill: "#0e2636" }, jet);
      return { base: b, lamp: el("circle", { cx: b[0], cy: b[1] - 41, r: 3.4, class: "ped-lamp" }, jet) };
    });
    const pc = H.peds[1].base;
    H.cable = el("path", { d: `M${pc[0] + 9},${pc[1] - 44} C${pc[0] + 40},${pc[1] - 30} ${bc[0] - 20},${bc[1] - 40} ${bc[0] - 10},${bc[1] - 4}`, fill: "none", stroke: "#3a4148", "stroke-width": 3, "stroke-linecap": "round" }, jet);
    label(1452, "Jetty pedestals", "boat-side charging interface", jet);

    // ---------- PV array (three tilted tables)
    const pv = el("g", { class: "cmp", "data-c": "pv" }, root);
    const surfaces = [];
    [2, 1, 0].forEach((k) => {
      const A = [190 - 47.6 * k, 636 - 27.5 * k], B = add(A, R, 190), C = up(add(B, Lx, 36), 22), Dd = up(add(A, Lx, 36), 22);
      [[A, 14], [B, 14], [Dd, 36], [C, 36]].forEach(([p, hh]) => el("line", { x1: p[0], y1: p[1], x2: p[0], y2: p[1] + hh, stroke: "#7d8a93", "stroke-width": 2 }, pv));
      el("polygon", { points: P([A, B, C, Dd].map((p) => [p[0] + 14, p[1] + 40])), fill: "#000", opacity: .35, filter: "url(#b7-shadow)" }, pv);
      el("polygon", { points: P([A, B, C, Dd]), fill: "url(#b7-pv)", stroke: "#a9c1d9", "stroke-width": 1.2 }, pv);
      for (let i = 1; i < 6; i++) { const a = add(A, R, 190 * i / 6), b = add(Dd, R, 190 * i / 6); el("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: "#7397c2", "stroke-width": .7, opacity: .7 }, pv); }
      const m1 = [(A[0] + Dd[0]) / 2, (A[1] + Dd[1]) / 2], m2 = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2];
      el("line", { x1: m1[0], y1: m1[1], x2: m2[0], y2: m2[1], stroke: "#7397c2", "stroke-width": .7, opacity: .7 }, pv);
      surfaces.push([A, B, C, Dd]);
    });
    const cp = el("clipPath", { id: "b7-pvclip" }, svg.querySelector("defs"));
    surfaces.forEach((s) => el("polygon", { points: P(s) }, cp));
    const sweepG = el("g", { "clip-path": "url(#b7-pvclip)" }, pv);
    H.sweep = el("rect", { x: -120, y: 380, width: 120, height: 300, fill: "url(#b7-sweep)", class: "pv-sweep", transform: "skewX(-24)" }, sweepG);
    label(222, "Solar PV", "generation", pv);

    // ---------- PCS: skid-mounted inverter station
    const pcsG = el("g", { class: "cmp", "data-c": "pcs" }, root);
    plinth(pcsG, [440, 650], 66, 56);
    const pcs = box(pcsG, [440, 650], 66, 56, 110, "steel");
    [[6, 10], [36, 10]].forEach(([x, y]) => {
      el("rect", { x, y, width: 24, height: 56, rx: 1.5, fill: "#2d3d47", stroke: "#7b8d97", "stroke-width": .8 }, pcs.right);
      for (let k = 0; k < 9; k++) el("line", { x1: x + 2, y1: y + 5 + k * 5.6, x2: x + 22, y2: y + 7 + k * 5.6, stroke: "#9fb0b9", "stroke-width": 1.1, opacity: .7 }, pcs.right);
    });
    el("path", { d: "M14,76 l6,-11 l6,11 z", fill: "#e9b23f", stroke: "#3a3020", "stroke-width": .6 }, pcs.right);
    el("rect", { x: 34, y: 72, width: 26, height: 14, rx: 1, fill: "#0e2636", stroke: "#93a3ae", "stroke-width": .6 }, pcs.right);
    H.pcsLed = el("circle", { cx: 54, cy: 79, r: 3.2, class: "led" }, pcs.right);
    el("rect", { x: 8, y: 92, width: 50, height: 12, fill: "#25333c" }, pcs.right);
    el("rect", { x: 6, y: 10, width: 44, height: 92, fill: "none", stroke: "#6c7f8a", "stroke-width": .9 }, pcs.left);
    el("rect", { x: 40, y: 52, width: 3, height: 14, rx: 1, fill: "#cfd6da" }, pcs.left);
    label(445, "Power conversion", "PCS · inverter skid", pcsG);

    // ---------- BESS: two containerised battery enclosures (dominant element)
    const bessG = el("g", { class: "cmp", "data-c": "bess" }, root);
    H.soc = []; H.bessLed = []; H.edges = [];
    [[620, 650], [842, 650]].forEach((F, n) => {
      const W = 170, Dp = 70, Hh = 82;
      plinth(bessG, F, W, Dp);
      const b = box(bessG, F, W, Dp, Hh, "cont");
      const R = b.right, Lf = b.left;
      // corrugated side wall
      for (let x = 8; x < W - 6; x += 5.2) {
        el("line", { x1: x, y1: 5, x2: x, y2: Hh - 6, stroke: "rgba(40,52,60,.22)", "stroke-width": 1.4 }, R);
        el("line", { x1: x + 1.8, y1: 5, x2: x + 1.8, y2: Hh - 6, stroke: "rgba(255,255,255,.35)", "stroke-width": .7 }, R);
      }
      el("rect", { x: 0, y: 0, width: W, height: 4.5, fill: "rgba(60,70,78,.28)" }, R);
      el("rect", { x: 0, y: Hh - 6, width: W, height: 6, fill: "rgba(60,70,78,.32)" }, R);
      [[0, 0], [W - 7, 0], [0, Hh - 6], [W - 7, Hh - 6]].forEach(([x, y]) => el("rect", { x, y, width: 7, height: 6, fill: "#6d777e" }, R));
      // HVAC unit (wall-mounted) with fan grille
      const hx = W * .58;
      el("rect", { x: hx, y: 14, width: 34, height: 48, rx: 2, fill: "#e6eaec", stroke: "#7c868c", "stroke-width": 1 }, R);
      el("circle", { cx: hx + 17, cy: 32, r: 11, fill: "#3b464d", stroke: "#9aa4aa", "stroke-width": 1 }, R);
      for (let k = 0; k < 4; k++) el("line", { x1: hx + 17, y1: 21, x2: hx + 17, y2: 43, stroke: "#9aa4aa", "stroke-width": .8, transform: `rotate(${k * 45} ${hx + 17} 32)` }, R);
      for (let k = 0; k < 3; k++) el("line", { x1: hx + 5, y1: 50 + k * 3.5, x2: hx + 29, y2: 50 + k * 3.5, stroke: "#8b959b", "stroke-width": .9 }, R);
      // second HVAC on the far end
      el("rect", { x: W - 34, y: 14, width: 24, height: 36, rx: 2, fill: "#e6eaec", stroke: "#7c868c", "stroke-width": 1 }, R);
      el("circle", { cx: W - 22, cy: 30, r: 8, fill: "#3b464d", stroke: "#9aa4aa", "stroke-width": .8 }, R);
      // status display (HMI) with a generic state-of-charge bar
      el("rect", { x: 14, y: 14, width: 34, height: 52, rx: 2, fill: "#0e2636", stroke: "#93a3ae", "stroke-width": .9 }, R);
      el("rect", { x: 20, y: 20, width: 10, height: 40, rx: 1.5, fill: "#0b1c27", stroke: "#4f6b7a", "stroke-width": .6 }, R);
      const fill = el("rect", { x: 21.5, y: 21.5 + 37 * .8, width: 7, height: 37 * .2, fill: "#57c46e", opacity: .95 }, R);
      fill.dataset.y0 = 21.5; fill.dataset.hh = 37; H.soc.push(fill);
      H.bessLed.push(el("circle", { cx: 39, cy: 26, r: 2.6, class: "led" }, R));
      H.bessLed.push(el("circle", { cx: 39, cy: 36, r: 2.6, class: "led" }, R));
      // fire-suppression / safety panel
      el("rect", { x: 56, y: 22, width: 14, height: 18, rx: 1, fill: "#c4373a" }, R);
      el("rect", { x: 58.5, y: 25, width: 9, height: 4, fill: "#f4f0e6" }, R);
      el("rect", { x: 56, y: 44, width: 14, height: 10, rx: 1, fill: "#e9b23f" }, R);
      // end doors with locking bars
      el("rect", { x: 4, y: 6, width: Dp - 8, height: Hh - 12, fill: "none", stroke: "#8c969c", "stroke-width": 1 }, Lf);
      el("line", { x1: Dp / 2, y1: 6, x2: Dp / 2, y2: Hh - 6, stroke: "#8c969c", "stroke-width": 1 }, Lf);
      [12, 26, 44, 58].forEach((x) => { el("line", { x1: x, y1: 8, x2: x, y2: Hh - 8, stroke: "#6f797f", "stroke-width": 1.6 }, Lf); el("rect", { x: x - 2, y: Hh / 2 - 3, width: 4, height: 6, fill: "#5c656b" }, Lf); });
      [[0, 0], [Dp - 7, 0], [0, Hh - 6], [Dp - 7, Hh - 6]].forEach(([x, y]) => el("rect", { x, y, width: 7, height: 6, fill: "#6d777e" }, Lf));
      // roof detail: rain cap / vent
      const t = b.top, mid = (a, c, k) => [a[0] + (c[0] - a[0]) * k, a[1] + (c[1] - a[1]) * k];
      const v0 = mid(t[0], t[1], .2), v1 = mid(t[3], t[2], .2);
      el("line", { x1: v0[0], y1: v0[1], x2: v1[0], y2: v1[1], stroke: "rgba(80,90,98,.35)", "stroke-width": 1.2 }, bessG);
      const e = el("path", { d: `M${P([b.top[3], b.top[0], b.top[1]]).replace(/ /g, " L")} M${b.F[0]},${b.F[1]} L${b.top[0][0]},${b.top[0][1]} M${b.Rv[0]},${b.Rv[1]} L${b.top[1][0]},${b.top[1][1]}`, class: "edge-glow" }, bessG);
      H.edges.push(e);
      H["bess" + n] = b;
    });
    label(781, "Battery energy storage", "containerised · capacity TBD", bessG);

    // ---------- Distribution: switchgear kiosk
    const distG = el("g", { class: "cmp", "data-c": "dist" }, root);
    plinth(distG, [1075, 650], 46, 40);
    const dist = box(distG, [1075, 650], 46, 40, 96, "kiosk");
    el("rect", { x: 4, y: 8, width: 18, height: 80, fill: "none", stroke: "#5f7064", "stroke-width": .9 }, dist.right);
    el("rect", { x: 24, y: 8, width: 18, height: 80, fill: "none", stroke: "#5f7064", "stroke-width": .9 }, dist.right);
    for (let k = 0; k < 4; k++) el("line", { x1: 7, y1: 14 + k * 4, x2: 19, y2: 14 + k * 4, stroke: "#5f7064", "stroke-width": 1 }, dist.right);
    el("path", { d: "M27,30 l5,-9 l5,9 z", fill: "#e9b23f", stroke: "#3a3020", "stroke-width": .5 }, dist.right);
    el("rect", { x: 19, y: 46, width: 2.5, height: 10, fill: "#cfd6da" }, dist.right); el("rect", { x: 39, y: 46, width: 2.5, height: 10, fill: "#cfd6da" }, dist.right);
    H.distLed = el("circle", { cx: 33, cy: 40, r: 2.8, class: "led" }, dist.right);
    label(1080, "Distribution", "switchgear", distG);

    // ---------- Chargers: three free-standing charger cabinets
    const chrG = el("g", { class: "cmp", "data-c": "chargers" }, root);
    plinth(chrG, [1210, 650], 112, 34);
    H.chrLed = [];
    [2, 1, 0].forEach((i) => {
      const c = box(chrG, add([1210, 650], R, i * 39), 32, 30, 106, "cab");
      el("rect", { x: 5, y: 10, width: 22, height: 16, rx: 1.5, fill: "#0e2636", stroke: "#8a8578", "stroke-width": .7 }, c.right);
      el("rect", { x: 7, y: 12, width: 18, height: 6, fill: "#1d4357" }, c.right);
      for (let k = 0; k < 6; k++) el("line", { x1: 6, y1: 34 + k * 4, x2: 26, y2: 34 + k * 4, stroke: "#6a665b", "stroke-width": 1 }, c.right);
      el("path", { d: "M27,62 q8,6 4,22", fill: "none", stroke: "#15191d", "stroke-width": 2.6, "stroke-linecap": "round" }, c.right);
      el("rect", { x: 23, y: 58, width: 7, height: 8, rx: 1.5, fill: "#2a2f34" }, c.right);
      el("rect", { x: 3, y: 94, width: 26, height: 8, fill: "#2c2a25" }, c.right);
      H.chrLed[i] = el("circle", { cx: 16, cy: 30, r: 2.8, class: "led" }, c.right);
    });
    label(1258, "Chargers", "for boat batteries", chrG);

    // ---------- EMS (floating above, separate from the power path)
    const ems = el("g", { class: "cmp", "data-c": "ems" }, root);
    el("rect", { x: 470, y: 40, width: 360, height: 140, rx: 8, fill: "rgba(14,38,54,.92)", stroke: "#93a3ae", "stroke-width": 1.2 }, ems);
    el("rect", { x: 470, y: 40, width: 360, height: 3, rx: 1.5, fill: "#93a3ae", opacity: .5 }, ems);
    el("text", { x: 492, y: 76, class: "sys-name", text: "Energy management system" }, ems);
    el("text", { x: 492, y: 98, class: "sys-sub", text: "monitoring + control" }, ems);
    const nodes = [[512, 145, "#e9b23f"], [590, 128, "#93a3ae"], [590, 162, "#6fb3d2"], [680, 145, "#cfd6da"], [780, 145, "#57c46e"]];
    el("path", { d: "M512,145 L590,128 M512,145 L590,162 M590,128 L680,145 M590,162 L680,145 M680,145 L780,145", stroke: "#93a3ae", "stroke-width": 1.2, opacity: .7 }, ems);
    H.emsNodes = nodes.map(([x, y, c]) => el("circle", { cx: x, cy: y, r: 6.5, fill: c, class: "ems-node" }, ems));

    // ---------- optional grid connection
    const grid = el("g", { class: "cmp-fade", "data-c": "grid" }, root);
    el("rect", { x: 1290, y: 152, width: 280, height: 82, rx: 4, fill: "rgba(7,18,28,.6)", stroke: "#93a3ae", "stroke-dasharray": "6 5" }, grid);
    el("text", { x: 1310, y: 180, class: "sys-name", style: "font-size:20px", text: "Grid connection" }, grid);
    el("text", { x: 1310, y: 202, class: "sys-opt", text: "optional" }, grid);
    el("text", { x: 1310, y: 222, class: "sys-opt", text: "subject to site feasibility" }, grid);
    el("path", { d: "M1330,234 L1330,330 L1140,330 L1110,540", class: "grid-line" }, grid);

    // ---------- power paths (gold): base conduit + arrow + particles
    const layerP = el("g", null, root);
    const PW = {
      pv: "M356,556 C378,566 392,570 412,568",
      chg: "M488,556 C514,555 540,563 566,571",
      link: "M760,598 C770,600 780,602 792,606",
      dis: "M566,598 C540,593 514,588 488,588",
      bus: "M452,664 L476,704 L1046,704 L1072,666",
      chr: "M1116,584 C1140,586 1162,592 1188,600",
      ped: `M1222,664 L1248,704 L1328,704 L${H.peds[0].base[0]},${H.peds[0].base[1] + 2} L${H.peds[1].base[0]},${H.peds[1].base[1] + 2} L${H.peds[2].base[0]},${H.peds[2].base[1] + 2}`
    };
    H.pw = {};
    Object.entries(PW).forEach(([k, d]) => {
      const p = el("path", { d, class: "pw-base" }, layerP);
      const L = p.getTotalLength(); p.style.setProperty("--len", Math.ceil(L));
      const e = p.getPointAtLength(L), q = p.getPointAtLength(Math.max(0, L - 6));
      const a = Math.atan2(e.y - q.y, e.x - q.x) * 180 / Math.PI;
      const arrow = el("path", { d: "M0,0 L-11,-5.5 L-11,5.5 Z", class: "pw-arrow", transform: `translate(${e.x.toFixed(1)},${e.y.toFixed(1)}) rotate(${a.toFixed(1)})` }, layerP);
      const pts = []; for (let s = 0; s <= L; s += 2) { const pt = p.getPointAtLength(s); pts.push([pt.x, pt.y]); }
      H.pw[k] = { path: p, arrow, pts, L };
    });
    // ---------- control links (grey dashed) from the EMS
    const layerC = el("g", null, root);
    const CT = { pcs: "M540,180 C540,300 444,340 444,505", b1: "M640,180 L663,508", b2: "M760,180 L885,508", dist: "M830,128 C980,128 1078,300 1078,528", chr: "M830,88 L1246,88 L1246,512" };
    H.ct = {};
    Object.entries(CT).forEach(([k, d]) => {
      const p = el("path", { d, class: "ct-line" }, layerC);
      const L = p.getTotalLength(), pts = []; for (let s = 0; s <= L; s += 2) { const pt = p.getPointAtLength(s); pts.push([pt.x, pt.y]); }
      H.ct[k] = { path: p, pts, L };
    });
    H.particleLayer = el("g", null, root);
    svg._sys = H;
  };

  /* Scene 4: retrofit — side elevation, kerosene outboard replaced by an electric outboard */
  ILLUS.retrofit = (svg) => {
    const outboard = (kind) => {   // local origin = clamp point on the transom top
      const k = kind === "ice";
      const cowl = k ? "#2b3036" : "#e9edef", cowl2 = k ? "#1c2025" : "#c9d1d5", stripe = k ? "#c4373a" : "#57c46e";
      return `
        <rect x="-6" y="-24" width="16" height="44" rx="3" fill="#5c656b"/>
        <rect x="-34" y="-20" width="16" height="164" fill="${k ? "#3a4148" : "#8d979d"}"/>
        <path d="M-70,-74 Q-74,-128 -34,-136 L8,-136 Q24,-132 24,-104 L24,-62 Q22,-48 6,-46 L-56,-46 Q-70,-50 -70,-74 Z" fill="${cowl}" stroke="#0b1620" stroke-width="2"/>
        <path d="M-66,-96 L22,-96 L22,-84 L-68,-84 Z" fill="${stripe}" opacity=".95"/>
        <path d="M-48,-46 L0,-46 L-4,-18 L-44,-18 Z" fill="${cowl2}" stroke="#0b1620" stroke-width="1.5"/>
        <path d="M14,-70 L96,-60" stroke="#2a2f34" stroke-width="7" stroke-linecap="round"/>
        <rect x="-58" y="136" width="66" height="7" rx="2" fill="${k ? "#3a4148" : "#8d979d"}"/>
        ${k ? `<path d="M-40,143 Q-26,178 -16,143 Z" fill="#3a4148"/>`
            : `<ellipse cx="-22" cy="158" rx="26" ry="11" fill="#c9d1d5" stroke="#0b1620" stroke-width="1.5"/><rect x="-34" y="154" width="14" height="4" fill="#57c46e"/>`}
        <g class="prop"><ellipse cx="${k ? -48 : -52}" cy="158" rx="4" ry="18" fill="#9aa4aa" stroke="#0b1620" stroke-width="1"/></g>
        ${k ? "" : `<circle class="rf-led" cx="-2" cy="-112" r="4.5" fill="#3a4148"/>`}`;
    };
    const puffs = Array.from({ length: 6 }, (_, i) => `<circle class="puff" cx="0" cy="0" r="${10 + (i % 3) * 4}" fill="#7d8287" opacity="0"/>`).join("");
    svg.innerHTML = `
      <defs>
        <linearGradient id="rf-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b6f84"/><stop offset="1" stop-color="#0b2a3a"/></linearGradient>
        <linearGradient id="rf-hull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f0e6"/><stop offset="1" stop-color="#cfc8b8"/></linearGradient>
        <linearGradient id="rf-cut" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d3a42"/><stop offset="1" stop-color="#1b252c"/></linearGradient>
        <clipPath id="rf-cutclip"><path d="M600,445 L850,443 L850,512 L600,516 Z"/></clipPath>
        <filter id="rf-soft"><feGaussianBlur stdDeviation="6"/></filter>
      </defs>
      <rect x="-100" y="0" width="1800" height="900" fill="#0a1a26"/><ellipse cx="800" cy="520" rx="760" ry="200" fill="#2e6e8e" opacity=".18" filter="url(#rf-soft)"/>
      <rect x="-100" y="520" width="1800" height="400" fill="url(#rf-sea)"/>
      <g id="rf-waves">
        ${[548, 600, 660, 730, 810].map((y, i) => `<path class="rf-wave" d="M-200,${y} ${Array.from({ length: 22 }, () => "q50,-8 100,0").join(" ")}" style="opacity:${.9 - i * .12}"/>`).join("")}
      </g>
      <g id="rf-boat">
        <!-- hull -->
        <path d="M360,430 Q900,446 1300,388 Q1205,522 1000,556 Q700,580 380,562 Z" fill="url(#rf-hull)" stroke="#0b1620" stroke-width="2.5"/>
        <path d="M362,446 Q900,462 1278,404" fill="none" stroke="#2e6e8e" stroke-width="12"/>
        <path d="M376,548 Q700,566 996,543 Q1150,530 1230,470" fill="none" stroke="#7a3b2e" stroke-width="9" opacity=".9"/>
        <path d="M360,430 L380,562" stroke="#0b1620" stroke-width="3"/>
        <use href="#sym-person" x="930" y="300" width="50" height="128" fill="#14181e"/>
        <use href="#sym-person" x="1040" y="292" width="46" height="120" fill="#14181e"/>
        <!-- cutaway with battery -->
        <g id="rf-cutaway" opacity="0">
          <path d="M600,445 L850,443 L850,512 L600,516 Z" fill="url(#rf-cut)" stroke="#f4f0e6" stroke-width="2" stroke-dasharray="7 5"/>
          <g clip-path="url(#rf-cutclip)">
            <g id="rf-batt" style="transform: translateX(380px)">
              <rect x="650" y="456" width="150" height="48" rx="4" fill="#26323b" stroke="#e9b23f" stroke-width="2.5"/>
              <rect x="700" y="450" width="18" height="6" rx="1.5" fill="#e9b23f"/>
              <rect x="664" y="466" width="96" height="10" rx="2" fill="#0e2636" stroke="#4f6b7a"/>
              <rect id="rf-soc" x="665.5" y="467.5" width="${93 * .95}" height="7" fill="#57c46e"/>
              ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${666 + i * 16}" y="484" width="12" height="12" rx="1.5" fill="#33434d"/>`).join("")}
              <circle cx="784" cy="471" r="4" fill="#57c46e"/>
            </g>
          </g>
        </g>
        <path id="rf-cable" class="rf-cable" d="M650,486 C560,494 470,486 404,462 C392,457 384,452 372,446"/>
        <!-- engine slot on the transom -->
        <g transform="translate(360,440)">
          <g id="rf-ice">${outboard("ice")}<g id="rf-smoke" transform="translate(-60,-30)">${puffs}</g></g>
          <g id="rf-ev" style="transform: translateY(-760px)">${outboard("ev")}</g>
        </g>
        <g id="rf-wake" opacity="0"><path d="M300,560 q-60,-6 -140,4 M306,574 q-90,6 -230,16 M300,548 q-40,-4 -90,0" stroke="rgba(255,255,255,.6)" stroke-width="3" fill="none" stroke-linecap="round"/></g>
      </g>
      <!-- hoist -->
      <g id="rf-hook" transform="translate(326,304)"><g id="rf-hook-in" style="transform: translateY(-760px)">
        <line x1="0" y1="-1400" x2="0" y2="-14" stroke="#cfd6da" stroke-width="2.5"/>
        <rect x="-9" y="-24" width="18" height="12" rx="2" fill="#e9b23f"/>
        <path d="M0,-12 L0,0 Q0,10 -9,10 Q-16,10 -16,3" fill="none" stroke="#cfd6da" stroke-width="4" stroke-linecap="round"/>
      </g></g>
      <!-- labels -->
      <g class="rf-tag" id="rf-t-ice"><path d="M250,330 L170,250" class="leader" stroke="#f4f0e6" stroke-width="1.4" fill="none"/>
        <text x="170" y="228" text-anchor="middle" class="sys-name sys-lbl">Kerosene outboard</text>
        <text x="170" y="250" text-anchor="middle" class="sys-sub sys-lbl" dy="-2" style="fill:#e98c5a">existing · to be replaced</text></g>
      <g class="rf-tag" id="rf-t-ev"><path d="M250,330 L170,250" stroke="#f4f0e6" stroke-width="1.4" fill="none"/>
        <text x="170" y="228" text-anchor="middle" class="sys-name sys-lbl">Electric outboard</text>
        <text x="170" y="250" text-anchor="middle" class="sys-sub sys-lbl" dy="-2">rating to be finalised</text></g>
      <g class="rf-tag" id="rf-t-batt"><path d="M725,442 L725,368" stroke="#f4f0e6" stroke-width="1.4" fill="none"/>
        <text x="725" y="336" text-anchor="middle" class="sys-name sys-lbl">Onboard battery</text>
        <text x="725" y="358" text-anchor="middle" class="sys-sub sys-lbl">stays in the boat · plug-in charged</text></g>
      <g id="rf-chips">
        ${["No kerosene needed", "No exhaust · quieter", "Running cost to validate in pilot"].map((t, i) => `<g class="rf-tag rf-chip" transform="translate(${1060},${170 + i * 54})"><rect width="${t.length * 9.4 + 46}" height="40" rx="20"/><circle cx="20" cy="20" r="5" fill="${i === 2 ? "#e9b23f" : "#57c46e"}"/><text x="34" y="25.5">${t}</text></g>`).join("")}
      </g>`;
  };

  /* Scene 8: plug-in charging at the jetty berth — power (gold) to an onboard pack */
  ILLUS.swap = (svg) => {
    svg.innerHTML = "";
    const g = el("g", null, svg);
    // water, jetty deck (side elevation), pilings
    el("rect", { x: 0, y: 372, width: 1600, height: 198, fill: "#16364a" }, g);
    el("path", { d: "M0,420 q60,-8 120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0", stroke: "rgba(255,255,255,.12)", "stroke-width": 2, fill: "none" }, g);
    for (let x = 30; x < 1320; x += 90) el("rect", { x, y: 352, width: 8, height: 120, fill: "#3a3a34" }, g);
    el("rect", { x: 0, y: 338, width: 1330, height: 16, fill: "#8a7d63" }, g);
    el("text", { x: 20, y: 120, class: "d-sub", text: "Jetty berths · 3 of ~250 shown" }, g);
    // charger + switch room on shore (right)
    el("rect", { x: 1330, y: 300, width: 270, height: 270, fill: "#6e5a43" }, g);
    const room = el("g", null, g);
    el("rect", { x: 1360, y: 150, width: 210, height: 150, fill: "#3b3a35", stroke: "#e7e2d4", "stroke-width": 2 }, room);
    el("path", { d: "M1345,150 L1585,150 L1570,128 L1360,128 Z", fill: "#4a4840" }, room);
    for (let i = 0; i < 4; i++) {
      el("rect", { x: 1378 + i * 48, y: 176, width: 36, height: 100, fill: "#26323b", stroke: "#cfd6da", "stroke-width": 1 }, room);
      el("rect", { x: 1384 + i * 48, y: 186, width: 24, height: 14, fill: "#0e2636" }, room);
      el("circle", { cx: 1396 + i * 48, cy: 262, r: 4, fill: "#57c46e", class: "fac-led on" }, room);
    }
    el("text", { x: 1465, y: 112, "text-anchor": "middle", class: "d-lbl", text: "Charger + switch room" }, room);
    el("text", { x: 1465, y: 330, "text-anchor": "middle", class: "d-sub", text: "fed from BESS + PV" }, room);
    // power feeder along the jetty (gold) to each pedestal
    el("path", { d: "M1360,290 L1340,290 L1340,360 L60,360", class: "pflow pflow--rev" }, g);
    const peds = [210, 690, 1170].map((px, k) => {
      const pg = el("g", null, g);
      el("rect", { x: px - 7, y: 250, width: 14, height: 90, fill: "#cfd6da" }, pg);
      el("rect", { x: px - 20, y: 214, width: 40, height: 50, rx: 4, fill: "#e7e2d4" }, pg);
      el("rect", { x: px - 13, y: 221, width: 26, height: 14, fill: "#0e2636" }, pg);
      const lamp = el("circle", { cx: px, cy: 248, r: 5, fill: "#3a4148" }, pg);
      el("path", { d: `M${px},340 L${px},360`, stroke: "#e9b23f", "stroke-width": 3 }, pg);
      return { x: px, lamp };
    });
    el("text", { x: 690, y: 200, "text-anchor": "middle", class: "d-lbl", text: "Charging pedestal" }, g);
    el("text", { x: 690, y: 180, "text-anchor": "middle", class: "d-sub", text: "metered · weather-rated" }, g);
    // boats: A charging (static), B animated, C finished
    const boatAt = (bx, cls) => { const b = el("g", { class: cls, transform: `translate(${bx},358)` }, g); el("use", { href: "#sym-boat-e", width: 360, height: 95 }, b); return b; };
    const cable = (px, bx) => el("path", { d: `M${px + 12},238 C${px + 60},250 ${bx + 150},300 ${bx + 104},392`, fill: "none", stroke: "#e9b23f", "stroke-width": 4, "stroke-linecap": "round" }, g);
    const socBar = (bx, v) => { const sg = el("g", { transform: `translate(${bx + 70},150)` }, g); el("rect", { width: 80, height: 12, rx: 3, fill: "#0e2636", stroke: "#cfd6da" }, sg); const f = el("rect", { x: 2, y: 2, width: 76 * v, height: 8, rx: 2, fill: v > .6 ? "#57c46e" : "#e9b23f" }, sg); return f; };
    boatAt(20, "bA"); cable(210, 20); const fA = socBar(20, .45); peds[0].lamp.setAttribute("fill", "#e9b23f");
    boatAt(980, "bC"); cable(1170, 980); socBar(980, 1); peds[2].lamp.setAttribute("fill", "#57c46e");
    const boatB = boatAt(500, "bB");
    const cB = cable(690, 500); cB.setAttribute("id", "sw-cable");
    const fB = socBar(500, .2); fB.setAttribute("id", "sw-soc");
    el("text", { x: 120, y: 520, class: "d-sub", text: "charging" }, g);
    el("text", { x: 1080, y: 520, class: "d-sub", text: "charged · ready" }, g);
    el("text", { x: 600, y: 520, class: "d-sub", text: "onboard battery · no handling ashore" }, g);
    svg._swap = { boatB, cable: cB, socB: fB, socA: fA, lampB: peds[1].lamp, socLabel: null };
  };

  /* Scene 10: benefit vignettes, consistent flat style */
  const BG = (svg, sky) => `<rect width="320" height="200" fill="${sky || "#163647"}"/>`;
  ILLUS["b-cost"] = (svg) => { svg.innerHTML = BG() + `<rect y="150" width="320" height="50" fill="#6e5a43"/>
    <use href="#sym-boat-e" x="110" y="120" width="200" height="54"/>
    <use href="#sym-person" x="40" y="72" width="40" height="100" fill="#0b1a24"/>
    <g transform="translate(110,60)"><circle r="26" fill="#e9b23f"/><text y="11" text-anchor="middle" style="font:700 30px var(--f-body);fill:#07121c">₹</text></g>`; };
  const PED = (x, y, lamp) => `<rect x="${x - 4}" y="${y}" width="8" height="46" fill="#cfd6da"/><rect x="${x - 11}" y="${y - 22}" width="22" height="26" rx="3" fill="#e7e2d4"/><rect x="${x - 7}" y="${y - 18}" width="14" height="8" fill="#0e2636"/><circle cx="${x}" cy="${y - 3}" r="3" fill="${lamp}"/>`;
  ILLUS["b-time"] = (svg) => { svg.innerHTML = BG() + `<rect y="148" width="320" height="52" fill="#16364a"/><rect y="140" width="320" height="9" fill="#8a7d63"/>${PED(70, 96, "#57c46e")}
    <use href="#sym-boat-e" x="90" y="118" width="200" height="54"/><path d="M80,84 C110,92 150,110 136,140" stroke="#e9b23f" stroke-width="3" fill="none"/>
    <g transform="translate(262,44)"><circle r="20" fill="#0e2636" stroke="#f4f0e6" stroke-width="3"/><path d="M0,0 L0,-14 A14,14 0 0 1 12,-7 Z" fill="#57c46e"/></g>`; };
  ILLUS["b-access"] = (svg) => { svg.innerHTML = `<rect width="320" height="200" fill="#3a3550"/><circle cx="270" cy="50" r="20" fill="#ffd9a0"/><rect y="150" width="320" height="50" fill="#16364a"/><rect y="142" width="320" height="9" fill="#8a7d63"/>` + [40, 100, 160, 220].map((x) => PED(x, 98, "#57c46e")).join("") + `<use href="#sym-boat-e" x="10" y="140" width="120" height="32" opacity=".9"/><use href="#sym-boat-e" x="150" y="140" width="120" height="32" opacity=".9"/>`; };
  ILLUS["b-jobs"] = (svg) => { svg.innerHTML = BG("#2a2a26") + `<rect x="170" y="30" width="130" height="150" fill="#3b3a35" stroke="#e7e2d4"/>` + [0, 1, 2].map((i) => `<rect x="${182 + i * 38}" y="44" width="30" height="120" fill="#26323b" stroke="#cfd6da"/><rect x="${186 + i * 38}" y="52" width="22" height="14" fill="#0e2636"/><circle cx="${197 + i * 38}" cy="150" r="4" fill="${i === 1 ? "#e9b23f" : "#57c46e"}"/>`).join("") + `<use href="#sym-person" x="70" y="70" width="46" height="116" fill="#d8d2c2"/><rect x="104" y="104" width="30" height="20" rx="2" fill="#57c46e"/><path d="M118,124 l18,-30" stroke="#e9b23f" stroke-width="3"/>`; };
  ILLUS["b-skills"] = (svg) => { svg.innerHTML = BG() + `<rect x="150" y="26" width="150" height="96" fill="#0e2636" stroke="#93a3ae"/><path d="M170,74 h40 m10,-20 v40 m0,-20 h40" stroke="#e9b23f" stroke-width="3"/><rect x="226" y="58" width="26" height="34" fill="none" stroke="#57c46e" stroke-width="3"/>
    <g fill="#0b1a24"><use href="#sym-person" x="30" y="100" width="34" height="86"/><use href="#sym-person" x="72" y="104" width="32" height="82"/><use href="#sym-person" x="112" y="102" width="34" height="86"/></g><use href="#sym-person" x="250" y="96" width="38" height="96" fill="#d8d2c2"/>`; };
  ILLUS["b-env"] = (svg) => { svg.innerHTML = `<rect width="320" height="200" fill="#8fb6c9"/><rect y="110" width="320" height="90" fill="#2e6e8e"/>
    <use href="#sym-boat-e" x="80" y="82" width="170" height="46"/>
    <path d="M30,40 q8,-8 16,0 q8,-8 16,0 M240,30 q6,-6 12,0 q6,-6 12,0" stroke="#163647" stroke-width="2.5" fill="none"/>
    <path d="M60,160 q14,-10 28,0 q-14,10 -28,0 z M200,170 q12,-8 24,0 q-12,8 -24,0 z" fill="#cfe3ea" opacity=".7"/>`; };

  /* Scene 14: simplified Tamil Nadu coastline (schematic, not to scale) */
  ILLUS.tn = (svg) => {
    const P = ([lon, lat]) => [+((lon - 76.1) * 108).toFixed(1), +((13.75 - lat) * 108).toFixed(1)];
    const coast = [[80.33, 13.55], [80.29, 13.08], [80.19, 12.62], [79.98, 12.15], [79.85, 11.93], [79.77, 11.75], [79.78, 11.45], [79.84, 10.92], [79.85, 10.6], [79.87, 10.29], [79.55, 10.3], [79.3, 10.2], [79.12, 9.98], [79.02, 9.74], [79.1, 9.4], [79.18, 9.28], [79.42, 9.18], [79.15, 9.24], [78.8, 9.22], [78.5, 9.13], [78.3, 9.03], [78.15, 8.79], [78.13, 8.55], [78.06, 8.38], [77.85, 8.22], [77.55, 8.08], [77.3, 8.15], [77.15, 8.3]];
    const inland = [[77.2, 8.6], [77.3, 9.1], [77.2, 9.6], [77.3, 10.1], [76.85, 10.6], [76.75, 11.25], [76.4, 11.6], [76.6, 11.85], [77.1, 11.9], [77.6, 12.25], [77.8, 12.75], [78.4, 12.62], [78.7, 12.9], [79.3, 13.15], [79.8, 13.45], [80.33, 13.55]];
    const land = polyD(coast.concat(inland).map(P), true);
    svg.innerHTML = "";
    el("path", { d: land, class: "tn-land" }, svg);
    el("path", { d: polyD(coast.map(P)), class: "tn-coast" }, svg);
    const ref = (lon, lat, t, dx) => { const [x, y] = P([lon, lat]); el("circle", { cx: x, cy: y, r: 3, class: "tn-ref" }, svg); el("text", { x: x + (dx || 8), y: y + 4, class: "tn-ref-t", "text-anchor": dx < 0 ? "end" : "start", text: t }, svg); };
    ref(80.27, 13.08, "Chennai", 10);
    ref(78.13, 8.79, "Thoothukudi", 10);
    ref(77.55, 8.08, "Kanyakumari", -10);
    // illustrative hollow markers along the coast (no sites identified)
    [[79.84, 11.3], [79.85, 10.7], [79.25, 9.95], [78.6, 9.15], [80.1, 12.4]].forEach((c, i) => { const [x, y] = P(c); el("circle", { cx: x, cy: y, r: 7, class: "tn-future", style: `--fd:${(1.6 + i * .35).toFixed(2)}s` }, svg); });
    const [mx, my] = P([78.06, 8.38]);
    el("circle", { cx: mx, cy: my, r: 9, class: "tn-pulse" }, svg);
    el("circle", { cx: mx, cy: my, r: 7, class: "tn-pilot" }, svg);
    el("text", { x: 20, y: 660, class: "tn-note", text: "◯ potential future locations · illustrative only" }, svg);
  };

  /* ================================================================ SCENES */
  const FX = {};
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  FX.challenge = {
    BEATS: [
      { spot: [700, 610], t: "Fuel bought and carried by hand", s: "Before every trip" },
      { spot: [1290, 400], t: "A recurring cost every trip", s: "Fuel spend rises with distance and price" },
      { spot: [320, 570], t: "Time lost replenishing energy", s: "Queueing, carrying, refuelling" }
    ],
    enter(ctx, scene) {
      const B = this.BEATS, cap = $(".beat-cap", scene), pips = $$(".beat-pips i", scene);
      const spot = $("#ch-spot", scene);
      const show = (k) => {
        const b = B[k];
        spot.style.transform = `translate(${b.spot[0]}px, ${b.spot[1]}px)`;
        cap.classList.add("swap");
        ctx.after(380, () => {
          $(".beat-n", cap).textContent = `0${k + 1} / 03`;
          $(".beat-t", cap).textContent = b.t; $(".beat-s", cap).textContent = b.s;
          pips.forEach((p, j) => p.classList.toggle("on", j <= k));
          cap.classList.remove("swap");
        });
      };
      let k = 0; const cycle = () => { show(k); k = (k + 1) % B.length; ctx.after(5200, cycle); };
      show(0); k = 1; ctx.after(5200, cycle);
      if (reduced()) return;
      const A = (sel, frames, opts) => { const n = $(sel, scene); if (n) ctx.anim(n.animate(frames, opts)); };
      // beat 1: carrier walks the cans down to the boat; fuel is poured by hand
      A("#ch-walker", [{ transform: "translate(560px,0px)" }, { transform: "translate(700px,8px)" }], { duration: 5200, iterations: Infinity, easing: "linear" });
      A("#ch-bob", [{ transform: "translateY(0px) rotate(0deg)" }, { transform: "translateY(-4px) rotate(-1.5deg)" }, { transform: "translateY(0px) rotate(0deg)" }], { duration: 650, iterations: Infinity });
      A("#ch-can", [{ transform: "translate(30px,8px) rotate(-30deg)" }, { transform: "translate(30px,8px) rotate(-46deg)" }, { transform: "translate(30px,8px) rotate(-30deg)" }], { duration: 2400, iterations: Infinity, easing: "ease-in-out" });
      A("#ch-drip", [{ strokeDashoffset: 0 }, { strokeDashoffset: -18 }], { duration: 500, iterations: Infinity });
      // beat 2: a boat heads out trailing exhaust while the gauge falls
      A("#ch-seaboat", [{ transform: "translate(1040px,452px)", opacity: 0 }, { opacity: 1, offset: .1 }, { opacity: 1, offset: .85 }, { transform: "translate(1420px,440px)", opacity: 0 }], { duration: 10400, iterations: Infinity, easing: "linear" });
      $$("#ch-smoke .puff", scene).forEach((c, i) => ctx.anim(c.animate([
        { transform: "translate(0px,0px) scale(.4)", opacity: 0 }, { opacity: .55, offset: .15 },
        { transform: `translate(${-70 - i * 6}px,${-46 - (i % 3) * 10}px) scale(2.6)`, opacity: 0 }
      ], { duration: 2600, delay: i * 430, iterations: Infinity, easing: "ease-out" })));
      A("#ch-needle", [{ transform: "rotate(70deg)" }, { transform: "rotate(-64deg)" }, { transform: "rotate(-64deg)", offset: .9 }, { transform: "rotate(70deg)" }], { duration: 10400, iterations: Infinity, easing: "ease-in-out" });
      // beat 3: the clock keeps turning while the queue waits
      A("#ch-clock", [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], { duration: 3000, iterations: Infinity });
    },
    exit(ctx, scene) {
      const spot = $("#ch-spot", scene); if (spot) spot.style.transform = "translate(700px, 610px)";
      $$(".beat-pips i", scene).forEach((p) => p.classList.remove("on"));
    }
  };

  /* Scene 7 sequencer: reveal → generate → store → deliver → monitor → steady loop.
     Plays once per visit; the steady state keeps only slow particle flow and signal pulses. */
  FX.bess = {
    reset(svg, scene) {
      const H = svg._sys;
      $$(".cmp, .cmp-fade", svg).forEach((n) => n.classList.remove("in"));
      Object.values(H.pw).forEach((s) => { s.path.classList.remove("in"); s.arrow.classList.remove("in"); });
      Object.values(H.ct).forEach((s) => s.path.classList.remove("in"));
      [H.pcsLed, H.distLed, ...H.bessLed, ...H.chrLed].forEach((l) => l.classList.remove("ok", "chg"));
      H.peds.forEach((p) => p.lamp.classList.remove("on"));
      H.edges.forEach((e) => e.classList.remove("in"));
      H.soc.forEach((r) => { const y0 = +r.dataset.y0, hh = +r.dataset.hh; r.setAttribute("height", (hh * .2).toFixed(1)); r.setAttribute("y", (y0 + hh * .8).toFixed(1)); });
      H.cable.setAttribute("stroke", "#3a4148");
      H.sweep.style.opacity = 0;
      H.particleLayer.innerHTML = "";
      $$(".sys-stages li", scene).forEach((li) => li.classList.remove("on", "done"));
    },
    finalState(svg, scene) {
      const H = svg._sys;
      $$(".cmp, .cmp-fade", svg).forEach((n) => n.classList.add("in"));
      Object.values(H.pw).forEach((s) => { s.path.classList.add("in"); s.arrow.classList.add("in"); });
      Object.values(H.ct).forEach((s) => s.path.classList.add("in"));
      [H.pcsLed, H.distLed, ...H.bessLed, ...H.chrLed].forEach((l) => l.classList.add("ok"));
      H.peds.forEach((p) => p.lamp.classList.add("on"));
      H.edges.forEach((e) => e.classList.add("in"));
      this.setSoc(H, .78);
      H.cable.setAttribute("stroke", "#e9b23f");
      $$(".sys-stages li", scene).forEach((li) => li.classList.add("on"));
    },
    setSoc(H, v) { H.soc.forEach((r, i) => { const y0 = +r.dataset.y0, hh = +r.dataset.hh, vv = Math.min(1, v - (i % 2) * .03); r.setAttribute("height", (hh * vv).toFixed(1)); r.setAttribute("y", (y0 + hh * (1 - vv)).toFixed(1)); }); },
    enter(ctx, scene) {
      const svg = $("[data-illus=bess]", scene), H = svg._sys, self = this;
      this.reset(svg, scene);
      if (reduced()) { this.finalState(svg, scene); return; }
      const on = (sel) => $$(sel, svg).forEach((n) => n.classList.add("in"));
      const stage = (k) => $$(".sys-stages li", scene).forEach((li) => { const n = +li.dataset.st; li.classList.toggle("on", n === k); li.classList.toggle("done", n < k); });
      const draw = (...keys) => keys.forEach((k) => { H.pw[k].path.classList.add("in"); ctx.after(1200, () => H.pw[k].arrow.classList.add("in")); });
      const T = (ms, f) => ctx.after(ms, f);

      // particle engine (one rAF loop; frozen while the deck is paused)
      const streams = [];
      const stream = (src, n, speed, kind) => {
        const g = el("g", null, H.particleLayer), els = [];
        for (let i = 0; i < n; i++) {
          if (kind === "sig") els.push(el("rect", { x: -3, y: -3, width: 6, height: 6, class: "ct-p", opacity: 0 }, g));
          else { const pg = el("g", { opacity: 0 }, g); el("circle", { r: 6, class: "pw-p-h" }, pg); el("circle", { r: 2.8, class: "pw-p" }, pg); els.push(pg); }
        }
        streams.push({ pts: src.pts, L: src.L, n, speed, els, t0: performance.now(), kind, rev: kind === "sigUp" });
      };
      let last = performance.now(), clock = 0;
      const tick = (now) => {
        const dt = now - last; last = now;
        if (!document.documentElement.classList.contains("paused")) clock += dt;
        streams.forEach((s) => {
          const age = clock - (s.start ?? (s.start = clock));
          const N = s.pts.length - 1;
          s.els.forEach((e, i) => {
            let d = (age / 1000 * s.speed + (i * s.L) / s.n) % s.L;
            const u = d / s.L, idx = Math.min(N, Math.round(u * N));
            const [x, y] = s.pts[s.kind === "sig" && i % 2 ? N - idx : idx];
            const fade = Math.min(1, u * 8, (1 - u) * 8);
            const born = age > (i * s.L / s.n) / s.speed * 1000 * 0 ? 1 : 0;
            e.setAttribute("transform", s.kind === "sig" ? `translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(45)` : `translate(${x.toFixed(1)},${y.toFixed(1)})`);
            e.setAttribute("opacity", (fade * born * (s.kind === "sig" ? .9 : 1)).toFixed(2));
          });
        });
        // slow PV light sweep in the steady state
        if (H.sweepOn) { const ph = (clock % 9000) / 9000; H.sweep.setAttribute("x", (-140 + ph * 560).toFixed(1)); H.sweep.style.opacity = ph < .75 ? 1 : 0; }
        ctx.raf(tick);
      };
      ctx.raf(tick);

      // Stage 1 — reveal (component by component, never all at once)
      [["pv", 300], ["pcs", 800], ["bess", 1250], ["dist", 1900], ["chargers", 2150], ["jetty", 2400], ["ems", 2950]]
        .forEach(([c, t]) => T(t, () => on(`[data-c="${c}"]`)));
      // Stage 2 — generate
      T(3700, () => { stage(1); H.sweepOn = true; draw("pv"); });
      T(4500, () => stream(H.pw.pv, 5, 70));
      T(5100, () => H.pcsLed.classList.add("ok"));
      // Stage 3 — store
      T(6300, () => { stage(2); draw("chg"); });
      T(7000, () => {
        stream(H.pw.chg, 4, 60); draw("link"); stream(H.pw.link, 2, 30);
        H.edges.forEach((e) => e.classList.add("in")); H.bessLed.forEach((l) => l.classList.add("chg"));
        const t0 = performance.now();
        const grow = (now) => { const t = Math.min(1, (now - t0) / 5600); self.setSoc(H, .2 + .58 * easeInOut(t)); if (t < 1) ctx.raf(grow); else H.bessLed.forEach((l) => { l.classList.remove("chg"); l.classList.add("ok"); }); };
        ctx.raf(grow);
      });
      // Stage 4 — deliver
      T(9900, () => { stage(3); draw("dis", "bus"); });
      T(10600, () => { stream(H.pw.dis, 4, 60); stream(H.pw.bus, 9, 85); H.distLed.classList.add("ok"); });
      T(11300, () => { draw("chr"); stream(H.pw.chr, 3, 55); });
      H.chrLed.forEach((l, i) => T(11900 + i * 320, () => l.classList.add("ok")));
      T(12700, () => { draw("ped"); stream(H.pw.ped, 6, 75); });
      H.peds.forEach((p, i) => T(13300 + i * 420, () => p.lamp.classList.add("on")));
      T(14600, () => H.cable.setAttribute("stroke", "#e9b23f"));
      // Stage 5 — monitor + control
      T(15500, () => stage(4));
      ["pcs", "b1", "b2", "dist", "chr"].forEach((k, i) => T(15600 + i * 260, () => H.ct[k].path.classList.add("in")));
      T(16300, () => on('[data-c="grid"]'));
      T(17000, () => ["pcs", "b1", "b2", "dist", "chr"].forEach((k) => stream(H.ct[k], 2, 42, "sig")));
      // Stage 6 — steady operation: everything stays; flows loop slowly
      T(19000, () => $$(".sys-stages li", scene).forEach((li) => { li.classList.remove("done"); li.classList.add("on"); }));
    },
    exit(ctx, scene) { const svg = $("[data-illus=bess]", scene); svg._sys.sweepOn = false; this.reset(svg, scene); }
  };

  FX.retrofit = {
    enter(ctx, scene) {
      const svg = $("[data-illus=retrofit]", scene);
      ILLUS.retrofit(svg);   // fresh state on every visit
      const q = (s) => svg.querySelector(s), on = (s) => q(s).classList.add("in"), off = (s) => q(s).classList.remove("in");
      const stage = (k) => $$(".rf-stages li", scene).forEach((li) => { const n = +li.dataset.st; li.classList.toggle("on", n === k); li.classList.toggle("done", n < k); });
      const cable = q("#rf-cable"), L = cable.getTotalLength();
      cable.style.strokeDasharray = L; cable.style.strokeDashoffset = L;
      const A = (sel, frames, opts) => { const n = q(sel); return n ? ctx.anim(n.animate(frames, Object.assign({ fill: "forwards", easing: "cubic-bezier(.65,0,.35,1)" }, opts))) : null; };
      const T = (ms, f) => ctx.after(ms, f);
      const final = () => {
        q("#rf-ice").style.display = "none"; q("#rf-hook").style.display = "none";
        q("#rf-ev").style.transform = "none"; q("#rf-cutaway").setAttribute("opacity", 1); q("#rf-batt").style.transform = "none";
        cable.style.strokeDashoffset = 0; q(".rf-led").setAttribute("fill", "#57c46e");
        ["#rf-t-ev", "#rf-t-batt"].forEach(on); $$(".rf-chip", svg).forEach((c) => c.classList.add("in"));
        $$(".rf-stages li", scene).forEach((li) => li.classList.add("on"));
      };
      $$(".rf-stages li", scene).forEach((li) => li.classList.remove("on", "done"));
      if (reduced()) { final(); return; }
      // intro: the kerosene engine running (exhaust puffs, gentle bob)
      const bob = A("#rf-boat", [{ transform: "translateY(0px)" }, { transform: "translateY(4px)" }, { transform: "translateY(0px)" }], { duration: 3600, iterations: Infinity, easing: "ease-in-out", fill: "none" });
      $$("#rf-smoke .puff", svg).forEach((c, i) => ctx.anim(c.animate([
        { transform: "translate(0px,0px) scale(.4)", opacity: 0 }, { opacity: .6, offset: .15 },
        { transform: `translate(${-90 - i * 8}px,${-60 - (i % 3) * 14}px) scale(2.6)`, opacity: 0 }], { duration: 2400, delay: i * 400, iterations: Infinity, easing: "ease-out" })));
      T(700, () => on("#rf-t-ice"));
      // 1 · remove: hook comes down, engine is lifted off and swung clear
      T(2600, () => { stage(1); A("#rf-hook-in", [{ transform: "translateY(-760px)" }, { transform: "translateY(0px)" }], { duration: 1500 }); });
      T(3600, () => { off("#rf-t-ice"); $$("#rf-smoke .puff", svg).forEach((c) => c.style.display = "none"); });
      T(4100, () => {
        A("#rf-ice", [{ transform: "translate(0px,0px)", opacity: 1 }, { transform: "translate(0px,-300px)", opacity: 1, offset: .55 }, { transform: "translate(-340px,-330px)", opacity: 0 }], { duration: 2600 });
        A("#rf-hook-in", [{ transform: "translate(0px,0px)", opacity: 1 }, { transform: "translate(0px,-300px)", opacity: 1, offset: .55 }, { transform: "translate(-340px,-330px)", opacity: 0 }], { duration: 2600 });
      });
      // 2 · fit motor: electric outboard lowered onto the transom bracket
      T(7000, () => {
        stage(2);
        A("#rf-hook-in", [{ transform: "translate(0px,-760px)", opacity: 1 }, { transform: "translate(0px,0px)", opacity: 1 }], { duration: 1900 });
        A("#rf-ev", [{ transform: "translateY(-760px)" }, { transform: "translateY(0px)" }], { duration: 1900 });
      });
      T(9100, () => { A("#rf-hook-in", [{ transform: "translate(0px,0px)" }, { transform: "translate(0px,-800px)" }], { duration: 1100 }); on("#rf-t-ev"); });
      // 3 · fit battery: cutaway opens, pack slides into the hull
      T(10600, () => { stage(3); A("#rf-cutaway", [{ opacity: 0 }, { opacity: 1 }], { duration: 600 }); });
      T(11100, () => A("#rf-batt", [{ transform: "translateX(380px)" }, { transform: "translateX(0px)" }], { duration: 1500 }));
      T(12500, () => on("#rf-t-batt"));
      // 4 · connect: power cable from battery to motor, motor status goes green
      T(13400, () => { stage(4); A("#rf-cable", [{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: 1400 }); });
      T(14900, () => q(".rf-led").setAttribute("fill", "#57c46e"));
      // 5 · go: underway on electric — no exhaust, wake behind, sea moving, charge slowly used
      T(16400, () => {
        stage(5);
        A("#rf-waves", [{ transform: "translateX(0px)" }, { transform: "translateX(-100px)" }], { duration: 1600, iterations: Infinity, easing: "linear", fill: "none" });
        A("#rf-wake", [{ opacity: 0 }, { opacity: 1 }], { duration: 900 });
        A("#rf-ev .prop", [{ transform: "scaleY(1)" }, { transform: "scaleY(.2)" }, { transform: "scaleY(1)" }], { duration: 260, iterations: Infinity, easing: "linear", fill: "none" });
        const s = q("#rf-soc"); A("#rf-soc", [{ width: s.getAttribute("width") + "px" }, { width: (93 * .6) + "px" }], { duration: 9000, easing: "linear" });
        $$(".rf-chip", svg).forEach((c, i) => T(16900 + i * 450 - 16400 + 0, () => c.classList.add("in")));
      });
      T(18600, () => $$(".rf-stages li", scene).forEach((li) => { li.classList.remove("done"); li.classList.add("on"); }));
    },
    exit(ctx, scene) { $$(".rf-stages li", scene).forEach((li) => li.classList.remove("on", "done")); }
  };

  FX.swap = {
    enter(ctx, scene) {
      const st = $("[data-illus=swap]", scene)._swap, steps = $$(".steps li", scene);
      const mark = (k) => steps.forEach((s, j) => { s.classList.toggle("on", j === k); s.classList.toggle("done", j < k); });
      const R = reduced();
      const L = Math.ceil(st.cable.getTotalLength());
      const setCable = (v) => { st.cable.style.strokeDasharray = L; st.cable.style.strokeDashoffset = L * (1 - v); };
      const setSoc = (v) => { st.socB.setAttribute("width", (76 * v).toFixed(1)); st.socB.setAttribute("fill", v > .6 ? "#57c46e" : "#e9b23f"); };
      const tween = (dur, f) => R ? (f(1), Promise.resolve()) : new Promise((res) => { const t0 = performance.now(); const step = (now) => { if (!ctx.alive()) return res(); const t = Math.min(1, (now - t0) / dur); f(easeInOut(t)); t < 1 ? ctx.raf(step) : res(); }; ctx.raf(step); });
      // slow background charge on boat A
      let a = .45; const tickA = () => { a = a >= 1 ? .45 : a + .02; st.socA.setAttribute("width", (76 * a).toFixed(1)); ctx.after(600, tickA); };
      if (!R) ctx.after(800, tickA);
      const loop = async () => {
        if (!ctx.alive()) return;
        setCable(0); setSoc(.2); st.lampB.setAttribute("fill", "#3a4148");
        mark(0); await tween(2600, (t) => st.boatB.setAttribute("transform", `translate(${-420 + 920 * t},358)`));
        if (!ctx.alive()) return;
        mark(1); await tween(1300, setCable); st.lampB.setAttribute("fill", "#e9b23f");
        if (!ctx.alive()) return;
        mark(2); await tween(5200, (t) => setSoc(.2 + .8 * t)); st.lampB.setAttribute("fill", "#57c46e");
        if (!ctx.alive()) return;
        await ctx.wait(700);
        mark(3); await tween(1100, (t) => setCable(1 - t)); st.lampB.setAttribute("fill", "#3a4148");
        if (!ctx.alive()) return;
        mark(4); await tween(2600, (t) => st.boatB.setAttribute("transform", `translate(${500 - 920 * t},358)`));
        await ctx.wait(1400);
        loop();
      };
      ctx.after(1000, loop);
    },
    exit(ctx, scene) {
      const st = $("[data-illus=swap]", scene)._swap;
      $$(".steps li", scene).forEach((s) => s.classList.remove("on", "done"));
      st.boatB.setAttribute("transform", "translate(500,358)"); st.cable.style.strokeDashoffset = 0;
      st.socB.setAttribute("width", 76 * .2); st.lampB.setAttribute("fill", "#3a4148");
    }
  };

  /* Scene 9: arrival → berthing → plug in → charge → unplug → reverse out → channel → open sea → fishing.
     Plays once per visit on a pause-aware clock, then holds its final frame. */
  FX.route = {
    built: false,
    build(scene) {
      if (this.built) return; this.built = true;
      const H = this.H = {};
      // sampled, arc-length parameterised paths (image px)
      const sample = (P) => {
        const p = el("path", { d: smoothD(P), fill: "none", stroke: "none" }, layers.boat);
        const L = p.getTotalLength(), pts = [];
        for (let s = 0; s <= L; s += .5) { const q = p.getPointAtLength(s); pts.push([q.x, q.y]); }
        const q = p.getPointAtLength(L); pts.push([q.x, q.y]);
        return { pts, L };
      };
      H.arrive = sample(S.boatPaths.arrive); H.reverse = sample(S.boatPaths.reverse); H.depart = sample(S.boatPaths.depart);
      H.boat = $("#boat-marker"); H.wake = $("#boat-marker .wake");
      H.cable = $("#mp-cable"); H.cableHi = $("#mp-cable-hi"); H.led = $("#mp-led");

      // ---------- charging callout (screen-space detail view)
      const co = $(".chg-callout svg", scene);
      co.innerHTML = `
        <defs>
          <clipPath id="co-clip"><circle cx="150" cy="150" r="146"/></clipPath>
          <radialGradient id="co-water" cx="45%" cy="40%" r="75%"><stop offset="0" stop-color="#4d7e80"/><stop offset="1" stop-color="#2a5154"/></radialGradient>
        </defs>
        <g clip-path="url(#co-clip)">
          <rect width="300" height="300" fill="url(#co-water)"/>
          <path d="M20,240 q20,-6 40,0 t40,0 M150,268 q20,-6 40,0 t40,0 M210,120 q16,-5 32,0 t32,0" stroke="rgba(255,255,255,.18)" stroke-width="2" fill="none"/>
          <g transform="rotate(-20 60 70)">
            <rect x="-60" y="40" width="200" height="48" fill="#b8a98a"/>
            ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<line x1="${-50 + i * 24}" y1="40" x2="${-50 + i * 24}" y2="88" stroke="#9c8e70" stroke-width="2"/>`).join("")}
            <rect x="-60" y="86" width="200" height="4" fill="#7d7259"/>
            ${[0, 1, 2].map((i) => `<path d="M${-40 + i * 34},40 l0,-44 q0,-10 8,-14 q8,4 8,14 l0,44 z" fill="#efe9da" stroke="#0b2232" stroke-width="1.5"/>`).join("")}
            <g transform="translate(102,64)">
              <rect x="-13" y="-13" width="26" height="26" rx="3" fill="#e7e2d4" stroke="#0b2232" stroke-width="1.5"/>
              <rect x="-8" y="-9" width="16" height="7" fill="#0e2636"/>
              <circle id="co-led" cx="0" cy="6" r="4.2" fill="#3a4148"/>
              <path d="M13,-4 q8,0 8,8" fill="none" stroke="#0b2232" stroke-width="2.4"/>
            </g>
          </g>
          <g transform="translate(176,176) rotate(-10)">
            <path d="M0,-92 Q26,-60 28,-12 L26,70 L-26,70 L-28,-12 Q-26,-60 0,-92 Z" fill="#efe9da" stroke="#0b2232" stroke-width="2"/>
            <path d="M0,-80 Q20,-54 21,-14 L20,62 L-20,62 L-21,-14 Q-20,-54 0,-80 Z" fill="none" stroke="#2e6e8e" stroke-width="3" opacity=".7"/>
            <rect x="-9" y="70" width="18" height="16" rx="3" fill="#d9d4c6" stroke="#0b2232" stroke-width="1.5"/>
            <rect x="-9" y="76" width="18" height="3" fill="#57c46e"/>
            <rect x="-15" y="-4" width="30" height="46" rx="3" fill="#1d2a33" stroke="#e9b23f" stroke-width="1.8"/>
            <rect x="-6" y="-8" width="12" height="4" rx="1" fill="#e9b23f"/>
            <rect id="co-soc" x="-11" y="${38 - 34 * .2}" width="22" height="${34 * .2}" fill="#e9b23f"/>
            <circle id="co-inlet" cx="-26" cy="-26" r="5" fill="#26323b" stroke="#cfd6da" stroke-width="1.5"/>
          </g>
          <path id="co-cable" d="M137,58 C150,78 128,118 152,141" fill="none" stroke="#15191d" stroke-width="5" stroke-linecap="round"/>
          <path id="co-cable-hi" d="M137,58 C150,78 128,118 152,141" fill="none" stroke="#e9b23f" stroke-width="1.6" stroke-linecap="round" opacity="0"/>
        </g>
        <circle cx="150" cy="150" r="146" fill="none" stroke="#f4f0e6" stroke-width="2.5"/>
`;
      H.co = $(".chg-callout", scene); H.coStatus = $(".chg-status", scene); H.setStatus = (t) => (H.coStatus.innerHTML = `${t}<span class="chg-sub">battery stays on board</span>`);
      H.coLed = co.querySelector("#co-led"); H.coSoc = co.querySelector("#co-soc");
      H.coCable = co.querySelector("#co-cable"); H.coCableHi = co.querySelector("#co-cable-hi"); H.coInlet = co.querySelector("#co-inlet");
      H.leader = $(".chg-leader", scene);

      // ---------- open-sea fishing scene (temporary layer over the map)
      const fs = $(".fish-layer svg", scene);
      const floats = Array.from({ length: 9 }, (_, i) => `<circle class="fs-float" r="6.5" style="--fd:${(i * .3).toFixed(1)}s"/>`).join("");
      fs.innerHTML = `
        <defs>
          <linearGradient id="fs-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f6f99"/><stop offset=".7" stop-color="#a9c3cf"/><stop offset="1" stop-color="#e8d3a6"/></linearGradient>
          <linearGradient id="fs-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a8796"/><stop offset=".35" stop-color="#2f6175"/><stop offset="1" stop-color="#173a4d"/></linearGradient>
          <radialGradient id="fs-sun"><stop offset="0" stop-color="#fff6dc"/><stop offset=".5" stop-color="#ffe2a6" stop-opacity=".5"/><stop offset="1" stop-color="#ffd590" stop-opacity="0"/></radialGradient>
          <linearGradient id="fs-front" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f6175" stop-opacity=".85"/><stop offset="1" stop-color="#173a4d"/></linearGradient>
        </defs>
        <rect width="1600" height="420" fill="url(#fs-sky)"/>
        <circle cx="1240" cy="300" r="150" fill="url(#fs-sun)"/>
        <path d="M-20,404 C120,396 240,398 330,402 L330,412 L-20,412 Z" fill="#43555c" opacity=".55"/>
        <rect y="410" width="1600" height="490" fill="url(#fs-sea)"/>
        <path d="M1150,412 L1330,412 L1420,620 L1060,620 Z" fill="#fff3d0" opacity=".08"/>
        <path class="fs-swell" d="M-60,470 q90,-9 180,0 t180,0 t180,0 t180,0 t180,0 t180,0 t180,0 t180,0 t180,0 t180,0"/>
        <path class="fs-swell" d="M-60,610 q110,-12 220,0 t220,0 t220,0 t220,0 t220,0 t220,0 t220,0 t220,0" style="animation-delay:-3s"/>
        <path class="fs-swell" d="M-60,760 q130,-14 260,0 t260,0 t260,0 t260,0 t260,0 t260,0 t260,0" style="animation-delay:-6s"/>
        <path d="M980,190 q8,-8 16,0 q8,-8 16,0 M1080,160 q6,-6 12,0 q6,-6 12,0 M1035,230 q6,-6 12,0 q6,-6 12,0" stroke="#24384a" stroke-width="2.4" fill="none"/>
        <g id="fs-net-under" opacity="0"><path id="fs-mesh" d="M0,0" fill="none" stroke="rgba(230,230,220,.3)" stroke-width="1.4" stroke-dasharray="2 5"/></g>
        <g id="fs-boat" transform="translate(-460,0)">
          <path id="fs-wake" d="M10,548 q-60,-6 -140,4 M20,556 q-80,4 -190,14" stroke="rgba(255,255,255,.55)" stroke-width="3" fill="none"/>
          <g class="fs-bob">
            <use href="#sym-person" x="118" y="420" width="40" height="100" fill="#14181e"/>
            <g id="fs-crew2"><use href="#sym-person" x="40" y="424" width="38" height="96" fill="#14181e"/></g>
            <use href="#sym-boat-e" x="0" y="462" width="380" height="100"/>
          </g>
        </g>
        <rect y="545" width="1600" height="355" fill="url(#fs-front)" opacity=".55"/>
        <g id="fs-net" opacity="0"><path id="fs-netline" d="M0,0" fill="none" stroke="#2a2a26" stroke-width="2.2"/>${floats}</g>`;
      H.fish = $(".fish-layer", scene); H.fsBoat = fs.querySelector("#fs-boat"); H.fsWake = fs.querySelector("#fs-wake");
      H.fsNet = fs.querySelector("#fs-net"); H.fsNetU = fs.querySelector("#fs-net-under"); H.fsLine = fs.querySelector("#fs-netline"); H.fsMesh = fs.querySelector("#fs-mesh");
      H.fsFloats = $$(".fs-float", fs); H.fsCrew2 = fs.querySelector("#fs-crew2");

      // keep the callout anchored if the window is resized (registered once)
      window.addEventListener("resize", () => { if (H.co.classList.contains("on")) this.place(); });
    },
    // screen position of the berth -> place callout + leader
    place() {
      const H = this.H, scene = H.co.closest(".scene");
      const m = layers.boat.getScreenCTM(); if (!m) return;
      const svgPt = $("#map").createSVGPoint(); svgPt.x = H.berth[0]; svgPt.y = H.berth[1];
      const p = svgPt.matrixTransform(m), sr = scene.getBoundingClientRect();
      const bx = p.x - sr.left, by = p.y - sr.top;
      const size = H.co.offsetWidth || 260, r = size / 2;
      let cx = bx - size * 1.0, cy = by + size * .1;
      cx = Math.max(r + 24, Math.min(sr.width - r - 24, cx));
      cy = Math.max(r + sr.height * .22, Math.min(sr.height - r - 90, cy));
      H.co.style.left = `${cx - r}px`; H.co.style.top = `${cy - r}px`;
      const dx = bx - cx, dy = by - cy, d = Math.hypot(dx, dy) || 1;
      const ln = H.leader.querySelector("line"), c = H.leader.querySelector("circle");
      ln.setAttribute("x1", (cx + dx / d * r).toFixed(1)); ln.setAttribute("y1", (cy + dy / d * r).toFixed(1));
      ln.setAttribute("x2", (bx - dx / d * 9).toFixed(1)); ln.setAttribute("y2", (by - dy / d * 9).toFixed(1));
      c.setAttribute("cx", bx.toFixed(1)); c.setAttribute("cy", by.toFixed(1));
    },
    reset() {
      const H = this.H, a = H.arrive.pts;
      H.boat.style.opacity = 0; H.wake.style.opacity = 0;
      H.boat.setAttribute("transform", `translate(${a[0][0]},${a[0][1]}) rotate(${this.tan(H.arrive, 0)}) scale(.5)`);
      [H.cable, H.cableHi].forEach((c) => { const L = c.getTotalLength(); c.style.strokeDasharray = L; c.style.strokeDashoffset = L; });
      H.cableHi.style.opacity = 0; H.led.setAttribute("fill", "#3a4148");
      H.co.classList.remove("on"); H.leader.classList.remove("on");
      [H.coCable, H.coCableHi].forEach((c) => { const L = c.getTotalLength(); c.style.strokeDasharray = L; c.style.strokeDashoffset = L; });
      H.coCableHi.setAttribute("opacity", 0); H.coLed.setAttribute("fill", "#3a4148"); this.soc(.2);
      H.setStatus("Plug-in charging");
      H.fish.classList.remove("on"); H.fsBoat.setAttribute("transform", "translate(-460,0)"); H.fsWake.style.opacity = 1;
      H.fsNet.setAttribute("opacity", 0); H.fsNetU.setAttribute("opacity", 0); H.fsFloats.forEach((f) => f.classList.remove("in")); H.fsLine.setAttribute("d", "M0,0"); H.fsMesh.setAttribute("d", "M0,0");
      H.fsCrew2.removeAttribute("transform");
    },
    soc(v) { this.H.coSoc.setAttribute("y", (38 - 34 * v).toFixed(1)); this.H.coSoc.setAttribute("height", (34 * v).toFixed(1)); this.H.coSoc.setAttribute("fill", v >= .999 ? "#57c46e" : "#e9b23f"); },
    tan(path, s) {   // heading (deg) of the path at arc length s
      const P = path.pts, N = P.length - 1, i = Math.max(0, Math.min(N - 1, Math.round(s / .5)));
      const a = P[Math.max(0, i - 3)], b = P[Math.min(N, i + 3)];
      return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
    },
    placeCable() {   // map cable: pedestal -> boat's port-side inlet (boat stationary at berth)
      const H = this.H, [bx, by] = H.berth, th = H.berthAng * Math.PI / 180;
      const ix = bx + (1.5 * Math.cos(th) + 3.6 * Math.sin(th)) * .5, iy = by + (1.5 * Math.sin(th) - 3.6 * Math.cos(th)) * .5;
      const [px, py] = S.chargePedestal;
      const d = `M${px},${py} Q${((px + ix) / 2 + 1).toFixed(1)},${((py + iy) / 2 + 4).toFixed(1)} ${ix.toFixed(1)},${iy.toFixed(1)}`;
      [H.cable, H.cableHi].forEach((c) => { c.setAttribute("d", d); const L = c.getTotalLength(); c.style.strokeDasharray = L; c.style.strokeDashoffset = L; });
    },
    enter(ctx, scene) {
      this.build(scene);
      const H = this.H, self = this;
      const A = H.arrive.pts; H.berth = A[A.length - 1]; H.berthAng = this.tan(H.arrive, H.arrive.L);
      this.reset(); this.placeCable();
      const setBoat = (x, y, ang) => H.boat.setAttribute("transform", `translate(${x.toFixed(2)},${y.toFixed(2)}) rotate(${ang.toFixed(2)}) scale(.5)`);

      if (reduced()) {   // still, informative frame: berthed and plugged in, charge complete
        H.boat.style.opacity = 1; setBoat(H.berth[0], H.berth[1], H.berthAng);
        [H.cable, H.cableHi].forEach((c) => (c.style.strokeDashoffset = 0)); H.cableHi.style.opacity = 1; H.led.setAttribute("fill", "#57c46e");
        [H.coCable, H.coCableHi].forEach((c) => (c.style.strokeDashoffset = 0)); H.coCableHi.setAttribute("opacity", 1);
        H.coLed.setAttribute("fill", "#57c46e"); this.soc(1); H.setStatus('Plug-in charging · <b style="color:#57c46e">complete</b>');
        ctx.after(3000, () => { this.place(); H.co.classList.add("on"); H.leader.classList.add("on"); });
        return;
      }

      // pause-aware scene clock (the deck's K key freezes everything)
      let clock = 0, last = performance.now(); const waits = [], frames = new Set();
      const loop = (now) => {
        const dt = Math.min(64, now - last); last = now;
        if (!document.documentElement.classList.contains("paused")) {
          clock += dt;
          frames.forEach((f) => f(dt));
          for (let i = waits.length - 1; i >= 0; i--) if (clock >= waits[i].t) { waits[i].res(); waits.splice(i, 1); }
        }
        ctx.raf(loop);
      };
      ctx.raf(loop);
      const wait = (ms) => new Promise((res) => waits.push({ t: clock + ms, res }));
      const tween = (ms, f, ease = easeInOut) => new Promise((res) => {
        let t = 0; const fr = (dt) => { t = Math.min(ms, t + dt); f(ease(t / ms)); if (t >= ms) { frames.delete(fr); res(); } };
        frames.add(fr);
      });
      // velocity profile: smooth (cosine) acceleration, cruise, smooth deceleration
      const profile = (u, ta, td) => {
        const V = 1 / (1 - ta / 2 - td / 2);
        if (u < ta) return V * (u / 2 - ta / (2 * Math.PI) * Math.sin(Math.PI * u / ta));
        const sa = V * ta / 2;
        if (u <= 1 - td || td === 0) return sa + V * (u - ta);
        const sc = sa + V * (1 - td - ta), w = u - (1 - td);
        return sc + V * (w / 2 + td / (2 * Math.PI) * Math.sin(Math.PI * w / td));
      };
      let ang = this.tan(H.arrive, 0);
      const travel = (path, ms, { ta = .15, td = .3, astern = false, onProgress } = {}) => {
        let prev = 0;
        return tween(ms, (u) => {
          const s = profile(u, ta, td) * path.L, P = path.pts, i = Math.min(P.length - 1, Math.round(s / .5));
          let target = self.tan(path, s) + (astern ? 180 : 0);
          let diff = ((target - ang + 540) % 360) - 180; ang += diff * .14;      // smooth heading follow
          setBoat(P[i][0], P[i][1], ang);
          const speed = Math.abs(s - prev); prev = s;
          H.wake.style.opacity = astern ? 0 : Math.min(.9, speed * 1.4).toFixed(2);
          if (onProgress) onProgress(u);
        }, (x) => x);
      };

      const run = async () => {
        await wait(1500);
        tween(700, (t) => (H.boat.style.opacity = t));
        await wait(300);
        // 1. arrival through the gap and along the channel, slowing into the berth
        await travel(H.arrive, 11000, { ta: .1, td: .34 });
        H.wake.style.opacity = 0; await wait(500);
        // 2. callout + plug in
        self.place(); H.co.classList.add("on"); H.leader.classList.add("on");
        H.setStatus("Berthed · connecting cable");
        await wait(900);
        await tween(1300, (t) => {
          [H.cable, H.cableHi].forEach((c) => (c.style.strokeDashoffset = c.getTotalLength() * (1 - t)));
          [H.coCable, H.coCableHi].forEach((c) => (c.style.strokeDashoffset = c.getTotalLength() * (1 - t)));
        });
        H.coInlet.setAttribute("stroke", "#e9b23f");
        // 3. charging (generic indicator, no values)
        H.setStatus('Plug-in charging · <b style="color:#e9b23f">charging</b>');
        H.cableHi.style.opacity = 1; H.coCableHi.setAttribute("opacity", 1);
        let blink = 0; const led = (dt) => { blink += dt; const on = Math.floor(blink / 600) % 2 === 0; H.led.setAttribute("fill", on ? "#e9b23f" : "#7a5a1f"); H.coLed.setAttribute("fill", on ? "#e9b23f" : "#7a5a1f"); };
        frames.add(led);
        await tween(6000, (t) => self.soc(.2 + .8 * t), (x) => x);
        frames.delete(led);
        H.led.setAttribute("fill", "#57c46e"); H.coLed.setAttribute("fill", "#57c46e");
        H.cableHi.style.opacity = 0; H.coCableHi.setAttribute("opacity", 0);
        H.setStatus('Plug-in charging · <b style="color:#57c46e">complete</b>');
        await wait(1400);
        // 4. unplug: cable retracts to the pedestal holder
        H.setStatus("Unplugged · cable stowed");
        H.coInlet.setAttribute("stroke", "#cfd6da");
        await tween(1200, (t) => {
          [H.cable, H.cableHi].forEach((c) => (c.style.strokeDashoffset = c.getTotalLength() * t));
          [H.coCable, H.coCableHi].forEach((c) => (c.style.strokeDashoffset = c.getTotalLength() * t));
        });
        await wait(700);
        H.co.classList.remove("on"); H.leader.classList.remove("on");
        H.led.setAttribute("fill", "#3a4148");
        await wait(700);
        // 5. back out astern and swing the bow toward the channel exit
        await travel(H.reverse, 4200, { ta: .3, td: .35, astern: true });
        await wait(500);
        // 6. depart along the channel, out through the gap to the open sea
        let fished = false;
        await travel(H.depart, 12500, { ta: .18, td: 0, onProgress: (u) => { if (!fished && u > .8) { fished = true; fish(); } } });
        tween(500, (t) => (H.boat.style.opacity = 1 - t));
      };
      // 7. open-sea fishing (temporary layer; the map stays untouched underneath)
      const fish = async () => {
        H.fish.classList.add("on");
        await tween(6800, (t) => { H.fsBoat.setAttribute("transform", `translate(${(-460 + 1240 * t).toFixed(1)},0)`); H.fsWake.style.opacity = (1 - t * .85).toFixed(2); }, (x) => 1 - Math.pow(1 - x, 3));
        await wait(600);
        // crew sets a net from the stern; floats pay out behind the boat
        H.fsCrew2.setAttribute("transform", "rotate(-14 59 520)");
        const sx = 780 + 46, sy = 540, ex = 250, ey = 572;
        H.fsNet.setAttribute("opacity", 1); H.fsNetU.setAttribute("opacity", 1);
        const pts = (t) => { const px = sx + (ex - sx) * t, py = sy + (ey - sy) * t + Math.sin(t * Math.PI) * 26; return [px, py]; };
        await tween(5200, (t) => {
          const n = 40, line = [], mesh = [];
          for (let k = 0; k <= n * t; k++) { const [x, y] = pts(k / n); line.push(`${x.toFixed(1)},${y.toFixed(1)}`); if (k % 2 === 0 && k > 1) mesh.push(`M${x.toFixed(1)},${(y + 4).toFixed(1)} l0,${(28 + 10 * Math.sin(k)).toFixed(1)}`); }
          if (line.length > 1) H.fsLine.setAttribute("d", "M" + line.join(" L"));
          H.fsMesh.setAttribute("d", mesh.join(" ") || "M0,0");
          H.fsFloats.forEach((f, i) => { const at = (i + 1) / (H.fsFloats.length + 1); if (t >= at && !f.classList.contains("in")) { const [x, y] = pts(at); f.setAttribute("cx", x.toFixed(1)); f.setAttribute("cy", (y - 3).toFixed(1)); f.classList.add("in"); } });
        }, (x) => x);
        H.fsCrew2.removeAttribute("transform");
      };
      run();
    },
    exit() { if (this.built) this.reset(); }
  };

  FX.people = {
    enter(ctx, scene) { $$(".benefit", scene).forEach((b, i) => ctx.after(500 + i * 450, () => b.classList.add("in"))); },
    exit(ctx, scene) { $$(".benefit", scene).forEach((b) => b.classList.remove("in")); }
  };

  FX.impact = {
    enter(ctx, scene) { $$(".metric", scene).forEach((m, i) => ctx.after(900 + i * 260, () => m.classList.add("in"))); },
    exit(ctx, scene) { $$(".metric", scene).forEach((m) => m.classList.remove("in")); }
  };

  window.Illustrations = { build() { buildSymbols(); buildMapLayers(); document.querySelectorAll("[data-illus]").forEach((svg) => { const f = ILLUS[svg.dataset.illus]; if (f) f(svg); }); }, layers: () => layers };
  window.SceneFX = FX;
  window.SVGUtil = { el, setLen };
})();
