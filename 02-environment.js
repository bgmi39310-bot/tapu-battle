// Lighting, procedural textures, water, sensitivity settings
// 3. Cinematic Daylight, Sun & Soft Shadows
const hemi=new THREE.HemisphereLight(0xffffff,0x557744,1.1);
scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff4d8,1.2);
sun.position.set(85,140,45);
sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);
const sc2=sun.shadow.camera;
sc2.left=sc2.bottom=-85;sc2.right=sc2.top=85;sc2.near=1;sc2.far=420;
sun.shadow.bias=-0.0005;
scene.add(sun);
scene.add(sun.target);

// 4. Procedural Canvas Textures for PBR (Acts as both Color Map AND Bump Map for 3D depth)
function mkTex(sz,fn,repX=1,repY=1){
  const c=document.createElement('canvas');c.width=c.height=sz;
  fn(c.getContext('2d'),sz);
  const t=new THREE.CanvasTexture(c);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.repeat.set(repX,repY);
  return t;
}
const TEX={
  ground:mkTex(128,(x,s)=>{
    x.fillStyle='#d8ded6';x.fillRect(0,0,s,s);
    for(let i=0;i<900;i++){
      x.fillStyle=i%2?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.12)';
      x.fillRect(Math.random()*s,Math.random()*s,2,2);
    }
  },48,48),
  wall:mkTex(128,(x,s)=>{
    x.fillStyle='#e8e2d5';x.fillRect(0,0,s,s);
    for(let i=0;i<500;i++){
      x.fillStyle=i%2?'rgba(0,0,0,0.06)':'rgba(255,255,255,0.08)';
      x.fillRect(Math.random()*s,Math.random()*s,3,3);
    }
    x.fillStyle='rgba(0,0,0,0.08)';
    for(let y=0;y<s;y+=16)x.fillRect(0,y,s,1);
  },2,2),
  roof:mkTex(128,(x,s)=>{
    x.fillStyle='#8c8881';x.fillRect(0,0,s,s);
    for(let y=0;y<s;y+=16){
      x.fillStyle='rgba(0,0,0,0.16)';x.fillRect(0,y,s,2);
      for(let k=0;k<s;k+=16)x.fillRect(k,y,2,16);
    }
  },3,3),
  wood:mkTex(128,(x,s)=>{
    x.fillStyle='#7c5836';x.fillRect(0,0,s,s);
    x.fillStyle='rgba(0,0,0,0.16)';
    for(let y=0;y<s;y+=16){
      x.fillRect(0,y,s,2);
      for(let i=0;i<15;i++)x.fillRect(Math.random()*s,y+Math.random()*14,18,1);
    }
  },1,1),
  crate:mkTex(128,(x,s)=>{
    x.fillStyle='#5c6b47';x.fillRect(0,0,s,s);
    x.strokeStyle='#38422b';x.lineWidth=8;x.strokeRect(4,4,s-8,s-8);
    x.beginPath();x.moveTo(8,8);x.lineTo(s-8,s-8);x.moveTo(s-8,8);x.lineTo(8,s-8);x.stroke();
  },1,1),
  camo:mkTex(128,(x,s)=>{
    x.fillStyle='#4a5d3f';x.fillRect(0,0,s,s);
    const cols=['#2f3e28','#6e6547','#252b22','#7d8468'];
    for(let i=0;i<55;i++){
      x.fillStyle=cols[i%4];
      x.beginPath();x.arc(Math.random()*s,Math.random()*s,6+Math.random()*12,0,7);x.fill();
    }
  },1,1),
  water:mkTex(128,(x,s)=>{
    x.fillStyle='#1b7fa8';x.fillRect(0,0,s,s);
    for(let i=0;i<280;i++){
      x.fillStyle='rgba(255,255,255,'+(0.08+Math.random()*0.16)+')';
      x.fillRect(Math.random()*s,Math.random()*s,4+Math.random()*14,1.5);
    }
  },260,260)
};

// 5. Ocean Water & Environment 
const water=new THREE.Mesh(
  new THREE.PlaneGeometry(3000,3000),
  new THREE.MeshStandardMaterial({map:TEX.water, bumpMap:TEX.water, bumpScale:0.04, transparent:true, opacity:0.88, roughness:0.15, metalness:0.85})
);
water.rotation.x=-Math.PI/2;
scene.add(water);

const sunM=new THREE.Mesh(new THREE.SphereGeometry(28,14,10),new THREE.MeshBasicMaterial({color:0xfff3b0,fog:false}));
scene.add(sunM);

const CL=[];
for(let i=0;i<16;i++){
  const g=new THREE.Group(),a=Math.random()*6.28,d=240+Math.random()*420;
  for(let k=0;k<5;k++){
    const b=new THREE.Mesh(new THREE.SphereGeometry(20+Math.random()*14,8,6),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.85,fog:false}));
    b.scale.y=0.4;b.position.set(k*22-44,Math.random()*6,Math.random()*16);g.add(b);
  }
  g.position.set(Math.cos(a)*d,165+Math.random()*55,Math.sin(a)*d);
  scene.add(g);CL.push(g);
}

const stG=new THREE.BufferGeometry(),stp=[];
for(let i=0;i<360;i++){
  const u=Math.random()*6.28,v=Math.random()*1.4+0.1;
  stp.push(Math.cos(u)*Math.cos(v)*850,Math.sin(v)*850,Math.sin(u)*Math.cos(v)*850);
}
stG.setAttribute('position',new THREE.Float32BufferAttribute(stp,3));
const stars=new THREE.Points(stG,new THREE.PointsMaterial({color:0xffffff,size:3,transparent:true,opacity:0,fog:false,depthWrite:false}));
scene.add(stars);

// 6. Sensitivity Settings
const SENS_KEY='tapu_bgmi_sens_v1';
const SENS={look:100,fire:95,scope:65,gyroYaw:150,gyroPitch:130,jiggle:125,gmode:'auto'};
function syncSensUI(){
  const map=[['look','look'],['fire','fire'],['scope','scope'],['gyaw','gyroYaw'],['gpitch','gyroPitch'],['jig','jiggle']];
  for(const[ui,k]of map){
    if($('sl_'+ui))$('sl_'+ui).value=SENS[k];
    if($('sv_'+ui))$('sv_'+ui).textContent=SENS[k]+'%';
  }
  if($('sl_gmode'))$('sl_gmode').value=SENS.gmode;
}
function loadSens(){try{const s=JSON.parse(localStorage.getItem(SENS_KEY)||'null');if(s)Object.assign(SENS,s);}catch(e){}syncSensUI();}
function saveSens(){try{localStorage.setItem(SENS_KEY,JSON.stringify(SENS))}catch(e){}}
