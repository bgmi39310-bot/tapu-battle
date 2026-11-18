// 3D model (.glb) loader. Agar file na mile ya load fail ho to purane procedural characters chalte rahenge.
// Naya model lagana ho: MODEL_FILES me naam badlo.
const MODEL_FILES={enemy:'woman.glb'};   // <- apni .glb file ka naam yahan
// height = game me kitne meter ka dikhe | yaw = peeche mooh ho to Math.PI <-> 0 | footY = skinned model me paon ki height (fallback)
const MODEL_CFG={enemy:{height:1.75,yaw:Math.PI,anim:true,footY:-1.83}};
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
  // haath ki bandook + muzzle flash (model me gun nahi hai)
  const gun=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.11,0.9),new THREE.MeshStandardMaterial({color:0x222222,roughness:.6}));
  gun.position.set(0.16,1.15,-0.45);gun.castShadow=true;
  const fl=new THREE.Mesh(new THREE.SphereGeometry(0.12,8,6),new THREE.MeshBasicMaterial({color:0xffd54f}));
  fl.position.set(0.16,1.15,-0.98);fl.visible=false;
  c.g.add(pivot,body,head,gun,fl);c.mFl=fl;
  if(cfg.anim&&m.animations.length){e.mx=new THREE.AnimationMixer(root);e.mx.clipAction(m.animations[0]).play();e.mx.update(Math.random()*8)}
  e.glb=pivot;
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
