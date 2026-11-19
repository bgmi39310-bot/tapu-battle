# 🎯 Tapu Battle — BGMI Edition

Mobile-first 3D battle-royale mini game (Three.js r128). Pure HTML/CSS/JS, no build step.

## Run
- `python3 -m http.server` chalao aur `localhost:8000` kholo. (`index.html` seedha double-click karne par `.glb` models/talwar `file://` par load nahi hote.)
- GitHub Pages: Settings → Pages → Deploy from branch → `main` / root.
- Phone par: Chrome menu → *Add to Home screen* = bina URL bar ke fullscreen. START dabane par game khud fullscreen + landscape maangta hai.

## Controls
| | Mobile | Desktop |
|---|---|---|
| Chalna | left joystick | W A S D (Shift = sprint) |
| Dekhna | right screen drag / gyro | mouse (pehle click se mouse pakdo) |
| Fire | FIRE button | left click |
| Scope | Scope button | right click / Q |
| Kudo / Chadho | Kudo button | Space |
| Grenade / Molotov | Bomb / Molotov (phir FIRE) | G / T (phir F ya click) |
| Talwar nikalo / rakho | Talwar button | V |
| Bag | Bag button | I |
| Map | MAP button ya minimap par tap | M |

## Project structure (saari files root folder me hain)
| File | Kya hai |
|---|---|
| `index.html` | HUD, buttons, menus |
| `style.css` | Saari styling |
| `01-core.js` | Renderer, scene, camera, global state |
| `02-environment.js` | Light, textures, water, sensitivity |
| `03-characters.js` | Soldier rig + UAZ jeep model |
| `04-utils-combat.js` | Collision (`col`), sound, tracer, enemy spawn, kill/hurt |
| `05-inventory-physics.js` | Inventory, grenade/molotov, ground height |
| `06-loot-parachute.js` | Loot, plane drop / parachute, climbing |
| `07-map-builder.js` | Procedural map (ghar, ped, props), material cache |
| `08-controls-ui.js` | Touch/keyboard/mouse controls, gyro, settings |
| `09-layout-editor.js` | HUD layout customize |
| `09b-models.js` | `.glb` dushman model + IK |
| `09h-swords.js` | 10 talwarein code se bani (koi `.glb` nahi) |
| `09i-anim.js` | Chalne/daudne ka cycle aur talwar ke vaar ka animation (pure math) |
| `09c-melee.js` | Talwar uthana/nikalna/vaar, pehle-person haath |
| `09d-lobby.js` | Lobby, fullscreen on START |
| `09e-net.js` | Multiplayer (PeerJS) |
| `09f-team.js` | Team panel, bada map, markers |
| `09g-fit.js` | Phone screen par HUD auto-fit |
| `10-game-loop.js` | Shooting, enemy AI, camera, HUD, minimap, startup |

Scripts classic `<script>` hain aur `index.html` ke order me chalti hain.

## Talwarein
- Map par 10 alag talwarein padi hain (Talwar, Katana, Claymore, Machete, Shamshir, Khanda, Kukri, Gladius, Cutlass, Jian), har ek alag ghar me, kabhi andar kabhi chhat par. **Neele ring** wala loot = talwar. Dushman ko maarne par bhi kabhi-kabhi milti hai.
- Jo uthate ho wahi haath me dikhti hai. Doosri uthane par purani wahin gir jati hai. Bag me "Girao" se bhi gira sakte ho.
- FIRE dabate raho: tirchha vaar, phir seedha vaar, baari-baari (BGMI jaisa combo).
- Har talwar ki taakat/raftaar/pahunch alag hai (`09h-swords.js` me `def(name,dmg,dur,reach,...)`).

## Performance notes
- `col()` ab pehle distance dekhta hai, tabhi `hmap()` bulata hai (pehle har frame ~1800 baar bulata tha).
- Map ke materials share hote hain (`matFor`, `lootMesh`), purani geometry `build()` me free hoti hai.
- Door ka loot (>120m) chhupa rehta hai.
