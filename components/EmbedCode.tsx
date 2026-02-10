
import React, { useState, useMemo } from 'react';
import { CheckIcon, ClipboardIcon, XCircleIcon, AlertTriangleIcon } from './icons';

const appsScriptCode = `/**
 * Google Apps Script for Satisfaction Survey v4.5 (Final CORS Fix)
 * 
 * Update Instructions:
 * 1. Copy entire code below.
 * 2. Paste into script.google.com
 * 3. Save Project.
 * 4. Click 'Deploy' > 'New deployment' (สำคัญมาก! ต้อง New deployment เท่านั้น)
 * 5. Select type: 'Web app', Execute as: 'Me', Who has access: 'Anyone'.
 * 6. Click 'Deploy' and use the URL.
 */

// ===============================================================
//                          การตั้งค่า
// ===============================================================

// 1. ใส่ ID ของ Google Sheet ที่คุณต้องการใช้เก็บข้อมูล
var SPREADSHEET_ID = '1cRqu_vSwX9LI70y_jhgI_Ej8nqU1hWBRezEIYtAAtZw'; 

// 2. ชื่อชีตสำหรับเก็บข้อมูล Project หลัก (ไม่ต้องแก้)
var SHEET_NAME_PROJECTS = 'Projects';         

// ===============================================================
//                      ฟังก์ชันหลัก
// ===============================================================

function doGet(e) {
  // ไม่ใช้ LockService ใน doGet เพื่อป้องกัน Error "Server busy" และเพิ่มความเร็วในการอ่านข้อมูล
  try {
    if (!SPREADSHEET_ID || SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE') {
       return createJsonResponse({ status: 'error', message: 'Spreadsheet ID not set.' });
    }

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var projectSheet = getOrCreateSheet(ss, SHEET_NAME_PROJECTS);
    var data = projectSheet.getDataRange().getValues();
    
    var projects = [];
    if (data.length > 1) {
      var headers = data[0];
      var headMap = {};
      headers.forEach(function(h,i){ headMap[String(h).trim()]=i; }); // Trim headers
      
      // Helper to safely get value
      var getVal = function(row, name) {
         var idx = headMap[name];
         if (idx === undefined) return null;
         return row[idx];
      }

      for (var i = 1; i < data.length; i++) {
         var row = data[i];
         var id = getVal(row, 'id');
         if(!id) continue;

         // Parse JSONs
         var qJson = getVal(row, 'questions') || '[]';
         var dqJson = getVal(row, 'demographicQuestions') || '[]';
         var questions = [];
         var demogs = [];
         try { questions = JSON.parse(qJson); } catch(e){}
         try { demogs = JSON.parse(dqJson); } catch(e){}

         var p = {
           id: id,
           title: getVal(row, 'title'),
           description: getVal(row, 'description'),
           coverImage: getVal(row, 'coverImage'), 
           createdAt: new Date(getVal(row, 'createdAt')).getTime(),
           isOpen: getVal(row, 'status') === 'Open',
           questions: questions,
           demographicQuestions: demogs,
           responses: []
         };

         // Fetch Responses
         var cleanId = id.toString().replace(/[^a-zA-Z0-9-_]/g, '');
         var resSheetName = 'Res_' + cleanId;
         var resSheet = ss.getSheetByName(resSheetName);
         if (resSheet) {
            var rData = resSheet.getDataRange().getValues();
            if (rData.length > 1) {
               var rHeaders = rData[0];
               var rMap = {};
               // Trim keys to avoid mismatch
               rHeaders.forEach(function(h,i){ rMap[String(h).trim()]=i; });
               
               for (var k = 1; k < rData.length; k++) {
                  var rRow = rData[k];
                  var answers = [];
                  var demographics = {};
                  
                  // Map Questions
                  p.questions.forEach(function(q){
                     // Try match by text first (as saved), then ID (if we change saving logic later)
                     var qText = String(q.text).trim();
                     var idx = rMap[qText];
                     if (idx === undefined) idx = rMap[q.id];
                     
                     if (idx !== undefined && rRow[idx] !== "" && rRow[idx] !== undefined) {
                        answers.push({
                          questionId: q.id,
                          level: Number(rRow[idx]) // Ensure number
                        });
                     }
                  });

                  // Map Demographics
                  p.demographicQuestions.forEach(function(d){
                     var dLabel = String(d.label).trim();
                     var idx = rMap[dLabel];
                     if (idx === undefined) idx = rMap[d.id];
                     
                     if (idx !== undefined) {
                        demographics[d.id] = String(rRow[idx]);
                     }
                  });
                  
                  var tsIdx = rMap['timestamp'];
                  var cIdx = rMap['comment'];
                  
                  p.responses.push({
                    id: 'res_' + k,
                    timestamp: tsIdx !== undefined ? new Date(rRow[tsIdx]).getTime() : 0,
                    comment: cIdx !== undefined ? String(rRow[cIdx]) : '',
                    answers: answers,
                    demographics: demographics
                  });
               }
            }
         }
         projects.push(p);
      }
    }
    
    return createJsonResponse({ status: 'success', data: projects });
  } catch (e) {
    return createJsonResponse({ status: 'error', message: e.toString() });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
     return createJsonResponse({ status: 'error', message: 'Server is busy. Please try again.' });
  }

  try {
    if (!SPREADSHEET_ID || SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE') {
      throw new Error('กรุณาตั้งค่า SPREADSHEET_ID ในไฟล์ Apps Script ให้ถูกต้อง');
    }
    
    // Parse Data safely
    var data;
    try {
        if (!e || !e.postData || !e.postData.contents) {
             throw new Error('No POST data');
        }
        data = JSON.parse(e.postData.contents);
    } catch (err) {
        throw new Error('รูปแบบข้อมูลไม่ถูกต้อง (Invalid JSON): ' + err.toString());
    }

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var action = data.action || 'submit_response';

    if (action === 'create_project') {
      var sheet = getOrCreateSheet(ss, SHEET_NAME_PROJECTS);
      var headers = ['id', 'title', 'description', 'coverImage', 'createdAt', 'status', 'questions', 'demographicQuestions'];
      ensureHeaders(sheet, headers);

      var newRow = [
        data.id || '',
        data.title || '',
        data.description || '',
        data.coverImage || '',
        new Date().toISOString(),
        'Open',
        data.questions || '[]',
        data.demographicQuestions || '[]'
      ];
      
      sheet.appendRow(newRow);
      return createJsonResponse({ status: 'success', message: 'Project created successfully.' });

    } else if (action === 'update_project') {
      var sheet = getOrCreateSheet(ss, SHEET_NAME_PROJECTS);
      var headers = ['id', 'title', 'description', 'coverImage', 'createdAt', 'status', 'questions', 'demographicQuestions'];
      ensureHeaders(sheet, headers);

      var dataRange = sheet.getDataRange();
      var values = dataRange.getValues();
      var colMap = {};
      if(values.length > 0) {
        values[0].forEach(function(h, i) { colMap[h] = i + 1; });
      }

      var idColIndex = colMap['id'] - 1;
      var rowToUpdate = -1;
      
      // Find row
      for (var i = 1; i < values.length; i++) {
        if (values[i][idColIndex] == data.id) {
          rowToUpdate = i + 1;
          break;
        }
      }

      if (rowToUpdate > 0) {
        if (data.title && colMap['title']) sheet.getRange(rowToUpdate, colMap['title']).setValue(data.title);
        if (data.description && colMap['description']) sheet.getRange(rowToUpdate, colMap['description']).setValue(data.description);
        if (data.coverImage && colMap['coverImage']) sheet.getRange(rowToUpdate, colMap['coverImage']).setValue(data.coverImage);
        
        if (data.hasOwnProperty('isOpen') && colMap['status']) {
           sheet.getRange(rowToUpdate, colMap['status']).setValue(data.isOpen ? 'Open' : 'Closed');
        }

        if (data.questions && colMap['questions']) {
           sheet.getRange(rowToUpdate, colMap['questions']).setValue(data.questions);
        }
        if (data.demographicQuestions && colMap['demographicQuestions']) {
           sheet.getRange(rowToUpdate, colMap['demographicQuestions']).setValue(data.demographicQuestions);
        }

        return createJsonResponse({ status: 'success', message: 'Project updated.' });
      } else {
        // Just return success even if not found to prevent frontend error for non-critical sync
        return createJsonResponse({ status: 'success', message: 'Project ID not found (Sync ignored).' });
      }

    } else {
      // Submit Response
      var projectId = data.projectId;
      var sheetName = 'Responses_General';
      if (projectId) {
         var cleanId = projectId.toString().replace(/[^a-zA-Z0-9-_]/g, '');
         sheetName = 'Res_' + cleanId; 
      }
      
      var sheet = getOrCreateSheet(ss, sheetName);
      
      delete data.action;
      delete data.projectId; 

      // Headers management
      var lastColumn = sheet.getLastColumn();
      var headers = (lastColumn > 0) ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0] : [];
      if (headers.length === 1 && headers[0] === '') { headers = []; }

      var preferredOrder = ['timestamp', 'projectTitle'];
      var lastOrder = ['comment'];
      
      var incomingKeys = Object.keys(data);
      var newHeaders = incomingKeys.filter(function(key) { return headers.indexOf(key) === -1; });

      if (newHeaders.length > 0) {
        if (headers.length === 0) {
             var coreHeaders = newHeaders.filter(k => !preferredOrder.includes(k) && !lastOrder.includes(k));
             var sortedNew = [];
             preferredOrder.forEach(k => { if(newHeaders.includes(k)) sortedNew.push(k) });
             coreHeaders.forEach(k => sortedNew.push(k));
             lastOrder.forEach(k => { if(newHeaders.includes(k)) sortedNew.push(k) });
             newHeaders.forEach(k => { if(!sortedNew.includes(k)) sortedNew.push(k) });
             newHeaders = sortedNew;
        }

        var startColumn = headers.length + 1;
        sheet.getRange(1, startColumn, 1, newHeaders.length).setValues([newHeaders]);
        headers = headers.concat(newHeaders);
      }

      var newRow = headers.map(function(header) {
        return data.hasOwnProperty(header) ? data[header] : '';
      });

      sheet.appendRow(newRow);
      return createJsonResponse({ status: 'success', message: 'Response saved.' });
    }

  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return createJsonResponse({ status: 'error', message: error.toString() });

  } finally {
    lock.releaseLock();
  }
}

function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

function ensureHeaders(sheet, requiredHeaders) {
  var lastColumn = sheet.getLastColumn();
  if (lastColumn === 0) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    return;
  }
  
  var existingHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  if (existingHeaders.length === 0 || (existingHeaders.length === 1 && existingHeaders[0] === '')) {
     sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
  } else {
     var missingHeaders = requiredHeaders.filter(function(h) { return existingHeaders.indexOf(h) === -1; });
     if (missingHeaders.length > 0) {
        sheet.getRange(1, lastColumn + 1, 1, missingHeaders.length).setValues([missingHeaders]);
     }
  }
}

function doOptions(e) {
  // Try to return empty text with JSON mime to satisfy CORS in some cases
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.JSON);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

const CodeBlock: React.FC<{ code: string; onCopy: () => void; copied: boolean }> = ({ code, onCopy, copied }) => (
    <div className="bg-slate-800 rounded-2xl p-6 relative">
        <button 
            onClick={onCopy}
            className="absolute top-4 right-4 bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors z-10"
        >
            {copied ? <CheckIcon className="w-4 h-4 text-emerald-400" /> : <ClipboardIcon className="w-4 h-4" />}
            {copied ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด'}
        </button>
        <pre><code className="text-slate-300 text-sm font-mono whitespace-pre-wrap break-words">{code}</code></pre>
    </div>
);

interface EmbedCodeProps {
    onClose: () => void;
}

const EmbedCode: React.FC<EmbedCodeProps> = ({ onClose }) => {
    const [appsScriptCopied, setAppsScriptCopied] = useState(false);
    const [embedScriptCopied, setEmbedScriptCopied] = useState(false);

    const embedClientScript = useMemo(() => {
        const surveyAppUrl = window.location.origin + window.location.pathname;
        return `
(function() {
  // --- การตั้งค่า (CONFIGURATION) ---
  const SURVEY_APP_URL = '${surveyAppUrl}';
  const CONTAINER_ID = 'cirtp-survey-container';
  // --- สิ้นสุดการตั้งค่า ---

  document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById(CONTAINER_ID);

    if (!container) {
      console.error(\`[Survey Connector] ไม่พบ Element ที่มี id '\${CONTAINER_ID}'\`);
      return;
    }

    container.innerHTML = '';
    const iframe = document.createElement('iframe');
    
    iframe.src = SURVEY_APP_URL;
    iframe.title = 'Satisfaction Survey Application';
    iframe.setAttribute('frameborder', '0');
    
    iframe.style.width = '100%';
    iframe.style.height = '100vh';
    iframe.style.minHeight = '800px';
    iframe.style.border = 'none';
    iframe.style.display = 'block';

    container.appendChild(iframe);
  });
})();
        `.trim();
    }, []);

    const handleCopy = (script: string, setCopied: React.Dispatch<React.SetStateAction<boolean>>) => {
        navigator.clipboard.writeText(script).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div 
                className="bg-gray-50 w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-6 flex justify-between items-center border-b bg-white flex-shrink-0">
                    <h3 className="text-xl font-black text-slate-800">วิธีเชื่อมต่อ &amp; ฝังแบบสำรวจ</h3>
                    <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                        <XCircleIcon className="w-7 h-7"/>
                    </button>
                </header>
                <div className="flex-grow overflow-y-auto p-8">
                    <div className="space-y-12">
                        <div>
                            <p className="text-slate-500 mt-2 max-w-3xl">
                                ทำตาม 2 ขั้นตอนต่อไปนี้เพื่อเชื่อมต่อแบบสำรวจของคุณกับ Google Sheets สำหรับการเก็บข้อมูล
                                และนำแบบสำรวจไปแสดงผลบนเว็บไซต์อื่นของคุณ
                            </p>
                        </div>

                        {/* Step 1: Backend */}
                        <div className="space-y-6 p-8 bg-white rounded-3xl border border-slate-200/80">
                            <div className="flex items-start md:items-center gap-4 flex-col md:flex-row">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xl">1</div>
                                <div>
                                    <h4 className="text-xl font-black text-slate-800">ตั้งค่า Backend (Google Apps Script)</h4>
                                    <p className="text-slate-500 mt-1">สคริปต์นี้จะทำหน้าที่รับข้อมูลจากแบบสำรวจแล้วบันทึกลงใน Google Sheet ของคุณโดยอัตโนมัติ</p>
                                </div>
                            </div>
                            
                            <h5 className="font-bold text-slate-700 pt-4">ขั้นตอนการติดตั้ง:</h5>
                            <ol className="list-decimal list-inside space-y-3 text-slate-600 font-medium">
                                <li>ไปที่ <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold underline">script.google.com</a> และสร้างโปรเจกต์ใหม่</li>
                                <li>คัดลอก "โค้ด Backend" ด้านล่างไปวางในไฟล์ `Code.gs` ทั้งหมด (อัปเดต Sheet ID เรียบร้อยแล้ว)</li>
                                <li className="font-black text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-200">**สำคัญมาก:** หลังจากวางโค้ดแล้ว อย่าลืมกด Deploy (ทำให้ใช้งานได้) แบบ "รายการใหม่" (New Deployment) ทุกครั้งที่มีการแก้โค้ด</li>
                                <li>ตั้งค่า "ผู้ที่มีสิทธิ์เข้าถึง" เป็น **"ทุกคน" (Anyone)**</li>
                            </ol>
                            <CodeBlock code={appsScriptCode} onCopy={() => handleCopy(appsScriptCode, setAppsScriptCopied)} copied={appsScriptCopied} />

                            {/* Troubleshooting Section */}
                            <div className="mt-8 p-6 bg-amber-50 rounded-3xl border-2 border-amber-200">
                                <div className="flex items-start gap-3">
                                    <AlertTriangleIcon className="w-8 h-8 text-amber-500 flex-shrink-0 mt-1" />
                                    <div>
                                      <h5 className="text-lg font-black text-amber-800">แก้ปัญหา "Failed to fetch"</h5>
                                      <p className="text-amber-700 font-medium mt-2">
                                          หากคุณพบข้อผิดพลาดนี้ สาเหตุหลัก (99% ของเคส) มาจากการตั้งค่า Deployment ไม่ถูกต้อง
                                          <strong className="block mt-2">โปรดตรวจสอบตามขั้นตอนต่อไปนี้อย่างละเอียด:</strong>
                                      </p>
                                      <ul className="list-disc list-inside space-y-2 mt-3 text-amber-700 font-bold">
                                          <li>
                                              คุณได้กด "ทำให้ใช้งานได้" &gt;
                                              <strong className="text-amber-900"> "การทำให้ใช้งานได้รายการใหม่" (New deployment) </strong>
                                              <span className="font-medium">หรือไม่? (การกดแค่ "บันทึก" จะไม่ทำให้เว็บแอปอัปเดต)</span>
                                          </li>
                                          <li>
                                              ในหน้าต่างตั้งค่า Deployment, คุณได้ตั้งค่า "ผู้ที่มีสิทธิ์เข้าถึง" เป็น
                                              <strong className="text-amber-900"> "ทุกคน" (Anyone) </strong>
                                              <span className="font-medium">หรือไม่?</span>
                                          </li>
                                      </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Frontend */}
                        <div className="space-y-6 p-8 bg-white rounded-3xl border border-slate-200/80">
                            <div className="flex items-start md:items-center gap-4 flex-col md:flex-row">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xl">2</div>
                                <div>
                                    <h4 className="text-xl font-black text-slate-800">ฝังแบบสำรวจลงในเว็บไซต์ของคุณ</h4>
                                    <p className="text-slate-500 mt-1">หลังจากตั้งค่า Backend เรียบร้อยแล้ว ใช้สคริปต์ด้านล่างนี้เพื่อแสดงผลแบบสำรวจบนหน้าเว็บของคุณ</p>
                                </div>
                            </div>

                            <h5 className="font-bold text-slate-700 pt-4">ขั้นตอนการใช้งาน:</h5>
                            <ol className="list-decimal list-inside space-y-3 text-slate-600 font-medium">
                                <li>ในไฟล์ HTML ของเว็บไซต์คุณ, สร้าง `&lt;div&gt;` ในตำแหน่งที่ต้องการให้แบบสำรวจแสดงผล</li>
                                <li>ตั้ง `id` ของ `&lt;div&gt;` นั้นให้เป็น `"cirtp-survey-container"` <br/>
                                    <code className="text-sm bg-slate-200 text-slate-800 px-2 py-1 rounded">&lt;div id="cirtp-survey-container"&gt;&lt;/div&gt;</code>
                                </li>
                                <li>นำโค้ด JavaScript ที่คัดลอกไป ไปวางในแท็ก `&lt;script&gt;` ก่อนปิดแท็ก `&lt;/body&gt;` ของไฟล์ HTML</li>
                            </ol>

                            <CodeBlock code={embedClientScript} onCopy={() => handleCopy(embedClientScript, setEmbedScriptCopied)} copied={embedScriptCopied} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmbedCode;
