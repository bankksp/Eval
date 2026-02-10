
/**
 * Google Apps Script for Satisfaction Survey v5.0 (Payload Size Fix)
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
      headers.forEach(function(h,i){ headMap[String(h).trim()]=i; });
      
      var getVal = function(row, name) {
         var idx = headMap[name];
         if (idx === undefined) return null;
         return row[idx];
      }

      for (var i = 1; i < data.length; i++) {
         var row = data[i];
         var id = getVal(row, 'id');
         if(!id) continue;

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

         var cleanId = id.toString().replace(/[^a-zA-Z0-9-_]/g, '');
         var resSheetName = 'Res_' + cleanId;
         var resSheet = ss.getSheetByName(resSheetName);
         if (resSheet) {
            var rData = resSheet.getDataRange().getValues();
            if (rData.length > 1) {
               var rHeaders = rData[0];
               var rMap = {};
               rHeaders.forEach(function(h,i){ rMap[String(h).trim()]=i; });
               
               for (var k = 1; k < rData.length; k++) {
                  var rRow = rData[k];
                  var answers = [];
                  var demographics = {};
                  
                  p.questions.forEach(function(q){
                     var qText = String(q.text).trim();
                     var idx = rMap[qText];
                     if (idx === undefined) idx = rMap[q.id];
                     
                     if (idx !== undefined && rRow[idx] !== "" && rRow[idx] !== undefined) {
                        answers.push({
                          questionId: q.id,
                          level: Number(rRow[idx])
                        });
                     }
                  });

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

      // Validate Image Size
      if (data.coverImage && data.coverImage.length > 50000) {
         return createJsonResponse({ status: 'error', message: 'รูปภาพมีขนาดใหญ่เกินไป (Max 50k chars) กรุณาใช้รูปที่เล็กลง' });
      }

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
      
      for (var i = 1; i < values.length; i++) {
        if (values[i][idColIndex] == data.id) {
          rowToUpdate = i + 1;
          break;
        }
      }

      if (rowToUpdate > 0) {
        if (data.title && colMap['title']) sheet.getRange(rowToUpdate, colMap['title']).setValue(data.title);
        if (data.description && colMap['description']) sheet.getRange(rowToUpdate, colMap['description']).setValue(data.description);
        
        if (data.coverImage) {
           if (data.coverImage.length > 50000) {
              return createJsonResponse({ status: 'error', message: 'รูปภาพมีขนาดใหญ่เกินไป (Max 50k chars) กรุณาใช้รูปที่เล็กลง' });
           }
           if (colMap['coverImage']) sheet.getRange(rowToUpdate, colMap['coverImage']).setValue(data.coverImage);
        }
        
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
        return createJsonResponse({ status: 'success', message: 'Project ID not found (Sync ignored).' });
      }

    } else if (action === 'delete_project') {
      var sheet = getOrCreateSheet(ss, SHEET_NAME_PROJECTS);
      var dataRange = sheet.getDataRange();
      var values = dataRange.getValues();
      var colMap = {};
      if(values.length > 0) {
        values[0].forEach(function(h, i) { colMap[h] = i + 1; });
      }
      
      var idColIndex = colMap['id'] - 1;
      var rowToDelete = -1;
      
      for (var i = 1; i < values.length; i++) {
        if (values[i][idColIndex] == data.id) {
          rowToDelete = i + 1;
          break;
        }
      }
      
      if (rowToDelete > 0) {
        sheet.deleteRow(rowToDelete);
        return createJsonResponse({ status: 'success', message: 'Project deleted.' });
      } else {
         return createJsonResponse({ status: 'error', message: 'Project ID not found.' });
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
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.JSON);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
