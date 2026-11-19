// Loot, drop/parachute, climbing
const LMC={};
function lootMesh(t){
  const g=new THREE.Group();
  const M=(c,o)=>{const k=c+JSON.stringify(o||{});return LMC[k]||(LMC[k]=new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:0.6,metalness:0.3},o||{})))};
  const B=(w,h,d,c,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),M(c));m.position.set(x,y,z);g.add(m);return m};
  const C=(a,b,h,c,x,y,z,s)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(a,b,h,s||12),M(c));m.position.set(x,y,z);g.add(m);return m};
  const isS=t.length>1&&t.charAt(0)==='S';
  if(isS){const i=+t.slice(1),so=swordObj(i,0.75,false),L=swordParts(i).top*0.75;so.rotation.z=Math.PI/2;so.position.set(L/2-0.1,0.16,0);g.add(so)}
  else if(t==='h'){B(.6,.4,.32,0xf5f5f5,0,0,0);B(.36,.1,.33,0xe53935,0,0,0);B(.1,.36,.33,0xe53935,0,0,0)}
  else if(t==='a'){B(.55,.32,.35,0x3d4b26,0,0,0);for(let i=0;i<4;i++)C(.045,.045,.2,0xd4a017,-.2+i*.13,.26,0)}
  else if(t==='H'){g.add(new THREE.Mesh(new THREE.SphereGeometry(.34,14,10,0,6.3,0,1.65),M(0x2c3e50,{metalness:0.5})));B(.34,.12,.08,0x111111,0,.08,-.32)}
  else if(t==='B'){B(.5,.6,.28,0x3d4935,0,0,0);B(.4,.25,.12,0x263020,0,-.12,.2);B(.07,.55,.05,0x111111,-.18,0,.16);B(.07,.55,.05,0x111111,.18,0,.16)}
  else if(t==='G'){const s=new THREE.Mesh(new THREE.SphereGeometry(.2,12,10),M(0x3b4a2a));s.scale.y=1.25;g.add(s);C(.07,.07,.1,0x999999,0,.28,0);B(.04,.04,.3,0xcccccc,.08,.28,0)}
  else if(t==='M'){C(.12,.12,.4,0x2e7d32,0,0,0).material=M(0x2e7d32,{transparent:true,opacity:.75});C(.04,.05,.18,0x2e7d32,0,.28,0);const f=new THREE.Mesh(new THREE.ConeGeometry(.07,.2,8),new THREE.MeshBasicMaterial({color:0xff6f00}));f.position.y=.5;g.add(f)}
  else if(t==='W'){B(.1,.14,1,0x1f2226,0,0,0);B(.1,.2,.3,0x7c6a52,0,-.04,.6);B(.08,.25,.1,0x7c6a52,0,-.2,-.05);C(.024,.024,.52,0x111111,0,.02,-.7).rotation.x=Math.PI/2}
  else{C(.06,.06,.5,0x1a1d20,0,0,0).rotation.z=Math.PI/2;C(.095,.095,.1,0x37474f,.25,0,0).rotation.z=Math.PI/2;C(.095,.095,.1,0x37474f,-.25,0,0).rotation.z=Math.PI/2}
  const ring=new THREE.Mesh(new THREE.RingGeometry(isS?.55:.32,isS?.68:.42,24),new THREE.MeshBasicMaterial({color:isS?0x4dd0e1:0xffca28,side:THREE.DoubleSide,transparent:true,opacity:0.65}));
  ring.rotation.x=-Math.PI/2;ring.position.y=-0.25;g.add(ring);g.scale.setScalar(1.55);return g;
}
let LID=0;
function addLoot(x,y,z,t,id){const m=lootMesh(t);m.position.set(x,y,z);grp.add(m);const o={m,t,id:id!==undefined?id:LID++};LT.push(o);return o}

const PLM=new THREE.Group(),props=[];
{
  const bodyM=new THREE.MeshStandardMaterial({color:0x52604e,map:TEX.camo,bumpMap:TEX.camo,bumpScale:0.02,roughness:0.7,metalness:0.3});
  const wingM=new THREE.MeshStandardMaterial({color:0x3f4a3c,roughness:0.8,metalness:0.2});
  const pb=(x,y,z,a,b,c,mt)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(a,b,c),mt||bodyM);m.position.set(x,y,z);PLM.add(m)};
  pb(0,0,0,3.4,3.4,19);pb(0,-0.4,-10.5,2.4,2.2,2.5,wingM);pb(0,0,1,28,0.45,4.2,wingM);pb(0,2.2,8.5,0.45,4.2,3.2,wingM);pb(0,0.6,8.5,9,0.35,2.4,wingM);
  for(const px of[-8.5,-4.2,4.2,8.5]){
    pb(px,-0.1,-1.2,0.8,0.8,1.6,wingM);
    const pr=new THREE.Mesh(new THREE.BoxGeometry(2.3,0.16,0.08),new THREE.MeshStandardMaterial({color:0x111111,roughness:0.8}));
    pr.position.set(px,-0.1,-2.1);PLM.add(pr);props.push(pr);
  }
}
PLM.scale.setScalar(1.45);PLM.rotation.y=-Math.PI/2;scene.add(PLM);

const CH=new THREE.Group();
{
  const d=new THREE.Mesh(new THREE.SphereGeometry(3.6,20,10,0,6.3,0,1.35),new THREE.MeshStandardMaterial({color:0xf57c00,side:THREE.DoubleSide,map:TEX.camo,roughness:0.9}));
  d.position.y=4.3;CH.add(d);
  for(let i=0;i<6;i++){const a=i*(Math.PI/3)+0.4;CH.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(Math.cos(a)*3.3,4.3,Math.sin(a)*3.3),new THREE.Vector3(0,1.6,0)]),new THREE.LineBasicMaterial({color:0xeceff1})));}
}
CH.visible=false;scene.add(CH);

function startDrop(){
  PL.x=-S*0.42;PL.z=sp0.z||0;PL.y=210;
  P.x=PL.x;P.z=PL.z;P.y=PL.y;P.vy=0;P.vx=0;P.vz=0;P.climb=null;
  P.yaw=-Math.PI/2;P.pitch=-0.32;AV.x=AV.z=0;phase=1;scope=false;$('sc').style.display='none';
  setDriveUI(false);msg('C-130 Plane me ho! "Kudo" dabao aur Chhat/Ghar par utro');
}

function air(dt,fx,fy){
  const sn=Math.sin(P.yaw),cs=Math.cos(P.yaw);
  if(phase===1){
    PL.x+=45*dt;if(PL.x>S*0.48)PL.x=-S*0.48;P.x=PL.x;P.z=PL.z;P.y=PL.y;P.vy=0;
    if(jmpReq){jmpReq=false;phase=2;AV.x=36;AV.z=0;msg('Freefall! Joystick se disha badlo, Kudo = Parachute')}
    return;
  }
  if(jmpReq){jmpReq=false;if(phase===2){phase=3;msg('Parachute khul gaya!')}}
  const ch=phase===3,sp=ch?15:30,tx=(fx*cs+fy*sn)*sp,tz=(-fx*sn+fy*cs)*sp,k=Math.min(1,dt*(ch?1.8:0.9));
  AV.x+=(tx-AV.x)*k;AV.z+=(tz-AV.z)*k;
  const prevY=P.y;
  P.x=Math.max(-S*0.48,Math.min(S*0.48,P.x+AV.x*dt));P.z=Math.max(-S*0.48,Math.min(S*0.48,P.z+AV.z*dt));
  col(P,0.5);
  P.vy+=((ch?-7.2:(fy<0?-56:-46))-P.vy)*Math.min(1,dt*(ch?3:1.5));P.y+=P.vy*dt;
  const g=gnd(P.x,P.z,P.y,prevY);
  if(phase===2&&P.y-g<75){phase=3;msg('Parachute auto-deploy!')}
  if(P.y<=g){P.y=g;P.vy=0;phase=0;msg('Safe Landing! Ghar ya Chhat se M416 aur Scope uthao');}
}

function findClimbTarget(){
  if(phase||drive||P.dead||P.climb)return null;
  const sn=Math.sin(P.yaw),cs=Math.cos(P.yaw),fx=-sn,fz=-cs;
  let best=null,bestScore=999;
  for(const f of FL){
    const[a,b,c,e,topY,isWin]=f,dy=topY-P.y,maxH=isWin?1.55:2.85;
    if(dy<0.45||dy>maxH)continue;
    const probeX=P.x+fx*0.75,probeZ=P.z+fz*0.75,cx=Math.max(a+0.15,Math.min(probeX,c-0.15)),cz=Math.max(b+0.15,Math.min(probeZ,e-0.15));
    const dx=cx-P.x,dz=cz-P.z,dist=Math.hypot(dx,dz);
    if(dist>1.55)continue;
    const dot=(dx*fx+dz*fz)/(dist||1);if(dot<0.42)continue;
    let tx=cx+fx*(isWin?1.05:0.45),tz=cz+fz*(isWin?1.05:0.45),ty=topY;
    if(isWin){ty=gnd(tx,tz,topY,topY)}
    let blocked=false;const checkY=isWin?(topY+0.15):ty;
    for(const[ba,bb,bc,be,bMin,bMax]of BX){
      if(checkY+1.25<=bMin+0.05||checkY+0.25>=bMax-0.05)continue;
      if(tx>ba-0.22&&tx<bc+0.22&&tz>bb-0.22&&tz<be+0.22){blocked=true;break}
    }
    if(blocked)continue;
    const score=dist+Math.abs(dy-1.2)*0.25-(isWin?0.35:0);
    if(score<bestScore){bestScore=score;best={tx,ty,tz,sillY:topY,isWin:!!isWin};}
  }
  return best;
}
