// Lobby: game seedha shuru nahi hota. Map chuno, ya Room banao / Join karo, phir START.
let started=false,lobbyA=0;
function lobbyCam(dt){
  lobbyA+=dt*0.08;const R=S*0.32;
  cam.position.set(Math.cos(lobbyA)*R,55+Math.sin(lobbyA*.7)*8,Math.sin(lobbyA)*R);cam.lookAt(0,6,0);
  if(Math.abs(cam.fov-60)>0.1){cam.fov=60;cam.updateProjectionMatrix()}
  pl.g.visible=false;
}
const hex6=n=>'#'+n.toString(16).padStart(6,'0');
const isClient=()=>NET.role==='client';
function renderLobby(){
  $('lbMaps').innerHTML=TH.map((t,i)=>'<button class="lbm'+(i===th?' on':'')+'" data-i="'+i+'"><span class="lbs" style="background:'+hex6(t.sky)+'"></span><span class="lbs" style="background:'+hex6(t.c[1])+'"></span>'+t.n+'</button>').join('');
  $('lbDay').classList.toggle('on',!night);$('lbNight').classList.toggle('on',night);
  $('lbMode').textContent=NET.mode==='pvp'?'\u2694 Mode: PvP':'\uD83E\uDD1D Mode: Co-op';
  ['lbMaps','lbTime'].forEach(id=>$(id).classList.toggle('lk',isClient()));$('lbMode').classList.toggle('lk',isClient());
  $('lbMaps').querySelectorAll('.lbm').forEach(b=>b.onclick=()=>{if(isClient())return;th=+b.dataset.i;build(seed);renderLobby();netMapChanged()});
}
function uiNet(){
  const el=$('lbRoomInfo'),s=$('lbStart');
  if(NET.role==='solo'){el.innerHTML='';s.textContent='\u25B6 START';s.disabled=false;$('lbHost').textContent='\u2795 Room banao';renderLobby();return}
  const names=(NET.roster||[]).map(r=>r[1]).join(', ');
  el.innerHTML='Room code: <b class="lbcode">'+NET.code+'</b><br>Players ('+(NET.roster||[]).length+'/4): '+names;
  if(NET.role==='client'){s.textContent='Host ke START ka intezaar...';s.disabled=true;$('lbHost').textContent='\u2716 Room chhodo'}
  else{s.textContent='\u25B6 START ('+(NET.roster||[]).length+' player)';s.disabled=false;$('lbHost').textContent='\u2716 Room band karo'}
  renderLobby();
}
function startGame(){started=true;$('lobby').style.display='none';msg('Plane se kudne ke liye KUDO dabao')}
function openLobby(){started=false;$('lobby').style.display='flex';renderLobby();uiNet()}
$('lbSeed').onclick=()=>{if(isClient())return;build(seed=(seed*7+13)%9973);renderLobby();netMapChanged()};
$('lbDay').onclick=()=>{if(isClient())return;night=false;renderLobby();netMapChanged()};
$('lbNight').onclick=()=>{if(isClient())return;night=true;renderLobby();netMapChanged()};
$('lbMode').onclick=()=>{if(isClient())return;NET.mode=NET.mode==='pvp'?'coop':'pvp';renderLobby();netMapChanged()};
$('lbHost').onclick=()=>{NET.role==='solo'?netHost():netLeave()};
$('lbJoin').onclick=()=>netJoin($('lbCode').value);
$('lbStart').onclick=()=>{if(isClient())return;if(NET.role==='host')netStartAll();startGame()};
$('lobbyBtn').onclick=()=>{$('bt').style.display='none';netLeave();openLobby()};
setTimeout(()=>{renderLobby();uiNet()},0);
