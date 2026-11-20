// Performance: (1) static batching  (2) raycast grid  (3) graphics presets + auto quality + FPS counter
//              (4) HUD ko sirf badalne par update  (5) shadow texel-snapping (shimmer band)

// ---------- 1. Static batching ----------
// Map ke ~900 box meshes (ghar/deewar/props) ko MATERIAL ke hisaab se ek-ek mesh me jod deta hai.
// Asli meshes WM me rehti hain (raycast/collision ke liye) par dikhti nahi (visible=false) -> draw calls ~2000 se ~300.
function batchStatic(){
  grp.updateMatrixWorld(true);
  const by=new Map();
  for(const m of WM){if(m.geometry!==UB)continue;let a=by.get(m.material);if(!a)by.set(m.material,a=[]);a.push(m)}
  const A=UB.attributes,P=A.position.array,N=A.normal.array,U=A.uv.array,I=UB.index.array,nv=A.position.count,ni=I.length,nm=new THREE.Matrix3();
  let merged=0;
  for(const[mat,list]of by){
    const n=list.length,pos=new Float32Array(n*nv*3),nor=new Float32Array(n*nv*3),uv=new Float32Array(n*nv*2),
          idx=n*nv>65535?new Uint32Array(n*ni):new Uint16Array(n*ni);
    for(let i=0;i<n;i++){
      const m=list[i],e=m.matrixWorld.elements,ne=nm.getNormalMatrix(m.matrixWorld).elements,vo=i*nv;
      for(let j=0;j<nv;j++){
        const x=P[j*3],y=P[j*3+1],z=P[j*3+2],o=(vo+j)*3;
        pos[o]=e[0]*x+e[4]*y+e[8]*z+e[12];pos[o+1]=e[1]*x+e[5]*y+e[9]*z+e[13];pos[o+2]=e[2]*x+e[6]*y+e[10]*z+e[14];
        const a=N[j*3],b=N[j*3+1],c=N[j*3+2];
        const nx=ne[0]*a+ne[3]*b+ne[6]*c,ny=ne[1]*a+ne[4]*b+ne[7]*c,nz=ne[2]*a+ne[5]*b+ne[8]*c,l=Math.hypot(nx,ny,nz)||1;
        nor[o]=nx/l;nor[o+1]=ny/l;nor[o+2]=nz/l;
        uv[(vo+j)*2]=U[j*2];uv[(vo+j)*2+1]=U[j*2+1];
      }
      for(let k=0;k<ni;k++)idx[i*ni+k]=I[k]+vo;
      m.visible=false;m.matrixAutoUpdate=false;     // raycast ke liye list me rahe, draw nahi hoti
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.BufferAttribute(nor,3));geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));
    geo.setIndex(new THREE.BufferAttribute(idx,1));geo.computeBoundingSphere();
    const mesh=new THREE.Mesh(geo,mat);mesh.castShadow=mesh.receiveShadow=true;mesh.matrixAutoUpdate=false;grp.add(mesh);merged++;
  }
  buildWMGrid();
  return merged;
}

// ---------- 2. Raycast grid ----------
// WM ke ~900 meshes par har ray (camera, LOS, goli) chalane ke bajay sirf ray ke raaste ke cells ki meshes.
const WG={cs:24,n:0,half:0,cells:[],out:[],stamp:0};
function buildWMGrid(){
  WG.half=S/2+40;WG.n=Math.ceil(WG.half*2/WG.cs);WG.cells=[];for(let i=0;i<WG.n*WG.n;i++)WG.cells.push([]);
  const cl=v=>Math.max(0,Math.min(WG.n-1,Math.floor((v+WG.half)/WG.cs)));
  for(const m of WM){
    const e=m.matrixWorld.elements;let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
    for(const sx of[-.5,.5])for(const sy of[-.5,.5])for(const sz of[-.5,.5]){
      const X=e[0]*sx+e[4]*sy+e[8]*sz+e[12],Z=e[2]*sx+e[6]*sy+e[10]*sz+e[14];
      if(X<x0)x0=X;if(X>x1)x1=X;if(Z<z0)z0=Z;if(Z>z1)z1=Z;
    }
    const i0=cl(x0),i1=cl(x1),j0=cl(z0),j1=cl(z1);
    for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++)WG.cells[i*WG.n+j].push(m);
  }
}
// ray (ox,oz) se (dx,dz) disha me far door tak: jin cells se guzarti hai unki meshes (exact 2D DDA)
function wmCand(ox,oz,dx,dz,far){
  const out=WG.out;out.length=0;
  if(!WG.cells.length){for(const m of WM)out.push(m);return out}
  const st=++WG.stamp,n=WG.n,cs=WG.cs,half=WG.half;
  let ix=Math.floor((ox+half)/cs),iz=Math.floor((oz+half)/cs);
  const sx=dx>0?1:-1,sz=dz>0?1:-1,ax=Math.abs(dx),az=Math.abs(dz);
  const tdx=ax>1e-9?cs/ax:1e30,tdz=az>1e-9?cs/az:1e30;
  let tmx=ax>1e-9?(((dx>0?ix+1:ix)*cs-half)-ox)/dx:1e30,tmz=az>1e-9?(((dz>0?iz+1:iz)*cs-half)-oz)/dz:1e30;
  for(let it=0;it<500;it++){
    if(ix>=0&&ix<n&&iz>=0&&iz<n){const c=WG.cells[ix*n+iz];for(let k=0;k<c.length;k++){const m=c[k];if(m._qs!==st){m._qs=st;out.push(m)}}}
    if(tmx<tmz){if(tmx>far)break;ix+=sx;tmx+=tdx}else{if(tmz>far)break;iz+=sz;tmz+=tdz}
  }
  return out;
}

// ---------- 3. Graphics presets + auto quality + FPS ----------
const GFXL=[
  {n:'Low', pr:1,  sh:false,sr:60,far:600, fog:[140,520],cl:false},
  {n:'Med', pr:1.5,sh:true, sr:60,far:900, fog:[200,760],cl:true},
  {n:'High',pr:2,  sh:true, sr:85,far:1300,fog:[260,950],cl:true}
];
const GFX={mode:'auto',lv:(typeof MOBILE!=='undefined'&&MOBILE)?1:2,max:2,shOff:false,fps:false,e:60,acc:0,n:0,good:0,bad:0,lastDown:-1e9};
function loadGfx(){try{const o=JSON.parse(localStorage.getItem('tapu_gfx')||'null');if(o){GFX.mode=(o.mode==='auto'||o.mode===0||o.mode===1||o.mode===2)?o.mode:'auto';GFX.shOff=!!o.shOff;GFX.fps=!!o.fps}}catch(e){}if(GFX.mode!=='auto')GFX.lv=GFX.mode}
function saveGfx(){try{localStorage.setItem('tapu_gfx',JSON.stringify({mode:GFX.mode,shOff:GFX.shOff,fps:GFX.fps}))}catch(e){}}
function gfxLabels(){
  const g=$('gfxb'),s=$('sh'),f=$('fpsb'),d=$('fpsd');
  if(g)g.textContent='🎨 Graphics: '+(GFX.mode==='auto'?'Auto ('+GFXL[GFX.lv].n+')':GFXL[GFX.lv].n);
  if(s)s.textContent='☀ Shadow: '+(sun.castShadow?'On':'Off');
  if(f)f.textContent='📈 FPS: '+(GFX.fps?'On':'Off');
  if(d)d.style.display=GFX.fps?'block':'none';
}
function applyGfx(){
  const L=GFXL[GFX.lv];
  ren.setPixelRatio(Math.min(window.devicePixelRatio||1,L.pr));if(typeof size==='function')size();
  sun.castShadow=L.sh&&!GFX.shOff;
  sc2.left=sc2.bottom=-L.sr;sc2.right=sc2.top=L.sr;sc2.updateProjectionMatrix();
  cam.far=L.far;cam.updateProjectionMatrix();
  scene.fog.near=L.fog[0];scene.fog.far=L.fog[1];
  for(const c of CL)c.visible=L.cl;
  gfxLabels();
}
// har frame ke baad: FPS napo, auto-quality chalao
function gfxTick(raw){
  if(!(raw>0)||raw>0.5||document.hidden)return;
  GFX.acc+=raw;GFX.n++;
  if(GFX.acc<0.5)return;
  const fps=GFX.n/GFX.acc;GFX.acc=0;GFX.n=0;GFX.e=GFX.e*0.5+fps*0.5;
  if(GFX.fps){const d=$('fpsd'),i=ren.info.render;if(d)d.textContent=Math.round(GFX.e)+' fps · '+GFXL[GFX.lv].n+(GFX.mode==='auto'?' auto':'')+' · '+i.calls+' calls · '+Math.round(i.triangles/1000)+'k tri'}
  if(GFX.mode!=='auto'||(typeof started!=='undefined'&&!started))return;
  const now=performance.now();
  if(GFX.e<36){GFX.bad++;GFX.good=0}else if(GFX.e>56){GFX.good++;GFX.bad=0}else{GFX.good=0;GFX.bad=0}
  if(GFX.bad>=3&&GFX.lv>0){GFX.lv--;GFX.bad=0;GFX.lastDown=now;applyGfx();if(typeof msg==='function')msg('Graphics auto: '+GFXL[GFX.lv].n+' (FPS kam tha)')}
  else if(GFX.good>=16&&GFX.lv<GFX.max&&now-GFX.lastDown>30000){GFX.lv++;GFX.good=0;applyGfx()}
}
loadGfx();applyGfx();
{
  const g=$('gfxb'),f=$('fpsb'),s=$('sh');
  if(g)g.onclick=()=>{GFX.mode=GFX.mode==='auto'?0:GFX.mode===2?'auto':GFX.mode+1;if(GFX.mode!=='auto')GFX.lv=GFX.mode;else GFX.lv=(typeof MOBILE!=='undefined'&&MOBILE)?1:2;GFX.bad=GFX.good=0;saveGfx();applyGfx()};
  if(f)f.onclick=()=>{GFX.fps=!GFX.fps;saveGfx();gfxLabels()};
  if(s)s.onclick=()=>{GFX.shOff=!GFX.shOff;saveGfx();applyGfx()};
}

// ---------- 4. HUD: sirf badalne par DOM likho ----------
const _UI={};
function _el(id){return _UI[id]||(_UI[id]={e:document.getElementById(id)})}
function uiTxt(id,v){const u=_el(id);if(u.t!==v){u.t=v;u.e.textContent=v}}
function uiHtml(id,v){const u=_el(id);if(u.h!==v){u.h=v;u.e.innerHTML=v}}
function uiDisp(id,v){const u=_el(id);if(u.d!==v){u.d=v;u.e.style.display=v}}
function uiCls(id,c,on){const u=_el(id);on=!!on;if(u['c'+c]!==on){u['c'+c]=on;u.e.classList.toggle(c,on)}}
let uiHP=-1;
function uiHealth(hp){
  hp=Math.round(hp);if(hp===uiHP)return;uiHP=hp;
  const hf=document.getElementById('hf');hf.style.width=hp+'%';
  hf.style.background=hp>55?'linear-gradient(90deg,#43a047,#76ff03)':hp>25?'linear-gradient(90deg,#f9a825,#ffee58)':'linear-gradient(90deg,#c62828,#ff5252)';
}

// ---------- 5. Shadow snapping ----------
// Sun ke shadow-camera ko light-space ke texel grid par snap karte hain, warna chalte waqt shadow jhilmilate hain.
const _sd=(()=>{const x=85,y=140,z=45,l=Math.hypot(x,y,z),zx=x/l,zy=y/l,zz=z/l;let ax=zz,az=-zx;const al=Math.hypot(ax,az);ax/=al;az/=al;   // x = up(0,1,0) x z
  return{zx,zy,zz,xx:ax,xz:az,yx:zy*az,yy:zz*ax-zx*az,yz:-zy*ax}})();      // y = z x x
function snapSun(){
  const T=2*sc2.right/sun.shadow.mapSize.x,tx=P.x,ty=P.y,tz=P.z;
  const px=tx*_sd.xx+tz*_sd.xz,py=tx*_sd.yx+ty*_sd.yy+tz*_sd.yz,dx=Math.round(px/T)*T-px,dy=Math.round(py/T)*T-py;
  const sx=tx+_sd.xx*dx+_sd.yx*dy,sy=ty+_sd.yy*dy,sz=tz+_sd.xz*dx+_sd.yz*dy;
  sun.target.position.set(sx,sy,sz);sun.position.set(sx+85,sy+140,sz+45);
}
