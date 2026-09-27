# ORBYVEN Alpha 0.65 — Planșă Termică / Proiectare Instalații

STATUS: planned checkpoint only. No actual module, database migration, main merge, or Vercel deployment has been performed.

Roadmap: Alpha 0.6 Materiale & rețete + deviz inteligent (live) → Alpha 0.65 Planșă Termică (planned) → Alpha 0.7 Achiziții & furnizori + stocuri (planned).

## Product goal

A professional installer sketches an apartment or house on a squared 2D canvas, sets dimensions, places openings and heating components, estimates room heat losses and heating demand, and creates a reviewable materials list and draft estimate without typing the same inputs twice. Pilot context: installation contractor #002.

Preserve current ORBYVEN Overview, midnight orbital theme, layout, navigation, and all existing module components. Planșă Termică is a future optional module opened from an existing Lucrare, with links to Oferte/Deviz rather than a second separate dashboard.

## 1. Grid and architecture drawing

- Select scale: e.g. one cell = 25 cm or 50 cm; show scale and units; pan, zoom and snap to grid/corners/endpoints.
- Draw a wall as a segment, showing computed length in real time; alternatively type exact length (and optionally angle) and lock it, adjusting endpoint in sketch. Calibration by one known dimension.
- Orthogonal walls by default, with optional angled walls. Undo/redo, edit/move/split/delete, save/version, separate floors, pencil/touch/mouse support.
- Identify closed rooms automatically from shared walls, no duplicate interior boundary counting. Per room: name, length/width where applicable, floor area, wall perimeter, height, volume.
- Place door/window onto host wall by width, height and position; deduct openings from net wall area once. Validate that opening fits host wall.
- External wall versus internal wall versus adjacency to unheated area; optional wall thickness and insulation/material assembly.

## 2. Heating installation layers

Separate toggleable overlays so the plan remains readable:
A: room outlines, walls, openings and dimensions;
B: radiators/towel heaters with position, room and model/nominal output;
C: supply (tur) and return (retur) routes, colored distinctly, connected to emitters/manifolds, measured pipe length;
D: floor-heating zones, exclusion patches, manifold, adjustable pipe spacing and editable circuits;
E: boiler/heat source, pumps, distributors, thermostat/zoning symbols and equipment notes.

Components have stable IDs; their locations and routes are stored on this floor/room, not as bitmap paint. Pipes may cross on canvas without automatically becoming connected.

## 3. Thermal inputs and estimation

Drawing dimensions alone are NOT enough to determine heating capacity reliably.

Room inspector: wall/window/door/floor/ceiling thermal transmittance (U, W/m²K) or reviewed construction assembly, adjacent-room conditions, desired inside temperature, location-specific outside design temperature, ventilation/infiltration, optional bridge and intermittent reheating assumptions, ground-contact effects.

Preliminary transmission loss, per element: Q = U × net A × temperature difference. Include glazing/doors separately from opaque wall area. Ventilation heat losses are separate. Sum at room and building level, and show measured-versus-assumed sources and missing inputs.

Clearly distinguish U [W/m²K], whole-building H [W/K], G where applicable [W/m³K], heat-load Φ [W/kW], indicative W/m² and device COP. These are NOT synonyms for a single heating coefficient; ask user which they need. Never infer COP from a house plan.

Output by room: geometry, design heat load, radiator or underfloor preliminary capacity check, missing data warning. Aggregate whole house plus structured bill of materials and cost preview. Heat loss design methodology to be validated against the applicable EN 12831-1, Romanian Mc 001-2022 and product data.

## 4. Equipment and floor-heating checks

Radiator capacity must be evaluated at actual selected water/room temperatures, not an unrelated catalogue temperature regime. Underfloor: heated area minus excluded zones, selected circuit spacing, indicative pipe length and manifold leads, floor covering resistance and appropriate floor surface temperature limits, tentative circuit length. Hydraulic sizing (flow, head loss, valve/pump/pipe diameters), source sizing and domestic hot water are reviewed separately by a qualified professional. Do not claim the sketch alone yields construction-ready heating design.

## 5. Existing ecosystem dependency

CRM client → Lucrare → versioned Planșă Termică → rooms and calculation snapshot → overlay components/pipe routes → reviewed materials takeoff using existing ops_material_catalog/recipes → new deviz or revision → offer → Alpha 0.7 procurement.

Commercial offer and accepted deviz snapshots never change silently when the sketch is edited. Future thermal tables and references must be organization scoped with RLS, active membership/module entitlement, version IDs and audit trail. Do not duplicate tenant, client, catalogue, expense or subscription tables.

Proposed data concepts (not created yet): thermal_projects, thermal_floors, thermal_wall_segments, thermal_openings, thermal_rooms, thermal_components, thermal_routes, thermal_calculation_runs, thermal_material_takeoffs.

## 6. Phased delivery and acceptance

0.65.1 Grid, measure/type wall length, close rooms, doors/windows, edit/undo, mobile gestures.
0.65.2 Radiator, tur/retur, manifolds, floor-heating and boiler placement, measured pipe lengths.
0.65.3 Room thermal inspector, transmission/ventilation losses, calculation quality states.
0.65.4 Snapshot review, bill of materials, links to material catalogue and non-destructive deviz revision, SVG/PDF export marked preliminary.
0.65.5 Father/installer pilot for #002, professional calculation review, role and cross-tenant tests, desktop/mobile performance.

Example acceptance:
- 5 m × 4 m rectangle, 0.5 m grid -> 20 m² area; exact typed 3.7 m wall persists at any zoom.
- 1.2 m × 1.4 m window on a host exterior wall reduces that wall gross surface once; moving it updates wall/window area.
- Change room temperature/U-value -> recalculation updates room and totals; nondependent walls remain fixed.
- Two colored supply/return lines independently show measured lengths; pipe crossing does not create connection.
- Review a takeoff and make a deviz revision; original accepted commercial document remains unchanged.
- Check plan and notes with installer before any engineering claim or procurement.

IMPORTANT: First produce a local interactive demo using existing ORBYVEN visual language. No main merge or Vercel deployment until a separate explicit user approval. Do not label early calculations as a certified project, energy certificate, approved hydraulic sizing or finalized heating installation plan.

References for methodology validation:
- EN 12831-1: space-heating design load includes transmission, ventilation and sometimes reheating.
- EN 1264-2: water-based surface heating and cooling output and temperature limitations.
- Mc 001-2022 approved by Romanian Order 16/2023: https://legislatie.just.ro/public/DetaliiDocument/263984
