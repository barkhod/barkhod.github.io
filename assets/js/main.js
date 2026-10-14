(function(){
var prefersReduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
document.querySelectorAll('a[href^="http"],a[href^="mailto:"]').forEach(function(link){
link.setAttribute("target","_blank");
link.setAttribute("rel","noreferrer");
});

// A new splash line on every visit, like the game's title screen.
var SPLASHES=["now with redis!","100% java!","Check Out Ravell!","also try MineHeaven!","tps: 20.0!","mongodb inside!","crafted, not copied!","works on my server!","ping: 1ms!"];
var splash=document.getElementById("splash");
if(splash){splash.textContent=SPLASHES[Math.random()*SPLASHES.length|0];}

// Line numbers for the editor card, counted from the code itself.
var code=document.getElementById("editorCode");
var gutter=document.getElementById("editorLines");
if(code&&gutter){
var count=code.textContent.split("\n").length,nums=[];
for(var n=1;n<=count;n++){nums.push(n);}
gutter.textContent=nums.join("\n");
}

// Home cards fade up as they scroll in. Without the observer (or with reduced motion) they simply show.
var revealEls=document.querySelectorAll("[data-reveal]");
if(revealEls.length&&window.IntersectionObserver&&!prefersReduced){
document.documentElement.classList.add("js-reveal");
var revealer=new IntersectionObserver(function(entries){
entries.forEach(function(entry){
if(!entry.isIntersecting){return;}
entry.target.classList.add("is-revealed");
revealer.unobserve(entry.target);
});
},{threshold:0.15,rootMargin:"0px 0px -8% 0px"});
Array.prototype.forEach.call(revealEls,function(el,i){
el.style.transitionDelay=(i*70)+"ms";
revealer.observe(el);
});
}

// Teams on the Experience page: pick one to show its details (mc-clock.js rewinds the clock).
var guilds=Array.prototype.slice.call(document.querySelectorAll(".guild"));
function pickGuild(g,focus){
guilds.forEach(function(x){
var on=x===g;
x.classList.toggle("is-active",on);
x.setAttribute("aria-selected",on?"true":"false");
x.tabIndex=on?0:-1;
var panel=document.getElementById(x.getAttribute("aria-controls"));
if(panel){panel.hidden=!on;}
});
if(focus){g.focus();}
}
guilds.forEach(function(g,i){
g.addEventListener("click",function(){pickGuild(g,false);});
g.addEventListener("keydown",function(e){
var j=-1;
if(e.key==="ArrowDown"||e.key==="ArrowRight"){j=(i+1)%guilds.length;}
else if(e.key==="ArrowUp"||e.key==="ArrowLeft"){j=(i-1+guilds.length)%guilds.length;}
else if(e.key==="Home"){j=0;}
else if(e.key==="End"){j=guilds.length-1;}
if(j<0){return;}
e.preventDefault();
e.stopPropagation();
pickGuild(guilds[j],true);
});
});

// Hotbar: hovering (or tapping) a slot holds it, and its name shows above for a moment, as in-game.
var held=document.getElementById("held");
var heldTimer=null;
var slots=Array.prototype.slice.call(document.querySelectorAll(".hotbar .slot[data-name]"));
function hold(slot){
slots.forEach(function(s){s.classList.toggle("is-held",s===slot);});
if(!held){return;}
held.textContent=slot.getAttribute("data-name");
held.classList.add("show");
if(heldTimer){clearTimeout(heldTimer);}
heldTimer=setTimeout(function(){held.classList.remove("show");},2200);
}
slots.forEach(function(s){
s.addEventListener("pointerenter",function(e){if(e.pointerType!=="touch"){hold(s);}});
s.addEventListener("focus",function(){hold(s);});
s.addEventListener("click",function(){hold(s);});
});
if(slots.length){slots[0].classList.add("is-held");}

// Discord card: Main / Board tabs.
var dcTabs=Array.prototype.slice.call(document.querySelectorAll(".dc-tab"));
dcTabs.forEach(function(tab){
tab.addEventListener("click",function(){
dcTabs.forEach(function(x){x.classList.toggle("active",x===tab);});
Array.prototype.forEach.call(document.querySelectorAll(".dc-panel"),function(p){
p.hidden=p.getAttribute("data-dc-panel")!==tab.getAttribute("data-dc");
});
});
});

// Discord > Settings > Advanced > Developer Mode, then right-click your name > Copy User ID.
// With it, "Message" opens your profile and the status dot shows your real status
// (live status also needs you to be in the Lanyard server: discord.gg/lanyard).
var DISCORD_USER_ID="";
var DISCORD_USERNAME="barkhod_not";
var dcStatus=document.getElementById("dcStatus");
var dcMessage=document.getElementById("dcMessage");
var toastEl=null;
var toastTimer=null;
function toast(text){
if(!toastEl){
toastEl=document.createElement("div");
toastEl.className="toast";
toastEl.setAttribute("role","status");
document.body.appendChild(toastEl);
}
toastEl.textContent=text;
toastEl.classList.add("show");
if(toastTimer){clearTimeout(toastTimer);}
toastTimer=setTimeout(function(){toastEl.classList.remove("show");},3200);
}
function copyText(text){
if(navigator.clipboard&&window.isSecureContext){return navigator.clipboard.writeText(text);}
return new Promise(function(resolve,reject){
var ta=document.createElement("textarea");
ta.value=text;
ta.setAttribute("readonly","");
ta.style.position="fixed";
ta.style.opacity="0";
document.body.appendChild(ta);
ta.select();
var ok=false;
try{ok=document.execCommand("copy");}catch(e){}
document.body.removeChild(ta);
if(ok){resolve();}else{reject();}
});
}
if(DISCORD_USER_ID){
if(dcMessage){dcMessage.setAttribute("href","https://discord.com/users/"+DISCORD_USER_ID);}
fetch("https://api.lanyard.rest/v1/users/"+DISCORD_USER_ID).then(function(res){return res.json();}).then(function(json){
var s=json&&json.success&&json.data&&json.data.discord_status;
if(dcStatus&&(s==="online"||s==="idle"||s==="dnd"||s==="offline")){dcStatus.setAttribute("data-state",s);}
}).catch(function(){});
}else if(dcMessage){
// No user ID: Discord has no link that opens a profile by username, so hand the visitor the
// username to paste into Add Friend while the link opens Discord.
dcMessage.addEventListener("click",function(){
copyText(DISCORD_USERNAME).then(function(){
toast("Copied "+DISCORD_USERNAME+" — paste it in Discord → Add Friend");
},function(){
toast("Add me on Discord: "+DISCORD_USERNAME);
});
});
}
})();
