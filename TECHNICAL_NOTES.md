# Technical notes — Manapad Coastal Energy Hub (concept)

Status: **conceptual vision for discussion.** No survey, design, approval or load study has been done. Everything spatial in the deck is an interpretation of hand markings on a Google Maps screenshot.

## 1. Tracing method (how the overlays were made)

Source: `assets/manapad-satellite.png`, 1842 × 910 px, supplied by the project team. All overlay coordinates are image pixels; the SVG uses `viewBox="0 0 1842 910"` with `preserveAspectRatio="xMidYMid meet"`, so overlays and image share one coordinate system and cannot drift.

1. **Segmentation.** Pixels of the hand strokes were isolated by colour (high-saturation yellow/olive and green, low blue), excluding the Google Maps UI margins.
2. **Yellow zone.** The stroke was morphologically closed, filled, and eroded by ~4 px (half the stroke width) to take the stroke centreline; the contour was simplified (Douglas–Peucker, 2.5 px) to a 37-point closed polygon.
3. **Green route.** The stroke was skeletonised, ordered from its seaward end, and simplified (2 px) to a 9-point polyline; it is drawn as a smoothed curve with an arrowhead at the channel mouth, matching the hand-drawn arrow.
4. **Verification.** Both traces were drawn back onto the screenshot and inspected; in the browser, overlay points were checked against the image rectangle at 1920×1080, 1366×768, 1440×900, 1280×1024, 2560×1080 and 800×600: **0.0 px offset** at every size.
5. **Interface crop.** The displayed image is the region x 215–1636, y 62–882 of the original (1421 × 820, aspect 1.733, close to 16:9). This removes the Maps search bar, category chips, sidebar, zoom and Street View controls and the footer bar. The crop is placed at (215, 62) in the original coordinate system (`viewBox="215 62 1421 820"`), so all traced coordinates are unchanged. Imagery credit is kept in the deck footer on every map scene.
6. **Map labels removed.** Google place labels (JBF Seafoods, churches, fish market, beach, river and road names) and their pins were detected by their dark text outlines and pin shapes, then filled with nearby real texture (exemplar copy + Poisson blending; a few edge areas use simple inpainting). The hand-drawn markings were excluded as copy sources. The "Google Maps" logo and faint "© Google" watermarks were left in place, and the imagery credit stays in every map scene's footer. Labelled versions are kept in `assets/source/`.
7. **Clean image.** The stroke masks (dilated ~5 px) were inpainted (OpenCV Telea) to produce `manapad-satellite-clean.png`. Pixels in those strips are interpolated, not real imagery.

Trace accuracy is limited by the hand drawing itself (stroke ~8–12 px wide). At the screenshot's scale bar (~100 px ≈ 100 m) that is roughly ±5 m of ambiguity before any survey error.

### Background image replacement
The map background is now the replacement satellite image supplied by the project team (no Maps interface, no labels). It was registered to the original screenshot's coordinate system with SIFT feature matching + RANSAC affine fit (168 inlier matches, median residual 0.7 px, 95th percentile 1.6 px), then resampled to the deck frame (x 215–1636, y 62–882 in original-screenshot pixels). All traced zones and overlays therefore keep their positions. Checks on the new image: solar tables 98.5% on dry sand (0% in water); BESS, PCS and charger room on dry sand; jetty boats 99% on water. The scene 9 boat route was re-traced because the channel mouth differs in this capture: no point is on sand; ~17% of the route crosses the shallow bar at the mouth that this image shows.

## 2. Conceptual assumptions (all to be replaced by engineering)

| Item | Assumption in the deck | Why it is only an assumption |
|---|---|---|
| Solar area | 67 tables (14 × 6 px symbols) in three blocks, aligned 36° to the sandbar axis, only where the screenshot shows dry sand, ≥ ~22 px inside the marked edge | Wet depressions and edges visibly change with tide/season; buildable area, setbacks and CRZ limits are unknown. Table count is a drawing, not a design. |
| BESS + PCS | Small compound at the south end, east side, with a drawn separation zone | Siting, fire strategy, spacing and flood level not assessed. |
| Charger + switch room | South tip, at the south end of the jetty, feeding charging pedestals along the berths | Room size, charger count and rating, and cable routing along the jetty not designed. |
| Jetty | **~250 boats park and plug in to charge** (no battery swapping) (project team planning figure) along the channel side of the yellow zone: a jetty spine 7 px and an outer pontoon 22 px off the traced edge, two rows of 25 pens × 5 berths (finger piers between pens, one charging pedestal per pen) over ~366 px (≈ 366 m at the screenshot scale bar), charging points along the spine, swap facility at the south end | 366 m ÷ 125 berths ≈ 2.9 m per boat per row, which only fits if FRP boats raft tightly side by side. Berth geometry, mooring method, channel width and depth, tidal range and silting need survey; the layout is drawn, not designed. |
| Opposite-shore boats (slide 10 only) | A second row of ~125 moored boats along the settlement-side bank of the same channel, traced by eye from the screenshot. About 30 boats near the narrowest bend are drawn pulled further up the bank to keep the channel visibly open | Shown to illustrate the existing fishing community on both banks; not a berthing proposal. Channel width at the narrowest point is a real constraint for the jetty concept and needs survey. |
| Boat corridor | Visible green marking unchanged. The animated boat follows a separate invisible path fitted to the water in the screenshot: through the gap between the sandbar tip and the beach, along the channel, nose-in at the charging point at the jetty end, astern out, then back to sea | Depth, tides, bar movement, surf and navigation safety unverified. |
| External land access | Shown as "route TBD" | The screenshot suggests the channel separates the sandbar's south tip from the mainland; access must come from survey. |
| Energy flow | Solar PV → power conversion + EMS → BESS → chargers (switch room) → jetty pedestals → plug-in cable → onboard battery | Topology, voltages, ratings, grid interface and backup not engineered. Boats never connect to the BESS directly. |
| Boat retrofit (slide 4) | FRP boat shown with a single outboard: the kerosene outboard is replaced by an electric outboard; battery pack inside the hull wired to the motor | Motor and battery options are still being compared; no rating, capacity, mass or mounting detail is shown. Cost savings to be validated in the pilot. |
| Onboard battery + connector | Battery stays on the boat; plug-in at the berth; no pack size, charger power or connector shown | Depends on the boat electrification design (motor, pack voltage and size) and on a marine shore-power connector choice. |
| Later services | Waterfront lighting, technical service point, cold storage, shared energy services — dashed, "possible" | Require a load assessment, grid study, community consultation and separate approvals. Locations shown are not proposals. |
| Tamil Nadu map | Hand-simplified outline from approximate coordinates, "not to scale" | Schematic only. Hollow markers are illustrative; no other sites identified. |

## 3. Pending assessments (shown as engineering tags in scene 5)

- Land ownership, tenure and usable land area
- Coastal Regulation Zone (CRZ) clearance and other environmental approvals
- High-tide, storm-surge and cyclone exposure; erosion and shoreline change
- Flood levels and drainage
- Soil bearing capacity and foundation design (sand, saline, high water table)
- Solar resource, shading, soiling and salt-mist corrosion
- Grid availability, connection capacity and DISCOM requirements
- BESS siting, separation distances, fire detection/suppression and emergency response
- Emergency, construction and maintenance access (land and water)
- Shore power over water: earthing, residual-current and isolation protection, galvanic corrosion, IP/weather rating of pedestals, cable management on a moving pontoon
- Peak charging demand when the fleet returns together; charging schedule and pedestal sharing
- Navigation channel depth, tidal window and bar movement; landing safety
- Jetty: berth dimensions and spacing for ~250 boats, channel width left for navigation, mooring and fendering, pontoon vs fixed structure, shore-power safety at berths
- Environmental impact (dune, mangrove, fisheries habitat) and community acceptance

## 4. Pilot metrics (no longer shown in the deck; kept for the pilot plan — all empty until measured)

| Metric | Unit | Baseline to record before the pilot |
|---|---|---|
| Participating boats | boats enrolled | Fleet size and trip pattern at Manapad |
| Energy supplied | kWh per month | — |
| Charging time | hours per boat | — |
| Cost per trip | ₹ per trip | Current fuel cost per trip (survey) |
| Solar utilisation | % of demand met by PV | — |
| Infrastructure uptime | % of scheduled hours | — |
| Local jobs | roles held locally | Existing technical roles |
| User satisfaction | survey score | Pre-pilot perception survey |

Targets should be set with the community and funders before the pilot; the deck intentionally shows no values.

## 5. Validation checklist (tested in headless Chromium 141, Linux)

Tested means exercised by an automated script and/or inspected screenshot, not just "code written".

| # | Check | Result |
|---|---|---|
| 1 | All 13 scenes load and render | ✅ Screenshot of every scene at 1600×900 |
| 2 | Next/previous buttons, overview jump | ✅ |
| 3 | Keyboard: → ← Space Home End, no wrap at ends | ✅ |
| 4 | Rapid presses queue correctly (3 presses = 3 scenes), no double transitions | ✅ |
| 5 | Full screen via button and F key, on and off | ✅ (`document.fullscreenElement` toggled) |
| 6 | Satellite image undistorted, Maps interface removed | ✅ Rendered aspect 1.7329 = 1421/820 at 6 viewport sizes; no Maps UI visible in any scene |
| 7 | SVG overlays aligned with image (after crop) | ✅ 0.0 px offset at 1920×1080, 1366×768, 1440×900, 1280×1024, 2560×1080, 800×600 |
| 8 | Yellow and green zones match the markings | ✅ Visual overlay check on the source image |
| 9 | Original image viewable without overlays | ✅ Masterplan "Original" mode; V key hides all overlays |
| 10 | Clean mode hides hand markings, keeps zones | ✅ C key; clean image opacity 1 |
| 11 | All six masterplan modes switch layers correctly (incl. split clip); jetty shown in Boat route, Masterplan, Engineering, Split | ✅ |
| 11b | Engineering tags all inside the frame at 1600×900 | ✅ 0 tags outside viewport |
| 12 | Autoplay off by default; advances when on; stays when paused | ✅ |
| 13 | Controls auto-hide when idle and return on movement | ✅ (stays visible while the pointer is over the bar, by design) |
| 14 | Animations stop when a scene is left (boat marker, berth charging loop) | ✅ |
| 15 | Reduced motion (OS setting): animations off, boat static | ✅ |
| 16 | Notes, developer panel, presentation mode, global pause | ✅ |
| 17 | Deep link `#s9` and hash change | ✅ |
| 18 | No text clipped at 1366×768 or 800×600 (scenes 5, 8, 9, 12, 13) | ✅ |
| 19 | Console errors / uncaught exceptions | ✅ none (fonts bundled locally) |
| 20 | Missing satellite image shows placeholder | ✅ Image removed in a test copy: labelled placeholder shown, no uncaught errors |
| 21 | No fabricated specs or results on screen | ✅ Manual review: no capacities, ratings, costs, dates, depths or measured values |

| 22 | Scene 7 sequence runs in order (reveal → generate → store → deliver → monitor → steady) | ✅ stage indicator checked at each step at 1920×1080 |
| 23 | Scene 7 labels: none clipped or overlapping at 1920×1080 and 1366×768 | ✅ (smallest equipment label 18 px at 1366×768) |
| 24 | Scene 7 pause (K) freezes particles; leaving the slide removes them; revisiting replays from the start | ✅ |
| 25 | Scene 7 reduced motion shows the complete final state, no particles | ✅ |

| 26 | Scene 9 boat path stays in water: every sampled point checked against a water mask of the screenshot (0 points on sand, 0 within 7 px of a berthed boat) | ✅ |
| 27 | Scene 9: boat stationary for the whole time the cable is connected; cable fully stowed before the boat moves again; battery drawn on board throughout | ✅ |
| 28 | Scene 9 change touched animation only: all 13 slides rendered before/after with boat layers hidden and motion frozen are pixel-identical (0 differing pixels); image assets byte-identical | ✅ |
| 29 | Scene 9 pause/resume (K), leave-and-return reset, reduced motion (static berthed + plugged-in frame) | ✅ |

| 30 | Slide 10 opposite-shore row: 125 boats in one continuous row along the traced settlement-side shoreline, bows to the bank; ≥ ~6 px open channel to the jetty row everywhere (median ~11 px); same hull drawing, palette and outline as the jetty berths | ✅ |
| 31 | Slide 10 change isolated: all other 12 slides pixel-identical to the pre-change build (row is removed from rendering when inactive) | ✅ |

| 32 | Slide 4 retrofit sequence (remove → fit motor → fit battery → connect → go) plays once in order; revisiting resets; reduced motion shows the finished retrofit; no text clipped at 1366×768 | ✅ |

**Not tested:** Safari and Firefox (code uses standard APIs: CSS transforms on SVG `<g>`, Web Animations, Fullscreen API), real projector colour/brightness, touch swipe on a physical device, and behaviour inside embedded viewers that may block the Fullscreen API (the deck shows a notice if blocked).

## 6. Known limitations

- The Google Maps interface is cropped out and place labels/pins are removed. Filled areas are reconstructed texture, not imagery; the largest (around the former St Antony's / Manapad Beach Rd labels) look slightly soft when zoomed. The "Google Maps" logo and "© Google" watermarks remain for attribution.
- Illustrations are honest conceptual drawings, not photorealistic renders or a 3D reconstruction. Replace with consented local photographs where available (see README › Asset manifest).
- Labels inside the map scale with the camera; at very small window sizes (< 800 px wide) the smallest map annotations become hard to read.
