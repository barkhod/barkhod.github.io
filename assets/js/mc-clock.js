(function(){
var face=document.getElementById("mcClockFace");
var canvas=document.getElementById("mcClockCanvas");
if(!face||!canvas||!canvas.getContext) return;
var ctx=canvas.getContext("2d");
if(!ctx) return;
var yearEl=document.getElementById("mcClockYear");
var phaseEl=document.getElementById("mcClockPhase");
var needle=document.getElementById("mcClockNeedle");
var track=document.getElementById("mcClockTrack");
var labels=document.getElementById("mcClockLabels");
var reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var TAU=Math.PI*2;
// The clock item turns through 64 dial frames, as in Java Edition.
var FRAMES=64;
var N=16;
// The timeline runs from the first year of development to the current one.
var START=2022;
var END=Math.max(new Date().getFullYear(),START+1);
// o outline, g gold, r inner rim, d dial
var SPRITE=[
".....oooooo.....",
"...ooggggggoo...",
"..oggrrrrrrggo..",
".ogrrddddddrrgo.",
".ogrddddddddrgo.",
"ogrddddddddddrgo",
"ogrddddddddddrgo",
"ogrddddddddddrgo",
"ogrddddddddddrgo",
"ogrddddddddddrgo",
"ogrddddddddddrgo",
".ogrddddddddrgo.",
".ogrrddddddrrgo.",
"..oggrrrrrrggo..",
"...ooggggggoo...",
".....oooooo....."
];
function rgb(h){return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}
var C={
outline:rgb("#2b1d05"),goldHi:rgb("#fff1a0"),gold:rgb("#f2c12e"),goldLo:rgb("#b67f12"),
rimLo:rgb("#6e4a08"),rimHi:rgb("#c99522"),
dayHi:rgb("#b4dcff"),day:rgb("#6aaeff"),night:rgb("#1d2656"),nightLo:rgb("#121a40"),
sun:rgb("#ffe14d"),sunHi:rgb("#fffbd0"),moon:rgb("#e8ecf8"),moonLo:rgb("#aeb6cf"),star:rgb("#f2f5ff")
};
// Stars ride on the night half: [radians from the moon, distance from the centre].
var STARS=[[-0.95,4.1],[0.7,4.4],[1.3,2.2]];
var img=ctx.createImageData(N,N);
function wrap(a){a=(a+Math.PI)%TAU;if(a<0){a+=TAU;}return a-Math.PI;}
function put(x,y,c){var i=(y*N+x)*4;img.data[i]=c[0];img.data[i+1]=c[1];img.data[i+2]=c[2];img.data[i+3]=255;}
// sun: the sun's angle on the dial, clockwise from the top (0 = noon, PI = midnight).
function draw(sun){
img.data.fill(0);
var sx=8+Math.sin(sun)*3.2,sy=8-Math.cos(sun)*3.2;
var SX=Math.round(sx),SY=Math.round(sy);
var MX=Math.round(16-sx),MY=Math.round(16-sy);
var stars={};
for(var s=0;s<STARS.length;s++){
var a=sun+Math.PI+STARS[s][0];
stars[Math.floor(8+Math.sin(a)*STARS[s][1])+","+Math.floor(8-Math.cos(a)*STARS[s][1])]=1;
}
for(var y=0;y<N;y++){
for(var x=0;x<N;x++){
var k=SPRITE[y].charAt(x);
if(k==="."){continue;}
var dx=x+0.5-8,dy=y+0.5-8;
// Light from the top-left: 1 facing it, -1 facing away.
var lit=(-dx-dy)/(Math.sqrt(dx*dx+dy*dy)*Math.SQRT2);
if(k==="o"){put(x,y,C.outline);continue;}
if(k==="g"){put(x,y,lit>0.5?C.goldHi:(lit<-0.5?C.goldLo:C.gold));continue;}
if(k==="r"){put(x,y,lit>0?C.rimLo:C.rimHi);continue;}
var inSun=x>=SX-1&&x<=SX&&y>=SY-1&&y<=SY;
var inMoon=x>=MX-1&&x<=MX&&y>=MY-1&&y<=MY;
if(inSun){put(x,y,(x===SX-1&&y===SY-1)?C.sunHi:C.sun);continue;}
if(inMoon){put(x,y,(x===MX&&y===MY)?C.moonLo:C.moon);continue;}
var day=Math.abs(wrap(Math.atan2(dx,-dy)-sun))<Math.PI/2;
if(day){
var ds=Math.sqrt((x+0.5-sx)*(x+0.5-sx)+(y+0.5-sy)*(y+0.5-sy));
put(x,y,ds<2.3?C.dayHi:C.day);
}else if(stars[x+","+y]){
put(x,y,C.star);
}else{
put(x,y,Math.sqrt(dx*dx+dy*dy)>4.2?C.nightLo:C.night);
}
}
}
ctx.putImageData(img,0,0);
}
var angle=0,vel=0,target=0,spinUntil=0,running=false,lastFrame=null;
function render(){
var f=Math.round(angle/TAU*FRAMES);
if(f===lastFrame){return;}
lastFrame=f;
draw(f/FRAMES*TAU);
}
function step(ts){
if(ts<spinUntil){
// Nether/End behaviour: the dial spins erratically.
vel+=(Math.random()-0.5)*0.09;
vel=Math.max(-0.55,Math.min(0.55,vel));
if(Math.abs(vel)<0.18){vel+=vel<0?-0.04:0.04;}
}else{
// Back in the Overworld it swings to its target and settles with a wobble.
var diff=wrap(target-angle);
vel=vel*0.86+diff*0.05;
if(Math.abs(diff)<0.004&&Math.abs(vel)<0.002){angle=target;vel=0;running=false;render();return;}
}
angle+=vel;
render();
requestAnimationFrame(step);
}
function start(){if(!running){running=true;requestAnimationFrame(step);}}
function at(year){return Math.max(0,Math.min(1,(year-START)/(END-START)));}
// The career as a Minecraft day: sunrise in the first year, the sun at its highest now.
function sunFor(p){return (p-1)*Math.PI/2;}
function buildScale(){
if(!labels||!track) return;
labels.innerHTML="";
for(var y=START;y<=END;y++){
var p=(at(y)*100).toFixed(3)+"%";
var lab=document.createElement("span");
lab.textContent=String(y);
lab.style.setProperty("--at",p);
labels.appendChild(lab);
var tick=document.createElement("i");
tick.className="mc-clock-tick";
tick.style.setProperty("--at",p);
track.appendChild(tick);
}
}
var shownYear=null,rollTimer=null;
// Step the big number through the years in between, like an odometer.
function rollTo(year){
if(!yearEl) return;
if(rollTimer){clearTimeout(rollTimer);rollTimer=null;}
if(reduced||shownYear===null||shownYear===year){shownYear=year;yearEl.textContent=String(year);return;}
(function tick(){
shownYear+=year>shownYear?1:-1;
yearEl.textContent=String(shownYear);
if(shownYear!==year){rollTimer=setTimeout(tick,70);}
})();
}
// label: what the chip says; year: where the needle and the dial go.
function show(label,year){
var p=at(year);
target=sunFor(p);
rollTo(year);
if(phaseEl){phaseEl.textContent=label;phaseEl.setAttribute("data-phase",p<0.3?"sunrise":"day");}
if(needle){needle.style.setProperty("--mc-pos",(p*100).toFixed(2)+"%");}
face.setAttribute("aria-label","Minecraft clock timeline at "+year+" ("+label+"). Click to spin it like in the Nether.");
if(!running){angle=target;render();}
}
function showNow(){show("Now",Math.min(new Date().getFullYear(),END));}
function showTab(tab){
var y=parseInt(tab.getAttribute("data-year"),10);
if(!y) return;
var name=tab.querySelector(".guild-name");
show(name?name.textContent:String(y),y);
}
buildScale();
showNow();
// Hovering (or tapping) a company sends the clock back to the year it started there.
Array.prototype.forEach.call(document.querySelectorAll(".guild[data-year]"),function(tab){
tab.addEventListener("pointerenter",function(e){if(e.pointerType!=="touch"){showTab(tab);}});
tab.addEventListener("pointerleave",function(e){if(e.pointerType!=="touch"){showNow();}});
tab.addEventListener("focus",function(){showTab(tab);});
tab.addEventListener("blur",showNow);
// Touch has no hover: a tap keeps the company's year up until something else is chosen.
tab.addEventListener("click",function(){showTab(tab);});
});
document.addEventListener("visibilitychange",function(){if(!document.hidden&&phaseEl&&phaseEl.textContent==="Now"){showNow();}});
document.addEventListener("pagechange",function(e){
if(!e.detail||e.detail.id!=="experience"){return;}
showNow();
if(reduced){return;}
// Opening the Experience page: the dial swings into place like a freshly picked-up clock.
angle=target+(Math.random()<0.5?-1:1)*0.9;
vel=0;
spinUntil=0;
start();
});
if(!reduced){
face.addEventListener("click",function(){
spinUntil=performance.now()+1300;
vel=(Math.random()<0.5?-1:1)*(0.35+Math.random()*0.15);
start();
});
face.addEventListener("pointerenter",function(e){
if(e.pointerType==="touch"||performance.now()<spinUntil){return;}
vel+=0.07;
start();
});
}
})();
