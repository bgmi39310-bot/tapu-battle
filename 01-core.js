// Renderer, scene, camera, global state
const $=id=>document.getElementById(id),cv=$('g'),mm=$('mm'),mx=mm.getContext('2d');

// 1. WebGL Renderer & Scene Setup (ACES Filmic ToneMapping & Soft Shadows for PBR Look)
const ren=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});
ren.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
ren.setSize(window.innerWidth,window.innerHeight,false);
ren.setClearColor(0x7ec0ee,1);
ren.shadowMap.enabled=true;
ren.shadowMap.type=THREE.PCFSoftShadowMap;
ren.toneMapping=THREE.ACESFilmicToneMapping;
ren.toneMappingExposure=1.15;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x7ec0ee);
scene.fog=new THREE.Fog(0x7ec0ee,260,950);

const cam=new THREE.PerspectiveCamera(70,window.innerWidth/window.innerHeight,0.15,1300);
scene.add(cam);

// 2. Declare ALL Global Constants, State Variables & Arrays Up-Front
const S=600,N=140;
const UB=new THREE.BoxGeometry(1,1,1);
const rc=new THREE.Raycaster(),rcE=new THREE.Raycaster(),rcC=new THREE.Raycaster();
const OB=[],BX=[],WM=[],LT=[],EN=[],HS=[],PJ=[],FZ=[],FX=[],FL=[],RP=[],WIN=[];
const TH=[
  {n:'Erangel',sky:0x7ec0ee,c:[0xe3d3a1,0x589442,0x3c7638,0x7c7e76,0xf2f6f8],tr:0x2d6b35,nt:750},
  {n:'Miramar',sky:0xf0d6a8,c:[0xe9c98a,0xdcb26a,0xc99a55,0xa7744a,0x8f6040],tr:0x6f8a3a,nt:200},
  {n:'Vikendi',sky:0xd4eaf7,c:[0xdfe9ee,0xf4f8fa,0xe6eef3,0xb9c6cf,0xffffff],tr:0x2a5a4a,nt:600}
];

let grp=null,seed=7,hmap=(x,z)=>0,th=0,night=false,nT=0,cam3=true,drive=false,skyD=0x7ec0ee;
let scope=false,firing=false,jmpReq=false,reload=0,cd=0,sp0={x:0,z:0},ac=null;
let near=null,edit=false,gyro=false,gl=0,bs=1,rec=0,lean=0,leanT=0,FY=0,FP=0,eyeOn=false;
let held=null,st=0,eh=1.65,stv=0,shake=0,phase=0,AV={x:0,z:0},PL={x:-240,y:195,z:0},mFlashT=0;

const P={x:0,z:0,y:0,vy:0,vx:0,vz:0,yaw:0,pitch:0,hp:100,ammo:30,res:90,kills:0,dead:false,inv:{h:1,G:1,M:1},helm:false,bag:false,gun:false,zoom:false,wph:0,legYaw:0,strafeTilt:0,climb:null};
const J={x:0,z:0,y:0,a:0,v:0,st:0};
const DRV={l:0,r:0,g:0,b:0};
const K={};
let mv={x:0,y:0},climbTarget=null;
