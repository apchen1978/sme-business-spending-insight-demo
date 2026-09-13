const $ = (id) => document.getElementById(id);
const money = (n) => Number.isFinite(n) && n > 0 ? new Intl.NumberFormat('en-US', { style:'currency', currency:'TWD', maximumFractionDigits:0 }).format(n).replace('TWD','TWD ') : '金額尚未填寫';
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const state = { mode:'considering' };

const copy = {
  considering: { label:'考慮中 · BEFORE SPENDING', title:'在花錢前，先看完整一點。', action:'這筆支出預期要換來什麼？' },
  spent: { label:'已發生 · AFTER SPENDING', title:'花錢後，先把影響看懂。', action:'這筆支出實際留下了什麼？' }
};

function chooseMode(mode) {
  state.mode = mode;
  document.querySelectorAll('.mode-card').forEach(card => card.classList.toggle('selected', card.dataset.mode === mode));
  $('modeLabel').textContent = copy[mode].label;
  $('input-title').textContent = copy[mode].title;
  $('workspace').classList.remove('hidden');
  $('workspace').scrollIntoView({ behavior:'smooth', block:'start' });
  $('description').focus();
}

function buildInsight(description, amount, focus) {
  const text = description.toLowerCase();
  const isAsset = /設備|電腦|筆電|裝修|整修|machine|computer|renovation/.test(text);
  const isMeal = /餐敘|交際|招待|meal|entertainment/.test(text);
  const isSoftware = /軟體|訂閱|ai|雲端|software|subscription/.test(text);
  const amountText = money(amount);
  const happened = state.mode === 'considering' ? `公司正在考慮一筆 ${amountText} 的支出：「${description}」。` : `公司已經發生一筆 ${amountText} 的支出：「${description}」。`;
  let why = '這筆錢除了價格，還值得一起看它要解決什麼問題、何時產生效益，以及公司要承擔哪些後續成本。';
  let think = ['這筆支出要解決的具體問題是什麼？','預期帶來的效益，要用什麼事實或結果觀察？','付款後還會不會有維護、續約、延遲或額外人力？'];
  let ask = '以這筆支出的用途、時間與文件，您建議我們還應該確認哪些事項？';
  if (isAsset) { why = '錢可能今天就付出去，但如果買到的是可以使用一段時間的設備或工程，它對公司費用與未來期間的影響可能不會一次發生。'; think = [`這筆金額到底買到了哪些具體內容？`,'哪些部分是長期使用的改善？什麼時候真正完成並開始使用？','如果是承租場地，合約、工程內容與後續處理要怎麼說清楚？']; ask = '這些內容哪些可能是當期支出，哪些需要另外處理？開始認列的時間與最小文件包是什麼？'; }
  if (isMeal) { why = '餐敘或招待的發票只能說明有一筆支出；它不會自動說明誰參與、為何與公司業務有關，以及後續需要確認什麼。'; think = ['受邀對象是誰？這次交流要推進哪一件業務？','日期、地點與參與目的是否留下紀錄？','除了發票，還有沒有能讓第三方看懂的業務脈絡？']; ask = '這次餐敘的對象、商業目的、日期／地點與佐證，還需要補什麼才能請您判斷？'; }
  if (isSoftware) { why = '訂閱費常常不是一次性購買；使用者、用途、續約、付款方式與是否真的被團隊使用，都會影響公司對這筆支出的理解。'; think = ['誰在使用？它替公司省下什麼時間或解決什麼問題？','如果明年續約，總成本與替代方案是什麼？','公司的帳號、付款與使用紀錄是否能對得上？']; }
  if (focus === 'cash') think.unshift('付款時間會不會壓縮公司接下來幾個月的流動性？');
  if (focus === 'benefit') think.unshift('效益要在什麼時間、用什麼指標看得到？');
  if (focus === 'timing') think.unshift('現在決定與延後決定，對現金與營運各有什麼不同？');
  if (focus === 'evidence') think.unshift('如果三個月後回頭看，哪些資料能證明這筆錢的用途與結果？');
  const keep = isMeal ? ['發票／付款紀錄','受邀對象與參與者','商業目的與會議紀錄','日期、地點與已知業務脈絡'] : ['報價／合約與付款紀錄','支出用途與預期效益','完成、啟用或使用時間','可能的後續成本與承諾'];
  const professional = `<div class="professional-grid"><div><span>模式</span><strong>${escapeHtml(copy[state.mode].label)}</strong></div><div><span>金額</span><strong>${escapeHtml(amountText)}</strong></div><div><span>狀態</span><strong>NEEDS PROFESSIONAL REVIEW</strong></div></div><p>這個 prototype 不判定可扣除、會計分類、節稅金額或優惠資格；它只把 Owner Insight 轉成可交接的專業問題。</p>`;
  return { happened, why, cash: state.mode === 'considering' ? `這筆錢未來可能會在某個時間點付出去；付款時間與它對公司費用或損益的影響，不一定相同。` : `這筆錢已經付出去；但現金流出與它對公司費用或損益的影響，不一定在同一時間發生。`, think, keep, ask, professional };
}

function renderInsight() {
  const description = $('description').value.trim();
  const amount = Number($('amount').value);
  const insight = buildInsight(description, amount, $('focus').value);
  $('result-title').textContent = copy[state.mode].action;
  $('insightBody').innerHTML = `<div class="insight-hero"><span class="insight-chip">${escapeHtml(copy[state.mode].label)}</span><h3>${escapeHtml(description)}</h3><strong>${escapeHtml(money(amount))}</strong></div><div class="insight-sections"><article><span>發生了什麼？</span><p>${escapeHtml(insight.happened)}</p></article><article><span>為什麼值得注意？</span><p>${escapeHtml(insight.why)}</p></article><article class="cash-card"><span>現金與費用可能不是同一件事嗎？</span><p>${escapeHtml(insight.cash)}</p></article><article><span>老闆多想一步</span><ul>${insight.think.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul></article><article><span>值得留下什麼？</span><ul>${insight.keep.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul></article><article class="ask-card"><span>值得問 CPA／專業人士什麼？</span><p>${escapeHtml(insight.ask)}</p></article></div>`;
  $('professionalBody').innerHTML = insight.professional;
  $('result').classList.remove('hidden');
  $('result').scrollIntoView({ behavior:'smooth', block:'start' });
}

document.querySelectorAll('.mode-card').forEach(card => card.addEventListener('click', () => chooseMode(card.dataset.mode)));
$('spendingForm').addEventListener('submit', event => { event.preventDefault(); const description = $('description').value.trim(); if (!description) { $('description').setCustomValidity('請先描述這筆支出。'); $('description').reportValidity(); return; } $('description').setCustomValidity(''); renderInsight(); });
$('description').addEventListener('input', () => $('description').setCustomValidity(''));
$('loadSample').addEventListener('click', () => { chooseMode('considering'); $('description').value='公司準備花 NT$600,000 做辦公室整修'; $('amount').value='600000'; $('focus').value='cash'; renderInsight(); });
$('tryAgain').addEventListener('click', () => { $('result').classList.add('hidden'); $('description').focus(); $('workspace').scrollIntoView({behavior:'smooth',block:'start'}); });
