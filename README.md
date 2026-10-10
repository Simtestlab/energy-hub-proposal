# Manapad Coastal Energy Hub — cinematic HTML presentation

A 13-scene, full-screen, animated presentation of a **conceptual** solar + BESS coastal energy hub where ~250 fishing boats plug in and charge at a jetty at Manapad, Thoothukudi District, Tamil Nadu. The team's own Google Maps satellite screenshot is the geographic anchor for every map scene; the hand-drawn yellow (solar + BESS) and green (boat access) markings are traced into SVG overlays that stay locked to the image at any screen size.

Nothing in the deck claims the site is surveyed, designed or approved. No capacities, ratings, costs, dates or measured results are shown.

## Run it

No build step, no server, no internet.

1. Keep the folder structure intact.
2. Double-click `index.html` (Chrome, Edge, Firefox or Safari, current versions).
3. Press **F** for full screen. Present with the arrow keys or a clicker.

If your browser blocks local files for any reason, serve the folder instead: `python3 -m http.server 8000` in this folder, then open `http://localhost:8000`.

## Folder

```
manapad-presentation/
├── index.html                    scene markup and all on-screen text
├── styles/presentation.css       design system, layout, motion
├── styles/fonts.css              bundled fonts (OFL), embedded, work offline
├── scripts/site-geometry.js      traced zones, solar layout, camera presets (image px)
├── scripts/animations.js         SVG illustrations, map layers, scene animations
├── scripts/presentation.js       engine: navigation, controls, autoplay, modes, notes
├── assets/manapad-satellite.jpg        satellite background (replacement image, registered to the deck frame)
├── assets/source/manapad-satellite-original-screenshot.png  the untouched 1842 × 910 original
├── README.md
└── TECHNICAL_NOTES.md            assumptions, pending assessments, metrics, validation
```

## Controls

| Key / control | Action |
|---|---|
| → · Space · PageDown · clicker | Next scene |
| ← · Shift+Space · PageUp | Previous scene |
| Home / End | First / last scene |
| F or ⛶ button | Full screen on/off |
| O or grid button | Scene overview (click a tile to jump) |
| N or notes button | Presenter notes with caveats for the current scene |
| ▶ button | Optional autoplay (off by default); press again to pause; Esc also stops it |
| Esc | Closes overview / notes / developer panel |
| Swipe left/right | Next / previous on touch screens |

The control bar fades out after ~3 s without input and returns on any mouse movement or key press. The mouse is never needed to follow the story.

**Deep links:** `index.html#s5` opens scene 5.

### Masterplan modes (scene 5)
A small mode bar under the map: **Original** (the screenshot with hand markings), **Solar + BESS**, **Boat route**, **Masterplan** (default after the reveal), **Engineering** (pending-assessment tags), **Split** (original markings left, concept right).

### Developer / presenter controls (hidden by default — press **D**)
| Key | Action |
|---|---|
| R | Restart current scene |
| C | Clean image: hide the original hand markings on all map scenes (interpreted zones stay) |
| V | Hide / show all SVG overlays (view the original image alone) |
| E | Engineering annotations on any map scene |
| K | Pause / resume all animation |
| P | Presentation mode: hides the masterplan mode bar and other technical controls |
| Reduced motion | Also follows the operating-system "reduce motion" setting automatically |

## Scenes

1 Manapad · 2 A coastal community · 3 The challenge · 4 The engine goes electric · 5 The proposed site · 6 Conceptual masterplan · 7 Harness the sun · 8 Store. Manage. Deliver. · 9 Plug in. Charge. Go. · 10 Ready for the sea · 11 Beyond the boat · 12 From vision to reality · 13 Start at Manapad.

## Editing

- **Text:** edit the headlines, ledes and footnotes directly in `index.html`. Each `<section class="scene">` is one scene, in order.
- **Presenter notes, autoplay timing, scene map state:** the `SCENES` array at the top of `scripts/presentation.js` (`notes`, `dur`, `map.cam`, `map.layers`, `map.grade`).
- **Camera framing:** `cams` in `scripts/site-geometry.js` (centre in image pixels + zoom).
- **Zone geometry:** `yellowZone`, `boatRoute`, `solarBlocks`, and the facility footprints in `scripts/site-geometry.js`. All values are pixels on the 1842 × 910 screenshot. If a surveyor supplies real boundaries, convert them to image pixels and replace these strings.
- **Colours and type:** tokens at the top of `styles/presentation.css`.
- **Adding a scene:** add a `<section class="scene" data-key="…">` in `index.html` and a matching entry in `SCENES` (same position). Optional animation hooks go in `window.SceneFX[key] = { enter(ctx, el), exit(ctx, el) }` in `animations.js`; use `ctx.after`, `ctx.raf` and `ctx.anim` so everything stops when the scene is left.

## Replacing or updating the satellite image

The overlays are traced to **this exact screenshot**. All coordinates are pixels on the original 1842 × 910 screenshot. The displayed image is a crop of it (x 215–1636, y 62–882) that removes the Google Maps search bar, sidebar, controls and footer; it is placed at (215, 62) inside the same coordinate system, so nothing had to be re-traced.
- New screenshot, same framing and size: crop it the same way, save as `assets/manapad-satellite.png`, and regenerate the clean copy (see TECHNICAL_NOTES.md › Tracing method).
- Different framing: re-trace the zones. Update `image` and `view` in `site-geometry.js` and the `viewBox` / `<image>` attributes in `index.html`.
If the image file is missing, the deck shows a clearly labelled placeholder instead of a substitute map.

## Asset manifest

| File | Status | Used in | Notes |
|---|---|---|---|
| `assets/manapad-satellite.jpg` | **Included** (replacement image supplied by project team) | all map scenes | Registered to the deck's coordinate frame by feature matching (affine, median residual 0.7 px), so every overlay lines up. Original file in `assets/source/manapad-satellite-new-original.png`; earlier screenshot versions in `assets/source/previous-*`. |
| (previous) `assets/manapad-satellite.png` | **Included** (supplied, cropped, labels removed) | 1, 4, 5, 6, 9, 10, 11, 13 | Supplied screenshot with the Maps interface cropped out and Google place labels, pins and road names removed (texture fill). Untouched original and the labelled crops are in `assets/source/`. | Imagery ©2026 Airbus, Maxar Technologies; Map data ©2026 Google — credit shown on every map scene. Check Google Maps attribution terms before public distribution. |
| `assets/manapad-satellite-clean.png` | **Included** (derived, labels removed) | Clean mode, scenes 1, 6, 9, 10, 13 | Hand-marking strokes removed by inpainting. Pixels under the old strokes are interpolated, not imagery. |
| `styles/fonts.css` | **Included** | All | Big Shoulders Display, IBM Plex Sans, IBM Plex Mono, Noto Sans Tamil — SIL Open Font License 1.1, from @fontsource 5.3.0. |
| All illustrations | **Included** (original SVG, generated in code) | 2, 3, 7, 8, 13 | FRP boats, figures, BESS diagram, berth charging sequence, Tamil Nadu outline. |
| `assets/fishing-community.jpg` | Optional, not supplied | 2 (replaces illustration) | 16:9, ≥ 2400 px wide. |
| `assets/solar-infrastructure.jpg` | Optional, not supplied | 6 (inset, labelled "reference image") | 4:3, ≥ 1200 px. |
| `assets/bess-infrastructure.jpg` | Optional, not supplied | 7 (inset) | 4:3, ≥ 1200 px. |
| `assets/berth-charging.jpg` | Optional, not supplied | 8 (inset) | 4:3, ≥ 1200 px. |

**To enable a photo:** save the file in `assets/`, then set its path in the `PHOTOS` object at the top of `scripts/presentation.js` (e.g. `community: "assets/fishing-community.jpg"`). Unset entries make no network request and keep the illustration. Insets are captioned "Reference image · not the Manapad site".

**Preferred source:** real, consented photographs taken at Manapad. Use generated images only for the generic equipment insets, never to depict the actual site or identifiable residents. If you do generate them, these prompts keep the visual language consistent:

- **fishing-community.jpg** — "Documentary photograph at dawn on a Tamil Nadu fishing beach: fibreglass (FRP) fishing boats painted white and blue with outboard motors pulled up on the sand, fishermen in lungis readying nets, warm low sun over the Gulf of Mannar, a coastal village and church spire in the background. Natural colour, 35 mm, no text, 16:9." Mark as illustrative if not from Manapad.
- **solar-infrastructure.jpg** — "Ground-mounted solar PV tables on raised galvanised steel structures on a sandy coastal site in South India, low-tilt fixed arrays, maintenance walkway, clear morning light, no people, no logos, 4:3."
- **bess-infrastructure.jpg** — "Containerised battery energy storage enclosures with an adjacent power-conversion skid and fenced compound with clear spacing between units, coastal industrial setting in India, overcast daylight, no logos, no signage text, 4:3."
- **berth-charging.jpg** — "Weather-rated marine charging pedestals on a concrete fishing jetty in South India, a fibreglass fishing boat moored alongside with a charging cable plugged in, early morning light, no logos, no signage text, 4:3."

No video is required. Sea movement is suggested with restrained SVG waves only.
