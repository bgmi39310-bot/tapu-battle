// Multiplayer (PeerJS / WebRTC). HOST poori game chalata hai (bots, loot), baaki players host se sync hote hain.
// Co-op: sab milkar bots se ladte hain. PvP: players ek doosre ko bhi maar sakte hain.
const NET={role:'solo',mode:'coop',peer:null,hostConn:null,conns:{},players:{},myId:'host',code:'',seq:0,tSt:0,tSn:0,roster:[]};
const jr=v=>Math.round(v*100)/100;
// har build se pehle enemy/loot ke ids 0 se shuru -> sab players ke paas same ids (map seed se same ban-ta hai)
const _build0=build;build=function(sd){NID=0;LID=0;_build0(sd)};

function netBc(o,except){for(const id in NET.conns){if(id!==except){const c=NET.conns[id];if(c&&c.open)c.send(o)}}}
function netToHost(o){if(NET.hostConn&&NET.hostConn.open)NET.hostConn.send(o)}
function netShot(a,b,c){
  if(NET.role==='solo')return;
  const o={t:'shot',a:[jr(a.x),jr(a.y),jr(a.z)],b:[jr(b.x),jr(b.y),jr(b.z)],c,f:NET.myId};
  NET.role==='host'?netBc(o):netToHost(o);
}
function netHurtRemote(id,a){const c=NET.conns[id];if(c&&c.open)c.send({t:'hurt',a})}
function netPlayerHit(pid,a){if(NET.role==='host')pid==='host'?hurt(a):netHurtRemote(pid,a);else netToHost({t:'pdmg',to:pid,a})}
function netDmg(e,a){netToHost({t:'dmg',n:e.nid,a})}
let LDN=0;   // player ka girayah loot: unique id (host_1, p2_3 ...) taaki kisi se na takraye
function netNewLootId(){return NET.role==='solo'?undefined:NET.myId+'_'+(++LDN)}
function netLootDrop(x,y,z,t,id){const o={t:'ldrop',x:jr(x),y:jr(y),z:jr(z),lt:t,id};NET.role==='host'?netBc(o):netToHost(o)}
function netPick(id){if(NET.role==='host')netBc({t:'pick',id});else if(NET.role==='client')netToHost({t:'pick',id})}
function netEnemyKilled(e,lt,lid,by,rk){if(NET.role==='host')netBc({t:'ekill',n:e.nid,lt,lid,by,rk})}
function netEnemySpawned(e){if(NET.role==='host'&&started)netBc({t:'espawn',n:e.nid,x:jr(e.x),y:jr(e.y),z:jr(e.z)})}
function netMapChanged(){if(NET.role==='host')netBc({t:'map',seed,th,night,mode:NET.mode})}
function netStartAll(){if(NET.role==='host')netBc({t:'start'})}
function netAlive(){let n=0;for(const id in NET.players){const r=NET.players[id];if(r.t&&!r.dead)n++}return n}
function netAvatars(){return NET.mode==='pvp'&&NET.role!=='solo'?Object.values(NET.players).filter(r=>r.av&&!r.dead&&r.av.g.visible).map(r=>r.av.g):[]}
function netMinimap(mx,S){for(const id in NET.players){const r=NET.players[id];if(r.t&&!r.dead){mx.fillStyle=NET.mode==='pvp'?'#ff9800':'#40c4ff';mx.fillRect((r.ax/S+.5)*240-2.5,(r.az/S+.5)*240-2.5,5,5)}}}

// bots kise nishana banayein: host ya sabse paas wala remote player
function tgtFor(e){
  const me={x:P.x,y:P.y,z:P.z,dead:P.dead,phase:phase,st:st,drive:drive,id:'host'};
  if(NET.role!=='host')return me;
  let best=me,bd=(P.dead||phase)?1e9:Math.hypot(me.x-e.x,me.z-e.z);
  for(const id in NET.players){const r=NET.players[id];if(r.dead||r.ph||!r.t)continue;const d=Math.hypot(r.x-e.x,r.z-e.z);if(d<bd){bd=d;best={x:r.x,y:r.y,z:r.z,dead:false,phase:0,st:r.stn,drive:r.drv,id}}}
  return best;
}

// ---------- Room: host ----------
function netHost(){
  if(typeof Peer==='undefined'){msg('PeerJS load nahi hua (internet check karo)');return}
  netLeave();
  const code=Math.random().toString(36).slice(2,6).toUpperCase().replace(/[IO01]/g,'X'),p=NET.peer=new Peer('tapu-'+code);
  p.on('open',()=>{NET.role='host';NET.code=code;NET.myId='host';NET.players={};netRoster();msg('Room ban gaya: '+code)});
  p.on('error',e=>{if(e.type==='unavailable-id'){netHost();return}msg('Room error: '+e.type);netLeave()});
  p.on('connection',c=>c.on('open',()=>{
    const n=Object.keys(NET.players).length;
    if(started||n>=3){c.send({t:'full'});setTimeout(()=>c.close(),300);return}
    const id='p'+(++NET.seq);NET.conns[id]=c;
    NET.players[id]={id,name:'Player '+(n+2),x:0,y:0,z:0,yaw:0,pitch:0,stn:0,gun:0,sw:-1,hp:100,dead:0,drv:0,ph:1,t:0,av:null};
    c.send({t:'welcome',id,seed,th,night,mode:NET.mode});netRoster();
    c.on('data',m=>hostRecv(id,m));c.on('close',()=>netDrop(id));c.on('error',()=>netDrop(id));
  }));
}
function netRoster(){
  NET.roster=[['host','Player 1']].concat(Object.values(NET.players).map(p=>[p.id,p.name]));
  netBc({t:'roster',l:NET.roster});uiNet();
}
function netDrop(id){
  const r=NET.players[id];if(!r)return;
  if(r.av)scene.remove(r.av.g);delete NET.players[id];delete NET.conns[id];msg(r.name+' chala gaya');netRoster();
}
function hostRecv(id,m){
  const r=NET.players[id];if(!r)return;
  switch(m.t){
    case'st':Object.assign(r,{x:m.x,y:m.y,z:m.z,yaw:m.yaw,pitch:m.pitch,stn:m.stn,gun:m.gun,sw:m.sw,hp:m.hp,dead:m.dead,drv:m.drv,ph:m.ph,t:1});break;
    case'dmg':{const e=EN.find(x=>x.nid===m.n);if(e)dmgEnemy(e,Math.min(300,m.a),id);break}
    case'pdmg':if(NET.mode==='pvp')netPlayerHit(m.to,m.a);break;
    case'pick':netPickRemote(m.id);netBc({t:'pick',id:m.id},id);break;
    case'ldrop':addLoot(m.x,m.y,m.z,m.lt,m.id);netBc(m,id);break;
    case'shot':netTracer(m);netBc(m,id);break;
    case'wp':case'jump':if(typeof teamRecv==='function')teamRecv(id,m);netBc(m,id);break;
  }
}

// ---------- Room: client ----------
function netJoin(code){
  if(typeof Peer==='undefined'){msg('PeerJS load nahi hua (internet check karo)');return}
  code=(code||'').trim().toUpperCase();if(code.length<3){msg('Room code likho');return}
  netLeave();
  const p=NET.peer=new Peer();
  p.on('error',e=>{msg(e.type==='peer-unavailable'?'Room nahi mila: '+code:'Join error: '+e.type);netLeave()});
  p.on('open',()=>{
    const c=NET.hostConn=p.connect('tapu-'+code,{reliable:true});
    c.on('open',()=>{NET.role='client';NET.code=code;uiNet()});
    c.on('data',clientRecv);
    c.on('close',()=>{if(NET.role==='client'){msg('Host disconnect ho gaya');netLeave()}});
  });
}
function clientRecv(m){
  switch(m.t){
    case'welcome':NET.myId=m.id;netApplyMap(m);msg('Room me aa gaye - host ke START ka intezaar');break;
    case'map':netApplyMap(m);break;
    case'roster':NET.roster=m.l;m.l.forEach(([id,nm])=>{if(NET.players[id])NET.players[id].name=nm});uiNet();break;
    case'start':startGame();break;
    case'full':msg('Room full hai ya game shuru ho chuka hai');netLeave();break;
    case'snap':{
      NET.lastSnap=performance.now();
      for(const a of m.pl){
        if(a[0]===NET.myId)continue;
        let r=NET.players[a[0]];if(!r){const nm=(NET.roster.find(q=>q[0]===a[0])||[0,'Player'])[1];r=NET.players[a[0]]={id:a[0],name:nm,av:null}}
        r.x=a[1];r.y=a[2];r.z=a[3];r.yaw=a[4];r.stn=a[5];r.gun=a[6];r.sw=a[7];r.hp=a[8];r.dead=a[9];r.drv=a[10];r.pitch=a[11];r.ph=a[12];r.t=1;
      }
      for(const a of m.en){const e=EN.find(x=>x.nid===a[0]);if(e){e.ntx=a[1];e.nty=a[2];e.ntz=a[3];e.nry=a[4];e.nsp=a[5]}}
      break}
    case'ekill':{
      const e=EN.find(x=>x.nid===m.n);if(!e)break;
      scene.remove(e.g);EN.splice(EN.indexOf(e),1);addLoot(e.x,e.y+0.55,e.z,m.lt,m.lid);
      if(m.by===NET.myId){P.kills++;msg((m.rk?'Gaadi se kuchal diya! ':'Dushman khatam! ')+'Kills: '+P.kills)}
      break}
    case'espawn':{spawnEn();const e=EN[EN.length-1];e.nid=m.n;e.x=e.ntx=m.x;e.y=e.nty=m.y;e.z=e.ntz=m.z;e.g.position.set(m.x,m.y,m.z);break}
    case'hurt':hurt(m.a);break;
    case'wp':case'jump':if(typeof teamRecv==='function')teamRecv(null,m);break;
    case'pick':netPickRemote(m.id);break;
    case'ldrop':addLoot(m.x,m.y,m.z,m.lt,m.id);break;
    case'shot':netTracer(m);break;
  }
}
function netApplyMap(m){seed=m.seed;th=m.th;night=m.night;NET.mode=m.mode||'coop';build(seed);if(typeof renderLobby==='function')renderLobby();uiNet()}
function netTracer(m){tracer(new THREE.Vector3(m.a[0],m.a[1],m.a[2]),new THREE.Vector3(m.b[0],m.b[1],m.b[2]),m.c)}
function netPickRemote(id){const l=LT.find(x=>x.id===id);if(l){grp.remove(l.m);LT.splice(LT.indexOf(l),1)}}
function netEnemyStep(e,dt){   // client: bots ko host ke data se chalao
  if(e.ntx===undefined)return;
  const k=Math.min(1,dt*10);
  e.x+=(e.ntx-e.x)*k;e.y+=(e.nty-e.y)*k;e.z+=(e.ntz-e.z)*k;e.g.position.set(e.x,e.y,e.z);
  let d=e.nry-e.g.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));e.g.rotation.y+=d*k;
  const sp=e.nsp||0;e.wp=(e.wp||0)+sp*dt*2.4;walkCycle(e.c,e.wp,Math.min(1,sp/3),sp>5?1:0);
  if(e.gait)e.gait(sp);if(e.ik){e.g.updateMatrixWorld(true);e.ik()}
}
function netLeave(){
  for(const id in NET.players){const r=NET.players[id];if(r.av)scene.remove(r.av.g)}
  try{if(NET.hostConn)NET.hostConn.close()}catch(e){}
  try{for(const id in NET.conns)NET.conns[id].close()}catch(e){}
  try{if(NET.peer)NET.peer.destroy()}catch(e){}
  NET.role='solo';NET.peer=null;NET.hostConn=null;NET.conns={};NET.players={};NET.roster=[];NET.myId='host';NET.code='';
  if(typeof uiNet==='function')uiNet();
}

// ---------- har frame ----------
function snapPlayers(){
  const a=[['host',jr(P.x),jr(P.y),jr(P.z),jr(P.yaw),st,P.gun?1:0,P.sw,Math.round(P.hp),P.dead?1:0,drive?1:0,jr(P.pitch),phase]];
  for(const id in NET.players){const r=NET.players[id];a.push([id,jr(r.x),jr(r.y),jr(r.z),jr(r.yaw),r.stn,r.gun,r.sw,Math.round(r.hp),r.dead,r.drv,jr(r.pitch),r.ph])}
  return a;
}
function netFrame(dt){
  if(NET.role==='solo')return;
  NET.tSt-=dt;NET.tSn-=dt;
  if(NET.role==='client'&&NET.tSt<=0){NET.tSt=0.066;netToHost({t:'st',x:jr(P.x),y:jr(P.y),z:jr(P.z),yaw:jr(P.yaw),pitch:jr(P.pitch),stn:st,gun:P.gun?1:0,sw:P.sw,hp:Math.round(P.hp),dead:P.dead?1:0,drv:drive?1:0,ph:phase})}
  if(NET.role==='host'&&NET.tSn<=0){NET.tSn=0.08;netBc({t:'snap',pl:snapPlayers(),en:EN.map(e=>[e.nid,jr(e.x),jr(e.y),jr(e.z),jr(e.g.rotation.y),jr(e.spd||0)])})}
  for(const id in NET.players)avatarStep(NET.players[id],dt);
}
function makeLabel(t){
  const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');
  x.font='bold 34px sans-serif';x.textAlign='center';x.lineWidth=6;x.strokeStyle='#000';x.fillStyle='#fff';x.strokeText(t,128,44);x.fillText(t,128,44);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false,transparent:true}));s.scale.set(1.8,0.45,1);return s;
}
function avatarStep(r,dt){
  if(!r.t)return;
  if(!r.av){
    r.av=mkChar(0x2f6fb0,false);scene.add(r.av.g);r.av.g.rotation.order='YXZ';
    r.av.g.traverse(o=>{if(o.isMesh)o.userData.pid=r.id});r.av.hd.traverse(o=>{if(o.isMesh)o.userData.hd=1});r.av.hm.traverse(o=>{if(o.isMesh)o.userData.hd=1});
    r.lb=makeLabel(r.name||r.id);r.lb.position.set(0,2.5,0);r.av.g.add(r.lb);r.ax=r.x;r.ay=r.y;r.az=r.z;r.ayaw=r.yaw;
  }
  const k=Math.min(1,dt*10),ox=r.ax,oz=r.az;
  r.ax+=(r.x-r.ax)*k;r.ay+=(r.y-r.ay)*k;r.az+=(r.z-r.az)*k;
  let d=r.yaw-r.ayaw;d=Math.atan2(Math.sin(d),Math.cos(d));r.ayaw+=d*k;
  const sp=Math.hypot(r.ax-ox,r.az-oz)/Math.max(dt,1e-3),str=Math.min(1,sp/6);r.wph=(r.wph||0)+sp*dt*2.2;
  const g=r.av.g;g.visible=!r.dead&&!r.drv&&started;
  g.position.set(r.ax,r.ay+(r.stn===2?0.18:0),r.az);g.rotation.set(r.stn===2?-1.35:0,r.ayaw,0);g.scale.y=0.78*(r.stn===1?0.82:1);
  walkCycle(r.av,r.wph,str,0);
  const hasSw=netAvatarSword(r,str,performance.now()/1000);
  r.av.rf.visible=!!r.gun&&!hasSw;if(!hasSw){r.av.torso.rotation.set(0,0,0);r.av.pel.rotation.set(0,0,0);r.av.poseArms(!!r.gun,r.wph,str,false,r.pitch||0,0)}
}
