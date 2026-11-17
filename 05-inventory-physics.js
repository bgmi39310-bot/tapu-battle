// Inventory, grenades/explosions, ground height, ray helpers
function cap(t){return t==='a'?(P.bag?240:90):(P.bag?6:2)}
function inv(){
  const el=$('iv');if(el.style.display!=='block')return;
  const rw=(t,n,u)=>'<div><b>'+LN[t]+'</b> '+n+'<span>'+(u?'<button data-u="'+t+'">'+u+'</button>':'')+'<button data-d="'+t+'">Girao</button></span></div>';
  el.innerHTML=rw('h',P.inv.h+'/'+cap('h'),'Use')+rw('G',P.inv.G+'/'+cap('G'),'Phenko')+rw('M',P.inv.M+'/'+cap('M'),'Phenko')+rw('a',P.res+'/'+cap('a'))+rw('W',P.gun?'Equipped':'-')+rw('Z',P.zoom?'Equipped':'-')+rw('H',P.helm?'Equipped':'-')+rw('B',P.bag?'Equipped':'-')+'<div style="border:0;justify-content:center"><button id="ic">Band Karo</button></div>';
}
function pick(l){
  const t=l.t;
  if(t==='W'){if(P.gun)return msg('M416 pehle se hai');P.gun=true}
  else if(t==='Z'){if(P.zoom)return msg('4x Scope pehle se hai');P.zoom=true}
  else if(t==='H'){if(P.helm)return msg('Helmet Lv.3 pehle se hai');P.helm=true}
  else if(t==='B'){if(P.bag)return msg('Backpack pehle se hai');P.bag=true}
  else if(t==='a'){if(P.res>=cap('a'))return msg('Ammo bag full');P.res=Math.min(cap('a'),P.res+30)}
  else{if(P.inv[t]>=cap(t))return msg('Bag full');P.inv[t]++}
  snd(620,0.08,0.06,'sine');grp.remove(l.m);LT.splice(LT.indexOf(l),1);msg(LN[t]+' uthaya');inv();
}
function drop(t){
  if(t==='W'){if(!P.gun)return;P.gun=false}
  else if(t==='Z'){if(!P.zoom)return;P.zoom=false;scope=false;$('sc').style.display='none'}
  else if(t==='H'){if(!P.helm)return;P.helm=false}
  else if(t==='B'){if(!P.bag)return;P.bag=false;for(const k of['h','G','M'])P.inv[k]=Math.min(P.inv[k],2);P.res=Math.min(P.res,90)}
  else if(t==='a'){if(P.res<30)return;P.res-=30}
  else{if(!P.inv[t])return;P.inv[t]--}
  addLoot(P.x-Math.sin(P.yaw)*1.8,P.y+0.5,P.z-Math.cos(P.yaw)*1.8,t);inv();
}
function use(t){
  if(P.dead)return;
  if(t==='h'){if(P.inv.h&&P.hp<100){P.inv.h--;P.hp=Math.min(100,P.hp+35);snd(520,0.15,0.08,'sine');msg('Medkit used +35 HP')}}
  else if(P.inv[t]){held=held===t?null:t;if(held)msg('FIRE dabao to phenko')}
  inv();
}
function toss(){
  const t=held;if(!t||!P.inv[t]||P.dead){held=null;return}
  P.inv[t]--;held=null;const d=new THREE.Vector3();cam.getWorldDirection(d);
  const m=lootMesh(t);m.position.set(P.x,P.y+1.6,P.z);scene.add(m);
  PJ.push({m,t,life:t==='G'?3.4:8,v:d.multiplyScalar(38).add(new THREE.Vector3(0,9,0))});inv();
}
function boom(p){
  const x=p.m.position.x,z=p.m.position.z,y=p.m.position.y;
  if(p.t==='G'){
    const m=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),new THREE.MeshBasicMaterial({color:0xff8f00,transparent:true,opacity:0.88}));
    m.position.set(x,y,z);scene.add(m);FX.push({m,t:0.45});snd(65,0.6,0.35,'sawtooth');
    for(const e of[...EN]){const d=Math.hypot(e.x-x,e.z-z);if(d<14){e.hp-=(1-d/14)*240+30;if(e.hp<=0)kill(e)}}
    const d=Math.hypot(P.x-x,P.z-z);if(d<14)hurt((1-d/14)*130+10);if(d<60)shake=Math.max(shake,1.3-d/60);
  }else{
    const m=new THREE.Mesh(new THREE.CircleGeometry(5.5,20),new THREE.MeshBasicMaterial({color:0xff3d00,transparent:true,opacity:0.65}));
    m.rotation.x=-Math.PI/2;m.position.set(x,y+0.12,z);scene.add(m);FZ.push({x,z,y,t:7,acc:0,m});snd(140,0.4,0.15,'triangle');
  }
}

function gnd(x,z,y,prevY){
  const topCheck=Math.max(y,prevY!==undefined?prevY:y)+1.55;
  let b=hmap(x,z);b=b<-1.2?-0.6:Math.max(b,-1.2);
  for(const f of FL){
    if(f[5])continue;
    if(x>=f[0]&&x<=f[2]&&z>=f[1]&&z<=f[3]&&f[4]<=topCheck&&f[4]>b)b=f[4];
  }
  for(const r of RP){
    if(x>=r[0]&&x<=r[2]&&z>=r[1]&&z<=r[3]){
      const t=Math.max(0,Math.min(1,(r[3]-z)/(r[3]-r[1])));
      const h=r[4]+(r[5]-r[4])*t;
      if(h<=topCheck&&h>b)b=h;
    }
  }
  return b;
}
function obsT(o,d,mx,soft){
  let bt=mx;const a=d.x*d.x+d.z*d.z;if(a<1e-6)return bt;
  for(const[cx,cz,r,hh,sf]of OB){
    if(sf&&!soft)continue;
    const ox=o.x-cx,oz=o.z-cz,b=2*(d.x*ox+d.z*oz),c=ox*ox+oz*oz-r*r,ds=b*b-4*a*c;if(ds<0)continue;
    const t=(-b-Math.sqrt(ds))/(2*a);if(t<0||t>=bt)continue;
    const y=o.y+d.y*t,gy=hmap(cx,cz);if(y<gy+(hh||3)&&y>gy-1)bt=t;
  }
  return bt;
}

const trL=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xffca28}));
trL.geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(303),3));trL.frustumCulled=false;trL.visible=false;scene.add(trL);
const trM=new THREE.Mesh(new THREE.RingGeometry(0.9,1,40),new THREE.MeshBasicMaterial({color:0xff5722,side:THREE.DoubleSide,transparent:true,opacity:0.85,depthWrite:false}));
trM.rotation.x=-Math.PI/2;trM.visible=false;scene.add(trM);

function prev(){
  const on=held&&!P.dead&&!drive;trL.visible=trM.visible=!!on;
  if(!on){
    $('td').style.display=phase?'block':'none';
    if(phase)$('td').textContent=['','C-130 Plane: "Kudo" dabao!','Freefall: '+Math.max(0,P.y-Math.max(hmap(P.x,P.z),0)).toFixed(0)+'m — Kudo = Parachute','Parachute: '+Math.max(0,P.y-Math.max(hmap(P.x,P.z),0)).toFixed(0)+'m'][phase];
    return;
  }
  const d=new THREE.Vector3();cam.getWorldDirection(d);
  const v=d.multiplyScalar(38).add(new THREE.Vector3(0,9,0)),p=new THREE.Vector3(P.x,P.y+1.6,P.z),a=trL.geometry.attributes.position;
  let n=0,t=0;
  for(;n<100;n++){
    a.setXYZ(n,p.x,p.y,p.z);v.y-=0.8;p.addScaledVector(v,0.04);t+=0.04;let h=false;
    for(const b of BX)if(p.x>b[0]&&p.x<b[2]&&p.z>b[1]&&p.z<b[3]&&p.y<hmap(p.x,p.z)+3.6){h=true;break}
    if(!h)for(const[cx,cz,r,hh]of OB)if(Math.hypot(p.x-cx,p.z-cz)<r+0.3&&p.y<hmap(cx,cz)+(hh||3)){h=true;break}
    if(h||p.y<gnd(p.x,p.z,p.y,p.y)+0.25||(held==='G'&&t>3.4))break;
  }
  for(let k=n;k<101;k++)a.setXYZ(k,p.x,p.y,p.z);a.needsUpdate=true;trL.geometry.setDrawRange(0,n+1);
  trM.position.set(p.x,Math.max(gnd(p.x,p.z,p.y,p.y),0)+0.15,p.z);trM.scale.setScalar(held==='G'?14:5.5);
  $('td').style.display='block';$('td').textContent=(held==='G'?'Frag Grenade':'Molotov')+': '+Math.hypot(p.x-P.x,p.z-P.z).toFixed(0)+'m';
}
