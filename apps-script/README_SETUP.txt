SETUP — ENGLISH WRITING ASSESSMENT V2

1) Create Google Spreadsheet with these sheets and exact headers:

ASSESSMENTS:
Assessment ID | Title | Duration Minutes | Template ID | Output Folder ID | Teacher Email

STUDENTS:
Student ID | Name | Class | Access Code

QUESTIONS:
Assessment ID | Question Group | Question ID | Question | Points

SESSIONS:
Token | Assessment ID | Student ID | Name | Class | Start Time | Submit Time | Reserved | Status | Violations | Doc ID | Doc URL

ACTIVITY_LOG:
Timestamp | Token | Assessment ID | Student ID | Event Type | Details

2) Add one assessment row, e.g.
ENG01 | English Writing Narrative | 60 | TEMPLATE_ID | FOLDER_ID | teacher@school.com

3) Add questions:
ENG01 | Writing | Q01 | Write a 250–300 word narrative about... | 20

4) Google Docs template placeholders:
{{ASSESSMENT_TITLE}}
{{STUDENT_ID}}
{{STUDENT_NAME}}
{{CLASS}}
{{START_TIME}}
{{SUBMIT_TIME}}
{{VIOLATIONS}}
{{Q_Q01_TEXT}}
{{Q_Q01_ANSWER}}

For Q02 use {{Q_Q02_TEXT}} and {{Q_Q02_ANSWER}}, etc.

5) Apps Script:
Open Extensions > Apps Script from the spreadsheet.
Paste Code.gs.
Change SPREADSHEET_ID and TEACHER_PANEL_KEY.
Deploy > New deployment > Web app.
Execute as: Me.
Who has access: Anyone.
Copy the /exec URL.

6) GitHub:
Put the project files in a repository.
Edit js/config.js and paste the Apps Script /exec URL.
Enable GitHub Pages from Settings > Pages > Deploy from branch.

7) Student:
https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO/

8) Teacher:
https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO/?panel=teacher
The teacher panel asks for TEACHER_PANEL_KEY.

SECURITY NOTE:
A normal browser page cannot guarantee that students cannot open other tabs/windows or close the browser. The app detects visibility/focus/fullscreen changes and logs them, blocks normal clipboard operations, and warns on exit. For high-stakes testing use managed devices or a dedicated secure exam browser.

IMPORTANT PRODUCTION NOTE:
This v2 uses a UUID session token and a server-side lock for simultaneous submissions. For production, restrict Apps Script access to the intended school users if your deployment/account environment allows it, and keep the teacher panel key secret.
