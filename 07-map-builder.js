// Procedural map: terrain, houses, trees, props
function build(sd){
  if(grp)scene.remove(grp);grp=new THREE.Group();scene.add(grp);
  PJ.forEach(p=>scene.remove(p.m));FZ.forEach(f=>scene.remove(f.m));FX.forEach(f=>scene.remove(f.m));
  OB.length=BX.length=WM.length=LT.length=HS.length=PJ.length=FZ.length=FX.length=FL.length=RP.length=WIN.length=0;
  EN.forEach(e=>scene.remove(e.g));EN.length=0;

  const r=rng(sd),nz=mkNoise(r),tc2=TH[th],q=tc2.c,ph=r()*6,rcv=z=>Math.sin(z/70+ph)*45+Math.sin(z/26)*9;
  const H0=(x,z)=>{const d=Math.hypot(x,z)/(S*.46),m=Math.max(0,1-d*d);return(nz(x/110+20,z/110+20)-.5)*22*m+8*Math.min(1,m*3)-3};
  const V=[];
  for(let k=0,t=0;k<6&&t<3000;t++){const a=(r()-.5)*S*.68,b=(r()-.5)*S*.68;if(H0(a,b)>2.2&&V.every(v=>Math.hypot(v[0]-a,v[1]-b)>90)){V.push([a,b]);k++}}
  if(!V.length)V.push([0,0]);
  const H=(x,z)=>{
    let y=H0(x,z);
    for(const[a,b]of V){const w=Math.max(0,1-Math.hypot(x-a,z-b)/56);if(w>0){const s=w*w*(3-2*w);y=y*(1-s)+4.2*s}}
    const rv=Math.max(0,1-Math.abs(x-rcv(z))/12)*Math.max(0,Math.min(1,(z+20)/60));
    return y*(1-rv)-1.5*rv;
  };hmap=H;
  const seg=(x,z)=>{
    let md=99;for(let i=0;i<V.length-1;i++){const[ax,az]=V[i],[bx,bz]=V[i+1],dx=bx-ax,dz=bz-az;let u=((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz);u=Math.max(0,Math.min(1,u));md=Math.min(md,Math.hypot(x-ax-u*dx,z-az-u*dz));}
    return md;
  };

  const g=new THREE.PlaneGeometry(S,S,N,N);g.rotateX(-Math.PI/2);
  const p=g.attributes.position,cl=new Float32Array(p.count*3),c=new THREE.Color();
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i),y=H(x,z);p.setY(i,y);
    c.set(y<.9?q[0]:y<8?q[1]:y<14?q[2]:y<20?q[3]:q[4]);
    if(y>.9&&seg(x,z)<3.6)c.set(0x42464c);
    const j=(nz(x/16+99,z/16+99)-.5)*.22+(Math.sin(i*12.9)*.5+.5)*.03;
    cl.set([Math.max(0,c.r+j),Math.max(0,c.g+j),Math.max(0,c.b+j)],i*3);
  }
  g.setAttribute('color',new THREE.BufferAttribute(cl,3));g.computeVertexNormals();
  const tm=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,map:TEX.ground,bumpMap:TEX.ground,bumpScale:0.04,roughness:0.85,metalness:0.05}));
  tm.receiveShadow=true;grp.add(tm);

  const T=[];
  for(let t=0;T.length<tc2.nt&&t<9000;t++){
    const x=(r()-.5)*S*.92,z=(r()-.5)*S*.92,y=H(x,z);
    if(y>1.5&&y<14&&V.every(v=>Math.hypot(v[0]-x,v[1]-z)>42)&&seg(x,z)>6)T.push([x,y,z]);
  }
  const leafMat=new THREE.MeshStandardMaterial({color:tc2.tr,flatShading:true,roughness:0.95});
  const trunkMat=new THREE.MeshStandardMaterial({color:0x5c3e24,map:TEX.wood,bumpMap:TEX.wood,bumpScale:0.03,roughness:0.9});
  const tr=new THREE.InstancedMesh(new THREE.ConeGeometry(3.1,8.5,7),leafMat,T.length);
  const t2=new THREE.InstancedMesh(new THREE.ConeGeometry(2.3,6.2,7),leafMat,T.length);
  const tk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.42,.58,4.2,7),trunkMat,T.length);
  const m=new THREE.Matrix4();tr.castShadow=tk.castShadow=t2.castShadow=true;
  T.forEach(([x,y,z],i)=>{
    const s=.8+r()*.5;OB.push([x,z,.7*s,22]);
    m.makeScale(s,s,s).setPosition(x,y+8*s,z);tr.setMatrixAt(i,m);
    m.makeScale(s,s,s).setPosition(x,y+2*s,z);tk.setMatrixAt(i,m);
    m.makeScale(s,s,s).setPosition(x,y+11.6*s,z);t2.setMatrixAt(i,m);
  });
  grp.add(tr,tk,t2);

  const scat=(geo,col,n,fy,hit)=>{
    const A=[];
    for(let t=0;A.length<n&&t<4000;t++){
      const x=(r()-.5)*S*.92,z=(r()-.5)*S*.92,y=H(x,z);
      if(y>.9&&y<14&&seg(x,z)>5&&V.every(v=>Math.hypot(v[0]-x,v[1]-z)>38))A.push([x,y,z]);
    }
    const im=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({color:col,flatShading:true,roughness:0.9}),A.length);
    im.castShadow=im.receiveShadow=true;
    A.forEach(([x,y,z],i)=>{
      const s=.7+r()*1.1;m.makeScale(s,s*fy,s).setPosition(x,y+.4*s*fy,z);im.setMatrixAt(i,m);
      if(hit===true)OB.push([x,z,.9*s,2.8]);else if(hit==='b')OB.push([x,z,.85*s,1.05,1]);
    });
    grp.add(im);
  };
  scat(new THREE.DodecahedronGeometry(1,0),0x757873,400,.8,true);scat(new THREE.IcosahedronGeometry(1,0),tc2.tr,680,.65,'b');

  const bx=(x,y,z,w,h,d,col,sol,tex=null,minY=0,topY=0,rM=0.9,mM=0.1)=>{
    const b=new THREE.Mesh(UB,new THREE.MeshStandardMaterial({color:col,map:tex,bumpMap:tex,bumpScale:0.04,roughness:rM,metalness:mM}));
    b.scale.set(w,h,d);b.position.set(x,y,z);b.castShadow=b.receiveShadow=true;grp.add(b);WM.push(b);
    const tY=topY||(y+h/2);
    if(sol===2){BX.push([x-w/2,z-d/2,x+w/2,z+d/2,minY,tY]);FL.push([x-w/2,z-d/2,x+w/2,z+d/2,tY])}
    else if(sol)BX.push([x-w/2,z-d/2,x+w/2,z+d/2,minY,tY]);
    return b;
  };

  const house=(cx,rawG0,cz,big)=>{
    const W=big?24:16,D=big?18:12,t=0.44,hh=big?7.6:3.8,dw=3;
    let maxT=rawG0,minT=rawG0;
    for(let ix=-2;ix<=2;ix++){for(let iz=-2;iz<=2;iz++){const ty=H(cx+ix*(W*0.28),cz+iz*(D*0.28));if(ty>maxT)maxT=ty;if(ty<minT)minT=ty;}}
    if(maxT-minT>1.8)return;   // dhalaan wali jagah par ghar nahi (unche chabutre se bachne ke liye)
    const g0=maxT+0.15,roofTopY=g0+hh+0.45;
    const w=new THREE.Color().setHSL(0.08+r()*0.08,0.25,0.78),yy=g0+hh/2,sw=(W-dw)/2;

    const fndH=Math.max(8,g0-minT+3);
    bx(cx,g0-fndH/2,cz,W+0.8,fndH,D+0.8,0x736f68,1,TEX.wall,minT-4,g0+0.08);
    FL.push([cx-W/2-0.8,cz-D/2-0.8,cx+W/2+0.8,cz+D/2+0.8,g0+0.08]);

    const frontY=H(cx,cz+D/2+2.0);
    if(g0-frontY>0.25){
      RP.push([cx-2.5,cz+D/2,cx+2.5,cz+D/2+2.8,frontY,g0+0.08]);
      const stA=Math.atan2(g0-frontY,2.8);
      bx(cx,(g0+frontY)/2,cz+D/2+1.4,4.6,0.3,2.9/Math.cos(stA),0x807c74,0,TEX.roof).rotation.x=stA;
    }

    bx(cx,yy,cz-D/2,W,hh,t,w,1,TEX.wall,g0-0.2,roofTopY);
    const side=x=>{
      const ww=2.5;let z0=cz-D/2;
      for(const zc of[cz-D/4,cz+D/4]){
        const a=zc-ww/2;
        bx(x,yy,(z0+a)/2,t,hh,a-z0,w,1,TEX.wall,g0-0.2,roofTopY);
        bx(x,g0+0.425,zc,t,0.85,ww,w,1,TEX.wall,g0-0.2,g0+0.85);
        bx(x,g0+0.86,zc,t+0.18,0.08,ww+0.1,0x4e342e,0,TEX.wood);
        FL.push([x-0.75,a+0.15,x+0.75,a+ww-0.15,g0+0.88,1]);
        bx(x,g0+(hh+2.35)/2,zc,t,hh-2.35,ww,w,1,TEX.wall,g0+2.35,roofTopY);
        z0=a+ww;
      }
      bx(x,yy,(z0+cz+D/2)/2,t,hh,cz+D/2-z0,w,1,TEX.wall,g0-0.2,roofTopY);
    };
    side(cx-W/2);side(cx+W/2);
    bx(cx-W/2+sw/2,yy,cz+D/2,sw,hh,t,w,1,TEX.wall,g0-0.2,roofTopY);
    bx(cx+W/2-sw/2,yy,cz+D/2,sw,hh,t,w,1,TEX.wall,g0-0.2,roofTopY);
    bx(cx,g0+3.25,cz+D/2,dw+0.4,0.35,t+0.16,0x4e342e,1,TEX.wood,g0+3.05,roofTopY);

    const F=(dx,dz,fw,fh,fd,c,tx=TEX.wood)=>bx(cx+dx,g0+fh/2+0.08,cz+dz,fw,fh,fd,c,fh<2.0?2:1,tx,g0,g0+fh+0.08);
    F(3,-D/2+1.5,2,0.9,1.1,0x8d6e63,TEX.wood);F(0,-D/2+0.8,3,2.2,0.5,0x4e342e,TEX.wood);
    F(W/2-1.2,D/2-1.5,1.2,1.15,1.2,0xffffff,TEX.crate);F(W/2-1.3,D/2-2.9,1.2,1.85,1.2,0xffffff,TEX.crate);

    if(big){
      const sy=g0+3.8,L=cx-W/2,a=Math.atan2(3.8,D-5);
      bx(cx,g0+5.6,cz+D/2,dw,3.8,t,w,0,TEX.wall);
      bx(cx,sy-0.15,cz-D/2+2.25,W,0.3,4.5,0x8a8f94,0,TEX.roof);
      FL.push([cx-W/2,cz-D/2,cx+W/2,cz-D/2+4.5,sy]);
      bx(cx+2,sy-0.15,cz+2.25,W-4,0.3,D-4.5,0x8a8f94,0,TEX.roof);
      FL.push([L+4,cz-D/2+4.5,cx+W/2,cz+D/2,sy]);
      RP.push([L+0.5,cz-D/2+4.5,L+3.5,cz+D/2-0.5,g0+0.08,sy]);
      bx(L+2,g0+1.75,cz+2,3,0.3,(D-5)/Math.cos(a),0x6d4c41,0,TEX.wood).rotation.x=a;
      const rA2=Math.atan2(roofTopY-g0,D-2);
      RP.push([cx+W/2+0.3,cz-D/2+1,cx+W/2+2.5,cz+D/2-1,g0+0.08,roofTopY]);
      bx(cx+W/2+1.4,(g0+roofTopY)/2,cz,2.2,0.3,(D-2)/Math.cos(rA2),0x6d4c41,0,TEX.wood).rotation.x=rA2;
      BX.push([cx-dw/2,cz+D/2-t/2,cx+dw/2,cz+D/2+t/2,g0+3.3,roofTopY]);
      addLoot(cx+3,g0+0.5,cz+1,'W');addLoot(cx+5,g0+0.5,cz+1,'Z');
      for(let i=0;i<3;i++)addLoot(L+5+r()*(W-7),sy+0.5,cz-D/2+5+r()*(D-6),LK[Math.floor(r()*LK.length)]);
    }else{
      F(-W/2+1.2,-1,1.6,0.6,2.2,0x5d4037,TEX.wood);
      const rA=Math.atan2(roofTopY-g0,D-2);
      RP.push([cx+W/2+0.3,cz-D/2+1,cx+W/2+2.4,cz+D/2-1,g0+0.08,roofTopY]);
      bx(cx+W/2+1.35,(g0+roofTopY)/2,cz,2.1,0.3,(D-2)/Math.cos(rA),0x6d4c41,0,TEX.wood).rotation.x=rA;
    }

    const roofSlab=bx(cx,g0+hh+0.22,cz,W+1.2,0.46,D+1.2,0x9e9b93,2,TEX.roof,g0+hh-0.1,roofTopY);
    FL.push([cx-W/2-0.9,cz-D/2-0.9,cx+W/2+0.9,cz+D/2+0.9,roofTopY]);

    const pH=0.55,pY=roofTopY+pH/2;
    const p1=bx(cx,pY,cz-D/2-0.4,W+1.2,pH,0.35,w,2,TEX.wall,roofTopY,roofTopY+pH);
    const p2=bx(cx,pY,cz+D/2+0.4,W+1.2,pH,0.35,w,2,TEX.wall,roofTopY,roofTopY+pH);
    const p3=bx(cx-W/2-0.4,pY,cz,0.35,pH,D+0.5,w,2,TEX.wall,roofTopY,roofTopY+pH);
    const p4=bx(cx+W/2+0.4,pY,cz,0.35,pH,D+0.5,w,2,TEX.wall,roofTopY,roofTopY+pH);

    addLoot(cx-2,roofTopY+0.55,cz,'W');addLoot(cx+2,roofTopY+0.55,cz,big?'H':'Z');addLoot(cx,roofTopY+0.55,cz-2,'a');
    HS.push({x:cx,z:cz,W,D,top:roofTopY,roofTopY,roof:[roofSlab,p1,p2,p3,p4]});
    bx(cx,g0+0.04,cz,W,0.12,D,0x857b6d,0,TEX.roof);
    for(let i=0;i<2;i++)addLoot(cx+(r()-.5)*(W-3),g0+0.5,cz+(r()-.5)*(D-3),LK[Math.floor(r()*LK.length)]);
  };

  const OF=[[-26,-22],[0,-28],[26,-22],[-26,14],[26,14],[0,22]];
  for(const[a,b]of V)for(const[ox,oz]of OF){const x=a+ox+(r()-.5)*5,z=b+oz+(r()-.5)*5,y=H(x,z);if(y>1.5&&seg(x,z)>(ox===0&&oz===-28?14:9))house(x,y,z,ox===0&&oz===-28);}

  for(let k=0,t=0;k<46&&t<3000;t++){
    const x=(r()-.5)*S*.9,z=(r()-.5)*S*.9,y=H(x,z);
    if(y>1.5&&y<16&&V.every(v=>Math.hypot(v[0]-x,v[1]-z)>45)&&seg(x,z)>8){
      if(k%3===0){
        bx(x,y+1.2,z,6.2,2.4,2.5,[0x2c4c82,0x8e3226,0x2e633b][(k%9)/3|0],2,TEX.crate,y-0.5,y+2.4,0.6,0.3);
        bx(x-3.7,y+0.6,z,1.2,1.2,1.2,0xffffff,2,TEX.crate,y-0.5,y+1.2);
        addLoot(x,y+2.85,z,LK[k%LK.length]);
      }else{
        bx(x,y+1.05,z,5+r()*3,2.1,0.6,0x8a8d8f,2,TEX.wall,y-0.5,y+2.1,0.9,0.1);
      }
      k++;
    }
  }

  const o=document.createElement('canvas');o.width=o.height=240;const ox=o.getContext('2d');
  for(let a=0;a<240;a++)for(let b=0;b<240;b++){
    const X=(a/240-.5)*S,Z=(b/240-.5)*S,y=H(X,Z);
    ox.fillStyle=y<0?'#1b688c':y>.9&&seg(X,Z)<3.6?'#42464c':'#'+(y<.9?q[0]:y<8?q[1]:y<14?q[2]:y<20?q[3]:q[4]).toString(16).padStart(6,'0');
    ox.fillRect(a,b,1,1);
  }
  mm._bg=o;

  sp0={x:V[0][0],z:V[0][1]};
  P.x=sp0.x;P.z=sp0.z;P.y=H(P.x,P.z);P.vy=0;P.hp=100;P.ammo=30;P.res=90;P.kills=0;P.dead=false;
  P.inv={h:1,G:1,M:1};P.helm=P.bag=false;P.gun=P.zoom=false;
  J.x=sp0.x+9;J.z=sp0.z+6;J.a=0;J.v=0;J.st=0;J.y=Math.max(H(J.x,J.z),0)+0.1;drive=false;skyD=tc2.sky;
  jp.position.set(J.x,J.y,J.z);jp.rotation.set(0,0,0);$('vbl').textContent='Gaadi';
  for(let i=0;i<10;i++)spawnEn();
  startDrop();
}
