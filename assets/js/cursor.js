(function(){
if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){return;}
if(window.matchMedia("(pointer: coarse)").matches){return;}
var canvas=document.createElement("canvas");
canvas.id="cursor-trail";
document.body.appendChild(canvas);
var ctx=canvas.getContext("2d");
if(!ctx){return;}
function size(){
canvas.width=window.innerWidth;
canvas.height=window.innerHeight;
}
size();
window.addEventListener("resize",size);
var mx=-100,my=-100,fx=-100,fy=-100,seen=false;
window.addEventListener("pointermove",function(e){
mx=e.clientX;
my=e.clientY;
if(!seen){fx=mx;fy=my;seen=true;}
},{passive:true});
document.addEventListener("mouseleave",function(){
mx=-100;
my=-100;
seen=false;
});
function frame(){
ctx.clearRect(0,0,canvas.width,canvas.height);
if(seen&&mx>-50&&my>-50){
fx+=(mx-fx)*0.25;
fy+=(my-fy)*0.25;
// The pale blue of the dark theme disappears on the light one.
var light=document.documentElement.getAttribute("data-theme")==="light";
var ring=light?"#1f73e0":"#4da3ff",dot=light?"#7c5cff":"#8ec2ff";
ctx.globalAlpha=0.95;
ctx.strokeStyle=ring;
ctx.lineWidth=2;
ctx.shadowColor=ring;
ctx.shadowBlur=14;
ctx.beginPath();
ctx.arc(fx,fy,14,0,Math.PI*2);
ctx.stroke();
ctx.globalAlpha=1;
ctx.fillStyle=dot;
ctx.shadowColor=dot;
ctx.shadowBlur=10;
ctx.beginPath();
ctx.arc(fx,fy,4,0,Math.PI*2);
ctx.fill();
ctx.shadowBlur=0;
}
requestAnimationFrame(frame);
}
frame();
})();
