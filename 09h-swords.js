// Code se bani 10 talwarein (koi .glb file nahi chahiye).
// Har talwar ka apna design/stats hai aur wo map par alag-alag jagah loot me milti hai.
// Origin = muththa (grip) ka beech, blade +Y me, dhaar (edge) -Z (aage) ki taraf, chapta side ±X.
// Is file me THREE sirf SWG.mesh()/swordObj() me use hota hai; baaki geometry pure JS hai (Node me test ho sakti hai).
const SWG=(function(){
  const TAU=Math.PI*2;
  const g0=()=>({p:[],n:[]});
  // triangle jodo: winding hamesha bahar ki taraf (normal ke hisaab se) theek kar deta hai
  function T(g,a,b,c,na,nb,nc,flat){
    const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
    let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz);if(l<1e-14)return;
    nx/=l;ny/=l;nz/=l;
    if(nx*(na[0]+nb[0]+nc[0])+ny*(na[1]+nb[1]+nc[1])+nz*(na[2]+nb[2]+nc[2])<0){let t=b;b=c;c=t;t=nb;nb=nc;nc=t;nx=-nx;ny=-ny;nz=-nz}
    if(flat){na=nb=nc=[nx,ny,nz]}
    g.p.push(a[0],a[1],a[2],b[0],b[1],b[2],c[0],c[1],c[2]);
    g.n.push(na[0],na[1],na[2],nb[0],nb[1],nb[2],nc[0],nc[1],nc[2]);
  }
  const nrm=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l]};
  function rot(v,r){let[x,y,z]=v;const[rx,ry,rz]=r;
    if(rz){const c=Math.cos(rz),s=Math.sin(rz);[x,y]=[x*c-y*s,x*s+y*c]}
    if(ry){const c=Math.cos(ry),s=Math.sin(ry);[x,z]=[x*c+z*s,-x*s+z*c]}
    if(rx){const c=Math.cos(rx),s=Math.sin(rx);[y,z]=[y*c-z*s,y*s+z*c]}
    return[x,y,z]}
  // o:{s:[sx,sy,sz],r:[rx,ry,rz],p:[x,y,z]}  (pehle scale, phir rotate, phir move)
  function xf(g,o){
    const s=o.s||[1,1,1],r=o.r||[0,0,0],p=o.p||[0,0,0];
    for(let i=0;i<g.p.length;i+=3){
      let v=rot([g.p[i]*s[0],g.p[i+1]*s[1],g.p[i+2]*s[2]],r);g.p[i]=v[0]+p[0];g.p[i+1]=v[1]+p[1];g.p[i+2]=v[2]+p[2];
      v=nrm(rot([g.n[i]/s[0],g.n[i+1]/s[1],g.n[i+2]/s[2]],r));g.n[i]=v[0];g.n[i+1]=v[1];g.n[i+2]=v[2];
    }
    return g;
  }
  function box(w,h,d){
    const g=g0(),x=w/2,y=h/2,z=d/2;
    const F=[[[1,0,0],[x,-y,-z],[x,y,-z],[x,y,z],[x,-y,z]],[[-1,0,0],[-x,-y,z],[-x,y,z],[-x,y,-z],[-x,-y,-z]],
             [[0,1,0],[-x,y,-z],[-x,y,z],[x,y,z],[x,y,-z]],[[0,-1,0],[-x,-y,z],[-x,-y,-z],[x,-y,-z],[x,-y,z]],
             [[0,0,1],[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]],[[0,0,-1],[x,-y,-z],[-x,-y,-z],[-x,y,-z],[x,y,-z]]];
    for(const[n,a,b,c,d2]of F){T(g,a,b,c,n,n,n,1);T(g,a,c,d2,n,n,n,1)}
    return g;
  }
  function cyl(rt,rb,h,seg=10){
    const g=g0(),sl=(rb-rt)/h;
    for(let i=0;i<seg;i++){
      const a0=i/seg*TAU,a1=(i+1)/seg*TAU,c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1);
      const n0=nrm([c0,sl,s0]),n1=nrm([c1,sl,s1]);
      const A=[rt*c0,h/2,rt*s0],B=[rt*c1,h/2,rt*s1],C=[rb*c1,-h/2,rb*s1],D=[rb*c0,-h/2,rb*s0];
      T(g,A,B,C,n0,n1,n1);T(g,A,C,D,n0,n1,n0);
      if(rt>0)T(g,[0,h/2,0],B,A,[0,1,0],[0,1,0],[0,1,0],1);
      if(rb>0)T(g,[0,-h/2,0],D,C,[0,-1,0],[0,-1,0],[0,-1,0],1);
    }
    return g;
  }
  function sphere(r,ws=10,hs=7){
    const g=g0(),P=(i,j)=>{const th=j/hs*Math.PI,ph=i/ws*TAU;return[Math.sin(th)*Math.cos(ph),Math.cos(th),Math.sin(th)*Math.sin(ph)]};
    for(let j=0;j<hs;j++)for(let i=0;i<ws;i++){
      const a=P(i,j),b=P(i+1,j),c=P(i+1,j+1),d=P(i,j+1),m=v=>[v[0]*r,v[1]*r,v[2]*r];
      if(j>0)T(g,m(a),m(b),m(c),a,b,c);
      if(j<hs-1)T(g,m(a),m(c),m(d),a,c,d);
    }
    return g;
  }
  // path ke saath gol tube (knuckle guard, tassel, D-guard ke liye)
  function tube(path,rad,seg=7){
    const g=g0(),n=path.length,R=typeof rad==='function'?rad:(()=>rad),rings=[];
    let N=null;
    for(let i=0;i<n;i++){
      const a=path[Math.max(0,i-1)],b=path[Math.min(n-1,i+1)],t=nrm([b[0]-a[0],b[1]-a[1],b[2]-a[2]]);
      if(!N){const ax=Math.abs(t[1])<0.9?[0,1,0]:[1,0,0];N=nrm([t[1]*ax[2]-t[2]*ax[1],t[2]*ax[0]-t[0]*ax[2],t[0]*ax[1]-t[1]*ax[0]])}
      else{const d=N[0]*t[0]+N[1]*t[1]+N[2]*t[2];N=nrm([N[0]-t[0]*d,N[1]-t[1]*d,N[2]-t[2]*d])}
      const B=[t[1]*N[2]-t[2]*N[1],t[2]*N[0]-t[0]*N[2],t[0]*N[1]-t[1]*N[0]],r=R(i/(n-1)),ring=[];
      for(let k=0;k<=seg;k++){const ph=k/seg*TAU,c=Math.cos(ph),s=Math.sin(ph),nn=[N[0]*c+B[0]*s,N[1]*c+B[1]*s,N[2]*c+B[2]*s];
        ring.push({p:[path[i][0]+nn[0]*r,path[i][1]+nn[1]*r,path[i][2]+nn[2]*r],n:nn})}
      rings.push(ring);
    }
    for(let i=0;i<n-1;i++)for(let k=0;k<seg;k++){
      const a=rings[i][k],b=rings[i][k+1],c=rings[i+1][k+1],d=rings[i+1][k];
      T(g,a.p,b.p,c.p,a.n,b.n,c.n);T(g,a.p,c.p,d.p,a.n,c.n,d.n);
    }
    return g;
  }
  // blade: spine ke saath sweep. o:{y0,len,w(t),h(t),curve(t),dbl}
  // curve(t)>0 -> nok peeche (spine) ki taraf (katana/talwar), <0 -> aage dhaar ki taraf (kukri)
  function blade(o){
    const g=g0(),N=o.N||18,rings=[],H=o.h||(()=>0.0035);
    for(let i=0;i<=N;i++){
      const t=i/N,Y=o.y0+o.len*t,Z=o.curve?o.curve(t):0,e=1e-3,dz=((o.curve?o.curve(Math.min(1,t+e)):0)-(o.curve?o.curve(Math.max(0,t-e)):0))/(Math.min(1,t+e)-Math.max(0,t-e)),
            phi=Math.atan2(dz,o.len),sn=Math.sin(phi),cs=Math.cos(phi),w=Math.max(0.0035,o.w(t)),h=H(t);
      const pts=o.dbl?[[0,w/2],[h,w*0.18],[h,-w*0.18],[0,-w/2],[-h,-w*0.18],[-h,w*0.18]]
                      :[[h,w/2],[-h,w/2],[-h,-w*0.2],[0,-w/2],[h,-w*0.2]];
      let cx=0,cu=0;for(const q of pts){cx+=q[0];cu+=q[1]}cx/=pts.length;cu/=pts.length;
      rings.push({pts:pts.map(q=>[q[0],Y-q[1]*sn,Z+q[1]*cs]),ctr:[cx,Y-cu*sn,Z+cu*cs],tip:[0,Y+0.014*cs,Z+0.014*sn]});
    }
    for(let i=0;i<N;i++){const A=rings[i],B=rings[i+1],m=A.pts.length;
      for(let j=0;j<m;j++){const k=(j+1)%m,mid=[(A.pts[j][0]+A.pts[k][0])/2,(A.pts[j][1]+A.pts[k][1])/2,(A.pts[j][2]+A.pts[k][2])/2],
        out=[mid[0]-A.ctr[0],mid[1]-A.ctr[1],mid[2]-A.ctr[2]];
        T(g,A.pts[j],A.pts[k],B.pts[k],out,out,out,1);T(g,A.pts[j],B.pts[k],B.pts[j],out,out,out,1)}}
    const L=rings[N],m=L.pts.length;
    for(let j=0;j<m;j++){const k=(j+1)%m,mid=[(L.pts[j][0]+L.pts[k][0])/2,(L.pts[j][1]+L.pts[k][1])/2,(L.pts[j][2]+L.pts[k][2])/2],out=[mid[0]-L.ctr[0],mid[1]-L.ctr[1],mid[2]-L.ctr[2]];
      T(g,L.pts[j],L.pts[k],L.tip,out,out,out,1)}
    return g;
  }
  const ss=(a,b,x)=>{x=Math.max(0,Math.min(1,(x-a)/(b-a)));return x*x*(3-2*x)};
  const tp=(t,s,e=1.6)=>t>s?1-Math.pow((t-s)/(1-s),e):1;   // nok ki taraf patla hona
  return{g0,T,xf,box,cyl,sphere,tube,blade,ss,tp,nrm};
})();

// ---------- materials ----------
const SWMAT={
  steel:{c:0xe3e8ec,m:0.30,r:0.28},dsteel:{c:0xb4bcc4,m:0.30,r:0.34},iron:{c:0x434a51,m:0.30,r:0.45},
  brass:{c:0xdcae33,m:0.40,r:0.33},black:{c:0x18191b,m:0.15,r:0.7},leather:{c:0x5d3b22,m:0.05,r:0.85},
  red:{c:0xa11d1d,m:0,r:0.9},white:{c:0xece6d3,m:0,r:0.85},wood:{c:0x6f4b2a,m:0.05,r:0.8},ivory:{c:0xe4dcc0,m:0,r:0.6},
  blue:{c:0x23418c,m:0,r:0.85}
};

// ---------- 10 talwarein ----------
// parts(): [{g,m}] dega. top = nok ki unchai. dmg/dur/reach = vaar ki taakat/samay/pahunch
const SWORDS=[];
(function(){
  const{box,cyl,sphere,tube,blade,xf,ss,tp}=SWG;
  function mk(){const L=[];return{L,add(g,m,o){if(o)xf(g,o);L.push({g,m});return g}}}
  function grip(S,hl,r,mat,wmat,n,r2){S.add(cyl(r,r2||r*1.06,hl,10),mat);for(let i=0;i<n;i++)S.add(cyl(r*1.13,r*1.13,hl/n*0.42,10),wmat,{p:[0,-hl/2+hl*(i+0.5)/n,0]})}
  function def(name,dmg,dur,reach,fn){SWORDS.push({name,dmg,dur,reach,build(){const S=mk();const top=fn(S);return{parts:S.L,top}}})}

  // 1. Talwar (bhaarat): ghumavdaar blade, knuckle guard, disc pommel
  def('Talwar',55,0.42,3.7,S=>{
    const hl=0.17,y0=hl/2+0.012;
    grip(S,hl,0.02,'black','brass',5);
    S.add(box(0.016,0.018,0.15),'brass',{p:[0,hl/2,0]});
    S.add(cyl(0.046,0.04,0.012,14),'brass',{p:[0,-hl/2-0.006,0]});S.add(cyl(0.0,0.014,0.04,8),'brass',{p:[0,-hl/2-0.03,0]});
    S.add(tube([[0,hl/2,-0.072],[0,hl/2-0.02,-0.092],[0,0.0,-0.098],[0,-hl/2+0.02,-0.08],[0,-hl/2,-0.03]],0.0065),'brass');
    S.add(blade({y0,len:0.76,w:t=>(0.040+0.013*Math.sin(Math.PI*Math.min(1,t*0.95)))*tp(t,0.86,1.4),h:t=>0.0042*(1-0.45*t),curve:t=>0.095*t*t}),'steel');
    return y0+0.76;
  });
  // 2. Katana
  def('Katana',58,0.40,4.0,S=>{
    const hl=0.27,y0=hl/2+0.02;
    grip(S,hl,0.0185,'white','black',8);
    S.add(cyl(0.042,0.042,0.008,16),'iron',{p:[0,hl/2+0.004,0]});S.add(cyl(0.044,0.044,0.003,16),'brass',{p:[0,hl/2+0.0095,0]});
    S.add(box(0.012,0.03,0.026),'brass',{p:[0,hl/2+0.026,0]});
    S.add(cyl(0.02,0.021,0.016,10),'black',{p:[0,-hl/2-0.008,0]});
    S.add(blade({y0,len:0.80,w:t=>(0.030-0.005*t)*tp(t,0.93,1.3),h:t=>0.0034,curve:t=>0.05*t*t}),'steel');
    return y0+0.80;
  });
  // 3. Claymore (bhaari, do-haath)
  def('Claymore',90,0.62,4.3,S=>{
    const hl=0.29,y0=hl/2+0.03;
    grip(S,hl,0.021,'leather','iron',7);
    S.add(sphere(0.03,10,7),'iron',{p:[0,-hl/2-0.022,0]});
    S.add(box(0.02,0.026,0.27),'iron',{p:[0,hl/2+0.012,0],r:[0,0,0]});
    S.add(box(0.022,0.03,0.045),'brass',{p:[0,hl/2+0.012,0]});
    S.add(box(0.018,0.028,0.11),'iron',{p:[0,hl/2+0.002,-0.17],r:[-0.55,0,0]});S.add(box(0.018,0.028,0.11),'iron',{p:[0,hl/2+0.002,0.17],r:[0.55,0,0]});
    S.add(blade({y0,len:0.96,dbl:1,w:t=>(0.068-0.02*t)*tp(t,0.86,1.5),h:t=>0.0048*(1-0.35*t),N:22}),'steel');
    return y0+0.96;
  });
  // 4. Machete (chauda cleaver-blade)
  def('Machete',48,0.34,3.3,S=>{
    const hl=0.145,y0=hl/2+0.005;
    S.add(cyl(0.021,0.024,hl,10),'black');for(const y of[-0.04,0.0,0.04])S.add(cyl(0.0245,0.0245,0.008,8),'steel',{p:[0,y,0],r:[0,0,0]});
    S.add(box(0.024,0.014,0.05),'iron',{p:[0,hl/2,0]});
    S.add(blade({y0,len:0.56,w:t=>(0.044+0.038*ss(0,0.6,t))*(t>0.9?1-0.55*(t-0.9)/0.1:1),h:t=>0.0048,curve:t=>0.025*t*t}),'dsteel');
    return y0+0.56;
  });
  // 5. Shamshir (bahut ghumavdaar)
  def('Shamshir',52,0.38,3.8,S=>{
    const hl=0.17,y0=hl/2+0.012;
    S.add(cyl(0.019,0.022,hl,10),'wood');S.add(cyl(0.024,0.024,0.014,10),'brass',{p:[0,hl/2-0.01,0]});S.add(cyl(0.024,0.024,0.014,10),'brass',{p:[0,-hl/2+0.01,0]});
    S.add(box(0.014,0.016,0.1),'brass',{p:[0,hl/2+0.004,0]});S.add(sphere(0.014,8,6),'brass',{p:[0,hl/2+0.004,0.052]});S.add(sphere(0.014,8,6),'brass',{p:[0,hl/2+0.004,-0.052]});
    S.add(sphere(0.028,10,7),'brass',{p:[0,-hl/2-0.018,0],s:[0.8,1,1.2]});
    S.add(blade({y0,len:0.78,w:t=>(0.036-0.007*t)*tp(t,0.9,1.3),h:t=>0.0036,curve:t=>0.17*t*t}),'steel');
    return y0+0.78;
  });
  // 6. Khanda (sidhi, do dhaar, basket hilt)
  def('Khanda',75,0.52,3.9,S=>{
    const hl=0.18,y0=hl/2+0.03;
    grip(S,hl,0.0195,'leather','brass',6);
    S.add(cyl(0.055,0.05,0.01,16),'iron',{p:[0,hl/2+0.005,0]});
    S.add(cyl(0.05,0.055,0.01,16),'iron',{p:[0,-hl/2-0.005,0]});S.add(cyl(0.0,0.02,0.07,8),'brass',{p:[0,-hl/2-0.045,0]});
    S.add(tube([[0,hl/2,-0.05],[0,hl/2-0.03,-0.068],[0,0.0,-0.075],[0,-hl/2+0.03,-0.068],[0,-hl/2,-0.05]],0.007),'brass');
    S.add(box(0.014,0.02,0.1),'brass',{p:[0,hl/2+0.014,0]});
    S.add(blade({y0,len:0.84,dbl:1,w:t=>(0.040+0.03*ss(0,0.65,t))*tp(t,0.84,1.4),h:t=>0.0052*(1-0.3*t)}),'dsteel');
    return y0+0.84;
  });
  // 7. Kukri (aage ki taraf mudi blade)
  def('Kukri',42,0.30,2.9,S=>{
    const hl=0.13,y0=hl/2+0.004;
    S.add(cyl(0.02,0.026,hl,10),'wood');S.add(cyl(0.028,0.028,0.012,10),'brass',{p:[0,-hl/2+0.004,0]});S.add(cyl(0.026,0.026,0.012,10),'brass',{p:[0,hl/2-0.004,0]});
    S.add(cyl(0.032,0.03,0.014,12),'brass',{p:[0,hl/2+0.006,0],s:[0.7,1,1.3]});
    S.add(blade({y0,len:0.38,w:t=>(0.030+0.058*Math.sin(Math.PI*Math.min(1,t*0.82)))*tp(t,0.8,1.2),h:t=>0.0052*(1-0.3*t),curve:t=>-0.095*Math.pow(t,1.7)}),'dsteel');
    return y0+0.38;
  });
  // 8. Gladius (chhoti, patte jaisi)
  def('Gladius',50,0.33,3.2,S=>{
    const hl=0.12,y0=hl/2+0.012;
    S.add(cyl(0.019,0.021,hl,10),'wood');for(const y of[-0.035,0,0.035])S.add(cyl(0.0225,0.0225,0.007,10),'brass',{p:[0,y,0]});
    S.add(sphere(0.026,10,7),'ivory',{p:[0,-hl/2-0.016,0]});
    S.add(box(0.014,0.014,0.082),'brass',{p:[0,hl/2+0.003,0]});S.add(cyl(0.0,0.012,0.012,8),'brass',{p:[0,hl/2+0.012,0]});
    S.add(blade({y0,len:0.50,dbl:1,w:t=>(0.036+0.022*Math.sin(Math.PI*Math.min(1,t*0.75+0.08)))*tp(t,0.68,1.3),h:t=>0.0046}),'steel');
    return y0+0.50;
  });
  // 9. Cutlass (samudri, shell guard)
  def('Cutlass',60,0.44,3.6,S=>{
    const hl=0.135,y0=hl/2+0.01;
    S.add(cyl(0.02,0.022,hl,10),'black');S.add(sphere(0.026,10,7),'brass',{p:[0,-hl/2-0.012,0]});
    S.add(cyl(0.062,0.062,0.008,16),'brass',{p:[0,hl/2+0.004,0.0],s:[0.55,1,1.0],r:[0,0,0]});
    S.add(tube([[0,hl/2,-0.05],[0,hl/2-0.035,-0.082],[0,0,-0.088],[0,-hl/2+0.03,-0.07],[0,-hl/2,-0.03]],0.0065),'brass');
    S.add(blade({y0,len:0.66,w:t=>(0.048-0.008*t)*tp(t,0.9,1.2),h:t=>0.0042,curve:t=>0.07*t*t}),'steel');
    return y0+0.66;
  });
  // 10. Jian (patli sidhi, laal jhaalar)
  def('Jian',56,0.38,4.0,S=>{
    const hl=0.24,y0=hl/2+0.012;
    grip(S,hl,0.0165,'black','brass',6);
    S.add(cyl(0.036,0.036,0.009,16),'brass',{p:[0,hl/2+0.0045,0],s:[0.55,1,1.0]});
    S.add(sphere(0.024,10,7),'brass',{p:[0,-hl/2-0.016,0]});
    S.add(tube([[0,-hl/2-0.03,0],[0.02,-hl/2-0.07,0.01],[0.035,-hl/2-0.12,0.0],[0.03,-hl/2-0.17,-0.01],[0.025,-hl/2-0.22,0]],t=>0.0055*(1+t*0.5),6),'red');
    S.add(sphere(0.011,6,5),'red',{p:[0.025,-hl/2-0.225,0],s:[1,1.6,1]});
    S.add(blade({y0,len:0.86,dbl:1,w:t=>(0.031-0.009*t)*tp(t,0.92,1.2),h:t=>0.0036}),'steel');
    return y0+0.86;
  });
})();

// ---------- THREE me badalna (sirf game me) ----------
const SWCACHE={},SWMATC={};
function swMat(k){const d=SWMAT[k];return SWMATC[k]||(SWMATC[k]=new THREE.MeshStandardMaterial({color:d.c,metalness:d.m,roughness:d.r,side:THREE.DoubleSide}))}
function swordParts(i){
  if(SWCACHE[i])return SWCACHE[i];
  const b=SWORDS[i].build(),by={};
  for(const p of b.parts){(by[p.m]||(by[p.m]={p:[],n:[]}));for(const v of p.g.p)by[p.m].p.push(v);for(const v of p.g.n)by[p.m].n.push(v)}
  const meshes=[];
  for(const m in by){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(by[m].p,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(by[m].n,3));geo.computeBoundingSphere();meshes.push({geo,m})}
  return SWCACHE[i]={meshes,top:b.top};
}
// talwar ka 3D object. scale = size. grip origin par.
function swordObj(i,scale,shadow){
  const sp=swordParts(i),G=new THREE.Group();
  for(const q of sp.meshes){const m=new THREE.Mesh(q.geo,swMat(q.m));m.castShadow=!!shadow;m.frustumCulled=false;G.add(m)}
  G.scale.setScalar(scale||1);G.userData.top=sp.top;return G;
}
