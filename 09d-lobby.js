// Lobby (self-contained: apna HTML + CSS khud banata hai, isliye sirf is file par depend karta hai).
// Map chuno / Room banao / Join karo, phir START. Lobby me aapka character dikhta hai.
let started=false;
const LB={t:0,mates:[]};
const NETX=()=>typeof NET!=='undefined'?NET:{role:'solo',mode:'coop',roster:[],code:'',myId:'host'};
const isClient=()=>NETX().role==='client';
const hex6=n=>'#'+n.toString(16).padStart(6,'0');
const on=(id,fn)=>{const el=document.getElementById(id);if(el)el.onclick=fn};

(function buildLobbyDOM(){
  const old=document.getElementById('lobby');if(old)old.remove();
  const st=document.createElement('style');
  st.textContent=`
#lobby{position:fixed;inset:0;z-index:200;display:flex;align-items:center;padding:0 4vw;overflow:auto;
  background:linear-gradient(90deg,rgba(6,12,20,.94) 0%,rgba(6,12,20,.72) 42%,rgba(6,12,20,0) 78%);color:#fff;font-family:system-ui,sans-serif;touch-action:pan-y;pointer-events:auto}
#lobby .lbcard{width:min(430px,92vw);padding:14px 0}
#lobby h1{margin:0;font-size:32px;letter-spacing:1px;color:#ffd54f;text-shadow:0 2px 8px #000}
#lobby .lbsub{margin:2px 0 10px;color:#cfd8dc;font-weight:700;letter-spacing:3px;font-size:12px}
#lobby h3{margin:12px 0 6px;font-size:12px;color:#ffcc80;text-transform:uppercase;letter-spacing:1.5px}
#lobby .lbrow{display:flex;gap:8px;flex-wrap:wrap}
#lobby .lbm,#lobby .lbt{display:flex;align-items:center;gap:6px;padding:11px 14px;border-radius:12px;border:2px solid rgba(255,255,255,.25);background:rgba(20,30,42,.88);color:#fff;font-size:15px;font-weight:800;cursor:pointer}
#lobby .lbm.on,#lobby .lbt.on{border-color:#ffd54f;background:rgba(255,193,7,.25)}
#lobby .lbs{width:14px;height:14px;border-radius:50%;border:1px solid #0006}
#lobby #lbMaps{display:flex;gap:8px;flex-wrap:wrap}
#lobby .lk{opacity:.45;pointer-events:none}
#lobby #lbCode{width:130px;padding:11px;border-radius:12px;border:2px solid rgba(255,255,255,.3);background:rgba(20,30,42,.88);color:#fff;font-size:17px;font-weight:800;letter-spacing:3px;text-transform:uppercase;text-align:center;user-select:text;-webkit-user-select:text}
#lobby #lbRoomInfo{margin-top:8px;font-size:14px;line-height:1.55;color:#e0e0e0}
#lobby .lbcode{font-size:26px;color:#ffd54f;letter-spacing:4px}
#lobby #lbStart{margin-top:14px;width:100%;padding:16px;border-radius:14px;border:3px solid #ffd54f;background:linear-gradient(#ff5252,#c62828);color:#fff;font-size:22px;font-weight:900;letter-spacing:2px;box-shadow:0 0 18px rgba(255,82,82,.55);cursor:pointer}
#lobby #lbStart:disabled{opacity:.6;filter:grayscale(.5)}
#lobby #lbDiag{margin-top:8px;font-size:11px;color:#ffab91}`;
  document.head.appendChild(st);
  const d=document.createElement('div');d.id='lobby';
  d.innerHTML=`<div class="lbcard">
    <h1>&#127919; TAPU BATTLE</h1><p class="lbsub">BGMI Edition</p>
    <h3>Map chuno</h3><div id="lbMaps"></div>
    <h3>Samay</h3><div class="lbrow" id="lbTime"><button id="lbDay" class="lbt on">&#9728; Din</button><button id="lbNight" class="lbt">&#127769; Raat</button><button id="lbSeed" class="lbt">&#128506; Naya Map</button></div>
    <h3>Multiplayer (2-4 players)</h3>
    <div class="lbrow"><button id="lbMode" class="lbt">Mode: Co-op</button><button id="lbHost" class="lbt">&#10133; Room banao</button></div>
    <div class="lbrow" style="margin-top:8px"><input id="lbCode" placeholder="ROOM CODE" maxlength="4" autocapitalize="characters" autocomplete="off"><button id="lbJoin" class="lbt">&#128279; Join</button></div>
    <div id="lbRoomInfo"></div>
    <button id="lbStart">&#9654; START</button>
    <div id="lbDiag"></div>
  </div>`;
  document.body.appendChild(d);
  const bt=document.getElementById('bt');
  if(bt&&!document.getElementById('lobbyBtn')){const b=document.createElement('button');b.id='lobbyBtn';b.innerHTML='&#127968; Lobby';bt.insertBefore(b,bt.firstChild)}
})();

// ---------- lobby ka 3D scene: aapka character + room ke saathi ----------
function syncLobbyMates(){
  const n=NETX(),others=(n.roster||[]).filter(r=>r[0]!==n.myId);
  while(LB.mates.length>others.length){const m=LB.mates.pop();scene.remove(m.c.g)}
  while(LB.mates.length<others.length){
    const i=LB.mates.length,c=mkChar([0x2f6fb0,0x8e5a1d,0x6a2f8a][i%3],false);c.g.rotation.order='YXZ';scene.add(c.g);c.rf.visible=false;
    const lb=typeof makeLabel==='function'?makeLabel(others[i][1]):null;if(lb){lb.position.set(0,2.5,0);c.g.add(lb)}
    LB.mates.push({c,lb});
  }
}
function lobbyCam(dt){
  LB.t+=dt;
  const gx=sp0.x,gz=sp0.z,gy=Math.max(hmap(gx,gz),0),a=0.5*Math.sin(LB.t*0.35)+0.2,d=4.4,rx=Math.cos(a),rz=-Math.sin(a);
  pl.g.visible=true;pl.g.position.set(gx,gy,gz);pl.g.rotation.set(0,a+Math.PI,0);pl.g.scale.y=0.78;pl.rf.visible=false;
  pl.l1.rotation.x=0;pl.l2.rotation.x=0;pl.poseArms(false,LB.t*1.2,0,false,0,0);
  LB.mates.forEach((m,i)=>{const k=i+1,g=m.c.g;g.visible=true;
    g.position.set(gx+rx*1.15*k-Math.sin(a)*0.3*k,Math.max(hmap(gx+rx*1.15*k,gz+rz*1.15*k),0),gz+rz*1.15*k-Math.cos(a)*0.3*k);
    g.rotation.set(0,a+Math.PI,0);g.scale.y=0.78;m.c.poseArms(false,0,0,false,0,0)});
  cam.position.set(gx+Math.sin(a)*d,gy+1.7+Math.sin(LB.t*0.5)*0.05,gz+Math.cos(a)*d);
  cam.lookAt(gx-rx*1.3,gy+1.15,gz-rz*1.3);
  if(Math.abs(cam.fov-55)>0.1){cam.fov=55;cam.updateProjectionMatrix()}
}

// ---------- lobby UI ----------
function renderLobby(){
  const n=NETX(),maps=document.getElementById('lbMaps');if(!maps)return;
  maps.innerHTML=TH.map((t,i)=>'<button class="lbm'+(i===th?' on':'')+'" data-i="'+i+'"><span class="lbs" style="background:'+hex6(t.sky)+'"></span><span class="lbs" style="background:'+hex6(t.c[1])+'"></span>'+t.n+'</button>').join('');
  maps.querySelectorAll('.lbm').forEach(b=>b.onclick=()=>{if(isClient())return;th=+b.dataset.i;build(seed);renderLobby();if(typeof netMapChanged==='function')netMapChanged()});
  document.getElementById('lbDay').classList.toggle('on',!night);document.getElementById('lbNight').classList.toggle('on',night);
  document.getElementById('lbMode').textContent=n.mode==='pvp'?'\u2694 Mode: PvP':'\uD83E\uDD1D Mode: Co-op';
  ['lbMaps','lbTime','lbMode'].forEach(id=>document.getElementById(id).classList.toggle('lk',isClient()));
}
function uiNet(){
  const n=NETX(),el=document.getElementById('lbRoomInfo'),s=document.getElementById('lbStart'),h=document.getElementById('lbHost');if(!el)return;
  if(n.role==='solo'){el.innerHTML='';s.textContent='\u25B6 START';s.disabled=false;h.textContent='\u2795 Room banao'}
  else{
    el.innerHTML='Room code: <b class="lbcode">'+n.code+'</b><br>Players ('+(n.roster||[]).length+'/4): '+(n.roster||[]).map(r=>r[1]).join(', ');
    if(n.role==='client'){s.textContent='Host ke START ka intezaar...';s.disabled=true;h.textContent='\u2716 Room chhodo'}
    else{s.textContent='\u25B6 START ('+(n.roster||[]).length+' player)';s.disabled=false;h.textContent='\u2716 Room band karo'}
  }
  renderLobby();syncLobbyMates();
}
function startGame(){started=true;document.getElementById('lobby').style.display='none';LB.mates.forEach(m=>m.c.g.visible=false);msg('Plane se kudne ke liye KUDO dabao')}
function openLobby(){started=false;document.getElementById('lobby').style.display='flex';uiNet()}
const needNet=()=>{if(typeof netHost!=='function'){msg('09e-net.js load nahi hua - repo me upload karo');return false}return true};
on('lbSeed',()=>{if(isClient())return;build(seed=(seed*7+13)%9973);renderLobby();if(typeof netMapChanged==='function')netMapChanged()});
on('lbDay',()=>{if(isClient())return;night=false;renderLobby();if(typeof netMapChanged==='function')netMapChanged()});
on('lbNight',()=>{if(isClient())return;night=true;renderLobby();if(typeof netMapChanged==='function')netMapChanged()});
on('lbMode',()=>{if(isClient()||!needNet())return;NET.mode=NET.mode==='pvp'?'coop':'pvp';renderLobby();netMapChanged()});
on('lbHost',()=>{if(!needNet())return;NET.role==='solo'?netHost():netLeave()});
on('lbJoin',()=>{if(needNet())netJoin(document.getElementById('lbCode').value)});
on('lbStart',()=>{if(isClient())return;if(NETX().role==='host')netStartAll();startGame()});
on('lobbyBtn',()=>{const bt=document.getElementById('bt');if(bt)bt.style.display='none';if(typeof netLeave==='function')netLeave();openLobby()});
addEventListener('load',()=>{
  renderLobby();uiNet();
  const miss=[];if(typeof NET==='undefined')miss.push('09e-net.js (multiplayer)');if(typeof applyEnemyModel!=='function')miss.push('09b-models.js');if(typeof cycleSword!=='function')miss.push('09c-melee.js');
  document.getElementById('lbDiag').textContent=miss.length?'\u26A0 Ye file(s) load nahi hui: '+miss.join(', '):'';
});
