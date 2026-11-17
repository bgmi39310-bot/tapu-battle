// HUD button layout editor (drag/resize/save)
function saveLay(){try{const pos={},sc={};RB.forEach(b=>{if(b.style.left)pos[b.id]=[parseFloat(b.style.left),parseFloat(b.style.top)];if(b.dataset.s)sc[b.id]=parseFloat(b.dataset.s);});localStorage.setItem(LAY_KEY,JSON.stringify({pos,sc}));}catch(e){}}
function loadLay(){
  try{const L=JSON.parse(localStorage.getItem(LAY_KEY)||'null');if(!L)return;
    for(const b of RB){const p=L.pos&&L.pos[b.id];if(p){b.style.left=p[0]+'px';b.style.top=p[1]+'px';b.style.right='auto';b.style.bottom='auto'}
      const s=L.sc&&L.sc[b.id];if(s){b.dataset.s=s;b.style.setProperty('--bs',s)}}
  }catch(e){}
}
// ---------- Layout editor ----------
$('gb').onclick=()=>{const b=$('bt');b.style.display=b.style.display==='flex'?'none':'flex'};
$('lb').onclick=()=>{edit=!edit;$('vc').style.display=(edit||drive)?'block':'none';js.style.pointerEvents=edit?'auto':'none';js.style.outline=edit?'2px dashed #ffab00':'';$('sz').style.display=edit?'flex':'none';$('lb').textContent=edit?'✔ Layout Done':'🔧 Customize Layout';RB.forEach(b=>b.style.outline=edit?'2px dashed #ffab00':'');if(!edit){selB=null;saveLay()}else msg('Button ko drag karo, Bada/Chhota se size badlo')};
RB.forEach(b=>b.addEventListener('pointerdown',e=>{if(!edit||b.id==='pb')return;e.stopPropagation();selB=b;const r=b.getBoundingClientRect();drag={b,gx:e.clientX-(r.left+r.width/2),gy:e.clientY-(r.top+r.height/2)};b.setPointerCapture(e.pointerId)}));
addEventListener('pointermove',e=>{if(!edit||!drag)return;const b=drag.b;b.style.right='auto';b.style.bottom='auto';b.style.left=(e.clientX-drag.gx-b.offsetWidth/2)+'px';b.style.top=(e.clientY-drag.gy-b.offsetHeight/2)+'px'});
addEventListener('pointerup',()=>{if(drag){drag=null;saveLay()}});
let jsDrag=false;
js.addEventListener('pointerdown',e=>{if(!edit)return;e.stopPropagation();js.setPointerCapture(e.pointerId);jsDrag=true});
addEventListener('pointermove',e=>{if(edit&&jsDrag){jsBase={x:e.clientX,y:e.clientY};resetJoystickPos()}});
addEventListener('pointerup',()=>{if(jsDrag){jsDrag=false;try{localStorage.setItem('tapu_js',JSON.stringify(jsBase))}catch(e){}}});
const scaleBtn=f=>{const t=selB?[selB]:RB;t.forEach(b=>{const s=Math.max(0.6,Math.min(1.8,(parseFloat(b.dataset.s)||1)*f));b.dataset.s=s;b.style.setProperty('--bs',s)});saveLay()};
$('sp').onclick=()=>scaleBtn(1.1);$('sm').onclick=()=>scaleBtn(0.9);
$('rs').onclick=()=>{try{localStorage.removeItem(LAY_KEY);localStorage.removeItem('tapu_js')}catch(e){}jsBase=null;resetJoystickPos();RB.forEach(b=>{b.style.left=b.style.top=b.style.right=b.style.bottom='';b.style.removeProperty('--bs');delete b.dataset.s});msg('Layout reset ho gaya')};
