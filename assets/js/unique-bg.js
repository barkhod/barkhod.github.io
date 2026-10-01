(function(){
var reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var coarse=window.matchMedia("(pointer: coarse)").matches;
var root=document.documentElement;
var canvas=document.createElement("canvas");
canvas.id="abyss-bg";
document.body.prepend(canvas);
var ctx=canvas.getContext("2d");
if(!ctx) return;
var W=0,H=0,DPR=1;
var stars=[],orbs=[],shards=[],dust=[],clouds=[];
var mx=0,my=0,tmx=0,tmy=0;
var scrollY=0,tScroll=0;
var T=Math.random()*1000;
function rnd(a,b){return a+Math.random()*(b-a);}
function pick(arr){return arr[(Math.random()*arr.length)|0];}
function size(){
DPR=Math.min(window.devicePixelRatio||1,1.75);
W=window.innerWidth;H=window.innerHeight;
canvas.width=W*DPR;canvas.height=H*DPR;
canvas.style.width=W+"px";canvas.style.height=H+"px";
ctx.setTransform(DPR,0,0,DPR,0,0);
build();
// Resizing clears the canvas; without the animation loop nothing else would redraw it.
if(reduced){paint();}
}
function build(){
stars=[];
var n=Math.max(130,Math.min(260,(W*H)/9000|0));
for(var i=0;i<n;i++){
var z=rnd(0.15,1);
stars.push({x:Math.random()*W,y:Math.random()*H,z:z,r:0.4+z*1.5,tw:rnd(0,6.28),ts:rnd(0.008,0.03),c:pick(["#cfe6ff","#8ec2ff","#ffffff","#b39dff","#7ee2a8"])});
}
orbs=[];
var orbCols=[[77,163,255],[124,92,255],[255,92,225],[77,227,255],[47,123,255]];
for(var k=0;k<6;k++){
orbs.push({x:rnd(0,W),y:rnd(0,H),r:rnd(Math.min(W,H)*0.28,Math.min(W,H)*0.62),c:orbCols[k%orbCols.length],a:rnd(0.10,0.20),dx:rnd(-0.12,0.12),dy:rnd(-0.08,0.08),ph:rnd(0,6.28),depth:rnd(0.2,0.7)});
}
shards=[];
var sn=Math.max(14,Math.min(30,W/55|0));
for(var s=0;s<sn;s++){
shards.push({x:rnd(0,W),y:rnd(0,H),sz:rnd(6,22),rot:rnd(0,6.28),vr:rnd(-0.008,0.008),vy:rnd(0.08,0.35),vx:rnd(-0.08,0.08),depth:rnd(0.3,1),c:pick(["#4da3ff","#7c5cff","#ff5ce1","#4de3ff","#8ec2ff"]),tw:rnd(0,6.28)});
}
dust=[];
for(var d=0;d<70;d++){
dust.push({x:Math.random()*W,y:Math.random()*H,r:rnd(0.6,2),vy:rnd(0.05,0.25),a:rnd(0.15,0.5)});
}
clouds=[];
var cn=Math.max(5,Math.min(11,W/150|0));
for(var c=0;c<cn;c++){clouds.push(makeCloud(rnd(0.15,1),rnd(-0.2,1)*W));}
clouds.sort(function(a,b){return a.depth-b.depth;});
}
// Daytime (lamp on): flat, blocky Minecraft clouds, each drawn once to its own canvas.
function makeCloud(depth,x){
var cell=Math.round(8+depth*14);
var cw=5+(Math.random()*9|0),ch=2+(Math.random()*2|0);
var oc=document.createElement("canvas");
oc.width=cw*cell;oc.height=(ch+1)*cell;
var g=oc.getContext("2d");
g.fillStyle="#ffffff";
// A row of bumps on top, then a body with ragged ends.
for(var b=0;b<1+(Math.random()*3|0);b++){
var bx=1+(Math.random()*Math.max(1,cw-3)|0),bw=2+(Math.random()*3|0);
g.fillRect(bx*cell,0,Math.min(bw,cw-bx)*cell,cell);
}
for(var y=0;y<ch;y++){
var l=Math.random()*2|0,r=Math.random()*2|0;
g.fillRect(l*cell,(y+1)*cell,(cw-l-r)*cell,cell);
}
g.globalCompositeOperation="source-atop";
g.fillStyle="rgba(170,200,238,.45)";
g.fillRect(0,ch*cell+cell*0.6,cw*cell,cell*0.4);
return {img:oc,x:x,y:rnd(0.04,0.72)*H,depth:depth,speed:0.06+depth*0.22,a:0.55+depth*0.4};
}
window.addEventListener("pointermove",function(e){
if(coarse) return;
tmx=(e.clientX/W-0.5)*2;
tmy=(e.clientY/H-0.5)*2;
},{passive:true});
function diamond(x,y,s,rot){
ctx.beginPath();
ctx.moveTo(x+Math.cos(rot-Math.PI/2)*s,y+Math.sin(rot-Math.PI/2)*s);
ctx.lineTo(x+Math.cos(rot)*s*0.62,y+Math.sin(rot)*s*0.62);
ctx.lineTo(x+Math.cos(rot+Math.PI/2)*s,y+Math.sin(rot+Math.PI/2)*s);
ctx.lineTo(x+Math.cos(rot+Math.PI)*s*0.62,y+Math.sin(rot+Math.PI)*s*0.62);
ctx.closePath();
}
function aurora(yBase,amp,col1,col2,alpha,speed,thick){
ctx.beginPath();
var steps=48;
for(var i=0;i<=steps;i++){
var x=(W/steps)*i;
var y=yBase+Math.sin(x*0.004+T*speed)*amp+Math.sin(x*0.011-T*speed*0.7)*amp*0.35+Math.sin(T*0.4+i*0.15)*6;
if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
}
for(var j=steps;j>=0;j--){
var x2=(W/steps)*j;
var y2=yBase+thick+Math.sin(x2*0.004+T*speed)*amp+Math.sin(x2*0.011-T*speed*0.7)*amp*0.35;
ctx.lineTo(x2,y2);
}
ctx.closePath();
var g=ctx.createLinearGradient(0,yBase-thick,0,yBase+thick*2);
g.addColorStop(0,"rgba("+col1+",0)");
g.addColorStop(0.5,"rgba("+col1+","+alpha+")");
g.addColorStop(1,"rgba("+col2+",0)");
ctx.fillStyle=g;
ctx.fill();
}
function paintDay(){
var sky=ctx.createLinearGradient(0,0,0,H);
sky.addColorStop(0,"#72b2ff");
sky.addColorStop(0.55,"#a9d3ff");
sky.addColorStop(1,"#e3f1ff");
ctx.globalCompositeOperation="source-over";
ctx.globalAlpha=1;ctx.shadowBlur=0;
ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
var px=mx*22,py=my*14;
// A square sun, as in Minecraft, with a soft glow round it.
var s=Math.max(34,Math.min(W,H)*0.075);
var sx=W*0.8-px*0.25,sy=H*0.14-tScroll*0.04-py*0.25;
var glow=ctx.createRadialGradient(sx,sy,0,sx,sy,s*5);
glow.addColorStop(0,"rgba(255,249,214,.9)");
glow.addColorStop(0.25,"rgba(255,240,180,.35)");
glow.addColorStop(1,"rgba(255,240,180,0)");
ctx.fillStyle=glow;ctx.fillRect(sx-s*5,sy-s*5,s*10,s*10);
ctx.fillStyle="#fff6c8";ctx.fillRect(sx-s/2,sy-s/2,s,s);
ctx.fillStyle="#ffe98a";ctx.fillRect(sx-s*0.32,sy-s*0.32,s*0.64,s*0.64);
// Clouds drift left to right; nearer ones are bigger and faster.
ctx.imageSmoothingEnabled=false;
for(var i=0;i<clouds.length;i++){
var c=clouds[i];
if(!reduced){c.x+=c.speed;}
if(c.x>W+40){c.x=-c.img.width-rnd(20,200);c.y=rnd(0.04,0.72)*H;}
ctx.globalAlpha=c.a;
ctx.drawImage(c.img,Math.round(c.x-px*c.depth),Math.round(c.y-tScroll*c.depth*0.12-py*c.depth));
}
ctx.imageSmoothingEnabled=true;
// The crystals keep floating by day, only softer.
for(var q=0;q<shards.length;q++){
var sh=shards[q];
if(!reduced){
sh.rot+=sh.vr;sh.y-=sh.vy;sh.x+=sh.vx+Math.sin(T+sh.tw)*0.08;sh.tw+=0.02;
if(sh.y<-30){sh.y=H+30;sh.x=Math.random()*W;}
if(sh.x<-30) sh.x=W+30; if(sh.x>W+30) sh.x=-30;
}
ctx.globalAlpha=0.45;
ctx.fillStyle=sh.c;
diamond(sh.x-px*sh.depth,sh.y-py*sh.depth,sh.sz*0.8,sh.rot);ctx.fill();
}
ctx.globalAlpha=1;
}
function paint(){
if(root.getAttribute("data-theme")==="light"){paintDay();return;}
var bg=ctx.createLinearGradient(0,0,0,H);
bg.addColorStop(0,"#030509");
bg.addColorStop(0.45,"#060b16");
bg.addColorStop(1,"#030509");
ctx.globalAlpha=1;ctx.shadowBlur=0;
ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
var px=mx*22,py=my*14;
for(var i=0;i<orbs.length;i++){
var o=orbs[i];
o.x+=o.dx;o.y+=o.dy;
if(o.x<-o.r) o.x=W+o.r; if(o.x>W+o.r) o.x=-o.r;
if(o.y<-o.r) o.y=H+o.r; if(o.y>H+o.r) o.y=-o.r;
var ox=o.x-px*o.depth;
var oy=((o.y-tScroll*o.depth*0.25)%(H+o.r*2)+(H+o.r*2))%(H+o.r*2)-o.r;
var pulse=0.85+Math.sin(T*0.5+o.ph)*0.15;
var rg=ctx.createRadialGradient(ox,oy,0,ox,oy,o.r*pulse);
rg.addColorStop(0,"rgba("+o.c[0]+","+o.c[1]+","+o.c[2]+","+o.a+")");
rg.addColorStop(0.55,"rgba("+o.c[0]+","+o.c[1]+","+o.c[2]+","+(o.a*0.4)+")");
rg.addColorStop(1,"rgba(0,0,0,0)");
ctx.fillStyle=rg;
ctx.fillRect(ox-o.r,oy-o.r,o.r*2,o.r*2);
}
ctx.globalCompositeOperation="lighter";
var vVel=0;var vFold=0;
try{vVel=window.__abyssVel||0;vFold=window.__abyssFold||0;}catch(vErr){}
var vAbs=vVel<0?-vVel:vVel;
var ay=H*0.22-tScroll*0.04+py*0.4-vVel*26;
aurora(ay,34+vAbs*26+vFold*20,"77,163,255","124,92,255",0.16+vFold*0.08,0.35+vVel*0.12,90);
aurora(ay+90,26+vAbs*18,"255,92,225","77,163,255",0.10+vFold*0.05,-0.28,70);
aurora(H*0.78-tScroll*0.02,30+vAbs*14,"77,227,255","124,92,255",0.07,0.22,80);
ctx.globalCompositeOperation="source-over";
for(var s2=0;s2<stars.length;s2++){
var st=stars[s2];
st.tw+=st.ts;
var sx=(st.x-px*st.z*1.6+W)%W;
var syy=(st.y-tScroll*st.z*0.35)%H; if(syy<0) syy+=H;
syy-=py*st.z+vVel*16*st.z;
var a=0.35+Math.abs(Math.sin(st.tw))*0.65;
ctx.globalAlpha=a*(0.3+st.z*0.7);
ctx.fillStyle=st.c;
ctx.shadowColor=st.c;ctx.shadowBlur=6*st.z;
ctx.beginPath();ctx.arc(sx,syy,st.r,0,6.283);ctx.fill();
}
ctx.shadowBlur=0;ctx.globalAlpha=1;
ctx.lineWidth=1;
for(var a1=0;a1<shards.length;a1++){
for(var b=a1+1;b<shards.length;b++){
var A=shards[a1],B=shards[b];
var dx=A.x-B.x,dy=A.y-B.y;
var d=Math.sqrt(dx*dx+dy*dy);
if(d<150){
ctx.globalAlpha=(1-d/150)*0.22;
ctx.strokeStyle="#4da3ff";
ctx.beginPath();ctx.moveTo(A.x-px*A.depth,A.y-py*A.depth);ctx.lineTo(B.x-px*B.depth,B.y-py*B.depth);ctx.stroke();
}
}
}
ctx.globalAlpha=1;
for(var q=0;q<shards.length;q++){
var sh=shards[q];
sh.rot+=sh.vr+vVel*0.004;sh.y-=sh.vy*(1+vAbs*2.4+vFold*0.9);sh.x+=sh.vx+Math.sin(T+sh.tw)*0.08-vVel*1.4*sh.depth;
sh.tw+=0.02;
if(sh.y<-30){sh.y=H+30;sh.x=Math.random()*W;}
if(sh.x<-30) sh.x=W+30; if(sh.x>W+30) sh.x=-30;
var hx=sh.x-px*sh.depth,hy=sh.y-py*sh.depth;
var glowA=0.5+Math.sin(sh.tw)*0.3;
ctx.globalAlpha=0.85;
ctx.fillStyle=sh.c;ctx.shadowColor=sh.c;ctx.shadowBlur=18*sh.depth;
diamond(hx,hy,sh.sz,sh.rot);ctx.fill();
ctx.shadowBlur=0;
ctx.globalAlpha=0.95;
ctx.fillStyle="rgba(255,255,255,"+(0.75*glowA)+")";
diamond(hx,hy,sh.sz*0.28,sh.rot);ctx.fill();
}
for(var d2=0;d2<dust.length;d2++){
var du=dust[d2];
du.y-=du.vy;
if(du.y<-5){du.y=H+5;du.x=Math.random()*W;}
ctx.globalAlpha=du.a*0.6;
ctx.fillStyle="#8ec2ff";
ctx.fillRect(du.x-px*0.3,du.y,du.r,du.r);
}
ctx.globalAlpha=1;
}
function loop(){
T+=0.012;
mx+=(tmx-mx)*0.05;my+=(tmy-my)*0.05;
tScroll+=(scrollY-tScroll)*0.08;
paint();
requestAnimationFrame(loop);
}
window.addEventListener("scroll",function(){
scrollY=window.scrollY||document.documentElement.scrollTop;
},{passive:true});
scrollY=window.scrollY||0;tScroll=scrollY;
window.addEventListener("resize",size);
size();
if(reduced){
// No loop: repaint once whenever the lamp switches day and night.
new MutationObserver(paint).observe(root,{attributes:true,attributeFilter:["data-theme"]});
}else{loop();}
})();
