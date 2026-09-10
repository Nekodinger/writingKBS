const SPREADSHEET_ID="PASTE_SPREADSHEET_ID";
const TEACHER_PANEL_KEY="CHANGE_THIS_LONG_RANDOM_KEY";

function doGet(){return ContentService.createTextOutput("English Writing Assessment API OK");}
function doPost(e){try{const p=JSON.parse(e.postData.contents||"{}");let r;switch(p.action){case"startSession":r=startSession(p);break;case"logEvent":r=logEvent(p);break;case"submitAssessment":r=submitAssessment(p);break;case"teacherAssessments":r=teacherAssessments(p);break;case"getAssessmentSettings":r=getAssessmentSettings(p);break;case"saveAssessmentSettings":r=saveAssessmentSettings(p);break;case"teacherProgress":r=teacherProgress(p);break;default:throw Error("Unknown action")}return out(r)}catch(e){return out({success:false,message:e.message})}}
function out(x){return ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON)}
function sh(n){return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(n)}
function rows(n){return sh(n).getDataRange().getValues()}
function assessment(id){let a=rows("ASSESSMENTS");for(let i=1;i<a.length;i++)if(String(a[i][0])===String(id))return{row:i+1,id:a[i][0],title:a[i][1],durationMinutes:Number(a[i][2]),templateId:a[i][3],folderId:a[i][4],teacherEmail:a[i][5]};return null}
function student(id,code){let a=rows("STUDENTS");for(let i=1;i<a.length;i++)if(String(a[i][0])===String(id)&&String(a[i][3])===String(code))return{studentId:a[i][0],name:a[i][1],className:a[i][2]};return null}
function questions(aid){let a=rows("QUESTIONS");return a.slice(1).filter(r=>r[0]&&String(r[1])===String(aid)).map(r=>({id:r[2],question:r[3],points:r[4]}))}
function startSession(p){
 let s=student(p.studentId,p.accessCode);if(!s)return{success:false,message:"Invalid Student ID or Access Code."};
 let a=assessment(p.assessmentId||activeAssessment());if(!a)throw Error("Assessment not found.");
 let rs=rows("SESSIONS");for(let i=1;i<rs.length;i++)if(String(rs[i][2])===String(s.studentId)&&String(rs[i][1])===String(a.id)&&String(rs[i][8])==="SUBMITTED")return{success:false,message:"Already submitted."};
 let token=Utilities.getUuid(),start=new Date();sh("SESSIONS").appendRow([token,a.id,s.studentId,s.name,s.className,start,"","","STARTED",0,"",""]);
 return{success:true,token,studentId:s.studentId,name:s.name,className:s.className,assessmentTitle:a.title,durationSeconds:a.durationMinutes*60,questions:questions(a.id)}
}
function activeAssessment(){let a=rows("ASSESSMENTS");return a.length>1?a[1][0]:null}
function sessionByToken(token){let a=rows("SESSIONS");for(let i=1;i<a.length;i++)if(String(a[i][0])===String(token))return{row:i+1,token:a[i][0],assessmentId:a[i][1],studentId:a[i][2],name:a[i][3],className:a[i][4],start:a[i][5],submit:a[i][6],status:a[i][8],violations:a[i][9],docId:a[i][10],docUrl:a[i][11]};return null}
function logEvent(p){let s=sessionByToken(p.token);if(!s)return{success:false,message:"Invalid session"};sh("ACTIVITY_LOG").appendRow([new Date(),p.token,s.assessmentId,s.studentId,p.eventType||"",p.details||""]);return{success:true}}
function submitAssessment(p){
 let lock=LockService.getScriptLock();lock.waitLock(20000);try{
 let s=sessionByToken(p.token);if(!s)throw Error("Invalid session.");if(s.status!=="STARTED")throw Error("Session already submitted.");
 let a=assessment(s.assessmentId);if(!a)throw Error("Assessment not found.");
 let now=new Date();sh("SESSIONS").getRange(s.row,7).setValue(now);sh("SESSIONS").getRange(s.row,9).setValue("PROCESSING");sh("SESSIONS").getRange(s.row,10).setValue(Number(p.violationCount||0));
 let d=createDoc(a,s,p.answers||{});sh("SESSIONS").getRange(s.row,9).setValue("SUBMITTED");sh("SESSIONS").getRange(s.row,11).setValue(d.id);sh("SESSIONS").getRange(s.row,12).setValue(d.url);
 return{success:true,docUrl:d.url};
 }finally{lock.releaseLock()}
}
function createDoc(a,s,answers){
 let f=DriveApp.getFileById(a.templateId),folder=DriveApp.getFolderById(a.folderId),copy=f.makeCopy(`${a.title} - ${s.name} - ${s.studentId}`,folder),doc=DocumentApp.openById(copy.getId()),body=doc.getBody();
 const rep=(p,v)=>body.replaceText(p.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),String(v??""));
 rep("{{ASSESSMENT_TITLE}}",a.title);rep("{{STUDENT_ID}}",s.studentId);rep("{{STUDENT_NAME}}",s.name);rep("{{CLASS}}",s.className);rep("{{START_TIME}}",s.start);rep("{{SUBMIT_TIME}}",new Date());rep("{{VIOLATIONS}}",s.violations);
 questions(a.id).forEach(q=>{rep(`{{Q_${q.id}_TEXT}}`,q.question);rep(`{{Q_${q.id}_ANSWER}}`,answers[q.id]||"")});
 doc.saveAndClose();copy.addViewer(a.teacherEmail);copy.setShareableByEditors(false);return{id:copy.getId(),url:copy.getUrl()}
}
function checkTeacher(k){if(k!==TEACHER_PANEL_KEY)throw Error("Unauthorized teacher panel.")}
function teacherAssessments(p){checkTeacher(p.teacherKey);return{success:true,assessments:rows("ASSESSMENTS").slice(1).filter(r=>r[0]).map(r=>({id:r[0],title:r[1]}))}}
function getAssessmentSettings(p){checkTeacher(p.teacherKey);let a=assessment(p.assessmentId);if(!a)throw Error("Assessment not found");return{success:true,...a}}
function saveAssessmentSettings(p){checkTeacher(p.teacherKey);let a=assessment(p.assessmentId);if(!a)throw Error("Assessment not found");sh("ASSESSMENTS").getRange(a.row,2,1,5).setValues([[p.title,Number(p.durationMinutes),p.templateId,p.folderId,p.teacherEmail]]);return{success:true}}
function teacherProgress(p){checkTeacher(p.teacherKey);let a=assessment(p.assessmentId);if(!a)throw Error("Assessment not found");let ss=rows("SESSIONS"),students=rows("STUDENTS").slice(1).filter(r=>r[0]);let out=[];students.forEach(st=>{let matches=ss.slice(1).filter(r=>String(r[1])===String(a.id)&&String(r[2])===String(st[0]));let r=matches.length?matches[matches.length-1]:null;out.push({name:st[1],className:st[2],status:r?r[8]:"NOT STARTED",started:r&&r[5]?r[5]:"",submitted:r&&r[6]?r[6]:"",violations:r?r[9]||0:0,docUrl:r?r[11]:""})});return{success:true,students:out}}
