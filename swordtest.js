const fs=require('fs'),vm=require('vm');
const D=require('path').join(__dirname,'..')+'/';
const H={get(t,k){if(k===Symbol.toPrimitive)return()=>0;if(k==='length'||k==='count')return 0;if(!(k in t))t[k]=mk();return t[k]},set(t,k,v){t[k]=v;return true},apply(){return mk()},construct(){return mk()}};
function mk(){return new Proxy(function(){},H)}
class V3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}length(){return Math.hypot(this.x,this.y,this.z)}normalize(){const l=this.length()||1;this.x/=l;this.y/=l;this.z/=l;return this}}
const THREE=new Proxy({},{get(t,k){if(k==='Vector3')return V3;return function(){return mk()}}});
const msgs=[];
const ctx={THREE,console,Math,Float32Array,Array,Object,JSON,Date,setTimeout:()=>0,clearTimeout(){},document:mk(),performance:{now:()=>0},innerWidth:800,innerHeight:360,localStorage:{getItem(){return null},setItem(){}},addEventListener(){},screen:{},navigator:{},msgs};
ctx.window=ctx;vm.createContext(ctx);
const files=['01-core.js','02-environment.js','03-characters.js','04-utils-combat.js','05-inventory-physics.js','06-loot-parachute.js','07-map-builder.js','09h-swords.js','09i-anim.js','09c-melee.js'];
let src="const LK=['h','a','a','G','M','h','a','B','H'];function setDriveUI(){}function msg(m){msgs.push(m)};const NET={mode:'coop',role:'solo',players:{}};function netPlayerHit(){}\n"+files.map(f=>fs.readFileSync(D+f,'utf8')).join('\n')+";globalThis.G={P,LT,HS,SWORDS,build,pick,drop,spawnDrop,cycleSword,swordPick,meleeUpdate,meleePose,startSlash,SW,hmap,lootName,setSword,inv,get sw(){return P.sw}};";
vm.runInContext(src,ctx);vm.runInContext('msg=function(m){msgs.push(m)}',ctx);
const G=ctx.G;let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log('FAIL',m)}else console.log('ok  ',m)};
const snap=()=>G.LT.filter(l=>String(l.t).length>1&&l.t[0]==='S').map(l=>({t:l.t,x:+l.m.position.x,y:+l.m.position.y,z:+l.m.position.z}));
// position of mock meshes: set(x,y,z) on proxy doesn't store -> track via addLoot args
const added=[];vm.runInContext("const __al=addLoot;addLoot=function(x,y,z,t,id){__al(x,y,z,t,id);if(String(t).length>1&&t[0]==='S')__added.push({x,y,z,t});return LT[LT.length-1]}",ctx);ctx.__added=added;
for(const seed of [7,100,555,2024]){
  added.length=0;vm.runInContext(`th=0;build(${seed})`,ctx);
  const a=added.map(o=>({...o}));added.length=0;vm.runInContext(`th=0;build(${seed})`,ctx);
  const b=added.map(o=>({...o}));
  const types=new Set(a.map(o=>o.t));
  const houses=new Set(a.map(o=>{let best=-1,bd=1e9;G.HS.forEach((h,i)=>{const d=Math.hypot(h.x-o.x,h.z-o.z);if(d<bd){bd=d;best=i}});return best}));
  const inside=a.every(o=>G.HS.some(h=>Math.abs(o.x-h.x)<=h.W/2&&Math.abs(o.z-h.z)<=h.D/2));
  ok(a.length===10&&types.size===10,`seed ${seed}: 10 alag talwarein loot me (${a.length} loot, ${types.size} types), ${G.HS.length} ghar, ${houses.size} alag gharon me`);
  ok(JSON.stringify(a)===JSON.stringify(b),`seed ${seed}: dobara build karne par wahi jagah (multiplayer me sabko ek jaisa)`);
  ok(inside,`seed ${seed}: sab talwarein ghar ke footprint ke andar`);
}
// pick / drop flow
vm.runInContext("build(7)",ctx);const P=G.P;
const before=G.LT.length;
const l3=G.LT.find(l=>l.t==='S3'),l5=G.LT.find(l=>l.t==='S5');
vm.runInContext('phase=0',ctx);G.P.gun=false;G.pick(l3);
ok(P.melee===3&&P.sw===3,'bandook nahi thi: S3 uthate hi haath me aa gayi');
G.pick(l5);
ok(P.melee===5&&P.sw===5,'dusri talwar uthayi: ab sirf S5 haath me');
ok(G.LT.some(l=>l.t==='S3'),'purani S3 zameen par wapas gir gayi');
G.cycleSword();ok(P.sw===-1&&P.melee===5,'V/button: talwar rakh di (bag me rahi)');
G.cycleSword();ok(P.sw===5,'V/button: talwar wapas nikal li');
G.drop('S');ok(P.melee===-1&&P.sw===-1&&G.LT.some(l=>l.t==='S5'),'Girao: talwar zameen par, haath khali');
G.cycleSword();ok(ctx.msgs.some(m=>/Talwar nahi hai/.test(m)),'bina talwar V dabaya: sahi message');
ok(G.lootName('S4')==='Shamshir (Talwar)'&&G.lootName('W')==='M416 Rifle','loot ke naam');
// frame loop bina error ke
let err=null;try{G.pick(G.LT.find(l=>l.t==='S1'));G.startSlash();for(let i=0;i<60;i++){G.meleeUpdate(0.016,i%2===0,0.5,false);G.meleePose(0.5,false)}}catch(e){err=e}
ok(!err,'60 frame ka vaar/animation loop bina error'+(err?': '+err.message:''));
// gun ke saath: auto-equip nahi
vm.runInContext("build(7)",ctx);vm.runInContext('phase=0',ctx);P.gun=true;G.pick(G.LT.find(l=>l.t==='S0'));
ok(P.melee===0&&P.sw===-1,'bandook haath me ho to talwar bag me aati hai, khud nahi nikalti');
console.log(fails?`\n${fails} FAILED`:'\nsab pass');
