const $ = (id) => document.getElementById(id);
const state = { mode: "considering", last: null };

const esc = (value) => String(value).replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));

const money = (n) => Number.isFinite(n) && n > 0
  ? new Intl.NumberFormat("en-US", { style: "currency", currency: "TWD", maximumFractionDigits: 0 }).format(n).replace("TWD", "TWD ")
  : "金額尚未填寫";

const copy = {
  considering: { label: "考慮中 · BEFORE SPENDING", title: "在花錢前，先看完整一點。", action: "這筆支出預期要換來什麼？" },
  spent: { label: "已發生 · AFTER SPENDING", title: "花錢後，先把影響看懂。", action: "這筆支出實際留下了什麼？" }
};

/* 每個面向只給「商業問題」：不判定可扣除、不給門檻值、不做稅務結論。
   一筆支出可同時命中多個面向（例如「研發用電腦設備」＝設備＋研發）；
   命中的面向會全部呈現，不互相覆蓋。 */
const LENSES = [
  {
    id: "premises", name: "場地與工程",
    test: /裝修|裝潢|整修|隔間|水電|空調|消防|工程|油漆|地板|天花板|門窗|櫃體|招牌|租賃改良|店面|廠房/,
    why: "錢今天付出去，但如果這筆工程讓場地能用得更久、或讓它變成可以營業的狀態，它對公司費用的影響通常不會只落在付款那一天。承租場地還要多想一層：做了卻帶不走的東西，之後怎麼算。",
    think: [
      "這筆工程買到的具體內容是什麼？哪些只是「修回原狀」，哪些是「變得更好」？",
      "什麼時候真正完工、可以開始使用？",
      "場地是自有還是承租？合約對改裝、退租與回復原狀怎麼寫？"
    ],
    ask: "這次工程裡，哪些屬於維持原狀、哪些屬於讓場地或資產變更好？開始使用的時點與最小文件包是什麼？",
    keep: ["報價／合約與付款紀錄", "工程項目明細與完工日", "場地租約與改裝同意", "驗收或啟用紀錄"]
  },
  {
    id: "equipment", name: "設備與機具",
    test: /設備|機器|機具|機台|儀器|電腦|筆電|伺服器|主機|網路|機房|硬體|車輛|貨車|堆高機|模具|治具|夾具|刀模|攝影|音響|傢具|家具/,
    why: "如果買到的是可以用一段時間的東西，它對費用的影響通常不會只落在付款那一天；後面還可能有安裝、耗材、保養與升級。反過來說，如果只是消耗品，也不該被當成長期資產來想。",
    think: [
      "這筆錢買到的是消耗品，還是可以用很久的東西？",
      "什麼時候到貨、安裝、真正開始使用？",
      "後面還有安裝、耗材、保養、升級或搬遷的成本嗎？"
    ],
    ask: "這項設備的取得內容、到貨日與啟用日要怎麼認定？後續成本是否要一起看？",
    keep: ["採購單／合約與付款紀錄", "到貨、驗收與啟用日", "保固與後續維護條件", "資產清冊或使用單位"]
  },
  {
    id: "software", name: "軟體與訂閱",
    test: /軟體|訂閱|雲端|授權|系統|平臺|平台|saas|api|帳號|資安|備份/,
    why: "訂閱通常不是一次買斷。使用者、用途、續約與是否真的被團隊用上，都會影響公司怎麼理解這筆錢；自動續約也常讓支出在沒人注意的情況下延續。",
    think: [
      "誰在使用？它替公司省下什麼時間、或解決什麼問題？",
      "如果明年續約，總成本與替代方案是什麼？",
      "帳號、付款與使用紀錄對得上嗎？授權數量與實際人數一致嗎？"
    ],
    ask: "這筆是使用權還是買斷？期間怎麼切？最小文件包是什麼？",
    keep: ["訂閱合約與付款紀錄", "使用者與授權數量", "續約條件與自動續約設定", "使用紀錄"]
  },
  {
    id: "repair", name: "維修與保養",
    test: /維修|修繕|保養|維護|校正|檢修|更換|零件|耗材/,
    why: "「修回原狀」和「變得更好」在商業上是兩件事：一個是維持原本的運作能力，一個可能讓東西更耐用或更有價值。金額可能差不多，但後續要留下的文件與看待方式不同。",
    think: [
      "這次是把壞的恢復原狀，還是順便升級了？",
      "報價單有沒有把「修復」與「改善」分開列？",
      "這是常態性支出，還是第一次發生的異常？"
    ],
    ask: "這次是修復還是改良？兩者在文件上要怎麼分開呈現？",
    keep: ["維修報價與工單", "修復／更換項目明細", "前後照片或驗收紀錄", "保養週期紀錄"]
  },
  {
    id: "meal", name: "餐敘與招待",
    test: /餐敘|交際|招待|應酬|送禮|禮品|聚餐|尾牙|伴手禮/,
    why: "餐敘或招待的發票只能說明有一筆支出；它不會自動說明誰參與、為什麼和公司業務有關，以及後續需要確認什麼。",
    think: [
      "受邀對象是誰？這次交流要推進哪一件業務？",
      "日期、地點與參與目的是否留下紀錄？",
      "除了發票，還有沒有能讓第三方看懂業務脈絡的資料？"
    ],
    ask: "這次餐敘的對象、商業目的、日期地點與佐證，還需要補什麼才能判斷？",
    keep: ["發票與付款紀錄", "受邀對象與參與者", "商業目的與會議紀錄", "日期、地點與已知業務脈絡"]
  },
  {
    id: "marketing", name: "行銷與推廣",
    test: /廣告|行銷|展會|參展|展覽|推廣|品牌|投放|曝光|代言|官網|網站|型錄|贈品/,
    why: "行銷支出的錢換到的通常是「未來的機會」，不是當下看得到的東西。所以要能被追蹤，才看得出它值不值得再花一次。",
    think: [
      "這次要換到什麼？名單、詢問、還是曝光？",
      "用什麼指標判斷有效？多久看一次？",
      "這是一次性活動，還是會延續的承諾（攤位、代言、年度合約）？"
    ],
    ask: "行銷支出的期間與預期效益怎麼對應？要留哪些成效資料？",
    keep: ["合約／訂單與付款紀錄", "投放或參展期間", "成效資料（名單、詢問、曝光）", "後續承諾與續約條件"]
  },
  {
    id: "logistics", name: "運費與報關",
    test: /運費|物流|報關|倉儲|倉租|貨運|海運|空運|快遞|拖車|提單|通關|報驗/,
    why: "運費看起來像雜支，但它常常和交期、責任歸屬與對客戶的承諾綁在一起。分清楚「誰該付、付哪一段」，往往比金額本身更重要。",
    think: [
      "這一段運費是誰的責任？合約怎麼寫？",
      "隨貨走的文件（提單、報關、艙單）齊了嗎？",
      "有沒有異常費用（延滯、倉租、改單）？為什麼發生？"
    ],
    ask: "這筆運費的責任歸屬與對應文件是什麼？異常費用要怎麼佐證？",
    keep: ["運費報價與請款單", "提單／報關／艙單", "交期與責任條件", "異常費用原因紀錄"]
  },
  {
    id: "professional", name: "專業服務",
    test: /顧問|律師|會計|稅務|記帳|專利|商標|鑑價|公證|認證|檢驗|委任|代辦/,
    why: "專業服務費買到的通常是一個判斷或一段保障，沒有實體成果。所以「做了什麼、成果長什麼樣、期間多長」要比一般支出寫得更清楚。",
    think: [
      "這筆服務要解決什麼問題？成果會長什麼樣？",
      "是單次顧問，還是會延續的委任關係？",
      "這筆費用會不會變成某項資產的一部分（例如申請中的權利）？"
    ],
    ask: "這筆專業服務費的性質、期間與成果文件是什麼？有沒有需要另外處理的部分？",
    keep: ["委任合約或委託書", "服務範圍與期間", "成果文件（意見書、申請案號）", "付款與請款紀錄"]
  },
  {
    id: "training", name: "訓練與課程",
    test: /教育訓練|培訓|課程|研習|內訓|外訓|講座|工作坊/,
    why: "訓練買到的是人的能力，不會留在帳上；但也最容易被問「這和公司業務的關係是什麼」。",
    think: [
      "誰去上？和他們的職務、以及公司目前的目標有什麼關係？",
      "上完之後要用在哪裡？",
      "是單次課程，還是會延續的計畫？"
    ],
    ask: "這筆訓練的對象、內容與業務關聯要怎麼呈現？",
    keep: ["課程或訓練合約", "參訓名單與職務", "課程內容與期間", "出席或結訓紀錄"]
  },
  {
    id: "travel", name: "差旅",
    test: /差旅|出差|機票|住宿|旅費|考察|參訪|交通費/,
    why: "差旅的錢分散在很多小單據，最常見的風險不是金額，而是「說不出這趟為公司做了什麼」。",
    think: [
      "這趟的商業目的是什麼？見了誰？",
      "行程、對象與費用對得上嗎？",
      "有沒有個人或家庭性質的支出混在裡面？"
    ],
    ask: "這趟差旅的目的、對象與單據要怎麼對應？",
    keep: ["出差申請或行程表", "機票／住宿／交通單據", "拜訪對象與紀錄", "費用明細與分攤方式"]
  },
  {
    id: "research", name: "研發與試驗",
    test: /研發|研究|試驗|試作|打樣|開發|測試|檢測/,
    why: "研發相關支出常被期待有優惠，但「有在做研發」和「符合資格」是兩件事。先留下過程紀錄，才有辦法往下判斷。",
    think: [
      "這次要解決什麼技術或產品問題？",
      "做了哪些嘗試？失敗了什麼、後來怎麼修正？",
      "有沒有專案、工時或試驗紀錄可以對應？"
    ],
    ask: "這筆研發相關支出的過程紀錄與專案歸屬是什麼？資格條件要怎麼確認？",
    keep: ["專案計畫與目標", "試驗／打樣／檢測紀錄", "投入人力與工時", "失敗與修正的過程紀錄"]
  },
  {
    id: "rent", name: "租金與場地費",
    test: /租金|房租|辦公室租|店面租|廠房租|場地費|停車位租|倉庫租|倉儲租|押金|管理費/,
    why: "租金是「固定承諾」，不只是這個月的支出。合約期間、押金與後續調整都要一起看。",
    think: [
      "合約期間多長？中途能不能退？",
      "押金怎麼處理、什麼條件下會退？",
      "租金含水電、管理費或其他費用嗎？"
    ],
    ask: "這筆租金的合約期間、押金與涵蓋範圍是什麼？",
    keep: ["租約與期間", "押金與退還條件", "費用涵蓋範圍", "繳費紀錄"]
  },
  {
    id: "insurance", name: "保險",
    test: /保險|保費|火險|產品責任|運輸保險|意外險|投保/,
    why: "保費是一次付出去、保障卻跨期間。所以要能對得上「保什麼、保多久、保誰」。",
    think: [
      "保的是什麼風險？保障期間多長？",
      "是一次繳清還是分期？",
      "保額與公司實際的暴露對得上嗎？"
    ],
    ask: "這筆保費的險種、保障期間與被保險對象是什麼？要怎麼分期對應？",
    keep: ["保單與承保範圍", "保障期間與保費分攤", "被保險人與標的", "繳費紀錄"]
  },
  {
    id: "staff", name: "人事與獎金",
    test: /薪資|薪水|獎金|年終|增聘|人力|招募|加班|勞健保|退休金|資遣|員工福利/,
    why: "人事支出是持續的承諾，不是一次性的。招募、獎金或福利常常還牽涉後續義務。",
    think: [
      "這筆是固定薪資、變動獎金，還是一次性給付？",
      "有沒有相對應的義務（合約、競業、離職條件）？",
      "對公司現金的影響是每個月還是一次？"
    ],
    ask: "這筆人事支出的性質與期間是什麼？後續義務要怎麼記載？",
    keep: ["聘僱合約或獎金辦法", "計算依據與發放紀錄", "扣繳與投保紀錄", "期間與後續承諾"]
  }
];

const GENERIC = {
  why: "這筆錢除了價格，還值得一起看它要解決什麼問題、何時產生效益，以及公司要承擔哪些後續成本。",
  think: [
    "這筆支出要解決的具體問題是什麼？",
    "預期帶來的效益，要用什麼事實或結果觀察？",
    "付款後還會不會有維護、續約、延遲或額外人力？"
  ],
  ask: "以這筆支出的用途、時間與文件，您建議我們還應該確認哪些事項？",
  keep: ["報價／合約與付款紀錄", "支出用途與預期效益", "完成、啟用或使用時間", "可能的後續成本與承諾"]
};

const uniq = (list) => [...new Set(list)];

function matchLenses(text) {
  return LENSES.filter(lens => lens.test.test(text));
}

/* 金額留白時，嘗試從描述推得，並明確標示來源（不假裝是使用者填的）。 */
function amountFromDescription(description) {
  const wan = description.match(/(\d+(?:\.\d+)?)\s*萬/);
  if (wan) return Math.round(parseFloat(wan[1]) * 10000);
  const plain = description.replace(/[,\s]/g, "").match(/(?:nt\$|\$)?(\d{5,})/i);
  return plain ? Number(plain[1]) : null;
}

function buildInsight(description, amount, amountSource, focus) {
  const lenses = matchLenses(description.toLowerCase());
  const amountText = money(amount);
  const happened = state.mode === "considering"
    ? `公司正在考慮一筆 ${amountText} 的支出：「${description}」。`
    : `公司已經發生一筆 ${amountText} 的支出：「${description}」。`;

  let why, think, ask, keep;
  if (lenses.length) {
    why = lenses.map(l => l.why).join(" ");
    think = uniq(lenses.flatMap(l => l.think));
    ask = uniq(lenses.map(l => l.ask)).join(" ");
    keep = uniq(lenses.flatMap(l => l.keep));
  } else {
    why = GENERIC.why;
    think = [...GENERIC.think];
    ask = GENERIC.ask;
    keep = [...GENERIC.keep];
  }

  if (focus === "cash") think.unshift("付款時間會不會壓縮公司接下來幾個月的流動性？");
  if (focus === "benefit") think.unshift("效益要在什麼時間、用什麼指標看得到？");
  if (focus === "timing") think.unshift("現在決定與延後決定，對現金與營運各有什麼不同？");
  if (focus === "evidence") think.unshift("如果三個月後回頭看，哪些資料能證明這筆錢的用途與結果？");

  const cash = state.mode === "considering"
    ? "這筆錢未來可能會在某個時間點付出去；付款時間與它對公司費用或損益的影響，不一定相同。"
    : "這筆錢已經付出去；但現金流出與它對公司費用或損益的影響，不一定在同一時間發生。";

  return { lenses, happened, why, cash, think, keep, ask, amountText, amountSource };
}

function renderInsight() {
  const description = $("description").value.trim();
  const typed = Number($("amount").value);
  const typedValid = Number.isFinite(typed) && typed > 0;
  const extracted = typedValid ? null : amountFromDescription(description);
  const amount = typedValid ? typed : extracted;
  const amountSource = typedValid ? "typed" : (extracted ? "derived" : "missing");

  const insight = buildInsight(description, amount, amountSource, $("focus").value);
  state.last = insight;

  const lensCard = insight.lenses.length
    ? `<article class="lens-card"><span>這筆支出看到的面向</span><div class="lens-chips">${insight.lenses.map(l => `<b>${esc(l.name)}</b>`).join("")}</div></article>`
    : `<article class="lens-card"><span>這筆支出看到的面向</span><div class="lens-chips"><b>一般支出</b></div><p class="lens-note">沒有命中特定面向時，仍提供通用的檢查角度。</p></article>`;

  const amountNote = amountSource === "derived"
    ? `<p class="amount-note">金額由描述推得：${esc(money(amount))}。若數字不同，請在上方金額欄直接填寫。</p>`
    : (amountSource === "missing" ? `<p class="amount-note">尚未填寫金額；可在上方金額欄補上。</p>` : "");

  $("result-title").textContent = copy[state.mode].action;
  $("insightBody").innerHTML = `<div class="insight-hero"><span class="insight-chip">${esc(copy[state.mode].label)}</span><h3>${esc(description)}</h3><strong>${esc(insight.amountText)}</strong>${amountNote}</div><div class="insight-sections">${lensCard}<article><span>發生了什麼？</span><p>${esc(insight.happened)}</p></article><article><span>為什麼值得注意？</span><p>${esc(insight.why)}</p></article><article class="cash-card"><span>現金與費用可能不是同一件事嗎？</span><p>${esc(insight.cash)}</p></article><article><span>老闆多想一步</span><ul>${insight.think.map(x => `<li>${esc(x)}</li>`).join("")}</ul></article><article><span>值得留下什麼？</span><ul>${insight.keep.map(x => `<li>${esc(x)}</li>`).join("")}</ul></article><article class="ask-card"><span>值得問 CPA／專業人士什麼？</span><p>${esc(insight.ask)}</p></article></div>`;

  $("professionalBody").innerHTML = `<div class="professional-grid"><div><span>模式</span><strong>${esc(copy[state.mode].label)}</strong></div><div><span>金額</span><strong>${esc(insight.amountText)}${amountSource === "derived" ? "（由描述推得）" : ""}</strong></div><div><span>狀態</span><strong>NEEDS PROFESSIONAL REVIEW</strong></div></div><div class="professional-block"><span>要帶去的事實</span><p>${esc(description)}</p></div><div class="professional-block"><span>建議一併帶去的文件／紀錄</span><ul>${insight.keep.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div><div class="professional-block"><span>要請對方判斷的問題</span><p>${esc(insight.ask)}</p></div><div class="professional-block"><span>本工具刻意沒有做的事</span><ul><li>沒有判定可扣除、稅務分類或優惠資格</li><li>沒有計算或保證節稅金額</li><li>沒有決定折舊、攤銷或認列時點</li><li>沒有產生任何申報數字</li></ul></div><p class="professional-note">這個 prototype 只把 Owner Insight 轉成可交接的專業問題；<code>VERIFIED RULE ≠ CASE ELIGIBILITY VERIFIED</code>。</p>`;

  $("result").classList.remove("hidden");
  $("copyStatus").textContent = "";
  $("result").scrollIntoView({ behavior: "smooth", block: "start" });
}

function summaryText() {
  const insight = state.last;
  if (!insight) return "";
  return [
    "【Business Spending Insight · 會前檢視摘要】",
    `模式：${copy[state.mode].label}`,
    `支出：${$("description").value.trim()}`,
    `金額：${insight.amountText}${insight.amountSource === "derived" ? "（由描述推得）" : ""}`,
    `面向：${insight.lenses.length ? insight.lenses.map(l => l.name).join("、") : "一般支出"}`,
    "",
    "為什麼值得注意：",
    insight.why,
    "",
    "多想一步：",
    ...insight.think.map(x => `・${x}`),
    "",
    "值得留下：",
    ...insight.keep.map(x => `・${x}`),
    "",
    "要問專業人士：",
    insight.ask,
    "",
    "（本摘要為會前準備用途，未判定可扣除、稅務分類、優惠資格或節稅金額。）"
  ].join("\n");
}

function fallbackCopy(text) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch (error) { ok = false; }
  document.body.removeChild(area);
  return ok;
}

function chooseMode(mode) {
  state.mode = mode;
  document.querySelectorAll(".mode-card").forEach(card => card.classList.toggle("selected", card.dataset.mode === mode));
  $("modeLabel").textContent = copy[mode].label;
  $("input-title").textContent = copy[mode].title;
  $("workspace").classList.remove("hidden");
  $("workspace").scrollIntoView({ behavior: "smooth", block: "start" });
  $("description").focus();
}

document.querySelectorAll(".mode-card").forEach(card => card.addEventListener("click", () => chooseMode(card.dataset.mode)));

$("spendingForm").addEventListener("submit", event => {
  event.preventDefault();
  const description = $("description").value.trim();
  if (!description) {
    $("description").setCustomValidity("請先描述這筆支出。");
    $("description").reportValidity();
    return;
  }
  $("description").setCustomValidity("");
  renderInsight();
});

/* 使用者重新輸入時即解除先前的驗證錯誤，避免表單卡死。 */
$("description").addEventListener("input", () => $("description").setCustomValidity(""));

$("loadSample").addEventListener("click", () => {
  chooseMode("considering");
  $("description").value = "公司準備花 NT$600,000 做辦公室整修";
  $("amount").value = "600000";
  $("focus").value = "cash";
  renderInsight();
});

$("copySummary").addEventListener("click", async () => {
  const text = summaryText();
  if (!text) { $("copyStatus").textContent = "請先產生 Owner Insight。"; return; }
  let ok = false;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try { await navigator.clipboard.writeText(text); ok = true; } catch (error) { ok = false; }
  }
  if (!ok) ok = fallbackCopy(text);
  $("copyStatus").textContent = ok ? "已複製摘要，可直接貼給 CPA。" : "複製未成功，請手動選取文字。";
});

$("tryAgain").addEventListener("click", () => {
  $("result").classList.add("hidden");
  $("copyStatus").textContent = "";
  $("description").focus();
  $("workspace").scrollIntoView({ behavior: "smooth", block: "start" });
});
