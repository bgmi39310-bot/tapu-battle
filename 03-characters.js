// Soldier rig (player/enemy) and UAZ jeep models
// 7. Realistic PBR Articulated Human Soldier Rig
function mkChar(shirtCol,isEnemy){
  const g=new THREE.Group();
  // StandardMaterial adds PBR Roughness & Metalness for photorealistic shading
  const M=(c,tex=null,r=0.8,m=0.1)=>new THREE.MeshStandardMaterial({color:c,map:tex,roughness:r,metalness:m});
  
  const skinM=M(0xe2b18c,null,0.5,0.1);
  const camoM=M(shirtCol,TEX.camo,0.85,0.05);
  const pantM=M(isEnemy?0x3a2e2b:0x2d3a46,null,0.9,0.05);
  const vestM=M(isEnemy?0x4a2520:0x2e3529,null,0.9,0.1);
  const darkM=M(0x1b1f23,null,0.7,0.3); // Gun/Straps
  const bootM=M(0x16181a,null,0.6,0.2);

  const cy=(rt,rb,h,mt,x,y,z)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,12),mt);m.position.set(x,y,z);return m};
  const sp=(r,mt,x,y,z,sx=1,sy=1,sz=1)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(r,12,10),mt);m.scale.set(sx,sy,sz);m.position.set(x,y,z);return m};
  const bx=(w,h,d,mt,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mt);m.position.set(x,y,z);return m};

  const pel=new THREE.Group();pel.position.set(0,1.0,0);
  const lowerBody=new THREE.Group();
  const hips=sp(0.24,pantM,0,0.02,0,1.15,0.65,0.82);
  const belt=cy(0.245,0.245,0.09,darkM,0,0.08,0);belt.scale.set(1.16,1,0.84);
  lowerBody.add(hips,belt);pel.add(lowerBody);

  const torso=new THREE.Group();torso.position.set(0,1.06,0);
  const bo=cy(0.275,0.225,0.72,camoM,0,0.38,0);bo.scale.set(1.18,1,0.78);
  const vest=cy(0.295,0.265,0.54,vestM,0,0.41,0);vest.scale.set(1.16,1,0.85);
  const p1=bx(0.11,0.15,0.08,darkM,-0.13,0.29,-0.22);
  const p2=bx(0.11,0.15,0.08,darkM,0,0.29,-0.23);
  const p3=bx(0.11,0.15,0.08,darkM,0.13,0.29,-0.22);
  const neck=cy(0.082,0.095,0.15,skinM,0,0.81,0);
  torso.add(bo,vest,p1,p2,p3,neck);

  const hd=new THREE.Group();hd.position.set(0,1.02,0);
  const skull=sp(0.205,skinM,0,0.02,0,0.95,1.08,0.98);
  const jaw=cy(0.155,0.115,0.15,skinM,0,-0.08,-0.02);
  const eyeL=sp(0.025,darkM,-0.068,0.04,-0.185);
  const eyeR=sp(0.025,darkM,0.068,0.04,-0.185);
  const nose=cy(0.017,0.028,0.065,skinM,0,0.0,-0.195);nose.rotation.x=0.35;
  hd.add(skull,jaw,eyeL,eyeR,nose);

  const hm=new THREE.Group();hm.position.set(0,1.06,0);
  const hDome=new THREE.Mesh(new THREE.SphereGeometry(0.242,14,12,0,Math.PI*2,0,1.82),M(0x2d373c,null,0.4,0.6));
  const hVisor=bx(0.35,0.105,0.12,M(0x111518,null,0.1,0.9),0,-0.02,-0.175); // Reflective Visor
  const hSlit=bx(0.27,0.024,0.13,new THREE.MeshBasicMaterial({color:0x90caf9}),0,-0.02,-0.18);
  hm.add(hDome,hVisor,hSlit);
  torso.add(hd,hm);

  const bp=new THREE.Group();bp.position.set(0,0.40,0.25);
  bp.add(bx(0.37,0.48,0.19,M(0x3a4734,null,0.8,0.1),0,0,0),bx(0.29,0.23,0.1,darkM,0,-0.08,0.11));
  bp.visible=!!isEnemy;torso.add(bp);

  const mkLeg=lx=>{
    const hip=new THREE.Group();hip.position.set(lx,0,0);
    const thigh=cy(0.132,0.108,0.46,pantM,0,-0.23,0);
    const knee=new THREE.Group();knee.position.set(0,-0.46,0);
    const kPad=sp(0.106,darkM,0,0,-0.03,1,0.85,1.12);
    const calf=cy(0.104,0.08,0.42,pantM,0,-0.21,0);
    const ank=new THREE.Group();ank.position.set(0,-0.44,0);
    const boot=bx(0.148,0.115,0.29,bootM,0,-0.03,-0.05);
    const sole=bx(0.156,0.04,0.31,darkM,0,-0.08,-0.05);
    ank.add(boot,sole);knee.add(kPad,calf,ank);hip.add(thigh,knee);
    return{hip,knee,ank};
  };
  const legL=mkLeg(-0.15),legR=mkLeg(0.15);
  lowerBody.add(legL.hip,legR.hip);
  const l1=legL.hip,l2=legR.hip,k1=legL.knee,k2=legR.knee,ank1=legL.ank,ank2=legR.ank;

  const mkArm=ax=>{
    const sh=new THREE.Group();sh.position.set(ax,0.62,0);
    const shld=sp(0.115,camoM,0,0,0,1.05,0.95,1);
    const uArm=cy(0.090,0.076,0.32,camoM,0,-0.16,0);
    const elb=new THREE.Group();elb.position.set(0,-0.31,0);
    const elbJ=sp(0.076,camoM,0,0,0);
    const fArm=cy(0.074,0.062,0.31,skinM,0,-0.155,0);
    const glove=sp(0.068,darkM,0,-0.32,0,0.95,1.15,0.95);
    elb.add(elbJ,fArm,glove);sh.add(shld,uArm,elb);
    return{sh,elb};
  };
  const armL=mkArm(-0.30),armR=mkArm(0.30);
  torso.add(armL.sh,armR.sh);
  const a1=armL.sh,a2=armR.sh,el1=armL.elb,el2=armR.elb;

  // PBR M416 Gun
  const rf=new THREE.Group();rf.position.set(0.11,0.36,-0.32);rf.rotation.y=0.08;
  const gunM = M(0x1f2226,null,0.4,0.8);
  const rBody=bx(0.075,0.13,0.48,gunM,0,0,0);
  const rHand=bx(0.068,0.095,0.36,M(0x2a2f35,null,0.6,0.3),0,0.01,-0.38);
  const rFgrip=cy(0.022,0.026,0.13,darkM,0,-0.09,-0.34);
  const rPGrip=bx(0.055,0.15,0.08,darkM,0,-0.11,0.12);rPGrip.rotation.x=-0.28;
  const rBrl=cy(0.018,0.018,0.42,gunM,0,0.015,-0.68);rBrl.rotation.x=Math.PI/2;
  const rStock=bx(0.06,0.15,0.28,M(0x5c4938,null,0.7,0.1),0,-0.02,0.34);
  const rMag=bx(0.055,0.23,0.09,darkM,0,-0.16,-0.06);rMag.rotation.x=0.22;
  const rScope=cy(0.032,0.032,0.2,darkM,0,0.11,-0.02);rScope.rotation.x=Math.PI/2;
  const mFl=new THREE.Mesh(new THREE.ConeGeometry(0.14,0.38,8),new THREE.MeshBasicMaterial({color:0xffea00,transparent:true,opacity:0.9}));
  mFl.rotation.x=-Math.PI/2;mFl.position.set(0,0.015,-0.98);mFl.visible=false;
  rf.add(rBody,rHand,rFgrip,rPGrip,rBrl,rStock,rMag,rScope,mFl);torso.add(rf);

  const poseArms=(hasGun,wph,stride,isSprint,aimPitch=0,recoilKick=0)=>{
    if(hasGun){
      const spTilt=isSprint?-0.22:0;const pOff=Math.max(-0.35,Math.min(0.35,aimPitch*0.5));
      a2.rotation.set(0.38+pOff+recoilKick*1.8+spTilt,-0.32,-0.24);el2.rotation.set(1.22-recoilKick*1.5,0.18,0);
      a1.rotation.set(0.92+pOff+recoilKick*1.4+spTilt,0.58,0.48);el1.rotation.set(0.84-recoilKick*1.2,-0.28,0);
      rf.position.set(0.11,0.36+pOff*0.08,-0.32+recoilKick*0.35);rf.rotation.set(pOff*0.6+spTilt*0.7,0.08+(isSprint?0.32:0),0);
    }else{
      const sw=Math.sin(wph)*0.75*stride;
      a1.rotation.set(sw,0.08,0.08);el1.rotation.set(0.55+Math.max(0,sw)*0.35,0,0);
      a2.rotation.set(-sw,-0.08,-0.08);el2.rotation.set(0.55+Math.max(0,-sw)*0.35,0,0);
    }
  };
  poseArms(!!isEnemy,0,0,false,0,0);
  g.add(pel,torso);
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
  g.scale.setScalar(0.78);
  return{g,pel,lowerBody,torso,bo,vest,hd,hm,bp,l1,l2,k1,k2,ank1,ank2,a1,a2,el1,el2,rf,mFl,poseArms};
}

const pl=mkChar(0x3b593f,false);scene.add(pl.g);pl.g.rotation.order='YXZ';

const gv=new THREE.Group();
{
  const dm=new THREE.MeshStandardMaterial({color:0x1e2226,roughness:0.4,metalness:0.8});
  const sm=new THREE.MeshStandardMaterial({color:0x5c4938,roughness:0.7,metalness:0.1});
  const rec=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.12,0.65),dm);
  const brl=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.45,10),dm);brl.rotation.x=Math.PI/2;brl.position.set(0,0.02,-0.5);
  const opt=new THREE.Mesh(new THREE.CylinderGeometry(0.032,0.032,0.22,12),dm);opt.rotation.x=Math.PI/2;opt.position.set(0,0.1,-0.05);
  const stk=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.15,0.28),sm);stk.position.set(0,-0.03,0.4);
  const fpFl=new THREE.Mesh(new THREE.ConeGeometry(0.12,0.32,8),new THREE.MeshBasicMaterial({color:0xffea00}));
  fpFl.rotation.x=-Math.PI/2;fpFl.position.set(0,0.02,-0.82);fpFl.visible=false;
  gv.add(rec,brl,opt,stk,fpFl);gv.mFl=fpFl;
}
gv.position.set(0.24,-0.23,-0.55);cam.add(gv);

// PBR UAZ 4x4 Military Jeep
const jp=new THREE.Group();const jWheels=[];
{
  const bodyM=new THREE.MeshStandardMaterial({color:0x3b5332,map:TEX.camo,bumpMap:TEX.camo,bumpScale:0.02,roughness:0.45,metalness:0.55});
  const darkM=new THREE.MeshStandardMaterial({color:0x1b1e22,roughness:0.7,metalness:0.3});
  const glassM=new THREE.MeshStandardMaterial({color:0x90caf9,transparent:true,opacity:0.45,roughness:0.1,metalness:0.9});
  const tireM=new THREE.MeshStandardMaterial({color:0x181818,roughness:0.9,metalness:0.1});
  const rimM=new THREE.MeshStandardMaterial({color:0x788275,roughness:0.3,metalness:0.8});

  const chassis=new THREE.Mesh(new THREE.BoxGeometry(2.55,0.85,4.7),bodyM);chassis.position.y=0.92;
  const hood=new THREE.Mesh(new THREE.BoxGeometry(2.35,0.45,1.65),bodyM);hood.position.set(0,1.4,-1.45);
  const bumper=new THREE.Mesh(new THREE.BoxGeometry(2.65,0.26,0.3),darkM);bumper.position.set(0,0.62,-2.4);
  const cabin=new THREE.Mesh(new THREE.BoxGeometry(2.35,0.88,2.45),new THREE.MeshStandardMaterial({color:0x5f6756,roughness:0.8,metalness:0.2}));cabin.position.set(0,1.78,0.48);
  const wshield=new THREE.Mesh(new THREE.BoxGeometry(2.15,0.72,0.08),glassM);wshield.position.set(0,1.78,-0.78);wshield.rotation.x=-0.2;
  const seatF=new THREE.Mesh(new THREE.BoxGeometry(1.9,0.55,0.6),darkM);seatF.position.set(0,1.25,-0.1);
  const seatB=new THREE.Mesh(new THREE.BoxGeometry(1.9,0.55,0.6),darkM);seatB.position.set(0,1.25,1.1);

  const hlM=new THREE.MeshBasicMaterial({color:0xfff9c4});
  const hl1=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,0.08,12),hlM);hl1.rotation.x=Math.PI/2;hl1.position.set(-0.82,1.08,-2.36);
  const hl2=hl1.clone();hl2.position.x=0.82;

  const mkWheel=(wx,wy,wz)=>{
    const wg=new THREE.Group();wg.position.set(wx,wy,wz);
    const t=new THREE.Mesh(new THREE.CylinderGeometry(0.52,0.52,0.38,16),tireM);t.rotation.z=Math.PI/2;
    const r=new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.28,0.4,12),rimM);r.rotation.z=Math.PI/2;
    const bar=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.48,0.1),darkM);
    wg.add(t,r,bar);return wg;
  };
  for(const[wx,wz]of[[-1.32,-1.52],[1.32,-1.52],[-1.32,1.52],[1.32,1.52]]){const w=mkWheel(wx,0.52,wz);jp.add(w);jWheels.push(w)}
  const spare=mkWheel(0,1.2,2.48);spare.rotation.y=Math.PI/2;
  const bc=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,65,8),new THREE.MeshBasicMaterial({color:0x00e5ff,transparent:true,opacity:0.28,fog:false}));bc.position.y=33;
  jp.add(chassis,hood,bumper,cabin,wshield,seatF,seatB,hl1,hl2,spare,bc);
  jp.traverse(o=>{if(o.isMesh&&o!==bc){o.castShadow=true;o.receiveShadow=true}});
}
scene.add(jp);
