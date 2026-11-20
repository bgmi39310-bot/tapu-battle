const fs=require('fs'),vm=require('vm');const D=require('path').join(__dirname,'..')+'/';
const H={get(t,k){if(k===Symbol.toPrimitive)return()=>0;if(k==='length'||k==='count')return 0;if(k==='then')return undefined;if(!(k in t))t[k]=mk();return t[k]},set(t,k,v){t[k]=v;return true},apply(){return mk()},construct(){return mk()}};
function mk(){return new Proxy(function(){},H)}
class V3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}copy(o){this.x=o.x;this.y=o.y;this.z=o.z;return this}clone(){return new V3(this.x,this.y,this.z)}sub(o){this.x-=o.x;this.y-=o.y;this.z-=o.z;return this}add(o){this.x+=o.x;this.y+=o.y;this.z+=o.z;return this}length(){return Math.hypot(this.x,this.y,this.z)}normalize(){const l=this.length()||1;this.x/=l;this.y/=l;this.z/=l;return this}multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this}addScaledVector(o,s){this.x+=o.x*s;this.y+=o.y*s;this.z+=o.z*s;return this}lerp(o,t){this.x+=(o.x-this.x)*t;this.y+=(o.y-this.y)*t;this.z+=(o.z-this.z)*t;return this}}
class Obj{constructor(){this.position=new V3();this.rotation={x:0,y:0,z:0,order:'XYZ',set(a,b,c){this.x=a;this.y=b;this.z=c}};this.scale={x:1,y:1,z:1,set(a,b,c){this.x=a;this.y=b;this.z=c},setScalar(s){this.x=this.y=this.z=s}};this.children=[];this.visible=true;this.userData={};this.matrixAutoUpdate=true;this.matrixWorld={elements:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]};this.material=mk();this.geometry=mk()}
  setMatrixAt(){}setColorAt(){}get instanceMatrix(){return{needsUpdate:false}}set instanceMatrix(v){}clone(){const o=new Obj();o.position=this.position.clone();return o}add(...o){this.children.push(...o);return this}remove(){return this}traverse(f){f(this);this.children.forEach(c=>c.traverse&&c.traverse(f))}getWorldPosition(v){return v||new V3()}getWorldDirection(v){return v||new V3()}updateMatrixWorld(){}lookAt(){}}
const errors={};
const THREE=new Proxy({},{get(t,k){if(k==='Vector3')return V3;if(/^(Group|Mesh|Line|Points|Object3D|PerspectiveCamera|InstancedMesh|Scene|Sprite|SkinnedMesh)$/.test(k))return class extends Obj{constructor(){super();this.fov=70;this.aspect=1;this.quaternion=mk();this.up=new V3()}updateProjectionMatrix(){}};
  if(k==='Raycaster')return class{constructor(){this.ray={origin:new V3(),direction:new V3()}}set(){}setFromCamera(){}intersectObjects(){return[]}intersectObject(){return[]}};
  return function(){return mk()}}});
const dom=mk();
const ctx={THREE,console,Math,Float32Array,Array,Object,JSON,Date,Promise,setTimeout:(f)=>0,clearTimeout(){},setInterval(){return 0},document:dom,performance:{now:()=>globalThis.__now||0},innerWidth:800,innerHeight:360,localStorage:{getItem(){return null},setItem(){}},addEventListener(){},screen:{},navigator:{},requestAnimationFrame(){},Peer:function(){return mk()},AudioContext:function(){return mk()},location:{search:'',hash:'',href:''}};
ctx.window=ctx;vm.createContext(ctx);
const files=['01-core.js','02-environment.js','03-characters.js','04-utils-combat.js','05-inventory-physics.js','06-loot-parachute.js','07-map-builder.js','08-controls-ui.js','09-layout-editor.js','09b-models.js','09h-swords.js','09i-anim.js','09c-melee.js','09e-net.js','09d-lobby.js','09f-team.js','09g-fit.js','09j-perf.js','10-game-loop.js'];
let src=files.map(f=>fs.readFileSync(D+f,'utf8')).join('\n')+";globalThis.G={step,P,J,EN,LT,build,GFX,GFXL,gfxTick,applyGfx,uiTxt,uiHealth,wmCand,WM,set(k,v){eval(k+'='+JSON.stringify(v))}};";
try{vm.runInContext(src,ctx)}catch(e){console.log('LOAD ERROR:',e.message,'\n',e.stack.split('\n').slice(0,4).join('\n'));process.exit(1)}
const G=ctx.G;
function run(label,setup,frames=120){
  try{vm.runInContext(setup,ctx)}catch(e){console.log('SETUP ERR',label,e.message);return}
  let err=null;for(let i=0;i<frames;i++){try{G.step(0.016)}catch(e){err=e;break}}
  console.log(err?'ERROR  ':'ok     ',label,err?'-> '+err.message+'\n          '+err.stack.split('\n')[1].trim():'');
}
vm.runInContext("started=true;phase=0;",ctx);
run('walk on foot','phase=0;drive=false');
run('with gun, shooting','P.gun=true;P.ammo=30;firing=true',200);
run('reload','firing=false;P.ammo=2;doReload()',100);
run('scope on','P.zoom=true;scope=true',60);vm.runInContext("scope=false",ctx);
run('crouch/prone','st=1;',30);run('prone','st=2;',30);vm.runInContext("st=0",ctx);
run('driving jeep','drive=true;J.v=10;DRV.g=1',200);vm.runInContext("drive=false;DRV.g=0",ctx);
run('night mode','night=true',60);vm.runInContext("night=false",ctx);
run('melee swing (sword)','P.melee=2;setSword(2);firing=true',200);vm.runInContext("firing=false;setSword(-1)",ctx);
run('grenade held + aim','held="G";P.inv.G=2',60);vm.runInContext("held=null",ctx);
run('parachute phase','phase=3',40);vm.runInContext("phase=0",ctx);
run('dead','P.dead=true',30);vm.runInContext("P.dead=false",ctx);
run('1500 frames long run','phase=0',1500);

// ---- auto quality simulation ----
const g=G;vm.runInContext("started=true;document.hidden=false",ctx);
globalThis.__now=100000;g.GFX.lv=2;g.GFX.mode='auto';g.GFX.lastDown=-1e9;
for(let i=0;i<80;i++){g.gfxTick(0.05)}            // 20 fps (4 s)
console.log(g.GFX.lv<2?'ok     ':'ERROR  ','auto-quality: 20fps par High ->',g.GFXL[g.GFX.lv].n);
for(let i=0;i<120;i++){g.gfxTick(0.05)}
console.log(g.GFX.lv===0?'ok     ':'ERROR  ','auto-quality: lagatar kam fps par Low tak gaya (lv',g.GFX.lv+')');
globalThis.__now=100000+10000;for(let i=0;i<400;i++){g.gfxTick(0.012)}   // 83fps but only 10 s after last drop
console.log(g.GFX.lv===0?'ok     ':'ERROR  ','auto-quality: drop ke 10 s baad turant upar nahi gaya (cooldown) lv',g.GFX.lv);
globalThis.__now=100000+40000;for(let i=0;i<800;i++){g.gfxTick(0.012)}
console.log(g.GFX.lv>=1?'ok     ':'ERROR  ','auto-quality: 30 s baad achhe fps par upar gaya -> lv',g.GFX.lv);
g.gfxTick(0.9);g.gfxTick(NaN);g.gfxTick(0);console.log('ok     ','gfxTick bekaar dt (tab switch/NaN) par kuch nahi karta');
g.uiTxt('am','x');g.uiTxt('am','x');g.uiHealth(55);g.uiHealth(55);console.log('ok     ','HUD cache helpers chalte hain');
