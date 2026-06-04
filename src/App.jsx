import { useState, useEffect, useRef, useMemo } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── CONFIG ────────────────────────────────────────────────────────────────
const sb = createClient(
  "https://lhoeabvsnjprmahsnzzh.supabase.co",
  "sb_publishable_tbtPN0fnjygO1RcK6tMFxw__4LxEnyq"
);

const GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"];
const GROUP_TEAMS = {
  A:["🇲🇽 Mexico","🇿🇦 Zuid-Afrika","🇰🇷 Zuid-Korea","🇨🇿 Tsjechië"],
  B:["🇨🇦 Canada","🇧🇦 Bosnië-Herz.","🇶🇦 Qatar","🇨🇭 Zwitserland"],
  C:["🇧🇷 Brazilië","🇲🇦 Marokko","🇭🇹 Haïti","🏴󠁧󠁢󠁳󠁣󠁴󠁿 Schotland"],
  D:["🇺🇸 USA","🇵🇾 Paraguay","🇦🇺 Australië","🇹🇷 Turkije"],
  E:["🇩🇪 Duitsland","🇨🇼 Curaçao","🇨🇮 Ivoorkust","🇪🇨 Ecuador"],
  F:["🇳🇱 Nederland","🇯🇵 Japan","🇸🇪 Zweden","🇹🇳 Tunesië"],
  G:["🇧🇪 België","🇪🇬 Egypte","🇮🇷 Iran","🇳🇿 Nieuw-Zeeland"],
  H:["🇪🇸 Spanje","🇨🇻 Kaapverdië","🇸🇦 Saoedi-Arabië","🇺🇾 Uruguay"],
  I:["🇫🇷 Frankrijk","🇸🇳 Senegal","🇮🇶 Irak","🇳🇴 Noorwegen"],
  J:["🇦🇷 Argentinië","🇩🇿 Algerije","🇦🇹 Oostenrijk","🇯🇴 Jordanië"],
  K:["🇵🇹 Portugal","🇨🇩 DR Congo","🇺🇿 Oezbekistan","🇨🇴 Colombia"],
  L:["🏴󠁧󠁢󠁥󠁮󠁧󠁿 Engeland","🇭🇷 Kroatië","🇬🇭 Ghana","🇵🇦 Panama"],
};
const ALL_TEAMS = Object.values(GROUP_TEAMS).flat().sort((a,b)=>{
  const cl = s => s.replace(/[^a-zA-ZÀ-ÿ ]/g,'').trim();
  return cl(a).localeCompare(cl(b),'nl');
});

const AVATAR_COLORS = ["#10b981","#f59e0b","#3b82f6","#ec4899","#8b5cf6","#ef4444","#14b8a6","#f97316","#84cc16","#06b6d4","#a855f7","#d946ef"];

const BONUS_QS = [
  {id:"b3",label:"🥅 Hoeveel goals in de finale (binnen 120 min)?",type:"number"},
  {id:"b5",label:"🔥 Welk team scoort de meeste goals?",type:"team"},
  {id:"b6",label:"🛡️ Welk team krijgt de meeste goals tegen?",type:"team"},
  {id:"b2",label:"👟 Wie wordt topscorer?",type:"text"},
  {id:"b1",label:"🏆 Wie wordt wereldkampioen?",type:"team"},
  {id:"b7",label:"🏅 Welk team wordt 3e?",type:"team"},
  {id:"b9",label:"🇳🇱 Hoeveel goals maakt Nederland in de groepsfase?",type:"number"},
  {id:"b10",label:"🌟 Wie wordt speler van het toernooi?",type:"text"},
];

const KO_PHASES = [
  {id:"r32",label:"1/16",full:"⚔️ Zestiende Finale"},
  {id:"r16",label:"1/8",full:"🏹 Achtste Finale"},
  {id:"qf",label:"QF",full:"💥 Kwartfinale"},
  {id:"sf",label:"HF",full:"🔥 Halve Finale"},
  {id:"3p",label:"3P",full:"🥉 3e Plaats"},
  {id:"final",label:"🏆",full:"🏆 Finale"},
];

// Placeholder-teamnames die nog niet echt zijn
const KO_PLACEHOLDERS = ["Winnaar","Verliezer","1e Groep","2e Groep","Beste nr"];
const isPlaceholder = name => !name || KO_PLACEHOLDERS.some(p => name.startsWith(p));

const WK_START = new Date("2026-06-11T21:00:00+02:00");

// ── PUNTENSYSTEEM (Vindicat) ──────────────────────────────────────────────
// 3pt winnaar/gelijkspel goed + 1pt thuisgoals goed + 1pt uitgoals goed = max 5pt
function scorePts(ph, pa, mh, ma) {
  ph = +ph; pa = +pa; mh = +mh; ma = +ma;
  const predOut = ph > pa ? 1 : ph < pa ? -1 : 0;
  const realOut = mh > ma ? 1 : mh < ma ? -1 : 0;
  let pts = 0;
  if (predOut === realOut) pts += 3;
  if (ph === mh) pts += 1;
  if (pa === ma) pts += 1;
  if (pts === 5) return { pts: 5, label: "+5 ✓", cls: "pts-exact" };
  if (pts === 4) return { pts: 4, label: "+4", cls: "pts-high" };
  if (pts === 3) return { pts: 3, label: "+3", cls: "pts-mid" };
  if (pts === 2) return { pts: 2, label: "+2", cls: "pts-low" };
  if (pts === 1) return { pts: 1, label: "+1", cls: "pts-min" };
  return { pts: 0, label: "0", cls: "pts-zero" };
}

// FIX #10: gebruik Map voor O(1) match lookup
function calcMatchPts(preds, matchMap) {
  let pts = 0, exact = 0;
  for (const p of preds) {
    const m = matchMap.get(p.match_id);
    if (!m || m.home_goals == null || m.away_goals == null) continue;
    const r = scorePts(p.home_goals, p.away_goals, m.home_goals, m.away_goals);
    pts += r.pts;
    if (r.pts === 5) exact++;
  }
  return { pts, exact };
}

function calcBonusPts(ans, res) {
  if (!res || !ans) return 0;
  return BONUS_QS.reduce((s, q) => {
    const a = ans[q.id], r = res[q.id];
    return s + (a && r && a.toString().toLowerCase().trim() === r.toString().toLowerCase().trim() ? 10 : 0);
  }, 0);
}

function calcStandingPts(userOrder, realOrder) {
  if (!userOrder || !realOrder) return 0;
  let pts = 0;
  for (let i = 0; i < 4; i++) {
    if (userOrder[i] && realOrder[i] && userOrder[i] === realOrder[i]) pts += 5;
  }
  return pts;
}

// FIX #5: niet muteren — gebruik [...teams].sort()
function getStanding(matches, grp) {
  const gm = matches.filter(m => m.grp === grp && m.phase === "group");
  const teams = [...(GROUP_TEAMS[grp] || [])];
  const s = Object.fromEntries(teams.map(t => [t, { pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, mp: 0 }]));
  for (const m of gm) {
    if (m.home_goals == null) continue;
    const [mh, ma] = [+m.home_goals, +m.away_goals];
    if (!s[m.home] || !s[m.away]) continue;
    s[m.home].mp++; s[m.away].mp++;
    s[m.home].gf += mh; s[m.home].ga += ma;
    s[m.away].gf += ma; s[m.away].ga += mh;
    if (mh > ma) { s[m.home].pts += 3; s[m.home].w++; s[m.away].l++; }
    else if (mh < ma) { s[m.away].pts += 3; s[m.away].w++; s[m.home].l++; }
    else { s[m.home].pts++; s[m.away].pts++; s[m.home].d++; s[m.away].d++; }
  }
  return [...teams].sort((a, b) =>
    s[b].pts - s[a].pts || (s[b].gf - s[b].ga) - (s[a].gf - s[a].ga) || s[b].gf - s[a].gf
  ).map(t => ({ team: t, ...s[t] }));
}

function hashPw(pw) { let h = 0; for (let c of pw) h = Math.imul(31, h) + c.charCodeAt(0) | 0; return h.toString(36); }
function avatarColor(name) { let h = 0; for (let c of name) h = Math.imul(31, h) + c.charCodeAt(0) | 0; return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]; }

function useCountdown(target) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0, started: false });
  useEffect(() => {
    const tick = () => {
      const diff = target - new Date();
      if (diff <= 0) { setT({ d: 0, h: 0, m: 0, s: 0, started: true }); return; }
      setT({ d: Math.floor(diff/864e5), h: Math.floor(diff/36e5)%24, m: Math.floor(diff/6e4)%60, s: Math.floor(diff/1e3)%60, started: false });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return t;
}

// FIX #17: toast met ref voor timeout zodat meerdere toasts niet conflicteren
function useToast() {
  const [toast, setToast] = useState(null);
  const ref = useRef(null);
  const show = (msg, ms = 2600) => {
    if (ref.current) clearTimeout(ref.current);
    setToast(msg);
    ref.current = setTimeout(() => setToast(null), ms);
  };
  return [toast, show];
}

// ── MODAL ─────────────────────────────────────────────────────────────────
function Modal({ title, children, onClose }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }} onClick={onClose}>
      <div style={{ background:"var(--c1)",border:"1px solid var(--bd)",borderRadius:14,padding:20,width:"100%",maxWidth:360,position:"relative" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:16,marginBottom:14,color:"var(--t1)" }}>{title}</div>
        {children}
      </div>
    </div>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&family=Oswald:wght@500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
:root{
  --gr:#ff6b00;--gr2:#e55f00;--am:#ffb347;--am2:#ff8c00;
  --re:#f43f5e;--bg:#1c1c1e;--c1:#2c2c2e;--c2:#3a3a3c;--c3:#48484a;
  --bd:#636366;--t1:#f5f5f7;--t2:#aeaeb2;--t3:#8e8e93;
  --r:12px;--shadow:0 4px 24px rgba(0,0,0,.4);
}
html,body{background:var(--bg);font-family:'Figtree',sans-serif;color:var(--t1);min-height:100vh;overflow-x:hidden}
*{-webkit-font-smoothing:antialiased}
::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-thumb{background:var(--gr);border-radius:2px;opacity:.3}
input,button,select,textarea{font-family:inherit}
button{cursor:pointer}

.page{max-width:560px;margin:0 auto;padding:12px 12px 90px}

.hdr{background:linear-gradient(180deg,var(--c1) 0%,rgba(44,44,46,.97) 100%);backdrop-filter:blur(12px);border-bottom:1px solid var(--bd);position:sticky;top:0;z-index:100}
.hdr-in{max-width:560px;margin:0 auto;padding:0 14px;display:flex;align-items:center;justify-content:space-between;height:52px}
.logo{display:flex;align-items:center;gap:8px}
.logo-text{font-family:'Oswald',sans-serif;font-weight:700;font-size:18px;letter-spacing:.5px}
.logo-text span{color:var(--gr)}
.logo-chip{background:var(--gr);color:#fff;font-size:9px;font-weight:900;border-radius:4px;padding:2px 6px;letter-spacing:.8px;text-transform:uppercase}

/* FIX #4 - bottom nav labels verdwijnen op heel kleine schermen */
.bnav{position:fixed;bottom:0;left:0;right:0;background:rgba(28,28,30,.97);backdrop-filter:blur(16px);border-top:1px solid var(--bd);display:flex;z-index:100;padding-bottom:env(safe-area-inset-bottom,0)}
.bn{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:9px 2px 8px;border:none;background:none;color:var(--t3);font-size:9px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;transition:all .2s;position:relative;min-width:0}
.bn.on{color:var(--gr)}
.bn.on::after{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:20px;height:2px;background:var(--gr);border-radius:0 0 2px 2px}
.bn-ic{font-size:20px;line-height:1}
.bn-lb{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%;text-align:center}
@media(max-width:359px){.bn-lb{display:none}}

.countdown{background:linear-gradient(135deg,#2c2c2e,#3a3a3c);border:1px solid rgba(255,107,0,.2);border-radius:var(--r);padding:16px 14px;margin-bottom:12px;position:relative;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.3)}
.countdown::before{content:'⚽';position:absolute;right:-10px;bottom:-10px;font-size:80px;opacity:.05;transform:rotate(-15deg)}
.countdown::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 0% 100%,rgba(255,107,0,.08),transparent 50%)}
.cd-title{font-size:11px;color:var(--t3);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}
.cd-boxes{display:flex;gap:6px;align-items:center}
.cd-box{background:var(--c1);border:1px solid var(--bd);border-radius:8px;padding:8px 6px;text-align:center;flex:1;min-width:0}
.cd-num{font-family:'Oswald',sans-serif;font-weight:700;font-size:24px;color:var(--gr);line-height:1;display:block}
.cd-lbl{font-size:9px;color:var(--t3);font-weight:700;text-transform:uppercase;letter-spacing:.5px;display:block;margin-top:2px}

.banner{background:linear-gradient(160deg,#1c1c1e 0%,#2c2c2e 40%,#242424 70%,#1c1c1e 100%);border-radius:var(--r);padding:22px 16px 20px;margin-bottom:12px;position:relative;overflow:hidden;border:1px solid rgba(255,107,0,.2);box-shadow:0 0 40px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,107,0,.1)}
.banner::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 10% 100%,rgba(255,107,0,.1),transparent 45%),radial-gradient(ellipse at 90% 0%,rgba(255,179,71,.06),transparent 45%)}
.banner::after{content:'⚽';position:absolute;right:-8px;bottom:-12px;font-size:100px;opacity:.03;transform:rotate(20deg)}
.banner-flags{position:absolute;right:14px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:5px;opacity:.25;font-size:30px;filter:saturate(.5)}
.banner-divider{height:1.5px;background:linear-gradient(90deg,transparent,var(--gr),var(--am),var(--gr),transparent);margin-top:14px;border-radius:1px;box-shadow:0 0 8px rgba(255,107,0,.35)}

.card{background:var(--c1);border:1px solid var(--bd);border-radius:var(--r);overflow:hidden;margin-bottom:10px}
.card-head{padding:12px 14px 10px;border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;gap:6px}
.card-title{font-family:'Oswald',sans-serif;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:var(--gr)}

.lb-row{display:flex;align-items:center;gap:11px;padding:12px 14px;border-bottom:1px solid rgba(30,45,74,.6);transition:background .15s;position:relative}
.lb-row:last-child{border-bottom:none}
.lb-row.me{background:linear-gradient(90deg,rgba(255,107,0,.08),transparent 60%)}
.lb-row.me::before{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--gr)}
.lb-pos{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0}
.lb-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Oswald',sans-serif;font-weight:700;font-size:16px;flex-shrink:0;border:2px solid var(--bd)}
.lb-name{font-weight:700;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lb-sub{font-size:11px;color:var(--t3);margin-top:2px;display:flex;align-items:center;gap:5px;flex-wrap:wrap}

/* FIX #5/#16 - wedstrijdrij mobiel: teamnamen correct afkappen */
.mr{padding:11px 14px;border-bottom:1px solid rgba(30,45,74,.5)}
.mr:last-child{border-bottom:none}
.mr-teams{display:grid;grid-template-columns:1fr auto 1fr;gap:6px;align-items:center}
.mr-home{font-size:12px;font-weight:700;text-align:right;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mr-away{font-size:12px;font-weight:700;text-align:left;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.score-btn{background:var(--bg);border:1.5px solid var(--bd);border-radius:8px;padding:6px 10px;font-family:'Oswald',sans-serif;font-weight:600;font-size:15px;color:var(--t3);min-width:54px;text-align:center;white-space:nowrap;transition:all .15s;cursor:default;flex-shrink:0}
.score-btn.done{border-color:rgba(255,107,0,.3);color:var(--gr);background:rgba(255,107,0,.06)}
.score-btn.editable{border-color:var(--t3);cursor:pointer}
.score-btn.editable:active{border-color:var(--gr)}
.mr-meta{display:flex;align-items:center;justify-content:space-between;margin-top:7px;flex-wrap:wrap;gap:5px}
.mr-time{font-size:10px;color:var(--t3);font-weight:600;display:flex;align-items:center;gap:4px}
.mr-actions{display:flex;align-items:center;gap:5px;flex-wrap:wrap}

/* FIX #6 - score invoer mobiel beter */
.score-edit{display:flex;align-items:center;gap:7px;margin-top:8px;background:var(--bg);border-radius:8px;padding:10px 12px;flex-wrap:wrap}
.ni{width:48px;height:44px;background:var(--c2);border:1.5px solid var(--bd);border-radius:7px;color:var(--t1);text-align:center;font-size:18px;font-weight:700;outline:none;-webkit-appearance:none;appearance:none}
.ni:focus{border-color:var(--gr)}

/* Prediction distribution bar - FIX #13: toon ook voor wedstrijd */
.pred-dist{margin-top:8px;display:flex;gap:0;border-radius:6px;overflow:hidden;height:5px}
.pred-dist-label{display:flex;justify-content:space-between;margin-top:3px;font-size:9px;color:var(--t3);font-weight:600}

.pill{background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.2);border-radius:6px;padding:3px 9px;font-family:'Oswald',sans-serif;font-weight:600;font-size:12px;color:var(--am);white-space:nowrap}
.pill.green{background:rgba(255,179,71,.12);border-color:rgba(255,179,71,.25);color:var(--am)}

/* FIX #18: punten badges hernoemd, dode klassen verwijderd */
.pts-badge{font-size:11px;font-weight:700;padding:2px 7px;border-radius:5px;white-space:nowrap}
.pts-exact{background:rgba(255,107,0,.15);color:#ff6b00;border:1px solid rgba(255,107,0,.25)}
.pts-high{background:rgba(59,130,246,.15);color:#60a5fa;border:1px solid rgba(59,130,246,.25)}
.pts-mid{background:rgba(251,191,36,.15);color:var(--am);border:1px solid rgba(251,191,36,.25)}
.pts-low{background:rgba(168,85,247,.15);color:#c084fc;border:1px solid rgba(168,85,247,.25)}
.pts-min{background:rgba(99,102,241,.12);color:#818cf8;border:1px solid rgba(99,102,241,.2)}
.pts-zero{background:rgba(244,63,94,.12);color:var(--re);border:1px solid rgba(244,63,94,.2)}
.lock-tag{font-size:10px;background:rgba(251,191,36,.1);color:var(--am);border:1px solid rgba(251,191,36,.2);border-radius:4px;padding:2px 6px;font-weight:700}
.too-late{font-size:10px;color:var(--t3);font-style:italic}

.btn{border:none;border-radius:8px;font-weight:700;transition:all .15s;display:inline-flex;align-items:center;justify-content:center;gap:5px;cursor:pointer;white-space:nowrap}
.btn-green{background:var(--gr);color:#fff;padding:12px 20px;font-size:14px;width:100%;border-radius:var(--r)}
.btn-green:active{transform:scale(.97)}
.btn-green:disabled{opacity:.4;transform:none}
.btn-out{background:transparent;border:1.5px solid var(--bd);color:var(--t2);padding:6px 12px;font-size:12px}
.btn-out:active{border-color:var(--gr);color:var(--gr)}
.btn-del{background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.2);color:var(--re);padding:6px 10px;font-size:12px}
.btn-del:active{background:rgba(244,63,94,.2)}
.btn-sm{padding:5px 11px;font-size:11px;border-radius:7px}
.btn-ic{width:32px;height:32px;padding:0;border-radius:7px}
.btn-confirm{background:var(--gr);color:#fff;border:none;padding:6px 12px;font-size:12px;border-radius:7px;font-weight:700}

.inp{width:100%;background:var(--c2);border:1.5px solid var(--bd);border-radius:8px;color:var(--t1);padding:12px 13px;font-size:14px;outline:none;transition:border-color .15s;-webkit-appearance:none}
.inp:focus{border-color:var(--gr)}
.inp::placeholder{color:var(--t3)}
.sel{width:100%;background:var(--c2);border:1.5px solid var(--bd);border-radius:8px;color:var(--t1);padding:12px 13px;font-size:14px;outline:none;-webkit-appearance:none}
.sel:focus{border-color:var(--gr)}
.lbl{font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:6px}

/* FIX #7: scroll hint via gradient fade */
.gtabs-wrap{position:relative;margin-bottom:10px}
.gtabs-wrap::after{content:'';position:absolute;right:0;top:0;bottom:8px;width:24px;background:linear-gradient(90deg,transparent,var(--bg));pointer-events:none}
.gtabs{display:flex;gap:5px;overflow-x:auto;padding-bottom:8px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.gtabs::-webkit-scrollbar{display:none}
.gtab{flex-shrink:0;width:34px;height:34px;border-radius:8px;border:1.5px solid var(--bd);background:var(--c1);color:var(--t3);font-family:'Oswald',sans-serif;font-weight:600;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all .15s}
.gtab.on{background:var(--gr);border-color:var(--gr);color:#fff}

.ptabs-wrap{position:relative;margin-bottom:10px}
.ptabs-wrap::after{content:'';position:absolute;right:0;top:0;bottom:8px;width:24px;background:linear-gradient(90deg,transparent,var(--bg));pointer-events:none}
.ptabs{display:flex;gap:5px;overflow-x:auto;padding-bottom:8px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.ptabs::-webkit-scrollbar{display:none}
.ptab{flex-shrink:0;padding:7px 13px;border-radius:20px;border:1.5px solid var(--bd);background:var(--c1);color:var(--t3);font-size:12px;font-weight:700;transition:all .15s;white-space:nowrap}
.ptab.on{background:var(--gr);border-color:var(--gr);color:#fff}

.stand-row{display:grid;grid-template-columns:14px 1fr 22px 22px 22px 22px 22px 26px;gap:3px;align-items:center;padding:7px 0;border-bottom:1px solid rgba(30,45,74,.4)}
.stand-row:last-child{border-bottom:none}
.stand-num{font-size:10px;font-weight:700;text-align:center}
.stand-team{font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.stand-cell{font-size:11px;text-align:center;color:var(--t3);font-variant-numeric:tabular-nums}
.stand-pts{font-family:'Oswald',sans-serif;font-weight:700;font-size:14px;text-align:center}

.stat-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(30,45,74,.4)}
.stat-row:last-child{border-bottom:none}
.stat-avatar{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Oswald',sans-serif;font-weight:700;font-size:13px;flex-shrink:0}
.stat-bar-wrap{flex:1;min-width:0}
.stat-name{font-size:12px;font-weight:700;margin-bottom:3px;display:flex;justify-content:space-between;align-items:center}
.stat-bar{height:5px;background:var(--c3);border-radius:3px;overflow:hidden}
.stat-fill{height:100%;border-radius:3px;transition:width .8s ease}

.ur{display:flex;align-items:center;gap:11px;padding:12px 14px;border-bottom:1px solid rgba(30,45,74,.5)}
.ur:last-child{border-bottom:none}

.bq{background:var(--c2);border:1px solid var(--bd);border-radius:10px;padding:13px;margin-bottom:9px;transition:border-color .2s}
.bq.ok{border-color:rgba(255,107,0,.4)}
.bq.no{border-color:rgba(244,63,94,.3)}
.bq.empty{border:1px dashed var(--bd)}

.sec-title{font-family:'Oswald',sans-serif;font-weight:700;font-size:20px;letter-spacing:.3px;margin-bottom:2px}
.sec-sub{font-size:12px;color:var(--t3);margin-bottom:13px}

.toast{position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:999;background:var(--c2);border:1px solid var(--gr);border-radius:10px;padding:10px 18px;font-size:13px;font-weight:700;color:var(--gr);box-shadow:0 8px 32px rgba(0,0,0,.6);white-space:nowrap;pointer-events:none}
.toast.err{border-color:var(--re);color:var(--re)}

.infobox{background:var(--c2);border:1px solid var(--bd);border-radius:9px;padding:11px 13px;margin-bottom:12px;display:flex;gap:9px;align-items:flex-start}
.infobox-i{font-size:16px;flex-shrink:0;margin-top:1px}
.infobox-t{font-size:12px;color:var(--t2);line-height:1.5}

.auth{min-height:100vh;background:var(--bg);display:flex;flex-direction:column}
.auth-hero{padding:40px 20px 30px;text-align:center;position:relative;overflow:hidden}
.auth-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 120%,rgba(255,107,0,.1),transparent 60%)}
.auth-body{flex:1;padding:0 16px 40px;max-width:400px;width:100%;margin:0 auto}
.auth-tabs{display:grid;grid-template-columns:1fr 1fr;background:var(--c2);border-radius:10px;padding:3px;gap:3px;margin-bottom:18px}
.auth-tab{padding:10px;border:none;border-radius:8px;font-size:13px;font-weight:700;background:transparent;color:var(--t3);transition:all .15s}
.auth-tab.on{background:var(--c1);color:var(--t1)}
.fg{margin-bottom:12px}
.errbox{background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.3);border-radius:8px;padding:10px 13px;font-size:13px;color:var(--re);margin-bottom:11px}

.empty{text-align:center;padding:36px 16px;color:var(--t3)}
.empty-i{font-size:36px;margin-bottom:8px}
.empty-t{font-size:13px;line-height:1.5}

.next-match{background:linear-gradient(135deg,var(--c2),var(--c3));border:1px solid var(--bd);border-radius:var(--r);padding:14px 16px;margin-bottom:12px}
.nm-label{font-size:10px;color:var(--t3);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.nm-teams{display:flex;align-items:center;justify-content:space-between;gap:8px}
.nm-team{font-size:13px;font-weight:700;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nm-team.away{text-align:right}
.nm-vs{font-family:'Oswald',sans-serif;font-size:13px;color:var(--t3);font-weight:600;flex-shrink:0}

.stand-pred{background:var(--c2);border:1px solid var(--bd);border-radius:10px;padding:12px 14px;margin-bottom:8px}
.stand-pred-title{font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px}
.stand-pred-row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(30,45,74,.3)}
.stand-pred-row:last-child{border-bottom:none}
.stand-pred-pos{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;flex-shrink:0}

@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.fu{animation:fu .22s ease both}
@keyframes spin{to{transform:rotate(360deg)}}
.spin{animation:spin .8s linear infinite;display:inline-block}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
.live{animation:pulse 1.5s infinite;display:inline-block;width:7px;height:7px;background:#22c55e;border-radius:50%;margin-right:4px;vertical-align:middle}

/* Confetti */
@keyframes confetti-fall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
.confetti-piece{position:fixed;width:8px;height:8px;border-radius:2px;pointer-events:none;z-index:9999;animation:confetti-fall 1.8s ease-in forwards}

/* Punten counter animatie */
@keyframes pts-pop{0%{transform:scale(1)}40%{transform:scale(1.4)}70%{transform:scale(.9)}100%{transform:scale(1)}}
.pts-pop{animation:pts-pop .4s ease both}

/* Badge op nav tab */
.bn-badge{position:absolute;top:6px;right:calc(50% - 16px);width:8px;height:8px;background:var(--re);border-radius:50%;border:1.5px solid var(--bg)}

/* Twin popup */
@keyframes slide-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.twin-popup{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:var(--c1);border:1px solid var(--gr);border-radius:12px;padding:10px 16px;z-index:200;white-space:nowrap;box-shadow:0 8px 32px rgba(0,0,0,.6);animation:slide-up .3s ease both;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:var(--gr)}
`;

// ── CONFETTI ──────────────────────────────────────────────────────────────
function fireConfetti() {
  const colors = ["#ff6b00","#fbbf24","#f43f5e","#60a5fa","#a855f7","#10b981"];
  const container = document.body;
  for (let i = 0; i < 40; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";
    el.style.cssText = `
      left:${20 + Math.random() * 60}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-delay:${Math.random() * 0.4}s;
      animation-duration:${1.2 + Math.random() * 0.8}s;
      width:${6 + Math.random()*6}px;
      height:${6 + Math.random()*6}px;
      border-radius:${Math.random()>.5?"50%":"2px"};
    `;
    container.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }
}

// ── ANIMATED SCORE ────────────────────────────────────────────────────────
function AnimatedScore({ value, style }) {
  const [display, setDisplay] = useState(value);
  const [pop, setPop] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current === value) return;
    const diff = value - prev.current;
    const steps = 25;
    let i = 0;
    const start = prev.current;
    const id = setInterval(() => {
      i++;
      setDisplay(Math.round(start + diff * (i / steps)));
      if (i >= steps) { clearInterval(id); prev.current = value; setPop(true); setTimeout(() => setPop(false), 400); }
    }, 20);
    return () => clearInterval(id);
  }, [value]);
  return <span className={pop ? "pts-pop" : ""} style={style}>{display}</span>;
}

// ── PREDICTION DISTRIBUTION ───────────────────────────────────────────────
function PredDist({ matchId, preds }) {
  const mp = preds.filter(p => p.match_id === matchId && p.home_goals != null);
  if (mp.length < 2) return null;
  const wins   = mp.filter(p => +p.home_goals > +p.away_goals).length;
  const draws  = mp.filter(p => +p.home_goals === +p.away_goals).length;
  const losses = mp.length - wins - draws;
  const total  = mp.length;
  const wPct = Math.round(wins / total * 100);
  const dPct = Math.round(draws / total * 100);
  const lPct = 100 - wPct - dPct;
  return (
    <div style={{ marginTop: 8 }}>
      <div className="pred-dist">
        {wPct > 0 && <div style={{ width:`${wPct}%`, background:"var(--gr)", opacity:.7 }} />}
        {dPct > 0 && <div style={{ width:`${dPct}%`, background:"var(--am)", opacity:.7 }} />}
        {lPct > 0 && <div style={{ width:`${lPct}%`, background:"var(--re)", opacity:.7 }} />}
      </div>
      <div className="pred-dist-label">
        <span style={{ color:"var(--gr)" }}>T {wPct}%</span>
        <span style={{ color:"var(--am)" }}>G {dPct}%</span>
        <span style={{ color:"var(--re)" }}>V {lPct}%</span>
        <span>{total} tips</span>
      </div>
    </div>
  );
}

// ── GROUP CARD ────────────────────────────────────────────────────────────
function GroupCard({ group, matches, isAdmin, myPreds, allPreds, onScore, onLock, onPred, toast }) {
  const gm = matches.filter(m => m.grp === group && m.phase === "group");
  const [ed, setEd] = useState(null);
  const [ts, setTs] = useState({ h:"", a:"" });
  const [pe, setPe] = useState(null);
  const [tp, setTp] = useState({ h:"", a:"" });
  const [sav, setSav] = useState(false);

  if (!gm.length) return <div className="empty"><div className="empty-i">⚽</div><div className="empty-t">Geen wedstrijden gevonden.</div></div>;

  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title" style={{ flexShrink:0 }}>Groep {group}</span>
        <span style={{ fontSize:10, color:"var(--t3)", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1, marginLeft:8 }}>
          {GROUP_TEAMS[group]?.map(t => {
            const parts = t.split(" ");
            const flag = parts[0];
            const name = parts.slice(1).join(" ");
            return `${flag} ${name}`;
          }).join(" · ")}
        </span>
      </div>
      {gm.map(m => {
        const mp  = myPreds.find(p => p.match_id === m.id);
        const done = m.home_goals != null && m.away_goals != null;
        const isE  = ed === m.id, isP = pe === m.id;
        // FIX #8 - admin kan altijd bewerken, ook vergrendelde wedstrijden
        const canEdit = isAdmin;
        const canP = !isAdmin && !m.locked;
        let cls = "", lbl = "";
        if (!isAdmin && mp && done) {
          const r = scorePts(mp.home_goals, mp.away_goals, m.home_goals, m.away_goals);
          cls = r.cls; lbl = r.label;
        }
        return (
          <div key={m.id} className="mr">
            <div className="mr-teams">
              <div className="mr-home">{m.home}</div>
              {canEdit && isE ? (
                <div className="score-edit" style={{ padding:"6px 8px" }}>
                  {/* FIX #6: gebruik parseInt en valideer 0 */}
                  <input type="number" min="0" max="20" className="ni" style={{ width:40, height:36, fontSize:16 }}
                    value={ts.h} onChange={e => setTs(s => ({ ...s, h: e.target.value }))} />
                  <span style={{ color:"var(--t3)", fontWeight:700 }}>–</span>
                  <input type="number" min="0" max="20" className="ni" style={{ width:40, height:36, fontSize:16 }}
                    value={ts.a} onChange={e => setTs(s => ({ ...s, a: e.target.value }))} />
                  <button className="btn-confirm" onClick={async () => {
                    // FIX #6: "0" mag niet null worden
                    const hg = ts.h === "" ? null : parseInt(ts.h, 10);
                    const ag = ts.a === "" ? null : parseInt(ts.a, 10);
                    await onScore(m.id, { home_goals: hg, away_goals: ag });
                    setEd(null);
                  }}>✓</button>
                  <button className="btn btn-out btn-sm" onClick={() => setEd(null)}>✕</button>
                </div>
              ) : (
                <div className={`score-btn${done ? " done" : ""}${canEdit ? " editable" : ""}`}
                  onClick={() => { if (canEdit) { setEd(m.id); setTs({ h: m.home_goals ?? "", a: m.away_goals ?? "" }); } }}>
                  {done ? `${m.home_goals}–${m.away_goals}` : "vs"}
                </div>
              )}
              <div className="mr-away">{m.away}</div>
            </div>
            <div className="mr-meta">
              <span className="mr-time">
                <span style={{ background:"var(--c3)", borderRadius:4, padding:"2px 6px", fontSize:10, fontWeight:700, color:"var(--t2)" }}>{m.match_date}</span>
              </span>
              <div className="mr-actions">
                {/* FIX #8: toon "te laat" als wedstrijd vergrendeld */}
                {m.locked && !isAdmin && <span className="lock-tag">🔒</span>}
                {!isAdmin && mp && done && <span className={`pts-badge ${cls}`}>{lbl}</span>}
                {!isAdmin && mp && !isP && <span className="pill">{mp.home_goals}–{mp.away_goals}</span>}
                {canP && !isP && (
                  <button className="btn btn-out btn-sm" onClick={() => { setPe(m.id); setTp({ h: mp?.home_goals ?? "", a: mp?.away_goals ?? "" }); }}>
                    {mp ? "✏️" : "⚽ Tip"}
                  </button>
                )}
                {!isAdmin && m.locked && !mp && <span className="too-late">Te laat</span>}
                {isAdmin && !isE && (
                  <button className="btn btn-out btn-sm" onClick={() => onLock(m.id, m.locked)}>
                    {m.locked ? "🔓" : "🔒"}
                  </button>
                )}
              </div>
            </div>
            {/* Voorspellingsverdeling verborgen voor spanning */}
            {!isAdmin && isP && (
              <div className="score-edit">
                <span style={{ fontSize:11, color:"var(--t2)", fontWeight:700 }}>Jouw tip:</span>
                <input type="number" min="0" max="20" className="ni" value={tp.h} onChange={e => setTp(p => ({ ...p, h: e.target.value }))} />
                <span style={{ color:"var(--t3)", fontWeight:700 }}>–</span>
                <input type="number" min="0" max="20" className="ni" value={tp.a} onChange={e => setTp(p => ({ ...p, a: e.target.value }))} />
                <button className="btn-confirm" disabled={sav} onClick={async () => {
                  setSav(true);
                  // FIX #7: stuur integers
                  const ok = await onPred(m.id, parseInt(tp.h, 10), parseInt(tp.a, 10));
                  setSav(false);
                  if (ok !== false) setPe(null);
                }}>{sav ? "..." : "✓"}</button>
                <button className="btn btn-out btn-sm" onClick={() => setPe(null)}>✕</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── KO CARD ───────────────────────────────────────────────────────────────
function KOCard({ phase, matches, isAdmin, myPreds, allPreds, onScore, onLock, onPred, allTeams }) {
  const km = matches.filter(m => m.phase === phase);
  const [ed, setEd] = useState(null);
  const [ts, setTs] = useState({ h:"", a:"", home:"", away:"", homeCustom:"", awayCustom:"" });
  const [pe, setPe] = useState(null);
  const [tp, setTp] = useState({ h:"", a:"" });
  const [sav, setSav] = useState(false);
  const phaseInfo = KO_PHASES.find(p => p.id === phase);

  if (!km.length) return <div className="empty"><div className="empty-i">🥊</div><div className="empty-t">Geen wedstrijden in deze fase.</div></div>;

  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">{phaseInfo?.full || phase}</span>
        <span style={{ fontSize:10, color:"var(--t3)" }}>{km.length} wedstrijden</span>
      </div>
      {km.map(m => {
        const mp = myPreds.find(p => p.match_id === m.id);
        const done = m.home_goals != null && m.away_goals != null;
        const hasTeams = !isPlaceholder(m.home) && !isPlaceholder(m.away);
        const isE = ed === m.id, isP = pe === m.id;
        // FIX #8: admin kan altijd bewerken
        const canEdit = isAdmin;
        const canP = !isAdmin && !m.locked && hasTeams;
        let cls = "", lbl = "";
        if (!isAdmin && mp && done) {
          const r = scorePts(mp.home_goals, mp.away_goals, m.home_goals, m.away_goals);
          cls = r.cls; lbl = r.label;
        }
        return (
          <div key={m.id} className="mr">
            <div style={{ fontSize:10, color:"var(--t3)", fontWeight:600, marginBottom:6 }}>📅 {m.match_date}</div>
            {canEdit && isE ? (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <div style={{ display:"flex", gap:7 }}>
                  <div style={{ flex:1 }}>
                    <div className="lbl" style={{ marginBottom:4 }}>Thuisteam</div>
                    <select className="sel" style={{ fontSize:13, padding:"8px 11px" }} value={ts.home} onChange={e => setTs(s => ({ ...s, home: e.target.value }))}>
                      <option value="">— Kies team —</option>
                      {allTeams.map(t => <option key={t} value={t}>{t}</option>)}
                      <option value="custom">Handmatig...</option>
                    </select>
                    {ts.home === "custom" && <input className="inp" style={{ marginTop:5, fontSize:13, padding:"8px 11px" }} placeholder="Naam thuisteam..." value={ts.homeCustom} onChange={e => setTs(s => ({ ...s, homeCustom: e.target.value }))} />}
                  </div>
                  <div style={{ flex:1 }}>
                    <div className="lbl" style={{ marginBottom:4 }}>Uitteam</div>
                    <select className="sel" style={{ fontSize:13, padding:"8px 11px" }} value={ts.away} onChange={e => setTs(s => ({ ...s, away: e.target.value }))}>
                      <option value="">— Kies team —</option>
                      {allTeams.map(t => <option key={t} value={t}>{t}</option>)}
                      <option value="custom">Handmatig...</option>
                    </select>
                    {ts.away === "custom" && <input className="inp" style={{ marginTop:5, fontSize:13, padding:"8px 11px" }} placeholder="Naam uitteam..." value={ts.awayCustom} onChange={e => setTs(s => ({ ...s, awayCustom: e.target.value }))} />}
                  </div>
                </div>
                <div className="score-edit">
                  <span style={{ fontSize:11, color:"var(--t2)" }}>Score:</span>
                  <input type="number" min="0" max="20" className="ni" value={ts.h} onChange={e => setTs(s => ({ ...s, h: e.target.value }))} />
                  <span style={{ color:"var(--t3)", fontWeight:700 }}>–</span>
                  <input type="number" min="0" max="20" className="ni" value={ts.a} onChange={e => setTs(s => ({ ...s, a: e.target.value }))} />
                  <button className="btn-confirm" onClick={async () => {
                    const homeVal = ts.home === "custom" ? ts.homeCustom : ts.home;
                    const awayVal = ts.away === "custom" ? ts.awayCustom : ts.away;
                    const hg = ts.h === "" ? null : parseInt(ts.h, 10);
                    const ag = ts.a === "" ? null : parseInt(ts.a, 10);
                    await onScore(m.id, { home: homeVal || null, away: awayVal || null, home_goals: hg, away_goals: ag });
                    setEd(null);
                  }}>✓ Opslaan</button>
                  <button className="btn btn-out btn-sm" onClick={() => setEd(null)}>✕</button>
                </div>
              </div>
            ) : (
              <div className="mr-teams">
                <div className="mr-home" style={{ color: hasTeams ? "var(--t1)" : "var(--t3)", fontStyle: hasTeams ? "normal" : "italic", fontSize: hasTeams ? 12 : 11 }}>
                  {m.home || "Nog onbekend"}
                </div>
                <div className={`score-btn${done ? " done" : ""}${canEdit ? " editable" : ""}`}
                  onClick={() => { if (canEdit) { setEd(m.id); setTs({ h: m.home_goals ?? "", a: m.away_goals ?? "", home: m.home ?? "", away: m.away ?? "", homeCustom:"", awayCustom:"" }); } }}>
                  {done ? `${m.home_goals}–${m.away_goals}` : hasTeams ? "vs" : "?"}
                </div>
                <div className="mr-away" style={{ color: hasTeams ? "var(--t1)" : "var(--t3)", fontStyle: hasTeams ? "normal" : "italic", fontSize: hasTeams ? 12 : 11 }}>
                  {m.away || "Nog onbekend"}
                </div>
              </div>
            )}
            <div className="mr-meta">
              <span></span>
              <div className="mr-actions">
                {m.locked && !isAdmin && <span className="lock-tag">🔒</span>}
                {!isAdmin && mp && done && <span className={`pts-badge ${cls}`}>{lbl}</span>}
                {!isAdmin && mp && !isP && <span className="pill">{mp.home_goals}–{mp.away_goals}</span>}
                {canP && !isP && (
                  <button className="btn btn-out btn-sm" onClick={() => { setPe(m.id); setTp({ h: mp?.home_goals ?? "", a: mp?.away_goals ?? "" }); }}>
                    {mp ? "✏️ Wijzig" : "⚽ Voorspel"}
                  </button>
                )}
                {!isAdmin && m.locked && !mp && hasTeams && <span className="too-late">Te laat</span>}
                {isAdmin && !isE && <button className="btn btn-out btn-sm" onClick={() => onLock(m.id, m.locked)}>{m.locked ? "🔓 Open" : "🔒 Sluit"}</button>}
              </div>
            </div>
            {!hasTeams && !isAdmin && <div style={{ fontSize:10, color:"var(--t3)", textAlign:"center", marginTop:4, fontStyle:"italic" }}>Teams nog onbekend — je tip wordt opgeslagen</div>}
            {/* Voorspellingsverdeling verborgen voor spanning */}
            {!isAdmin && isP && (
              <div className="score-edit">
                <span style={{ fontSize:11, color:"var(--t2)", fontWeight:700 }}>Jouw tip:</span>
                <input type="number" min="0" max="20" className="ni" value={tp.h} onChange={e => setTp(p => ({ ...p, h: e.target.value }))} />
                <span style={{ color:"var(--t3)", fontWeight:700 }}>–</span>
                <input type="number" min="0" max="20" className="ni" value={tp.a} onChange={e => setTp(p => ({ ...p, a: e.target.value }))} />
                <button className="btn-confirm" disabled={sav} onClick={async () => {
                  setSav(true);
                  await onPred(m.id, parseInt(tp.h, 10), parseInt(tp.a, 10));
                  setSav(false); setPe(null);
                }}>{sav ? "..." : "✓"}</button>
                <button className="btn btn-out btn-sm" onClick={() => setPe(null)}>✕</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── BONUS USER — FIX #2/#3 ────────────────────────────────────────────────
function BonusUser({ myAns, bonusR, onSave, wkStarted }) {
  // FIX #3: sync state als myAns verandert
  const [ans, setAns] = useState(myAns || {});
  useEffect(() => { setAns(myAns || {}); }, [myAns]);
  const [sav, setSav] = useState(false);
  // FIX #2: dubbele conditie samengevoegd
  const correct = BONUS_QS.filter(q => bonusR?.[q.id] && ans[q.id]?.toString().toLowerCase().trim() === bonusR[q.id].toString().toLowerCase().trim()).length;
  const locked = wkStarted;

  return (
    <div>
      <div className="infobox">
        <span className="infobox-i">💡</span>
        <div className="infobox-t">
          10 punten per goed antwoord · {BONUS_QS.length} vragen · max {BONUS_QS.length * 10} punten.
          {locked && <span style={{ color:"var(--am)", fontWeight:700 }}> 🔒 Gesloten — WK is begonnen.</span>}
          {bonusR && <span style={{ color:"var(--gr)", fontWeight:700 }}> Jij hebt {correct}/{BONUS_QS.length} goed!</span>}
        </div>
      </div>
      {BONUS_QS.map((q, i) => {
        const r = bonusR?.[q.id];
        const a = ans[q.id] || "";
        const ok = r && a.toString().toLowerCase().trim() === r.toString().toLowerCase().trim();
        return (
          <div key={q.id} className={`bq${r ? ok ? " ok" : " no" : !a ? " empty" : ""}`} style={{ animationDelay:`${i * 40}ms` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:9, gap:8 }}>
              <span style={{ fontWeight:700, fontSize:13, flex:1 }}>{q.label}</span>
              {r && <span className={`pts-badge ${ok ? "pts-exact" : "pts-zero"}`} style={{ flexShrink:0 }}>{ok ? "+10 ✓" : "0 ✗"}</span>}
            </div>
            {locked ? (
              <div style={{ fontSize:13, fontWeight:700, color: a ? "var(--t1)" : "var(--t3)", fontStyle: a ? "normal" : "italic" }}>
                {a || "— niet ingevuld —"}
              </div>
            ) : q.type === "team"
              ? <select className="sel" value={a} onChange={e => setAns(v => ({ ...v, [q.id]: e.target.value }))}>
                  <option value="">— Kies een land —</option>
                  {ALL_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              : <input className="inp" type={q.type === "number" ? "number" : "text"}
                  placeholder={q.type === "number" ? "Aantal goals..." : "Naam speler..."}
                  value={a} onChange={e => setAns(v => ({ ...v, [q.id]: e.target.value }))} />
            }
            {r && <div style={{ fontSize:11, color:"var(--t3)", marginTop:7 }}>Correct antwoord: <b style={{ color:"var(--t1)" }}>{r}</b></div>}
          </div>
        );
      })}
      {!locked && (
        <button className="btn btn-green" disabled={sav} onClick={async () => { setSav(true); await onSave(ans); setSav(false); }}>
          {sav ? "Opslaan..." : "✓ Antwoorden opslaan"}
        </button>
      )}
    </div>
  );
}

// ── BONUS ADMIN ───────────────────────────────────────────────────────────
function BonusAdmin({ bonusR, onSave }) {
  const [res, setRes] = useState(bonusR || {});
  const [sav, setSav] = useState(false);
  useEffect(() => { setRes(bonusR || {}); }, [bonusR]);
  return (
    <div>
      <div className="infobox">
        <span className="infobox-i">👑</span>
        <div className="infobox-t">Vul de correcte antwoorden in. Punten worden direct bijgewerkt voor alle deelnemers.</div>
      </div>
      {BONUS_QS.map(q => (
        <div key={q.id} className="bq">
          <div style={{ fontWeight:700, fontSize:13, marginBottom:9 }}>{q.label}</div>
          {q.type === "team"
            ? <select className="sel" value={res[q.id] || ""} onChange={e => setRes(r => ({ ...r, [q.id]: e.target.value }))}>
                <option value="">— Kies een land —</option>
                {ALL_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            : <input className="inp" type={q.type === "number" ? "number" : "text"}
                placeholder={q.type === "number" ? "Aantal goals..." : "Naam speler..."}
                value={res[q.id] || ""} onChange={e => setRes(r => ({ ...r, [q.id]: e.target.value }))} />
          }
        </div>
      ))}
      <button className="btn btn-green" disabled={sav} onClick={async () => { setSav(true); await onSave(res); setSav(false); }}>
        {sav ? "Opslaan..." : "✓ Resultaten opslaan"}
      </button>
    </div>
  );
}

// ── GROEPSTAND VOORSPELLEN — FIX #4 ──────────────────────────────────────
function StandingPredict({ group, myStandingPred, onSave, wkStarted, realStanding }) {
  const teams = GROUP_TEAMS[group] || [];
  const [order, setOrder] = useState(() => myStandingPred || [...teams]);
  const [sav, setSav] = useState(false);
  const locked = wkStarted;

  // FIX #4: beide dependencies in array
  useEffect(() => {
    setOrder(myStandingPred || [...teams]);
  }, [group, myStandingPred]);

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };

  const pts = realStanding ? calcStandingPts(order, realStanding.map(r => r.team)) : null;
  const posColors = ["#f59e0b","#94a3b8","#cd7f32","var(--t3)"];

  return (
    <div className="stand-pred" style={{ marginTop:10 }}>
      <div className="stand-pred-title">
        🎯 Jouw eindstand voorspelling · 5pt per juiste positie
        {locked && <span style={{ color:"var(--am)", marginLeft:6 }}>🔒 Gesloten</span>}
        {pts !== null && pts > 0 && <span style={{ color:"var(--gr)", marginLeft:6 }}>+{pts}pt</span>}
      </div>
      {order.map((team, i) => (
        <div key={team} className="stand-pred-row">
          <div className="stand-pred-pos" style={{ background: posColors[i]+"20", color: posColors[i], border:`1.5px solid ${posColors[i]}40` }}>{i+1}</div>
          <div style={{ flex:1, fontSize:12, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{team}</div>
          {!locked && (
            <div style={{ display:"flex", gap:3, flexShrink:0 }}>
              <button className="btn btn-out btn-sm btn-ic" style={{ width:26, height:26, fontSize:11 }} onClick={() => move(i,-1)} disabled={i===0}>↑</button>
              <button className="btn btn-out btn-sm btn-ic" style={{ width:26, height:26, fontSize:11 }} onClick={() => move(i,1)} disabled={i===order.length-1}>↓</button>
            </div>
          )}
        </div>
      ))}
      {!locked && (
        <button className="btn btn-green" style={{ marginTop:10 }} disabled={sav} onClick={async () => { setSav(true); await onSave(group, order); setSav(false); }}>
          {sav ? "Opslaan..." : "✓ Eindstand opslaan"}
        </button>
      )}
    </div>
  );
}

// ── AUTH PAGE ─────────────────────────────────────────────────────────────
function AuthPage({ mode, setMode, form, setForm, err, loading, onLogin, onRegister }) {
  const f = k => e => setForm(x => ({ ...x, [k]: e.target.value }));
  const [showPw,  setShowPw]  = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  return (
    <div className="auth" style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 20px", position:"relative", overflow:"hidden" }}>
      <style>{CSS}</style>

      {/* Achtergrond effecten */}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 0%,rgba(255,107,0,.12),transparent 60%),radial-gradient(ellipse at 100% 100%,rgba(255,179,71,.07),transparent 50%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", top:-60, left:-60, width:300, height:300, borderRadius:"50%", background:"rgba(255,107,0,.04)", filter:"blur(60px)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-80, right:-60, width:350, height:350, borderRadius:"50%", background:"rgba(251,191,36,.04)", filter:"blur(80px)", pointerEvents:"none" }} />


      {/* Scrollende vlaggen ticker — alle 48 deelnemende landen */}
      <div style={{ position:"absolute", top:0, left:0, right:0, overflow:"hidden", height:44, pointerEvents:"none" }}>
        <div style={{ display:"flex", gap:18, animation:"ticker 35s linear infinite", whiteSpace:"nowrap", paddingTop:8 }}>
          {["🇲🇽","🇿🇦","🇰🇷","🇨🇿","🇨🇦","🇧🇦","🇶🇦","🇨🇭","🇧🇷","🇲🇦","🇭🇹","🏴󠁧󠁢󠁳󠁣󠁴󠁿","🇺🇸","🇵🇾","🇦🇺","🇹🇷","🇩🇪","🇨🇼","🇨🇮","🇪🇨","🇳🇱","🇯🇵","🇸🇪","🇹🇳","🇧🇪","🇪🇬","🇮🇷","🇳🇿","🇪🇸","🇨🇻","🇸🇦","🇺🇾","🇫🇷","🇸🇳","🇮🇶","🇳🇴","🇦🇷","🇩🇿","🇦🇹","🇯🇴","🇵🇹","🇨🇩","🇺🇿","🇨🇴","🏴󠁧󠁢󠁥󠁮󠁧󠁿","🇭🇷","🇬🇭","🇵🇦",
           "🇲🇽","🇿🇦","🇰🇷","🇨🇿","🇨🇦","🇧🇦","🇶🇦","🇨🇭","🇧🇷","🇲🇦","🇭🇹","🏴󠁧󠁢󠁳󠁣󠁴󠁿","🇺🇸","🇵🇾","🇦🇺","🇹🇷","🇩🇪","🇨🇼","🇨🇮","🇪🇨","🇳🇱","🇯🇵","🇸🇪","🇹🇳","🇧🇪","🇪🇬","🇮🇷","🇳🇿","🇪🇸","🇨🇻","🇸🇦","🇺🇾","🇫🇷","🇸🇳","🇮🇶","🇳🇴","🇦🇷","🇩🇿","🇦🇹","🇯🇴","🇵🇹","🇨🇩","🇺🇿","🇨🇴","🏴󠁧󠁢󠁥󠁮󠁧󠁿","🇭🇷","🇬🇭","🇵🇦"
          ].map((flag,i) => (
            <span key={i} style={{ fontSize:24, opacity:.35, flexShrink:0 }}>{flag}</span>
          ))}
        </div>
      </div>

      {/* Scrollende vlaggen onderaan */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, overflow:"hidden", height:44, pointerEvents:"none" }}>
        <div style={{ display:"flex", gap:18, animation:"ticker2 40s linear infinite", whiteSpace:"nowrap", paddingTop:8 }}>
          {["🏴󠁧󠁢󠁥󠁮󠁧󠁿","🇭🇷","🇬🇭","🇵🇦","🇵🇹","🇨🇩","🇺🇿","🇨🇴","🇦🇷","🇩🇿","🇦🇹","🇯🇴","🇫🇷","🇸🇳","🇮🇶","🇳🇴","🇪🇸","🇨🇻","🇸🇦","🇺🇾","🇧🇪","🇪🇬","🇮🇷","🇳🇿","🇳🇱","🇯🇵","🇸🇪","🇹🇳","🇩🇪","🇨🇼","🇨🇮","🇪🇨","🇺🇸","🇵🇾","🇦🇺","🇹🇷","🇧🇷","🇲🇦","🇭🇹","🏴󠁧󠁢󠁳󠁣󠁴󠁿","🇨🇦","🇧🇦","🇶🇦","🇨🇭","🇲🇽","🇿🇦","🇰🇷","🇨🇿",
           "🏴󠁧󠁢󠁥󠁮󠁧󠁿","🇭🇷","🇬🇭","🇵🇦","🇵🇹","🇨🇩","🇺🇿","🇨🇴","🇦🇷","🇩🇿","🇦🇹","🇯🇴","🇫🇷","🇸🇳","🇮🇶","🇳🇴","🇪🇸","🇨🇻","🇸🇦","🇺🇾","🇧🇪","🇪🇬","🇮🇷","🇳🇿","🇳🇱","🇯🇵","🇸🇪","🇹🇳","🇩🇪","🇨🇼","🇨🇮","🇪🇨","🇺🇸","🇵🇾","🇦🇺","🇹🇷","🇧🇷","🇲🇦","🇭🇹","🏴󠁧󠁢󠁳󠁣󠁴󠁿","🇨🇦","🇧🇦","🇶🇦","🇨🇭","🇲🇽","🇿🇦","🇰🇷","🇨🇿"
          ].map((flag,i) => (
            <span key={i} style={{ fontSize:24, opacity:.25, flexShrink:0 }}>{flag}</span>
          ))}
        </div>
      </div>

      <div style={{ width:"100%", maxWidth:400, position:"relative", zIndex:1 }}>

        {/* Hero */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ position:"relative", display:"inline-block", marginBottom:14 }}>
            <div style={{ fontSize:64, filter:"drop-shadow(0 0 24px rgba(251,191,36,.5))", lineHeight:1 }}>🏆</div>
            <div style={{ position:"absolute", inset:-8, borderRadius:"50%", background:"radial-gradient(circle,rgba(251,191,36,.15),transparent 70%)", animation:"pulse2 2s ease-in-out infinite" }} />
          </div>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:38, letterSpacing:1, lineHeight:1 }}>
            WK <span style={{ color:"var(--gr)", textShadow:"0 0 20px rgba(0,201,125,.4)" }}>2026</span>
          </div>
          <div style={{ fontWeight:900, fontSize:13, color:"var(--am)", letterSpacing:3, textTransform:"uppercase", marginTop:6 }}>Boland's Special</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:12, flexWrap:"wrap" }}>
            <div style={{ background:"rgba(255,107,0,.1)", border:"1px solid rgba(255,107,0,.25)", borderRadius:20, padding:"6px 16px", fontSize:12, color:"var(--gr)", fontWeight:700, display:"flex", alignItems:"center", gap:6 }}>
              👑 Georganiseerd door <span style={{color:"#fff8ee", fontWeight:900}}>Ramon Boland</span>
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{ background:"var(--c1)", border:"1px solid rgba(255,107,0,.15)", borderRadius:20, padding:"22px 20px", boxShadow:"0 20px 60px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.03), 0 0 40px rgba(0,201,125,.08)" }}>
          {/* Tabs */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", background:"var(--bg)", borderRadius:12, padding:3, gap:3, marginBottom:20 }}>
            {["login","register"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding:"11px 8px", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", transition:"all .2s",
                background: mode===m ? "var(--gr)" : "transparent",
                color: mode===m ? "#000" : "var(--t3)",
                boxShadow: mode===m ? "0 2px 8px rgba(0,201,125,.3)" : "none",
              }}>
                {m==="login" ? "🔑 Inloggen" : "✨ Aanmaken"}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:700, color:"var(--t3)", textTransform:"uppercase", letterSpacing:.5, display:"block", marginBottom:7 }}>Gebruikersnaam</label>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:16, pointerEvents:"none" }}>👤</span>
              <input className="inp" placeholder="Jouw naam..." value={form.u} onChange={f("u")} autoCapitalize="none" autoCorrect="off"
                style={{ paddingLeft:38 }}
                onKeyDown={e => e.key==="Enter" && (mode==="login" ? onLogin() : onRegister())} />
            </div>
          </div>
          <div style={{ marginBottom: mode==="register" ? 14 : 20 }}>
            <label style={{ fontSize:11, fontWeight:700, color:"var(--t3)", textTransform:"uppercase", letterSpacing:.5, display:"block", marginBottom:7 }}>Wachtwoord</label>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:16, pointerEvents:"none" }}>🔒</span>
              <input className="inp" type={showPw ? "text" : "password"} placeholder="••••••••" value={form.p} onChange={f("p")} style={{ paddingLeft:38, paddingRight:42 }}
                onKeyDown={e => e.key==="Enter" && (mode==="login" ? onLogin() : onRegister())} />
              <button onClick={() => setShowPw(s => !s)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", fontSize:16, cursor:"pointer", color:"var(--t3)", padding:4 }}>
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          {mode==="register" && (
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"var(--t3)", textTransform:"uppercase", letterSpacing:.5, display:"block", marginBottom:7 }}>Bevestig wachtwoord</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:16, pointerEvents:"none" }}>🔒</span>
                <input className="inp" type={showPw2 ? "text" : "password"} placeholder="••••••••" value={form.p2} onChange={f("p2")} style={{ paddingLeft:38, paddingRight:42 }}
                  onKeyDown={e => e.key==="Enter" && onRegister()} />
                <button onClick={() => setShowPw2(s => !s)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", fontSize:16, cursor:"pointer", color:"var(--t3)", padding:4 }}>
                  {showPw2 ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
          )}

          {err && <div className="errbox" style={{ marginBottom:14 }}>{err}</div>}

          <button className="btn btn-green" disabled={loading} onClick={mode==="login" ? onLogin : onRegister}
            style={{ fontSize:15, fontWeight:800, letterSpacing:.5, boxShadow:"0 4px 20px rgba(0,201,125,.35)", height:52 }}>
            {loading ? <span className="spin">⚽</span> : mode==="login" ? "Inloggen →" : "Account aanmaken →"}
          </button>

          <div style={{ textAlign:"center", marginTop:16, fontSize:13, color:"var(--t3)" }}>
            {mode==="login" ? "Nog geen account? " : "Al een account? "}
            <button onClick={() => setMode(mode==="login" ? "register" : "login")}
              style={{ background:"none", border:"none", color:"var(--gr)", fontWeight:700, fontSize:13, cursor:"pointer", textDecoration:"underline" }}>
              {mode==="login" ? "Aanmaken" : "Inloggen"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse2 { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.1)} }
        @keyframes float0 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
        @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes ticker2 { from{transform:translateX(-50%)} to{transform:translateX(0)} }
        @keyframes tickerV { from{transform:translateY(0)} to{transform:translateY(-50%)} }
        @keyframes tickerV2 { from{transform:translateY(-50%)} to{transform:translateY(0)} }
      `}</style>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────
export default function App() {
  const [matches,       setMatches]       = useState([]);
  const [users,         setUsers]         = useState([]);
  const [preds,         setPreds]         = useState([]);
  const [bonusA,        setBonusA]        = useState([]);
  const [bonusR,        setBonusR]        = useState(null);
  const [standingPreds, setStandingPreds] = useState([]);
  const [session,       setSession]       = useState(() => { try { return JSON.parse(localStorage.getItem("wkp2026")); } catch { return null; } });
  const [tab,           setTab]           = useState("stand");
  const [authMode,      setAuthMode]      = useState("login");
  const [form,          setForm]          = useState({ u:"", p:"", p2:"" });
  const [err,           setErr]           = useState("");
  const [loading,       setLoading]       = useState(false);
  const [booting,       setBooting]       = useState(true);
  const [grp,           setGrp]           = useState("A");
  const [kphase,        setKphase]        = useState("r32");
  const [modal,         setModal]         = useState(null);
  const [modalInput,    setModalInput]    = useState("");
  const [modalLoading,  setModalLoading]  = useState(false);
  const [potN,          setPotN]          = useState(10);
  const [twinPopup,     setTwinPopup]     = useState(null);
  const [ptsPopup,      setPtsPopup]      = useState(null);
  const [importing,     setImporting]     = useState(false);
  const [importLog,     setImportLog]     = useState([]);
  const [autoRefresh,   setAutoRefresh]   = useState(false);
  const [lastRefresh,   setLastRefresh]   = useState(null);
  const [lockAllLoading,setLockAllLoading]= useState(false);
  const [exportText,    setExportText]    = useState(null);

  // FIX #17: toast met ref
  const [toast, showToast] = useToast();

  const isAdmin  = session?.isAdmin === true;
  const myPreds  = useMemo(() => preds.filter(p => p.user_id === session?.id), [preds, session?.id]);
  const myBonusAns = useMemo(() => bonusA.find(b => b.user_id === session?.id)?.answers || {}, [bonusA, session?.id]);
  const countdown  = useCountdown(WK_START);
  const wkStarted  = countdown.started;

  // FIX #10: Map voor O(1) lookups
  const matchMap = useMemo(() => new Map(matches.map(m => [m.id, m])), [matches]);

  // FIX #9: voorbereken standings per groep één keer
  const groupStandings = useMemo(() => {
    const result = {};
    for (const g of GROUPS) result[g] = getStanding(matches, g);
    return result;
  }, [matches]);

  // FIX #8/#9: leaderboard via useMemo — niet bij elke render herberekend
  const leaderboard = useMemo(() => {
    const standPtsCache = {};
    for (const u of users) {
      let sp = 0;
      for (const g of GROUPS) {
        const pred = standingPreds.find(s => s.user_id === u.id && s.group === g);
        if (!pred) continue;
        const real = groupStandings[g];
        const allDone = (GROUP_TEAMS[g] || []).every(() => {
          const gm = matches.filter(m => m.grp === g && m.phase === "group");
          return gm.length > 0 && gm.every(m => m.home_goals != null);
        });
        if (!allDone) continue;
        sp += calcStandingPts(pred.order, real.map(r => r.team));
      }
      standPtsCache[u.id] = sp;
    }
    return [...users].filter(u => u.username.toLowerCase() !== 'admin').map(u => {
      const up = preds.filter(p => p.user_id === u.id);
      const { pts, exact } = calcMatchPts(up, matchMap);
      const ba = bonusA.find(b => b.user_id === u.id)?.answers || {};
      const bp = calcBonusPts(ba, bonusR);
      const sp = standPtsCache[u.id] || 0;
      return { ...u, pts: pts+bp+sp, mp: pts, bp, sp, exact, pc: up.length };
    }).sort((a,b) => b.pts - a.pts || b.exact - a.exact);
  }, [users, preds, bonusA, bonusR, standingPreds, matchMap, groupStandings, matches]);

  const maxPts = leaderboard[0]?.pts || 1;

  // FIX #15: nextMatch niet op fragiele startsWith maar isPlaceholder helper
  const nextMatch = useMemo(() => matches
    .filter(m => m.home_goals == null && !isPlaceholder(m.home) && !isPlaceholder(m.away))
    .sort((a,b) => {
      const da = a.match_date ? new Date(a.match_date.split(" ")[0]) : new Date(9e15);
      const db = b.match_date ? new Date(b.match_date.split(" ")[0]) : new Date(9e15);
      return da - db || a.id - b.id;
    })[0], [matches]);

  // ── LOAD ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [{ data:m },{ data:u },{ data:p },{ data:ba },{ data:br },{ data:sp }] = await Promise.all([
        sb.from("matches").select("*").order("id"),
        sb.from("users").select("id,username"),
        sb.from("predictions").select("*"),
        sb.from("bonus_answers").select("*"),
        sb.from("bonus_results").select("*").maybeSingle(),
        sb.from("standing_predictions").select("*"),
      ]);
      if (m)  setMatches(m);
      if (u)  setUsers(u);
      if (p)  setPreds(p);
      if (ba) setBonusA(ba);
      if (br) { setBonusR(br?.answers || null); if (br?.answers?._potN) setPotN(br.answers._potN); }
      if (sp) setStandingPreds(sp);
      setBooting(false);
    })();
  }, []);

  useEffect(() => { try { localStorage.setItem("wkp2026", JSON.stringify(session)); } catch {} }, [session]);

  // ── AUTO REFRESH UITSLAGEN ELKE 5 MINUTEN ────────────────────────────
  useEffect(() => {
    if (!autoRefresh) return;
    const doRefresh = async () => {
      const { data:m } = await sb.from("matches").select("*").order("id");
      if (m) setMatches(m);
      setLastRefresh(new Date());
    };
    doRefresh();
    const id = setInterval(doRefresh, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  // ── AUTH ──────────────────────────────────────────────────────────────
  const login = async () => {
    const { u, p } = form;
    if (!u || !p) return setErr("Vul alles in.");
    setLoading(true);
    const { data } = await sb.from("users").select("*").ilike("username", u).maybeSingle();
    setLoading(false);
    if (!data || data.pw_hash !== hashPw(p)) return setErr("Gebruikersnaam of wachtwoord onjuist.");
    setSession({ id: data.id, username: data.username, isAdmin: data.is_admin === true });
    setErr(""); setForm({ u:"", p:"", p2:"" });
  };

  const register = async () => {
    const { u, p, p2 } = form;
    if (!u || !p || !p2) return setErr("Vul alles in.");
    if (u.length < 3) return setErr("Naam minimaal 3 tekens.");
    if (p.length < 6) return setErr("Wachtwoord minimaal 6 tekens.");
    if (p !== p2) return setErr("Wachtwoorden komen niet overeen.");
    if (u.toLowerCase() === "admin") return setErr("Naam niet beschikbaar.");
    setLoading(true);
    const { data:ex } = await sb.from("users").select("id").ilike("username", u).maybeSingle();
    if (ex) { setLoading(false); return setErr("Naam al in gebruik."); }
    const { data:nu, error } = await sb.from("users").insert({ username:u, pw_hash:hashPw(p) }).select().single();
    setLoading(false);
    if (error || !nu) return setErr("Er ging iets mis, probeer opnieuw.");
    setUsers(us => [...us, { id:nu.id, username:nu.username }]);
    setSession({ id:nu.id, username:nu.username, isAdmin:false });
    setErr(""); setForm({ u:"", p:"", p2:"" });
    showToast(`Welkom ${nu.username}! 🎉`);
  };

  // ── DATA ACTIONS — FIX #14: error handling ────────────────────────────
  const savePred = async (mid, hg, ag) => {
    if (!session?.id) return false;
    const ex = preds.find(p => p.user_id === session.id && p.match_id === mid);
    if (ex) {
      const { error } = await sb.from("predictions").update({ home_goals:hg, away_goals:ag }).eq("id", ex.id);
      if (error) { showToast("❌ Opslaan mislukt", 3000); return false; }
      setPreds(ps => ps.map(p => p.id === ex.id ? { ...p, home_goals:hg, away_goals:ag } : p));
    } else {
      const { data, error } = await sb.from("predictions").insert({ user_id:session.id, match_id:mid, home_goals:hg, away_goals:ag }).select().single();
      if (error) { showToast("❌ Opslaan mislukt", 3000); return false; }
      if (data) setPreds(ps => [...ps, data]);
    }
    // Check voor exacte uitslag — confetti!
    const m = matchMap.get(mid);
    if (m && m.home_goals != null) {
      const r = scorePts(hg, ag, m.home_goals, m.away_goals);
      if (r.pts === 5) {
        fireConfetti();
        setPtsPopup("+5 Exact! 🎯");
        setTimeout(() => setPtsPopup(null), 2500);
      }
    }
    // Twin detectie — wie heeft dezelfde tip ingevoerd?
    const twins = preds.filter(p =>
      p.match_id === mid &&
      p.user_id !== session.id &&
      +p.home_goals === +hg &&
      +p.away_goals === +ag
    ).map(p => users.find(u => u.id === p.user_id)?.username).filter(Boolean);
    if (twins.length > 0) {
      setTwinPopup({ names: twins });
      setTimeout(() => setTwinPopup(null), 3500);
    }
    showToast("✓ Voorspelling opgeslagen");
    return true;
  };

  const setScore = async (id, upd) => {
    const { error } = await sb.from("matches").update(upd).eq("id", id);
    if (error) { showToast("❌ Score opslaan mislukt", 3000); return; }
    setMatches(ms => ms.map(m => m.id === id ? { ...m, ...upd } : m));
  };

  const toggleLock = async (id, locked) => {
    const { error } = await sb.from("matches").update({ locked:!locked }).eq("id", id);
    if (error) { showToast("❌ Vergrendelen mislukt", 3000); return; }
    setMatches(ms => ms.map(m => m.id === id ? { ...m, locked:!locked } : m));
    showToast(locked ? "🔓 Wedstrijd geopend" : "🔒 Wedstrijd vergrendeld");
  };

  const deleteUser = async (uid, name) => {
    setModalLoading(true);
    const { error } = await sb.from("users").delete().eq("id", uid);
    setModalLoading(false);
    if (!error) {
      setUsers(us => us.filter(u => u.id !== uid));
      setPreds(ps => ps.filter(p => p.user_id !== uid));
      setBonusA(bs => bs.filter(b => b.user_id !== uid));
      setStandingPreds(sp => sp.filter(s => s.user_id !== uid));
      showToast(`🗑️ ${name} verwijderd`);
      setModal(null);
    } else showToast("❌ Fout bij verwijderen", 3000);
  };

  const resetPw = async (uid, pw) => {
    if (pw.length < 6) { showToast("❌ Minimum 6 tekens", 3000); return; }
    setModalLoading(true);
    const { error } = await sb.from("users").update({ pw_hash:hashPw(pw) }).eq("id", uid);
    setModalLoading(false);
    if (!error) { showToast("🔑 Wachtwoord gewijzigd"); setModal(null); }
    else showToast("❌ Fout bij wijzigen", 3000);
  };

  const saveBonus = async (answers) => {
    if (!session?.id) return;
    const ex = bonusA.find(b => b.user_id === session.id);
    if (ex) {
      await sb.from("bonus_answers").update({ answers }).eq("user_id", session.id);
      setBonusA(bs => bs.map(b => b.user_id === session.id ? { ...b, answers } : b));
    } else {
      const { data } = await sb.from("bonus_answers").insert({ user_id:session.id, answers }).select().single();
      if (data) setBonusA(bs => [...bs, data]);
    }
    showToast("✓ Bonus opgeslagen");
  };

  const saveBonusResults = async (res) => {
    const { data:ex } = await sb.from("bonus_results").select("*").maybeSingle();
    if (ex) await sb.from("bonus_results").update({ answers:res }).eq("id", ex.id);
    else await sb.from("bonus_results").insert({ answers:res });
    setBonusR(res); showToast("✓ Bonus resultaten opgeslagen");
  };

  const saveStandingPred = async (group, order) => {
    if (!session?.id) return;
    const ex = standingPreds.find(s => s.user_id === session.id && s.group === group);
    if (ex) {
      await sb.from("standing_predictions").update({ order }).eq("id", ex.id);
      setStandingPreds(sp => sp.map(s => s.id === ex.id ? { ...s, order } : s));
    } else {
      const { data } = await sb.from("standing_predictions").insert({ user_id:session.id, group, order }).select().single();
      if (data) setStandingPreds(sp => [...sp, data]);
    }
    showToast("✓ Eindstand opgeslagen");
  };

  // ── RENDER GUARDS ──────────────────────────────────────────────────────
  if (!session) return <AuthPage mode={authMode} setMode={setAuthMode} form={form} setForm={setForm} err={err} loading={loading} onLogin={login} onRegister={register} />;

  if (booting) return (
    <div style={{ minHeight:"100vh", background:"#080b12", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:14 }}>
      <style>{CSS}</style>
      <div className="spin" style={{ fontSize:28 }}>⚽</div>
      <div style={{ color:"#455575", fontSize:13, fontWeight:600 }}>Laden...</div>
    </div>
  );

  // Badge: wedstrijden vandaag zonder tip
  const today = new Date().toISOString().split("T")[0];
  const todayMatches = matches.filter(m => {
    if (!m.match_date) return false;
    const d = m.match_date.split(" ")[0];
    return d === today && m.home_goals == null && !m.locked;
  });
  const todayUntiped = !isAdmin && todayMatches.filter(m => !myPreds.find(p => p.match_id === m.id)).length > 0;

  const TABS = isAdmin
    ? [{ id:"stand",ic:"🏆",lb:"Stand" },{ id:"groepen",ic:"⚽",lb:"Groepen" },{ id:"ko",ic:"🥊",lb:"KO" },{ id:"standen",ic:"📊",lb:"Standen" },{ id:"bonus",ic:"🎯",lb:"Bonus" },{ id:"pot",ic:"💶",lb:"Pot" },{ id:"beheer",ic:"👑",lb:"Beheer" }]
    : [{ id:"stand",ic:"🏆",lb:"Stand" },{ id:"groepen",ic:"⚽",lb:"Groepen" },{ id:"ko",ic:"🥊",lb:"KO" },{ id:"standen",ic:"📊",lb:"Standen" },{ id:"bonus",ic:"🎯",lb:"Bonus" },{ id:"pot",ic:"💶",lb:"Pot" },{ id:"mijn",ic:"📋",lb:"Mijn" }];

  const myStandingPred = standingPreds.find(s => s.user_id === session?.id && s.group === grp)?.order;

  return (
    <div style={{ background:"#080b12", minHeight:"100vh" }}>
      <style>{CSS}</style>

      {toast && <div className={`toast${toast.startsWith("❌") ? " err" : ""}`}>{toast}</div>}

      {/* Twin popup */}
      {twinPopup && (
        <div className="twin-popup">
          <span>🤝</span>
          <span>{twinPopup.names.join(", ")} tipt hetzelfde!</span>
        </div>
      )}

      {/* Pts popup */}
      {ptsPopup && (
        <div className="twin-popup" style={{ borderColor:"var(--am)", color:"var(--am)" }}>
          <span>🎯</span>
          <span>{ptsPopup}</span>
        </div>
      )}

      {/* MODALS */}
      {modal?.type === "delete" && (
        <Modal title={`🗑️ ${modal.user.username} verwijderen?`} onClose={() => setModal(null)}>
          <div style={{ fontSize:13, color:"var(--t2)", marginBottom:16, lineHeight:1.5 }}>
            Alle voorspellingen van <b style={{ color:"var(--t1)" }}>{modal.user.username}</b> worden ook verwijderd. Dit kan niet ongedaan worden gemaakt.
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn btn-out" style={{ flex:1 }} onClick={() => setModal(null)}>Annuleren</button>
            <button className="btn btn-del" style={{ flex:1 }} disabled={modalLoading} onClick={() => deleteUser(modal.user.id, modal.user.username)}>
              {modalLoading ? "..." : "🗑️ Verwijderen"}
            </button>
          </div>
        </Modal>
      )}
      {modal?.type === "resetpw" && (
        <Modal title={`🔑 Wachtwoord van ${modal.user.username}`} onClose={() => setModal(null)}>
          <div className="fg">
            <label className="lbl">Nieuw wachtwoord (min. 6 tekens)</label>
            <input className="inp" type="password" placeholder="••••••••" value={modalInput} onChange={e => setModalInput(e.target.value)} autoFocus />
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn btn-out" style={{ flex:1 }} onClick={() => { setModal(null); setModalInput(""); }}>Annuleren</button>
            <button className="btn btn-green" style={{ flex:1 }} disabled={modalLoading || modalInput.length < 6} onClick={() => resetPw(modal.user.id, modalInput)}>
              {modalLoading ? "..." : "✓ Opslaan"}
            </button>
          </div>
        </Modal>
      )}

      {/* HEADER */}
      <header className="hdr">
        <div className="hdr-in">
          <div className="logo">
            <span style={{ fontSize:20 }}>⚽</span>
            <div className="logo-text">WK <span>2026</span></div>
            <span className="logo-chip" style={{ fontSize:8 }}>BOLAND'S SPECIAL</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            {isAdmin && <span style={{ background:"rgba(0,201,125,.15)", color:"var(--gr)", fontSize:9, fontWeight:900, borderRadius:4, padding:"2px 6px", letterSpacing:.5, border:"1px solid rgba(255,107,0,.15)", flexShrink:0 }}>ADMIN</span>}
            <span style={{ fontSize:11, color:"var(--t3)", fontWeight:700, maxWidth:70, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{session.username}</span>
            <button className="btn btn-out btn-sm" style={{ padding:"4px 8px", fontSize:11 }} onClick={() => { setSession(null); setTab("stand"); }}>Uit</button>
          </div>
        </div>
      </header>

      <div className="page">

        {/* ── STAND ── */}
        {tab === "stand" && (
          <div className="fu">
            <div className="banner">
              <div style={{ position:"relative", zIndex:1 }}>
                <div className="banner-flags"><span>🇺🇸</span><span>🇲🇽</span><span>🇨🇦</span></div>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                  <span style={{ fontSize:32, filter:"drop-shadow(0 0 10px rgba(0,201,125,.4))" }}>🏆</span>
                  <div>
                    <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:28, letterSpacing:.5, lineHeight:1 }}>WK <span style={{ color:"var(--gr)" }}>2026</span></div>
                    <div style={{ fontWeight:800, fontSize:13, color:"var(--am)", letterSpacing:2, textTransform:"uppercase", marginTop:2 }}>Boland's Special</div>
                  </div>
                </div>
                <div className="banner-divider" />
              </div>
            </div>

            {!countdown.started && (
              <div className="countdown">
                <div className="cd-title">⏱ Aftellen tot het WK begint</div>
                <div className="cd-boxes">
                  {[{n:countdown.d,l:"Dagen"},{n:countdown.h,l:"Uur"},{n:countdown.m,l:"Min"},{n:countdown.s,l:"Sec"}].map((c,i) => (
                    <div key={i} className="cd-box">
                      <span className="cd-num">{String(c.n).padStart(2,"0")}</span>
                      <span className="cd-lbl">{c.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {countdown.started && nextMatch && (
              <div className="next-match">
                <div className="nm-label">⚽ Volgende wedstrijd</div>
                <div className="nm-teams">
                  <span className="nm-team">{nextMatch.home}</span>
                  <span className="nm-vs">vs</span>
                  <span className="nm-team away">{nextMatch.away}</span>
                </div>
                <div style={{ fontSize:11, color:"var(--t3)", marginTop:6 }}>
                  📅 {nextMatch.match_date} · {nextMatch.phase === "group" ? `Groep ${nextMatch.grp}` : KO_PHASES.find(p => p.id === nextMatch.phase)?.full || nextMatch.phase}
                </div>
              </div>
            )}

            <div className="sec-title">Tussenstand</div>
            <div className="sec-sub">5pt exact · 3pt winnaar · +1pt per team goals · 10pt bonus · 5pt eindstand</div>

            {leaderboard.length === 0
              ? <div className="empty"><div className="empty-i">👥</div><div className="empty-t">Nog geen deelnemers.<br />Deel de link met je vrienden!</div></div>
              : <div className="card">
                {/* Tabel header */}
                <div style={{ display:"grid", gridTemplateColumns:"36px 36px 1fr 44px 44px 50px", gap:6, padding:"8px 14px", borderBottom:"1px solid var(--bd)" }}>
                  {["#","","Naam","Exact","Bonus","Totaal"].map((h,i) => (
                    <div key={i} style={{ fontSize:10, fontWeight:700, color:"var(--t3)", textTransform:"uppercase", letterSpacing:.6, textAlign: i<2?"center": i===2?"left":"center", ...(i===5?{textAlign:"right"}:{}) }}>{h}</div>
                  ))}
                </div>
                {leaderboard.map((u, i) => {
                  const isMe = u.id === session?.id;
                  const medals = ["🥇","🥈","🥉"];
                  const mc = ["#f59e0b","#94a3b8","#cd7f32"];
                  const color = avatarColor(u.username);
                  const pct = maxPts > 0 ? Math.round((u.pts / maxPts) * 100) : 0;
                  return (
                    <div key={u.id} style={{
                      display:"grid", gridTemplateColumns:"36px 36px 1fr 44px 44px 50px", gap:6,
                      padding:"11px 14px", borderBottom:"1px solid rgba(30,45,74,.4)",
                      alignItems:"center",
                      background: isMe ? "rgba(0,201,125,.06)" : "transparent",
                      borderLeft: isMe ? "2px solid var(--gr)" : "2px solid transparent",
                      animation:`fu .3s ease ${i*50}ms both`,
                    }}>
                      {/* Positie */}
                      <div style={{ textAlign:"center", fontSize: i<3?18:13, color:"var(--t3)", fontWeight:700 }}>
                        {i < 3 ? medals[i] : i+1}
                      </div>
                      {/* Avatar */}
                      <div style={{ width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:13, background:color+"25", border:`1.5px solid ${color}50`, color, flexShrink:0 }}>
                        {u.username[0].toUpperCase()}
                      </div>
                      {/* Naam + balk */}
                      <div style={{ minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
                          <span style={{ fontSize:13, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color: i<3 ? mc[i] : "var(--t1)" }}>{u.username}</span>
                          {isMe && <span style={{ background:"rgba(0,201,125,.15)", color:"var(--gr)", fontSize:9, fontWeight:900, borderRadius:3, padding:"1px 5px", border:"1px solid rgba(255,107,0,.15)", flexShrink:0 }}>JIJ</span>}
                        </div>
                        <div style={{ height:3, background:"var(--c3)", borderRadius:2, overflow:"hidden" }}>
                          <div style={{ width:`${pct}%`, height:"100%", background: i<3 ? mc[i] : color, borderRadius:2, transition:"width 1s ease" }} />
                        </div>
                      </div>
                      {/* Exact */}
                      <div style={{ fontSize:13, textAlign:"center", color:"var(--t2)" }}>{u.exact}×</div>
                      {/* Bonus */}
                      <div style={{ fontSize:13, textAlign:"center", color: u.bp>0 ? "var(--am)" : "var(--t3)" }}>{u.bp > 0 ? `+${u.bp}` : "—"}</div>
                      {/* Totaal */}
                      <div style={{ fontSize:17, fontWeight:700, textAlign:"right", color: i===0?"#f59e0b": i===1?"#94a3b8": i===2?"#cd7f32":"var(--gr)", fontFamily:"'Oswald',sans-serif" }}>
                        {isMe ? <AnimatedScore value={u.pts} style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:17 }} /> : u.pts}
                      </div>
                    </div>
                  );
                })}
              </div>
            }

            {leaderboard.length > 0 && (
              <div style={{ marginTop:16 }}>
                <div className="sec-title" style={{ fontSize:16 }}>📈 Statistieken</div>
                <div className="sec-sub">Vergelijk prestaties per categorie</div>
                <div className="card" style={{ marginBottom:8 }}>
                  <div className="card-head"><span className="card-title">Exacte uitslagen</span></div>
                  <div style={{ padding:"4px 14px 10px" }}>
                    {[...leaderboard].sort((a,b) => b.exact - a.exact).map(u => {
                      const color = avatarColor(u.username);
                      const max = leaderboard.reduce((m,x) => Math.max(m, x.exact), 0) || 1;
                      const pct = Math.round((u.exact / max) * 100);
                      return (
                        <div key={u.id} className="stat-row">
                          <div className="stat-avatar" style={{ background:color+"20", color, border:`1.5px solid ${color}40` }}>{u.username[0].toUpperCase()}</div>
                          <div className="stat-bar-wrap">
                            <div className="stat-name"><span>{u.username}</span><span style={{ color:"var(--gr)" }}>{u.exact}×</span></div>
                            <div className="stat-bar"><div className="stat-fill" style={{ width:`${pct}%`, background:color }} /></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {leaderboard.some(u => u.bp > 0) && (
                  <div className="card" style={{ marginBottom:8 }}>
                    <div className="card-head"><span className="card-title">Bonuspunten</span></div>
                    <div style={{ padding:"4px 14px 10px" }}>
                      {[...leaderboard].sort((a,b) => b.bp - a.bp).map(u => {
                        const color = avatarColor(u.username);
                        const max = leaderboard.reduce((m,x) => Math.max(m, x.bp), 0) || 1;
                        const pct = Math.round((u.bp / max) * 100);
                        return (
                          <div key={u.id} className="stat-row">
                            <div className="stat-avatar" style={{ background:color+"20", color, border:`1.5px solid ${color}40` }}>{u.username[0].toUpperCase()}</div>
                            <div className="stat-bar-wrap">
                              <div className="stat-name"><span>{u.username}</span><span style={{ color:"var(--am)" }}>+{u.bp}pt</span></div>
                              <div className="stat-bar"><div className="stat-fill" style={{ width:`${pct}%`, background:"var(--am)" }} /></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {leaderboard.some(u => u.sp > 0) && (
                  <div className="card">
                    <div className="card-head"><span className="card-title">Eindstand punten</span></div>
                    <div style={{ padding:"4px 14px 10px" }}>
                      {[...leaderboard].sort((a,b) => b.sp - a.sp).map(u => {
                        const color = avatarColor(u.username);
                        const max = leaderboard.reduce((m,x) => Math.max(m, x.sp), 0) || 1;
                        const pct = Math.round((u.sp / max) * 100);
                        return (
                          <div key={u.id} className="stat-row">
                            <div className="stat-avatar" style={{ background:color+"20", color, border:`1.5px solid ${color}40` }}>{u.username[0].toUpperCase()}</div>
                            <div className="stat-bar-wrap">
                              <div className="stat-name"><span>{u.username}</span><span style={{ color:"#60a5fa" }}>+{u.sp}pt</span></div>
                              <div className="stat-bar"><div className="stat-fill" style={{ width:`${pct}%`, background:"#60a5fa" }} /></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── GROEPEN ── */}
        {tab === "groepen" && (
          <div className="fu">
            <div className="sec-title">⚽ Groepswedstrijden</div>
            <div className="sec-sub">{isAdmin ? "Klik op score · 🔒 vergrendelen" : "Kies groep · 🎯 tip invoeren · eindstand voorspellen"}</div>
            {/* FIX #7: scroll hint */}
            <div className="gtabs-wrap">
              <div className="gtabs">
                {GROUPS.map(g => {
                  const untiped = !isAdmin ? matches.filter(m =>
                    m.grp === g && m.phase === "group" && m.home_goals == null && !m.locked &&
                    !myPreds.find(p => p.match_id === m.id)
                  ).length : 0;
                  return (
                    <button key={g} className={`gtab${grp===g?" on":""}`} onClick={() => setGrp(g)} style={{ position:"relative" }}>
                      {g}
                      {untiped > 0 && <span style={{ position:"absolute", top:-4, right:-4, width:14, height:14, background:"var(--re)", borderRadius:"50%", fontSize:8, fontWeight:900, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", border:"1.5px solid var(--bg)" }}>{untiped}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            <GroupCard group={grp} matches={matches} isAdmin={isAdmin} myPreds={myPreds} allPreds={preds} onScore={setScore} onLock={toggleLock} onPred={savePred} />
          </div>
        )}

        {/* ── KNOCKOUT ── */}
        {tab === "ko" && (
          <div className="fu">
            <div className="sec-title">🥊 Knockout Fase</div>
            <div className="sec-sub">{isAdmin ? "Teams en scores invullen" : "Kies fase · tip invoeren"}</div>
            <div className="ptabs-wrap">
              <div className="ptabs">
                {KO_PHASES.map(p => <button key={p.id} className={`ptab${kphase===p.id?" on":""}`} onClick={() => setKphase(p.id)}>{p.full}</button>)}
              </div>
            </div>
            <KOCard phase={kphase} matches={matches} isAdmin={isAdmin} myPreds={myPreds} allPreds={preds} onScore={setScore} onLock={toggleLock} onPred={savePred} allTeams={ALL_TEAMS} />
          </div>
        )}

        {/* ── STANDEN ── */}
        {tab === "standen" && (
          <div className="fu">
            <div className="sec-title">📊 Alle Groepsstanden</div>
            <div className="sec-sub">Top 2 + 8 beste nummers 3 gaan door naar knockout</div>
            {GROUPS.map(g => {
              // FIX #16: toon de actuele top 2, niet hardcoded eerste 2 teams
              const standing = groupStandings[g];
              const top2 = standing.slice(0,2).map(r => r.team.replace(/[^\w\s]/g,'').trim()).join(" · ");
              return (
                <div key={g} className="card">
                  <div className="card-head" style={{ flexDirection:"column", alignItems:"flex-start", gap:6 }}>
                    <span className="card-title">Groep {g}</span>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {GROUP_TEAMS[g].map((t,i) => (
                        <span key={t} style={{ fontSize:10, color: i<2 ? "var(--gr)" : "var(--t3)", fontWeight:600, whiteSpace:"nowrap" }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding:"2px 14px 10px" }}>
                    <div className="stand-row" style={{ padding:"4px 0", borderBottom:"1px solid var(--bd)" }}>
                      <div /><div style={{ fontSize:9, color:"var(--t3)", fontWeight:700, letterSpacing:.5 }}>TEAM</div>
                      {["W","G","V","DV","DA","Pnt"].map(h => <div key={h} className="stand-cell" style={{ fontSize:9, fontWeight:700, color:"var(--t3)" }}>{h}</div>)}
                    </div>
                    {standing.map((r,i) => (
                      <div key={r.team} className="stand-row">
                        <div className="stand-num" style={{ color: i<2 ? "var(--gr)" : "var(--t3)" }}>{i+1}</div>
                        <div className="stand-team">{r.team}</div>
                        <div className="stand-cell">{r.w}</div>
                        <div className="stand-cell">{r.d}</div>
                        <div className="stand-cell">{r.l}</div>
                        <div className="stand-cell">{r.gf}</div>
                        <div className="stand-cell">{r.ga}</div>
                        <div className="stand-pts" style={{ color: i<2 ? "var(--gr)" : "var(--t1)" }}>{r.pts}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── BONUS ── */}
        {tab === "bonus" && (
          <div className="fu">
            <div className="sec-title">🎯 Bonusvragen</div>
            <div className="sec-sub">{BONUS_QS.length} vragen · 10 punten per goed antwoord{wkStarted ? " · 🔒 Gesloten" : " · sluit bij WK-start"}</div>
            {isAdmin ? <BonusAdmin bonusR={bonusR} onSave={saveBonusResults} /> : <BonusUser myAns={myBonusAns} bonusR={bonusR} onSave={saveBonus} wkStarted={wkStarted} />}
          </div>
        )}

        {/* ── MIJN ── */}
        {tab === "mijn" && !isAdmin && (
          <div className="fu">
            <div className="sec-title">📋 Mijn Stats</div>
            {(() => {
              const { pts:mp, exact } = calcMatchPts(myPreds, matchMap);
              const bp = calcBonusPts(myBonusAns, bonusR);
              const sp = leaderboard.find(u => u.id === session.id)?.sp || 0;
              const total = mp + bp + sp;
              const myRank = leaderboard.findIndex(u => u.id === session.id) + 1;
              const pct = maxPts > 0 ? Math.round(total / maxPts * 100) : 0;
              const color = avatarColor(session.username);
              // Winnaar % berekening
              const donePreds = myPreds.filter(p => { const m = matchMap.get(p.match_id); return m?.home_goals != null && m?.away_goals != null; });
              const winnerOk = donePreds.filter(p => { const m = matchMap.get(p.match_id); const po = +p.home_goals > +p.away_goals ? 1 : +p.home_goals < +p.away_goals ? -1 : 0; const ro = +m.home_goals > +m.away_goals ? 1 : +m.home_goals < +m.away_goals ? -1 : 0; return po === ro; }).length;
              const winPct = donePreds.length > 0 ? Math.round(winnerOk / donePreds.length * 100) : 0;

              return (
                <>
                  {/* Hero kaart */}
                  <div style={{ background:"var(--c1)", border:"1px solid var(--bd)", borderRadius:14, padding:"16px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:14 }}>
                    <div style={{ width:52, height:52, borderRadius:"50%", background:color+"25", border:`2px solid ${color}50`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:22, color, flexShrink:0 }}>
                      {session.username[0].toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:800, fontSize:16, color:"var(--t1)", marginBottom:2 }}>{session.username}</div>
                      <div style={{ fontSize:11, color:"var(--t3)" }}>
                        {myRank > 0 ? `#${myRank} van ${leaderboard.length} deelnemers` : "Nog geen rang"}
                      </div>
                      <div style={{ height:5, background:"var(--c3)", borderRadius:3, overflow:"hidden", margin:"8px 0 4px" }}>
                        <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:3, transition:"width .8s ease" }} />
                      </div>
                      <div style={{ fontSize:10, color:"var(--t3)" }}>{pct}% van koploper ({maxPts}pt)</div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:32, color:"var(--gr)", lineHeight:1 }}>{total}</div>
                      <div style={{ fontSize:10, color:"var(--t3)", fontWeight:600, marginTop:2 }}>PUNTEN</div>
                    </div>
                  </div>

                  {/* Stats blokken */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
                    {[
                      { val:`${exact}×`, lbl:"Exact", sub:`+${exact*5}pt`, c:"var(--gr)" },
                      { val:`${bp}pt`, lbl:"Bonus", sub:`${BONUS_QS.filter(q => bonusR?.[q.id] && myBonusAns[q.id]?.toString().toLowerCase().trim() === bonusR[q.id].toString().toLowerCase().trim()).length}/${BONUS_QS.length} goed`, c:"var(--am)" },
                      { val:`${winPct}%`, lbl:"Winnaar goed", sub:`${winnerOk}/${donePreds.length}`, c:"#60a5fa" },
                    ].map((s,i) => (
                      <div key={i} style={{ background:"var(--c2)", border:"1px solid var(--bd)", borderRadius:10, padding:"14px 10px", textAlign:"center" }}>
                        <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:22, color:s.c, lineHeight:1 }}>{s.val}</div>
                        <div style={{ fontSize:11, color:"var(--t3)", margin:"4px 0 2px" }}>{s.lbl}</div>
                        <div style={{ fontSize:10, color:"var(--t3)" }}>{s.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Tips tabel */}
                  <div className="sec-title" style={{ fontSize:14, marginBottom:8 }}>⚽ Mijn tips</div>
                  {myPreds.length === 0
                    ? <div className="empty"><div className="empty-i">🎯</div><div className="empty-t">Nog geen tips ingevoerd.<br />Ga naar Groepen of Knockout!</div></div>
                    : <div className="card">
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 54px 54px 40px", gap:4, padding:"7px 12px", borderBottom:"1px solid var(--bd)" }}>
                        {["Wedstrijd","Mijn tip","Uitslag","Pts"].map((h,i) => (
                          <div key={i} style={{ fontSize:10, fontWeight:700, color:"var(--t3)", textTransform:"uppercase", letterSpacing:.5, textAlign: i===0?"left":"center" }}>{h}</div>
                        ))}
                      </div>
                      {myPreds.map(pred => {
                        const m = matchMap.get(pred.match_id);
                        if (!m) return null;
                        const done = m.home_goals != null && m.away_goals != null;
                        let cls = "", lbl = "—";
                        if (done) { const r = scorePts(pred.home_goals, pred.away_goals, m.home_goals, m.away_goals); cls = r.cls; lbl = r.label; }
                        return (
                          <div key={pred.match_id} style={{ display:"grid", gridTemplateColumns:"1fr 54px 54px 40px", gap:4, alignItems:"center", padding:"10px 12px", borderBottom:"1px solid rgba(30,45,74,.4)" }}>
                            <div style={{ fontSize:12, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:"var(--t1)" }}>
                              {m.home || "?"} vs {m.away || "?"}
                            </div>
                            <div style={{ fontSize:12, textAlign:"center", color:"var(--t2)", fontVariantNumeric:"tabular-nums" }}>{pred.home_goals}–{pred.away_goals}</div>
                            <div style={{ fontSize:12, fontWeight:600, textAlign:"center", color: done ? (scorePts(pred.home_goals, pred.away_goals, m.home_goals, m.away_goals).pts >= 3 ? "var(--gr)" : "var(--re)") : "var(--t3)", fontVariantNumeric:"tabular-nums" }}>
                              {done ? `${m.home_goals}–${m.away_goals}` : "—"}
                            </div>
                            <div style={{ textAlign:"center" }}>
                              {done ? <span className={`pts-badge ${cls}`}>{lbl}</span> : <span style={{ fontSize:11, color:"var(--t3)" }}>—</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  }

                  {/* Jij vs. gemiddelde */}
                  <div className="sec-title" style={{ fontSize:14, margin:"14px 0 8px" }}>📊 Jij vs. gemiddelde</div>
                  <div className="card">
                    {(() => {
                      const avgExact = leaderboard.length > 0 ? leaderboard.reduce((s,u) => s + u.exact, 0) / leaderboard.length : 0;
                      const avgPts   = leaderboard.length > 0 ? leaderboard.reduce((s,u) => s + u.pts, 0) / leaderboard.length : 0;
                      const myLb     = leaderboard.find(u => u.id === session.id) || { exact:0, pts:0, pc:0 };
                      // Exacte treffers %
                      const myExactPct  = myLb.pc > 0 ? Math.round(myLb.exact / myLb.pc * 100) : 0;
                      const avgExactPct = leaderboard.length > 0 ? Math.round(leaderboard.reduce((s,u) => s + (u.pc > 0 ? u.exact/u.pc : 0), 0) / leaderboard.length * 100) : 0;
                      const maxExact = Math.max(myLb.exact, avgExact, 1);
                      const maxPts2  = Math.max(myLb.pts, avgPts, 1);
                      const maxPct   = Math.max(myExactPct, avgExactPct, 1);
                      const rows = [
                        { lbl:"Totaal punten", mine:myLb.pts, avg:Math.round(avgPts), max:maxPts2, color:"var(--gr)", suffix:"" },
                        { lbl:"Exacte uitslagen", mine:myLb.exact, avg:Math.round(avgExact*10)/10, max:maxExact, color:"#60a5fa", suffix:"" },
                        { lbl:"Exacte treffers %", mine:myExactPct, avg:avgExactPct, max:maxPct, color:"var(--am)", suffix:"%" },
                      ];
                      return rows.map((r,i) => (
                        <div key={i} style={{ padding:"12px 14px", borderBottom: i<rows.length-1?"1px solid rgba(30,45,74,.4)":"none" }}>
                          <div style={{ fontSize:11, fontWeight:700, color:"var(--t3)", textTransform:"uppercase", letterSpacing:.5, marginBottom:8 }}>{r.lbl}</div>
                          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                            {[{lbl:"Jij", val:r.mine, c:r.color},{lbl:"Gem.", val:r.avg, c:"var(--t3)"}].map((b,j) => (
                              <div key={j} style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <div style={{ width:32, fontSize:10, fontWeight:700, color:b.c, flexShrink:0 }}>{b.lbl}</div>
                                <div style={{ flex:1, height:7, background:"var(--c3)", borderRadius:4, overflow:"hidden" }}>
                                  <div style={{ width:`${Math.round(b.val/r.max*100)}%`, height:"100%", background:b.c, borderRadius:4, transition:"width .8s ease", opacity: j===1?.6:1 }} />
                                </div>
                                <div style={{ fontSize:12, fontWeight:700, color:b.c, minWidth:28, textAlign:"right" }}>{b.val}{r.suffix}</div>
                                {j===0 && b.val > r.avg && <span style={{ fontSize:9, fontWeight:700, background:"rgba(0,201,125,.15)", color:"var(--gr)", borderRadius:3, padding:"1px 5px", border:"1px solid rgba(255,107,0,.15)", flexShrink:0 }}>↑ boven gem.</span>}
                                {j===0 && b.val < r.avg && <span style={{ fontSize:9, fontWeight:700, background:"rgba(244,63,94,.1)", color:"var(--re)", borderRadius:3, padding:"1px 5px", border:"1px solid rgba(244,63,94,.2)", flexShrink:0 }}>↓ onder gem.</span>}
                                {j===0 && b.val === Math.round(r.avg) && <span style={{ fontSize:9, color:"var(--t3)", flexShrink:0 }}>= gem.</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* ── POT ── */}
        {tab === "pot" && (
          <div className="fu">
            <div className="sec-title">💶 Prijzenpot</div>
            <div className="sec-sub">Inleg €20 per persoon · 50% / 30% / 20%</div>
            {(() => {
              const n = potN;
              const pot = n * 20;
              const prizes = [
                { medal:"🥇", pos:"1e plaats", pct:50, color:"#f59e0b" },
                { medal:"🥈", pos:"2e plaats", pct:30, color:"#94a3b8" },
                { medal:"🥉", pos:"3e plaats", pct:20, color:"#cd7f32" },
              ];
              return (
                <>
                  {isAdmin && (
                    <div style={{ background:"var(--c2)", border:"1px solid var(--bd)", borderRadius:10, padding:"14px 16px", marginBottom:12 }}>
                      <div style={{ fontSize:12, color:"var(--t3)", fontWeight:700, marginBottom:10 }}>AANTAL DEELNEMERS INSTELLEN</div>
                      <input type="range" min="3" max="50" value={n} onChange={e => setPotN(+e.target.value)}
                        style={{ width:"100%", accentColor:"var(--gr)", cursor:"pointer" }} />
                      <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, alignItems:"center" }}>
                        <span style={{ fontSize:11, color:"var(--t3)" }}>3</span>
                        <span style={{ fontSize:14, fontWeight:700, color:"var(--gr)" }}>{n} deelnemers</span>
                        <span style={{ fontSize:11, color:"var(--t3)" }}>50</span>
                      </div>
                      <button className="btn btn-green" style={{ marginTop:12 }} onClick={async () => {
                        const { data:ex } = await sb.from("bonus_results").select("*").maybeSingle();
                        const updated = { ...(ex?.answers || {}), _potN: n };
                        if (ex) await sb.from("bonus_results").update({ answers:updated }).eq("id", ex.id);
                        else await sb.from("bonus_results").insert({ answers:updated });
                        setBonusR(updated);
                        showToast("✓ Aantal deelnemers opgeslagen");
                      }}>✓ Opslaan voor iedereen</button>
                    </div>
                  )}

                  {!isAdmin && (
                    <div style={{ background:"var(--c2)", border:"1px solid var(--bd)", borderRadius:10, padding:"12px 16px", marginBottom:12, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div style={{ fontSize:13, color:"var(--t2)" }}>👥 Aantal deelnemers</div>
                      <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:22, color:"var(--t1)" }}>{n}</div>
                    </div>
                  )}

                  <div style={{ background:"var(--c2)", border:"1px solid var(--bd)", borderRadius:10, padding:"12px 16px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontSize:13, color:"var(--t2)" }}>💶 Totale pot</div>
                    <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:26, color:"var(--gr)" }}>€{pot}</div>
                  </div>

                  <div className="card">
                    {prizes.map((p,i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 14px", borderBottom: i<2?"1px solid var(--bd)":"none" }}>
                        <div style={{ fontSize:28, flexShrink:0 }}>{p.medal}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:14, color:"var(--t1)", marginBottom:3 }}>{p.pos}</div>
                          <div style={{ fontSize:11, color:"var(--t3)", marginBottom:6 }}>{p.pct}% van de totale pot</div>
                          <div style={{ height:6, background:"var(--c3)", borderRadius:3, overflow:"hidden" }}>
                            <div style={{ width:`${p.pct*2}%`, height:"100%", background:p.color, borderRadius:3 }} />
                          </div>
                        </div>
                        <div style={{ textAlign:"right", flexShrink:0 }}>
                          <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:26, color:p.color }}>€{Math.round(pot * p.pct / 100)}</div>
                          <div style={{ fontSize:10, color:"var(--t3)", marginTop:2 }}>{p.pct}% van €{pot}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background:"rgba(0,201,125,.06)", border:"1px solid rgba(0,201,125,.15)", borderRadius:10, padding:"12px 14px", marginTop:4 }}>
                    <div style={{ fontSize:12, color:"var(--t2)", lineHeight:1.6 }}>
                      💡 Bij <b style={{ color:"var(--t1)" }}>{n} deelnemers</b> is de pot <b style={{ color:"var(--gr)" }}>€{pot}</b>.
                      De winnaar krijgt <b style={{ color:"#f59e0b" }}>€{Math.round(pot*0.5)}</b>, nummer 2 krijgt <b style={{ color:"#94a3b8" }}>€{Math.round(pot*0.3)}</b> en nummer 3 krijgt <b style={{ color:"#cd7f32" }}>€{Math.round(pot*0.2)}</b>.
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* ── BEHEER ── */}
        {tab === "beheer" && isAdmin && (
          <div className="fu">
            <div className="sec-title">👑 Deelnemers Beheer</div>
            <div className="sec-sub">{users.length} deelnemer{users.length !== 1 ? "s" : ""} · 🔑 wachtwoord · 🗑️ verwijderen</div>

            {/* AUTO IMPORT UITSLAGEN */}
            {(() => {
              const RAPIDAPI_KEY = "79920f4035msh648856abc33c7bdp1851e1jsn57b705f13bb2";
              // Vertaaltabel: Engelse API naam → Nederlandse databasenaam (zonder vlag prefix)
              const TEAM_MAP = {
                "Mexico":"Mexico","South Africa":"Zuid-Afrika","South Korea":"Zuid-Korea",
                "Czech Republic":"Tsjechië","Czechia":"Tsjechië",
                "Canada":"Canada","Bosnia and Herzegovina":"Bosnië-Herz.","Qatar":"Qatar","Switzerland":"Zwitserland",
                "Brazil":"Brazilië","Morocco":"Marokko","Haiti":"Haïti","Scotland":"Schotland",
                "United States":"USA","USA":"USA","Paraguay":"Paraguay","Australia":"Australië","Turkey":"Turkije",
                "Germany":"Duitsland","Curacao":"Curaçao","Ivory Coast":"Ivoorkust","Côte d'Ivoire":"Ivoorkust","Ecuador":"Ecuador",
                "Netherlands":"Nederland","Japan":"Japan","Sweden":"Zweden","Tunisia":"Tunesië",
                "Belgium":"België","Egypt":"Egypte","Iran":"Iran","New Zealand":"Nieuw-Zeeland",
                "Spain":"Spanje","Cape Verde":"Kaapverdië","Saudi Arabia":"Saoedi-Arabië","Uruguay":"Uruguay",
                "France":"Frankrijk","Senegal":"Senegal","Iraq":"Irak","Norway":"Noorwegen",
                "Argentina":"Argentinië","Algeria":"Algerije","Austria":"Oostenrijk","Jordan":"Jordanië",
                "Portugal":"Portugal","DR Congo":"DR Congo","Uzbekistan":"Oezbekistan","Colombia":"Colombia",
                "England":"Engeland","Croatia":"Kroatië","Ghana":"Ghana","Panama":"Panama",
              };

              // importing en importLog komen van component-level state

              const importScores = async () => {
                setImporting(true);
                setImportLog(["🔄 Uitslagen ophalen via API..."]);
                try {
                  // Haal vandaag's wedstrijden op via AllSportsApi
                  const today = new Date().toISOString().split("T")[0];
                  const res = await fetch(
                    `https://allsportsapi2.p.rapidapi.com/api/football/matches/${today}`,
                    { headers: { "x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": "allsportsapi2.p.rapidapi.com" } }
                  );
                  const data = await res.json();
                  const events = data?.events || [];
                  // Filter op WK wedstrijden
                  const wkMatches = events.filter(e =>
                    e.tournament?.name?.toLowerCase().includes("world cup") ||
                    e.tournament?.name?.toLowerCase().includes("fifa")
                  );
                  if (wkMatches.length === 0) {
                    setImportLog(["⚠️ Geen WK-wedstrijden gevonden voor vandaag.", "Controleer of het WK al begonnen is."]);
                    setImporting(false); return;
                  }
                  let updated = 0, skipped = 0;
                  const log = [];
                  for (const e of wkMatches) {
                    if (e.status?.type !== "finished") { skipped++; continue; }
                    const apiHome = e.homeTeam?.name;
                    const apiAway = e.awayTeam?.name;
                    const hg = e.homeScore?.current;
                    const ag = e.awayScore?.current;
                    if (hg == null || ag == null) { skipped++; continue; }
                    // Zoek match in database via teamnaam
                    const nlHome = TEAM_MAP[apiHome];
                    const nlAway = TEAM_MAP[apiAway];
                    if (!nlHome || !nlAway) {
                      log.push(`⚠️ Onbekend team: ${apiHome} vs ${apiAway}`);
                      skipped++; continue;
                    }
                    const match = matches.find(m =>
                      m.home?.includes(nlHome) && m.away?.includes(nlAway) && m.home_goals == null
                    );
                    if (!match) { skipped++; continue; }
                    const { error } = await sb.from("matches").update({ home_goals: hg, away_goals: ag }).eq("id", match.id);
                    if (!error) {
                      setMatches(ms => ms.map(m => m.id === match.id ? { ...m, home_goals: hg, away_goals: ag } : m));
                      log.push(`✓ ${nlHome} ${hg}–${ag} ${nlAway}`);
                      updated++;
                    }
                  }
                  log.unshift(`✅ ${updated} uitslag(en) bijgewerkt · ${skipped} overgeslagen`);
                  setImportLog(log);
                } catch (err) {
                  setImportLog(["❌ Fout: " + err.message]);
                }
                setImporting(false);
              };

              return (
                <div style={{ background:"var(--c2)", border:"1px solid var(--bd)", borderRadius:10, padding:"14px 16px", marginBottom:12 }}>
                  <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:14, color:"var(--gr)", marginBottom:6 }}>🤖 Auto-import uitslagen</div>
                  <div style={{ fontSize:12, color:"var(--t3)", marginBottom:12, lineHeight:1.5 }}>
                    Haalt alle afgelopen WK-wedstrijden van vandaag op en vult de scores automatisch in.
                  </div>
                  <button className="btn btn-green" disabled={importing} onClick={importScores}>
                    {importing ? <><span className="spin">⚽</span> Bezig...</> : "⚡ Importeer uitslagen van vandaag"}
                  </button>
                  {importLog.length > 0 && (
                    <div style={{ marginTop:12, background:"var(--bg)", borderRadius:8, padding:"10px 12px" }}>
                      {importLog.map((l,i) => (
                        <div key={i} style={{ fontSize:12, color: l.startsWith("✅")||l.startsWith("✓") ? "var(--gr)" : l.startsWith("❌") ? "var(--re)" : "var(--t2)", marginBottom:3, fontFamily:"monospace" }}>{l}</div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── AUTO REFRESH TOGGLE ── */}
            <div style={{ background:"var(--c2)", border:"1px solid var(--bd)", borderRadius:10, padding:"14px 16px", marginBottom:10 }}>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:14, color:"var(--gr)", marginBottom:6 }}>🔄 Auto-refresh uitslagen</div>
              <div style={{ fontSize:12, color:"var(--t3)", marginBottom:10, lineHeight:1.5 }}>
                Haalt automatisch elke 5 minuten de laatste uitslagen op. Zet aan tijdens het WK!
                {lastRefresh && <span style={{ display:"block", marginTop:4, color:"var(--t2)" }}>⏱ Laatste update: {lastRefresh.toLocaleTimeString("nl-NL")}</span>}
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <button
                  className="btn"
                  style={{ flex:1, background: autoRefresh ? "var(--gr)" : "var(--c3)", color: autoRefresh ? "#fff" : "var(--t2)", border:"1px solid var(--bd)", padding:"10px", borderRadius:8, fontWeight:700, fontSize:13 }}
                  onClick={() => { setAutoRefresh(v => !v); if (!autoRefresh) setLastRefresh(null); }}
                >
                  {autoRefresh ? "🟢 Auto-refresh AAN" : "⚫ Auto-refresh UIT"}
                </button>
              </div>
            </div>

            {/* ── ALLES VERGRENDELEN ── */}
            <div style={{ background:"var(--c2)", border:"1px solid var(--bd)", borderRadius:10, padding:"14px 16px", marginBottom:10 }}>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:14, color:"var(--gr)", marginBottom:6 }}>🔒 Alles vergrendelen</div>
              <div style={{ fontSize:12, color:"var(--t3)", marginBottom:10, lineHeight:1.5 }}>
                Vergrendelt alle wedstrijden van vandaag in één klik. Niemand kan meer tippen.
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button
                  className="btn btn-green"
                  style={{ flex:1 }}
                  disabled={lockAllLoading}
                  onClick={async () => {
                    setLockAllLoading(true);
                    const today = new Date().toLocaleDateString("nl-NL", { day:"numeric", month:"short" }).toLowerCase();
                    const todayMs = matches.filter(m => m.match_date && m.match_date.toLowerCase().includes(today.split(" ")[0]) && !m.locked);
                    let count = 0;
                    for (const m of todayMs) {
                      const { error } = await sb.from("matches").update({ locked: true }).eq("id", m.id);
                      if (!error) { setMatches(ms => ms.map(x => x.id === m.id ? { ...x, locked: true } : x)); count++; }
                    }
                    if (count === 0) {
                      // Lock all unlocked matches if none found for today
                      const allUnlocked = matches.filter(m => !m.locked);
                      for (const m of allUnlocked.slice(0, 10)) {
                        const { error } = await sb.from("matches").update({ locked: true }).eq("id", m.id);
                        if (!error) { setMatches(ms => ms.map(x => x.id === m.id ? { ...x, locked: true } : x)); count++; }
                      }
                    }
                    showToast(`🔒 ${count} wedstrijd(en) vergrendeld`);
                    setLockAllLoading(false);
                  }}
                >
                  {lockAllLoading ? <><span className="spin">⚽</span> Bezig...</> : "🔒 Vergrendel wedstrijden van vandaag"}
                </button>
                <button
                  className="btn btn-out"
                  style={{ flex:1 }}
                  disabled={lockAllLoading}
                  onClick={async () => {
                    setLockAllLoading(true);
                    const locked = matches.filter(m => m.locked);
                    for (const m of locked) {
                      await sb.from("matches").update({ locked: false }).eq("id", m.id);
                      setMatches(ms => ms.map(x => x.id === m.id ? { ...x, locked: false } : x));
                    }
                    showToast(`🔓 Alles geopend`);
                    setLockAllLoading(false);
                  }}
                >
                  🔓 Alles openen
                </button>
              </div>
            </div>

            {/* ── STAND EXPORTEREN ── */}
            <div style={{ background:"var(--c2)", border:"1px solid var(--bd)", borderRadius:10, padding:"14px 16px", marginBottom:12 }}>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:14, color:"var(--gr)", marginBottom:6 }}>📤 Stand exporteren</div>
              <div style={{ fontSize:12, color:"var(--t3)", marginBottom:10, lineHeight:1.5 }}>
                Kopieer de stand als tekst om te plakken in WhatsApp of andere apps.
              </div>
              <button
                className="btn btn-green"
                onClick={() => {
                  const lines = ["🏆 WK 2026 Poule — Dinxperlo Boys", "━━━━━━━━━━━━━━━━━━━━", ""];
                  leaderboard.forEach((u, i) => {
                    const medals = ["🥇","🥈","🥉"];
                    const rank = i < 3 ? medals[i] : `${i+1}.`;
                    lines.push(`${rank} ${u.username} — ${u.pts} pt (${u.exact}× exact)`);
                  });
                  lines.push("");
                  lines.push(`📅 ${new Date().toLocaleDateString("nl-NL", { day:"numeric", month:"long" })}`);
                  lines.push("ramonboland.com");
                  const text = lines.join("\n");
                  setExportText(text);
                  navigator.clipboard?.writeText(text).then(() => showToast("📋 Stand gekopieerd!")).catch(() => showToast("📋 Selecteer en kopieer de tekst"));
                }}
              >
                📤 Kopieer stand naar klembord
              </button>
              {exportText && (
                <div style={{ marginTop:10, background:"var(--bg)", borderRadius:8, padding:"10px 12px", fontSize:12, color:"var(--t2)", fontFamily:"monospace", whiteSpace:"pre", lineHeight:1.6, overflowX:"auto" }}>
                  {exportText}
                </div>
              )}
            </div>

            {users.length === 0
              ? <div className="empty"><div className="empty-i">👤</div><div className="empty-t">Nog geen deelnemers aangemeld.</div></div>
              : <div className="card">
                {[...users].filter(u => u.username.toLowerCase() !== 'admin').map(u => {
                  const lb = leaderboard.find(l => l.id === u.id) || { pts:0, exact:0, bp:0, sp:0, pc:0 };
                  const color = avatarColor(u.username);
                  const rank = leaderboard.findIndex(l => l.id === u.id) + 1;
                  return (
                    <div key={u.id} className="ur">
                      <div style={{ width:36, height:36, borderRadius:"50%", background:color+"20", border:`2px solid ${color}40`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:16, color, flexShrink:0 }}>
                        {u.username[0].toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:14, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:6 }}>
                          {u.username}
                          {rank > 0 && <span style={{ fontSize:9, color:"var(--t3)", fontWeight:700 }}>#{rank}</span>}
                        </div>
                        <div style={{ fontSize:11, color:"var(--t3)", marginTop:2, display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
                          <span>{lb.pc} tips</span>
                          <span>·</span>
                          <span>{lb.exact}× exact</span>
                          <span>·</span>
                          {(() => {
                            const ba = bonusA.find(b => b.user_id === u.id)?.answers || {};
                            const filled = BONUS_QS.filter(q => ba[q.id] && ba[q.id].toString().trim() !== "").length;
                            const total = BONUS_QS.length;
                            const allDone = filled === total;
                            return (
                              <span style={{ color: allDone ? "var(--gr)" : filled > 0 ? "var(--am)" : "var(--re)", fontWeight:700 }}>
                                🎯 {filled}/{total} bonus{allDone ? " ✓" : ""}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                      <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:18, color:"var(--gr)", marginRight:8, flexShrink:0 }}>
                        {lb.pts}<span style={{ fontSize:10, color:"var(--t3)" }}> pt</span>
                      </div>
                      <div style={{ display:"flex", gap:5, flexShrink:0 }}>
                        <button className="btn btn-out btn-sm btn-ic" title="Wachtwoord resetten" onClick={() => { setModal({ type:"resetpw", user:u }); setModalInput(""); }}>🔑</button>
                        <button className="btn btn-out btn-sm btn-ic" title="Tips wissen" style={{color:"var(--am)",borderColor:"rgba(255,179,71,.3)"}} onClick={async () => {
                          if (!confirm(`Alle tips van ${u.username} wissen?`)) return;
                          await sb.from("predictions").delete().eq("user_id", u.id);
                          setPreds(ps => ps.filter(p => p.user_id !== u.id));
                          showToast(`🧹 Tips van ${u.username} gewist`);
                        }}>🧹</button>
                        <button className="btn btn-del btn-sm btn-ic" title="Definitief verwijderen" onClick={() => setModal({ type:"delete", user:u })}>🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            }
          </div>
        )}

      </div>

      {/* BOTTOM NAV */}
      <nav className="bnav">
        {TABS.map(t => (
          <button key={t.id} className={`bn${tab===t.id?" on":""}`} onClick={() => setTab(t.id)}>
            <span className="bn-ic">{t.ic}</span>
            {t.id === "groepen" && todayUntiped && <span className="bn-badge" />}
            <span className="bn-lb">{t.lb}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
