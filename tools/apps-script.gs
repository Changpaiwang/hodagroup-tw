// ═══════════════════════════════════════════════════════════
//  禾大屋管 業務工具系統 - Google Apps Script 後端  v3.0
//  新增：物件台帳、獎金排程、系統參數管理
// ═══════════════════════════════════════════════════════════

const NOTIFY_EMAIL         = "changpaiwang@gmail.com";
const SPREADSHEET_ID       = "1HsnhjNh6cDtM7mBrHIiy0SAu7Il08WqtnL1pgkXYS8E";
const SHEET_CHECKLIST      = "勘查清單";
const SHEET_SCORING        = "物件評分";
const SHEET_PROPERTY       = "物件台帳";
const SHEET_BONUS_SCHEDULE = "獎金排程";
const SHEET_BONUS_RECORD   = "獎金記錄";
const SHEET_PARAMS         = "系統參數";
const SHEET_LOG            = "操作記錄";
const SHEET_TENANT         = "房客資料";

// ─── POST 主入口 ───
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss   = SpreadsheetApp.openById(SPREADSHEET_ID);
    let logType = null;

    if      (data.type === "checklist")        { saveChecklist(ss, data);   sendChecklistEmail(data, false); logType = "checklist"; }
    else if (data.type === "scoring")          { saveScoring(ss, data);     sendScoringEmail(data, false);   logType = "scoring"; }
    else if (data.type === "update_checklist") { updateChecklist(ss, data); sendChecklistEmail(data, true); }
    else if (data.type === "update_scoring")   { updateScoring(ss, data);   sendScoringEmail(data, true); }
    else if (data.type === "property")         { saveProperty(ss, data);    sendPropertyEmail(data);         logType = "property"; }
    else if (data.type === "update_property")  { updateProperty(ss, data); }
    else if (data.type === "tenant")           { saveTenant(ss, data);      logType = "tenant"; }
    else if (data.type === "update_tenant")    { updateTenant(ss, data); }
    else if (data.type === "delete_tenant")    { deleteTenant(ss, data); }
    else if (data.type === "pay_bonus")        { payBonus(ss, data); }
    else if (data.type === "edit_bonus")       { editBonus(ss, data); }
    else if (data.type === "delete_bonus")     { deleteBonus(ss, data); }
    else if (data.type === "update_params")    { saveParams(ss, data); }

    if (logType) saveLog(ss, logType, data.appraiser || data.registrar || "未知", data.submittedAt);

    return ContentService.createTextOutput(JSON.stringify({ status: "ok" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── GET：健康檢查 + 各類查詢 ───
function doGet(e) {
  const params = e.parameter || {};
  if (params.action === "list")            return listRows(params.sheet || "checklist");
  if (params.action === "bonus_dashboard") return listBonusDashboard();
  if (params.action === "params")          return getParams();
  if (params.action === "property_list")   return listProperties();
  if (params.action === "tenant_list")     return listTenants(params.buildingId || "");
  return ContentService.createTextOutput(JSON.stringify({ status: "ok", version: "3.1" })).setMimeType(ContentService.MimeType.JSON);
}

// ─── 列表查詢（勘查清單 / 評分） ───
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
      "一、屋主身份","二、房屋基本","三、出租狀況","四、收支費用","五、屋況設備","六、代管條件","七、現場交接",
      "引薦人","管理人員"
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
    detail[0]||"", detail[1]||"", detail[2]||"", detail[3]||"", detail[4]||"", detail[5]||"", detail[6]||"",
    l.referrer||"", l.manager||""
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

// ─── 物件台帳 ───
function saveProperty(ss, data) {
  let sheet = ss.getSheetByName(SHEET_PROPERTY);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_PROPERTY);
    sheet.appendRow([
      "登錄時間","登錄人","物件地址","屋主姓名","屋主電話",
      "管理方式","簽約日期","合約年限(年)","合約到期日",
      "月租金(NT$)","代管費(NT$)","市場月租(NT$)","禾大收租(NT$)","月價差(NT$)",
      "引薦人","管理人員","備注","物件ID"
    ]);
    sheet.getRange(1,1,1,sheet.getLastColumn()).setFontWeight("bold").setBackground("#1B3A5C").setFontColor("white");
    sheet.setFrozenRows(1);
  }

  const propId   = "P" + new Date().getTime();
  const p        = data.property || {};
  const signDate = new Date(p.signDate || new Date());
  const years    = parseInt(p.contractYears) || 1;
  const expDate  = new Date(signDate); expDate.setFullYear(expDate.getFullYear() + years);
  const spread   = (parseInt(p.marketRent)||0) - (parseInt(p.hodaRent)||0);

  sheet.appendRow([
    new Date(), data.registrar || "",
    p.address||"", p.ownerName||"", p.ownerPhone||"",
    p.mgmtType||"", signDate, years, expDate,
    p.rentAmount||"", p.mgmtFee||"", p.marketRent||"", p.hodaRent||"",
    spread > 0 ? spread : "",
    p.referrer||"", p.manager||"", p.note||"", propId
  ]);

  const params = getParamsObj(ss);
  generateBonusSchedule(ss, p, propId, signDate, params);
}

// ─── 獎金排程自動生成 ───
function generateBonusSchedule(ss, p, propId, signDate, params) {
  let sheet = ss.getSheetByName(SHEET_BONUS_SCHEDULE);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_BONUS_SCHEDULE);
    sheet.appendRow([
      "建立時間","物件地址","物件ID","受益人","受益人Email","角色","獎金類型",
      "預計發放日","金額(NT$)","狀態","發放日期","發放人","備注"
    ]);
    sheet.getRange(1,1,1,sheet.getLastColumn()).setFontWeight("bold").setBackground("#1B3A5C").setFontColor("white");
    sheet.setFrozenRows(1);
  }

  const addr      = p.address || "";
  const now       = new Date();
  const years     = parseInt(p.contractYears) || 1;
  const addMo     = (d, m) => { const n = new Date(d); n.setMonth(n.getMonth() + m); return n; };
  const entries   = [];
  const refEmail  = p.referrerEmail || "";
  const mgrEmail  = p.managerEmail  || "";

  // ── 引薦人獎金 ──
  if (p.referrer) {
    if (p.mgmtType === "代管") {
      const fee   = parseInt(p.mgmtFee) || 0;
      const total = Math.round(fee * (params.daimgmtRefRate || 0.5));
      entries.push([now, addr, propId, p.referrer, refEmail, "引薦人", "代管引薦-首期(40%)",  addMo(signDate, 0),  Math.round(total * (params.daimgmtRef1 || 0.4)), "待發放","","",""]);
      entries.push([now, addr, propId, p.referrer, refEmail, "引薦人", "代管引薦-第6月(30%)", addMo(signDate, 6),  Math.round(total * (params.daimgmtRef2 || 0.3)), "待發放","","",""]);
      entries.push([now, addr, propId, p.referrer, refEmail, "引薦人", "代管引薦-第12月(30%)",addMo(signDate, 12), Math.round(total * (params.daimgmtRef3 || 0.3)), "待發放","","",""]);
    } else if (p.mgmtType === "包租") {
      const spread = (parseInt(p.marketRent)||0) - (parseInt(p.hodaRent)||0);
      if (spread > 0) {
        entries.push([now, addr, propId, p.referrer, refEmail, "引薦人", "包租引薦-簽約時", signDate,            spread * (params.baozuRef1 || 1), "待發放","","",""]);
        entries.push([now, addr, propId, p.referrer, refEmail, "引薦人", "包租引薦-第6月",  addMo(signDate, 6),  spread * (params.baozuRef2 || 1), "待發放","","",""]);
      }
    }
    for (let y = 1; y <= years; y++) {
      entries.push([now, addr, propId, p.referrer, refEmail, "引薦人", `感謝禮(第${y}年)`, addMo(signDate, y * 12), params.thanksGiftAmount || 1500, "待發放","","",""]);
    }
  }

  // ── 管理人員獎金 ──
  if (p.manager) {
    const fee          = parseInt(p.mgmtFee) || parseInt(p.rentAmount) || 0;
    const rate         = params.managerBaseRate || 0.15;
    const monthlyBonus = Math.round(fee * rate);
    for (let m = 0; m < years * 12; m += 6) {
      entries.push([now, addr, propId, p.manager, mgrEmail, "管理人員", `月度佣金(第${m+1}~${m+6}月)`,
        addMo(signDate, m + 6), monthlyBonus * 6, "待發放","","", `NT$${monthlyBonus}/月 × 6`]);
    }
    for (let y = 1; y <= years; y++) {
      entries.push([now, addr, propId, p.manager, mgrEmail, "管理人員", `感謝禮A(第${y}年)`, addMo(signDate, y*12-6), params.thanksGiftAmount || 1500, "待發放","","",""]);
      entries.push([now, addr, propId, p.manager, mgrEmail, "管理人員", `感謝禮B(第${y}年)`, addMo(signDate, y*12),   params.thanksGiftAmount || 1500, "待發放","","",""]);
    }
  }

  entries.forEach(row => sheet.appendRow(row));
}

// ─── 獎金儀表板（全部待發放，依日期排序） ───
function listBonusDashboard() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_BONUS_SCHEDULE);
  if (!sheet || sheet.getLastRow() < 2) return ContentService.createTextOutput(JSON.stringify({ rows: [] })).setMimeType(ContentService.MimeType.JSON);

  const data    = sheet.getDataRange().getValues();
  const headers = data[0];

  const rows = data.slice(1).map((row, i) => {
    const obj = { _rowIndex: i + 2 };
    headers.forEach((h, j) => { obj[h] = row[j] instanceof Date ? row[j].toISOString() : row[j]; });
    return obj;
  }).filter(r => r['狀態'] !== '已發放' && r['狀態'] !== '已刪除')
    .sort((a, b) => new Date(a['預計發放日']) - new Date(b['預計發放日']));

  return ContentService.createTextOutput(JSON.stringify({ rows })).setMimeType(ContentService.MimeType.JSON);
}

// ─── 物件列表 ───
function listProperties() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_PROPERTY);
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

// ─── 更新物件台帳（房東資料可修改） ───
function updateProperty(ss, data) {
  const sheet = ss.getSheetByName(SHEET_PROPERTY);
  if (!sheet || !data._rowIndex) return;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const p = data.property || {};
  const setCol = (headerName, val) => {
    const col = headers.indexOf(headerName) + 1;
    if (col) sheet.getRange(data._rowIndex, col).setValue(val);
  };
  if (p.address    !== undefined) setCol("物件地址", p.address);
  if (p.ownerName  !== undefined) setCol("屋主姓名", p.ownerName);
  if (p.ownerPhone !== undefined) setCol("屋主電話", p.ownerPhone);
  if (p.mgmtType   !== undefined) setCol("管理方式", p.mgmtType);
  if (p.rentAmount !== undefined) setCol("月租金(NT$)", p.rentAmount);
  if (p.mgmtFee    !== undefined) setCol("代管費(NT$)", p.mgmtFee);
  if (p.marketRent !== undefined) setCol("市場月租(NT$)", p.marketRent);
  if (p.hodaRent   !== undefined) setCol("禾大收租(NT$)", p.hodaRent);
  if (p.referrer   !== undefined) setCol("引薦人", p.referrer);
  if (p.manager    !== undefined) setCol("管理人員", p.manager);
  if (p.note       !== undefined) setCol("備注", p.note);
  // 若市場月租 / 禾大收租有更新，重算月價差
  if (p.marketRent !== undefined || p.hodaRent !== undefined) {
    const mCol = headers.indexOf("市場月租(NT$)") + 1;
    const hCol = headers.indexOf("禾大收租(NT$)") + 1;
    if (mCol && hCol) {
      const m = parseInt(sheet.getRange(data._rowIndex, mCol).getValue()) || 0;
      const h = parseInt(sheet.getRange(data._rowIndex, hCol).getValue()) || 0;
      setCol("月價差(NT$)", (m - h) > 0 ? (m - h) : "");
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  房客資料 CRUD（可手動新增，或由 HERMES 讀合約PDF後 POST 進來）
//  POST { type:"tenant", registrar, tenant:{...} }
// ═══════════════════════════════════════════════════════════
const TENANT_HEADERS = [
  "登錄時間","登錄人","綁定物件ID","物件地址","房號/樓層","房客姓名",
  "身分證/統編","聯絡電話","緊急聯絡人","租期起","租期迄",
  "月租金(NT$)","押金(NT$)","付款日","租客狀態","合約PDF連結","備注","房客ID"
];

function ensureTenantSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_TENANT);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_TENANT);
    sheet.appendRow(TENANT_HEADERS);
    sheet.getRange(1,1,1,sheet.getLastColumn()).setFontWeight("bold").setBackground("#1B3A5C").setFontColor("white");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function buildTenantRow(t, registrar) {
  return [
    new Date(), registrar || "",
    t.buildingId||"", t.address||"", t.room||"", t.name||"",
    t.idno||"", t.phone||"", t.emergency||"",
    t.leaseStart||"", t.leaseEnd||"",
    t.rent||"", t.deposit||"", t.payday||"",
    t.status||"在租", t.contractUrl||"", t.note||"",
    t.tenantId || ("T" + new Date().getTime())
  ];
}

function saveTenant(ss, data) {
  const sheet = ensureTenantSheet(ss);
  const t = data.tenant || {};
  sheet.appendRow(buildTenantRow(t, data.registrar));
  const statusCol = TENANT_HEADERS.indexOf("租客狀態") + 1;
  colorTenantRow(sheet, sheet.getLastRow(), t.status || "在租", statusCol);
}

function updateTenant(ss, data) {
  const sheet = ss.getSheetByName(SHEET_TENANT);
  if (!sheet || !data._rowIndex) return;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const t = data.tenant || {};
  const map = {
    buildingId:"綁定物件ID", address:"物件地址", room:"房號/樓層", name:"房客姓名",
    idno:"身分證/統編", phone:"聯絡電話", emergency:"緊急聯絡人",
    leaseStart:"租期起", leaseEnd:"租期迄", rent:"月租金(NT$)", deposit:"押金(NT$)",
    payday:"付款日", status:"租客狀態", contractUrl:"合約PDF連結", note:"備注"
  };
  Object.keys(map).forEach(k => {
    if (t[k] !== undefined) {
      const col = headers.indexOf(map[k]) + 1;
      if (col) sheet.getRange(data._rowIndex, col).setValue(t[k]);
    }
  });
  if (t.status !== undefined) colorTenantRow(sheet, data._rowIndex, t.status, headers.indexOf("租客狀態") + 1);
}

function deleteTenant(ss, data) {
  const sheet = ss.getSheetByName(SHEET_TENANT);
  if (!sheet || !data._rowIndex) return;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const statusCol = headers.indexOf("租客狀態") + 1;
  if (statusCol) sheet.getRange(data._rowIndex, statusCol).setValue("已退租");
  colorTenantRow(sheet, data._rowIndex, "已退租", statusCol);
}

function colorTenantRow(sheet, rowNum, status, statusCol) {
  const bg = status === "在租" ? "#e8f5e9" : status === "已退租" ? "#eeeeee" : "#fff8e1";
  if (statusCol) sheet.getRange(rowNum, statusCol).setBackground(bg);
}

function listTenants(buildingId) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_TENANT);
  if (!sheet || sheet.getLastRow() < 2) return ContentService.createTextOutput(JSON.stringify({ rows: [] })).setMimeType(ContentService.MimeType.JSON);

  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  let rows      = data.slice(1).map((row, i) => {
    const obj = { _rowIndex: i + 2 };
    headers.forEach((h, j) => { obj[h] = row[j] instanceof Date ? row[j].toISOString() : row[j]; });
    return obj;
  }).reverse();
  if (buildingId) rows = rows.filter(r => String(r["綁定物件ID"]) === String(buildingId));

  return ContentService.createTextOutput(JSON.stringify({ rows })).setMimeType(ContentService.MimeType.JSON);
}

// ─── 發放獎金 ───
function payBonus(ss, data) {
  let recSheet = ss.getSheetByName(SHEET_BONUS_RECORD);
  if (!recSheet) {
    recSheet = ss.insertSheet(SHEET_BONUS_RECORD);
    recSheet.appendRow(["發放時間","物件地址","受益人","受益人Email","角色","獎金類型","金額(NT$)","發放人","備注"]);
    recSheet.getRange(1,1,1,9).setFontWeight("bold").setBackground("#1B3A5C").setFontColor("white");
    recSheet.setFrozenRows(1);
  }
  recSheet.appendRow([
    new Date(), data.address||"", data.recipient||"", data.recipientEmail||"",
    data.role||"", data.bonusType||"", data.amount||0, data.paidBy||"", data.note||""
  ]);

  // 更新獎金排程狀態（欄位因新增Email欄移位：狀態=col10, 發放日=col11, 發放人=col12）
  const schedSheet = ss.getSheetByName(SHEET_BONUS_SCHEDULE);
  if (schedSheet && data._rowIndex) {
    const headers = schedSheet.getRange(1, 1, 1, schedSheet.getLastColumn()).getValues()[0];
    const statusCol  = headers.indexOf("狀態") + 1;
    const dateCol    = headers.indexOf("發放日期") + 1;
    const payerCol   = headers.indexOf("發放人") + 1;
    if (statusCol) { schedSheet.getRange(data._rowIndex, statusCol).setValue("已發放").setBackground("#e8f5e9"); }
    if (dateCol)   { schedSheet.getRange(data._rowIndex, dateCol).setValue(new Date()); }
    if (payerCol)  { schedSheet.getRange(data._rowIndex, payerCol).setValue(data.paidBy || ""); }
  }

  // 寄送 Email 通知（寄給受益人，副本給禾大屋管）
  if (data.recipientEmail) {
    try {
      const amt     = parseInt(data.amount) || 0;
      const subject = `[禾大屋管] 獎金發放通知 — NT$${amt.toLocaleString()}`;
      const htmlBody = `<div style="font-family:-apple-system,sans-serif;max-width:540px;margin:0 auto">
  <div style="background:#1B3A5C;padding:20px 24px;border-radius:10px 10px 0 0">
    <div style="font-size:10px;color:#C9A84C;letter-spacing:3px;font-weight:700">禾大屋管 HODA</div>
    <div style="font-size:20px;font-weight:900;color:white;margin-top:5px">獎金發放通知</div>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;padding:20px 24px;border-radius:0 0 10px 10px;background:white">
    <p style="font-size:14px;color:#374151">親愛的 <strong>${data.recipient||''}</strong> 您好，</p>
    <p style="font-size:14px;color:#374151">您的獎金已完成發放，明細如下：</p>
    <div style="background:#e8f5e9;border-radius:10px;padding:16px 20px;margin:16px 0;text-align:center">
      <div style="font-size:36px;font-weight:900;color:#1b5e20">NT$ ${amt.toLocaleString()}</div>
      <div style="font-size:13px;color:#2e7d32;margin-top:4px">${data.bonusType||''}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <tr><td style="padding:5px 0;color:#6b7280;width:80px">物件地址</td><td style="font-weight:600">${data.address||''}</td></tr>
      <tr><td style="padding:5px 0;color:#6b7280">角色</td><td>${data.role||''}</td></tr>
      <tr><td style="padding:5px 0;color:#6b7280">發放人</td><td>${data.paidBy||''}</td></tr>
      <tr><td style="padding:5px 0;color:#6b7280">發放時間</td><td>${new Date().toLocaleString('zh-TW')}</td></tr>
    </table>
    <p style="font-size:12px;color:#9ca3af;margin-top:20px;text-align:center">如有任何問題請聯繫禾大屋管 · changpaiwang@gmail.com</p>
  </div>
</div>`;
      MailApp.sendEmail({ to: data.recipientEmail, cc: NOTIFY_EMAIL, subject, htmlBody });
    } catch(err) { Logger.log("Pay bonus email error: " + err); }
  }
}

// ─── 系統參數 ───
function getDefaultParams() {
  return {
    daimgmtRefRate:       0.5,
    daimgmtRef1:          0.4,
    daimgmtRef2:          0.3,
    daimgmtRef3:          0.3,
    baozuRef1:            1,
    baozuRef2:            1,
    managerBaseRate:      0.15,
    managerMidRate:       0.20,
    managerHighRate:      0.25,
    managerBasePropCount: 5,
    managerMidPropCount:  10,
    thanksGiftAmount:     1500,
    thanksGiftReferrer:   1,
    thanksGiftManager:    2,
  };
}

// ─── 修改獎金排程項目 ───
function editBonus(ss, data) {
  const sheet = ss.getSheetByName(SHEET_BONUS_SCHEDULE);
  if (!sheet || !data._rowIndex) return;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (data.amount !== undefined) {
    const col = headers.indexOf("金額(NT$)") + 1;
    if (col) sheet.getRange(data._rowIndex, col).setValue(parseInt(data.amount) || 0);
  }
  if (data.dueDate) {
    const col = headers.indexOf("預計發放日") + 1;
    if (col) sheet.getRange(data._rowIndex, col).setValue(new Date(data.dueDate));
  }
  if (data.note !== undefined) {
    const col = headers.indexOf("備注") + 1;
    if (col) sheet.getRange(data._rowIndex, col).setValue(data.note);
  }
}

// ─── 刪除獎金排程項目（軟刪除，標記狀態） ───
function deleteBonus(ss, data) {
  const sheet = ss.getSheetByName(SHEET_BONUS_SCHEDULE);
  if (!sheet || !data._rowIndex) return;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const statusCol = headers.indexOf("狀態") + 1;
  if (statusCol) sheet.getRange(data._rowIndex, statusCol).setValue("已刪除").setBackground("#eeeeee").setFontColor("#999999");
}

function getParamsObj(ss) {
  const sheet = ss.getSheetByName(SHEET_PARAMS);
  const p     = getDefaultParams();
  if (!sheet || sheet.getLastRow() < 2) return p;
  sheet.getDataRange().getValues().slice(1).forEach(row => {
    if (row[0]) p[row[0]] = isNaN(row[1]) ? row[1] : parseFloat(row[1]);
  });
  return p;
}

function getParams() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ContentService.createTextOutput(JSON.stringify({ params: getParamsObj(ss) })).setMimeType(ContentService.MimeType.JSON);
}

function saveParams(ss, data) {
  let sheet = ss.getSheetByName(SHEET_PARAMS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_PARAMS);
    sheet.appendRow(["參數鍵值","數值","說明","更新時間","更新人"]);
    sheet.getRange(1,1,1,5).setFontWeight("bold").setBackground("#1B3A5C").setFontColor("white");
    sheet.setFrozenRows(1);
  }
  if (sheet.getLastRow() > 1) sheet.deleteRows(2, sheet.getLastRow() - 1);

  const labels = {
    daimgmtRefRate:"代管引薦費率(首月管理費×比例)",
    daimgmtRef1:"代管引薦-第0月分配比例",daimgmtRef2:"代管引薦-第6月分配比例",daimgmtRef3:"代管引薦-第12月分配比例",
    baozuRef1:"包租引薦-簽約時月差額倍率",baozuRef2:"包租引薦-第6月月差額倍率",
    managerBaseRate:"管理員月費率(1-N件)",managerMidRate:"管理員月費率(中等)",managerHighRate:"管理員月費率(高等)",
    managerBasePropCount:"基本級件數上限",managerMidPropCount:"中等級件數上限",
    thanksGiftAmount:"感謝禮金額(NT$)",thanksGiftReferrer:"感謝禮-引薦人次數/年",thanksGiftManager:"感謝禮-管理員次數/年",
  };
  Object.entries(data.params || {}).forEach(([k, v]) => {
    sheet.appendRow([k, v, labels[k]||"", new Date(), data.updatedBy||""]);
  });
}

// ─── Email：勘查清單 ───
function sendChecklistEmail(data, isUpdate) {
  try {
    const l = data.landlord||{}, f = data.fields||{}, sec = data.sections||[];
    let checked=0, total=0;
    sec.forEach(s=>{ checked+=s.items.filter(i=>i.checked).length; total+=s.items.length; });
    const pct    = total>0?Math.round(checked/total*100):0;
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
      <tr><td style="padding:5px 0;color:#6b7280;font-size:13px">引薦人</td><td style="padding:5px 0">${l.referrer||'—'}</td></tr>
      <tr><td style="padding:5px 0;color:#6b7280;font-size:13px">管理人員</td><td style="padding:5px 0">${l.manager||'—'}</td></tr>
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

// ─── Email：物件台帳 ───
function sendPropertyEmail(data) {
  try {
    const p = data.property || {};
    const subject = `[禾大台帳] ${p.address||'未填地址'} 已登錄 — ${p.mgmtType||''} 引薦：${p.referrer||'無'} 管理：${p.manager||'無'}`;
    const htmlBody = `<div style="font-family:-apple-system,sans-serif;max-width:580px;margin:0 auto">
  <div style="background:#1B3A5C;padding:20px 24px;border-radius:10px 10px 0 0">
    <div style="font-size:10px;color:#C9A84C;letter-spacing:3px;font-weight:700">禾大屋管 HODA</div>
    <div style="font-size:20px;font-weight:900;color:white;margin-top:5px">物件台帳登錄通知</div>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;padding:20px 24px;border-radius:0 0 10px 10px;background:white">
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;width:100px">物件地址</td><td style="font-weight:700">${p.address||''}</td></tr>
      <tr><td style="padding:5px 0;color:#6b7280;font-size:13px">屋主</td><td>${p.ownerName||''} ${p.ownerPhone?'· '+p.ownerPhone:''}</td></tr>
      <tr><td style="padding:5px 0;color:#6b7280;font-size:13px">管理方式</td><td>${p.mgmtType||''}</td></tr>
      <tr><td style="padding:5px 0;color:#6b7280;font-size:13px">簽約日期</td><td>${p.signDate||''}</td></tr>
      <tr><td style="padding:5px 0;color:#6b7280;font-size:13px">合約年限</td><td>${p.contractYears||''}年</td></tr>
      <tr><td style="padding:5px 0;color:#6b7280;font-size:13px">引薦人</td><td style="font-weight:700;color:#7e22ce">${p.referrer||'無'}</td></tr>
      <tr><td style="padding:5px 0;color:#6b7280;font-size:13px">管理人員</td><td style="font-weight:700;color:#1565c0">${p.manager||'無'}</td></tr>
    </table>
    <div style="margin-top:14px;background:#e8f5e9;border-radius:8px;padding:12px;font-size:12px;color:#2e7d32">✓ 獎金排程已自動生成，請至禾大後台試算表查看「獎金排程」分頁</div>
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
  const typeLabel = {checklist:"勘查清單",scoring:"物件評分",property:"物件台帳"}[type] || type;
  sheet.appendRow([new Date(time || new Date()), typeLabel, user]);
}

// ─── 測試函數 ───
function testSetup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  Logger.log("Spreadsheet name: " + ss.getName());
  Logger.log("Version: 3.0 OK");
}
