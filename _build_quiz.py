import sys
sys.stdout.reconfigure(encoding='utf-8')

BASE = 'C:/Users/Frank/OneDrive/Documents/CLAUDE/hodagroup-tw'

QUIZ_HTML = """<!-- ══ 禾大屋管・租金補貼資格確認工具 ══ -->
<section id="quiz" style="background:var(--cream-dark);padding:72px 20px;">
<div style="max-width:680px;margin:0 auto;">
  <div style="text-align:center;margin-bottom:36px;">
    <div style="display:inline-block;background:#e05c2a;color:#fff;font-size:0.7rem;font-weight:700;letter-spacing:2px;padding:5px 14px;border-radius:20px;margin-bottom:12px;">禾大屋管・免費資格確認工具</div>
    <h2 style="font-family:'Noto Serif TC',serif;font-size:1.6rem;font-weight:700;color:var(--green-deep);margin:0 0 10px;">一鍵確認你的租金補貼資格</h2>
    <p style="color:var(--text-soft);font-size:0.9rem;margin:0;">回答 7 個問題，立即顯示預估補貼金額與申請建議</p>
  </div>
  <div id="qz-card" style="background:#fff;border-radius:14px;box-shadow:0 4px 30px rgba(0,0,0,0.08);padding:36px 40px;">
    <div style="height:4px;background:#eee;border-radius:2px;margin-bottom:28px;">
      <div id="qz-bar" style="height:4px;background:var(--green-mid);border-radius:2px;width:14%;transition:width .4s;"></div>
    </div>
    <div id="qz-step-lbl" style="font-size:0.72rem;color:var(--text-soft);letter-spacing:1px;margin-bottom:18px;">步驟 1 / 7</div>
    <div id="qz-body"></div>
    <div id="qz-nav" style="display:flex;gap:12px;margin-top:28px;flex-wrap:wrap;"></div>
  </div>
</div>
</section>

<style>
.qz-q{font-family:'Noto Serif TC',serif;font-size:1.15rem;font-weight:700;color:var(--green-deep);margin:0 0 20px;line-height:1.5;}
.qz-hint{font-size:.78rem;color:var(--text-soft);margin:-12px 0 16px;background:#fff8f0;border-left:3px solid var(--gold);padding:7px 12px;border-radius:0 4px 4px 0;}
.qz-opt{display:block;width:100%;text-align:left;padding:13px 18px;margin-bottom:10px;border:2px solid #e0ddd6;border-radius:8px;background:#fff;cursor:pointer;font-size:.92rem;color:var(--text-dark);transition:border-color .2s,background .2s;font-family:'Noto Sans TC',sans-serif;}
.qz-opt:hover{border-color:var(--green-mid);background:#f3f8f5;}
.qz-opt.sel{border-color:var(--green-mid);background:#edf6f1;font-weight:700;color:var(--green-deep);}
.qz-opt.multi{padding-left:46px;position:relative;}
.qz-opt.multi::before{content:'☐';position:absolute;left:16px;font-size:1.1rem;color:#aaa;}
.qz-opt.multi.sel::before{content:'☑';color:var(--green-mid);}
.qz-btn{padding:12px 28px;border-radius:6px;border:none;cursor:pointer;font-size:.9rem;font-weight:700;font-family:'Noto Sans TC',sans-serif;transition:all .2s;}
.qz-next{background:var(--green-mid);color:#fff;}
.qz-next:hover{background:var(--green-deep);}
.qz-back{background:#f0ede8;color:var(--text-mid);}
.qz-back:hover{background:#e0ddd6;}
.qz-csel{width:100%;padding:13px 16px;border:2px solid #e0ddd6;border-radius:8px;font-size:.92rem;color:var(--text-dark);background:#fff;outline:none;font-family:'Noto Sans TC',sans-serif;cursor:pointer;}
.qz-csel:focus{border-color:var(--green-mid);}
.qz-badge{display:inline-block;background:#edf6f1;color:var(--green-deep);font-size:.72rem;font-weight:700;letter-spacing:2px;padding:5px 16px;border-radius:20px;margin-bottom:14px;}
.qz-amount{font-family:'Noto Serif TC',serif;font-size:2.8rem;font-weight:900;color:var(--green-mid);line-height:1;}
.qz-tags{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:14px 0 20px;}
.qz-tag{background:#f3f8f5;border:1px solid #c5e0d0;color:var(--green-deep);font-size:.73rem;padding:4px 12px;border-radius:20px;}
.qz-tag.w{background:#fff8f0;border-color:#f5c48a;color:#8a5000;}
.qz-cta{background:linear-gradient(135deg,var(--green-deep),var(--green-mid));border-radius:10px;padding:22px 24px;color:#fff;margin-top:6px;text-align:left;}
.qz-cta h4{font-family:'Noto Serif TC',serif;font-size:1rem;font-weight:700;margin:0 0 6px;}
.qz-cta p{font-size:.82rem;color:rgba(255,255,255,.8);margin:0 0 14px;line-height:1.65;}
.qz-cta-btns{display:flex;gap:10px;flex-wrap:wrap;}
.qz-ca{padding:10px 20px;border-radius:6px;font-size:.85rem;font-weight:700;text-decoration:none;transition:all .2s;}
.qz-ca-line{background:var(--gold);color:var(--green-deep);}
.qz-ca-line:hover{background:#e0bf74;}
.qz-ca-gov{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5);}
.qz-ca-gov:hover{background:rgba(255,255,255,.1);}
.qz-no-icon{font-size:2.4rem;margin-bottom:10px;}
.qz-no-ttl{font-family:'Noto Serif TC',serif;font-size:1.2rem;font-weight:700;color:var(--green-deep);margin-bottom:8px;}
.qz-no-msg{font-size:.87rem;color:var(--text-mid);line-height:1.7;margin-bottom:20px;}
.qz-restart{background:var(--green-mid);color:#fff;border:none;padding:12px 26px;border-radius:6px;cursor:pointer;font-weight:700;font-family:'Noto Sans TC',sans-serif;}
@media(max-width:600px){#qz-card{padding:22px 16px;}.qz-amount{font-size:2.2rem;}.qz-cta-btns{flex-direction:column;}}
</style>

<script>
(function(){
var C=[
  {n:"台北市",m:8000},{n:"新北市",m:6500},{n:"桃園市",m:5500},{n:"台中市",m:5500},
  {n:"台南市",m:5500},{n:"高雄市",m:5500},{n:"基隆市",m:4500},{n:"新竹縣市",m:4500},
  {n:"苗栗縣",m:4500},{n:"彰化縣",m:4500},{n:"南投縣",m:4500},{n:"雲林縣",m:4500},
  {n:"嘉義縣市",m:4500},{n:"屏東縣",m:4500},{n:"宜蘭縣",m:4500},
  {n:"花蓮縣",m:4500},{n:"台東縣",m:4500},{n:"澎湖／金門／馬祖",m:4500}
];
var S=[
  {id:"s1",q:"你目前的居住狀況是？",tp:"s",opts:[
    {t:"🏠 租屋中（每月繳房租）",v:"rent"},
    {t:"🏡 住在自己或家人名下的房子",v:"own",stop:"own"},
    {t:"🏫 住學校宿舍或公司宿舍",v:"dorm",stop:"dorm"}
  ]},
  {id:"s2",q:"你租的是哪種房子？",tp:"s",opts:[
    {t:"🏘️ 一般私人房東出租的住宅",v:"private"},
    {t:"🏛️ 政府興建的社會住宅 / 國宅",v:"gov",stop:"gov"},
    {t:"👥 住親友房子（未付租金）",v:"free",stop:"nocon"}
  ]},
  {id:"s3",q:"你有正式書面租賃契約嗎？",tp:"s",
   hint:"契約需向戶政事務所或地政局辦理公證 / 備案，補貼才能核准",opts:[
    {t:"✅ 有，且已向地政局登記備案",v:"reg"},
    {t:"📄 有書面契約，但尚未備案",v:"unreg",warn:"unreg"},
    {t:"❌ 沒有書面契約",v:"none",stop:"nocon"}
  ]},
  {id:"s4",q:"你或同住家人在全台灣有自有住宅嗎？",tp:"s",opts:[
    {t:"沒有，全家都沒有房子",v:"no"},
    {t:"有，但因就業 / 就學在外租屋",v:"special",warn:"special"},
    {t:"有，就住在自己的房子裡",v:"own",stop:"own"}
  ]},
  {id:"s5",q:"你符合以下哪些身份？（可複選，沒有請選「以上皆無」）",tp:"m",opts:[
    {t:"♿ 領有身心障礙證明",v:"dis"},
    {t:"🏷️ 低收入戶 / 中低收入戶",v:"low"},
    {t:"🌿 原住民族",v:"ind"},
    {t:"👴 65 歲以上長者",v:"old"},
    {t:"👶 家有 12 歲以下子女",v:"kid"},
    {t:"🎓 家有 20 歲以下在學子女",v:"stu"},
    {t:"👩‍👦 單親家庭",v:"sin"},
    {t:"— 以上皆無（一般租客）",v:"none",excl:true}
  ]},
  {id:"s6",q:"你在哪個縣市租屋？",tp:"c"},
  {id:"s7",q:"你每月繳的租金大約是多少？",tp:"s",opts:[
    {t:"1 萬元以下",v:9000},
    {t:"1 萬 ~ 1.5 萬",v:12500},
    {t:"1.5 ~ 2 萬",v:17500},
    {t:"2 ~ 3 萬",v:25000},
    {t:"3 ~ 4 萬",v:35000},
    {t:"4 萬以上",v:45000}
  ]}
];
var STOP={
  own:{icon:"🏡",ttl:"目前不符合補貼資格",msg:"租金補貼針對「無自有住宅的租屋族」。若你或同住家人在台灣已有自有住宅且居住其中，目前不符申請條件。<br><br>若因就業、就學在外租屋，有機會例外申請，歡迎聯繫禾大屋管確認。"},
  dorm:{icon:"🏫",ttl:"宿舍住戶不適用此補貼",msg:"學校宿舍、公司員工宿舍不屬於一般租屋，無法申請本補貼。如果你在外面同時有另一間租屋，歡迎重新填寫。"},
  gov:{icon:"🏛️",ttl:"社會住宅 / 國宅不適用",msg:"政府興建的社會住宅、國宅已有其他補助機制，不適用本租金補貼計畫。若有其他問題歡迎諮詢禾大屋管。"},
  nocon:{icon:"📄",ttl:"需要先補辦租賃契約備案",msg:"政府審核補貼時需核對已備案的租賃契約。建議請房東配合辦理合法登記，或由禾大屋管協助你與房東溝通取得正式契約。"}
};
var st={step:0,ans:{},city:null,warns:[]};
var BD=document.getElementById("qz-body");
var NV=document.getElementById("qz-nav");
var BR=document.getElementById("qz-bar");
var LB=document.getElementById("qz-step-lbl");

function render(){
  if(st.step>=S.length){result();return;}
  var s=S[st.step];
  BR.style.width=Math.round((st.step+1)/S.length*100)+"%";
  LB.textContent="步驟 "+(st.step+1)+" / "+S.length;
  var h='<div class="qz-q">'+s.q+"</div>";
  if(s.hint) h+='<div class="qz-hint">'+s.hint+"</div>";
  if(s.tp==="s"){
    s.opts.forEach(function(o){
      var sel=st.ans[s.id]===String(o.v)?' sel':'';
      h+='<button class="qz-opt'+sel+'" data-v="'+o.v+'">'+o.t+"</button>";
    });
  }else if(s.tp==="m"){
    s.opts.forEach(function(o){
      var sel=(st.ans[s.id]||[]).indexOf(o.v)>=0?' sel':'';
      h+='<button class="qz-opt multi'+sel+'" data-v="'+o.v+'" data-x="'+(!!o.excl)+'">'+o.t+"</button>";
    });
  }else if(s.tp==="c"){
    var cv=st.ans[s.id]||'';
    h+='<select class="qz-csel" id="qz-cs"><option value="">— 請選擇縣市 —</option>';
    C.forEach(function(c){h+='<option value="'+c.n+'"'+(cv===c.n?' selected':'')+'>'+c.n+"</option>";});
    h+="</select>";
  }
  BD.innerHTML=h;
  NV.innerHTML=(st.step>0?'<button class="qz-btn qz-back" id="qz-bk">← 上一步</button>':'')
    +'<button class="qz-btn qz-next" id="qz-nx">下一步 →</button>';

  BD.querySelectorAll(".qz-opt:not(.multi)").forEach(function(b){
    b.onclick=function(){
      BD.querySelectorAll(".qz-opt").forEach(function(x){x.classList.remove("sel");});
      b.classList.add("sel");st.ans[s.id]=b.dataset.v;
    };
  });
  BD.querySelectorAll(".qz-opt.multi").forEach(function(b){
    b.onclick=function(){
      var v=b.dataset.v,x=b.dataset.x==="true";
      if(!st.ans[s.id])st.ans[s.id]=[];
      if(x){
        st.ans[s.id]=[v];
        BD.querySelectorAll(".qz-opt.multi").forEach(function(e){e.classList.remove("sel");});
        b.classList.add("sel");
      }else{
        st.ans[s.id]=st.ans[s.id].filter(function(e){return e!=="none";});
        BD.querySelectorAll('.qz-opt.multi[data-x="true"]').forEach(function(e){e.classList.remove("sel");});
        var i=st.ans[s.id].indexOf(v);
        if(i>=0){st.ans[s.id].splice(i,1);b.classList.remove("sel");}
        else{st.ans[s.id].push(v);b.classList.add("sel");}
      }
    };
  });
  document.getElementById("qz-nx").onclick=function(){
    var a=st.ans[s.id];
    if(s.tp==="c"){
      var cs=document.getElementById("qz-cs");
      if(!cs.value){alert("請選擇縣市");return;}
      st.ans[s.id]=cs.value;
      st.city=C.find(function(c){return c.n===cs.value;});
    }else if(!a||(Array.isArray(a)&&!a.length)){alert("請先選擇一個選項");return;}
    var list=Array.isArray(a)?a:[a],sr=null;
    list.forEach(function(v){
      var o=s.opts&&s.opts.find(function(o){return String(o.v)===String(v);});
      if(o&&o.stop)sr=o.stop;
      if(o&&o.warn&&st.warns.indexOf(o.warn)<0)st.warns.push(o.warn);
    });
    if(sr){stopPage(sr);return;}
    st.step++;render();
  };
  var bk=document.getElementById("qz-bk");
  if(bk)bk.onclick=function(){st.step--;render();};
}

function stopPage(r){
  var m=STOP[r]||{icon:"⚠️",ttl:"需進一步確認",msg:"建議聯繫禾大屋管由專人協助確認。"};
  BR.style.width="100%";LB.textContent="結果";
  BD.innerHTML='<div style="text-align:center"><div class="qz-no-icon">'+m.icon+'</div><div class="qz-no-ttl">'+m.ttl+'</div><div class="qz-no-msg">'+m.msg+"</div></div>";
  NV.innerHTML='<button class="qz-restart" onclick="history.go(0)">重新填寫</button>'
    +'<a href="https://line.me/R/ti/p/@hodaproperty" target="_blank" class="qz-btn qz-next" style="text-decoration:none;">聯繫禾大屋管確認</a>';
}

function result(){
  BR.style.width="100%";LB.textContent="結果";
  var city=st.city||C[0];
  var rent=parseInt(st.ans["s7"])||15000;
  var sp=st.ans["s5"]||[];
  var pri=sp.length>0&&sp[0]!=="none";
  var sub=Math.min(Math.round(rent*(pri?0.75:0.40)/100)*100,city.m);
  var tags=[];
  tags.push(pri?{t:"🌟 優先補貼對象（最高 75%）",w:0}:{t:"一般補貼對象（最高 40%）",w:0});
  tags.push({t:"📍 "+city.n+"・上限 "+city.m.toLocaleString()+" 元/月",w:0});
  if(st.warns.indexOf("unreg")>=0)tags.push({t:"⚠️ 契約尚未備案，需先辦理登記",w:1});
  if(st.warns.indexOf("special")>=0)tags.push({t:"⚠️ 已有自有住宅，需附就業 / 就學證明",w:1});
  var th=tags.map(function(t){return'<span class="qz-tag'+(t.w?' w':'')+'">'+(t.t)+"</span>";}).join("");
  BD.innerHTML='<div style="text-align:center">'
    +'<div class="qz-badge">✅ 初步評估：可能符合申請資格</div>'
    +'<div style="font-size:.82rem;color:var(--text-soft);margin-bottom:4px;">預估每月可補貼</div>'
    +'<div class="qz-amount">'+sub.toLocaleString()+'<span style="font-size:1rem;font-weight:400;color:var(--text-soft);"> 元 / 月</span></div>'
    +'<div style="font-size:.75rem;color:var(--text-soft);margin:6px 0 2px;">(以政府實際核定為準，數字僅供參考)</div>'
    +'<div class="qz-tags">'+th+"</div>"
    +'<div class="qz-cta">'
      +'<h4>禾大屋管幫你確認並協助辦理</h4>'
      +'<p>禾大屋管協助大台北地區超過 40 間房屋的出租管理，熟悉公益出租人認定流程，可幫你確認房客資格、整理申請文件，讓你輕鬆享有三大稅賦優惠。</p>'
      +'<div class="qz-cta-btns">'
        +'<a href="https://line.me/R/ti/p/@hodaproperty" target="_blank" class="qz-ca qz-ca-line">LINE 免費諮詢禾大屋管</a>'
        +'<a href="https://has.nlma.gov.tw/house300e/" target="_blank" rel="noopener" class="qz-ca qz-ca-gov">前往政府官方申請 ›</a>'
      +"</div>"
    +"</div>"
    +"</div>";
  NV.innerHTML='<button class="qz-restart" onclick="history.go(0)">重新填寫</button>';
}
render();
})();
</script>
"""

with open(f'{BASE}/tenant-subsidy.html', encoding='utf-8') as f:
    src = f.read()

if 'id="quiz"' in src:
    print('Quiz already present — skipping insert')
else:
    src = src.replace('<!-- FOOTER -->', QUIZ_HTML + '\n<!-- FOOTER -->', 1)
    with open(f'{BASE}/tenant-subsidy.html', 'w', encoding='utf-8') as f:
        f.write(src)
    ok = 'id="quiz"' in src and 'qz-body' in src and 'has.nlma.gov.tw' in src
    print('Done. All checks pass:', ok)
