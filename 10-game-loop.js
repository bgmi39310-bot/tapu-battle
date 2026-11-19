// Shooting, enemy AI, per-frame update, camera, HUD, startup
// ---------- Main game loop ----------
const LK=['h','a','a','G','M','h','a','B','H'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const cB=new THREE.Color(0x0a1224),cS=new THREE.Color(),vo=new THREE.Vector3(),vd=new THREE.Vector3(),vm=new THREE.Vector3();
const DIRS=['N','NE','E','SE','S','SW','W','NW'];
let bY=0,tm=0,fireT=0,spr=false,lastT=performance.now(),fovT=70;

function bxHit(o,d,L){for(let t=0.5;t<L;t+=0.75){const x=o.x+d.x*t,y=o.y+d.y*t,z=o.z+d.z*t;for(const q of BX)if(x>q[0]&&x<q[2]&&z>q[1]&&z<q[3]&&y>(q[4]||-99)&&y<(q[5]||999))return t}return -1}
function hasLOS(e,tg){
  tg=tg||{x:P.x,y:P.y,z:P.z,st:st};
  vo.set(e.x,e.y+1.4,e.z);vd.set(tg.x-e.x,tg.y+(tg.st===2?0.35:tg.st===1?0.9:1.2)-(e.y+1.4),tg.z-e.z);const d=vd.length();vd.normalize();
  rcE.set(vo,vd);rcE.far=d;if(rcE.intersectObjects(WM,false).length)return false;if(bxHit(vo,vd,d)>=0)return false;
  return obsT({x:vo.x,y:vo.y,z:vo.z},{x:vd.x,y:vd.y,z:vd.z},d,false)>=d;
}
function shoot(){
  fireT=0.092;P.ammo--;rec=Math.min(1,rec+0.07);mFlashT=0.05;snd(190,0.09,0.05);
  P.pitch=clamp(P.pitch+0.003+rec*0.004,-1.2,1.2);P.yaw+=(Math.random()-.5)*0.003;
  const sp=(scope?0.0012:0.005)*(1+rec*1.5)*(st?0.6:1)*(spr?2:1);
  rc.setFromCamera({x:(Math.random()-.5)*sp*10,y:(Math.random()-.5)*sp*10},cam);rc.far=300;
  const o=rc.ray.origin.clone(),d=rc.ray.direction.clone(),hits=rc.intersectObjects([...EN.map(e=>e.g),...WM,...netAvatars()],true);
  let dist=300,tgt=null,hd=false,tgtP=null;
  if(hits.length){dist=hits[0].distance;const u=hits[0].object.userData;if(u.e){tgt=u.e;hd=!!u.hd||(!!u.glb&&hits[0].point.y-u.e.y>1.45)}else if(u.pid){tgtP=u.pid;hd=!!u.hd}}
  const tr=obsT(o,d,dist,false);if(tr<dist){dist=tr;tgt=null;tgtP=null}
  if(tgt||tgtP){const bh=bxHit(o,d,dist);if(bh>=0){dist=bh;tgt=null;tgtP=null}}
  const end=o.clone().addScaledVector(d,dist),mz=(cam3&&!scope?pl.mFl:gv.mFl).getWorldPosition(new THREE.Vector3());
  tracer(mz,end,0xffd54f);
  if(tgt&&EN.includes(tgt)){dmgEnemy(tgt,hd?60:26);const h=$('hm');h.style.color=hd?'#ffeb3b':'#ff1744';h.style.opacity=1;setTimeout(()=>h.style.opacity=0,110)}
  if(tgtP){netPlayerHit(tgtP,hd?45:20);const h=$('hm');h.style.color=hd?'#ffeb3b':'#ff1744';h.style.opacity=1;setTimeout(()=>h.style.opacity=0,110)}
  netShot(mz,end,0xffd54f);
}
function enemyShoot(e,dist,tg){
  tg=tg||{x:P.x,y:P.y,z:P.z,st:st,drive:drive,id:'host'};
  const a=new THREE.Vector3(e.x,e.y+1.3,e.z),b=new THREE.Vector3(tg.x+(Math.random()-.5)*0.6,tg.y+(tg.st===2?0.35:tg.st===1?0.9:1.3)+(Math.random()-.5)*0.4,tg.z+(Math.random()-.5)*0.6);
  vd.copy(b).sub(a);const L=vd.length();vd.normalize();rcE.set(a,vd);rcE.far=L;
  const wh=rcE.intersectObjects(WM,false);let blocked=false,end=b;
  if(wh.length){blocked=true;end=wh[0].point.clone()}
  else{const ot=obsT({x:a.x,y:a.y,z:a.z},{x:vd.x,y:vd.y,z:vd.z},L,false),bt=bxHit(a,vd,L);
    if(ot<L){blocked=true;end=a.clone().addScaledVector(vd,ot)}else if(bt>=0){blocked=true;end=a.clone().addScaledVector(vd,bt)}}
  tracer(a,end,0xff5252);e.c.mFl.visible=true;setTimeout(()=>e.c.mFl.visible=false,60);
  if(dist<80)snd(150,0.08,0.03*(1-dist/80));
  netShot(a,end,0xff5252);
  if(!blocked&&Math.random()<clamp(0.36-dist/260,0.04,0.26)*(tg.st?0.7:1)*(tg.drive?0.6:1)){const dm=3.5+Math.random()*3.5;if(tg.id&&tg.id!=='host')netHurtRemote(tg.id,dm);else hurt(dm)}
  else if(blocked)e.see=false;
}
function step(dt){
  if(!started){lobbyCam(dt);return}
  tm+=dt;netFrame(dt);const K_=k=>K[k]?1:0;
  const kx=K_('d')+K_('arrowright')-K_('a')-K_('arrowleft'),ky=K_('s')+K_('arrowdown')-K_('w')-K_('arrowup');
  const fx=clamp(mv.x+kx,-1,1),fy=clamp(mv.y+ky,-1,1);
  // day/night
  nT=lerp(nT,night?1:0,Math.min(1,dt*1.5));MODEL_MATS.forEach(m=>m.color&&m.color.setScalar(lerp(1,0.35,nT)));
  cS.set(skyD).lerp(cB,nT);scene.background=cS;scene.fog.color.copy(cS);ren.setClearColor(cS,1);
  hemi.intensity=lerp(1.1,0.3,nT);sun.intensity=lerp(1.2,0.06,nT);
  sun.position.set(P.x+85,P.y+140,P.z+45);sun.target.position.set(P.x,P.y,P.z);
  {const sd=vd.set(85,140,45).normalize();   // sun ka gola ab door asmaan me, camera ke saath (pehle map ke beech me atka tha)
   sunM.position.set(cam.position.x+sd.x*820,cam.position.y+sd.y*820,cam.position.z+sd.z*820);sunM.visible=nT<0.6;
   stars.position.copy(cam.position);stars.material.opacity=Math.max(0,(nT-0.3)*1.3);
   for(const c of CL){c.position.x+=dt*1.6;if(c.position.x>S)c.position.x=-S}
   water.material.map.offset.x+=dt*0.004}
  const ct=P.dead?null:findClimbTarget();climbTarget=ct;
  $('jb2').classList.toggle('climb-ready',!!ct);$('jbl').textContent=phase?'Kudo':(ct?'Chadho':'Kudo');
  spr=false;
  if(P.dead){jmpReq=false}
  else if(phase){const ss=typeof squadSteer==='function'?squadSteer(dt):null;if(ss)air(dt,ss.fx,ss.fy);else air(dt,fx,fy)}
  else if(drive){
    jmpReq=false;
    const acc=clamp(DRV.g-DRV.b-ky,-1,1),str=clamp(DRV.r-DRV.l+kx,-1,1),br=(acc>0&&J.v<-0.5)||(acc<0&&J.v>0.5);
    J.v+=acc*(br?30:(acc>0?15:9))*dt;if(!acc)J.v*=Math.pow(0.55,dt);J.v=clamp(J.v,-8,34);
    if(hmap(J.x,J.z)<-0.8)J.v*=Math.pow(0.1,dt);
    J.st=lerp(J.st,str*0.6,Math.min(1,dt*5));J.a-=J.st*dt*clamp(J.v/5,-1.3,1.3);
    const px=J.x,pz=J.z;moveWithSubsteps(J,-Math.sin(J.a)*J.v*dt,-Math.cos(J.a)*J.v*dt,1.7,1.6);
    if(Math.hypot(J.x-px,J.z-pz)<Math.abs(J.v)*dt*0.5)J.v*=0.4;
    J.y=Math.max(gnd(J.x,J.z,J.y+1,J.y+1),0)+0.1;
    const sa=Math.sin(J.a),ca=Math.cos(J.a),hF=gnd(J.x-sa*2,J.z-ca*2,J.y+1,J.y+1),hB=gnd(J.x+sa*2,J.z+ca*2,J.y+1,J.y+1);
    jp.rotation.order='YXZ';jp.position.set(J.x,J.y,J.z);jp.rotation.set(clamp(Math.atan2(hF-hB,4),-0.5,0.5),J.a,0);
    jWheels.forEach(w=>w.rotation.x-=J.v*dt/0.52);
    for(const e of[...EN])if(Math.hypot(e.x-J.x,e.z-J.z)<2.6&&Math.abs(J.v)>7)dmgEnemy(e,999,'host',true);
    P.x=J.x;P.z=J.z;P.y=J.y+0.8;P.vx=P.vz=0;
    if(!eyeOn&&Math.abs(J.v)>3)P.yaw+=Math.atan2(Math.sin(J.a-P.yaw),Math.cos(J.a-P.yaw))*Math.min(1,dt*0.8);
    $('spdhud').textContent='UAZ: '+Math.round(Math.abs(J.v)*3.6)+' km/h';
  }else{
    if(P.climb){
      const c=P.climb;c.t+=dt/0.5;const u=Math.min(1,c.t),e=u*u*(3-2*u);
      P.x=lerp(c.sx,c.tx,e);P.z=lerp(c.sz,c.tz,e);P.y=lerp(c.sy,c.ty,e)+Math.sin(u*Math.PI)*0.6;P.vx=P.vz=0;
      if(u>=1){P.climb=null;P.vy=0;P.y=c.ty}
      jmpReq=false;
    }else{
      spr=(js.classList.contains('sprint')||(!!K.shift&&(kx||ky)))&&!st&&!scope;
      const fw=-fy/(Math.hypot(fx,fy)||1),spd=st===2?1.3:st===1?2.6:spr?5.9+1.3*fw:4.6,sn=Math.sin(P.yaw),cs=Math.cos(P.yaw);
      let wx=fx*cs+fy*sn,wz=-fx*sn+fy*cs;const ln=Math.hypot(wx,wz),m=Math.min(1,Math.hypot(fx,fy));
      if(ln>1e-4){wx=wx/ln*spd*m;wz=wz/ln*spd*m}else{wx=wz=0}
      const k=Math.min(1,dt*10);P.vx=lerp(P.vx,wx,k);P.vz=lerp(P.vz,wz,k);
      moveWithSubsteps(P,P.vx*dt,P.vz*dt,0.42,1.55);
      const g=gnd(P.x,P.z,P.y,P.y);
      if(jmpReq){jmpReq=false;if(ct){P.climb={t:0,sx:P.x,sy:P.y,sz:P.z,tx:ct.tx,ty:ct.ty,tz:ct.tz};P.vy=0}else if(P.y<=g+0.08&&!st)P.vy=7}
      if(!P.climb){
        if(P.y<g&&P.vy<=0){P.y=Math.min(g,P.y+16*dt);P.vy=0}
        else{P.vy-=22*dt;P.y+=P.vy*dt;if(P.y<=g){if(P.vy<-19)hurt((-P.vy-19)*5);P.y=g;P.vy=0}}
      }
    }
  }
  // fire / reload
  fireT-=dt;
  if(reload>0){reload-=dt;if(reload<=0){const n=Math.min(30-P.ammo,P.res);P.ammo+=n;P.res-=n;msg('Reload ho gaya')}}
  if(firing&&!held&&P.sw>=0&&!drive&&!phase&&!P.dead&&!P.climb)startSlash();
  if(firing&&!held&&P.gun&&P.sw<0&&!drive&&!phase&&!P.dead&&!P.climb&&fireT<=0&&reload<=0){
    if(P.ammo>0)shoot();else if(P.res>0)doReload();else{fireT=0.5;snd(150,0.05,0.04);msg('Ammo khatam!')}
  }
  rec=Math.max(0,rec-dt*1.6);mFlashT=Math.max(0,mFlashT-dt);
  // enemies
  for(const e of[...EN]){
    if(NET.role==='client'){netEnemyStep(e,dt);continue}
    const tg=tgtFor(e);
    e.lt-=dt;e.cd-=dt;const dx=tg.x-e.x,dz=tg.z-e.z,dist=Math.hypot(dx,dz)||1;
    if(e.lt<=0){e.lt=0.3+Math.random()*0.2;e.see=!tg.dead&&!tg.phase&&dist<(night?42:70)&&hasLOS(e,tg)}
    let mx=0,mz=0,spd=0;
    if(e.see){
      e.g.rotation.y=Math.atan2(-dx,-dz);
      if(dist>28){spd=3.4;mx=dx/dist;mz=dz/dist}else if(dist<14){spd=2.4;mx=-dx/dist;mz=-dz/dist}
      else{e.ph+=dt;const s=Math.sin(e.ph*1.3)>0?1:-1;spd=2;mx=-dz/dist*s;mz=dx/dist*s}
      if(e.cd<=0){e.cd=0.8+Math.random()*0.7;enemyShoot(e,dist,tg)}
    }else{
      e.wt-=dt;if(e.wt<=0||Math.hypot(e.tx-e.x,e.tz-e.z)<3){e.wt=4+Math.random()*5;e.tx=clamp(e.x+(Math.random()-.5)*80,-S*.45,S*.45);e.tz=clamp(e.z+(Math.random()-.5)*80,-S*.45,S*.45)}
      const ddx=e.tx-e.x,ddz=e.tz-e.z,dd=Math.hypot(ddx,ddz)||1;spd=2.2;mx=ddx/dd;mz=ddz/dd;e.g.rotation.y=Math.atan2(-mx,-mz);
    }
    if(hmap(e.x+mx*1.5,e.z+mz*1.5)<-0.5){spd=0;e.wt=0}
    moveWithSubsteps(e,mx*spd*dt,mz*spd*dt,0.42,1.55);e.y=gnd(e.x,e.z,e.y,e.y);e.g.position.set(e.x,e.y,e.z);
    e.spd=spd;if(e.mx)e.mx.update(dt*(spd>0.1?1.6:0.5));if(e.gait)e.gait(spd);if(e.ik){e.g.updateMatrixWorld(true);e.ik()}e.wp=(e.wp||0)+spd*dt*2.4;walkCycle(e.c,e.wp,Math.min(1,spd/3),spd>5?1:0);
  }
  // grenades, molotov, explosions, fire
  for(let i=PJ.length-1;i>=0;i--){
    const p=PJ[i],m=p.m.position,ox=m.x,oz=m.z;p.life-=dt;p.v.y-=20*dt;m.addScaledVector(p.v,dt);
    const g=gnd(m.x,m.z,m.y,m.y)+0.2;
    if(m.y<g){m.y=g;if(p.t==='M'){boom(p);scene.remove(p.m);PJ.splice(i,1);continue}p.v.y=Math.abs(p.v.y)*0.3;p.v.x*=0.6;p.v.z*=0.6}
    for(const b of BX){const top=b[5]||hmap(m.x,m.z)+3.6;if(m.x>b[0]&&m.x<b[2]&&m.z>b[1]&&m.z<b[3]&&m.y<top&&m.y>(b[4]||-99)){m.x=ox;m.z=oz;p.v.x*=-0.4;p.v.z*=-0.4;break}}
    p.m.rotation.x+=dt*8;if(p.life<=0){boom(p);scene.remove(p.m);PJ.splice(i,1)}
  }
  for(let i=FX.length-1;i>=0;i--){const f=FX[i];f.t-=dt;f.m.scale.setScalar(1+(0.45-f.t)*30);f.m.material.opacity=Math.max(0,f.t/0.45*0.88);if(f.t<=0){scene.remove(f.m);FX.splice(i,1)}}
  for(let i=FZ.length-1;i>=0;i--){
    const f=FZ[i];f.t-=dt;f.acc+=dt;f.m.material.opacity=0.45+Math.sin(tm*20)*0.15;
    if(f.acc>=0.5){f.acc=0;for(const e of[...EN])if(Math.hypot(e.x-f.x,e.z-f.z)<5.5){dmgEnemy(e,22)}if(Math.hypot(P.x-f.x,P.z-f.z)<5.5&&Math.abs(P.y-f.y)<2)hurt(5)}
    if(f.t<=0){scene.remove(f.m);FZ.splice(i,1)}
  }
  // loot
  near=null;let bd=2.8;
  for(const l of LT){const p=l.m.position,d=Math.hypot(p.x-P.x,p.z-P.z);l.m.visible=d<120;if(l.m.visible)l.m.rotation.y+=dt;if(drive||phase||P.dead)continue;if(d<bd&&Math.abs(p.y-P.y)<3){bd=d;near=l}}
  $('pb').style.display=near?'flex':'none';if(near)$('pbl').textContent=lootName(near.t);
  // player model
  const mvl=Math.hypot(P.vx,P.vz),stride=Math.min(1,mvl/6);P.wph+=mvl*dt*2.2;
  const fpp=(!cam3||scope)&&!phase&&!drive;
  pl.g.visible=!drive&&!fpp&&phase!==1;gv.visible=fpp&&P.gun&&P.sw<0;pl.rf.visible=!!P.gun&&P.sw<0;meleeUpdate(dt,fpp,stride,spr);
  pl.g.position.set(P.x,P.y+(st===2?0.18:0),P.z);{const ty=(firing||scope||phase||mvl<0.4)?P.yaw:Math.atan2(-P.vx,-P.vz);bY+=Math.atan2(Math.sin(ty-bY),Math.cos(ty-bY))*Math.min(1,dt*12)}pl.g.rotation.set(st===2?-1.35:0,bY,0);pl.g.scale.y=0.78*(st===1?0.82:1);
  walkCycle(pl,P.wph,stride,SW.sprK);
  if(P.sw>=0&&!drive&&!phase)meleePose(stride,spr);else{pl.torso.rotation.set(0,0,0);pl.pel.rotation.set(0,0,0);pl.poseArms(P.gun&&!drive,P.wph,stride,spr,P.pitch,rec*0.5)}
  pl.mFl.visible=mFlashT>0&&!fpp;gv.mFl.visible=mFlashT>0&&fpp;
  PLM.visible=phase===1;PLM.position.set(PL.x,PL.y,PL.z);props.forEach(p=>p.rotation.z+=dt*40);
  CH.visible=phase===3;CH.position.set(P.x,P.y,P.z);
  // camera
  eh=lerp(eh,[1.65,1.15,0.5][st]||1.65,Math.min(1,dt*8));lean=lerp(lean,leanT,Math.min(1,dt*8));
  if(!eyeOn){FY*=Math.pow(0.001,dt);FP*=Math.pow(0.001,dt)}
  const yaw=P.yaw+FY,pit=clamp(P.pitch+FP,-1.4,1.4),sn2=Math.sin(yaw),cs2=Math.cos(yaw),cp=Math.cos(pit);
  const hx=P.x+Math.cos(P.yaw)*lean*0.5,hz=P.z-Math.sin(P.yaw)*lean*0.5,hy=drive?J.y+2.4:P.y+eh;
  let cx=hx,cy=hy,cz=hz;
  if(!fpp){
    const want=phase===1?26:phase?7.5:drive?8.5:3.1,rs=phase||drive?0:0.55;
    vd.set(sn2*cp*want+cs2*rs,-Math.sin(pit)*want+0.3,cs2*cp*want-sn2*rs);
    let dd=vd.length();
    if(!phase){vo.set(hx,hy,hz);vm.copy(vd).normalize();rcC.set(vo,vm);rcC.far=dd;const h=rcC.intersectObjects(WM,false);if(h.length)dd=Math.max(0.4,h[0].distance-0.25)}
    vd.normalize().multiplyScalar(dd);cx=hx+vd.x;cy=hy+vd.y;cz=hz+vd.z;
    cy=Math.max(cy,Math.max(hmap(cx,cz),-0.5)+0.4);
  }
  shake=Math.max(0,shake*Math.pow(0.02,dt)-0.001);
  cam.position.set(cx+(Math.random()-.5)*shake*0.4,cy+(Math.random()-.5)*shake*0.4,cz+(Math.random()-.5)*shake*0.4);
  cam.rotation.order='YXZ';cam.rotation.set(pit,yaw,-lean*0.15);
  fovT=scope?18:70;if(Math.abs(cam.fov-fovT)>0.05){cam.fov=lerp(cam.fov,fovT,Math.min(1,dt*10));cam.updateProjectionMatrix()}
  // HUD
  $('hf').style.width=P.hp+'%';$('hf').style.background=P.hp>55?'linear-gradient(90deg,#43a047,#76ff03)':P.hp>25?'linear-gradient(90deg,#f9a825,#ffee58)':'linear-gradient(90deg,#c62828,#ff5252)';
  $('am').textContent=(P.sw>=0?'Talwar: '+SW.names[P.sw]+(SW.combo?'  ⟵':'  ⟶'):P.gun?'M416  '+P.ammo+' / '+P.res+(reload>0?'  ↻':''):'Haath khali — M416 dhundo')+(held?'  |  '+LN[held]+' ready':'');
  $('alv').textContent=EN.length+1+netAlive();$('klc').textContent=P.kills;
  const hdg=((-P.yaw*180/Math.PI)%360+360)%360;$('cp').innerHTML=DIRS[Math.round(hdg/45)%8]+' '+Math.round(hdg)+'&deg;';
  prev();
  if(typeof teamUpdate==='function')teamUpdate(dt);
  // minimap
  if(mm._bg){
    const k=3,px=(P.x/S+.5)*240,pz=(P.z/S+.5)*240;
    mx.save();mx.clearRect(0,0,240,240);mx.translate(120,120);mx.rotate(P.yaw);mx.scale(k,k);mx.translate(-px,-pz);mx.drawImage(mm._bg,0,0);
    mx.fillStyle='#ff1744';for(const e of EN){mx.beginPath();mx.arc((e.x/S+.5)*240,(e.z/S+.5)*240,2.6/k*2,0,6.3);mx.fill()}
    netMinimap(mx,S);mx.fillStyle='#00e5ff';mx.fillRect((J.x/S+.5)*240-2,(J.z/S+.5)*240-2,4,4);
    mx.fillStyle='#ffd54f';for(const l of LT){if(Math.abs(l.m.position.x-P.x)<45&&Math.abs(l.m.position.z-P.z)<45)mx.fillRect((l.m.position.x/S+.5)*240-.5,(l.m.position.z/S+.5)*240-.5,1,1)}
    mx.restore();
    mx.fillStyle='#fff';mx.beginPath();mx.moveTo(120,108);mx.lineTo(128,128);mx.lineTo(120,123);mx.lineTo(112,128);mx.closePath();mx.fill();
  }
}
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(0.05,(now-lastT)/1000||0.016);lastT=now;
  try{step(dt)}catch(err){if(!frame.err){frame.err=1;console.error(err);msg('Error: '+err.message)}}
  ren.render(scene,cam);
}

try{jsBase=JSON.parse(localStorage.getItem('tapu_js')||'null')}catch(e){}if(jsBase)resetJoystickPos();loadSens();loadLay();build(seed);requestAnimationFrame(frame);
