// Talwar (melee) - SIRF main player ke liye. Dushman talwar nahi chalate.
// Talwar button dabao: bandook -> talwar 1 -> talwar 2 ... -> wapas bandook. FIRE = vaar.
P.sw=-1;
const SW={protos:[],names:[],fp:null,tp:null,t:0,hit:false,DUR:0.45,REACH:3.1,DMG:60};
const swEase=x=>x*x*(3-2*x);
function makeSwordObj(proto,scale){
  const G=proto.clone(true),box=new THREE.Box3().setFromObject(G),c=box.getCenter(new THREE.Vector3());
  G.position.set(-c.x,-(box.max.y-1.5),-c.z);            // mooth (grip) origin par
  const W=new THREE.Group();W.rotation.z=Math.PI;W.add(G); // model ulta bana tha: nok neeche -> nok upar
  const H=new THREE.Group();H.add(W);H.scale.setScalar(scale);
  H.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false}});
  return H;
}
function setSword(i){
  if(SW.fp){cam.remove(SW.fp);SW.fp=null}
  if(SW.tp){pl.el2.remove(SW.tp);SW.tp=null}
  P.sw=i;if(i<0)return;
  SW.fp=makeSwordObj(SW.protos[i],0.075);cam.add(SW.fp);
  SW.tp=makeSwordObj(SW.protos[i],0.085);SW.tp.position.set(0,-0.34,0);SW.tp.rotation.x=Math.PI+0.3;pl.el2.add(SW.tp);
}
function cycleSword(){
  if(!SW.protos.length){msg(SW.err||'Talwar load ho rahi hai...');return}
  if(drive||phase)return;
  const n=P.sw+1>=SW.protos.length?-1:P.sw+1;
  setSword(n);scope=false;$('sc').style.display='none';
  msg(n<0?'Talwar hata di (bandook)':'Talwar: '+SW.names[n]+'  - FIRE se vaar');
}
function startSlash(){
  if(SW.t>0)return;
  SW.t=SW.DUR;SW.hit=false;snd(520,0.12,0.04,'triangle');
}
function slashDamage(){
  const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);let any=false;
  for(const e of[...EN]){
    const dx=e.x-P.x,dz=e.z-P.z,d=Math.hypot(dx,dz);
    if(d>SW.REACH||Math.abs(e.y-P.y)>2.2)continue;
    if(d>0.6&&(dx*fx+dz*fz)/d<0.3)continue;        // saamne ~70 degree ke andar
    if(!hasLOS(e))continue;                         // deewar ke aar-paar nahi
    e.hp-=SW.DMG;e.see=true;e.lt=1.2;any=true;
    if(e.hp<=0)kill(e);
  }
  if(any){shake=Math.max(shake,0.5);snd(180,0.1,0.07,'sawtooth');const h=$('hm');h.style.color='#ff1744';h.style.opacity=1;setTimeout(()=>h.style.opacity=0,120)}
}
function meleeUpdate(dt,fpp){
  const on=P.sw>=0&&!drive&&!phase&&!P.dead;
  if(P.sw>=0&&scope){scope=false;$('sc').style.display='none'}
  if(SW.fp)SW.fp.visible=on&&fpp;
  if(SW.tp)SW.tp.visible=on&&!fpp;
  if(SW.t>0){
    SW.t=Math.max(0,SW.t-dt);const s=1-SW.t/SW.DUR;
    if(!SW.hit&&s>=0.35){SW.hit=true;slashDamage()}
  }
  if(SW.fp&&on&&fpp){      // pehle-person ka vaar
    const s=SW.t>0?1-SW.t/SW.DUR:0,w=s<0.7?swEase(s/0.7):1-swEase((s-0.7)/0.3),f=SW.fp;
    f.position.set(0.28-0.38*w,-0.62+0.1*w,-0.7-0.25*Math.sin(w*Math.PI));
    f.rotation.set(-0.5-0.8*Math.sin(w*Math.PI),0.2*w,-0.3+1.9*w);
  }
}
function meleePose(stride,spr){   // teesre-person: haath me talwar
  const bob=Math.sin(P.wph)*0.12*stride;
  let a2x=0.9+bob,a2y=-0.15,el2x=0.9,tw=0;
  if(SW.t>0){
    const s=1-SW.t/SW.DUR,w=s<0.7?swEase(s/0.7):1-swEase((s-0.7)/0.3);
    a2x=2.3-2.0*w;a2y=-0.5+0.7*w;el2x=0.4+0.8*w;tw=0.6*Math.sin(w*Math.PI);
  }
  pl.a2.rotation.set(a2x,a2y,-0.1);pl.el2.rotation.set(el2x,0,0);
  pl.a1.rotation.set(0.5-bob,0.5,0.4);pl.el1.rotation.set(0.9,0,0);
  pl.torso.rotation.y=tw*-1;
}
addEventListener('keydown',e=>{if(e.key==='f'||e.key==='F')cycleSword()});
$('sw').onpointerdown=()=>{if(!edit)cycleSword()};
(function loadSwords(){
  if(!THREE.GLTFLoader){SW.err='Talwar: GLTFLoader nahi mila (index.html update karo)';return}
  new THREE.GLTFLoader().load('swords.glb',g=>{
    g.scene.traverse(o=>{if(/_mesh$/.test(o.name)&&o.children.some(c=>c.isMesh)){SW.protos.push(o);SW.names.push(o.name.replace(/_mesh$/,'').replace(/_/g,' '))}});
    if(!SW.protos.length)SW.err='Talwar file me talwarein nahi mili';
  },undefined,()=>{SW.err='Talwar file nahi mili: swords.glb (repo me upload karo)'});
})();
