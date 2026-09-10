let violationCount=0,examSubmitted=false;
function violation(type,details=""){violationCount++;if(typeof session!=="undefined"&&session)api("logEvent",{token:session.token,eventType:type,details}).catch(()=>{});const b=document.getElementById("security");if(b){b.classList.add("violation");b.textContent=`INTEGRITY WARNING — ${violationCount} EVENT(S)`}}
["copy","cut","paste","contextmenu","dragstart","drop"].forEach(t=>document.addEventListener(t,e=>{e.preventDefault();violation(t.toUpperCase()+"_BLOCKED")},true));
document.addEventListener("keydown",e=>{let k=e.key.toLowerCase();if((e.ctrlKey||e.metaKey)&&["c","v","x","a","s","p","u"].includes(k)){e.preventDefault();violation("SHORTCUT_BLOCKED",k)}if(e.key==="F12"||((e.ctrlKey||e.metaKey)&&e.shiftKey&&["i","j","c"].includes(k))){e.preventDefault();violation("DEVTOOLS_SHORTCUT_BLOCKED",e.key)}});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&!examSubmitted)violation("TAB_HIDDEN")});
window.addEventListener("blur",()=>{if(!document.hidden&&!examSubmitted)violation("WINDOW_BLUR")});
document.addEventListener("fullscreenchange",()=>{if(!document.fullscreenElement&&!examSubmitted)violation("FULLSCREEN_EXIT")});
window.addEventListener("beforeunload",e=>{if(!examSubmitted){e.preventDefault();e.returnValue=""}});
async function fullscreen(){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen()}catch(e){}}
