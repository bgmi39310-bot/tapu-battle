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

## Graphics / Performance
- **Settings (⚙) → 🎨 Graphics:** Auto (khud FPS dekhkar Low/Med/High badalta hai) ya Low / Med / High haath se. **📈 FPS** on karo to FPS, preset aur *draw calls* dikhte hain. Choice yaad rehti hai.
- **Static batching (`09j-perf.js`):** map ke ~900 box meshes material ke hisaab se ~20 meshes me jud jate hain (draw calls ~2000 → ~300). Asli meshes sirf raycast ke liye `WM` me rehti hain (dikhti nahi).
- **Raycast grid:** camera/LOS/goli ke ray ab sirf apne raaste ke cells ki meshes se takrate hain (~900 ki jagah ~13).
- `col()` pehle distance dekhta hai tabhi `hmap()` bulata hai; materials share hote hain; HUD sirf badalne par DOM likhta hai; minimap 20 fps; sun ke shadow texel-grid par snap hote hain (jhilmilana band).
- Loot 80m se door chhupa rehta hai. Phone par antialias band (pixel-ratio 1.5 se kaam chalta hai).

## Tests (optional, sirf developer ke liye)
`tests/` folder me Node scripts hain (browser/three.js ki zaroorat nahi): `node tests/batchtest.js` (batching + raycast grid), `node tests/swordtest.js` (talwar loot), `node tests/fullrun.js` (poora game 13 scenarios + auto-quality). Ye game ko affect nahi karte, delete bhi kar sakte ho.
