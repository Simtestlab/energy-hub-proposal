/* Manapad Coastal Energy Hub — presentation engine
   Scene list, navigation, map-stage state, controls, autoplay, notes, overview.
   Scene content lives in index.html; illustrations + per-scene motion in animations.js. */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------------
     OPTIONAL PHOTOGRAPHS. Set a path (relative to index.html) once the file exists
     in assets/. Left as null, the original SVG illustration is shown instead and
     no network request is made. See README.md > Asset manifest.               */
  const PHOTOS = {
    community: null,   // e.g. "assets/fishing-community.jpg"
    solar: null,       // e.g. "assets/solar-infrastructure.jpg"  (inset, labelled "reference image")
    bess: null,        // e.g. "assets/bess-infrastructure.jpg"
    charging: null     // e.g. "assets/berth-charging.jpg"
  };
  const PHOTO_CAPTION = { solar: "Reference image · not the Manapad site", bess: "Reference image · not the Manapad site", charging: "Reference image · not the Manapad site", benefits: "Photograph", community: "Manapad" };

  /* Every overlay layer that exists on the map (see animations.js). */
  const ALL_LAYERS = ["site", "siteQuiet", "route", "siteLabels", "solar", "rays", "jetty", "shoreFleet", "bess", "swap", "access", "walk", "flow", "callouts", "eng", "boat", "future", "pilotLabel", "hubPin"];
  const MASTER_FULL = ["siteQuiet", "solar", "jetty", "bess", "swap", "access", "walk", "route", "flow", "callouts"];

  /* ---------------------------------------------------------------------------
     SCENES. map: null = full-bleed illustrated scene; otherwise map-stage state.
     dur = autoplay seconds. notes = presenter notes (caveats live here).        */
  const SCENES = [
    { key: "opening", title: "Manapad", dur: 11,
      map: { cam: "coastNear", img: "clean", layers: [], grade: "g-sun", kb: true },
      notes: ["Manapad, a fishing settlement on the Thoothukudi coast. This is the team's own satellite screenshot, used as the anchor for every map scene.", "Everything that follows is a concept for discussion. Nothing has been surveyed, designed or approved."] },
    { key: "community", title: "A coastal community", dur: 10, map: null,
      notes: ["Start with people, not equipment. The fishing day begins on the beach: boats prepared, nets loaded, engines fuelled.", "Illustration only. Replace with consented photographs from Manapad before external use."] },
    { key: "challenge", title: "The challenge", dur: 12, map: null,
      notes: ["Fuel is bought, carried and poured by hand before trips; it is a recurring cost and it takes time.", "We have no measured local figures yet. Cost per trip, fuel per trip and refuelling time are the first things the pilot baseline survey will record."] },
    { key: "retrofit", title: "The engine goes electric", dur: 26, map: null,
      notes: ["The fishing boat's kerosene outboard is replaced with an electric outboard.", "A battery pack is fitted inside the hull and wired to the motor. It stays on board and is plug-in charged at the jetty.", "Motor and battery options are still being compared; no rating or capacity is shown on purpose. Running-cost savings are to be validated in the pilot."] },
    { key: "site", title: "The proposed site", dur: 11,
      map: { cam: "full", img: "original", layers: [], grade: "", seq: [[900, ["site"]], [2600, ["site", "route"]], [4000, ["site", "route", "siteLabels"]]] },
      notes: ["This is the actual screenshot with the team's hand markings: yellow is the candidate solar + BESS zone, green is the proposed boat entry from the sea into the channel mouth.", "The SVG overlays are traced from those markings and stay aligned at any screen size. Boundaries are indicative; land ownership and usable area are unknown."] },
    { key: "masterplan", title: "Conceptual masterplan", dur: 14,
      map: { cam: "site", img: "original", layers: ["site", "route"], grade: "", mode: true },
      notes: ["We move from the hand markings to an interpreted concept. Not all of the marked area is used: solar tables sit only on visibly dry sand with a setback; wet depressions are left alone.", "BESS and power conversion sit at the south end with a fire-separation zone; the charger + switch room sits at the south end of the jetty and feeds a pedestal at the berths.", "Jetty: about 250 boats park and plug in to charge along the channel side of the yellow zone, in two rows of berths (team planning figure). Berth size, spacing, channel width and depth are to be surveyed; the layout is drawn, not designed.", "Use the mode bar: Original, Solar + BESS, Boat route, Masterplan, Engineering (pending assessments), Split (original vs concept).", "No dimensions, capacities or approvals are implied."] },
    { key: "solar", title: "Harness the sun", dur: 10,
      map: { cam: "solar", img: "clean", layers: ["siteQuiet", "solar", "rays", "jetty", "bess", "flow"], grade: "" },
      notes: ["Solar generation feeds power conversion first, not the boats directly.", "Array layout, size and yield need a solar resource and shading study, flood and storm-surge assessment, and foundation investigation."] },
    { key: "bess", title: "Store. Manage. Deliver.", dur: 22, map: null,
      notes: ["The slide plays a short sequence once: Generate (PV to PCS), Store (PCS to battery), Deliver (bus to distribution, chargers and jetty pedestals), Monitor (EMS links). Then it settles into a slow loop.", "Gold is power flow; grey dashed is monitoring and control; the dotted gold line is the optional grid connection, subject to site feasibility.", "Boats only connect at the jetty pedestals, never to the BESS. No capacities, voltages or ratings are implied.", "With plug-in charging most energy is delivered when boats are docked, so most PV energy passes through the BESS first: storage sizing is the key open question."] },
    { key: "swap", title: "Plug in. Charge. Go.", dur: 18, map: null,
      notes: ["Boats keep their batteries on board and plug in at their own berth. Nothing is carried ashore.", "Gold is power: BESS and PV feed the charger room, which feeds a pedestal at the berths.", "Charge time depends on charger power and pack size. With ~250 boats, charging windows and pedestal sharing must be scheduled; demand peaks when the fleet returns together.", "Shore power over water needs earthing, isolation, weather-rated pedestals and cable management. Connector standard and charger rating are not yet defined."] },
    { key: "route", title: "Ready for the sea", dur: 58,
      map: { cam: "route", img: "clean", layers: ["siteQuiet", "solar", "bess", "swap", "jetty", "walk", "boat"], grade: "" },
      notes: ["The boat comes in from the sea through the gap between the sandbar and the beach, follows the channel and berths nose-in at the charging point at the end of the jetty.", "It plugs in: the battery stays on board; the cable connects the jetty pedestal to the boat inlet. The callout shows the cable, status light and a generic charge indicator; no capacity, power or time is implied.", "Once charged it unplugs, backs out, turns in the channel and heads back out to sea. The final frames switch to an illustrative open-sea scene with the crew setting a net.", "The route is conceptual: depth, tides, bar movement and navigation safety are not yet verified."] },
    { key: "beyond", title: "Beyond the boat", dur: 11,
      map: { cam: "settle", img: "clean", layers: ["siteQuiet", "bess", "swap", "jetty", "shoreFleet", "future", "pilotLabel"], grade: "g-dim" },
      notes: ["Solid gold is the initial pilot scope. Dashed items are possibilities only.", "Additional loads such as lighting, cold storage or shared services need a load assessment, grid study and community consultation first. Locations shown are not proposals."] },
    { key: "plan", title: "From vision to reality", dur: 22,
      map: { cam: "site", img: "original", layers: [], grade: "g-dim", timeline: true },
      notes: ["Eight stages, in order. No dates, costs or schedules are committed here.", "The map evolves with the stages: from the unmarked site, through design, to a pilot hub."] },
    { key: "future", title: "Start at Manapad", dur: 14,
      map: { cam: "full", img: "clean", layers: ["siteQuiet", "route", "hubPin"], grade: "", finale: true },
      notes: ["Start with one site, measure honestly, then decide whether the model fits other coastal communities.", "Hollow markers are illustrative. No other sites have been identified or committed."] }
  ];

  /* ------------------------------------------------------------- utilities */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const root = document.documentElement;
  const deck = $("#deck");
  const sceneEls = $$(".scene");
  const stage = $("#map-stage"), cam = $("#cam"), grade = $("#map-grade");
  const imgO = $("#img-original"), imgC = $("#img-clean");
  const state = { i: -1, playing: false, busyUntil: 0, pending: null, autoT: null, dev: { clean: false, overlaysOff: false, eng: false, paused: false } };

  /* Scene context: tracks timers, rAF, web animations so exit() stops everything. */
  function makeCtx() {
    let alive = true; const timers = new Set(), rafs = new Set(), anims = new Set();
    return {
      alive: () => alive,
      after(ms, fn) { const t = setTimeout(() => { timers.delete(t); if (alive) fn(); }, ms); timers.add(t); return t; },
      wait(ms) { return new Promise((r) => this.after(ms, r)); },
      raf(fn) { const id = requestAnimationFrame((ts) => { rafs.delete(id); if (alive) fn(ts); }); rafs.add(id); return id; },
      anim(a) { anims.add(a); return a; },
      dispose() { alive = false; timers.forEach(clearTimeout); rafs.forEach(cancelAnimationFrame); anims.forEach((a) => { try { a.cancel(); } catch (e) {} }); timers.clear(); rafs.clear(); anims.clear(); }
    };
  }
  let ctx = makeCtx();

  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 1800); }

  /* ---------------------------------------------------------- map-stage API */
  const Map = {
    cam(name, instant) {
      const c = typeof name === "string" ? window.SITE.cams[name] : name;
      if (!c) return;
      const V = window.SITE.view, ox = V.x + V.w / 2, oy = V.y + V.h / 2;
      if (instant) cam.classList.add("snap");
      cam.style.transform = `translate(${ox}px, ${oy}px) scale(${c.z}) translate(${-c.cx}px, ${-c.cy}px)`;
      if (instant) { cam.getBoundingClientRect(); requestAnimationFrame(() => cam.classList.remove("snap")); }
    },
    img(mode) {
      const clean = mode === "clean" || state.dev.clean;
      imgC.style.opacity = clean ? 1 : 0;
    },
    layers(list) {
      const want = new Set(list);
      if (state.dev.eng && state.i >= 0 && SCENES[state.i].map) want.add("eng");
      ALL_LAYERS.forEach((n) => { const g = $("#L-" + n); if (g) g.classList.toggle("on", want.has(n)); });
      $("#map-layers").style.display = state.dev.overlaysOff ? "none" : "";
    },
    grade(cls) { grade.className = cls || ""; },
    split(on) {
      $("#split-wrap").setAttribute("clip-path", on ? "url(#split-clip)" : "");
      if (!on) $("#split-wrap").removeAttribute("clip-path");
      $("#split-ui").style.display = on ? "" : "none";
    }
  };

  /* ---------------------------------------------- masterplan (scene 5) modes */
  const MODES = {
    original: { img: "original", layers: [], keys: [] },
    zones: { img: "clean", layers: ["siteQuiet", "solar", "bess", "swap", "callouts"], keys: ["solar", "bess", "swap"] },
    route: { img: "clean", layers: ["siteQuiet", "route", "jetty", "walk", "swap"], keys: ["route", "jetty", "swap"] },
    full: { img: "clean", layers: MASTER_FULL, keys: ["solar", "jetty", "bess", "swap", "route", "access"] },
    eng: { img: "clean", layers: MASTER_FULL.concat(["eng"]), keys: ["solar", "jetty", "bess", "swap", "route", "access"] },
    split: { img: "clean", layers: MASTER_FULL, keys: ["solar", "jetty", "bess", "swap", "route", "access"], split: true }
  };
  function setMode(scene, name, fromUser) {
    if (fromUser) { ctx.dispose(); ctx = makeCtx(); }
    const m = MODES[name];
    $$(".mode-bar button", scene).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === name)));
    Map.img(m.img); Map.layers(m.layers); Map.split(!!m.split);
    $$(".mp-key li", scene).forEach((li) => li.classList.toggle("lit", m.keys.includes(li.dataset.k)));
  }
  function runMasterplan(scene) {
    // Progressive reveal: hand-marked site -> clean interpretation -> components
    const key = (k) => $$(".mp-key li", scene).forEach((li) => { if (li.dataset.k === k) li.classList.add("lit"); });
    $$(".mp-key li", scene).forEach((li) => li.classList.remove("lit"));
    $$(".mode-bar button", scene).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === "full")));
    const seq = [
      [1600, () => { Map.img("clean"); Map.layers(["siteQuiet", "route"]); }],
      [2600, () => { Map.layers(["siteQuiet", "route", "solar"]); key("solar"); }],
      [4200, () => { Map.layers(["siteQuiet", "route", "solar", "bess"]); key("bess"); }],
      [5200, () => { Map.layers(["siteQuiet", "route", "solar", "bess", "swap"]); key("swap"); }],
      [6100, () => { key("route"); }],
      [6900, () => { document.getElementById("L-jetty").style.setProperty("--jb", ".2s"); Map.layers(["siteQuiet", "route", "solar", "bess", "swap", "jetty"]); key("jetty"); }],
      [8000, () => { Map.layers(["siteQuiet", "route", "solar", "bess", "swap", "jetty", "access", "walk"]); key("access"); }],
      [9000, () => Map.layers(MASTER_FULL)]
    ];
    seq.forEach(([t, f]) => ctx.after(t, f));
  }

  /* ------------------------------------------- implementation timeline (12) */
  function runTimeline(scene) {
    const items = $$(".timeline li", scene);
    const L = [ // map layers that accompany each stage
      ["site", "route"], ["site", "route"], ["site", "route"],
      ["siteQuiet", "callouts"], ["siteQuiet", "access", "callouts"],
      ["siteQuiet", "access", "solar", "bess", "swap", "jetty"],
      ["siteQuiet", "access", "solar", "bess", "swap", "jetty", "walk", "route", "flow"],
      ["siteQuiet", "access", "solar", "bess", "swap", "jetty", "walk", "route", "flow", "callouts"]
    ];
    const show = (k) => {
      items.forEach((li, j) => { li.classList.toggle("on", j === k); li.classList.toggle("done", j < k); });
      Map.img(k >= 3 ? "clean" : "original"); Map.layers(L[k]);
    };
    items.forEach((li) => li.classList.remove("on", "done"));
    Map.layers([]);
    for (let k = 0; k < items.length; k++) ctx.after(900 + k * 2400, () => show(k));
  }

  /* ---------------------------------------------------------------- finale */
  function runFinale(scene) {
    scene.classList.remove("show-tn");
    ctx.after(2800, () => { Map.cam({ cx: 1260, cy: 470, z: 0.74 }); Map.grade("g-deep"); scene.classList.add("show-tn"); });
    ctx.after(9500, () => Map.grade("g-black"));
  }

  /* ------------------------------------------------------------- navigation */
  function applyMap(s, scene) {
    const m = s.map;
    stage.classList.toggle("on", !!m);
    if (!m) { Map.split(false); return; }
    stage.classList.toggle("kenburns", !!m.kb);
    Map.split(false);
    Map.grade(m.grade);
    Map.img(m.img);
    // berths dock after the camera has settled (fresh reveal only)
    const jl = document.getElementById("L-jetty");
    if (jl && !jl.classList.contains("on")) jl.style.setProperty("--jb", "2.6s");
    Map.layers(m.layers);
    if (s.key === "opening") {
      Map.cam("coastNear", true);
      ctx.after(3600, () => { Map.cam("wide"); Map.grade(""); });
    } else Map.cam(m.cam);
    if (m.seq) m.seq.forEach(([t, l]) => ctx.after(t, () => Map.layers(l)));
    if (m.mode) runMasterplan(scene);
    if (m.timeline) runTimeline(scene);
    if (m.finale) runFinale(scene);
  }

  function go(n, opts) {
    opts = opts || {};
    n = Math.max(0, Math.min(SCENES.length - 1, n));
    if (n === state.i && !opts.restart) return;
    const now = performance.now();
    if (now < state.busyUntil && !opts.force) { state.pending = n; return; } // queue rapid input
    state.pending = null;
    state.busyUntil = now + 450;

    const prevEl = sceneEls[state.i];
    if (prevEl) {
      const fx = window.SceneFX[SCENES[state.i].key];
      ctx.dispose();
      if (fx && fx.exit) fx.exit(ctx, prevEl);
      prevEl.classList.remove("is-active", "is-current", "show-tn");
    }
    ctx = makeCtx();
    state.i = n;
    const s = SCENES[n], el = sceneEls[n];
    el.classList.add("is-current");
    el.getBoundingClientRect(); // commit initial (hidden) state so entrances replay
    requestAnimationFrame(() => requestAnimationFrame(() => { if (state.i === n) el.classList.add("is-active"); }));
    applyMap(s, el);
    const fx = window.SceneFX[s.key];
    if (fx && fx.enter) fx.enter(ctx, el);

    $("#counter").textContent = `${n + 1} / ${SCENES.length}`;
    $("#progress-fill").style.width = `${((n + 1) / SCENES.length) * 100}%`;
    $("#notes-body").innerHTML = `<p><b>${n + 1}. ${s.title}</b></p><ul>${s.notes.map((t) => `<li>${t}</li>`).join("")}</ul>`;
    $$("#overview-list button").forEach((b, j) => b.setAttribute("aria-current", String(j === n)));
    try { history.replaceState(null, "", "#s" + (n + 1)); } catch (e) {}
    scheduleAuto();
    setTimeout(() => { if (state.pending !== null && state.pending !== state.i) { const p = state.pending; state.pending = null; go(p, { force: true }); } else state.pending = null; }, 470);
  }
  // Relative steps queue correctly during a transition (3 quick presses = 3 scenes).
  const base = () => (state.pending !== null ? state.pending : state.i);
  const next = () => go(base() + 1);
  const prev = () => go(base() - 1);

  /* --------------------------------------------------------------- autoplay */
  function scheduleAuto() {
    clearTimeout(state.autoT);
    if (!state.playing) return;
    if (state.i >= SCENES.length - 1) { setPlaying(false); return; }
    state.autoT = setTimeout(() => { if (state.playing && !state.dev.paused) next(); else scheduleAuto(); }, SCENES[state.i].dur * 1000);
  }
  function setPlaying(on) {
    state.playing = on;
    const b = $("#btn-play");
    b.setAttribute("aria-pressed", String(on));
    b.setAttribute("aria-label", on ? "Pause autoplay" : "Start autoplay");
    scheduleAuto();
    toast(on ? "Autoplay on" : "Autoplay paused");
  }

  /* ------------------------------------------------------------ fullscreen */
  function toggleFS() {
    const d = document;
    if (!d.fullscreenElement) {
      if (!root.requestFullscreen) return toast("Full screen not available here");
      root.requestFullscreen().catch(() => toast("Full screen was blocked by the browser"));
    } else d.exitFullscreen();
  }
  document.addEventListener("fullscreenchange", () => $("#btn-fs").setAttribute("aria-label", document.fullscreenElement ? "Exit full screen (F)" : "Enter full screen (F)"));

  /* --------------------------------------------------------------- panels */
  function toggle(id, force) { const p = $(id); const show = force !== undefined ? force : p.hidden; p.hidden = !show; return show; }
  function openOverview(on) { const shown = toggle("#overview", on); if (shown) { const cur = $$("#overview-list button")[state.i]; if (cur) cur.focus(); } }

  /* ---------------------------------------------------------- dev controls */
  function dev(action) {
    const d = state.dev, s = SCENES[state.i];
    const press = (k, v) => { const b = $(`#devpanel [data-dev="${k}"]`); if (b) b.setAttribute("aria-pressed", String(v)); };
    switch (action) {
      case "restart": go(state.i, { restart: true, force: true }); toast("Scene restarted"); break;
      case "clean": d.clean = !d.clean; press("clean", d.clean); if (s.map) Map.img(s.map.img); toast(d.clean ? "Hand markings hidden (clean image)" : "Original screenshot"); break;
      case "overlays": d.overlaysOff = !d.overlaysOff; press("overlays", d.overlaysOff); $("#map-layers").style.display = d.overlaysOff ? "none" : ""; toast(d.overlaysOff ? "Overlays hidden" : "Overlays shown"); break;
      case "eng": d.eng = !d.eng; press("eng", d.eng); { const g = $("#L-eng"); if (g) g.classList.toggle("on", d.eng && !!s.map); } toast(d.eng ? "Engineering annotations on" : "Engineering annotations off"); break;
      case "pause": d.paused = !d.paused; press("pause", d.paused); root.classList.toggle("paused", d.paused); toast(d.paused ? "Animation paused" : "Animation resumed"); break;
      case "motion": { const on = root.classList.toggle("reduce-motion"); press("motion", on); go(state.i, { restart: true, force: true }); toast(on ? "Reduced motion on" : "Reduced motion off"); break; }
      case "present": { const on = deck.classList.toggle("presenting"); press("present", on); toast(on ? "Presentation mode: technical controls hidden" : "Technical controls shown"); break; }
    }
  }

  /* --------------------------------------------------------------- input */
  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const tag = (e.target.tagName || "").toLowerCase();
    const onButton = tag === "button";
    wake();
    switch (e.key) {
      case "ArrowRight": case "PageDown": if (!e.repeat) next(); e.preventDefault(); break;
      case "ArrowLeft": case "PageUp": if (!e.repeat) prev(); e.preventDefault(); break;
      case " ": if (onButton) return; if (!e.repeat) (e.shiftKey ? prev : next)(); e.preventDefault(); break;
      case "Home": go(0); e.preventDefault(); break;
      case "End": go(SCENES.length - 1); e.preventDefault(); break;
      case "f": case "F": toggleFS(); break;
      case "o": case "O": openOverview(); break;
      case "n": case "N": toggle("#notes"); break;
      case "d": case "D": toggle("#devpanel"); break;
      case "r": case "R": dev("restart"); break;
      case "c": case "C": dev("clean"); break;
      case "v": case "V": dev("overlays"); break;
      case "e": case "E": dev("eng"); break;
      case "k": case "K": dev("pause"); break;
      case "p": case "P": dev("present"); break;
      case "Escape":
        if (!$("#overview").hidden) { toggle("#overview", false); break; }
        if (!$("#devpanel").hidden) { toggle("#devpanel", false); break; }
        if (!$("#notes").hidden) { toggle("#notes", false); break; }
        if (state.playing) setPlaying(false);
        break;
    }
  });

  $("#btn-next").addEventListener("click", next);
  $("#btn-prev").addEventListener("click", prev);
  $("#btn-play").addEventListener("click", () => setPlaying(!state.playing));
  $("#btn-fs").addEventListener("click", toggleFS);
  $("#btn-notes").addEventListener("click", () => toggle("#notes"));
  $("#btn-overview").addEventListener("click", () => openOverview());
  $$("#devpanel button").forEach((b) => b.addEventListener("click", () => dev(b.dataset.dev)));
  $$(".scene[data-key=masterplan] .mode-bar button").forEach((b) => b.addEventListener("click", () => setMode(b.closest(".scene"), b.dataset.mode, true)));
  $("#overview").addEventListener("click", (e) => { if (e.target.id === "overview") toggle("#overview", false); });

  // overview list
  const ol = $("#overview-list");
  SCENES.forEach((s, j) => {
    const li = document.createElement("li"), b = document.createElement("button");
    b.type = "button"; b.innerHTML = `<span class="n">${String(j + 1).padStart(2, "0")} · ${s.map ? "site" : "story"}</span><span class="t">${s.title}</span>`;
    b.addEventListener("click", () => { toggle("#overview", false); go(j, { force: true }); });
    li.appendChild(b); ol.appendChild(li);
  });

  // auto-hiding controls
  let idleT;
  function wake() { deck.classList.remove("idle"); clearTimeout(idleT); idleT = setTimeout(() => { if ($("#overview").hidden && $("#notes").hidden && $("#devpanel").hidden && !$("#controls").matches(":hover")) deck.classList.add("idle"); }, 2800); }
  ["mousemove", "pointerdown", "touchstart"].forEach((ev) => document.addEventListener(ev, wake, { passive: true }));

  // basic touch swipe
  let tx = null;
  document.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; }, { passive: true });
  document.addEventListener("touchend", (e) => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 60) (dx < 0 ? next : prev)(); tx = null; }, { passive: true });

  /* ------------------------------------------------------------- photos */
  Object.keys(PHOTOS).forEach((k) => {
    const src = PHOTOS[k]; if (!src) return;
    const im = new Image();
    im.onload = () => $$(`.photo-slot[data-photo="${k}"]`).forEach((slot) => { slot.style.backgroundImage = `url("${src}")`; slot.dataset.caption = PHOTO_CAPTION[k] || ""; slot.classList.add("has-photo"); slot.closest(".scene").classList.add("photo-on"); });
    im.onerror = () => console.warn("Photo not found, keeping illustration:", src);
    im.src = src;
  });

  /* ------------------------------------------------- missing satellite image */
  const probe = new Image();
  probe.onerror = () => { $("#map-missing").hidden = false; imgO.style.display = "none"; imgC.style.display = "none"; };
  probe.src = imgO.getAttribute("href");
  const probe2 = new Image();
  probe2.onerror = () => { imgC.style.display = "none"; }; // clean copy optional: falls back to original
  probe2.src = imgC.getAttribute("href");

  /* --------------------------------------------------------------- boot */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { root.classList.add("reduce-motion"); const b = $('#devpanel [data-dev="motion"]'); if (b) b.setAttribute("aria-pressed", "true"); }
  window.Illustrations.build();
  const m = /^#s(\d{1,2})$/.exec(location.hash);
  const start = m ? Math.max(0, Math.min(SCENES.length - 1, +m[1] - 1)) : 0;
  go(start, { force: true });
  requestAnimationFrame(() => setTimeout(() => $("#curtain").classList.add("up"), 120));
  wake();

  window.addEventListener("hashchange", () => { const h = /^#s(\d{1,2})$/.exec(location.hash); if (h) go(+h[1] - 1, { force: true }); });

  // expose for testing / console use
  window.Deck = { go, next, prev, scenes: SCENES, state, setMode: (n) => setMode(sceneEls[4], n, true), Map };
})();
