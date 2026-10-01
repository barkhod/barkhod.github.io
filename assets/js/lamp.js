(function(){
var root=document.documentElement;
var lamp=document.getElementById("lamp");
var btn=document.getElementById("lampBody");
if(!lamp||!btn) return;
var meta=document.querySelector('meta[name="theme-color"]');
var KEY="barkhod-theme";
var NS="http://www.w3.org/2000/svg";
var reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function isLight(){return root.getAttribute("data-theme")==="light";}
function syncUi(){
var on=isLight();
btn.setAttribute("aria-checked",on?"true":"false");
btn.setAttribute("aria-label",on?"Lamp: switch to dark mode":"Lamp: switch to light mode");
if(meta){meta.setAttribute("content",on?"#eaf3ff":"#000000");}
}
syncUi();

// ---- The lamp: it swings about the top of its wire (viewBox point 32,0). ----
var theta=0,omega=0;
var BULB={x:32,y:37.4};
var ANCHOR={x:41.5,y:35.4};
function frameOf(){
var r=lamp.getBoundingClientRect();
var s=r.width/64;
return {px:r.left+32*s,py:r.top,s:s};
}
function toScreen(f,p){
var dx=(p.x-32)*f.s,dy=p.y*f.s,c=Math.cos(theta),sn=Math.sin(theta);
return {x:f.px+dx*c-dy*sn,y:f.py+dx*sn+dy*c};
}
function kick(v){if(!reduced){omega+=v;}}

// ---- Light / dark ----
function setTheme(next){
try{localStorage.setItem(KEY,next);}catch(e){}
var b=toScreen(frameOf(),BULB);
var flip=function(){
if(next==="light"){root.setAttribute("data-theme","light");}else{root.removeAttribute("data-theme");}
syncUi();
};
if(reduced||!document.startViewTransition){flip();return;}
var cls=next==="light"?"vt-on":"vt-off";
var done=function(){root.classList.remove("vt-on","vt-off");};
root.classList.add(cls);
var t;
try{t=document.startViewTransition(flip);}catch(e){flip();done();return;}
// Turning on, the light spills out of the bulb; turning off, it drains back into it.
t.ready.then(function(){
var r=Math.sqrt(Math.pow(Math.max(b.x,innerWidth-b.x),2)+Math.pow(Math.max(b.y,innerHeight-b.y),2));
var small="circle(0px at "+b.x+"px "+b.y+"px)",big="circle("+r+"px at "+b.x+"px "+b.y+"px)";
if(next==="light"){
root.animate({clipPath:[small,big]},{duration:950,easing:"cubic-bezier(.3,.6,.2,1)",pseudoElement:"::view-transition-new(root)"});
}else{
root.animate({clipPath:[big,small]},{duration:750,easing:"cubic-bezier(.6,0,.8,.4)",pseudoElement:"::view-transition-old(root)"});
}
}).catch(function(){});
t.finished.then(done,done);
}
function toggle(){setTheme(isLight()?"dark":"light");}
btn.addEventListener("click",function(){
toggle();
kick((Math.random()<0.5?-1:1)*0.045);
if(rope){var q=rope.pts[rope.pts.length-1];q.px-=(Math.random()-0.5)*6;q.py-=5;}
wake();
});

// ---- The pull cord: a verlet rope hanging from the shade. ----
var SEG=12,G=0.42,DAMP=0.985;
var PULL=24;          // stretch (px) that clicks the switch
var TEAR=190;         // stretch that snaps even a fresh cord
var TEAR_WORN=60;     // ...and a worn one
function cordLen(){return window.innerWidth<768?40:54;}
var rope=null,stub=null,piece=null,fibers=[];
var grab=null,grabOff=null,armed=true;
var wear=0,wearAt=0;
var growT=1,regrowAt=0;
function getWear(now){wear=Math.max(0,wear-(now-wearAt)/1000*0.35);wearAt=now;return wear;}
function addWear(v,now){getWear(now);wear+=v;}
function makeRope(ax,ay,len,n){
var pts=[];
for(var i=0;i<=n;i++){var y=ay+len*i/n;pts.push({x:ax,y:y,px:ax,py:y});}
return {pts:pts,rest:len/n};
}
function integrate(r){
var pts=r.pts,last=pts.length-1;
for(var i=0;i<pts.length;i++){
var p=pts[i];
var vx=(p.x-p.px)*DAMP,vy=(p.y-p.py)*DAMP;
p.px=p.x;p.py=p.y;
// The bead at the end is heavier than the cord.
p.x+=vx;p.y+=vy+(i===last?G*1.8:G);
}
}
function constrain(r,anchor,hold){
var pts=r.pts,n=pts.length,L=r.rest;
for(var k=0;k<16;k++){
if(anchor){pts[0].x=anchor.x;pts[0].y=anchor.y;}
if(hold){pts[n-1].x=hold.x;pts[n-1].y=hold.y;}
for(var j=0;j<n-1;j++){
var a=pts[j],b=pts[j+1];
var dx=b.x-a.x,dy=b.y-a.y,d=Math.sqrt(dx*dx+dy*dy)||1e-4,f=(d-L)/d;
var aFixed=anchor&&j===0,bFixed=hold&&j+1===n-1;
if(aFixed&&bFixed){continue;}
if(aFixed){b.x-=dx*f;b.y-=dy*f;}
else if(bFixed){a.x+=dx*f;a.y+=dy*f;}
else{a.x+=dx*f*0.5;a.y+=dy*f*0.5;b.x-=dx*f*0.5;b.y-=dy*f*0.5;}
}
}
if(anchor){pts[0].x=anchor.x;pts[0].y=anchor.y;}
if(hold){pts[n-1].x=hold.x;pts[n-1].y=hold.y;}
}
function moving(r){
if(!r) return false;
for(var i=0;i<r.pts.length;i++){var p=r.pts[i];if(Math.abs(p.x-p.px)+Math.abs(p.y-p.py)>0.03) return true;}
return false;
}

// ---- Drawing: a fixed SVG over the page, so the cord can hang below the header and fall anywhere. ----
var layer=document.createElementNS(NS,"svg");
layer.setAttribute("class","lamp-cord");
layer.setAttribute("aria-hidden","true");
var BEAD='<rect x="-3.6" y="-1" width="7.2" height="12" rx="3.6" fill="url(#lampBeadFill)"/><rect x="-1.9" y="1.4" width="1.5" height="6.4" rx=".75" fill="rgba(255,255,255,.6)"/>';
layer.innerHTML='<defs><linearGradient id="lampBeadFill" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a6420"/><stop offset=".45" stop-color="#f3d27a"/><stop offset="1" stop-color="#a87a26"/></linearGradient></defs>'+
'<path class="cord-line" id="cordLine"/><path class="cord-line" id="cordStub"/><path class="cord-line" id="cordPiece"/>'+
'<g class="cord-fray" id="cordFray"><path d="M0 0l-3 -2M0 0l2.6 -2.4M0 0l-.6 3.2"/></g>'+
'<g class="cord-bead" id="cordBead">'+BEAD+'</g><g class="cord-bead" id="pieceBead">'+BEAD+'</g><g id="cordFibers"></g>';
document.body.appendChild(layer);
var lineEl=layer.querySelector("#cordLine"),stubEl=layer.querySelector("#cordStub"),pieceEl=layer.querySelector("#cordPiece");
var beadEl=layer.querySelector("#cordBead"),pieceBeadEl=layer.querySelector("#pieceBead");
var frayEl=layer.querySelector("#cordFray"),fiberEl=layer.querySelector("#cordFibers");
var handle=document.createElement("div");
handle.className="lamp-handle";
handle.setAttribute("aria-hidden","true");
document.body.appendChild(handle);

function pathOf(pts){
if(!pts||pts.length<2) return "";
var d="M"+pts[0].x.toFixed(1)+" "+pts[0].y.toFixed(1);
for(var i=1;i<pts.length-1;i++){
var mx=(pts[i].x+pts[i+1].x)/2,my=(pts[i].y+pts[i+1].y)/2;
d+="Q"+pts[i].x.toFixed(1)+" "+pts[i].y.toFixed(1)+" "+mx.toFixed(1)+" "+my.toFixed(1);
}
var e=pts[pts.length-1];
return d+"L"+e.x.toFixed(1)+" "+e.y.toFixed(1);
}
function placeBead(el,r,scale){
if(!r){el.setAttribute("visibility","hidden");return;}
var n=r.pts.length,a=r.pts[n-2],b=r.pts[n-1];
var deg=Math.atan2(-(b.x-a.x),b.y-a.y)*180/Math.PI;
el.setAttribute("visibility","visible");
el.setAttribute("transform","translate("+b.x.toFixed(1)+" "+b.y.toFixed(1)+") rotate("+deg.toFixed(1)+") scale("+scale.toFixed(3)+")");
}
function render(now){
btn.style.setProperty("--lamp-angle",theta.toFixed(4)+"rad");
lineEl.setAttribute("d",rope?pathOf(rope.pts):"");
stubEl.setAttribute("d",stub?pathOf(stub.pts):"");
pieceEl.setAttribute("d",piece?pathOf(piece.pts):"");
var pop=growT<1?Math.min(1,growT*1.25)*(1+Math.sin(Math.min(1,growT*1.25)*Math.PI)*0.25):1;
placeBead(beadEl,rope,pop);
placeBead(pieceBeadEl,piece,1);
// A worn cord shows it: it turns raw and a few threads stick out where it will give way.
var worn=rope&&growT>=1&&getWear(now)>=3;
layer.classList.toggle("is-worn",!!worn);
if(worn){var w=rope.pts[2];frayEl.setAttribute("transform","translate("+w.x.toFixed(1)+" "+w.y.toFixed(1)+")");}
else if(stub){var s=stub.pts[stub.pts.length-1];frayEl.setAttribute("transform","translate("+s.x.toFixed(1)+" "+s.y.toFixed(1)+")");}
frayEl.setAttribute("visibility",worn||stub?"visible":"hidden");
var html="";
for(var i=0;i<fibers.length;i++){
var f=fibers[i];
html+='<line x1="'+f.x.toFixed(1)+'" y1="'+f.y.toFixed(1)+'" x2="'+(f.x+f.dx).toFixed(1)+'" y2="'+(f.y+f.dy).toFixed(1)+'" opacity="'+f.life.toFixed(2)+'"/>';
}
fiberEl.innerHTML=html;
if(rope&&growT>=1&&!piece){
var q=rope.pts[rope.pts.length-1];
handle.style.transform="translate("+(q.x-22).toFixed(1)+"px,"+(q.y-16).toFixed(1)+"px)";
handle.style.display="block";
}else if(!grab){
handle.style.display="none";
}
}

// ---- Snapping and regrowing ----
function snap(now){
var k=2; // it gives way just under the shade
stub={pts:rope.pts.slice(0,k+1),rest:rope.rest};
piece={pts:rope.pts.slice(k+1),rest:rope.rest};
var t=rope.pts[k];
for(var i=0;i<8;i++){
var ang=Math.random()*Math.PI*2,sp=1+Math.random()*2.4;
fibers.push({x:t.x,y:t.y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp-1.2,dx:Math.cos(ang)*3,dy:Math.sin(ang)*3,life:1});
}
rope=null;
armed=true;
wear=0;wearAt=now;
// All that tension let go at once throws the lamp.
kick(grab?(grab.x>t.x?-0.09:0.09):0.07);
layer.classList.add("is-snapped");
}
function regrow(){
var a=toScreen(frameOf(),ANCHOR);
rope=makeRope(a.x,a.y,0.6,SEG);
stub=null;
growT=0;
layer.classList.remove("is-snapped");
}

// ---- Dragging the bead ----
var dragId=null,downAt=0,downX=0,downY=0,moved=0,lastX=0,lastY=0;
handle.addEventListener("pointerdown",function(e){
if(!rope||growT<1||piece) return;
e.preventDefault();
dragId=e.pointerId;
try{handle.setPointerCapture(dragId);}catch(err){}
var q=rope.pts[rope.pts.length-1];
grabOff={x:q.x-e.clientX,y:q.y-e.clientY};
grab={x:q.x,y:q.y};
downAt=performance.now();downX=lastX=e.clientX;downY=lastY=e.clientY;moved=0;
document.body.classList.add("is-pulling-cord");
wake();
});
handle.addEventListener("pointermove",function(e){
if(e.pointerId!==dragId||!grab) return;
grab={x:e.clientX+grabOff.x,y:e.clientY+grabOff.y};
var d=Math.sqrt(Math.pow(e.clientX-lastX,2)+Math.pow(e.clientY-lastY,2));
lastX=e.clientX;lastY=e.clientY;moved+=d;
// Yanking it around wears it out too.
addWear(d/1400,performance.now());
wake();
});
function release(e){
if(e.pointerId!==dragId) return;
dragId=null;
var tap=performance.now()-downAt<260&&moved<6;
grab=null;
document.body.classList.remove("is-pulling-cord");
// A tap on the bead is a short tug.
if(tap&&rope&&growT>=1){pulled(performance.now());var q=rope.pts[rope.pts.length-1];q.py-=7;}
wake();
}
handle.addEventListener("pointerup",release);
handle.addEventListener("pointercancel",release);
handle.addEventListener("lostpointercapture",function(e){if(dragId!==null){release(e);}});
function pulled(now){
toggle();
addWear(1.2,now);
kick((Math.random()-0.5)*0.03);
}

// ---- Simulation ----
function step(now){
var f=frameOf();
var torque=0;
if(rope&&grab){
var a0=toScreen(f,ANCHOR);
torque=Math.max(-0.006,Math.min(0.006,(grab.x-a0.x)*0.00005));
}
if(!reduced){omega+=-0.009*theta-0.035*omega+torque;theta=Math.max(-0.6,Math.min(0.6,theta+omega));}
var a=toScreen(f,ANCHOR);
if(rope){
if(growT<1){growT=Math.min(1,growT+1/42);rope.rest=cordLen()/SEG*(1-Math.pow(1-growT,3));}
else{rope.rest=cordLen()/SEG;}
integrate(rope);
constrain(rope,a,grab);
if(grab&&growT>=1){
var stretch=Math.sqrt(Math.pow(grab.x-a.x,2)+Math.pow(grab.y-a.y,2))-cordLen();
if(armed&&stretch>PULL){armed=false;pulled(now);}
else if(!armed&&stretch<8){armed=true;}
if(stretch>(getWear(now)>=4?TEAR_WORN:TEAR)){snap(now);}
}
}
if(stub){integrate(stub);constrain(stub,a,null);}
if(piece){
integrate(piece);
constrain(piece,null,grab);
var gone=true;
for(var i=0;i<piece.pts.length;i++){if(piece.pts[i].y<innerHeight+60){gone=false;break;}}
if(gone&&!grab){piece=null;regrowAt=now+350;}
}
if(!rope&&!piece&&regrowAt&&now>=regrowAt){regrowAt=0;regrow();}
for(var j=fibers.length-1;j>=0;j--){
var fb=fibers[j];
fb.x+=fb.vx;fb.y+=fb.vy;fb.vy+=0.18;fb.life-=0.035;
if(fb.life<=0){fibers.splice(j,1);}
}
}
var running=false,lastT=0,acc=0;
function busy(now){
if(grab||piece||growT<1||regrowAt||fibers.length) return true;
if(Math.abs(omega)>0.0003||Math.abs(theta)>0.0006) return true;
if(rope&&getWear(now)>=3) return true;
return moving(rope)||moving(stub);
}
function loop(now){
acc+=Math.min(64,now-lastT);lastT=now;
var n=0;
while(acc>=16.667&&n<4){step(now);acc-=16.667;n++;}
render(now);
if(busy(now)){requestAnimationFrame(loop);}else{running=false;}
}
function wake(){
if(running) return;
running=true;lastT=performance.now();acc=16.667;
requestAnimationFrame(loop);
}
function hang(){
var a=toScreen(frameOf(),ANCHOR);
rope=makeRope(a.x,a.y,cordLen(),SEG);
wake();
}
hang();
window.addEventListener("resize",wake);
window.addEventListener("load",wake);
if(document.fonts&&document.fonts.ready){document.fonts.ready.then(wake);}
})();
