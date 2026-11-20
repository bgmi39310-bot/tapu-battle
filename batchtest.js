const fs=require('fs'),vm=require('vm');const D=require('path').join(__dirname,'..')+'/';
const H={get(t,k){if(k===Symbol.toPrimitive)return()=>0;if(k==='length'||k==='count')return 0;if(!(k in t))t[k]=mk();return t[k]},set(t,k,v){t[k]=v;return true},apply(){return mk()},construct(){return mk()}};
function mk(){return new Proxy(function(){},H)}
// ---- tiny real THREE parts ----
function mul(a,b){const o=new Array(16).fill(0);for(let r=0;r<4;r++)for(let c=0;c<4;c++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o}
function localM(o){const x=o.rotation.x,y=o.rotation.y,z=o.rotation.z,s=o.scale,cx=Math.cos(x),sx=Math.sin(x),cy=Math.cos(y),sy=Math.sin(y),cz=Math.cos(z),sz=Math.sin(z);
  const Rx=[1,0,0,0,0,cx,sx,0,0,-sx,cx,0,0,0,0,1],Ry=[cy,0,-sy,0,0,1,0,0,sy,0,cy,0,0,0,0,1],Rz=[cz,sz,0,0,-sz,cz,0,0,0,0,1,0,0,0,0,1];
  const R=mul(mul(Rx,Ry),Rz);for(let c=0;c<3;c++)for(let r=0;r<3;r++)R[c*4+r]*=[s.x,s.y,s.z][c];R[12]=o.position.x;R[13]=o.position.y;R[14]=o.position.z;return R}
class Obj{constructor(){this.position={x:0,y:0,z:0,set(a,b,c){this.x=a;this.y=b;this.z=c;return this}};this.rotation={x:0,y:0,z:0,set(a,b,c){this.x=a;this.y=b;this.z=c}};this.scale={x:1,y:1,z:1,set(a,b,c){this.x=a;this.y=b;this.z=c},setScalar(s){this.x=this.y=this.z=s}};this.children=[];this.userData={};this.visible=true;this.matrixAutoUpdate=true;this.matrixWorld={elements:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]};this.parent=null}
  clone(){const o=new this.constructor();o.position.set(this.position.x,this.position.y,this.position.z);o.rotation.set(this.rotation.x,this.rotation.y,this.rotation.z);return o}lookAt(){}getWorldPosition(v){return v}add(...o){for(const c of o){c.parent=this;this.children.push(c)}return this}remove(){return this}traverse(f){f(this);this.children.forEach(c=>c.traverse&&c.traverse(f))}
  updateMatrixWorld(force){if(this.matrixAutoUpdate){const l=localM(this);this.matrixWorld.elements=this.parent&&this.parent.matrixWorld?mul(this.parent.matrixWorld.elements,l):l}this.children.forEach(c=>c.updateMatrixWorld(force))}}
class Mesh extends Obj{constructor(g,m){super();this.geometry=g;this.material=m;this.isMesh=true}}
class Group extends Obj{}
class BufferAttribute{constructor(a,n){this.array=a;this.itemSize=n;this.count=a.length/n}}
class BufferGeometry{constructor(){this.attributes={};this.index=null}setAttribute(k,a){this.attributes[k]=a;return this}setIndex(a){this.index=a;return this}setFromPoints(){return this}computeVertexNormals(){}rotateX(){return this}rotateY(){return this}rotateZ(){return this}translate(){return this}scale(){return this}computeBoundingSphere(){}dispose(){}}
class BoxGeometry extends BufferGeometry{constructor(){super();const P=[],N=[],U=[],I=[];const F=[[[1,0,0],[0,0,-1],[0,1,0]],[[-1,0,0],[0,0,1],[0,1,0]],[[0,1,0],[1,0,0],[0,0,-1]],[[0,-1,0],[1,0,0],[0,0,1]],[[0,0,1],[1,0,0],[0,1,0]],[[0,0,-1],[-1,0,0],[0,1,0]]];
  F.forEach((f,i)=>{const[n,u,v]=f;for(const[a,b]of[[-1,1],[1,1],[-1,-1],[1,-1]]){P.push(n[0]*.5+u[0]*a*.5+v[0]*b*.5,n[1]*.5+u[1]*a*.5+v[1]*b*.5,n[2]*.5+u[2]*a*.5+v[2]*b*.5);N.push(...n);U.push((a+1)/2,(b+1)/2)}I.push(i*4,i*4+2,i*4+1,i*4+2,i*4+3,i*4+1)});
  this.attributes={position:new BufferAttribute(new Float32Array(P),3),normal:new BufferAttribute(new Float32Array(N),3),uv:new BufferAttribute(new Float32Array(U),2)};this.index=new BufferAttribute(new Uint16Array(I),1)}}
class Matrix3{constructor(){this.elements=[1,0,0,0,1,0,0,0,1]}getNormalMatrix(m){const e=m.elements,a=[e[0],e[1],e[2],e[4],e[5],e[6],e[8],e[9],e[10]];// col-major 3x3 -> inverse transpose
  const[a0,a1,a2,a3,a4,a5,a6,a7,a8]=a,det=a0*(a4*a8-a5*a7)-a3*(a1*a8-a2*a7)+a6*(a1*a5-a2*a4);
  const inv=[(a4*a8-a5*a7),-(a1*a8-a2*a7),(a1*a5-a2*a4),-(a3*a8-a5*a6),(a0*a8-a2*a6),-(a0*a5-a2*a3),(a3*a7-a4*a6),-(a0*a7-a1*a6),(a0*a4-a1*a3)].map(v=>v/det);
  // inv is column-major inverse; transpose of inverse:
  this.elements=[inv[0],inv[3],inv[6],inv[1],inv[4],inv[7],inv[2],inv[5],inv[8]];return this}}
class DirLight{constructor(){const p=()=>({x:0,y:0,z:0,set(a,b,c){this.x=a;this.y=b;this.z=c;return this},copy(o){this.x=o.x;this.y=o.y;this.z=o.z;return this}});this.position=p();this.target={position:p()};this.shadow={mapSize:{x:512,y:512,set(a,b){this.x=a;this.y=b}},camera:{left:0,right:0,top:0,bottom:0,near:0,far:0,updateProjectionMatrix(){}}};this.castShadow=false}}
const THREE=new Proxy({DirectionalLight:DirLight,Mesh,Group,BufferAttribute,BufferGeometry,BoxGeometry,Matrix3,Float32BufferAttribute:BufferAttribute},{get(t,k){if(k in t)return t[k];return function(){return mk()}}});
const ctx={THREE,console,Math,Float32Array,Uint16Array,Uint32Array,Map,Array,Object,JSON,Date,setTimeout:()=>0,clearTimeout(){},document:mk(),performance:{now:()=>0},innerWidth:800,innerHeight:360,localStorage:{getItem(){return null},setItem(){}},addEventListener(){},screen:{},navigator:{}};
ctx.window=ctx;vm.createContext(ctx);
const files=['01-core.js','02-environment.js','03-characters.js','04-utils-combat.js','05-inventory-physics.js','06-loot-parachute.js','07-map-builder.js','09h-swords.js','09j-perf.js'];
let src="const LK=['h','a','a','G','M','h','a','B','H'];function setDriveUI(){}\n"+files.map(f=>fs.readFileSync(D+f,'utf8')).join('\n')+";globalThis.G={WM,UB,get grp(){return grp},build,wmCand,WG,snapSun,sun,sc2,P,S};";
vm.runInContext(src,ctx);
const G=ctx.G;let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log('FAIL',m)}else console.log('ok  ',m)};
const inv4=m=>{ // general 4x4 inverse
  const a=m,o=new Array(16);const s0=a[0]*a[5]-a[4]*a[1],s1=a[0]*a[6]-a[4]*a[2],s2=a[0]*a[7]-a[4]*a[3],s3=a[1]*a[6]-a[5]*a[2],s4=a[1]*a[7]-a[5]*a[3],s5=a[2]*a[7]-a[6]*a[3],c5=a[10]*a[15]-a[14]*a[11],c4=a[9]*a[15]-a[13]*a[11],c3=a[9]*a[14]-a[13]*a[10],c2=a[8]*a[15]-a[12]*a[11],c1=a[8]*a[14]-a[12]*a[10],c0=a[8]*a[13]-a[12]*a[9];
  const id=1/(s0*c5-s1*c4+s2*c3+s3*c2-s4*c1+s5*c0);
  o[0]=(a[5]*c5-a[6]*c4+a[7]*c3)*id;o[1]=(-a[1]*c5+a[2]*c4-a[3]*c3)*id;o[2]=(a[13]*s5-a[14]*s4+a[15]*s3)*id;o[3]=(-a[9]*s5+a[10]*s4-a[11]*s3)*id;
  o[4]=(-a[4]*c5+a[6]*c2-a[7]*c1)*id;o[5]=(a[0]*c5-a[2]*c2+a[3]*c1)*id;o[6]=(-a[12]*s5+a[14]*s2-a[15]*s1)*id;o[7]=(a[8]*s5-a[10]*s2+a[11]*s1)*id;
  o[8]=(a[4]*c4-a[5]*c2+a[7]*c0)*id;o[9]=(-a[0]*c4+a[1]*c2-a[3]*c0)*id;o[10]=(a[12]*s4-a[13]*s2+a[15]*s0)*id;o[11]=(-a[8]*s4+a[9]*s2-a[11]*s0)*id;
  o[12]=(-a[4]*c3+a[5]*c1-a[6]*c0)*id;o[13]=(a[0]*c3-a[1]*c1+a[2]*c0)*id;o[14]=(-a[12]*s3+a[13]*s1-a[14]*s0)*id;o[15]=(a[8]*s3-a[9]*s1+a[10]*s0)*id;return o};
const T4=(m,v,w=1)=>[m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12]*w,m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13]*w,m[2]*v[0]+m[6]*v[1]+m[10]*v[2]+m[14]*w];
function rayBox(m,inv,o,d,far){ // slab test in local space, box +-0.5
  const lo=T4(inv,o,1),ld=T4(inv,d,0);let t0=0,t1=far;
  for(let i=0;i<3;i++){if(Math.abs(ld[i])<1e-12){if(lo[i]<-.5||lo[i]>.5)return false}else{let a=(-.5-lo[i])/ld[i],b=(.5-lo[i])/ld[i];if(a>b)[a,b]=[b,a];t0=Math.max(t0,a);t1=Math.min(t1,b);if(t0>t1)return false}}
  return true}
for(const seed of [7,100,555]){
  vm.runInContext(`th=0;build(${seed})`,ctx);
  const WM=G.WM,grp=G.grp,boxes=WM.filter(m=>m.geometry===G.UB);
  const hidden=boxes.filter(m=>!m.visible).length;
  const merged=grp.children.filter(c=>c.geometry&&c.geometry.index&&c.geometry!==G.UB&&c.geometry.attributes.position.count>=24&&boxes.every(b=>b!==c));
  const totV=merged.reduce((s,m)=>s+m.geometry.attributes.position.count,0),totI=merged.reduce((s,m)=>s+m.geometry.index.array.length,0);
  ok(hidden===boxes.length,`seed ${seed}: ${boxes.length} box meshes sab hide ho gaye`);
  ok(totV===boxes.length*24&&totI===boxes.length*36,`seed ${seed}: merged = ${merged.length} meshes (pehle ${boxes.length}), vertices/indices pure ${totV}/${totI}`);
  // vertex-exact check: rebuild expected per material in same order
  const by=new Map();for(const m of boxes){let a=by.get(m.material);if(!a)by.set(m.material,a=[]);a.push(m)}
  let maxErr=0,maxNErr=0,ni=0;const mergedByMat=new Map(merged.map(m=>[m.material,m]));
  for(const[mat,list]of by){const mm=mergedByMat.get(mat),pos=mm.geometry.attributes.position.array,nor=mm.geometry.attributes.normal.array;
    list.forEach((b,i)=>{const e=b.matrixWorld.elements,P=G.UB.attributes.position.array,N=G.UB.attributes.normal.array;
      // normals: expected = rotate normal then divide by scale (box faces stay axis-aligned in local)
      for(let j=0;j<24;j++){const x=T4(e,[P[j*3],P[j*3+1],P[j*3+2]]),o=(i*24+j)*3;maxErr=Math.max(maxErr,Math.hypot(x[0]-pos[o],x[1]-pos[o+1],x[2]-pos[o+2]));
        const n=T4(e,[N[j*3],N[j*3+1],N[j*3+2]],0);const sc=[Math.hypot(e[0],e[1],e[2]),Math.hypot(e[4],e[5],e[6]),Math.hypot(e[8],e[9],e[10])];
        // face normal = local axis a -> world axis R*a (unit): e column / scale
        const ax=Math.abs(N[j*3])>.5?0:Math.abs(N[j*3+1])>.5?1:2,sg=N[j*3+ax]>0?1:-1,col=[e[ax*4],e[ax*4+1],e[ax*4+2]],l=Math.hypot(...col),exp=col.map(v=>v/l*sg);
        maxNErr=Math.max(maxNErr,Math.hypot(exp[0]-nor[o],exp[1]-nor[o+1],exp[2]-nor[o+2]));ni++}})}
  ok(maxErr<1e-4,`seed ${seed}: merged vertex position error max ${maxErr.toExponential(1)} (${ni} verts, ramps/rotated bhi)`);
  ok(maxNErr<1e-4,`seed ${seed}: normals sahi (max err ${maxNErr.toExponential(1)})`);
  // ---- raycast grid vs brute force ----
  let s=123456+seed;const R=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};
  const invs=new Map(boxes.map(m=>[m,inv4(m.matrixWorld.elements)]));
  let miss=0,rays=0,hitRays=0,candSum=0;
  for(let r=0;r<20000;r++){
    const o=[(R()-.5)*600,R()*30-2,(R()-.5)*600],th=R()*6.283,ph=(R()-.5)*1.2,d=[Math.cos(th)*Math.cos(ph),Math.sin(ph),Math.sin(th)*Math.cos(ph)],far=5+R()*295;
    const cand=new Set(G.wmCand(o[0],o[2],d[0],d[2],far));candSum+=cand.size;rays++;
    for(const b of boxes){if(rayBox(b.matrixWorld.elements,invs.get(b),o,d,far)){hitRays++;if(!cand.has(b)){miss++}}}
  }
  ok(miss===0,`seed ${seed}: ${rays} random rays, ${hitRays} true box-hits, ${miss} grid ne chhoote | avg candidates ${(candSum/rays).toFixed(0)} vs ${WM.length} pehle`);
}
// shadow snap
vm.runInContext("P.x=13.37;P.y=5.2;P.z=-44.1;snapSun()",ctx);
const sd=ctx.G.sun;console.log('sun.target after snap:',[sd.target.position.x,sd.target.position.y,sd.target.position.z].map(v=>+v.toFixed(3)).join(', '),'(shift from player <1 texel ~',(2*ctx.G.sc2.right/1024).toFixed(3),'m)');
const dx=Math.hypot(sd.target.position.x-13.37,sd.target.position.y-5.2,sd.target.position.z+44.1);ok(dx<0.3,`shadow snap player ke paas hi rehta hai (shift ${dx.toFixed(3)} m)`);
console.log(fails?`\n${fails} FAILED`:'\nsab pass');
// snap property: snapped target must sit on the light-space texel grid for ANY player position
{
  let s=99;const R=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};
  const sdv=(()=>{const x=85,y=140,z=45,l=Math.hypot(x,y,z),zx=x/l,zy=y/l,zz=z/l;let ax=zz,az=-zx;const al=Math.hypot(ax,az);ax/=al;az/=al;return{xx:ax,xz:az,yx:zy*az,yy:zz*ax-zx*az,yz:-zy*ax}})();
  const Tx=2*ctx.G.sc2.right/ctx.G.sun.shadow.mapSize.x;let worst=0,maxShift=0;
  for(let i=0;i<2000;i++){const x=(R()-.5)*500,y=R()*20,z=(R()-.5)*500;vm.runInContext(`P.x=${x};P.y=${y};P.z=${z};snapSun()`,ctx);
    const t=ctx.G.sun.target.position,px=t.x*sdv.xx+t.z*sdv.xz,py=t.x*sdv.yx+t.y*sdv.yy+t.z*sdv.yz;
    worst=Math.max(worst,Math.abs(px/Tx-Math.round(px/Tx)),Math.abs(py/Tx-Math.round(py/Tx)));maxShift=Math.max(maxShift,Math.hypot(t.x-x,t.y-y,t.z-z))}
  console.log(`shadow snap: 2000 random positions, worst off-grid ${worst.toExponential(1)} texel, max shift from player ${maxShift.toFixed(3)} m (texel ${Tx.toFixed(3)} m)`);
}
