# 🎯 Tapu Battle — BGMI Edition

Mobile-first 3D battle-royale mini game (Three.js r128). Pure HTML/CSS/JS, no build step.

## Run
- Locally: open `index.html` in a browser (or `python3 -m http.server` and visit `localhost:8000`).
- GitHub Pages: Settings → Pages → Deploy from branch → `main` / root.

## Project structure
| File | Kya hai |
|---|---|
| `index.html` | HUD, buttons, menus (markup only) |
| `css/style.css` | Saari styling |
| `js/01-core.js` | Renderer, scene, camera, global state |
| `js/02-environment.js` | Light, textures, water, sensitivity |
| `js/03-characters.js` | Soldier rig + UAZ jeep model |
| `js/04-utils-combat.js` | Collision, sound, tracer, enemy spawn, kill/hurt |
| `js/05-inventory-physics.js` | Inventory, grenade/molotov, ground height, ray helpers |
| `js/06-loot-parachute.js` | Loot, plane drop / parachute, climbing |
| `js/07-map-builder.js` | Procedural map (houses, trees, props) |
| `js/08-controls-ui.js` | Touch/keyboard controls, buttons, gyro |
| `js/09-layout-editor.js` | HUD layout customize (drag/resize/save) |
| `js/10-game-loop.js` | Shooting, enemy AI, camera, HUD, minimap, startup |

Scripts are classic `<script>` files loaded **in order** and share globals, so keep the order in `index.html`.

## Kahan change karein
- Enemy AI / damage → `js/10-game-loop.js` (`enemyShoot`, enemy loop in `step`)
- Player movement/sprint/camera → `js/10-game-loop.js` (`step`)
- Bullets / walls → `js/10-game-loop.js` (`shoot`, `bxHit`, `hasLOS`)
- Naya loot/weapon → `js/05-inventory-physics.js`, `js/06-loot-parachute.js`
- Map / ghar → `js/07-map-builder.js`
- Button positions → `css/style.css` (default) or in-game ⚙ → Customize Layout
