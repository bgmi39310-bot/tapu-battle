// Animation ka hisaab-kitaab (sirf math, THREE ki zaroorat nahi) - Node me test ho sakta hai.
//  - walkCycle : chalne/daudne ka cycle (jangh + ghutna + pair + shareer ka bob)
//  - meleeArms : talwar pakde hue idle / run / do tarah ke vaar (teesra-person)
//  - meleeFP   : talwar ka pehle-person (camera) view
const aE=x=>x<=0?0:x>=1?1:x*x*(3-2*x);          // smoothstep
const aL=(a,b,t)=>a+(b-a)*t;

// c = mkChar() ka object. ph = walk phase, str = 0..1 (kitna tez), spr = 0..1 (sprint)
function walkCycle(c,ph,str,spr){
  spr=spr||0;
  const amp=0.8*str*(1+0.22*spr),s=Math.sin(ph),cs=Math.cos(ph),kf=1.15*str*(1+0.25*spr);
  const th1=s*amp,th2=-s*amp;
  const f1=(0.12+0.88*Math.max(0,cs))*kf,f2=(0.12+0.88*Math.max(0,-cs))*kf;   // jangh aage badhte waqt ghutna sabse zyada mudta hai
  c.l1.rotation.x=th1;c.l2.rotation.x=th2;
  if(c.k1){c.k1.rotation.x=-f1;c.k2.rotation.x=-f2}                           // ghutna peeche ki taraf mudta hai
  if(c.ank1){c.ank1.rotation.x=f1-th1;c.ank2.rotation.x=f2-th2}               // pair zameen ke samanantar
  const bob=0.026*str*Math.cos(2*ph);                                          // dono pair ke beech sabse neeche
  if(c.pel){c.pel.position.y=1.0+bob}
  if(c.torso){c.torso.position.y=1.06+bob}
}

// ---- vaar ke keyframes (teesra-person). ax/az/ay = daayen kandhe ka x/z/y ghumav, e = kohni, tw = dhad ka ghumav,
//      ln = aage/peeche jhukna (+ peeche), tl = talwar ki kalai (-aage, +peeche), la = baayen haath ka aage-peeche
const SL_A={   // upar-daayen se neeche-baayen tirchha vaar
  W:{ax:2.55,az:0.50,ay:0.0,e:1.55,tw:-0.55,ln:0.14,tl:0.55,lx:-0.55,lz:-0.45},
  S:{ax:0.85,az:-0.55,ay:0.25,e:0.45,tw:0.72,ln:-0.30,tl:-0.35,lx:0.45,lz:0.25}
};
const SL_B={   // baayen se daayen seedha (backhand) vaar
  W:{ax:1.45,az:-0.95,ay:0.0,e:0.80,tw:0.78,ln:-0.04,tl:0.10,lx:0.3,lz:0.35},
  S:{ax:1.52,az:1.00,ay:0.0,e:0.30,tw:-0.78,ln:-0.18,tl:-0.12,lx:-0.4,lz:-0.45}
};
const SL_K=['ax','az','ay','e','tw','ln','tl','lx','lz'];
function slashAt(s,combo,B){          // B = base (idle/run) values
  const D=combo?SL_B:SL_A,W=D.W,S=D.S,o={};
  for(const k of SL_K){
    let v;
    if(s<0.26)v=aL(B[k],W[k],aE(s/0.26));                  // taiyaari (windup)
    else if(s<0.60)v=aL(W[k],S[k],aE((s-0.26)/0.34));     // vaar
    else v=aL(S[k],B[k],aE((s-0.60)/0.40));                // wapas
    o[k]=v;
  }
  return o;
}
// base pose: idle se run tak, spr = sprint (talwar peeche/neeche)
function meleeBase(ph,str,spr,tm){
  const s=Math.sin(ph),br=Math.sin(tm*1.7)*0.02;
  const o={
    ax:aL(0.55+br,0.45+s*0.2*str,str),az:0.15,ay:-0.08,e:1.15,
    tw:-s*0.14*str,ln:-0.05*str,tl:-0.45,
    lx:aL(0.06+br,-s*0.95*str*(1+0.2*spr),str),lz:-0.1,
    le:0.3+Math.max(0,-s)*0.9*str+0.3*spr
  };
  o.ax=aL(o.ax,0.22+s*0.12*str,spr);o.e=aL(o.e,0.98,spr);o.tl=aL(o.tl,0.65,spr);o.ln-=0.1*spr;
  return o;
}
// c = mkChar object, o={ph,str,spr(0..1),s(-1 ya 0..1),combo,tm}. Return: talwar ki kalai tilt (hand.rotation.x = -PI/2 + tl)
function meleeArms(c,o){
  const B=meleeBase(o.ph,o.str,o.spr,o.tm),V=o.s>=0?slashAt(o.s,o.combo,B):B,k=o.s>=0?1:0;
  c.a2.rotation.set(V.ax,V.ay,V.az);c.el2.rotation.set(V.e,0,0);
  c.a1.rotation.set(V.lx,0.05,V.lz);c.el1.rotation.set(o.s>=0?0.55:B.le,0,0);
  c.torso.rotation.set(V.ln,V.tw,0);
  if(c.pel)c.pel.rotation.set(0,V.tw*0.3,0);
  return V.tl;
}

// ---- pehla-person (camera ke saath) ----
const FP_REST={px:0.40,py:-0.33,pz:-0.66,rx:-0.45,rz:0.32,roll:1.0};
const FP_A={W:{px:0.60,py:0.06,pz:-0.58,rx:-0.05,rz:-0.85,roll:1.1},S:{px:-0.36,py:-0.55,pz:-0.78,rx:-0.95,rz:1.55,roll:0.95}};
const FP_B={W:{px:-0.50,py:-0.30,pz:-0.62,rx:-0.40,rz:1.20,roll:0.9},S:{px:0.62,py:-0.26,pz:-0.76,rx:-0.55,rz:-1.15,roll:1.2}};
const FP_K=['px','py','pz','rx','rz','roll'];
function fpAt(s,combo,B){
  const D=combo?FP_B:FP_A,o={};
  for(const k of FP_K){
    let v;
    if(s<0.26)v=aL(B[k],D.W[k],aE(s/0.26));
    else if(s<0.60)v=aL(D.W[k],D.S[k],aE((s-0.26)/0.34));
    else v=aL(D.S[k],B[k],aE((s-0.60)/0.40));
    o[k]=v;
  }
  return o;
}
// pv = pivot group, rl = roll group (talwar ka chapta side kitna dikhe). Sets position/rotation.
function meleeFP(pv,rl,o){
  const s=Math.sin(o.ph),B={};
  for(const k of FP_K)B[k]=FP_REST[k];
  B.px+=s*0.012*o.str;B.py+=Math.sin(o.tm*1.7)*0.006+Math.cos(2*o.ph)*0.012*o.str;
  // sprint: talwar neeche/peeche
  B.px=aL(B.px,0.42,o.spr);B.py=aL(B.py,-0.46,o.spr);B.pz=aL(B.pz,-0.55,o.spr);B.rx=aL(B.rx,-0.05,o.spr);B.rz=aL(B.rz,0.85,o.spr);
  const V=o.s>=0?fpAt(o.s,o.combo,B):B;
  pv.position.set(V.px,V.py,V.pz);pv.rotation.set(V.rx,0,V.rz);rl.rotation.set(0,V.roll,0);
  return V;
}
