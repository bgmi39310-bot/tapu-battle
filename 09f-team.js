// Team (Co-op): dost ki status, screen par markers, bada map (marker lagao), saath kudo + follow.
const TEAM={squad:true,follow:false,wp:null,t:0,pph:0,mk:{},open:false};
(function teamDOM(){
  const st=document.createElement('style');
  st.textContent=`
#tmPanel{position:fixed;left:10px;top:76px;z-index:26;display:none;pointer-events:none;min-width:168px;max-width:230px;font:700 12px system-ui,sans-serif;color:#fff}
#tmPanel .hd{background:rgba(10,16,24,.78);border-left:3px solid #40c4ff;padding:4px 8px;border-radius:6px;margin-bottom:4px;font-size:11px;color:#b3e5fc}
#tmPanel .row{background:rgba(10,16,24,.78);border-left:3px solid #40c4ff;padding:4px 8px;border-radius:6px;margin-bottom:4px}
#tmPanel .row.dead{border-left-color:#9e9e9e;opacity:.8}
#tmPanel .nm{display:flex;justify-content:space-between;gap:8px;font-size:13px}
#tmPanel .sb{font-size:11px;color:#cfd8dc}
#tmPanel .bar{height:5px;background:#37474f;border-radius:3px;margin-top:3px;overflow:hidden}#tmPanel .bar i{display:block;height:100%;background:#76ff03}
#tmMarks{position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:24;display:none}
.tmk{position:absolute;transform:translate(-50%,-100%);font:800 12px system-ui,sans-serif;color:#fff;text-shadow:0 0 4px #000,0 0 4px #000;white-space:nowrap;text-align:center}
.tmk i{display:block;width:11px;height:11px;margin:2px auto 0;border-radius:50%;background:#40c4ff;border:2px solid #fff;box-shadow:0 0 6px #000}
.tmk.dead i{background:#9e9e9e}.tmk.wp i{background:#ffd54f;border-radius:2px;transform:rotate(45deg)}
#airBar{position:fixed;left:50%;transform:translateX(-50%);bottom:max(64px,16vh);z-index:26;display:none;gap:10px}
#airBar button{padding:10px 14px;border-radius:14px;border:2px solid rgba(255,255,255,.5);background:rgba(20,30,42,.88);color:#fff;font:800 14px system-ui,sans-serif;pointer-events:auto}
#airBar button.on{border-color:#76ff03;background:rgba(56,142,60,.5)}
#bigmap{position:fixed;top:0;left:0;right:0;bottom:0;z-index:150;display:none;background:rgba(0,0,0,.84);flex-direction:column;align-items:center;justify-content:center;pointer-events:auto;touch-action:none}
#bigmap canvas{width:min(70vh,92vw);height:min(70vh,92vw);width:min(70dvh,92vw);height:min(70dvh,92vw);border:3px solid #ffd54f;border-radius:10px;background:#123}
#bigmap .bmTop{display:flex;justify-content:space-between;align-items:center;gap:10px;width:min(70vh,92vw);width:min(70dvh,92vw);color:#fff;font:800 14px system-ui,sans-serif;margin-bottom:8px}
#bigmap button{padding:8px 12px;border-radius:10px;border:2px solid rgba(255,255,255,.5);background:rgba(20,30,42,.9);color:#fff;font:800 13px system-ui,sans-serif;margin-left:6px}`;
  document.head.appendChild(st);
  document.body.insertAdjacentHTML('beforeend',
   '<div id="tmPanel"></div><div id="tmMarks"></div>'+
   '<div id="airBar"><button id="sqBtn"></button><button id="flBtn">&#127919; Follow dost</button></div>'+
   '<div id="bigmap"><div class="bmTop"><span>&#128506; Map - tap karke marker lagao</span><span><button id="bmClr">&#128205; Marker hatao</button><button id="bmX">&#10006; Band</button></span></div><canvas id="bmc" width="640" height="640"></canvas></div>');
})();
const NT=()=>typeof NET!=='undefined'?NET:{role:'solo',mode:'coop',players:{},roster:[],code:'',myId:'host'};
const mates=()=>Object.values(NT().players).filter(r=>r.t);
const teamOn=()=>NT().role!=='solo'&&NT().mode==='coop'&&started;
const tel=id=>document.getElementById(id);

function statusOf(r){
  if(r.dead)return'\u2620 Mar gaya';
  if(r.ph===1)return'\u2708 Plane me';
  if(r.ph===2)return'\uD83E\uDE82 Hawa me (freefall)';
  if(r.ph===3)return'\uD83E\uDE82 Parachute';
  return r.drv?'\uD83D\uDE99 Gaadi me':'Zameen par';
}
function dist(r){return Math.round(Math.hypot(r.x-P.x,r.z-P.z))}
function renderPanel(){
  const n=NT(),list=mates();let h='<div class="hd">\uD83D\uDCE1 Room '+n.code+' \u00B7 '+((n.roster||[]).length)+'/4';
  if(n.role==='client'&&n.lastSnap&&performance.now()-n.lastSnap>4000)h+=' \u26A0 connection toot gaya?';
  h+='</div>';
  if(!list.length)h+='<div class="row"><div class="sb">Dost ka data abhi nahi aaya...</div></div>';
  for(const r of list){
    h+='<div class="row'+(r.dead?' dead':'')+'"><div class="nm"><span>'+(r.name||r.id)+'</span><span>'+dist(r)+' m</span></div><div class="sb">'+statusOf(r)+'</div><div class="bar"><i style="width:'+Math.max(0,Math.min(100,r.hp||0))+'%"></i></div></div>';
  }
  tel('tmPanel').innerHTML=h;
}
const _v=new THREE.Vector3();
function placeMark(key,txt,cls,x,y,z){
  let el=TEAM.mk[key];
  if(!el){el=TEAM.mk[key]=document.createElement('div');el.innerHTML='<span></span><i></i>';tel('tmMarks').appendChild(el)}
  el.className='tmk '+cls;el.firstChild.textContent=txt;
  _v.set(x,y,z).applyMatrix4(cam.matrixWorldInverse);const behind=_v.z>0;_v.applyMatrix4(cam.projectionMatrix);
  let nx=_v.x,ny=_v.y;
  if(behind){const l=Math.hypot(nx,ny)||1;nx=nx/l*10;ny=-Math.abs(ny/l*10)-1}
  const m=Math.max(Math.abs(nx)/0.92,Math.abs(ny)/0.84);if(m>1){nx/=m;ny/=m}
  el.style.left=((nx*0.5+0.5)*innerWidth)+'px';el.style.top=((-ny*0.5+0.5)*innerHeight)+'px';el.style.display='block';
}
function renderMarks(){
  cam.updateMatrixWorld();const seen={};
  for(const r of mates()){
    const k='p'+r.id;seen[k]=1;
    placeMark(k,(r.dead?'\u2620 ':'')+(r.name||r.id)+' '+dist(r)+'m',r.dead?'dead':'',r.x,r.y+2.7,r.z);
  }
  if(TEAM.wp){seen.wp=1;placeMark('wp','\uD83D\uDCCD '+Math.round(Math.hypot(TEAM.wp.x-P.x,TEAM.wp.z-P.z))+'m','wp',TEAM.wp.x,Math.max(hmap(TEAM.wp.x,TEAM.wp.z),0)+8,TEAM.wp.z)}
  for(const k in TEAM.mk)if(!seen[k]){TEAM.mk[k].remove();delete TEAM.mk[k]}
}
// ---- saath kudo / follow ----
function updAir(){const s=tel('sqBtn'),f=tel('flBtn');s.textContent='\uD83D\uDC65 Saath kudo: '+(TEAM.squad?'ON':'OFF');s.classList.toggle('on',TEAM.squad);f.classList.toggle('on',TEAM.follow)}
tel('sqBtn').onclick=()=>{TEAM.squad=!TEAM.squad;updAir()};
tel('flBtn').onclick=()=>{TEAM.follow=!TEAM.follow;updAir();msg(TEAM.follow?'Follow ON: dost ke paas utroge':'Follow OFF')};
function squadSteer(dt){
  if(!TEAM.follow||phase<2||!teamOn())return null;
  if(Math.hypot(mv.x,mv.y)>0.25){TEAM.follow=false;updAir();msg('Follow band (aapne control liya)');return null}
  let best=null,bd=1e9;for(const r of mates()){if(r.dead)continue;const d=Math.hypot(r.x-P.x,r.z-P.z);if(d<bd){bd=d;best=r}}
  if(!best)return null;
  const want=Math.atan2(-(best.x-P.x),-(best.z-P.z)),df=Math.atan2(Math.sin(want-P.yaw),Math.cos(want-P.yaw));
  P.yaw+=df*Math.min(1,dt*2.5);
  return{fx:0,fy:bd<20?-0.25:-1};
}
function teamRecv(id,m){
  if(m.t==='wp'){TEAM.wp=m.x==null?null:{x:m.x,z:m.z};if(m.x!=null)msg('\uD83D\uDCCD Team ne marker lagaya')}
  else if(m.t==='jump'&&TEAM.squad&&phase===1){jmpReq=true;msg('Team ne jump kiya - saath kudo!')}
}
function sendTeam(o){const n=NT();if(n.role==='host')netBc(o);else if(n.role==='client')netToHost(o)}
// ---- bada map ----
function setWp(x,z){TEAM.wp=x==null?null:{x,z};sendTeam({t:'wp',x,z});if(x!=null)msg('\uD83D\uDCCD Marker laga diya')}
function drawMap(){try{drawMap0()}catch(err){console.error(err);const g=tel('bmc').getContext('2d');g.fillStyle='#123';g.fillRect(0,0,640,640);g.fillStyle='#fff';g.font='bold 24px sans-serif';g.fillText('Map error: '+err.message,20,320)}}
function drawMap0(){
  const c=tel('bmc'),g=c.getContext('2d'),W=640,X=v=>(v/S+.5)*W;
  g.clearRect(0,0,W,W);g.imageSmoothingEnabled=true;
  if(mm._bg)g.drawImage(mm._bg,0,0,W,W);else{g.fillStyle='#2e5';g.fillRect(0,0,W,W)}
  g.strokeStyle='rgba(255,235,59,.85)';g.lineWidth=3;g.setLineDash([10,8]);g.beginPath();g.moveTo(X(-S*.42),X(sp0.z||0));g.lineTo(X(S*.48),X(sp0.z||0));g.stroke();g.setLineDash([]);
  g.font='bold 22px sans-serif';g.textAlign='center';
  if(phase===1){g.fillStyle='#fff';g.fillText('\u2708',X(PL.x),X(PL.z)+8)}
  g.fillStyle='#00e5ff';g.fillRect(X(J.x)-5,X(J.z)-5,10,10);
  if(TEAM.wp){g.fillStyle='#ffd54f';g.fillText('\uD83D\uDCCD',X(TEAM.wp.x),X(TEAM.wp.z)+8)}
  g.font='bold 14px sans-serif';
  if(teamOn())for(const r of mates()){
    const x=X(r.x),y=X(r.z);g.fillStyle=r.dead?'#9e9e9e':'#40c4ff';g.beginPath();g.arc(x,y,7,0,6.3);g.fill();g.strokeStyle='#fff';g.lineWidth=2;g.stroke();
    g.fillStyle='#fff';g.strokeStyle='#000';g.lineWidth=3;const t=(r.dead?'\u2620 ':'')+(r.name||r.id);g.strokeText(t,x,y-12);g.fillText(t,x,y-12);
  }
  g.save();g.translate(X(P.x),X(P.z));g.rotate(-P.yaw);g.fillStyle='#ffeb3b';g.strokeStyle='#000';g.lineWidth=2;g.beginPath();g.moveTo(0,-11);g.lineTo(8,9);g.lineTo(0,5);g.lineTo(-8,9);g.closePath();g.fill();g.stroke();g.restore();
  g.fillStyle='#fff';g.font='bold 16px sans-serif';g.fillText('N',W/2,18);
}
function openMap(){TEAM.open=true;tel('bigmap').style.display='flex';drawMap();clearInterval(TEAM.iv);TEAM.iv=setInterval(drawMap,120)}
function closeMap(){TEAM.open=false;tel('bigmap').style.display='none';clearInterval(TEAM.iv)}
tel('bmX').onclick=closeMap;tel('bmClr').onclick=()=>setWp(null,null);
tel('bmc').addEventListener('pointerdown',e=>{const r=e.currentTarget.getBoundingClientRect();setWp(((e.clientX-r.left)/r.width-.5)*S,((e.clientY-r.top)/r.height-.5)*S);drawMap()});
tel('mapBtn').onclick=()=>{if(started)TEAM.open?closeMap():openMap()};tel('mapBtn').addEventListener('pointerdown',e=>e.stopPropagation());
mm.style.pointerEvents='auto';mm.addEventListener('pointerdown',e=>e.stopPropagation());mm.addEventListener('click',()=>{if(started)openMap()});
addEventListener('keydown',e=>{if(e.key==='m'||e.key==='M')TEAM.open?closeMap():(started&&openMap())});
// ---- har frame ----
function teamUpdate(dt){
  const on=teamOn();
  tel('tmPanel').style.display=on?'block':'none';tel('tmMarks').style.display=on?'block':'none';
  tel('airBar').style.display=(on&&phase>0)?'flex':'none';tel('flBtn').style.display=phase>=2?'block':'none';
  if(on&&TEAM.pph===1&&phase===2){   // jump kiya: saathiyon ko batao + auto follow
    sendTeam({t:'jump'});if(TEAM.squad){TEAM.follow=true;msg('Auto-follow ON: dost ke paas utar rahe ho (joystick se manual)')}
  }
  TEAM.pph=phase;updAir();
  if(!on)return;
  TEAM.t-=dt;if(TEAM.t<=0){TEAM.t=0.3;renderPanel()}
  renderMarks();
}
