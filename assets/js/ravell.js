(function(){
"use strict";
var root=document.documentElement;
root.classList.add("rv-js");
var reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;

var bar=document.getElementById("rvBar");
function solidBar(){if(bar){bar.classList.toggle("is-solid",(window.scrollY||0)>8);}}
window.addEventListener("scroll",solidBar,{passive:true});
solidBar();

var reveals=document.querySelectorAll(".rv-reveal");
if(!reduced&&"IntersectionObserver" in window){
var revealer=new IntersectionObserver(function(entries){
entries.forEach(function(entry){
if(!entry.isIntersecting){return;}
entry.target.classList.add("is-in");
revealer.unobserve(entry.target);
});
},{rootMargin:"0px 0px -6% 0px",threshold:0.06});
Array.prototype.forEach.call(reveals,function(el){revealer.observe(el);});
}else{
Array.prototype.forEach.call(reveals,function(el){el.classList.add("is-in");});
}

(function(){
var cv=document.getElementById("rvEmbers");
if(!cv||reduced||!cv.getContext){return;}
var ctx=cv.getContext("2d");
if(!ctx){return;}
var hero=cv.parentNode;
var W=0,H=0,parts=[],running=false,onScreen=true,last=0,acc=0;
function size(){
var dpr=Math.min(window.devicePixelRatio||1,2);
W=hero.clientWidth;
H=hero.clientHeight;
cv.width=Math.max(1,Math.round(W*dpr));
cv.height=Math.max(1,Math.round(H*dpr));
ctx.setTransform(dpr,0,0,dpr,0,0);
}
function spawn(y){
parts.push({x:Math.random()*W,y:y==null?H+4:y,vx:(Math.random()-0.5)*14,vy:-(24+Math.random()*46),life:0,max:3+Math.random()*4.5,s:Math.random()<0.25?3:2,w:Math.random()*6.283,ws:0.8+Math.random()*1.8});
}
function frame(t){
if(!running){return;}
var dt=last?Math.min((t-last)/1000,0.05):0.016;
last=t;
acc+=dt*(W<640?12:24);
while(acc>=1){acc-=1;spawn();}
ctx.clearRect(0,0,W,H);
ctx.globalCompositeOperation="lighter";
for(var i=parts.length-1;i>=0;i--){
var p=parts[i];
p.life+=dt;
if(p.life>=p.max||p.y<-10){parts.splice(i,1);continue;}
p.w+=dt*p.ws;
p.x+=(p.vx+Math.sin(p.w)*9)*dt;
p.y+=p.vy*dt;
var k=p.life/p.max;
var a=k<0.12?k/0.12:1-(k-0.12)/0.88;
var g=Math.round(214-120*k),b=Math.max(0,Math.round(96-90*k));
ctx.fillStyle="rgba(255,"+g+","+b+","+(a*0.16).toFixed(3)+")";
ctx.fillRect(p.x-p.s,p.y-p.s,p.s*3,p.s*3);
ctx.fillStyle="rgba(255,"+g+","+b+","+(a*0.85).toFixed(3)+")";
ctx.fillRect(p.x,p.y,p.s,p.s);
}
ctx.globalCompositeOperation="source-over";
requestAnimationFrame(frame);
}
function update(){
var on=onScreen&&!document.hidden;
if(on===running){return;}
running=on;
if(on){last=0;requestAnimationFrame(frame);}
}
size();
for(var i=0;i<(W<640?30:60);i++){spawn(H*(0.25+Math.random()*0.75));parts[parts.length-1].life=Math.random()*2;}
if("ResizeObserver" in window){new ResizeObserver(function(){size();}).observe(hero);}else{window.addEventListener("resize",size);}
if("IntersectionObserver" in window){new IntersectionObserver(function(entries){onScreen=entries[0].isIntersecting;update();}).observe(hero);}
document.addEventListener("visibilitychange",update);
update();
})();

function mk(w,h){var c=document.createElement("canvas");c.width=w;c.height=h;return c;}
function fromMap(rows,pal){
var c=mk(rows[0].length,rows.length),x=c.getContext("2d");
for(var y=0;y<rows.length;y++){
for(var i=0;i<rows[y].length;i++){
var k=rows[y].charAt(i);
if(k!=="."&&pal[k]){x.fillStyle=pal[k];x.fillRect(i,y,1,1);}
}
}
return c;
}
function fromFn(fn){
var c=mk(16,16),x=c.getContext("2d");
for(var y=0;y<16;y++){
for(var i=0;i<16;i++){
var dx=i-7.5,dy=y-7.5,col=fn(i,y,dx,dy,Math.sqrt(dx*dx+dy*dy));
if(col){x.fillStyle=col;x.fillRect(i,y,1,1);}
}
}
return c;
}
var ART={
paper:function(){return fromMap([
"................",
"................",
"..oooooooooo....",
"..owwwwwwwwso...",
"..owggggggwsso..",
"..owwwwwwwwwwo..",
"..owggggggggwo..",
"..owwwwwwwwwwo..",
"..owgggggggwwo..",
"..owwwwwwwwwwo..",
"..owggggggggwo..",
"..owwwwwwwwwwo..",
"..owgggggwwwwo..",
"..owwwwwwwwwwo..",
"..oooooooooooo..",
"................"],{o:"#6f6f6f",w:"#f4f4f4",g:"#b9b9b9",s:"#cfcfcf"});},
sign:function(){return fromMap([
"................",
"................",
".oooooooooooooo.",
".ollllllllllllo.",
".owwwwwwwwwwwwo.",
".owddddddddddwo.",
".owwwwwwwwwwwwo.",
".owdddddddwwwwo.",
".owwwwwwwwwwwwo.",
".oooooooooooooo.",
"......oppo......",
"......oppo......",
"......oppo......",
"......oppo......",
"......oooo......",
"................"],{o:"#4a3219",l:"#c99d60",w:"#a87b43",d:"#6b4a26",p:"#7a5a32"});},
disc:function(){return fromFn(function(i,y,dx,dy,d){
if(d>7.3){return null;}
if(d>6.4){return "#0a0a0d";}
if(d<1){return "#060608";}
if(d<2.9){return dx+dy<-0.5?"#ffcf55":"#f08a12";}
if(dx<-0.5&&dy<-0.5&&Math.abs(d-4.7)<0.55){return "#55556a";}
return Math.round(d)%2?"#1c1c23":"#25252e";
});},
apple:function(){return fromMap([
"................",
".......s........",
".......sLL......",
"...ooo.s.ooo....",
"..oHHHoooGGGo...",
".oHHGGGGGGGGGo..",
".oHGGGGGGGGGGo..",
".oHGGGGGGGGGDo..",
".oGGGGGGGGGGDo..",
".oGGGGGGGGGDDo..",
".oGGGGGGGGGDDo..",
"..oGGGGGGGDDo...",
"..oDGGGGGDDDo...",
"...oDDDDDDDo....",
"....ooooooo.....",
"................"],{o:"#7a4a00",H:"#fff6b0",G:"#ffcf33",D:"#e09a12",s:"#5a3a1a",L:"#47b347"});},
potion:function(){return fromMap([
"................",
"......cccc......",
"......cccc......",
".....oggggo.....",
"......oggo......",
"......oggo......",
"....ooLLLLoo....",
"...oLwLLLLLLo...",
"..oLwLLLLLLLLo..",
"..oLwLLLLLLLLo..",
"..oLLLLLLLLLDo..",
"..oLLLLLLLLDDo..",
"...oLLLLLLDDo...",
"....oDDDDDDo....",
".....oooooo.....",
"................"],{c:"#8b5a2b",o:"#2f3342",g:"#c9d8e8",L:"#55b8ff",D:"#2e7fd1",w:"#e8f6ff"});},
rocket:function(){return fromMap([
"................",
".......rr.......",
"......rrrr......",
".....oWWWWo.....",
".....oRRRRo.....",
".....oRwRRo.....",
".....oRwRRo.....",
".....oRRRRo.....",
".....oRRRRo.....",
".....oWWWWo.....",
".....oooooo.....",
".......ss.......",
".......ss.......",
".......ss.......",
".......ss.......",
"................"],{r:"#a82418",R:"#d8372a",W:"#f3ead6",o:"#5c1810",w:"#ff8f7a",s:"#8a6a40"});},
pearl:function(){return fromFn(function(i,y,dx,dy,d){
if(d>6.1){return null;}
if(d>5.2){return "#0b3a34";}
if((dx+1.8)*(dx+1.8)+(dy+1.8)*(dy+1.8)<2.4){return "#c9fff2";}
if(d<2.4){return "#38c4a6";}
return d<4?"#23927a":"#176454";
});},
ingot:function(){return fromMap([
"................",
"................",
"................",
"................",
"................",
"....oooooooo....",
"...oHHHHHHHHo...",
"..oHGGGGGGGGHo..",
".oGGGGGGGGGGGGo.",
".oDDDDDDDDDDDDo.",
".oDDDDDDDDDDDDo.",
".oooooooooooooo.",
"................",
"................",
"................",
"................"],{o:"#7a4f00",H:"#fff3a8",G:"#ffd23f",D:"#e0a018"});},
door:function(){return fromMap([
"................",
"....oooooooo....",
"....oPPPPPPo....",
"....oPwwwwPo....",
"....oPwwwwPo....",
"....oPPPPPPo....",
"....oPLLLLPo....",
"....oPLLLLPo....",
"....oPPPPkPo....",
"....oPLLLLPo....",
"....oPLLLLPo....",
"....oPPPPPPo....",
"....oPLLLLPo....",
"....oPLLLLPo....",
"....oooooooo....",
"................"],{o:"#4a3219",P:"#a87b43",L:"#8c6437",w:"#ffd27a",k:"#2a1a0c"});},
cookie:function(){
var chips={"5,5":1,"9,5":1,"10,6":1,"6,9":1,"7,9":1,"10,10":1,"4,11":1,"8,12":1,"11,8":1};
return fromFn(function(i,y,dx,dy,d){
if(d>6.9){return null;}
if(d>6){return "#5a3818";}
if(chips[i+","+y]){return "#3a2210";}
if(dx+dy<-5.5){return "#e3ad68";}
return d<3.5?"#cf9150":"#c18245";
});}
};
var artCache={},urlCache={};
function art(name){if(!artCache[name]){artCache[name]=ART[name]();}return artCache[name];}
function iconImg(name){
if(!urlCache[name]){urlCache[name]=art(name).toDataURL();}
var im=document.createElement("img");
im.src=urlCache[name];
im.alt="";
im.width=16;
im.height=16;
return im;
}

var ae=document.getElementById("ae");
var world=document.getElementById("aeWorld");
var w=ae&&world&&world.getContext?world.getContext("2d"):null;
if(!w){return;}
w.imageSmoothingEnabled=false;

var MAX=6;
var ACTIONS={
chat:{name:"Send a Chat Message",icon:"paper",lore:"Sends a message to the player."},
title:{name:"Display Title",icon:"sign",lore:"Shows a big title on their screen."},
sound:{name:"Play Sound",icon:"disc",lore:"Plays a sound for the player."},
item:{name:"Give Item",icon:"apple",lore:"Puts a Golden Apple in their hotbar."},
potion:{name:"Apply Potion Effect",icon:"potion",lore:"Speed II for 10 seconds."},
launch:{name:"Launch to Target",icon:"rocket",lore:"Sends the player flying."},
teleport:{name:"Teleport Player",icon:"pearl",lore:"Moves the player somewhere else."},
stat:{name:"Change Player Stat",icon:"ingot",lore:"Adds 10 coins to their stats."}
};
var ORDER=["chat","title","sound","item","potion","launch","teleport","stat"];
var TRIGGERS={
join:{label:"Player Join",chat:"&6Welcome to my house, &eSteve&6!",title:["&6&lWELCOME","&7make yourself at home"]},
npc:{label:"Click NPC",chat:"&e[NPC] Guide&f: Want the grand tour?",title:["&e&lTHE TOUR","&7follow the signs"]},
parkour:{label:"Finish Parkour",chat:"&aYou finished the parkour!",title:["&6&lFINISHED","&7nice jumps"]}
};
var ARGS={sound:"note.pling",item:"Golden Apple ×1",potion:"Speed II · 10s",launch:"straight up",teleport:"somewhere else",stat:"coins +10"};
var trigger="join";
var list=["chat","title","sound"];
var busy=false;

var MC={"0":"#000000","1":"#0000aa","2":"#00aa00","3":"#00aaaa","4":"#aa0000","5":"#aa00aa","6":"#ffaa00","7":"#aaaaaa","8":"#555555","9":"#5555ff",a:"#55ff55",b:"#55ffff",c:"#ff5555",d:"#ff55ff",e:"#ffff55",f:"#ffffff"};
function dim(hex){var n=parseInt(hex.slice(1),16);return "rgb("+((n>>16&255)>>2)+","+((n>>8&255)>>2)+","+((n&255)>>2)+")";}
function mc(el,str){
el.textContent="";
var color="#ffffff",bold=false;
str.split("&").forEach(function(seg,i){
if(i>0){
var k=seg.charAt(0).toLowerCase();
seg=seg.slice(1);
if(MC[k]){color=MC[k];bold=false;}else if(k==="l"){bold=true;}else if(k==="r"){color="#ffffff";bold=false;}
}
if(!seg){return;}
var s=document.createElement("span");
s.textContent=seg;
s.style.setProperty("--c",color);
s.style.setProperty("--s",dim(color));
if(bold){s.className="b";}
el.appendChild(s);
});
return el;
}
function plain(str){return str.replace(/&./g,"");}
function argOf(key){
var T=TRIGGERS[trigger];
if(key==="chat"){return "“"+plain(T.chat)+"”";}
if(key==="title"){return "“"+plain(T.title[0])+"”";}
return ARGS[key];
}

function rng(seed){
return function(){
seed=(seed+0x6D2B79F5)|0;
var t=Math.imul(seed^(seed>>>15),1|seed);
t=(t+Math.imul(t^(t>>>7),61|t))^t;
return((t^(t>>>14))>>>0)/4294967296;
};
}
function cl(v){return Math.max(0,Math.min(255,Math.round(v)));}
function tc(c,f){f=f==null?1:f;return "rgb("+cl(c[0]*f*1.02)+","+cl(c[1]*f*0.94)+","+cl(c[2]*f*0.86)+")";}
function tile(x,type,col,row){
var ox=col*16,oy=row*16,r=rng(col*73+row*151+type.length*977),i,j,f;
function px(i,j,c,f){x.fillStyle=tc(c,f);x.fillRect(ox+i,oy+j,1,1);}
if(type==="dirt"||type==="grass"){
for(j=0;j<16;j++){for(i=0;i<16;i++){var n=r();px(i,j,n<0.08?[104,72,48]:(n>0.94?[156,116,80]:[134,96,66]),0.88+r()*0.24);}}
if(type==="grass"){
for(i=0;i<16;i++){
var depth=3+(r()<0.45?1:0)+(r()<0.2?1:0);
for(j=0;j<depth;j++){px(i,j,j===0?[121,186,72]:[92,156,54],0.86+r()*0.26);}
}
}
}else if(type==="planks"||type==="roof"||type==="roofL"||type==="roofR"){
var base=type==="planks"?[164,128,78]:[96,63,36];
for(j=0;j<16;j++){
var plank=j>>2,seam=(j&3)===3,cut=(plank*7+3)&15;
for(i=0;i<16;i++){
if(type==="roofL"&&j<8&&i<8){continue;}
if(type==="roofR"&&j<8&&i>7){continue;}
f=0.9+r()*0.16;
if(seam){f*=0.7;}else if(i===cut){f*=0.76;}
px(i,j,base,f);
}
}
}else if(type==="log"){
var stripes=[];
for(i=0;i<16;i++){stripes.push(0.78+r()*0.32);}
for(j=0;j<16;j++){for(i=0;i<16;i++){f=stripes[i]*(0.92+r()*0.14);if(i===0||i===15){f*=0.82;}px(i,j,[108,82,50],f);}}
}else if(type==="window"){
for(j=0;j<16;j++){for(i=0;i<16;i++){px(i,j,Math.abs(i-7.5)+Math.abs(j-8)<6?[255,196,104]:[226,140,58],0.94+r()*0.08);}}
for(i=0;i<16;i++){px(i,0,[226,242,248]);px(i,15,[190,214,224]);px(0,i,[226,242,248]);px(15,i,[190,214,224]);}
x.fillStyle="rgba(255,255,255,.45)";
x.fillRect(ox+3,oy+3,1,3);
x.fillRect(ox+4,oy+3,2,1);
}else if(type==="doorTop"||type==="doorBottom"){
for(j=0;j<16;j++){
for(i=0;i<16;i++){
var edge=i<2||i>13||(type==="doorTop"&&j<2)||(type==="doorBottom"&&j>13);
f=0.9+r()*0.14;
px(i,j,[150,110,62],edge?f*0.68:f);
}
}
if(type==="doorTop"){
x.fillStyle=tc([255,200,110]);
x.fillRect(ox+4,oy+4,3,6);
x.fillRect(ox+9,oy+4,3,6);
}else{
x.fillStyle=tc([110,78,42]);
x.fillRect(ox+4,oy+3,8,1);
x.fillRect(ox+4,oy+11,8,1);
x.fillRect(ox+4,oy+3,1,9);
x.fillRect(ox+11,oy+3,1,9);
x.fillStyle="#2a1a0c";
x.fillRect(ox+12,oy+1,2,2);
}
}else if(type==="wool"){
for(j=0;j<16;j++){for(i=0;i<16;i++){f=0.86+r()*0.22;if(((i+j*3)&3)===0){f*=0.92;}px(i,j,[236,124,32],f);}}
}else if(type==="quartz"){
for(j=0;j<16;j++){for(i=0;i<16;i++){f=0.95+r()*0.06;if(i===0||j===0){f*=1.03;}if(i===15||j===15){f*=0.86;}px(i,j,[236,229,220],f);}}
}
}
function cloud(x,cx,cy,len){
x.fillStyle="rgba(255,206,160,.38)";
x.fillRect(cx,cy,len,4);
x.fillRect(cx+5,cy-3,len-12,3);
x.fillStyle="rgba(255,236,214,.4)";
x.fillRect(cx+7,cy-3,len-18,1);
x.fillStyle="rgba(120,50,60,.25)";
x.fillRect(cx+2,cy+4,len-4,1);
}
function paintWorld(){
var c=mk(256,144),x=c.getContext("2d"),r=rng(7),i,y;
var SKY=[[20,11,38],[33,14,51],[52,19,62],[82,27,68],[122,38,62],[168,58,48],[210,92,40],[240,136,58],[255,182,98]];
var BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
var img=x.createImageData(256,112);
for(y=0;y<112;y++){
for(i=0;i<256;i++){
var v=y/111*(SKY.length-1)+(BAYER[(y&3)*4+(i&3)]/16-0.47);
var s=SKY[Math.max(0,Math.min(SKY.length-1,Math.round(v)))];
var o=(y*256+i)*4;
img.data[o]=s[0];img.data[o+1]=s[1];img.data[o+2]=s[2];img.data[o+3]=255;
}
}
x.putImageData(img,0,0);
for(i=0;i<16;i++){x.fillStyle="rgba(255,236,205,"+(0.35+r()*0.5).toFixed(2)+")";x.fillRect((r()*256)|0,(r()*34)|0,1,1);}
var halo=x.createRadialGradient(40,26,4,40,26,46);
halo.addColorStop(0,"rgba(255,214,120,.5)");
halo.addColorStop(1,"rgba(255,140,60,0)");
x.fillStyle=halo;
x.fillRect(0,0,100,80);
x.fillStyle="#ffc75e";
x.fillRect(28,14,24,24);
x.fillStyle="#ffe49c";
x.fillRect(32,18,16,16);
cloud(x,84,26,40);
cloud(x,150,40,52);
cloud(x,206,20,30);
var far=[18,20,24,26,28,26,22,20,18,20,24,30,34,32,28,24,22,20,18,20,24,28,26,22,20,18,20,22,26,28,24,20];
var near=[8,10,12,12,10,8,8,10,14,16,14,12,10,10,12,14,12,10,8,8,10,12,14,12,10,10,12,10,8,8,10,12];
for(i=0;i<32;i++){
x.fillStyle="#4a2140";x.fillRect(i*8,112-far[i],8,far[i]);
x.fillStyle="#5c2a4a";x.fillRect(i*8,112-far[i],8,1);
}
for(i=0;i<32;i++){x.fillStyle="#2f1329";x.fillRect(i*8,112-near[i],8,near[i]);}
for(i=0;i<16;i++){tile(x,"grass",i,7);tile(x,"dirt",i,8);}
tile(x,"log",6,5);tile(x,"log",6,6);tile(x,"log",10,5);tile(x,"log",10,6);
tile(x,"window",7,5);tile(x,"window",9,5);
tile(x,"planks",7,6);tile(x,"planks",9,6);
tile(x,"doorTop",8,5);tile(x,"doorBottom",8,6);
[[4,5,11],[3,6,10],[2,7,9]].forEach(function(rr){
for(var cc=rr[1];cc<=rr[2];cc++){tile(x,cc===rr[1]?"roofL":(cc===rr[2]?"roofR":"roof"),cc,rr[0]);}
});
tile(x,"wool",4,6);tile(x,"wool",2,5);tile(x,"quartz",0,4);
return c;
}
var STEVE=fromMap([
"....HHHHHHHH....",
"....HHHHHHHH....",
"....HSSSSSSH....",
"....SSSSSSSS....",
"....SWBSSBWS....",
"....SSSnnSSS....",
"....SSmmmmSS....",
"....SSSSSSSS....",
"ccccCCCCCCCCcccc",
"ccccCCCCCCCCcccc",
"ccccCCCCCCCCcccc",
"ccccCCCCCCCCcccc",
"SSSSCCCCCCCCSSSS",
"SSSSCCCCCCCCSSSS",
"SSSSCCCCCCCCSSSS",
"SSSSCCCCCCCCSSSS",
"SSSSCCCCCCCCSSSS",
"SSSSCCCCCCCCSSSS",
"sSSSCCCCCCCCSSSs",
"ssssCCCCCCCCssss",
"....PPPppPPP....",
"....PPPppPPP....",
"....PPPppPPP....",
"....PPPppPPP....",
"....PPPppPPP....",
"....PPPppPPP....",
"....PPPppPPP....",
"....PPPppPPP....",
"....PPPppPPP....",
"....PPPppPPP....",
"....gggggggg....",
"....gggggggg...."],{H:"#2b1d12",S:"#c79a7c",s:"#b07f63",W:"#ffffff",B:"#4c3d8f",n:"#9a6650",m:"#6b3f2c",C:"#00a8a8",c:"#008b8f",P:"#3a3aa3",p:"#2c2c80",g:"#5f5f5f"});
var VILLAGER=fromMap([
"....KKKKKKKK....",
"....KKKKKKKK....",
"....KKKKKKKK....",
"....UUUUUUUU....",
"....KWEKKEWK....",
"....KKKNNKKK....",
"....KKKNNKKK....",
"....KKKNNKKK....",
"....kKKNNKKk....",
"....kkkNNkkk....",
"....RRRNNRRR....",
"....RRRRRRRR....",
"....RRRRRRRR....",
"..AAAAAAAAAAAA..",
"..AaaAAAAAAaaA..",
"..AAAAAAAAAAAA..",
"....RRRRRRRR....",
"....rRRRRRRr....",
"....rRRRRRRr....",
"....rRRRRRRr....",
"....rRRRRRRr....",
"....rRRRRRRr....",
"....rRRRRRRr....",
"....rRRRRRRr....",
"....rRRRRRRr....",
"....rRRRRRRr....",
"....rRRRRRRr....",
"....rRRRRRRr....",
"....rRRRRRRr....",
"....rrrrrrrr....",
"....rrrrrrrr....",
"....rrrrrrrr...."],{K:"#bd8b6f",k:"#a3735a",U:"#4b2e20",W:"#ececec",E:"#2e8b3a",N:"#a8705a",R:"#6e4c2c",r:"#5b3d22",A:"#7d5733",a:"#bd8b6f"});
var NOTE=["..##","..#.","..#.","###.","###."];
var NPC={x:192,y:80};
var SPOTS={join:{x:128,y:80},npc:{x:210,y:80},parkour:{x:84,y:80}};
var TP=[{x:128,y:0},{x:236,y:80}];
var P={x:128,y:80,alpha:1};
var platePressed=false,nodUntil=0;
var scene=paintWorld();

var parts=[],tweens=[],looping=false,lastT=0;
function rand(a,b){return a+Math.random()*(b-a);}
function pick(arr){return arr[(Math.random()*arr.length)|0];}
function emit(p){if(reduced){return;}p.life=0;parts.push(p);kick();}
function stepParts(dt){
for(var i=parts.length-1;i>=0;i--){
var p=parts[i];
p.life+=dt;
if(p.life>=p.max){parts.splice(i,1);continue;}
if(p.drag){p.vx*=p.drag;p.vy*=p.drag;}
p.vy+=(p.g||0)*dt;
p.x+=p.vx*dt;
p.y+=p.vy*dt;
}
}
function draw(){
var now=performance.now();
w.drawImage(scene,0,0);
var py=platePressed?63:62;
w.fillStyle="#a67c12";w.fillRect(1,py,14,64-py);
w.fillStyle="#ffd84a";w.fillRect(2,py,12,1);
var nod=now<nodUntil&&Math.floor((nodUntil-now)/120)%2===0;
w.drawImage(VILLAGER,NPC.x,NPC.y+(nod?1:0));
if(P.alpha>0.01){
w.globalAlpha=P.alpha;
w.drawImage(STEVE,Math.round(P.x),Math.round(P.y));
w.globalAlpha=1;
}
for(var i=0;i<parts.length;i++){
var p=parts[i];
if(p.flick&&Math.random()<0.25){continue;}
w.globalAlpha=Math.max(0,Math.min(1,(1-p.life/p.max)*1.4));
w.fillStyle=p.col;
if(p.note){
for(var y=0;y<5;y++){for(var x=0;x<4;x++){if(NOTE[y].charAt(x)==="#"){w.fillRect(Math.round(p.x)+x,Math.round(p.y)+y,1,1);}}}
}else{
var sz=p.size||1;
w.fillRect(Math.round(p.x),Math.round(p.y),sz,sz);
}
}
w.globalAlpha=1;
}
function kick(){if(!looping){looping=true;lastT=0;requestAnimationFrame(loop);}}
function loop(t){
var dt=lastT?Math.min((t-lastT)/1000,0.05):0.016;
lastT=t;
for(var i=tweens.length-1;i>=0;i--){
var tw=tweens[i];
if(tw.t0==null){tw.t0=t;}
var k=Math.min(1,(t-tw.t0)/tw.ms);
tw.fn(k);
if(k>=1){tweens.splice(i,1);tw.done();}
}
var fast=effectUntil>Date.now();
if(fast&&Math.random()<0.5){swirl();}
stepParts(dt);
draw();
if(tweens.length||parts.length||busy||fast||performance.now()<nodUntil){requestAnimationFrame(loop);}else{looping=false;}
}
function tween(ms,fn){
return new Promise(function(done){
if(reduced){fn(1);draw();done();return;}
tweens.push({ms:ms,fn:fn,done:done,t0:null});
kick();
});
}
function wait(ms){return new Promise(function(done){setTimeout(done,ms);});}
function poof(x,y,n){for(var i=0;i<n;i++){emit({x:x+rand(-6,6),y:y+rand(-10,10),vx:rand(-26,26),vy:rand(-34,-6),drag:0.96,max:rand(0.45,0.8),col:pick(["#ffffff","#e6e6e6","#cfcfcf"]),size:2});}}
function notes(){
for(var i=0;i<5;i++){
setTimeout(function(){emit({note:true,x:P.x+rand(1,11),y:P.y-7,vx:rand(-7,7),vy:rand(-26,-16),max:rand(1.1,1.5),col:"hsl("+((Math.random()*360)|0)+",95%,62%)"});},i*95);
}
}
function swirl(){var a=Math.random()*6.283;emit({x:P.x+8+Math.cos(a)*9,y:P.y+6+Math.random()*24,vx:0,vy:rand(-14,-6),max:rand(0.5,0.8),col:pick(["#9fdcf2","#7cafc6","#c9f0ff"])});}
function burst(x,y){
var cols=["#fff3c4","#ffee90","#ffcb45","#fba71b","#f1850c","#ff5a1f"],i,a,sp;
for(i=0;i<54;i++){a=i/54*6.283+rand(-0.06,0.06);sp=rand(38,64);emit({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,g:26,drag:0.975,max:rand(0.9,1.4),col:pick(cols),flick:true,size:Math.random()<0.3?2:1});}
for(i=0;i<18;i++){a=Math.random()*6.283;sp=rand(10,24);emit({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,g:20,drag:0.97,max:rand(0.6,0.9),col:"#fff8dc",flick:true});}
}
function portal(x,y){
for(var i=0;i<26;i++){var a=Math.random()*6.283,d=rand(4,14);emit({x:x+Math.cos(a)*d,y:y+Math.sin(a)*d*1.6,vx:Math.cos(a)*rand(6,20),vy:Math.sin(a)*rand(6,20)-6,max:rand(0.5,0.9),col:pick(["#c77dff","#9d4edd","#e0aaff","#7b2cbf"]),size:Math.random()<0.3?2:1});}
}
function dust(x,y){for(var i=0;i<7;i++){emit({x:x+rand(-5,5),y:y-1,vx:rand(-22,22),vy:rand(-18,-6),g:70,max:rand(0.3,0.5),col:pick(["#8a6a4a","#a58560","#6e5238"])});}}
function sparkle(x,y,cols){for(var i=0;i<10;i++){emit({x:x+rand(-7,7),y:y+rand(-7,7),vx:rand(-10,10),vy:rand(-16,-4),max:rand(0.5,0.9),col:pick(cols||["#ffffff","#fff6c8"]),flick:true});}}

var audio=null,master=null,noiseBuf=null,muted=false,gestured=false;
try{muted=localStorage.getItem("ravell-muted")==="1";}catch(e){}
function sound(){
if(muted||!gestured){return null;}
if(!audio){
var AC=window.AudioContext||window.webkitAudioContext;
if(!AC){return null;}
audio=new AC();
master=audio.createGain();
master.gain.value=0.55;
master.connect(audio.destination);
}
if(audio.state==="suspended"){audio.resume();}
return audio;
}
function tone(f,at,dur,type,vol,to){
var a=sound();
if(!a){return;}
var t=a.currentTime+at,o=a.createOscillator(),g=a.createGain();
o.type=type||"sine";
o.frequency.setValueAtTime(f,t);
if(to){o.frequency.exponentialRampToValueAtTime(to,t+dur);}
g.gain.setValueAtTime(0.0001,t);
g.gain.exponentialRampToValueAtTime(vol||0.1,t+0.012);
g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
o.connect(g);g.connect(master);
o.start(t);o.stop(t+dur+0.03);
}
function hiss(at,dur,vol,freq,kind){
var a=sound();
if(!a){return;}
if(!noiseBuf){
noiseBuf=a.createBuffer(1,a.sampleRate,a.sampleRate);
var d=noiseBuf.getChannelData(0);
for(var i=0;i<d.length;i++){d[i]=Math.random()*2-1;}
}
var t=a.currentTime+at,s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();
s.buffer=noiseBuf;
f.type=kind||"lowpass";
f.frequency.value=freq||1200;
g.gain.setValueAtTime(vol||0.1,t);
g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
s.connect(f);f.connect(g);g.connect(master);
s.start(t);s.stop(t+dur+0.03);
}
var SFX={
pling:function(){tone(1046.5,0,0.55,"triangle",0.16);tone(2093,0,0.3,"sine",0.05);},
pop:function(){tone(520,0,0.1,"sine",0.14,980);},
coin:function(){tone(988,0,0.09,"square",0.045);tone(1319,0.08,0.28,"square",0.045);},
drink:function(){tone(190,0,0.09,"sine",0.14,130);tone(175,0.13,0.09,"sine",0.12,120);},
launch:function(){hiss(0,0.5,0.09,2400,"bandpass");},
boom:function(){hiss(0,0.7,0.3,500);for(var i=0;i<7;i++){hiss(0.18+Math.random()*0.5,0.05,0.06,4000,"highpass");}},
warp:function(){tone(720,0,0.4,"sawtooth",0.035,160);tone(360,0.04,0.36,"sine",0.06,110);},
hrm:function(){tone(196,0,0.32,"sawtooth",0.04,150);tone(392,0,0.3,"sine",0.025,300);},
level:function(){[523.3,659.3,784,1046.5].forEach(function(f,i){tone(f,i*0.08,0.28,"triangle",0.11);});},
join:function(){tone(659.3,0,0.18,"sine",0.07);tone(987.8,0.09,0.26,"sine",0.06);},
hop:function(){tone(300,0,0.06,"square",0.02,220);}
};

var chatEl=document.getElementById("aeChat"),titlesEl=document.getElementById("aeTitles"),barEl=document.getElementById("aeBar"),boardEl=document.getElementById("aeBoard"),tagEl=document.getElementById("aeTag"),hotbarEl=document.getElementById("aeHotbar"),popEl=document.getElementById("aePop");
var coins=0,apples=0,effectUntil=0,effectTimer=0,titleTimer=0,barTimer=0;
function say(str){
var li=document.createElement("li");
mc(li,str);
chatEl.appendChild(li);
while(chatEl.children.length>4){chatEl.removeChild(chatEl.firstChild);}
setTimeout(function(){
li.classList.add("is-old");
setTimeout(function(){if(li.parentNode){li.parentNode.removeChild(li);}},900);
},7000);
}
function title(main,sub){
mc(titlesEl.children[0],main);
mc(titlesEl.children[1],sub||"");
titlesEl.classList.add("is-on");
clearTimeout(titleTimer);
titleTimer=setTimeout(function(){titlesEl.classList.remove("is-on");},2200);
}
function actionBar(str){
mc(barEl,str);
barEl.classList.add("is-on");
clearTimeout(barTimer);
barTimer=setTimeout(function(){barEl.classList.remove("is-on");},1900);
}
function board(flash){
boardEl.textContent="";
["&e&lRAVELL"," ","Coins: &6"+coins,"Effect: "+(effectUntil>Date.now()?"&bSpeed II":"&7none")].forEach(function(line,i){
var p=document.createElement("p");
mc(p,line);
if(flash===i){p.className="is-flash";}
boardEl.appendChild(p);
});
}
function hotbar(fresh){
hotbarEl.textContent="";
for(var i=0;i<9;i++){
var s=document.createElement("div");
s.className="ae-hb"+(i===0?" is-sel":"");
if(i===0&&apples>0){
s.appendChild(iconImg("apple"));
if(apples>1){var n=document.createElement("i");n.textContent=String(apples);s.appendChild(n);}
if(fresh){s.classList.add("is-pop");}
}
hotbarEl.appendChild(s);
}
}
function tag(){
tagEl.textContent="";
["&fGuide","&e&lCLICK"].forEach(function(line){tagEl.appendChild(mc(document.createElement("p"),line));});
tagEl.style.left=((NPC.x+8)/256*100)+"%";
tagEl.style.top=((NPC.y-1)/144*100)+"%";
}
function pop(str){
mc(popEl,str);
popEl.style.left=((P.x+8)/256*100)+"%";
popEl.style.top=((P.y-2)/144*100)+"%";
popEl.classList.remove("is-on");
void popEl.offsetWidth;
popEl.classList.add("is-on");
}

function hop(tx,ty){
var x0=P.x,y0=P.y;
SFX.hop();
return tween(400,function(k){P.x=x0+(tx-x0)*k;P.y=y0+(ty-y0)*k-Math.sin(Math.PI*k)*14;}).then(function(){dust(P.x+8,P.y+32);return wait(110);});
}
function intro(){
platePressed=false;
nodUntil=0;
P.alpha=1;
if(trigger==="join"){
P.x=SPOTS.join.x;P.y=SPOTS.join.y;P.alpha=0;draw();
return wait(150).then(function(){
poof(P.x+8,P.y+16,16);
SFX.join();
return tween(380,function(k){P.alpha=k;});
}).then(function(){
say("&eSteve joined the house.");
return wait(450);
});
}
if(trigger==="npc"){
P.x=SPOTS.npc.x;P.y=SPOTS.npc.y;draw();
return wait(250).then(function(){
sparkle(NPC.x+8,NPC.y+6);
nodUntil=performance.now()+480;
SFX.hrm();
kick();
return wait(520);
});
}
P.x=SPOTS.parkour.x;P.y=SPOTS.parkour.y;draw();
return wait(200).then(function(){return hop(64,64);}).then(function(){return hop(32,48);}).then(function(){return hop(0,30);}).then(function(){
platePressed=true;
P.y=31;
sparkle(8,58,["#ffd84a","#fff3c4","#ffffff"]);
SFX.level();
draw();
return wait(380);
});
}
function launch(){
var y0=P.y,top=y0-58,onPlate=platePressed;
platePressed=false;
SFX.launch();
return tween(520,function(k){
P.y=y0+(top-y0)*(1-(1-k)*(1-k));
if(Math.random()<0.7){emit({x:P.x+rand(5,11),y:P.y+30,vx:rand(-6,6),vy:rand(8,20),max:rand(0.4,0.7),col:pick(["#bdbdbd","#9e9e9e","#ffcb45","#f1850c"]),size:2});}
}).then(function(){
burst(P.x+8,Math.max(P.y-8,14));
SFX.boom();
return tween(560,function(k){P.y=top+(y0-top)*k*k;});
}).then(function(){
platePressed=onPlate;
dust(P.x+8,P.y+32);
return wait(250);
});
}
function teleport(){
var a=TP[0],b=TP[1];
var to=Math.abs(b.x-P.x)+Math.abs(b.y-P.y)>Math.abs(a.x-P.x)+Math.abs(a.y-P.y)?b:a;
portal(P.x+8,P.y+16);
SFX.warp();
return tween(220,function(k){P.alpha=1-k;}).then(function(){
platePressed=false;
P.x=to.x;P.y=to.y;
portal(P.x+8,P.y+16);
return tween(260,function(k){P.alpha=k;});
}).then(function(){return wait(380);});
}
var STEP={
chat:function(){say(TRIGGERS[trigger].chat);return wait(650);},
title:function(){var t=TRIGGERS[trigger].title;title(t[0],t[1]);return wait(950);},
sound:function(){SFX.pling();notes();return wait(750);},
item:function(){apples=Math.min(64,apples+1);hotbar(true);SFX.pop();actionBar("&e+1 &6Golden Apple");return wait(650);},
potion:function(){
effectUntil=Date.now()+10000;
board(3);
actionBar("&bSpeed II &7(0:10)");
SFX.drink();
clearTimeout(effectTimer);
effectTimer=setTimeout(function(){board();},10050);
kick();
return wait(800);
},
launch:launch,
teleport:teleport,
stat:function(){coins+=10;board(2);pop("&6+10 coins");SFX.coin();return wait(700);}
};

var paletteEl=document.getElementById("aePalette"),listEl=document.getElementById("aeList"),countEl=document.getElementById("aeCount"),infoEl=document.getElementById("aeInfo"),titleEl=document.getElementById("aeTitle"),runBtn=document.getElementById("aeRun"),clearBtn=document.getElementById("aeClear"),screen=document.getElementById("aeScreen"),muteBtn=document.getElementById("aeMute");
var trigBtns=Array.prototype.slice.call(document.querySelectorAll("#aeTriggers [data-trigger]"));
var INFO_NAME="Event Actions",INFO_LORE="Hover or tap an item to see what it does.";
function info(name,lore,warn){
infoEl.textContent="";
var b=document.createElement("b"),s=document.createElement("span");
b.textContent=name;
s.textContent=lore;
infoEl.appendChild(b);
infoEl.appendChild(s);
infoEl.classList.toggle("is-warn",!!warn);
}
ORDER.forEach(function(key){
var A=ACTIONS[key];
var b=document.createElement("button");
b.type="button";
b.className="ae-slot";
b.setAttribute("aria-label","Add "+A.name);
b.appendChild(iconImg(A.icon));
b.addEventListener("pointerenter",function(){info(A.name,A.lore);});
b.addEventListener("focus",function(){info(A.name,A.lore);});
b.addEventListener("click",function(){add(key);});
paletteEl.appendChild(b);
});
function add(key){
if(busy){return;}
if(list.length>=MAX){
info("That's the limit","This preview runs up to "+MAX+" actions.",true);
listEl.classList.remove("is-full");
void listEl.offsetWidth;
listEl.classList.add("is-full");
return;
}
list.push(key);
renderList(list.length-1);
info(ACTIONS[key].name,ACTIONS[key].lore);
}
function renderList(fresh){
listEl.textContent="";
if(!list.length){
var empty=document.createElement("li");
empty.className="ae-empty";
empty.textContent="No actions yet. Add some from above.";
listEl.appendChild(empty);
}
list.forEach(function(key,i){
var A=ACTIONS[key];
var li=document.createElement("li");
li.className="ae-item"+(i===fresh?" is-new":"");
var slot=document.createElement("span");
slot.className="ae-slot";
slot.appendChild(iconImg(A.icon));
var text=document.createElement("span");
text.className="ae-item-text";
var name=document.createElement("span");
name.className="ae-item-name";
name.textContent=A.name;
var arg=document.createElement("span");
arg.className="ae-item-arg";
arg.textContent=argOf(key);
text.appendChild(name);
text.appendChild(arg);
var x=document.createElement("button");
x.type="button";
x.className="ae-x";
x.textContent="x";
x.setAttribute("aria-label","Remove "+A.name);
x.addEventListener("click",function(){
if(busy){return;}
list.splice(i,1);
renderList();
var rest=listEl.querySelectorAll(".ae-x");
(rest[Math.min(i,rest.length-1)]||paletteEl.querySelector("button")).focus();
});
li.appendChild(slot);
li.appendChild(text);
li.appendChild(x);
listEl.appendChild(li);
});
countEl.textContent=list.length+"/"+MAX;
}
function pose(){
var s=SPOTS[trigger];
P.x=s.x;P.y=s.y;P.alpha=1;
platePressed=false;
draw();
}
function setTrigger(key,focus){
trigger=key;
trigBtns.forEach(function(b){
var on=b.getAttribute("data-trigger")===key;
b.setAttribute("aria-checked",on?"true":"false");
b.tabIndex=on?0:-1;
if(on&&focus){b.focus();}
});
titleEl.textContent="Event Actions: "+TRIGGERS[key].label;
renderList();
pose();
}
trigBtns.forEach(function(b,i){
b.addEventListener("click",function(){if(!busy){setTrigger(b.getAttribute("data-trigger"),false);}});
b.addEventListener("keydown",function(e){
var j=-1;
if(e.key==="ArrowRight"||e.key==="ArrowDown"){j=(i+1)%trigBtns.length;}
else if(e.key==="ArrowLeft"||e.key==="ArrowUp"){j=(i-1+trigBtns.length)%trigBtns.length;}
if(j<0||busy){return;}
e.preventDefault();
setTrigger(trigBtns[j].getAttribute("data-trigger"),true);
});
});
function lock(on){
busy=on;
runBtn.setAttribute("aria-disabled",on?"true":"false");
runBtn.textContent=on?"Running...":"▶ Run";
clearBtn.disabled=on;
trigBtns.forEach(function(b){b.disabled=on;});
Array.prototype.forEach.call(ae.querySelectorAll(".ae-palette button,.ae-x"),function(b){b.disabled=on;});
}
function mark(i,cls){
var li=listEl.querySelectorAll(".ae-item")[i];
if(!li){return;}
li.classList.remove("is-running","is-done");
li.classList.add(cls);
}
function clearMarks(){Array.prototype.forEach.call(listEl.querySelectorAll(".ae-item"),function(li){li.classList.remove("is-running","is-done");});}
function run(auto){
if(busy){return;}
if(auto!==true){
gestured=true;
sound();
var r=screen.getBoundingClientRect();
if(r.top<60||r.bottom>window.innerHeight){screen.scrollIntoView({behavior:reduced?"auto":"smooth",block:"center"});}
}
lock(true);
var queue=list.slice();
var chain=intro();
queue.forEach(function(key,i){
chain=chain.then(function(){mark(i,"is-running");return STEP[key]();}).then(function(){mark(i,"is-done");});
});
chain.catch(function(){}).then(function(){
if(!queue.length){actionBar("&7No actions to run yet.");}
return wait(400);
}).then(function(){
lock(false);
setTimeout(function(){if(!busy){clearMarks();}},1400);
});
}
runBtn.addEventListener("click",run);
clearBtn.addEventListener("click",function(){
if(busy){return;}
list=[];
renderList();
info(INFO_NAME,INFO_LORE);
});
function syncMute(){muteBtn.setAttribute("aria-pressed",muted?"true":"false");}
muteBtn.addEventListener("click",function(){
muted=!muted;
try{localStorage.setItem("ravell-muted",muted?"1":"0");}catch(e){}
syncMute();
if(!muted){gestured=true;sound();}
});
syncMute();

board();
hotbar();
tag();
renderList();
pose();
if(!reduced&&"IntersectionObserver" in window){
var auto=new IntersectionObserver(function(entries){
if(!entries[0].isIntersecting){return;}
auto.disconnect();
setTimeout(function(){run(true);},500);
},{threshold:0.6});
auto.observe(screen);
}
})();
