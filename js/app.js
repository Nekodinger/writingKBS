let session=null,questions=[],remaining=0,timer=null,answers={};
const $=x=>document.getElementById(x);
function isTeacher(){return new URLSearchParams(location.search).get("panel")==="teacher";}
document.addEventListener("DOMContentLoaded",()=>{if(isTeacher())initTeacher();else initStudent()});

async function initStudent(){
 $("loginBtn").onclick=startStudent;
}
async function startStudent(){
 const studentId=$("studentId").value.trim(),accessCode=$("accessCode").value.trim();
 if(!studentId||!accessCode){$("loginMsg").textContent="Enter Student ID and Access Code.";return}
 $("loginBtn").disabled=true;$("loginMsg").textContent="Checking...";
 try{let r=await api("startSession",{studentId,accessCode});if(!r.success)throw Error(r.message);
 session=r;questions=r.questions;remaining=r.durationSeconds;
 $("assessmentTitle").textContent=r.assessmentTitle;$("studentInfo").textContent=`${r.name} • ${r.className} • ID ${r.studentId}`;
 $("login").classList.add("hidden");$("studentApp").classList.remove("hidden");renderQuestions();startTimer();await fullscreen();
 }catch(e){$("loginMsg").textContent=e.message;$("loginBtn").disabled=false}
}
function renderQuestions(){$("studentQuestions").innerHTML="";questions.forEach((q,i)=>{let a=document.createElement("article");a.className="question";a.innerHTML=`<div class="qtitle">Writing Task ${i+1}</div><div class="prompt"></div><textarea id="ans_${q.id}" autocomplete="off" spellcheck="false" placeholder="Write your response here..."></textarea>`;a.querySelector(".prompt").textContent=q.question;let ta=a.querySelector("textarea");ta.oninput=()=>{answers[q.id]=ta.value;};$("studentQuestions").appendChild(a)})}
function startTimer(){tick();timer=setInterval(()=>{remaining--;tick();if(remaining<=0){clearInterval(timer);submitStudent(true)}},1000)}
function tick(){let m=Math.floor(remaining/60),s=remaining%60;$("timer").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;if(remaining<=300)$("timer").classList.add("warning")}
$("submitBtn").onclick=()=>submitStudent(false);
async function submitStudent(auto){if(examSubmitted)return;if(!auto&&!confirm("Submit? You cannot edit after submission."))return;questions.forEach(q=>{let t=$("ans_"+q.id);if(t)answers[q.id]=t.value});examSubmitted=true;clearInterval(timer);$("submitBtn").disabled=true;try{let r=await api("submitAssessment",{token:session.token,answers,violationCount});if(!r.success)throw Error(r.message);$("studentApp").classList.add("hidden");$("finish").classList.remove("hidden");if(document.fullscreenElement)document.exitFullscreen().catch(()=>{})}catch(e){examSubmitted=false;$("submitBtn").disabled=false;alert(e.message)}}

async function initTeacher(){
 $("login").classList.add("hidden");$("teacherApp").classList.remove("hidden");$("modeLabel").textContent="Teacher";
 let key=prompt("Enter teacher panel key");if(!key){location.href=location.pathname;return}
 window.teacherKey=key;await loadAssessments();$("refreshBtn").onclick=loadProgress;$("saveSettings").onclick=saveAssessment;
}
async function loadAssessments(){try{let r=await api("teacherAssessments",{teacherKey});if(!r.success)throw Error(r.message);$("assessmentSelect").innerHTML=r.assessments.map(a=>`<option value="${a.id}">${a.title}</option>`).join("");$("assessmentSelect").onchange=loadSettings;await loadSettings()}catch(e){$("teacherMsg").textContent=e.message}}
async function loadSettings(){let id=$("assessmentSelect").value,r=await api("getAssessmentSettings",{teacherKey,assessmentId:id});if(!r.success)return;$("aTitle").value=r.title;$("aDuration").value=r.durationMinutes;$("aTemplate").value=r.templateId;$("aFolder").value=r.folderId;$("aTeacherEmail").value=r.teacherEmail;await loadProgress()}
async function loadProgress(){let id=$("assessmentSelect").value,r=await api("teacherProgress",{teacherKey,assessmentId:id});if(!r.success){$("progressTable").textContent=r.message;return}let h="<table><tr><th>Student</th><th>Class</th><th>Status</th><th>Started</th><th>Submitted</th><th>Violations</th><th>Doc</th></tr>";r.students.forEach(s=>{h+=`<tr><td>${esc(s.name)}</td><td>${esc(s.className)}</td><td>${esc(s.status)}</td><td>${esc(s.started)}</td><td>${esc(s.submitted)}</td><td class="${s.violations?'danger':'ok'}">${s.violations}</td><td>${s.docUrl?`<a href="${s.docUrl}" target="_blank">View</a>`:"—"}</td></tr>`});$("progressTable").innerHTML=h+"</table>"}
async function saveAssessment(){let p={teacherKey,assessmentId:$("assessmentSelect").value,title:$("aTitle").value,durationMinutes:$("aDuration").value,templateId:$("aTemplate").value,folderId:$("aFolder").value,teacherEmail:$("aTeacherEmail").value};let r=await api("saveAssessmentSettings",p);$("teacherMsg").textContent=r.success?"Saved.":r.message}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
