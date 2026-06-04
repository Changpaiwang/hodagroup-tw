import sys
sys.stdout.reconfigure(encoding='utf-8')

BASE = 'C:/Users/Frank/OneDrive/Documents/CLAUDE/hodagroup-tw'

QUIZ = """<!-- ══ 禾大屋管・房東節稅資格試算工具 ══ -->
<section id="tax-quiz" style="background:#f0ede6;padding:72px 20px;">
<div style="max-width:680px;margin:0 auto;">
  <div style="text-align:center;margin-bottom:36px;">
    <div style="display:inline-block;background:var(--gold-d,#b8860b);color:#fff;font-size:0.7rem;font-weight:700;letter-spacing:2px;padding:5px 14px;border-radius:20px;margin-bottom:12px;">禾大屋管・免費試算工具</div>
    <h2 style="font-family:'Noto Serif TC',serif;font-size:1.6rem;font-weight:700;color:var(--green-deep,#1b3a2d);margin:0 0 10px;">你符合公益出租人資格嗎？<br>一鍵試算你的年省稅金</h2>
    <p style="color:#6b6b6b;font-size:0.9rem;margin:0;">回答 6 個問題，立即計算綜合所得稅＋房屋稅＋地價稅的年省金額</p>
  </div>
  <div id="tq-card" style="background:#fff;border-radius:14px;box-shadow:0 4px 30px rgba(0,0,0,0.08);padding:36px 40px;">
    <div style="height:4px;background:#eee;border-radius:2px;margin-bottom:28px;">
      <div id="tq-bar" style="height:4px;background:var(--green-mid,#2e5e45);border-radius:2px;width:17%;transition:width .4s;"></div>
    </div>
    <div id="tq-step-lbl" style="font-size:0.72rem;color:#6b6b6b;letter-spacing:1px;margin-bottom:18px;">步驟 1 / 6</div>
    <div id="tq-body"></div>
    <div id="tq-nav" style="display:flex;gap:12px;margin-top:28px;flex-wrap:wrap;"></div>
  </div>
</div>
</section>

<style>
.tq-q{font-family:'Noto Serif TC',serif;font-size:1.15rem;font-weight:700;color:var(--green-deep,#1b3a2d);margin:0 0 20px;line-height:1.5;}
.tq-hint{font-size:.78rem;color:#6b6b6b;margin:-12px 0 16px;background:#fffbf0;border-left:3px solid var(--gold,#c9a85c);padding:7px 12px;border-radius:0 4px 4px 0;}
.tq-opt{display:block;width:100%;text-align:left;padding:13px 18px;margin-bottom:10px;border:2px solid #e0ddd6;border-radius:8px;background:#fff;cursor:pointer;font-size:.92rem;color:#1a1a1a;transition:border-color .2s,background .2s;font-family:'Noto Sans TC',sans-serif;}
.tq-opt:hover{border-color:var(--green-mid,#2e5e45);background:#f3f8f5;}
.tq-opt.sel{border-color:var(--green-mid,#2e5e45);background:#edf6f1;font-weight:700;color:var(--green-deep,#1b3a2d);}
.tq-csel{width:100%;padding:13px 16px;border:2px solid #e0ddd6;border-radius:8px;font-size:.92rem;color:#1a1a1a;background:#fff;outline:none;font-family:'Noto Sans TC',sans-serif;cursor:pointer;}
.tq-csel:focus{border-color:var(--green-mid,#2e5e45);}
.tq-btn{padding:12px 28px;border-radius:6px;border:none;cursor:pointer;font-size:.9rem;font-weight:700;font-family:'Noto Sans TC',sans-serif;transition:all .2s;}
.tq-next{background:var(--green-mid,#2e5e45);color:#fff;}
.tq-next:hover{background:var(--green-deep,#1b3a2d);}
.tq-back{background:#f0ede8;color:#3d3d3d;}
.tq-back:hover{background:#e0ddd6;}
/* 結果 */
.tq-result{text-align:center;}
.tq-badge{display:inline-block;background:#edf6f1;color:var(--green-deep,#1b3a2d);font-size:.72rem;font-weight:700;letter-spacing:2px;padding:5px 16px;border-radius:20px;margin-bottom:16px;}
.tq-total{font-family:'Noto Serif TC',serif;font-size:2.8rem;font-weight:900;color:var(--green-mid,#2e5e45);line-height:1;}
.tq-breakdown{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:18px 0;}
.tq-tax-item{background:#f9f7f3;border:1px solid #e0ddd6;border-radius:8px;padding:12px 18px;min-width:160px;text-align:center;}
.tq-tax-name{font-size:.72rem;color:#6b6b6b;margin-bottom:4px;letter-spacing:1px;}
.tq-tax-val{font-family:'Noto Serif TC',serif;font-size:1.25rem;font-weight:700;color:var(--green-deep,#1b3a2d);}
.tq-tags{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:0 0 20px;}
.tq-tag{background:#f3f8f5;border:1px solid #c5e0d0;color:var(--green-deep,#1b3a2d);font-size:.73rem;padding:4px 12px;border-radius:20px;}
.tq-tag.w{background:#fff8f0;border-color:#f5c48a;color:#8a5000;}
.tq-cta{background:linear-gradient(135deg,var(--green-deep,#1b3a2d),var(--green-mid,#2e5e45));border-radius:10px;padding:22px 24px;color:#fff;margin-top:8px;text-align:left;}
.tq-cta h4{font-family:'Noto Serif TC',serif;font-size:1rem;font-weight:700;margin:0 0 6px;}
.tq-cta p{font-size:.82rem;color:rgba(255,255,255,.8);margin:0 0 14px;line-height:1.65;}
.tq-cta-btns{display:flex;gap:10px;flex-wrap:wrap;}
.tq-ca{padding:10px 20px;border-radius:6px;font-size:.85rem;font-weight:700;text-decoration:none;transition:all .2s;}
.tq-ca-line{background:var(--gold,#c9a85c);color:var(--green-deep,#1b3a2d);}
.tq-ca-line:hover{background:#e0bf74;}
.tq-ca-out{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5);}
.tq-ca-out:hover{background:rgba(255,255,255,.1);}
.tq-no-icon{font-size:2.4rem;margin-bottom:10px;}
.tq-no-ttl{font-family:'Noto Serif TC',serif;font-size:1.2rem;font-weight:700;color:var(--green-deep,#1b3a2d);margin-bottom:8px;}
.tq-no-msg{font-size:.87rem;color:#3d3d3d;line-height:1.7;margin-bottom:20px;}
.tq-restart{background:var(--green-mid,#2e5e45);color:#fff;border:none;padding:12px 26px;border-radius:6px;cursor:pointer;font-weight:700;font-family:'Noto Sans TC',sans-serif;}
@media(max-width:600px){#tq-card{padding:22px 16px;}.tq-total{font-size:2.2rem;}.tq-breakdown{flex-direction:column;align-items:center;}.tq-cta-btns{flex-direction:column;}}
</style>

<script>
(function(){
var CITIES=[
  {n:"台北市",ht:1.2,lt:0.2,base_ht:0.6,base_lt:0.6},
  {n:"新北市",ht:1.2,lt:0.2,base_ht:0.5,base_lt:0.6},
  {n:"桃園市",ht:1.2,lt:0.2,base_ht:0.5,base_lt:0.55},
  {n:"台中市",ht:1.2,lt:0.2,base_ht:0.5,base_lt:0.55},
  {n:"台南市",ht:1.2,lt:0.2,base_ht:0.5,base_lt:0.5},
  {n:"高雄市",ht:1.2,lt:0.2,base_ht:0.5,base_lt:0.5},
  {n:"其他縣市",ht:1.2,lt:0.2,base_ht:0.45,base_lt:0.45}
];
var S=[
  {id:"s1",q:"你目前的出租狀況是？",tp:"s",opts:[
    {t:"🏠 已有租客，目前在出租中",v:"has"},
    {t:"🔑 準備招租，房子還空著",v:"empty"},
    {t:"🔄 想幫現有租客申請補貼、轉換為公益出租人",v:"convert"}
  ]},
  {id:"s2",q:"你的租客有沒有申請政府租金補貼？",tp:"s",
   hint:"成為公益出租人的關鍵：房客需向政府申請租金補貼，主管機關確認後即自動認定你為公益出租人",opts:[
    {t:"✅ 有，政府已核准補貼，我已是公益出租人",v:"approved"},
    {t:"📋 房客已申請，還在等審核",v:"pending"},
    {t:"💡 房客還沒申請，但我願意配合讓他/她申請",v:"willing"},
    {t:"❓ 不確定，需要確認",v:"unknown"}
  ]},
  {id:"s3",q:"你是以什麼名義出租？",tp:"s",opts:[
    {t:"👤 個人（自然人）名義出租",v:"person"},
    {t:"🏢 公司或法人名義出租",v:"company",stop:"company"}
  ]},
  {id:"s4",q:"你有正式書面租賃契約嗎？",tp:"s",
   hint:"公益出租人認定需要合法租賃契約，建議向地政局辦理備案",opts:[
    {t:"✅ 有，且已向地政局登記備案",v:"reg"},
    {t:"📄 有書面契約，但尚未備案",v:"unreg",warn:"unreg"},
    {t:"❌ 沒有書面契約",v:"none",stop:"nocon"}
  ]},
  {id:"s5",q:"你每月收的租金大約是多少？",tp:"s",opts:[
    {t:"1 萬元以下",v:8000},
    {t:"1 萬 ~ 1.5 萬",v:12500},
    {t:"1.5 ~ 2 萬（含）",v:15000},
    {t:"2 ~ 3 萬",v:25000},
    {t:"3 ~ 4 萬",v:35000},
    {t:"4 萬以上",v:45000}
  ]},
  {id:"s6",q:"房子在哪個縣市？",tp:"c"}
];
var STOP={
  company:{icon:"🏢",ttl:"公司名義出租不適用此優惠",
    msg:"「公益出租人」稅賦優惠僅限<strong>個人（自然人）</strong>出租人適用。若你是以公司名義出租，目前不符合這三項稅賦優惠。<br><br>若有個人名下房屋有出租需求，歡迎洽詢禾大屋管了解可行方案。"},
  nocon:{icon:"📄",ttl:"需要先補辦租賃契約備案",
    msg:"政府認定公益出租人時需核對已備案的租賃契約。建議先辦理合法租賃登記，或由禾大屋管協助你與房客完成文件，後續才能順利認定並享有稅賦優惠。"}
};
var st={step:0,ans:{},city:null,warns:[]};
var BD=document.getElementById("tq-body");
var NV=document.getElementById("tq-nav");
var BR=document.getElementById("tq-bar");
var LB=document.getElementById("tq-step-lbl");

function render(){
  if(st.step>=S.length){result();return;}
  var s=S[st.step];
  BR.style.width=Math.round((st.step+1)/S.length*100)+"%";
  LB.textContent="步驟 "+(st.step+1)+" / "+S.length;
  var h='<div class="tq-q">'+s.q+"</div>";
  if(s.hint) h+='<div class="tq-hint">'+s.hint+"</div>";
  if(s.tp==="s"){
    s.opts.forEach(function(o){
      var sel=st.ans[s.id]===String(o.v)?' sel':'';
      h+='<button class="tq-opt'+sel+'" data-v="'+o.v+'">'+o.t+"</button>";
    });
  }else if(s.tp==="c"){
    var cv=st.ans[s.id]||'';
    h+='<select class="tq-csel" id="tq-cs"><option value="">— 請選擇縣市 —</option>';
    CITIES.forEach(function(c){h+='<option value="'+c.n+'"'+(cv===c.n?' selected':'')+'>'+c.n+"</option>";});
    h+="</select>";
  }
  BD.innerHTML=h;
  NV.innerHTML=(st.step>0?'<button class="tq-btn tq-back" id="tq-bk">← 上一步</button>':'')
    +'<button class="tq-btn tq-next" id="tq-nx">下一步 →</button>';

  BD.querySelectorAll(".tq-opt").forEach(function(b){
    b.onclick=function(){
      BD.querySelectorAll(".tq-opt").forEach(function(x){x.classList.remove("sel");});
      b.classList.add("sel");st.ans[s.id]=b.dataset.v;
    };
  });
  document.getElementById("tq-nx").onclick=function(){
    var a=st.ans[s.id];
    if(s.tp==="c"){
      var cs=document.getElementById("tq-cs");
      if(!cs.value){alert("請選擇縣市");return;}
      st.ans[s.id]=cs.value;
      st.city=CITIES.find(function(c){return c.n===cs.value;})||CITIES[CITIES.length-1];
    }else if(!a){alert("請先選擇一個選項");return;}
    var o=s.opts&&s.opts.find(function(o){return String(o.v)===String(a);});
    if(o&&o.stop){stopPage(o.stop);return;}
    if(o&&o.warn&&st.warns.indexOf(o.warn)<0)st.warns.push(o.warn);
    st.step++;render();
  };
  var bk=document.getElementById("tq-bk");
  if(bk)bk.onclick=function(){st.step--;render();};
}

function stopPage(r){
  var m=STOP[r]||{icon:"⚠️",ttl:"需進一步確認",msg:"建議聯繫禾大屋管由專人協助確認。"};
  BR.style.width="100%";LB.textContent="結果";
  BD.innerHTML='<div style="text-align:center"><div class="tq-no-icon">'+m.icon+'</div>'
    +'<div class="tq-no-ttl">'+m.ttl+'</div><div class="tq-no-msg">'+m.msg+"</div></div>";
  NV.innerHTML='<button class="tq-restart" onclick="history.go(0)">重新填寫</button>'
    +' <a href="./index.html#contact" class="tq-btn tq-next" style="text-decoration:none;">諮詢禾大屋管</a>';
}

function result(){
  BR.style.width="100%";LB.textContent="結果";
  var rent=parseInt(st.ans["s5"])||15000;
  var city=st.city||CITIES[CITIES.length-1];
  var s2=st.ans["s2"];

  /* ── 所得稅試算（免稅15,000/月，簡化稅率20%）── */
  var exempt=Math.min(rent,15000);
  var income_save=Math.round(exempt*12*0.20/100)*100;

  /* ── 房屋稅試算（評定現值假設80萬，非自住→自住差約1%）── */
  /* 簡化：節省金額約 4,000~12,000/年，用縣市基本值 */
  var house_save=city.n==="台北市"?9600:city.n==="新北市"?7200:5600;

  /* ── 地價稅試算（地價總額假設200萬，非自住→自住差約0.4%）── */
  var land_save=city.n==="台北市"?8000:city.n==="新北市"?6000:4500;

  var total=income_save+house_save+land_save;

  /* ── 狀態標籤 ── */
  var tags=[];
  if(s2==="approved") tags.push({t:"✅ 已是公益出租人，三稅優惠生效中",w:0});
  else if(s2==="pending") tags.push({t:"📋 審核中，通過後即自動取得資格",w:0});
  else if(s2==="willing"||s2==="unknown") tags.push({t:"💡 讓禾大屋管協助確認房客資格",w:1});
  tags.push({t:"📍 "+city.n,w:0});
  if(st.warns.indexOf("unreg")>=0) tags.push({t:"⚠️ 契約尚未備案，請盡快辦理",w:1});

  var th=tags.map(function(t){return'<span class="tq-tag'+(t.w?' w':'')+'">'+(t.t)+"</span>";}).join("");

  BD.innerHTML='<div class="tq-result">'
    +'<div class="tq-badge">💰 預估每年可節省稅金</div>'
    +'<div class="tq-total">'+total.toLocaleString()
      +'<span style="font-size:1rem;font-weight:400;color:#6b6b6b;"> 元 / 年</span></div>'
    +'<div style="font-size:.75rem;color:#6b6b6b;margin:6px 0 16px;">(依實際房屋評定現值與地價核算，以主管機關核定為準)</div>'
    +'<div class="tq-breakdown">'
      +'<div class="tq-tax-item"><div class="tq-tax-name">綜合所得稅</div><div class="tq-tax-val">省 '+income_save.toLocaleString()+' 元</div><div style="font-size:.7rem;color:#aaa;margin-top:2px;">每月最多 15,000 免稅</div></div>'
      +'<div class="tq-tax-item"><div class="tq-tax-name">房屋稅</div><div class="tq-tax-val">省 '+house_save.toLocaleString()+' 元</div><div style="font-size:.7rem;color:#aaa;margin-top:2px;">比照自住稅率</div></div>'
      +'<div class="tq-tax-item"><div class="tq-tax-name">地價稅</div><div class="tq-tax-val">省 '+land_save.toLocaleString()+' 元</div><div style="font-size:.7rem;color:#aaa;margin-top:2px;">比照自住稅率</div></div>'
    +"</div>"
    +'<div class="tq-tags">'+th+"</div>"
    +'<div class="tq-cta">'
      +'<h4>禾大屋管幫你確認並協助辦理</h4>'
      +'<p>禾大屋管協助大台北地區超過 40 間房屋的出租管理，熟悉公益出租人的認定流程，可幫你確認房客資格、整理申請文件，讓你輕鬆享有三大稅賦優惠。</p>'
      +'<div class="tq-cta-btns">'
        +'<a href="./index.html#contact" class="tq-ca tq-ca-line">免費諮詢禾大屋管</a>'
        +'<a href="./tenant-subsidy.html" class="tq-ca tq-ca-out">查看房客補貼資訊 ›</a>'
      +"</div>"
    +"</div>"
    +"</div>";
  NV.innerHTML='<button class="tq-restart" onclick="history.go(0)">重新填寫</button>';
}
render();
})();
</script>
"""

with open(f'{BASE}/tax-savings.html', encoding='utf-8') as f:
    src = f.read()

if 'id="tax-quiz"' in src:
    print('Quiz already present')
else:
    # Insert before footer
    src = src.replace('<!-- FOOTER -->', QUIZ + '\n<!-- FOOTER -->', 1)
    with open(f'{BASE}/tax-savings.html', 'w', encoding='utf-8') as f:
        f.write(src)
    ok = 'id="tax-quiz"' in src and 'tq-body' in src and 'tq-total' in src
    print('Done. All checks pass:', ok, '| File size:', len(src))
