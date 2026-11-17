/* エイスケ サービスサイト 実装v1
 * 画面遷移（ハッシュルーター）・メガメニュー・タブ・絞り込み・試算・フォーム・確認用ラベル
 * 外部通信は一切行わない（fetch/XHR/WebSocket/フォーム送信なし）。
 * 公開時は st-toggle（確認用ラベル）を削除する。
 */
'use strict';

/* ===== 機能詳細データ（仕様書の記載範囲のみ） ===== */
const FEATURES = {
  ai: {
    name: 'AI資料作成',
    title: '短い依頼から、構成を確かめて資料を一括生成',
    lead: 'テンプレートを選び「誰に、何を伝えたいか」を入力。AIの構成案を確認・修正・承認してから、見出し・本文・配置・発表者ノートをまとめて作ります。',
    img: 'editor',
    steps: [
      ['テンプレートを選ぶ', '標準または保存済みのテンプレート'],
      ['伝えたいことを入力', '例：製造業向けにAI導入の提案を10分程度で'],
      ['構成案を承認', 'AIの案を確認・修正してから進める'],
      ['プレビューして適用', '元の資料は残り、履歴で戻せる']
    ],
    scope: [
      ['入力', '短い依頼文。必要に応じて企業情報・聴衆・発表時間・枚数の目安', 'wip'],
      ['生成されるもの', '見出し・本文・配置・発表者ノート', 'wip'],
      ['事実の扱い', '料金・実績・効果の数値・担当・期限は創作せず、要確認として残す', 'impl'],
      ['過去資料の扱い', 'テンプレートに残る過去の顧客名や金額を新しい提案へ自動で流用しない', 'impl'],
      ['AIが使えないとき', '入力を残したまま、テンプレートからの手動作成を続けられる', 'impl']
    ],
    combo: [
      ['企業リサーチ', '選んだ公開情報を出典付きスライドとして追加', 'company'],
      ['発表者画面', '生成したノートをそのまま手元に表示', 'present'],
      ['編集・書き出し', '生成後に通常の編集で仕上げてPowerPointへ', 'edit']
    ]
  },
  edit: {
    name: '編集・書き出し',
    title: '細かく直して、PowerPointとPDFで渡す',
    lead: '16:9の編集画面で文字・図形・画像・表・棒グラフを編集。変更は自動保存し、PowerPoint形式とPDFに書き出せます。',
    img: 'editor',
    steps: [
      ['スライドを編集', '文字・図形・画像・表・棒グラフ'],
      ['配置を整える', '複数選択・整列・等間隔・重なり順'],
      ['テーマを適用', 'ネイビー・フォレスト・サンドを一度に'],
      ['書き出す', 'PowerPoint形式またはPDF']
    ],
    scope: [
      ['編集できる要素', '文字・四角・楕円・線・画像・表（2〜8行×2〜6列）・横棒グラフ', 'impl'],
      ['操作', '複数選択、グループ化、整列、等比の拡大縮小、元に戻す（50操作）', 'impl'],
      ['保存', '約0.5秒後に自動保存。失敗時は内容を残して再試行', 'impl'],
      ['PowerPoint', '文字・図形・画像は編集できる形式。表・グラフは図形として出力', 'wip'],
      ['PDF', '見た目どおりの画像形式。ノートと選択枠は含めない', 'impl']
    ],
    combo: [
      ['AI資料作成', '一括生成した資料を細部まで手直し', 'ai'],
      ['発表者画面', '書き出さずにそのまま発表', 'present'],
      ['議事録', '会議に使った資料をひも付けて残す', 'minutes']
    ]
  },
  present: {
    name: '発表者画面とAIカンペ',
    title: '聴衆にはスライドだけ、手元にはメモと回答案',
    lead: '現在と次のスライド、タイマー、ノートを1画面に表示。聴衆用の画面は別ウィンドウで開き、スライドの表示情報だけを送ります。',
    img: 'presenter',
    steps: [
      ['聴衆画面を開く', '別ウィンドウで聴衆用の画面を表示'],
      ['発表を始める', 'ページ送りは聴衆画面と連動'],
      ['質問を選ぶ', '手入力または確定した発言から選ぶ'],
      ['回答案を見る', '資料とノートを根拠に手元だけへ表示']
    ],
    scope: [
      ['発表者画面', '現在・次のスライド、経過時間、ノート、会議メモ', 'impl'],
      ['聴衆画面', 'スライドの背景と要素だけを表示', 'impl'],
      ['AIカンペ', '選んだ質問に回答案。根拠のない数字や担当は表示しない', 'wip'],
      ['音声', '開始の操作と同意のあとだけ使用', 'wip'],
      ['AIが使えないとき', '通常の発表はそのまま続けられる', 'impl']
    ],
    combo: [
      ['議事録', '発表中の確定発言を、同意のうえ議事録の材料に', 'minutes'],
      ['企業リサーチ', '発表中に企業メモを手元で参照', 'company'],
      ['AI資料作成', '想定Q&Aとノートを事前に準備', 'ai']
    ]
  },
  minutes: {
    name: '議事録',
    title: '資料がない会議でも、議事録だけで使える',
    lead: '会議名・企業・本文・要約・決定・未決・ToDoを分けて保存。関連資料のひも付けと検索、TXT・Markdown・PDFでの書き出しができます。',
    img: 'minutes',
    steps: [
      ['会議を作成', '資料がなくても開始できる'],
      ['内容を記録', '手入力、または同意のうえ文字起こし'],
      ['AI案を確認', '要約・決定・未決・ToDoの案を確認して反映'],
      ['保存・書き出し', 'TXT・Markdown・PDF']
    ],
    scope: [
      ['記録する項目', '会議名・企業・本文・要約・決定・未決・ToDo', 'impl'],
      ['関連資料', '最大10件をひも付け', 'impl'],
      ['探す', 'キーワードで絞り込み、企業・日時・名称で並べ替え', 'impl'],
      ['AI案', '根拠となる発言を示し、担当・期限は推測しない', 'wip'],
      ['文字起こし', '1回の会議で最大2時間（予定）', 'plan']
    ],
    combo: [
      ['企業リサーチ', '商談で確認した内容を確認のうえ企業情報へ追記', 'company'],
      ['発表者画面', '発表中の発言を議事録の材料に', 'present'],
      ['AI資料作成', '決定事項を次の提案資料へ', 'ai']
    ]
  },
  company: {
    name: '企業リサーチ',
    title: '出典のある情報と仮説を分けて、提案に使う',
    lead: '訪問先の公開情報を出典名・URL・確認日と一緒に保存。仮説や商談で確認した情報と種類を分け、選んだ公開情報だけを資料に追加します。',
    img: 'company',
    steps: [
      ['企業を登録', '企業名と公式サイト'],
      ['情報を追加', '公開情報・仮説・商談で確認した情報'],
      ['資料に反映', '選んだ公開情報を出典付きスライドに'],
      ['商談後に追記', '確認した内容だけを追加']
    ],
    scope: [
      ['公開情報', '出典名・URL・確認日を必須で記録', 'impl'],
      ['仮説・商談情報', '種類を分けて保存。資料へ自動では入らない', 'impl'],
      ['資料への反映', '選んだ公開情報（最大8件）から新しい資料を作成', 'impl'],
      ['情報の集め方', '手動で登録（自動のWeb調査は今後）', 'impl'],
      ['保存先', '利用中のブラウザ（会社内の共有は確認中）', 'tbd']
    ],
    combo: [
      ['AI資料作成', '企業情報をもとに提案資料を生成', 'ai'],
      ['議事録', '商談の記録を企業にひも付け', 'minutes'],
      ['発表者画面', '発表中に企業メモを参照', 'present']
    ]
  }
};

const VIS = {
  editor: '<img src="assets/img/eisuke-editor.png" alt="資料の編集画面（架空のサンプル資料）" width="872" height="893" style="aspect-ratio:872/600;object-fit:cover;object-position:top">',
  presenter: () => document.querySelector('.pv').outerHTML,
  minutes: () => document.querySelector('.mv').outerHTML,
  company: () => document.querySelector('.cv').outerHTML
};

const SITE = 'エイスケ｜法人向け 資料作成・発表支援・議事録';
const TITLES = {
  top: SITE,
  integration: '連携・書き出し｜エイスケ',
  security: 'セキュリティと情報の扱い｜エイスケ',
  notfound: 'ページが見つかりません｜エイスケ'
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ===== ルーター ===== */
let firstRender = true;

function parseRoute() {
  const raw = location.hash || '#/';
  const [pathPart, anchor] = raw.slice(1).split('#');
  const parts = pathPart.split('/').filter(Boolean);
  if (parts.length === 0) return { page: 'top', parts, anchor };
  if (parts[0] === 'features') {
    const id = parts[1] || 'ai';
    if (!FEATURES[id]) return { page: 'notfound', parts, anchor };
    return { page: 'feature', feature: id, parts, anchor };
  }
  if (parts[0] === 'integration') return { page: 'integration', parts, anchor };
  if (parts[0] === 'security') return { page: 'security', parts, anchor };
  return { page: 'notfound', parts, anchor };
}

function render() {
  const route = parseRoute();
  $$('.page').forEach(p => p.classList.toggle('on', p.dataset.page === route.page));
  if (route.page === 'feature') fillFeature(route.feature);
  document.title = route.page === 'feature'
    ? `${FEATURES[route.feature].name}｜エイスケ`
    : (TITLES[route.page] || SITE);
  closeMega();

  requestAnimationFrame(() => {
    if (route.anchor) {
      const el = document.getElementById(route.anchor);
      if (el) { el.scrollIntoView(); return; }
    }
    if (route.page === 'integration' && route.parts[1]) {
      const detail = document.getElementById('int-detail');
      if (detail) { detail.scrollIntoView(); return; }
    }
    window.scrollTo(0, 0);
  });

  // 画面が変わったら読み上げ・キーボードの現在地を見出しへ移す（最初の表示では動かさない）
  if (!firstRender) {
    const h = document.querySelector('.page.on h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }
  firstRender = false;

  if (route.page === 'top') drawLines();
}

function fillFeature(id) {
  const f = FEATURES[id] || FEATURES.ai;
  $('#f-crumb').textContent = f.name;
  $('#f-title').textContent = f.title;
  $('#f-lead').textContent = f.lead;
  const v = VIS[f.img];
  $('#f-visual').innerHTML = typeof v === 'function' ? v() : v;
  $('#f-tabs').innerHTML = Object.entries(FEATURES).map(([k, x]) =>
    `<a class="btn btn-sm ${k === id ? 'btn-brand' : 'btn-ghost'}" href="#/features/${k}" ${k === id ? 'aria-current="page"' : ''}>${x.name}</a>`
  ).join('');
  $('#f-steps').innerHTML = f.steps.map((s, i) =>
    `<li class="card"><span class="s">手順${i + 1}</span><b class="h3" style="font-size:17px;display:block">${s[0]}</b><p>${s[1]}</p></li>`
  ).join('');
  document.querySelector('#f-scope tbody').innerHTML = f.scope.map(s =>
    `<tr data-st="${s[2]}"><td><b>${s[0]}</b></td><td>${s[1]}</td></tr>`
  ).join('');
  $('#f-combo').innerHTML = f.combo.map(c =>
    `<div class="card"><div class="plus">＋ ${c[0]}</div><p>${c[1]}</p><a class="btn btn-line btn-sm" href="#/features/${c[2]}">${c[0]}を見る →</a></div>`
  ).join('');
}

/* ===== ハブの接続線 ===== */
function drawLines() {
  const hub = document.getElementById('hub');
  if (!hub || window.innerWidth < 768) return;
  const svg = hub.querySelector('svg.lines');
  if (!svg) return;
  const hb = hub.getBoundingClientRect();
  const coreEl = hub.querySelector('.hub-core');
  if (!coreEl || hb.width === 0) return;
  const core = coreEl.getBoundingClientRect();
  const cx1 = core.left - hb.left, cx2 = core.right - hb.left, cy = core.top - hb.top + core.height / 2;
  let d = '';
  hub.querySelectorAll('.hub-col').forEach((col, ci) => {
    col.querySelectorAll('.hub-node').forEach(n => {
      const r = n.getBoundingClientRect();
      const y = r.top - hb.top + r.height / 2;
      if (ci === 0) {
        const x = r.right - hb.left;
        d += `<path d="M${x} ${y} C ${x + 20} ${y}, ${cx1 - 20} ${cy}, ${cx1} ${cy}" />`;
      } else {
        const x = r.left - hb.left;
        d += `<path d="M${cx2} ${cy} C ${cx2 + 20} ${cy}, ${x - 20} ${y}, ${x} ${y}" />`;
      }
    });
  });
  svg.setAttribute('viewBox', `0 0 ${hb.width} ${hb.height}`);
  svg.innerHTML = `<g fill="none" stroke="#93B4EC" stroke-width="2" stroke-dasharray="4 4">${d}</g>`;
}
window.addEventListener('resize', () => { if (parseRoute().page === 'top') drawLines(); });

/* ===== 共通：タブのキーボード操作（左右・上下・Home/End・端から循環） ===== */
function wireTabKeys(buttons, select) {
  buttons.forEach((b, i) => b.addEventListener('keydown', e => {
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    let n = i;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % buttons.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + buttons.length) % buttons.length;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = buttons.length - 1;
    select(buttons[n]);
  }));
}

/* ===== メガメニュー ===== */
const mega = document.getElementById('mega');
const megaTabs = $$('[data-mtab]');

function selectMTab(b, moveFocus = true) {
  if (!b) return;
  megaTabs.forEach(x => {
    const sel = x === b;
    x.setAttribute('aria-selected', String(sel));
    x.tabIndex = sel ? 0 : -1;
  });
  $$('[data-mpanel]').forEach(p => p.classList.toggle('on', p.dataset.mpanel === b.dataset.mtab));
  if (moveFocus) b.focus();
}

function setMTab(k) {
  selectMTab(megaTabs.find(b => b.dataset.mtab === k), false);
}

function closeMega() {
  if (!mega) return;
  mega.classList.remove('open');
  $$('[data-mega],#burger').forEach(b => b.setAttribute('aria-expanded', 'false'));
}

/* v4/D4: 閉じたあとの戻り先を「今見えている開閉ボタン」にする。
   幅の切替（1240pxの境）で開いたボタンが隠れた場合でも、見えない要素へフォーカスを落とさない。 */
let megaOpenedBy = null;

function isShown(el) {
  if (!el || !el.getClientRects) return false;
  if (el.getClientRects().length === 0) return false;
  const cs = getComputedStyle(el);
  return cs.visibility !== 'hidden' && cs.display !== 'none';
}

function visibleToggle(preferred) {
  const all = $$('[data-mega],#burger');
  return [preferred, document.getElementById('burger'), ...all].find(isShown) || null;
}

function closeMegaAndRestoreFocus() {
  const preferred = megaOpenedBy;
  closeMega();
  const t = visibleToggle(preferred);
  if (t) t.focus();
}

$$('[data-mega]').forEach(b => b.addEventListener('click', () => {
  const open = b.getAttribute('aria-expanded') === 'true';
  closeMega();
  if (!open) {
    setMTab(b.dataset.mega);
    mega.classList.add('open');
    b.setAttribute('aria-expanded', 'true');
    megaOpenedBy = b;
  }
}));

megaTabs.forEach(b => b.addEventListener('click', () => selectMTab(b, false)));
wireTabKeys(megaTabs, b => selectMTab(b, true));
selectMTab(megaTabs[0], false);

document.getElementById('burger').addEventListener('click', e => {
  const open = mega.classList.contains('open');
  const b = e.currentTarget;
  closeMega();
  if (!open) {
    mega.classList.add('open');
    b.setAttribute('aria-expanded', 'true');
    setMTab('feat');
    megaOpenedBy = b;
  }
});

/* v4/D4: 開いたまま幅が1239/1240pxの境をまたいだら、開いた状態を残さず閉じる。
   閉じたあとフォーカスが非表示のボタンに残る場合は、見えている開閉ボタンへ移す。 */
const mqCompact = window.matchMedia('(max-width:1239px)');
mqCompact.addEventListener('change', () => {
  if (!mega || !mega.classList.contains('open')) return;
  const opener = megaOpenedBy;
  const focused = document.activeElement;
  closeMega();
  requestAnimationFrame(() => {
    // 開いたボタンが隠れた場合・フォーカスが非表示になった場合・本文先頭（body）に残った場合に、
    // 見えている開閉ボタンへ移す。開いたまま幅が切り替わって戻り先を見失わないようにする。
    const lost = focused === opener || focused === document.body || focused === document.documentElement || !isShown(focused);
    if (lost) {
      const t = visibleToggle(opener);
      if (t) t.focus();
    }
  });
});

/* ===== トップのタブ ===== */
const topTabs = $$('[data-tab]');

function selectTopTab(b, moveFocus = true) {
  if (!b) return;
  topTabs.forEach(x => {
    const sel = x === b;
    x.setAttribute('aria-selected', String(sel));
    x.tabIndex = sel ? 0 : -1;
  });
  $$('.tab-panel').forEach(p => p.classList.toggle('on', p.id === b.dataset.tab));
  if (moveFocus) b.focus();
}

topTabs.forEach(b => b.addEventListener('click', () => selectTopTab(b, false)));
wireTabKeys(topTabs, b => selectTopTab(b, true));
selectTopTab(topTabs.find(b => b.getAttribute('aria-selected') === 'true') || topTabs[0], false);

/* ===== 連携の絞り込み ===== */
$$('.filter button').forEach(b => b.addEventListener('click', () => {
  $$('.filter button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  $$('#int-grid .int-card').forEach(c => {
    c.style.display = (b.dataset.f === 'all' || c.dataset.c === b.dataset.f) ? '' : 'none';
  });
}));

/* ===== 試算（クレジット換算は販売条件の確定まで未設定） ===== */
const RATES = null; // 換算は承認済み（C09）。見積機能が実装前のため、この試算は利用量だけを表示する

function fmtHM(minutes) {
  return `${Math.floor(minutes / 60)}時間${String(minutes % 60).padStart(2, '0')}分`;
}

function sim() {
  const docs = +$('#s-docs').value;
  const meet = +$('#s-meet').value;
  const min = +$('#s-min').value;
  $('#o-docs').textContent = `${docs}本`;
  $('#o-meet').textContent = `${meet}回`;
  $('#o-min').textContent = `${min}分`;

  const useAi = document.querySelector('.mods input[value=ai]').checked;
  const useCue = document.querySelector('.mods input[value=cue]').checked;
  const useMin = document.querySelector('.mods input[value=min]').checked;

  $('#r-docs').textContent = useAi ? `${docs}本` : '—';
  const capped = Math.min(min, 120);
  $('#r-time').textContent = useMin ? fmtHM(meet * capped) : '—';
  $('#r-cue').textContent = useCue ? '使用する' : '—';
  // v3: 2時間の注意は「議事録を使う」ときは常に表示する（時間の長さでは切り替えない）。
  // 未提供の2時間を前提にした試算であることは、60分でも120分でも同じく伝える必要がある。
  $('#r-warn').classList.toggle('on', useMin);
}

$$('.sim input').forEach(i => i.addEventListener('input', sim));
sim();

/* ===== フォーム（実送信なし） ===== */
const modal = document.getElementById('modal');
let lastFocus = null;

function focusables() {
  return $$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', modal)
    .filter(el => el.offsetParent !== null);
}

function openModal(kind) {
  lastFocus = document.activeElement;
  closeMega();
  const titles = {
    資料請求: 'サービス資料の請求',
    デモ相談: '画面デモ・導入のご相談',
    社内検討資料: '社内検討用情報のご相談',
    見積相談: '見積のご相談'
  };
  $('#m-title').textContent = titles[kind] || 'お問い合わせ';
  $('#f-kind').value = Object.prototype.hasOwnProperty.call(titles, kind) ? kind : '';
  $('#form').style.display = '';
  $('#done').style.display = 'none';
  clearErrors();
  modal.classList.add('open');
  document.body.classList.add('modal-open');
  $('#f-co').focus();
}

function closeModal() {
  if (!modal.classList.contains('open')) return;
  modal.classList.remove('open');
  document.body.classList.remove('modal-open');
  // v4/D4: 開いた元のボタンが見えない（メガメニュー内から開いた等）場合は、
  // 見えている開閉ボタンへ戻し、非表示要素にフォーカスを残さない。
  const back = (lastFocus && isShown(lastFocus)) ? lastFocus : visibleToggle(null);
  if (back && back.focus) back.focus();
}

function clearErrors() {
  $$('.f-row.bad', modal).forEach(r => r.classList.remove('bad'));
  $$('[aria-invalid]', modal).forEach(el => el.removeAttribute('aria-invalid'));
  const agree = $('#f-agree-row');
  if (agree) agree.classList.remove('bad');
  $('#f-agree-err').classList.remove('on');
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-open-form]');
  if (b) { e.preventDefault(); openModal(b.dataset.openForm); return; }
  // メガメニューの外側をクリックしたら閉じる
  if (mega && mega.classList.contains('open') && !mega.contains(e.target) && !e.target.closest('[data-mega],#burger')) {
    closeMega();
  }
});

$('#m-close').addEventListener('click', closeModal);
$('#m-close2').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

modal.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const list = focusables();
  if (list.length === 0) return;
  const first = list[0], last = list[list.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

window.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  // フォームが開いているときはフォームだけを閉じる（v3と同じ優先順位）
  if (modal.classList.contains('open')) { closeModal(); return; }
  if (mega && mega.classList.contains('open')) closeMegaAndRestoreFocus();
});

$('#form').addEventListener('submit', e => {
  e.preventDefault();
  let ok = true;
  let firstBad = null;

  const checks = [
    ['f-co', v => v.trim().length > 0],
    ['f-name', v => v.trim().length > 0],
    ['f-mail', v => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim())],
    ['f-kind', v => v.length > 0]
  ];

  checks.forEach(([id, fn]) => {
    const el = document.getElementById(id);
    const good = !!fn(el.value);
    el.closest('.f-row').classList.toggle('bad', !good);
    el.setAttribute('aria-invalid', String(!good));
    if (!good && !firstBad) firstBad = el;
    if (!good) ok = false;
  });

  const agree = $('#f-agree');
  const agreeOk = agree.checked;
  $('#f-agree-row').classList.toggle('bad', !agreeOk);
  $('#f-agree-err').classList.toggle('on', !agreeOk);

  if (!ok) { firstBad.focus(); return; }
  if (!agreeOk) { agree.focus(); return; }

  $('#form').style.display = 'none';
  $('#done').style.display = 'block';
  $('#m-close2').focus();
});

/* 入力し直したらエラー表示を消す */
$$('#form input, #form select').forEach(el => {
  el.addEventListener('input', () => {
    el.closest('.f-row')?.classList.remove('bad');
    el.removeAttribute('aria-invalid');
    if (el.id === 'f-agree') {
      $('#f-agree-row').classList.remove('bad');
      $('#f-agree-err').classList.remove('on');
    }
  });
});

/* ===== 画像が読めないときの代替表示（レイアウト崩れを防ぐ） ===== */
document.addEventListener('error', e => {
  const t = e.target;
  if (!t || t.tagName !== 'IMG' || t.dataset.fallback) return;
  t.dataset.fallback = '1';
  const box = document.createElement('div');
  box.className = 'img-fallback';
  box.textContent = t.alt ? `画像を表示できません（${t.alt}）` : '画像を表示できません';
  if (t.parentElement) t.replaceWith(box);
}, true);

/* ===== 確認用ラベル（公開前に削除） ===== */
const tg = document.getElementById('st-toggle');

function setSt(on) {
  document.body.classList.toggle('show-st', on);
  tg.setAttribute('aria-pressed', String(on));
  tg.textContent = `確認用ラベル：${on ? '表示' : '非表示'}`;
}

tg.addEventListener('click', () => setSt(!document.body.classList.contains('show-st')));
// 閲覧用モックではボタンを出さない。URLに ?st=1（または ?labels=1）を付けたときだけ表示する
if (/[?&](?:st|labels)=1/.test(location.search)) document.body.classList.add('st-ui');
if (/[?&]labels=1/.test(location.search)) setSt(true);

/* ===== 本文へ移動（#main をルーターの経路として扱わない） ===== */
const skipLink = document.querySelector('.skip-link');
if (skipLink) {
  skipLink.addEventListener('click', e => {
    e.preventDefault();
    const mainEl = document.getElementById('main');
    if (!mainEl) return;
    mainEl.focus({ preventScroll: true });
    mainEl.scrollIntoView();
  });
}

/* ===== 同一ハッシュのページ内リンク（v4-fix1 / QA-V4-NAV-01） =====
   料金など同じURL（例 #/#pricing）のリンクを再度押すと、ハッシュが変わらないため
   hashchange が出ず、メニューが閉じず移動もしない。ハッシュが変わる場合は従来どおり
   hashchange 側で1回だけ処理し、ここでは同じハッシュのときだけ通常経路を1回呼ぶ。 */
document.addEventListener('click', e => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest && e.target.closest('a[href]');
  if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
  const url = new URL(a.getAttribute('href'), location.href);
  if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
  if (!url.hash || url.hash !== location.hash) return;
  e.preventDefault();
  render();
});

window.addEventListener('hashchange', () => {
  if (location.hash === '#main') return; // 本文内アンカーはページを切り替えない
  render();
});
render();
