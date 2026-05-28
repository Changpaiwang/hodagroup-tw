// ═══════════════════════════════════════════════════════════
//  禾大屋管 業務工具系統 - Google Apps Script 後端  v2.0
//  新增：Email通知、查詢API、補正更新
// ═══════════════════════════════════════════════════════════

const NOTIFY_EMAIL    = "changpaiwang@gmail.com";
const SPREADSHEET_ID  = "1HsnhjNh6cDtM7mBrHIiy0SAu7Il08WqtnL1pgkXYS8E";
const SHEET_CHECKLIST = "勘查清單";
const SHEET_SCORING   = "物件評分";
const SHEET_LOG       = "操作記錄";

// ─── POST 主入口 ───
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss   = SpreadsheetApp.openById(SPREADSHEET_ID);
    let isUpdate = false;

    if      (data.type === "checklist")        { saveChecklist(ss, data);   sendChecklistEmail(data, false); }
    else if (data.type === "scoring")          { saveScoring(ss, data);     sendScoringEmail(data, false);   }
    else if (data.type === "update_checklist") { updateChecklist(ss, data); sendChecklistEmail(data, true);  isUpdate = true; }
    else if (data.type === "update_scoring")   { updateScoring(ss, data);   sendScoringEmail(data, true);    isUpdate = true; }

    if (!isUpdate) saveLog(ss, data.type, data.appraiser || "未知", data.submittedAt);

    return ContentService.createTextOutput(JSON.stringify({ status: "ok" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── GET：健康檢查 + 列表查詢 ───
function doGet(e) {
  const params = e.parameter || {};
  if (params.action === "list") return listRows(params.sheet || "checklist");
  return ContentService.createTextOutput(JSON.stringify({ status: "ok", version: "2.0" })).setMimeType(ContentService.MimeType.JSON);
}

function listRows(sheetType) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const name  = sheetType === "checklist" ? SHEET_CHECKLIST : SHEET_SCORING;
  const sheet = ss.getSheetByName(name);
  if (!sheet || sheet.getLastRow() < 2) return ContentService.createTextOutput(JSON.stringify({ rows: [] })).setMimeType(ContentService.MimeType.JSON);

  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows    = data.slice(1).map((row, i) => {
    const obj = { _rowIndex: i + 2 };
    headers.forEach((h, j) => { obj[h] = row[j] instanceof Date ? row[j].toISOString() : row[j]; });
    return obj;
  }).reverse();

  return ContentService.createTextOutput(JSON.stringify({ rows })).setMimeType(ContentService.MimeType.JSON);
}

// ─── 儲存勘查清單 ───
function saveChecklist(ss, data) {
  let sheet = ss.getSheetByName(SHEET_CHECKLIST);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_CHECKLIST);
    sheet.appendRow([
      "送出時間","業務姓名","屋主姓名","聯絡電話","LINE ID","物件地址","勘查日期",
      "管理方式","期待月租 (NT$)","小額修繕授權 (NT$)","合約年限",
      "建物型態","坪數","格局","樓層",
      "電表狀況","水表狀況","管理費","近一年修繕支出",
      "有無租客","每月租金","押金",
      "漏水壁癌","最近維修","鑰匙數量","門禁卡數量",
      "整體完成度 (%)","各區備注",
      "一、屋主身份","二、房屋基本","三、出租狀況","四、收支費用","五、屋況設備","六、代管條件","七、現場交接"
    ]);
    sheet.getRange(1,1,1,sheet.getLastColumn()).setFontWeight("bold").setBackground("#1B3A5C").setFontColor("white");
    sheet.setFrozenRows(1);
  }
  const row = buildChecklistRow(data);
  sheet.appendRow(row);
  colorChecklistRow(sheet, sheet.getLastRow(), parseInt(row[26]) || 0);
}

function updateChecklist(ss, data) {
  const sheet = ss.getSheetByName(SHEET_CHECKLIST);
  if (!sheet || !data._rowIndex) return;
  const row = buildChecklistRow(data);
  row.forEach((val, i) => sheet.getRange(data._rowIndex, i + 1).setValue(val));
  colorChecklistRow(sheet, data._rowIndex, parseInt(row[26]) || 0);
}

function buildChecklistRow(data) {
  const l = data.landlord || {}, f = data.fields || {}, sec = data.sections || [];
  let checked = 0, total = 0;
  sec.forEach(s => { checked += s.items.filter(i => i.checked).length; total += s.items.length; });
  const pct    = total > 0 ? Math.round(checked / total * 100) : 0;
  const notes  = sec.filter(s => s.notes).map(s => `[${s.title}] ${s.notes}`).join("\n");
  const detail = sec.map(s => {
    const unc = s.items.filter(i => !i.checked).map(i => i.item);
    return unc.length > 0 ? "未確認：" + unc.join("、") : "✓ 全部完成";
  });
  return [
    new Date(data.submittedAt || new Date()), data.appraiser || "",
    l.name||"", l.phone||"", l.line||"", l.address||"", l.date||"",
    f.mgmtType||"", f.expectedRent||"", f.repairLimit||"", f.contractYears||"",
    f.buildingType||"", f.area||"", f.layout||"", f.floor||"",
    f.electricMeter||"", f.waterMeter||"", f.mgmtFee||"", f.repairCost||"",
    f.hasTenants||"", f.monthlyRent||"", f.deposit||"",
    f.leakStatus||"", f.lastRepair||"", f.keyCount||"", f.cardCount||"",
    pct + "%", notes,
    detail[0]||"", detail[1]||"", detail[2]||"", detail[3]||"", detail[4]||"", detail[5]||"", detail[6]||""
  ];
}

function colorChecklistRow(sheet, rowNum, pct) {
  const bg = pct === 100 ? "#e8f5e9" : pct >= 70 ? "#fff8e1" : "#ffebee";
  sheet.getRange(rowNum, 27).setBackground(bg);
}

// ─── 儲存 / 更新評分結果 ───
function saveScoring(ss, data) {
  let sheet = ss.getSheetByName(SHEET_SCORING);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_SCORING);
    sheet.appendRow([
      "送出時間","業務姓名","屋主聯絡","物件地址","評估日期",
      "總分","最高分","承接建議",
      "地段交通 (/20)","屋況設備 (/20)","租金市場 (/20)","屋主配合 (/20)","現有風險 (/10)","財務預估 (/10)",
      "紅色警示數量","業務備注"
    ]);
    sheet.getRange(1,1,1,sheet.getLastColumn()).setFontWeight("bold").setBackground("#1B3A5C").setFontColor("white");
    sheet.setFrozenRows(1);
  }
  const row = buildScoringRow(data);
  sheet.appendRow(row);
  colorScoringRow(sheet, sheet.getLastRow(), data.score || 0);
}

function updateScoring(ss, data) {
  const sheet = ss.getSheetByName(SHEET_SCORING);
  if (!sheet || !data._rowIndex) return;
  const row = buildScoringRow(data);
  row.forEach((val, i) => sheet.getRange(data._rowIndex, i + 1).setValue(val));
  colorScoringRow(sheet, data._rowIndex, data.score || 0);
}

function buildScoringRow(data) {
  const info = data.info || {}, sec = data.sections || [];
  return [
    new Date(data.submittedAt || new Date()), data.appraiser || "",
    info.contact||"", info.address||"", info.date||"",
    data.score||0, 100, data.recommendation||"",
    sec[0]?`${sec[0].score}/${sec[0].maxScore}`:"", sec[1]?`${sec[1].score}/${sec[1].maxScore}`:"",
    sec[2]?`${sec[2].score}/${sec[2].maxScore}`:"", sec[3]?`${sec[3].score}/${sec[3].maxScore}`:"",
    sec[4]?`${sec[4].score}/${sec[4].maxScore}`:"", sec[5]?`${sec[5].score}/${sec[5].maxScore}`:"",
    "", data.note||""
  ];
}

function colorScoringRow(sheet, rowNum, score) {
  const bg = score>=90?"#e8f5e9":score>=85?"#e3f2fd":score>=80?"#fff8e1":score>=70?"#fbe9e7":"#ffebee";
  sheet.getRange(rowNum, 6).setBackground(bg);
  sheet.getRange(rowNum, 8).setBackground(bg);
}

// ─── Email：勘查清單 ───
function sendChecklistEmail(data, isUpdate) {
  try {
    const l = data.landlord||{}, f = data.fields||{}, sec = data.sections||[];
    let checked=0, total=0;
    sec.forEach(s=>{ checked+=s.items.filter(i=>i.checked).length; total+=s.items.length; });
    const pct = total>0?Math.round(checked/total*100):0;
    const pColor = pct===100?"#2e7d32":pct>=70?"#e65100":"#c62828";
    const pBg    = pct===100?"#e8f5e9":pct>=70?"#fff8e1":"#ffebee";

    const secRows = sec.map(s=>{
      const c=s.items.filter(i=>i.checked).length;
      return `<tr><td style="padding:4px 10px;font-size:12px;color:#374151;border-bottom:1px solid #f3f4f6">${s.title}</td>
              <td style="padding:4px 10px;font-size:12px;font-weight:700;text-align:right;border-bottom:1px solid #f3f4f6;color:${c===s.items.length?'#2e7d32':'#e65100'}">${c}/${s.items.length}</td>
              ${s.notes?`<td style="padding:4px 10px;font-size:11px;color:#9ca3af;border-bottom:1px solid #f3f4f6">${s.notes}</td>`:'<td style="border-bottom:1px solid #f3f4f6"></td>'}</tr>`;
    }).join('');

    const subject = `[禾大${isUpdate?'補正':'勘查'}] ${l.address||'未填地址'} — ${data.appraiser||''} (${pct}%)`;
    const htmlBody = `<div style="font-family:-apple-system,sans-serif;max-width:580px;margin:0 auto">
  <div style="background:#1B3A5C;padding:20px 24px;border-radius:10px 10px 0 0">
    <div style="font-size:10px;color:#C9A84C;letter-spacing:3px;font-weight:700">禾大屋管 HODA</div>
    <div style="font-size:20px;font-weight:900;color:white;margin-top:5px">勘查清單${isUpdate?'（補正）':''}</div>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;padding:20px 24px;border-radius:0 0 10px 10px;background:white">
    <table style="width:100%;border-collapse:collapse;margin-bottom:18px">
      <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;width:85px">業務</td><td style="padding:5px 0;font-weight:700">${data.appraiser||''}</td></tr>
      <tr><td style="padding:5px 0;color:#6b7280;font-size:13px">勘查日期</td><td style="padding:5px 0">${l.date||''}</td></tr>
      <tr><td style="padding:5px 0;color:#6b7280;font-size:13px">物件地址</td><td style="padding:5px 0;font-weight:700">${l.address||''}</td></tr>
      <tr><td style="padding:5px 0;color:#6b7280;font-size:13px">屋主</td><td style="padding:5px 0">${l.name||''} ${l.phone?'· '+l.phone:''} ${l.line?'· LINE '+l.line:''}</td></tr>
      <tr><td style="padding:5px 0;color:#6b7280;font-size:13px">管理方式</td><td style="padding:5px 0">${f.mgmtType||'—'}</td></tr>
      <tr><td style="padding:5px 0;color:#6b7280;font-size:13px">期待月租</td><td style="padding:5px 0">${f.expectedRent?'NT$ '+f.expectedRent:'—'}</td></tr>
    </table>
    <div style="background:${pBg};border-radius:10px;padding:14px 20px;margin-bottom:18px;display:flex;align-items:center;gap:18px">
      <div style="font-size:36px;font-weight:900;color:${pColor};line-height:1">${pct}%</div>
      <div><div style="font-size:13px;font-weight:700;color:${pColor}">完成度</div><div style="font-size:12px;color:#6b7280">${checked} / ${total} 項已確認</div></div>
    </div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">${secRows}</table>
    <div style="margin-top:16px;font-size:11px;color:#9ca3af;text-align:center">禾大屋管業務工具系統 · ${new Date().toLocaleString('zh-TW')}</div>
  </div>
</div>`;
    MailApp.sendEmail({ to: NOTIFY_EMAIL, subject, htmlBody });
  } catch(err) { Logger.log("Email error: "+err); }
}

// ─── Email：評分表 ───
function sendScoringEmail(data, isUpdate) {
  try {
    const info=data.info||{}, sec=data.sections||[], score=data.score||0, rec=data.recommendation||"";
    const sColor=score>=90?"#2e7d32":score>=85?"#1565c0":score>=80?"#e65100":score>=70?"#bf360c":"#c62828";
    const sBg   =score>=90?"#e8f5e9":score>=85?"#e3f2fd":score>=80?"#fff3e0":score>=70?"#fbe9e7":"#ffebee";

    const secRows=sec.map(s=>`<tr><td style="padding:4px 10px;font-size:12px;color:#374151;border-bottom:1px solid #f3f4f6">${s.title}</td>
      <td style="padding:4px 10px;font-size:12px;font-weight:700;text-align:right;border-bottom:1px solid #f3f4f6;color:${Math.round(s.score/s.maxScore*100)>=70?'#2e7d32':'#e65100'}">${s.score}/${s.maxScore}</td></tr>`).join('');

    const subject=`[禾大${isUpdate?'補正':'評分'}] ${info.address||'未填地址'} — ${score}分 ${rec}`;
    const htmlBody=`<div style="font-family:-apple-system,sans-serif;max-width:580px;margin:0 auto">
  <div style="background:#1B3A5C;padding:20px 24px;border-radius:10px 10px 0 0">
    <div style="font-size:10px;color:#C9A84C;letter-spacing:3px;font-weight:700">禾大屋管 HODA</div>
    <div style="font-size:20px;font-weight:900;color:white;margin-top:5px">物件評分${isUpdate?'（補正）':''}</div>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;padding:20px 24px;border-radius:0 0 10px 10px;background:white">
    <table style="width:100%;border-collapse:collapse;margin-bottom:18px">
      <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;width:85px">業務</td><td style="padding:5px 0;font-weight:700">${data.appraiser||''}</td></tr>
      <tr><td style="padding:5px 0;color:#6b7280;font-size:13px">評估日期</td><td style="padding:5px 0">${info.date||''}</td></tr>
      <tr><td style="padding:5px 0;color:#6b7280;font-size:13px">物件地址</td><td style="padding:5px 0;font-weight:700">${info.address||''}</td></tr>
      <tr><td style="padding:5px 0;color:#6b7280;font-size:13px">屋主</td><td style="padding:5px 0">${info.contact||''}</td></tr>
    </table>
    <div style="background:${sBg};border-radius:10px;padding:14px 20px;margin-bottom:18px;display:flex;align-items:center;gap:18px">
      <div style="font-size:40px;font-weight:900;color:${sColor};line-height:1">${score}</div>
      <div><div style="font-size:15px;font-weight:800;color:${sColor}">${rec}</div><div style="font-size:12px;color:#6b7280">100 分制評估</div></div>
    </div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">${secRows}</table>
    ${data.note?`<div style="margin-top:14px;background:#f9f9f9;border-radius:8px;padding:12px;font-size:13px"><strong>業務備注：</strong>${data.note}</div>`:''}
    <div style="margin-top:16px;font-size:11px;color:#9ca3af;text-align:center">禾大屋管業務工具系統 · ${new Date().toLocaleString('zh-TW')}</div>
  </div>
</div>`;
    MailApp.sendEmail({ to: NOTIFY_EMAIL, subject, htmlBody });
  } catch(err) { Logger.log("Email error: "+err); }
}

// ─── 操作記錄 ───
function saveLog(ss, type, user, time) {
  let sheet = ss.getSheetByName(SHEET_LOG);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_LOG);
    sheet.appendRow(["時間","類型","業務"]);
    sheet.getRange(1,1,1,3).setFontWeight("bold");
  }
  sheet.appendRow([new Date(time||new Date()), type==="checklist"?"勘查清單":"物件評分", user]);
}
