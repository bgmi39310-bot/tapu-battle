// Chhoti screen (phone) ke liye HUD auto-fit: saare button screen ke andar aa jayein.
// Buttons ki jagah tablet ke hisaab se thi (pixel me), isliye phone par kai buttons bahar chale jaate the.
(function(){
  const st=document.createElement('style');
  st.textContent='#rotHint{position:fixed;top:0;left:0;right:0;bottom:0;z-index:400;display:none;align-items:center;justify-content:center;text-align:center;background:#0b121a;color:#fff;font:800 20px/1.5 system-ui,sans-serif}#rotHint span{display:block;font-size:54px}';
  document.head.appendChild(st);
  document.body.insertAdjacentHTML('beforeend','<div id="rotHint"><div><span>&#128241;</span>Phone ko <b style="color:#ffd54f">aadha (landscape)</b> karo</div></div>');
  const SIDES=['left','right','top','bottom'];
  function specified(el){   // CSS me kaun si side (left/right/top/bottom) likhi hai
    const o={};
    for(const sh of document.styleSheets){
      let rules;try{rules=sh.cssRules}catch(e){continue}
      for(const r of rules){if(r.style&&r.selectorText){let m=false;try{m=el.matches(r.selectorText)}catch(e){}
        if(m)for(const k of SIDES)if(r.style[k])o[k]=r.style[k]}}
    }
    return o;
  }
  function fit(){
    const vv=window.visualViewport,W=vv?vv.width:innerWidth,H=vv?vv.height:innerHeight;
    document.getElementById('rotHint').style.display=H>W?'flex':'none';
    const s=Math.max(0.62,Math.min(1,H/760,W/1300));
    document.querySelectorAll('.rb,.dbtn').forEach(b=>{
      if(!b.dataset.fo){
        if(b.style.left||b.style.top){b.dataset.fo='custom'}   // aapne khud jagah badli hai
        else{/* % wali (center wali) side ko nahi chhedte */const sp=specified(b),cs=getComputedStyle(b),o={};for(const k of SIDES)if(sp[k]&&sp[k].indexOf('%')<0){const v=parseFloat(cs[k]);if(!isNaN(v))o[k]=v}b.dataset.fo=JSON.stringify(o)}
      }
      b.style.setProperty('--bs',s*(parseFloat(b.dataset.s)||1));
      if(b.dataset.fo==='custom'){   // custom jagah: bas screen ke andar rakho
        const w=b.offsetWidth,h=b.offsetHeight,l=parseFloat(b.style.left),t=parseFloat(b.style.top);
        if(!isNaN(l))b.style.left=Math.max(0,Math.min(W-w,l))+'px';
        if(!isNaN(t))b.style.top=Math.max(0,Math.min(H-h,t))+'px';
        return;
      }
      const o=JSON.parse(b.dataset.fo);for(const k in o)b.style[k]=(o[k]*s)+'px';
    });
  }
  addEventListener('load',()=>{fit();setTimeout(fit,400)});
  addEventListener('resize',fit);if(window.visualViewport)visualViewport.addEventListener('resize',fit);addEventListener('orientationchange',()=>setTimeout(fit,250));
})();
