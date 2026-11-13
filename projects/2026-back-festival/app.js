/* 현장 진행 도우미 — 내용은 data/ 폴더의 표(csv)와 event.json 에서 읽습니다.
   이 파일은 행사마다 고칠 필요가 없습니다. */
const TIMER_PRESETS = [["준비 30초",30],["암송 5분",300],["이동 1분",60],["소개 3분",180],["게임 15분",900],["2분",120]];
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, "0");
let EVENT = {}, CUES = [], ITEMS = [], picked = null, phase = "prep";

/* ---------- CSV 읽기 (따옴표·쉼표 포함 칸 지원) ---------- */
function parseCSV(text){
  const rows = []; let row = [], cell = "", q = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++){
    const ch = text[i];
    if (q){ if (ch === '"' && text[i+1] === '"'){ cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r"){ if (ch === "\r" && text[i+1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell || row.length){ row.push(cell); rows.push(row); }
  const head = rows.shift().map(h => h.trim());
  return rows.filter(r => r.some(c => c.trim())).map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || "").trim()])));
}

/* ---------- 한국 시간 ---------- */
function kstMs(hm){ const [y,m,d] = EVENT.date.split("-").map(Number); const [h,mi] = hm.split(":").map(Number); return Date.UTC(y, m-1, d, h-9, mi); }
function kstParts(ms){ const d = new Date(ms + 9*3600e3); return [d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()]; }
function fmt(ms){ const s = Math.floor(Math.abs(ms)/1000), h = Math.floor(s/3600), m = Math.floor(s%3600/60); return (h ? h + ":" + pad(m) : pad(m)) + ":" + pad(s%60); }

/* ---------- 진행 패널 ---------- */
function autoIndex(now){
  let idx = -1;
  CUES.forEach((c, i) => { if (now >= c.start) idx = i; });
  return idx;
}
function tick(){
  const now = Date.now(), [h,m,s] = kstParts(now);
  $("clock").firstChild.nodeValue = `${pad(h)}:${pad(m)}:${pad(s)}`;
  const auto = autoIndex(now);
  const i = picked === null ? auto : picked;
  const c = CUES[Math.max(i, 0)], big = $("big");
  big.classList.remove("over");
  $("pill").textContent = picked === null ? "현재 순서" : "선택한 순서";
  $("curName").textContent = c.name;
  $("curPlan").textContent = c.e ? `${c.s} – ${c.e}` : c.s;
  if (now < c.start){
    $("state").textContent = "준비";
    big.textContent = fmt(c.start - now); $("bigLabel").textContent = "예정 시작까지"; $("bar").style.width = "0";
  } else if (c.end && now < c.end){
    $("state").textContent = "진행 중";
    big.textContent = fmt(c.end - now); $("bigLabel").textContent = "예정 종료까지";
    $("bar").style.width = ((now - c.start) / (c.end - c.start) * 100) + "%";
  } else if (c.end){
    $("state").textContent = "예정 시간 지남";
    big.textContent = "+" + fmt(now - c.end); big.classList.add("over"); $("bigLabel").textContent = "예정 종료 후"; $("bar").style.width = "100%";
  } else {
    $("state").textContent = "진행 중";
    big.textContent = fmt(now - c.start); $("bigLabel").textContent = "시작 후 경과"; $("bar").style.width = "100%";
  }
  const n = CUES[Math.max(i, 0) + 1];
  $("next").hidden = !n;
  if (n){ $("nextName").textContent = n.name; $("nextPlan").textContent = n.e ? `${n.s} – ${n.e}` : n.s; }
  if (tick.last !== i){ tick.last = i; renderCues(i); }
}
function select(i){ picked = i; tick.last = null; tick(); $("followBtn").setAttribute("aria-pressed", "false"); }
$("next").onclick = () => select(Math.max(picked === null ? autoIndex(Date.now()) : picked, 0) + 1);
$("followBtn").onclick = () => { picked = null; tick.last = null; tick(); $("followBtn").setAttribute("aria-pressed", "true"); };

/* ---------- 큐시트 목록 ---------- */
function renderCues(cur){
  const ol = $("cues"); ol.innerHTML = "";
  const mainOnly = $("mainOnly").checked;
  CUES.forEach((c, i) => {
    if (mainOnly && !c.main) return;
    const li = document.createElement("li");
    li.className = "cue" + (i < cur ? " past" : "") + (i === cur ? " now" : "");
    li.tabIndex = 0;
    li.innerHTML = '<div class="tm num"></div><div class="nm"></div><div class="rl"></div><div class="nt"></div>';
    li.querySelector(".tm").textContent = c.e ? `${c.s} – ${c.e}` : c.s;
    li.querySelector(".nm").textContent = c.name;
    li.querySelector(".rl").textContent = c.role;
    li.querySelector(".nt").textContent = c.note;
    li.onclick = () => { select(i); window.scrollTo({top: 0, behavior: "smooth"}); };
    li.onkeydown = e => { if (e.key === "Enter") li.onclick(); };
    ol.appendChild(li);
  });
}
$("mainOnly").onchange = () => { tick.last = null; tick(); };

/* ---------- 보조 타이머 ---------- */
let tEnd = null, tInt = null;
TIMER_PRESETS.forEach(([label, sec]) => {
  const b = document.createElement("button"); b.type = "button"; b.textContent = label;
  b.onclick = () => { $("timer").classList.remove("done"); tEnd = Date.now() + sec*1000; clearInterval(tInt); tInt = setInterval(tRender, 200); tRender(); };
  $("presets").appendChild(b);
});
function tRender(){
  if (!tEnd){ $("tVal").textContent = "00:00"; return; }
  const left = tEnd - Date.now();
  if (left <= 0){ clearInterval(tInt); tEnd = null; $("tVal").textContent = "00:00"; const t = $("timer"); t.classList.remove("done"); void t.offsetWidth; t.classList.add("done"); return; }
  const s = Math.ceil(left/1000); $("tVal").textContent = pad(Math.floor(s/60)) + ":" + pad(s%60);
}
$("tStop").onclick = () => { tEnd = null; clearInterval(tInt); $("timer").classList.remove("done"); tRender(); };

/* ---------- 화면 켜짐 유지 ---------- */
let lock = null;
async function wakeOn(){ try { lock = await navigator.wakeLock.request("screen"); return true; } catch(e){ return false; } }
$("wakeBtn").onclick = async () => {
  const b = $("wakeBtn");
  if (b.getAttribute("aria-pressed") === "true"){ try { await lock?.release(); } catch(e){} lock = null; b.setAttribute("aria-pressed", "false"); return; }
  if (await wakeOn()) b.setAttribute("aria-pressed", "true");
  else alert("이 브라우저는 지원하지 않습니다. 기기의 자동 잠금 시간을 늘려 주세요.");
};
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && $("wakeBtn").getAttribute("aria-pressed") === "true") wakeOn(); });

/* ---------- 체크리스트 (이 기기 저장) ---------- */
const storeKey = () => "cue-check:" + location.pathname;
let checks = {};
try { checks = JSON.parse(localStorage.getItem(storeKey())) || {}; } catch(e){}
const save = () => { try { localStorage.setItem(storeKey(), JSON.stringify(checks)); } catch(e){} };
document.querySelectorAll(".tabs button").forEach(b => b.onclick = () => {
  phase = b.dataset.phase;
  document.querySelectorAll(".tabs button").forEach(x => x.setAttribute("aria-selected", x === b ? "true" : "false"));
  renderItems();
});
function renderItems(){
  const wrap = $("cats"); wrap.innerHTML = "";
  const done = ITEMS.filter((_, i) => checks[phase + i]).length;
  $("checkCount").textContent = `${done} / ${ITEMS.length}`;
  [...new Set(ITEMS.map(it => it.cat))].forEach(cat => {
    const list = ITEMS.map((it, i) => ({...it, i})).filter(it => it.cat === cat);
    const sec = document.createElement("div"); sec.className = "cat";
    sec.innerHTML = "<h4><span></span><span class='num'></span></h4>";
    sec.querySelector("span").textContent = cat;
    sec.querySelector(".num").textContent = list.filter(it => checks[phase + it.i]).length + "/" + list.length;
    list.forEach(it => {
      const row = document.createElement("div"); row.className = "item" + (checks[phase + it.i] ? " done" : "");
      const id = "c-" + phase + it.i;
      row.innerHTML = `<input type="checkbox" id="${id}"><label for="${id}"></label>`;
      row.querySelector("label").textContent = it.text;
      const cb = row.querySelector("input"); cb.checked = !!checks[phase + it.i];
      cb.onchange = () => { checks[phase + it.i] = cb.checked; save(); renderItems(); };
      sec.appendChild(row);
    });
    wrap.appendChild(sec);
  });
}
$("resetBtn").onclick = () => { if (!confirm("이 탭의 체크를 모두 지울까요?")) return; Object.keys(checks).forEach(k => { if (k.startsWith(phase)) delete checks[k]; }); save(); renderItems(); };

/* ---------- 시작 ---------- */
(async function init(){
  try {
    const [ev, cues, items] = await Promise.all([
      fetch("data/event.json").then(r => r.json()),
      fetch("data/cues.csv").then(r => r.text()),
      fetch("data/checklist.csv").then(r => r.text())
    ]);
    EVENT = ev;
    document.title = ev.title;
    $("title").textContent = ev.title; $("subtitle").textContent = ev.subtitle || "";
    if (ev.logo) $("logo").textContent = ev.logo;
    const [y,m,d] = ev.date.split("-");
    $("date").textContent = `${y}년 ${+m}월 ${+d}일 · 한국 시간`;
    $("footer").textContent = [ev.title, ev.footer, ev.date].filter(Boolean).join(" · ");
    CUES = parseCSV(cues).map(r => ({s: r["시작"], e: r["끝"], name: r["순서"], role: r["담당"], note: r["메모"], main: !!r["본행사"]}));
    CUES.forEach(c => { c.start = kstMs(c.s); c.end = c.e ? kstMs(c.e) : null; });
    ITEMS = parseCSV(items).map(r => ({cat: r["분류"], text: r["물품"]}));
    renderItems(); tick(); setInterval(tick, 500);
  } catch(e){
    $("title").textContent = "내용을 불러오지 못했습니다";
    $("curName").textContent = "data 폴더의 파일을 확인하세요. (파일을 더블클릭해서 열면 동작하지 않고, GitHub Pages 주소로 열어야 합니다.)";
  }
})();
