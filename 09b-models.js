// 3D model (.glb) loader. Agar file na mile ya load fail ho to purane procedural characters chalte rahenge.
// Naya model lagana ho: MODEL_FILES me naam badlo / jodo, aur applyEnemyModel() jaisa function banao.
const MODEL_FILES={enemy:'woman.glb'};   // <- apni .glb file ka naam yahan
const MODEL_CFG={enemy:{height:1.75,yaw:Math.PI,anim:true}};  // height = game me kitne meter ka dikhe, yaw = agar peeche mooh ho to 0 <-> Math.PI badlo
const MODELS={},MODEL_MATS=[];
function applyEnemyModel(e){
  const m=MODELS.enemy;if(!m||e.glb)return;
  const cfg=MODEL_CFG.enemy,c=e.c,root=THREE.SkeletonUtils.clone(m.scene);
  const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),k=cfg.height/(size.y||1);
  const pivot=new THREE.Group();pivot.rotation.y=cfg.yaw;
  root.scale.setScalar(k);root.position.y=-box.min.y*k;pivot.add(root);
  c.g.children.slice().forEach(ch=>ch.visible=false);   // purana procedural body chhupao
  root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false;o.userData.e=e;o.userData.glb=1}});
  // haath ki bandook + muzzle flash (model me gun nahi hai)
  const gun=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.11,0.9),new THREE.MeshStandardMaterial({color:0x222222,roughness:.6}));
  gun.position.set(0.16,1.15,-0.45);gun.castShadow=true;
  const fl=new THREE.Mesh(new THREE.SphereGeometry(0.12,8,6),new THREE.MeshBasicMaterial({color:0xffd54f}));
  fl.position.set(0.16,1.15,-0.98);fl.visible=false;
  c.g.add(pivot,gun,fl);c.mFl=fl;
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
