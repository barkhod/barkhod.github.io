(function(){
var reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if(reduced) return;
var nav=document.getElementById("navbar");
var headerH=56;
document.body.setAttribute("data-scroll-anim","crumple");
var fold=document.getElementById("fold-line");
if(!fold){
fold=document.createElement("div");
fold.id="fold-line";
fold.setAttribute("aria-hidden","true");
document.body.appendChild(fold);
}
var items=[];
// Only the title screen folds away as you scroll into the About cards below it;
// the pages themselves are swapped by the pager, not scrolled past.
function collect(){
var intro=document.querySelector(".intro");
items=intro?[{el:intro,first:true,cur:0,tilted:false,lastT:"",lastF:""}]:[];
if(intro){intro.style.transformOrigin="50% 0%";}
}
collect();
// A page the pager has hidden has no box; styling it would leave it crumpled for when it comes back.
function shown(el){return !el.classList.contains("page-hidden")&&el.getClientRects().length>0;}
// Layout position: unlike getBoundingClientRect it ignores the transforms this script applies.
function docTop(el){var y=0;while(el){y+=el.offsetTop;el=el.offsetParent;}return y;}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function easeIn(v){return v*v;}
function easeOut(v){return 1-Math.pow(1-v,3);}
function clearItem(o){
if(!o.tilted) return;
o.tilted=false;
var s=o.el.style;
s.transform="";
s.opacity="";
s.filter="";
s.borderRadius="";
s.willChange="";
s.removeProperty("--crumple");
o.lastT="";o.lastF="";
delete o.el.dataset.tilted;
}
function paint(o,t,op,f){
if(!o.tilted){o.tilted=true;o.el.dataset.tilted="1";}
var s=o.el.style;
if(o.lastT!==t){o.lastT=t;s.transform=t;}
if(o.lastF!==f){o.lastF=f;s.filter=f;}
s.opacity=op;
}
var lastY=window.scrollY||0;
var velSm=0;
var ticking=false;
var lastFold=-1;
function resetAll(){
for(var i=0;i<items.length;i++){items[i].cur=0;clearItem(items[i]);}
velSm=0;
lastY=window.scrollY||0;
}
function frame(){
ticking=false;
var y=window.scrollY||0;
var vh=window.innerHeight||800;
if(nav) headerH=nav.offsetHeight||56;
var vel=clamp((y-lastY)/48,-1.4,1.4);
lastY=y;
velSm+=(vel-velSm)*0.12;
if(Math.abs(velSm)<0.002) velSm=0;
var maxE=0;
var needMore=(velSm!==0);
for(var i=0;i<items.length;i++){
var o=items[i];
var el=o.el;
if(!shown(el)){o.cur=0;clearItem(o);continue;}
var top=docTop(el);
var h=Math.max(el.offsetHeight,1);
var rTop=top-y;
var rBottom=rTop+h;
if(rBottom<-320||rTop>vh+320){clearItem(o);continue;}
var startPx=o.first?top+h*0.55:Math.max(top+h-vh*0.9-headerH,top-headerH+vh*0.30);
var total=Math.max(vh*0.62,h*0.38);
var t=clamp((y-startPx)/total,0,1);
if(rBottom<=0) t=1;
var d=t-o.cur;
if(Math.abs(d)<0.004) o.cur=t;
else{o.cur+=d*0.14;needMore=true;}
var c=o.cur;
if(c>0.004){
var e=easeIn(c);
if(e>maxE) maxE=e;
el.style.willChange="transform";
paint(o,
"perspective(1200px) rotateX("+(-e*3).toFixed(2)+"deg) rotateZ("+(velSm*0.4).toFixed(2)+"deg) scale("+(1-e*0.06).toFixed(4)+") translate3d(0,"+(e*-18+velSm*5).toFixed(1)+"px,0)",
(1-e*0.28).toFixed(3),
"brightness("+(1-e*0.3).toFixed(3)+") saturate("+(1-e*0.18).toFixed(3)+")");
el.style.borderRadius=(e*18).toFixed(0)+"%";
el.style.setProperty("--crumple",e.toFixed(3));
continue;
}
if(rTop>headerH+2&&rTop<vh){
var q=clamp(1-(rTop-headerH)/(vh*0.5),0,1);
// Stop just short of q=1 so a finished rise never leaves a sub-pixel transform (blurry text) behind.
if(q>0.01&&q<0.99){
var tq=1-easeOut(q);
paint(o,
"translate3d(0,"+(tq*28).toFixed(1)+"px,0) scale("+(0.988+0.012*(1-tq)).toFixed(4)+")",
(0.55+0.45*(1-tq)).toFixed(3),
"brightness("+(1-tq*0.1).toFixed(3)+")");
continue;
}
}
clearItem(o);
}
window.__abyssVel=velSm;
window.__abyssFold=maxE;
if(Math.abs(maxE-lastFold)>0.01){
lastFold=maxE;
fold.style.top=headerH+"px";
fold.style.opacity=(maxE*0.9).toFixed(3);
fold.style.transform="scaleX("+(0.25+0.75*maxE).toFixed(3)+")";
}
if(needMore) schedule();
}
function schedule(){
if(ticking) return;
ticking=true;
requestAnimationFrame(frame);
}
window.addEventListener("scroll",schedule,{passive:true});
window.addEventListener("resize",schedule,{passive:true});
window.addEventListener("load",schedule);
// The pager just swapped which sections are on screen: start the new page flat.
document.addEventListener("pagechange",function(){resetAll();schedule();});
if(document.fonts&&document.fonts.ready){document.fonts.ready.then(schedule);}
schedule();
})();
