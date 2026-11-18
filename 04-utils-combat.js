// RNG, collision, sound, tracers, enemy spawn, kill/hurt
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function mkNoise(r){
  const G=40,v=Array.from({length:G*G},r),f=t=>t*t*(3-2*t);
  const n=(x,y)=>{
    x=((x%G)+G)%G;y=((y%G)+G)%G;
    const i=Math.floor(x),j=Math.floor(y),a=f(x-i),b=f(y-j),q=(p,s)=>v[(s%G)*G+(p%G)];
    return(q(i,j)*(1-a)+q(i+1,j)*a)*(1-b)+(q(i,j+1)*(1-a)+q(i+1,j+1)*a)*b;
  };
  return(x,y)=>{let s=0,a=.55,fq=1;for(let o=0;o<4;o++){s+=n(x*fq,y*fq)*a;a*=.5;fq*=2.1}return s};
}

function col(o,rad,h=1.55){
  const oy=o.y||0,botY=oy+0.36,topY=oy+h;
  for(let iter=0;iter<2;iter++){
    for(const[a,b,r,hq,sf]of OB){
      if(sf)continue;
      const gy=hmap(a,b);if(botY>=gy+(hq||3)||topY<=gy-0.5)continue;
      const dx=o.x-a,dz=o.z-b,d=Math.hypot(dx,dz),m=r+rad;
      if(d<m&&d>1e-5){o.x=a+dx/d*m;o.z=b+dz/d*m}
    }
    for(const[a,b,c,e,my,tp]of BX){
      const bMinY=(my!==undefined&&my!==0)?my:-999,bMaxY=(tp!==undefined&&tp!==0)?tp:999;
      if(topY<=bMinY+0.05||botY>=bMaxY-0.05)continue;
      const px=Math.max(a,Math.min(o.x,c)),pz=Math.max(b,Math.min(o.z,e)),dx=o.x-px,dz=o.z-pz,d=Math.hypot(dx,dz);
      if(d<rad){
        if(d>1e-5){o.x=px+dx/d*rad;o.z=pz+dz/d*rad}
        else{
          const l=o.x-a,r=c-o.x,u=o.z-b,n=e-o.z,m=Math.min(l,r,u,n);
          if(m===l)o.x=a-rad;else if(m===r)o.x=c+rad;else if(m===u)o.z=b-rad;else o.z=e+rad;
        }
      }
    }
  }
}

function moveWithSubsteps(o,dx,dz,rad,h){
  const dist=Math.hypot(dx,dz),steps=Math.max(1,Math.min(6,Math.ceil(dist/0.12)));
  const sx=dx/steps,sz=dz/steps;
  for(let i=0;i<steps;i++){
    const nx=o.x+sx,nz=o.z+sz;
    if(Math.hypot(nx,nz)<S*0.49){o.x=nx;o.z=nz}
    col(o,rad,h);
  }
}

function snd(f,d,v,type='sawtooth'){
  try{
    ac=ac||new(window.AudioContext||window.webkitAudioContext)();
    const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime;
    o.type=type;o.frequency.value=f;g.gain.value=v;
    o.connect(g);g.connect(ac.destination);
    o.start();o.frequency.exponentialRampToValueAtTime(38,t+d);
    g.gain.exponentialRampToValueAtTime(0.001,t+d);o.stop(t+d);
  }catch(e){}
}

function msg(t){$('ms').textContent=t;$('ms').style.opacity=1;clearTimeout(msg.t);msg.t=setTimeout(()=>$('ms').style.opacity=0,2400)}
function tracer(a,b,c){const g=new THREE.BufferGeometry().setFromPoints([a,b]),l=new THREE.Line(g,new THREE.LineBasicMaterial({color:c}));scene.add(l);setTimeout(()=>{scene.remove(l);g.dispose()},75)}

const LN={h:'Medkit',a:'5.56mm Ammo',H:'Helmet Lv.3',B:'Backpack Lv.2',G:'Frag Grenade',M:'Molotov',W:'M416 Rifle',Z:'4x Scope'};
function spawnEn(){
  const e={g:null,x:0,z:0,y:0,hp:100,cd:1,lt:0,see:false,tx:0,tz:0,wt:0,ph:0};let t=0;
  do{e.x=(Math.random()-.5)*S*.78;e.z=(Math.random()-.5)*S*.78}while((hmap(e.x,e.z)<1.5||Math.hypot(e.x-P.x,e.z-P.z)<75)&&t++<300);
  e.y=Math.max(hmap(e.x,e.z),0);
  const c=mkChar(0x8e2822,true);e.c=c;e.g=c.g;
  c.g.traverse(o=>{if(o.isMesh)o.userData.e=e});c.hd.traverse(o=>{if(o.isMesh)o.userData.hd=1});c.hm.traverse(o=>{if(o.isMesh)o.userData.hd=1});
  c.g.position.set(e.x,e.y,e.z);scene.add(e.g);EN.push(e);
  if(typeof applyEnemyModel==='function')applyEnemyModel(e);
}
function kill(e,roadkill=false){
  const idx=EN.indexOf(e);if(idx===-1)return;
  scene.remove(e.g);EN.splice(idx,1);P.kills++;
  addLoot(e.x,e.y+0.55,e.z,['h','a','H','B','G','M','h','a','W','Z','a'][Math.floor(Math.random()*11)]);
  msg((roadkill?'Gaadi se kuchal diya! ':'Dushman khatam! ')+'Kills: '+P.kills);
  setTimeout(()=>{if(EN.length<10)spawnEn()},7500);
}
function hurt(a){
  if(P.dead)return;if(drive)a*=0.25;if(P.helm)a*=0.6;
  P.hp-=a;$('vg').style.opacity=0.75;setTimeout(()=>$('vg').style.opacity=0,160);
  if(P.hp<=0){
    P.dead=true;P.hp=0;drive=false;setDriveUI(false);msg('Aap शहीद ho gaye! 4 sec me dobara drop...');
    setTimeout(()=>{
      P.hp=100;P.ammo=30;P.res=90;P.dead=false;
      P.inv={h:0,G:0,M:0};P.helm=P.bag=false;P.gun=P.zoom=false;
      P.x=sp0.x;P.z=sp0.z;startDrop();
    },4000);
  }
}
