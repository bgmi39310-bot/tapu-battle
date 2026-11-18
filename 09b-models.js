// 3D model (.glb) loader. Agar file na mile ya load fail ho to purane procedural characters chalte rahenge.
// Naya model lagana ho: MODEL_FILES me naam badlo.
const MODEL_FILES={enemy:'woman.glb'};   // <- apni .glb file ka naam yahan
// height = game me kitne meter ka dikhe | yaw = peeche mooh ho to Math.PI <-> 0 | footY = skinned model me paon ki height (fallback)
const MODEL_CFG={enemy:{height:2.05,yaw:Math.PI,anim:false,footY:-1.83}};
const MODELS={},MODEL_MATS=[];
// Skeleton lagne ke baad model ka ASLI neeche/upar (paon/sar) naapo
function fitModel(m,cfg){
  if(m.fit)return m.fit;
  let lo=Infinity,hi=-Infinity;
  try{
    m.scene.updateMatrixWorld(true);const v=new THREE.Vector3();
    m.scene.traverse(o=>{if(o.isSkinnedMesh&&o.boneTransform){o.skeleton.update();const p=o.geometry.attributes.position;
      for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);o.boneTransform(i,v);v.applyMatrix4(o.matrixWorld);lo=Math.min(lo,v.y);hi=Math.max(hi,v.y)}}});
  }catch(err){lo=Infinity}
  if(!isFinite(lo)||hi-lo<0.5){const b=new THREE.Box3().setFromObject(m.scene);lo=cfg.footY!=null?cfg.footY:b.min.y;hi=lo+(b.max.y-b.min.y)}
  return m.fit={lo,hi};
}
const _q=new THREE.Quaternion(),_p=new THREE.Vector3(),_w=new THREE.Vector3(),_c=new THREE.Vector3();
function aimBone(b,t){
  b.updateMatrixWorld(true);b.getWorldPosition(_p);b.getWorldQuaternion(_q);
  _c.set(0,1,0).applyQuaternion(_q);_w.copy(t).sub(_p).normalize();
  const d=new THREE.Quaternion().setFromUnitVectors(_c,_w).multiply(_q),pq=b.parent.getWorldQuaternion(new THREE.Quaternion());
  b.quaternion.copy(pq.invert().multiply(d));b.updateMatrixWorld(true);
}
function arm2(A,F,H,T,pole){   // 2-bone IK: kandha A, kohni F, kalai H -> target T
  const S=A.getWorldPosition(new THREE.Vector3()),Ep=F.getWorldPosition(new THREE.Vector3()),Hp=H.getWorldPosition(new THREE.Vector3());
  const L1=S.distanceTo(Ep),L2=Ep.distanceTo(Hp),d=T.clone().sub(S);let dist=d.length();d.normalize();
  dist=Math.max(Math.abs(L1-L2)+0.01,Math.min(dist,L1+L2-0.005));
  const a=(L1*L1-L2*L2+dist*dist)/(2*dist),h=Math.sqrt(Math.max(0,L1*L1-a*a));
  const pc=pole.clone().sub(d.clone().multiplyScalar(pole.dot(d))).normalize();
  const E=S.clone().addScaledVector(d,a).addScaledVector(pc,h),Tt=S.clone().addScaledVector(d,dist);
  aimBone(A,E);aimBone(F,Tt);aimBone(H,Tt.clone().add(Tt.clone().sub(E).normalize()));
}
function holdGun(g,gun,B,sc){
  g.updateMatrixWorld(true);
  const gp=(x,y,z)=>gun.localToWorld(new THREE.Vector3(x,y,z)),dn=new THREE.Vector3(0,-1,0).applyQuaternion(g.getWorldQuaternion(new THREE.Quaternion())),
        rt=new THREE.Vector3(1,0,0).applyQuaternion(g.getWorldQuaternion(new THREE.Quaternion()));
  arm2(B.ar,B.fr,B.hr,gp(0,-0.1,0.2),dn.clone().addScaledVector(rt,0.5));
  arm2(B.al,B.fl,B.hl,gp(0,-0.03,-0.35),dn.clone().addScaledVector(rt,-0.5));
}
function applyEnemyModel(e){
  const m=MODELS.enemy;if(!m||e.glb)return;
  const cfg=MODEL_CFG.enemy,c=e.c,root=THREE.SkeletonUtils.clone(m.scene),fit=fitModel(m,cfg),k=cfg.height/(fit.hi-fit.lo);
  const pivot=new THREE.Group();pivot.rotation.y=cfg.yaw;
  root.scale.setScalar(k);root.position.y=-fit.lo*k;pivot.add(root);
  c.g.children.slice().forEach(ch=>ch.visible=false);   // purana procedural body chhupao
  root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false;o.raycast=()=>{}}});  // asli hit-box neeche alag hai
  // goli lagne ka hit-box: body + sar (dikhta nahi)
  const hbMat=new THREE.MeshBasicMaterial({visible:false});
  const body=new THREE.Mesh(new THREE.BoxGeometry(0.55,1.4,0.4),hbMat),head=new THREE.Mesh(new THREE.BoxGeometry(0.32,0.32,0.32),hbMat);
  body.position.y=0.7;head.position.y=1.6;body.userData.e=e;head.userData.e=e;head.userData.hd=1;
  // bandook (haath se pakdi hui) + muzzle flash
  const sc=cfg.height/1.75,dk=new THREE.MeshStandardMaterial({color:0x1c1c1c,roughness:.55,metalness:.4}),gun=new THREE.Group();
  const bx=(w,h,d,x,y,z)=>{const q=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),dk);q.position.set(x,y,z);q.castShadow=true;gun.add(q)};
  bx(0.07,0.1,0.55,0,0,0);bx(0.05,0.05,0.4,0,0.01,-0.45);bx(0.06,0.14,0.2,0,-0.1,0.02);bx(0.06,0.1,0.28,0,-0.02,0.4);bx(0.045,0.08,0.05,0,-0.1,0.2);
  gun.scale.setScalar(sc);
  // body ke andar shoulders ki jagah naapo (T-pose me), phir bandook sine ke saamne rakho
  c.g.updateMatrixWorld(true);
  const bn=re=>{let r=null;root.traverse(o=>{if(!r&&o.isBone&&re.test(o.name))r=o});return r};
  const B={ar:bn(/^arm\.?R/i),fr:bn(/^forearm\.?R/i),hr:bn(/^hand\.?R/i),al:bn(/^arm\.?L/i),fl:bn(/^forearm\.?L/i),hl:bn(/^hand\.?L/i)};
  const pa=new THREE.Vector3(),pb=new THREE.Vector3();
  let chestY=1.4*sc;
  if(B.ar&&B.al){B.ar.getWorldPosition(pa);B.al.getWorldPosition(pb);c.g.worldToLocal(pa);c.g.worldToLocal(pb);chestY=(pa.y+pb.y)/2}
  gun.position.set(0.05*sc,chestY-0.22*sc,-0.18*sc);
  const fl=new THREE.Mesh(new THREE.SphereGeometry(0.12*sc,8,6),new THREE.MeshBasicMaterial({color:0xffd54f}));
  fl.position.set(0.05*sc,chestY-0.2*sc,-0.18*sc-0.7*sc);fl.visible=false;
  c.g.add(pivot,body,head,gun,fl);c.mFl=fl;
  if(B.ar&&B.fr&&B.hr&&B.al&&B.fl&&B.hl)e.ik=()=>holdGun(c.g,gun,B,sc);
  if(cfg.anim&&m.animations.length){e.mx=new THREE.AnimationMixer(root);e.mx.clipAction(m.animations[0]).play();e.mx.update(Math.random()*8)}
  e.glb=pivot;
  // chalne ka animation: thigh/ghutna bones haath se hilao (model ki apni dance animation band hai)
  const lb={tl:bn(/^thighs?\.?L/i),tr:bn(/^thighs?\.?R/i),kl:bn(/^leg\.?L/i),kr:bn(/^leg\.?R/i)};
  if(lb.tl&&lb.tr&&lb.kl&&lb.kr){
    c.g.updateMatrixWorld(true);
    const gq=c.g.getWorldQuaternion(new THREE.Quaternion()),right=new THREE.Vector3(1,0,0).applyQuaternion(gq);
    const prep=b=>{ // bone ke local x/z me se wo axis chuno jo body ke daaye-baaye wali hai
      const q=b.getWorldQuaternion(new THREE.Quaternion());let best=null;
      for(const ax of[new THREE.Vector3(1,0,0),new THREE.Vector3(0,0,1)]){const d=ax.clone().applyQuaternion(q).dot(right);if(!best||Math.abs(d)>Math.abs(best.d))best={ax,d}}
      return{b,ax:best.ax,sg:best.d>=0?1:-1,q0:b.quaternion.clone()};
    };
    const G={tl:prep(lb.tl),tr:prep(lb.tr),kl:prep(lb.kl),kr:prep(lb.kr)},dq=new THREE.Quaternion();
    const rot=(o,ang)=>{dq.setFromAxisAngle(o.ax,ang*o.sg);o.b.quaternion.copy(o.q0).multiply(dq)};
    e.gait=spd=>{
      const a=Math.min(1,spd/3.4),p=e.wp||0;
      rot(G.tl,Math.sin(p)*0.65*a);rot(G.tr,-Math.sin(p)*0.65*a);
      rot(G.kl,-(0.5+0.5*Math.sin(p+1.3))*0.8*a);rot(G.kr,-(0.5+0.5*Math.sin(p+1.3+Math.PI))*0.8*a);
      pivot.position.y=Math.abs(Math.sin(p))*0.04*a;
    };
  }
}
function loadModels(){
  if(!THREE.GLTFLoader||!THREE.SkeletonUtils){console.warn('GLTFLoader nahi mila');setTimeout(()=>msg('Model: GLTFLoader nahi mila (index.html update karo / internet check karo)'),2500);return}
  const L=new THREE.GLTFLoader();
  L.load(MODEL_FILES.enemy,g=>{
    MODELS.enemy=g;g.scene.traverse(o=>{if(o.isMesh)MODEL_MATS.push(o.material)});
    try{EN.forEach(applyEnemyModel);msg('Model load ho gaya: '+MODEL_FILES.enemy)}catch(err){console.error(err);msg('Model error: '+err.message)}
  },undefined,err=>{console.warn('Model load fail:',err);msg('Model file nahi mili: '+MODEL_FILES.enemy+' (repo me upload karo)')});
}
loadModels();
