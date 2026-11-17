// Touch/keyboard controls, buttons, gyro, settings UI
function size(){const w=innerWidth,h=innerHeight;ren.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}
addEventListener('resize',size);size();

const js=$('js'),jk=$('jk'),tc={};
let jsBase=null;
function resetJoystickPos(){if(jsBase){js.style.left=jsBase.x+'px';js.style.top=jsBase.y+'px';js.style.bottom='auto'}else{js.style.left='85px';js.style.top='';js.style.bottom='calc(95px + env(safe-area-inset-bottom,0px))'}js.classList.remove('sprint');jk.style.transform='';}
cv.addEventListener('pointerdown',e=>{
  cv.setPointerCapture(e.pointerId);const mode=(e.pointerType==='mouse'||drive)?'look':(e.clientX<innerWidth*0.48?'move':'look');
  tc[e.pointerId]={mode,sx:e.clientX,sy:e.clientY,lx:e.clientX,ly:e.clientY};
  if(mode==='move'){js.style.bottom='auto';js.style.left=e.clientX+'px';js.style.top=e.clientY+'px';}
});
cv.addEventListener('pointermove',e=>{
  const t=tc[e.pointerId];if(!t)return;
  if(t.mode==='look'){
    const sensMul=scope?(SENS.scope/100):(firing?(SENS.fire/100):(SENS.look/100));
    const k=(scope?0.0022:0.0052)*sensMul,ddx=(e.clientX-t.lx)*k,ddy=(e.clientY-t.ly)*k;
    if(eyeOn){FY=Math.max(-Math.PI,Math.min(Math.PI,FY-ddx*1.4));FP=Math.max(-1.0,Math.min(1.0,FP-ddy*1.4));}
    else{P.yaw-=ddx;P.pitch=Math.max(-1.2,Math.min(1.2,P.pitch-ddy));}
    t.lx=e.clientX;t.ly=e.clientY;
  }else{
    let dx=e.clientX-t.sx,dy=e.clientY-t.sy;const maxR=42;
    const l=Math.hypot(dx,dy);if(l>maxR){dx*=maxR/l;dy*=maxR/l}
    const jigMul=SENS.jiggle/100;
    mv={x:Math.max(-1,Math.min(1,(dx/maxR)*jigMul)),y:Math.max(-1,Math.min(1,(dy/maxR)*jigMul))};
    js.classList.toggle('sprint',Math.hypot(dx,dy)/maxR>0.85);jk.style.transform=`translate(${dx}px,${dy}px)`;
  }
});
const up=e=>{const t=tc[e.pointerId];if(t&&t.mode==='move'){mv={x:0,y:0};resetJoystickPos()}delete tc[e.pointerId];};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);

let eyePtr=null,eyeLx=0,eyeLy=0;
$('ey').addEventListener('pointerdown',e=>{if(edit)return;e.stopPropagation();$('ey').setPointerCapture(e.pointerId);eyeOn=true;eyePtr=e.pointerId;eyeLx=e.clientX;eyeLy=e.clientY;});
$('ey').addEventListener('pointermove',e=>{if(e.pointerId!==eyePtr||!eyeOn)return;const ddx=(e.clientX-eyeLx)*0.007,ddy=(e.clientY-eyeLy)*0.007;FY=Math.max(-Math.PI,Math.min(Math.PI,FY-ddx));FP=Math.max(-1.0,Math.min(1.0,FP-ddy));eyeLx=e.clientX;eyeLy=e.clientY;});
const endEye=e=>{if(e.pointerId===eyePtr){eyeOn=false;eyePtr=null}};$('ey').addEventListener('pointerup',endEye);$('ey').addEventListener('pointercancel',endEye);

const doReload=()=>{if(reload<=0&&P.ammo<30&&P.res>0&&!drive&&P.gun){reload=1.6;snd(420,0.1,0.06,'triangle');msg('Reloading M416…')}};
const togScope=()=>{if(!drive&&phase===0){if(!P.zoom&&!scope)return msg('4x Scope nahi hai! Ghar ya Chhat se uthao');scope=!scope;$('sc').style.display=scope?'block':'none'}};

function setDriveUI(on){$('vc').style.display=on?'block':'none';$('js').style.display=on?'none':'block';if(on){mv={x:0,y:0};resetJoystickPos()}DRV.l=DRV.r=DRV.g=DRV.b=0;}
function bindDrvBtn(id,key){const el=$(id),dn=e=>{e.stopPropagation();e.preventDefault();el.setPointerCapture(e.pointerId);DRV[key]=1;el.classList.add('on')},upB=e=>{e.stopPropagation();DRV[key]=0;el.classList.remove('on')};el.addEventListener('pointerdown',dn);el.addEventListener('pointerup',upB);el.addEventListener('pointercancel',upB);}
bindDrvBtn('dl','l');bindDrvBtn('dr','r');bindDrvBtn('dg','g');bindDrvBtn('dbr','b');

function handleVehicleBtn(e){
  if(e&&e.stopPropagation)e.stopPropagation();if(edit||phase)return;
  if(drive){
    drive=false;J.v=0;J.st=0;setDriveUI(false);
    let ex=J.x+Math.cos(J.a)*3.4,ez=J.z-Math.sin(J.a)*3.4;
    if(hmap(ex,ez)<-0.5){ex=J.x-Math.cos(J.a)*3.4;ez=J.z+Math.sin(J.a)*3.4}
    P.x=ex;P.z=ez;P.y=gnd(P.x,P.z,J.y+2.0,J.y+2.0);col(P,0.48,1.55);P.vy=P.vx=P.vz=0;$('vbl').textContent='Gaadi';msg('UAZ se bahar utar gaye');
  }else if(Math.hypot(P.x-J.x,P.z-J.z)<11){
    drive=true;scope=false;st=0;held=null;P.climb=null;$('sc').style.display='none';setDriveUI(true);$('vbl').textContent='Utro';msg('UAZ Driving: ◀ ▶ se Steer karo, ▲ रेस / ▼ ब्रेक dabao');
  }else{
    let sx=P.x-Math.sin(P.yaw)*7,sz=P.z-Math.cos(P.yaw)*7;if(hmap(sx,sz)<1.5){sx=P.x+3.5;sz=P.z+3.5}
    J.x=sx;J.z=sz;J.v=0;J.st=0;J.a=P.yaw;J.y=Math.max(hmap(J.x,J.z),0)+0.1;jp.position.set(J.x,J.y,J.z);jp.rotation.set(0,J.a,0);msg('UAZ Jeep aa gayi! Ab "Gaadi" dabao');
  }
}

addEventListener('keydown',e=>{const k=e.key.toLowerCase();K[k]=1;if(k==='r')doReload();if(k==='q')togScope();if(k==='e')handleVehicleBtn(e);if(k==='g')use('G');if(k==='t')use('M');if(k==='h')use('h');if(k==='x'&&near)pick(near);if(k==='f'&&held)toss();if(k==='c')st=st===1?0:1;if(k==='z')st=st===2?0:2;});
addEventListener('keyup',e=>K[e.key.toLowerCase()]=0);

$('fb').onpointerdown=()=>{if(edit)return;if(held)toss();else{if(!P.gun&&!phase&&!drive)msg('M416 nahi hai! Ghar ya Chhat se uthao');firing=true}};$('fb').onpointerup=$('fb').onpointercancel=()=>firing=false;
$('jb2').onpointerdown=()=>{if(!edit)jmpReq=true};$('sb').onpointerdown=()=>{if(!edit)togScope()};$('rb').onpointerdown=()=>{if(!edit)doReload()};$('vb').onpointerdown=handleVehicleBtn;
$('nb').onclick=()=>build(seed=(seed*7+13)%9973);$('tb').onclick=e=>{th=(th+1)%3;e.target.textContent='🌲 Theme: '+TH[th].n;build(seed)};$('db').onclick=e=>{night=!night;e.target.textContent=night?'☀ Din Karo':'🌙 Raat Karo'};
$('cb').onclick=e=>{cam3=!cam3;e.target.textContent='🎥 Camera: '+(cam3?'TPP':'FPP')};$('sh').onclick=e=>{sun.castShadow=!sun.castShadow;e.target.textContent='☀ Shadow: '+(sun.castShadow?'On':'Off')};
$('bm').onpointerdown=()=>{if(!edit)use('G')};$('ml').onpointerdown=()=>{if(!edit)use('M')};$('md').onpointerdown=()=>{if(!edit)use('h')};$('pb').onpointerdown=()=>{if(!edit&&near)pick(near)};
$('ib').onpointerdown=()=>{if(edit)return;const el=$('iv');el.style.display=el.style.display==='block'?'none':'block';inv()};$('iv').onclick=e=>{const b=e.target;if(b.dataset.d)drop(b.dataset.d);else if(b.dataset.u)use(b.dataset.u);else if(b.id==='ic')$('iv').style.display='none'};
$('cr').onpointerdown=()=>{if(!edit)st=st===1?0:1};$('pn').onpointerdown=()=>{if(!edit)st=st===2?0:2};$('pl').onpointerdown=()=>{if(!edit)leanT=leanT===-1?0:-1};$('pr').onpointerdown=()=>{if(!edit)leanT=leanT===1?0:1};

$('snb').onclick=()=>{$('bt').style.display='none';syncSensUI();$('sensModal').style.display='block';};$('snc').onclick=()=>$('sensModal').style.display='none';
for(const[ui,k]of[['look','look'],['fire','fire'],['scope','scope'],['gyaw','gyroYaw'],['gpitch','gyroPitch'],['jig','jiggle']]){$('sl_'+ui).oninput=e=>{SENS[k]=Number(e.target.value);$('sv_'+ui).textContent=SENS[k]+'%';saveSens();};}
$('sl_gmode').onchange=e=>{SENS.gmode=e.target.value;saveSens()};
$('sensModal').addEventListener('click',e=>{
  const pr=e.target.dataset&&e.target.dataset.pr;if(!pr)return;
  if(pr==='low')Object.assign(SENS,{look:70,fire:65,scope:45,gyroYaw:95,gyroPitch:85,jiggle:100});
  else if(pr==='med')Object.assign(SENS,{look:100,fire:95,scope:65,gyroYaw:150,gyroPitch:130,jiggle:125});
  else if(pr==='pro')Object.assign(SENS,{look:135,fire:125,scope:85,gyroYaw:260,gyroPitch:220,jiggle:155});
  else if(pr==='rst')Object.assign(SENS,{look:100,fire:95,scope:65,gyroYaw:150,gyroPitch:130,jiggle:125,gmode:'auto'});
  syncSensUI();saveSens();msg('Sensitivity Preset: '+pr.toUpperCase());
});

let gotM=false,la=null,lb=null,lg=null;
function getEffectiveAngle(){
  if(SENS.gmode==='portrait')return 0;if(SENS.gmode==='landscape')return 90;
  const a=(screen.orientation&&screen.orientation.angle!=null)?screen.orientation.angle:(window.orientation||0);
  if(a===0&&(innerWidth>innerHeight*1.15))return 90;return a;
}
addEventListener('deviceorientation',e=>{
  if(e.alpha==null&&e.beta==null&&e.gamma==null)return;if(!gyro||P.dead||gotM){la=null;return}
  const a=e.alpha||0,b=e.beta||0,g=e.gamma||0;
  if(la!==null){
    const scMul=scope?(SENS.scope/100):1,yawK=0.01745*1.25*(SENS.gyroYaw/100)*scMul,pitchK=0.01745*1.15*(SENS.gyroPitch/100)*scMul;
    let da=((a-la+540)%360)-180,db=b-lb,dg=g-lg;if(Math.abs(da)>45)da=0;if(Math.abs(db)>40)db=0;if(Math.abs(dg)>40)dg=0;
    const ang=getEffectiveAngle();let dyaw=0,dpitch=0;
    if(ang===90){dyaw=da*0.85-db*0.85;dpitch=-dg;}
    else if(ang===-90||ang===270){dyaw=da*0.85+db*0.85;dpitch=dg;}
    else{dyaw=da*0.85-dg*0.95;dpitch=-db;}
    P.yaw+=dyaw*yawK;P.pitch=Math.max(-1.2,Math.min(1.2,P.pitch+dpitch*pitchK));
  }
  la=a;lb=b;lg=g;
});
addEventListener('devicemotion',e=>{
  const r=e.rotationRate;if(!r||(r.alpha==null&&r.beta==null&&r.gamma==null))return;
  const ra=r.alpha||0,rb=r.beta||0,rg=r.gamma||0;if(Math.abs(ra)+Math.abs(rb)+Math.abs(rg)>0.02)gotM=true;
  if(!gyro||P.dead)return;
  const n=performance.now(),dt=Math.min((n-gl)/1000,0.1);gl=n;if(!dt)return;
  const scMul=scope?(SENS.scope/100):1,yawK=0.01745*1.45*(SENS.gyroYaw/100)*scMul*dt,pitchK=0.01745*1.25*(SENS.gyroPitch/100)*scMul*dt,ang=getEffectiveAngle();
  let yawRate=0,pitchRate=0;
  if(ang===90){yawRate=-(rb*0.95+ra*0.75);pitchRate=rg;}
  else if(ang===-90||ang===270){yawRate=(rb*0.95-ra*0.75);pitchRate=-rg;}
  else{yawRate=(rg*0.95-ra*0.85);pitchRate=rb;}
  P.yaw+=yawRate*yawK;P.pitch=Math.max(-1.2,Math.min(1.2,P.pitch-pitchRate*pitchK));
});
$('gy').onclick=async e=>{
  if(!gyro){
    try{
      if(window.DeviceMotionEvent&&typeof DeviceMotionEvent.requestPermission==='function'){const p1=await DeviceMotionEvent.requestPermission();if(p1!=='granted')return msg('Gyro permission nahi mili');}
      if(window.DeviceOrientationEvent&&typeof DeviceOrientationEvent.requestPermission==='function'){await DeviceOrientationEvent.requestPermission();}
    }catch(x){}
    gyro=true;la=lb=lg=null;gl=performance.now();e.target.textContent='📱 Gyro: On';msg('Gyroscope ON — Phone tilt karke aim karo');
  }else{gyro=false;e.target.textContent='📱 Gyro: Off';msg('Gyroscope OFF');}
};

const LAY_KEY='tapu_bgmi_lay_v3';const RB=[...document.querySelectorAll('.rb,.dbtn')];let drag=null,selB=null;
