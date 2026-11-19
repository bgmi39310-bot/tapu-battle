// Talwar (melee) - SIRF main player ke liye vaar. Dushman talwar nahi chalate.
// 10 talwarein map par alag-alag jagah loot me padi hain (09h-swords.js). Jo uthate ho SIRF wahi dikhti hai.
// Talwar button / V = bandook <-> talwar. FIRE = vaar (do tarah ke vaar baari-baari: tirchha, phir seedha).
P.sw=-1;      // abhi haath me kaun si talwar (-1 = nahi, bandook/khali)
P.melee=-1;   // bag me kaun si talwar hai (-1 = koi nahi)
const SW={fp:null,fpRoll:null,fpArm:null,tpS:null,hand:null,t:0,hit:false,combo:0,since:9,dur:0.45,reach:3.7,dmg:60,sprK:0,tm:0,fxA:null,fxB:null};
SW.names=SWORDS.map(s=>s.name);
const _UP=new THREE.Vector3(0,1,0),_D=new THREE.Vector3();
const _gloveM=new THREE.MeshStandardMaterial({color:0x1b1f23,roughness:0.7,metalness:0.2}),_sleeveM=new THREE.MeshStandardMaterial({color:0x3b593f,map:TEX.camo,roughness:0.85});

// teesra-person: talwar daayen haath (pl.el2) me
SW.hand=new THREE.Group();SW.hand.position.set(0,-0.34,0);pl.el2.add(SW.hand);

// vaar ki chamak (pehle-person me): do patli arc, vaar ke beech me jhalak dikhati hain
(function(){
  const mk=(r,a0,a1,cx,cy)=>{const m=new THREE.Mesh(new THREE.RingGeometry(r,r+0.018,40,1,a0,a1-a0),new THREE.MeshBasicMaterial({color:0xdff4ff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false}));
    m.position.set(cx,cy,-1.0);m.visible=false;m.frustumCulled=false;cam.add(m);return m};
  SW.fxA=mk(1.0,Math.PI*0.5,Math.PI*0.9,0.55,-0.95);     // upar-daayen se neeche-baayen
  SW.fxB=mk(1.3,Math.PI*0.36,Math.PI*0.64,0.05,-1.5);    // baayen se daayen
})();

function setSword(i){
  if(SW.fp){cam.remove(SW.fp);SW.fp=null}
  if(SW.fpArm){cam.remove(SW.fpArm);SW.fpArm=null}
  if(SW.tpS){SW.hand.remove(SW.tpS);SW.tpS=null}
  P.sw=i;if(i<0)return;
  const d=SWORDS[i];SW.dur=d.dur;SW.reach=d.reach;SW.dmg=d.dmg;SW.t=0;
  // pehla-person: pivot > roll > talwar, aur muththe par dastana + forearm
  const pv=new THREE.Group(),rl=new THREE.Group();pv.add(rl);rl.add(swordObj(i,0.78,false));
  const gl=new THREE.Mesh(new THREE.SphereGeometry(0.05,10,8),_gloveM);gl.position.y=-0.015;pv.add(gl);
  pv.visible=false;cam.add(pv);SW.fp=pv;SW.fpRoll=rl;
  const arm=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.062,1,10),_sleeveM);arm.visible=false;arm.frustumCulled=false;cam.add(arm);SW.fpArm=arm;
  // teesra-person
  SW.tpS=swordObj(i,1/0.78,true);SW.hand.add(SW.tpS);
}
// button / V: bandook <-> jo talwar bag me hai
function cycleSword(){
  if(drive||phase||P.dead)return;
  if(P.melee<0){msg('Talwar nahi hai - ghar/chhat par dhundo (neela ring wala loot)');return}
  if(P.sw>=0){setSword(-1);msg(P.gun?'Bandook':'Haath khali')}
  else{setSword(P.melee);msg(SWORDS[P.melee].name+' nikali  -  FIRE se vaar')}
  scope=false;$('sc').style.display='none';held=null;
}
// loot se talwar uthana (05-inventory pick() yahi bulata hai). false = uthayi nahi.
function swordPick(i){
  if(P.melee===i){msg(SWORDS[i].name+' pehle se hai');return false}
  const old=P.melee,inHand=P.sw>=0;
  if(old>=0&&typeof spawnDrop==='function')spawnDrop('S'+old);      // purani talwar zameen par
  P.melee=i;
  if(inHand||!P.gun){setSword(i);msg(SWORDS[i].name+' mili  -  FIRE se vaar')}
  else msg(SWORDS[i].name+' mili  -  Talwar button se nikalo');
  return true;
}
function swordDrop(){   // inventory se Girao
  if(P.melee<0)return null;
  const t='S'+P.melee;P.melee=-1;if(P.sw>=0)setSword(-1);return t;
}
function startSlash(){
  if(SW.t>0)return;
  SW.combo=SW.since<0.9?(SW.combo^1):0;SW.since=0;   // chalte-chalte combo: tirchha, seedha, tirchha ...
  SW.t=SW.dur;SW.hit=false;snd(520,0.12,0.04,'triangle');
}
function slashDamage(){
  const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);let any=false;
  for(const e of[...EN]){
    const dx=e.x-P.x,dz=e.z-P.z,d=Math.hypot(dx,dz);
    if(d>SW.reach||Math.abs(e.y-P.y)>2.2)continue;
    if(d>0.6&&(dx*fx+dz*fz)/d<0.3)continue;        // saamne ~70 degree ke andar
    if(!hasLOS(e))continue;                         // deewar ke aar-paar nahi
    dmgEnemy(e,SW.dmg);any=true;
  }
  if(NET.mode==='pvp'&&NET.role!=='solo')for(const id in NET.players){const r=NET.players[id];if(!r.av||r.dead||!r.t)continue;const dx=r.ax-P.x,dz=r.az-P.z,d=Math.hypot(dx,dz);if(d<=SW.reach&&(d<0.6||(dx*fx+dz*fz)/d>=0.3)){netPlayerHit(id,SW.dmg*0.6);any=true}}
  if(any){shake=Math.max(shake,0.5);snd(180,0.1,0.07,'sawtooth');const h=$('hm');h.style.color='#ff1744';h.style.opacity=1;setTimeout(()=>h.style.opacity=0,120)}
}
// har frame: vaar ka samay, hit, pehle-person animation, visibility
function meleeUpdate(dt,fpp,stride,spr){
  const on=P.sw>=0&&!drive&&!phase&&!P.dead;
  SW.tm+=dt;SW.sprK+=((spr?1:0)-SW.sprK)*Math.min(1,dt*8);
  if(SW.t<=0)SW.since+=dt;
  if(P.sw>=0&&scope){scope=false;$('sc').style.display='none'}
  let s=-1;
  if(SW.t>0){SW.t=Math.max(0,SW.t-dt);s=1-SW.t/SW.dur;if(!SW.hit&&s>=0.42){SW.hit=true;slashDamage()}}
  if(SW.tpS)SW.tpS.visible=on&&!fpp;
  const showFP=on&&fpp;
  if(SW.fp){
    SW.fp.visible=showFP;SW.fpArm.visible=showFP;
    if(showFP){
      meleeFP(SW.fp,SW.fpRoll,{ph:P.wph,str:stride,spr:SW.sprK,s,combo:SW.combo,tm:SW.tm});
      const h=SW.fp.position;_D.set(0.55-h.x,-0.7-h.y,-0.2-h.z);const len=_D.length();   // forearm: haath se camera ke neeche-daayen kone tak
      SW.fpArm.position.set((h.x+0.55)/2,(h.y-0.7)/2,(h.z-0.2)/2);SW.fpArm.scale.set(1,len,1);SW.fpArm.quaternion.setFromUnitVectors(_UP,_D.normalize());
    }
  }
  for(const fx of[SW.fxA,SW.fxB]){fx.visible=false}
  if(showFP&&s>=0){                    // vaar ke beech me chamak
    const fx=SW.combo?SW.fxB:SW.fxA,o=Math.max(0,1-Math.abs((s-0.45)/0.18))*0.75;
    if(o>0.01){fx.visible=true;fx.material.opacity=o}
  }
}
// teesra-person pose (pl) - 10-game-loop har frame bulata hai
function meleePose(stride,spr){
  const s=SW.t>0?1-SW.t/SW.dur:-1;
  const tl=meleeArms(pl,{ph:P.wph,str:stride,spr:SW.sprK,s,combo:SW.combo,tm:SW.tm});
  SW.hand.rotation.set(-Math.PI/2+tl,0,0);
}
// dusre players (multiplayer) ke haath me talwar dikhana
function netAvatarSword(r,str,tmv){
  const av=r.av;
  if(!r.swHand){r.swHand=new THREE.Group();r.swHand.position.set(0,-0.34,0);av.el2.add(r.swHand);r.swIdx=-1}
  if(r.swIdx!==r.sw){
    if(r.swObj){r.swHand.remove(r.swObj);r.swObj=null}
    if(r.sw>=0&&SWORDS[r.sw]){r.swObj=swordObj(r.sw,1/0.78,false);r.swHand.add(r.swObj)}
    r.swIdx=r.sw;
  }
  if(r.sw>=0){const tl=meleeArms(av,{ph:r.wph,str,spr:0,s:-1,combo:0,tm:tmv});r.swHand.rotation.set(-Math.PI/2+tl,0,0);return true}
  return false;
}
addEventListener('keydown',e=>{if(e.key==='v'||e.key==='V')cycleSword()});   // F = grenade/molotov phenko, V = talwar nikalo/rakho
$('sw').onpointerdown=()=>{if(!edit)cycleSword()};
