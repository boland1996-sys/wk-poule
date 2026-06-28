import { useState, useEffect, useRef, useMemo } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── CONFIG ────────────────────────────────────────────────────────────────
const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
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

// Wedstrijdfase uit de live-API (Engels) → Nederlands label.
const STAGE_NL = {
  "1st Half":"1e helft", "2nd Half":"2e helft", "Half Time":"rust", "Break Time":"rust",
  "Extra Time":"verlenging", "Extra Time 1st Half":"verlenging", "Extra Time 2nd Half":"verlenging",
  "Awaiting Extra Time":"einde 2e helft", "Penalties":"penalty's", "Awaiting Penalties":"penalty's",
};

// Placeholder-teamnames die nog niet echt zijn
const KO_PLACEHOLDERS = ["Winnaar","Verliezer","1e Groep","2e Groep","Beste nr","Nummer"];
const isPlaceholder = name => !name || KO_PLACEHOLDERS.some(p => name.startsWith(p));

const WK_START = new Date("2026-06-11T21:00:00+02:00");

// Eén centrale parser voor "do 11 jun 21:00" — voorheen 6x gedupliceerd
const NL_MONTHS = {jan:0,feb:1,mrt:2,apr:3,mei:4,jun:5,jul:6,aug:7,sep:8,okt:9,nov:10,dec:11};

// Vertaaltabel: Engelse API naam → Nederlandse databasenaam (zonder vlag prefix)
const TEAM_MAP = {
  "Mexico":"Mexico","South Africa":"Zuid-Afrika","South Korea":"Zuid-Korea",
  "Czech Republic":"Tsjechië","Czechia":"Tsjechië",
  "Canada":"Canada","Bosnia and Herzegovina":"Bosnië-Herz.","Bosnia & Herzegovina":"Bosnië-Herz.","Qatar":"Qatar","Switzerland":"Zwitserland",
  "Brazil":"Brazilië","Morocco":"Marokko","Haiti":"Haïti","Scotland":"Schotland",
  "United States":"USA","USA":"USA","Paraguay":"Paraguay","Australia":"Australië","Turkey":"Turkije",
  "Germany":"Duitsland","Curacao":"Curaçao","Ivory Coast":"Ivoorkust","Côte d'Ivoire":"Ivoorkust","Ecuador":"Ecuador",
  "Netherlands":"Nederland","Japan":"Japan","Sweden":"Zweden","Tunisia":"Tunesië",
  "Belgium":"België","Egypt":"Egypte","Iran":"Iran","New Zealand":"Nieuw-Zeeland",
  "Spain":"Spanje","Cape Verde":"Kaapverdië","Saudi Arabia":"Saoedi-Arabië","Uruguay":"Uruguay",
  "France":"Frankrijk","Senegal":"Senegal","Iraq":"Irak","Norway":"Noorwegen",
  "Argentina":"Argentinië","Algeria":"Algerije","Austria":"Oostenrijk","Jordan":"Jordanië",
  "Portugal":"Portugal","DR Congo":"DR Congo","D.R. Congo":"DR Congo","Uzbekistan":"Oezbekistan","Colombia":"Colombia",
  "England":"Engeland","Croatia":"Kroatië","Ghana":"Ghana","Panama":"Panama",
};

// Koppel een API-wedstrijd aan een database-wedstrijd via de vertaaltabel.
function liveMatchFor(dbMatch, apiMatches) {
  const homeNl = dbMatch.home || "";
  const awayNl = dbMatch.away || "";
  return apiMatches.find(a => {
    const h = TEAM_MAP[a.homeTeam], w = TEAM_MAP[a.awayTeam];
    return h && w && homeNl.includes(h) && awayNl.includes(w);
  });
}

function parseMatchDate(md) {
  if (!md) return null;
  const parts = md.trim().split(" ");
  if (parts.length < 3) return null;
  const day = parseInt(parts[1], 10);
  const month = NL_MONTHS[parts[2]?.toLowerCase()];
  if (isNaN(day) || month === undefined) return null;
  const [hh, mm] = (parts[3] || "00:00").split(":").map(n => parseInt(n, 10));
  return new Date(2026, month, day, hh || 0, mm || 0);
}

// Tippen sluit 5 minuten vóór aftrap. Daarna wordt de wedstrijd vergrendeld.
const LOCK_LEAD_MS = 5 * 60 * 1000;
function tipDeadline(md) {
  const start = parseMatchDate(md);
  return start ? new Date(start.getTime() - LOCK_LEAD_MS) : null;
}

// Speelminuut netjes tonen: "45" → "45'", niet-numeriek (bv. "HT") ongewijzigd.
const fmtMin = (mn) => mn == null ? null : (/^\d+$/.test(String(mn)) ? `${mn}'` : String(mn));

// ── PUNTENSYSTEEM (Vindicat) ──────────────────────────────────────────────
// 3pt winnaar/gelijkspel goed + 1pt thuisgoals goed + 1pt uitgoals goed = 5pt; exacte uitslag +2 bonus = 7pt
function scorePts(ph, pa, mh, ma) {
  ph = +ph; pa = +pa; mh = +mh; ma = +ma;
  const predOut = ph > pa ? 1 : ph < pa ? -1 : 0;
  const realOut = mh > ma ? 1 : mh < ma ? -1 : 0;
  let pts = 0;
  if (predOut === realOut) pts += 3;
  if (ph === mh) pts += 1;
  if (pa === ma) pts += 1;
  if (pts === 5) return { pts: 7, label: "+7 ✓", cls: "pts-exact", exact: true };  // exacte uitslag: 5 + 2 bonus
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
    if (r.exact) exact++;
  }
  return { pts, exact };
}

function calcBonusPts(ans, res) {
  if (!res || !ans) return 0;
  // Normaliseer tekst: kleine letters, accenten/leestekens weg, spaties samengevoegd.
  const norm = s => s.toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  // Heel-woord-bevatting: komt "needle" als volledig woord voor in "hay"?
  const wordIn = (hay, needle) => (" " + hay + " ").includes(" " + needle + " ");
  return BONUS_QS.reduce((s, q) => {
    const a = ans[q.id], r = res[q.id];
    if (a == null || a === "" || r == null || r === "") return s;
    let ok;
    if (q.type === "text") {
      // Open tekst (topscorer / speler v.h. toernooi): tel goed bij exacte match
      // óf als de één als heel woord in de ander zit ("Kane" ↔ "Harry Kane").
      const na = norm(a), nr = norm(r);
      ok = !!na && !!nr && (na === nr || wordIn(na, nr) || wordIn(nr, na));
    } else {
      // Team/getal: exacte match (komen uit een keuzelijst of zijn een getal).
      ok = a.toString().toLowerCase().trim() === r.toString().toLowerCase().trim();
    }
    return s + (ok ? 10 : 0);
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

// Avatar component met foto of kleur
function Avatar({ userId, username, size=36, profiles={} }) {
  const profile = profiles[userId] || {};
  const color = profile.color || avatarColor(username || "?");
  const photo = profile.photo;
  const s = { width:size, height:size, borderRadius:"50%", flexShrink:0, overflow:"hidden", border:`2px solid ${color}50` };
  if (photo) return <div style={s}><img src={photo} alt={username} style={{ width:"100%", height:"100%", objectFit:"cover" }}/></div>;
  return <div style={{ ...s, background:color+"25", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:Math.round(size*0.4), color }}>{(username||"?")[0].toUpperCase()}</div>;
}

function useCountdown(target) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0, started: false });
  useEffect(() => {
    const tick = () => {
      const diff = target - new Date();
      if (diff <= 0) { setT(t => t.started ? t : { d: 0, h: 0, m: 0, s: 0, started: true }); return; }
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

// Inklapbare kaart: kop altijd zichtbaar, inhoud open/dicht via klik (standaard dicht).
function Collapse({ title, sub, defaultOpen=false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card" style={{ marginBottom:8 }}>
      <div className="card-head" style={{ cursor:"pointer", userSelect:"none" }} onClick={() => setOpen(o => !o)}>
        <span className="card-title">{title}</span>
        <span style={{ display:"flex", alignItems:"center", gap:8 }}>
          {sub && <span style={{ fontSize:11, color:"var(--t3)" }}>{sub}</span>}
          <span style={{ fontSize:13, color:"var(--t3)", display:"inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition:"transform .2s" }}>▾</span>
        </span>
      </div>
      {open && <div style={{ padding:"4px 14px 10px" }}>{children}</div>}
    </div>
  );
}

// ── WEDSTRIJD VOORSPELLINGEN MODAL ────────────────────────────────────────
// Toont per wedstrijd wat iedereen heeft ingevuld. Andermans tips zichtbaar
// zodra de wedstrijd vergrendeld of begonnen is (anti-afkijken vóór de deadline).
function MatchPredsModal({ match, users, allPreds, userProfiles, myId, onClose }) {
  const done = match.home_goals != null && match.away_goals != null;
  const startDate = parseMatchDate(match.match_date);
  const started = startDate ? new Date() >= startDate : false;
  const reveal = match.locked || started || done;
  const participants = users.filter(u => u.username.toLowerCase() !== "admin");
  const mp = allPreds.filter(p => p.match_id === match.id && p.home_goals != null);

  const rows = participants.map(u => {
    const p = mp.find(x => x.user_id === u.id);
    let pts = null, cls = "", lbl = "";
    if (p && done) { const r = scorePts(p.home_goals, p.away_goals, match.home_goals, match.away_goals); pts = r.pts; cls = r.cls; lbl = r.label; }
    return { u, p, pts, cls, lbl };
  });
  rows.sort((a, b) => {
    if (!!a.p !== !!b.p) return a.p ? -1 : 1;
    if (done && a.p && b.p) return b.pts - a.pts;
    return a.u.username.localeCompare(b.u.username);
  });

  const parts = (match.match_date || "").split(" ");
  const dateLabel = parts.length >= 4 ? `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]}` : match.match_date;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={onClose}>
      <div style={{ background:"var(--c1)", border:"1px solid var(--bd)", borderRadius:14, width:"100%", maxWidth:360, overflow:"hidden", maxHeight:"85vh", display:"flex", flexDirection:"column" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:"16px 16px 14px", borderBottom:"1px solid var(--c3)" }}>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:600, fontSize:11, letterSpacing:1, textTransform:"uppercase", color:"var(--gr)", marginBottom:10 }}>
            {match.grp ? `Groep ${match.grp} · ` : ""}{dateLabel}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:10, alignItems:"center" }}>
            <div style={{ textAlign:"right", fontSize:14, fontWeight:700, color:"var(--t1)" }}>{match.home}</div>
            <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:20, color:"var(--gr)", background:"rgba(255,107,0,.1)", border:"1px solid rgba(255,107,0,.3)", borderRadius:8, padding:"3px 12px", whiteSpace:"nowrap", textAlign:"center" }}>
              {done ? `${match.home_goals} – ${match.away_goals}` : (parts[3] || "vs")}
            </div>
            <div style={{ textAlign:"left", fontSize:14, fontWeight:700, color:"var(--t1)" }}>{match.away}</div>
          </div>
          <div style={{ textAlign:"center", fontSize:10, color:"var(--t3)", fontWeight:600, marginTop:8, textTransform:"uppercase", letterSpacing:.5 }}>
            {done ? "Eindstand" : reveal ? "Vergrendeld" : "Nog niet begonnen"} · {mp.length} ingevuld
          </div>
        </div>

        {!reveal ? (
          <div style={{ padding:"30px 22px", textAlign:"center", color:"var(--t3)", fontSize:13, lineHeight:1.6 }}>
            🔒 De voorspellingen van anderen worden zichtbaar zodra de wedstrijd vergrendeld is of begint.
          </div>
        ) : (
          <div style={{ overflowY:"auto" }}>
            {rows.map(({ u, p, cls, lbl }) => {
              const isMe = u.id === myId;
              return (
                <div key={u.id} style={{ display:"flex", alignItems:"center", gap:11, padding:"10px 14px", borderBottom:"1px solid rgba(255,255,255,.06)", background: isMe ? "linear-gradient(90deg,rgba(255,107,0,.08),transparent 60%)" : "transparent", borderLeft: isMe ? "2px solid var(--gr)" : "2px solid transparent" }}>
                  <Avatar userId={u.id} username={u.username} size={32} profiles={userProfiles} />
                  <div style={{ flex:1, minWidth:0, display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ fontWeight:700, fontSize:13, color: p ? "var(--t1)" : "var(--t3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.username}</span>
                    {isMe && <span style={{ fontSize:9, fontWeight:900, background:"rgba(255,107,0,.15)", color:"var(--gr)", borderRadius:3, padding:"1px 5px", border:"1px solid rgba(255,107,0,.2)", flexShrink:0 }}>JIJ</span>}
                  </div>
                  {p ? (
                    <span style={{ fontFamily:"'Oswald',sans-serif", fontWeight:600, fontSize:15, color:"var(--t1)", minWidth:44, textAlign:"center" }}>{p.home_goals}–{p.away_goals}</span>
                  ) : (
                    <span style={{ fontSize:11, fontStyle:"italic", color:"var(--t3)" }}>niet ingevuld</span>
                  )}
                  {done && p && <span className={`pts-badge ${cls}`}>{lbl}</span>}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ padding:"11px 14px", borderTop:"1px solid var(--c3)", textAlign:"center", cursor:"pointer" }} onClick={onClose}>
          <span style={{ fontSize:13, fontWeight:700, color:"var(--t2)" }}>Sluiten</span>
        </div>
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

.lb-row{display:flex;align-items:center;gap:11px;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.07);transition:background .15s;position:relative}
.lb-row:last-child{border-bottom:none}
.lb-row.me{background:linear-gradient(90deg,rgba(255,107,0,.08),transparent 60%)}
.lb-row.me::before{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--gr)}
.lb-pos{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0}
.lb-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Oswald',sans-serif;font-weight:700;font-size:16px;flex-shrink:0;border:2px solid var(--bd)}
.lb-name{font-weight:700;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lb-sub{font-size:11px;color:var(--t3);margin-top:2px;display:flex;align-items:center;gap:5px;flex-wrap:wrap}

/* FIX #5/#16 - wedstrijdrij mobiel: teamnamen correct afkappen */
.mr{padding:11px 14px;border-bottom:1px solid rgba(255,255,255,.06)}
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

.stand-row{display:grid;grid-template-columns:14px 1fr 22px 22px 22px 22px 22px 26px;gap:3px;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.06)}
.stand-row:last-child{border-bottom:none}
.stand-num{font-size:10px;font-weight:700;text-align:center}
.stand-team{font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.stand-cell{font-size:11px;text-align:center;color:var(--t3);font-variant-numeric:tabular-nums}
.stand-pts{font-family:'Oswald',sans-serif;font-weight:700;font-size:14px;text-align:center}

.stat-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)}
.stat-row:last-child{border-bottom:none}
.stat-avatar{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Oswald',sans-serif;font-weight:700;font-size:13px;flex-shrink:0}
.stat-bar-wrap{flex:1;min-width:0}
.stat-name{font-size:12px;font-weight:700;margin-bottom:3px;display:flex;justify-content:space-between;align-items:center}
.stat-bar{height:5px;background:var(--c3);border-radius:3px;overflow:hidden}
.stat-fill{height:100%;border-radius:3px;transition:width .8s ease}

.ur{display:flex;align-items:center;gap:11px;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.06)}
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
.stand-pred-row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.05)}
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

/* CHAT */
.chat-wrap{display:flex;flex-direction:column;height:calc(100vh - 160px);max-height:600px}
.chat-msgs{flex:1;overflow-y:auto;padding:8px 0;display:flex;flex-direction:column;gap:6px}
.chat-msgs::-webkit-scrollbar{width:3px}
.chat-msgs::-webkit-scrollbar-thumb{background:var(--gr);border-radius:2px}
.chat-msg{padding:8px 12px;border-radius:10px;max-width:80%;word-break:break-word}
.chat-msg.mine{background:rgba(255,107,0,.15);border:1px solid rgba(255,107,0,.2);align-self:flex-end}
.chat-msg.other{background:var(--c2);border:1px solid var(--bd);align-self:flex-start}
.chat-msg.system{background:rgba(255,255,255,.04);border:1px dashed var(--bd);align-self:center;max-width:90%;text-align:center}
.chat-name{font-size:10px;font-weight:700;color:var(--gr);margin-bottom:3px}
.chat-name.other{color:var(--am)}
.chat-text{font-size:13px;line-height:1.4;color:var(--t1)}
.chat-time{font-size:10px;color:var(--t3);margin-top:3px;text-align:right}
.chat-input-wrap{display:flex;gap:8px;padding:10px 0 0;border-top:1px solid var(--bd);margin-top:8px}
.chat-input{flex:1;background:var(--c2);border:1.5px solid var(--bd);border-radius:22px;color:var(--t1);padding:10px 16px;font-size:14px;outline:none;-webkit-appearance:none}
.chat-input:focus{border-color:var(--gr)}
.chat-send{background:var(--gr);border:none;border-radius:50%;width:42px;height:42px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;cursor:pointer;transition:transform .15s}
.chat-send:active{transform:scale(.9)}
.chat-send:disabled{opacity:.4}

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
function GroupCard({ group, matches, isAdmin, myPreds, onScore, onLock, onPred, onShowPreds }) {
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
            {/* Optie B: tijd+datum links, teams rechts */}
            {canEdit && isE ? (
              <div style={{ marginBottom:8 }}>
                <div className="score-edit" style={{ padding:"6px 8px" }}>
                  <input type="number" min="0" max="20" className="ni" style={{ width:40, height:36, fontSize:16 }}
                    value={ts.h} onChange={e => setTs(s => ({ ...s, h: e.target.value }))} />
                  <span style={{ color:"var(--t3)", fontWeight:700 }}>–</span>
                  <input type="number" min="0" max="20" className="ni" style={{ width:40, height:36, fontSize:16 }}
                    value={ts.a} onChange={e => setTs(s => ({ ...s, a: e.target.value }))} />
                  <button className="btn-confirm" onClick={async () => {
                    const hg = ts.h === "" ? null : parseInt(ts.h, 10);
                    const ag = ts.a === "" ? null : parseInt(ts.a, 10);
                    await onScore(m.id, { home_goals: hg, away_goals: ag });
                    setEd(null);
                  }}>✓</button>
                  <button className="btn btn-out btn-sm" onClick={() => setEd(null)}>✕</button>
                </div>
                <div className="mr-teams">
                  <div className="mr-home">{m.home}</div>
                  <div className={`score-btn${done ? " done" : ""}`}>{done ? `${m.home_goals}–${m.away_goals}` : "vs"}</div>
                  <div className="mr-away">{m.away}</div>
                </div>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"70px 1fr", gap:10, alignItems:"center" }}>
                <div style={{ borderRight:"1.5px solid var(--bd)", paddingRight:10, textAlign:"center" }}>
                  {(() => {
                    const parts = (m.match_date || "").split(" ");
                    const dag = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : "";
                    const datum = parts[1] && parts[2] ? `${parts[1]} ${parts[2]}` : "";
                    const tijd = parts[3] || "";
                    return (<>
                      <div style={{ fontSize:16, fontWeight:800, color: done ? "var(--gr)" : "var(--gr)", fontFamily:"'Oswald',sans-serif", lineHeight:1 }}>{done ? `${m.home_goals}–${m.away_goals}` : tijd}</div>
                      <div style={{ fontSize:9, color:"var(--t3)", fontWeight:700, marginTop:3, textTransform:"uppercase", whiteSpace:"nowrap" }}>{dag} {datum}</div>
                    </>);
                  })()}
                </div>
                <div className="mr-teams" style={{ margin:0 }}>
                  <div className="mr-home">{m.home}</div>
                  <div className={`score-btn${done ? " done" : ""}${canEdit ? " editable" : ""}`}
                    style={{ fontSize:11, minWidth:40, padding:"5px 6px" }}
                    onClick={() => { if (canEdit) { setEd(m.id); setTs({ h: m.home_goals ?? "", a: m.away_goals ?? "" }); } }}>
                    {done ? "✓" : "vs"}
                  </div>
                  <div className="mr-away">{m.away}</div>
                </div>
              </div>
            )}
            <div className="mr-meta">
              <span></span>
              <div className="mr-actions">
                {/* FIX #8: toon "te laat" als wedstrijd vergrendeld */}
                {m.locked && !isAdmin && <span className="lock-tag">🔒</span>}
                {!isAdmin && mp && done && <span className={`pts-badge ${cls}`}>{lbl}</span>}
                {!isAdmin && mp && !isP && <span className="pill">{mp.home_goals}–{mp.away_goals}</span>}
                {onShowPreds && <button className="btn btn-out btn-sm" title="Wie tipte wat?" onClick={() => onShowPreds(m)}>👥</button>}
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
function KOCard({ phase, matches, isAdmin, myPreds, onScore, onLock, onPred, allTeams, onShowPreds }) {
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
        // Gesloten = DB-lock OF binnen 5 min voor aftrap (werkt ook als admin offline is)
        const dl = tipDeadline(m.match_date);
        const closed = m.locked || (dl && new Date() >= dl);
        // FIX #8: admin kan altijd bewerken
        const canEdit = isAdmin;
        const canP = !isAdmin && !closed && hasTeams;
        let cls = "", lbl = "";
        if (!isAdmin && mp && done) {
          const r = scorePts(mp.home_goals, mp.away_goals, m.home_goals, m.away_goals);
          cls = r.cls; lbl = r.label;
        }
        return (
          <div key={m.id} className="mr">
            {(() => {
              const parts = (m.match_date || "").split(" ");
              const dag = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : "";
              const datum = parts[1] && parts[2] ? `${parts[1]} ${parts[2]}` : "";
              const tijd = parts[3] || "";
              return (
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, paddingBottom:6, borderBottom:"1px solid var(--bd)" }}>
                  <div style={{ fontSize:16, fontWeight:800, color:"var(--gr)", fontFamily:"'Oswald',sans-serif", lineHeight:1 }}>{tijd}</div>
                  <div style={{ width:1, height:16, background:"var(--bd)" }}/>
                  <div style={{ fontSize:10, color:"var(--t3)", fontWeight:700, textTransform:"uppercase" }}>{dag} {datum}</div>
                </div>
              );
            })()}
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
                {closed && !isAdmin && <span className="lock-tag">🔒</span>}
                {!isAdmin && mp && done && <span className={`pts-badge ${cls}`}>{lbl}</span>}
                {!isAdmin && mp && !isP && <span className="pill">{mp.home_goals}–{mp.away_goals}</span>}
                {onShowPreds && hasTeams && <button className="btn btn-out btn-sm" title="Wie tipte wat?" onClick={() => onShowPreds(m)}>👥</button>}
                {canP && !isP && (
                  <button className="btn btn-out btn-sm" onClick={() => { setPe(m.id); setTp({ h: mp?.home_goals ?? "", a: mp?.away_goals ?? "" }); }}>
                    {mp ? "✏️ Wijzig" : "⚽ Voorspel"}
                  </button>
                )}
                {!isAdmin && closed && !mp && hasTeams && <span className="too-late">Te laat</span>}
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
function BonusAdmin({ bonusR, onSave, bonusLocked, onToggleLock }) {
  const [res, setRes] = useState(bonusR || {});
  const [sav, setSav] = useState(false);
  useEffect(() => { setRes(bonusR || {}); }, [bonusR]);
  return (
    <div>
      {/* Vergrendel knop */}
      <div style={{ background:"var(--c2)", border:"1px solid var(--bd)", borderRadius:10, padding:"13px 14px", marginBottom:12, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
        <div>
          <div style={{ fontWeight:700, fontSize:13, color: bonusLocked ? "var(--re)" : "var(--gr)", marginBottom:3 }}>
            {bonusLocked ? "🔒 Bonusvragen vergrendeld" : "🔓 Bonusvragen open"}
          </div>
          <div style={{ fontSize:11, color:"var(--t3)" }}>
            {bonusLocked ? "Deelnemers kunnen niet meer aanpassen" : "Deelnemers kunnen nog tips invullen"}
          </div>
        </div>
        <button
          className="btn"
          style={{ background: bonusLocked ? "rgba(244,63,94,.15)" : "rgba(255,107,0,.15)", border:`1px solid ${bonusLocked ? "rgba(244,63,94,.3)" : "rgba(255,107,0,.3)"}`, color: bonusLocked ? "var(--re)" : "var(--gr)", padding:"9px 14px", fontSize:12, fontWeight:700, borderRadius:8, flexShrink:0 }}
          onClick={onToggleLock}
        >
          {bonusLocked ? "🔓 Openen" : "🔒 Vergrendelen"}
        </button>
      </div>
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

        {/* Hero — rond dubbele gouden rand */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ position:"relative", display:"inline-block", marginBottom:14 }}>
            <div style={{ width:140, height:140, borderRadius:"50%", overflow:"hidden", border:"4px solid #ff6b00", outline:"2px solid #fbbf24", outlineOffset:4, margin:"0 auto", boxShadow:"0 8px 32px rgba(255,107,0,.4)" }}>
              <img src="/gullit.jpg" alt="gullit" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top" }} />
            </div>
            <div style={{ position:"absolute", bottom:2, right:2, background:"var(--gr)", borderRadius:"50%", width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, border:"2px solid var(--bg)" }}>👑</div>
          </div>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:38, letterSpacing:1, lineHeight:1 }}>
            WK <span style={{ color:"var(--gr)", textShadow:"0 0 20px rgba(255,107,0,.4)" }}>2026</span>
          </div>
          <div style={{ fontWeight:900, fontSize:13, color:"var(--am)", letterSpacing:3, textTransform:"uppercase", marginTop:6 }}>Boland's Special</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:12, flexWrap:"wrap" }}>
            <div style={{ background:"rgba(255,107,0,.1)", border:"1px solid rgba(255,107,0,.25)", borderRadius:20, padding:"6px 16px", fontSize:12, color:"var(--gr)", fontWeight:700, display:"flex", alignItems:"center", gap:6 }}>
              👑 Georganiseerd door <span style={{color:"#fff8ee", fontWeight:900}}>Ramon Boland</span>
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{ background:"var(--c1)", border:"1px solid rgba(255,107,0,.15)", borderRadius:20, padding:"22px 20px", boxShadow:"0 20px 60px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.03), 0 0 40px rgba(255,107,0,.08)" }}>
          {/* Tabs */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", background:"var(--bg)", borderRadius:12, padding:3, gap:3, marginBottom:20 }}>
            {["login","register"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding:"11px 8px", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", transition:"all .2s",
                background: mode===m ? "var(--gr)" : "transparent",
                color: mode===m ? "#fff" : "var(--t3)",
                boxShadow: mode===m ? "0 2px 8px rgba(255,107,0,.3)" : "none",
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
            style={{ fontSize:15, fontWeight:800, letterSpacing:.5, boxShadow:"0 4px 20px rgba(255,107,0,.35)", height:52 }}>
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

// ── COUNTDOWN CARD (eigen component zodat alleen dit blok per seconde rendert) ──
function CountdownCard() {
  const c = useCountdown(WK_START);
  if (c.started) return null;
  return (
    <div className="countdown">
      <div className="cd-title">⏱ Aftellen tot het WK begint</div>
      <div className="cd-boxes">
        {[{n:c.d,l:"Dagen"},{n:c.h,l:"Uur"},{n:c.m,l:"Min"},{n:c.s,l:"Sec"}].map((x,i) => (
          <div key={i} className="cd-box">
            <span className="cd-num">{String(x.n).padStart(2,"0")}</span>
            <span className="cd-lbl">{x.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── LIVE / VOLGENDE WEDSTRIJD (tikt elke seconde, zonder hele app mee te slepen) ──
function LiveOrNext({ matches, nextMatch, liveData = [] }) {
  const [, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(id); }, []);
  const now = new Date();

  const liveMatches = matches.filter(m => {
    if (m.home_goals != null) return false;
    const start = parseMatchDate(m.match_date);
    if (!start) return false;
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    return now >= start && now <= end;
  });
  const hasLive = liveMatches.length > 0;

  if (hasLive) return (
    <div style={{ background:"linear-gradient(135deg,rgba(34,197,94,.08),rgba(34,197,94,.04))", border:"1px solid rgba(34,197,94,.25)", borderRadius:"var(--r)", padding:"14px 16px", marginBottom:12 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <span className="live"/>
        <span style={{ fontSize:12, fontWeight:800, color:"#22c55e", textTransform:"uppercase", letterSpacing:1 }}>Live nu</span>
        <span style={{ fontSize:11, color:"var(--t3)" }}>{liveMatches.length} wedstrijd{liveMatches.length>1?"en":""} bezig</span>
      </div>
      {liveMatches.map(m => {
        const api = liveMatchFor(m, liveData);
        const hasScore = api && api.homeScore != null && api.awayScore != null;
        const minute = fmtMin(api?.minute);
        const stage = api?.stage || "";
        const phase = STAGE_NL[stage] || stage || "";
        const showMin = /half|extra/i.test(stage) && minute;     // minuut alleen tijdens actief spel
        const statusLine = [phase, showMin ? minute : null].filter(Boolean).join(" · ");
        const hr = api?.homeRed || 0, ar = api?.awayRed || 0;
        const redCard = (n) => (
          <span style={{ display:"inline-flex", alignItems:"center", gap:2, flexShrink:0 }} title={`${n} rode kaart${n>1?"en":""}`}>
            <span style={{ width:9, height:13, background:"#ef4444", borderRadius:1.5, display:"inline-block" }}/>
            {n > 1 && <span style={{ fontSize:10, fontWeight:800, color:"#ef4444" }}>{n}</span>}
          </span>
        );
        // Vlag los van naam: "🇪🇸 Spanje" → vlag boven, naam eronder (gecentreerd blokje).
        const teamBlock = (teamStr, redN) => {
          const p = (teamStr || "").split(" ");
          const flag = p.length > 1 ? p[0] : "";
          const name = p.length > 1 ? p.slice(1).join(" ") : (teamStr || "");
          return (
            <div style={{ textAlign:"center", minWidth:0 }}>
              {flag && <div style={{ fontSize:22, lineHeight:1 }}>{flag}</div>}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:4, marginTop:4 }}>
                <span style={{ fontSize:13, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</span>
                {redN > 0 && redCard(redN)}
              </div>
            </div>
          );
        };
        return (
          <div key={m.id} style={{ padding:"11px 0", borderBottom:"1px solid rgba(34,197,94,.1)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginBottom:10 }}>
              <span className="live" style={{ margin:0 }}/>
              <span style={{ fontSize:11, fontWeight:800, color:"#22c55e", textTransform:"uppercase", letterSpacing:1 }}>
                Live{statusLine ? ` · ${statusLine}` : ""}
              </span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:10 }}>
              {teamBlock(m.home, hr)}
              <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:28, color:"#22c55e", lineHeight:1, padding:"0 6px", textAlign:"center" }}>
                {hasScore ? `${api.homeScore}–${api.awayScore}` : "LIVE"}
              </div>
              {teamBlock(m.away, ar)}
            </div>
          </div>
        );
      })}
    </div>
  );

  if (!nextMatch) return null;
  const matchTime = parseMatchDate(nextMatch.match_date);
  const diff = matchTime ? matchTime - now : 0;
  const dh = Math.floor(diff/36e5);
  const dm = Math.floor(diff/6e4)%60;
  const ds = Math.floor(diff/1e3)%60;

  return (
    <div className="next-match" style={{ position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", fontFamily:"'Oswald',sans-serif", fontWeight:800, fontSize:11, color:"var(--t3)", textAlign:"right" }}>
        {diff > 0 && (
          <div>
            <div style={{ fontSize:18, color:"var(--gr)", lineHeight:1 }}>
              {dh > 0 ? `${dh}u ${dm}m` : `${dm}m ${ds}s`}
            </div>
            <div style={{ fontSize:9, color:"var(--t3)", marginTop:2, textTransform:"uppercase", letterSpacing:.5 }}>tot aftrap</div>
          </div>
        )}
      </div>
      <div className="nm-label">⚽ Volgende wedstrijd</div>
      <div className="nm-teams" style={{ paddingRight:70 }}>
        <span className="nm-team">{nextMatch.home}</span>
        <span className="nm-vs">vs</span>
        <span className="nm-team away">{nextMatch.away}</span>
      </div>
      <div style={{ fontSize:11, color:"var(--t3)", marginTop:6 }}>
        📅 {nextMatch.match_date} · {nextMatch.phase === "group" ? `Groep ${nextMatch.grp}` : KO_PHASES.find(p => p.id === nextMatch.phase)?.full || nextMatch.phase}
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────
// ── CROP TOOL ─────────────────────────────────────────────────────────────
function CropTool({ src, onCrop, onCancel }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [crop, setCrop] = useState({ x: 0, y: 0, size: 200 });
  const [imgLoaded, setImgLoaded] = useState(false);

  const SIZE = 280;

  useEffect(() => {
    if (!imgLoaded) return;
    setCrop({ x: SIZE/2 - 100, y: SIZE/2 - 100, size: 200 });
  }, [imgLoaded]);

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const onMouseDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = (e.clientX || e.touches[0].clientX) - rect.left;
    const cy = (e.clientY || e.touches[0].clientY) - rect.top;
    if (cx >= crop.x && cx <= crop.x + crop.size && cy >= crop.y && cy <= crop.y + crop.size) {
      setDrag(true);
      setStart({ x: cx - crop.x, y: cy - crop.y });
    }
  };

  const onMouseMove = (e) => {
    if (!drag) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = (e.clientX || e.touches[0].clientX) - rect.left;
    const cy = (e.clientY || e.touches[0].clientY) - rect.top;
    setCrop(c => ({
      ...c,
      x: clamp(cx - start.x, 0, SIZE - c.size),
      y: clamp(cy - start.y, 0, SIZE - c.size),
    }));
  };

  const applyCrop = () => {
    const img = imgRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    const scaleX = img.naturalWidth / SIZE;
    const scaleY = img.naturalHeight / SIZE;
    ctx.drawImage(img, crop.x * scaleX, crop.y * scaleY, crop.size * scaleX, crop.size * scaleY, 0, 0, 400, 400);
    canvas.toBlob(blob => onCrop(blob), "image/jpeg", 0.7);
  };

  return (
    <div style={{ marginTop:10, background:"var(--c2)", borderRadius:10, padding:12, border:"1px solid var(--bd)" }}>
      <div style={{ fontSize:12, color:"var(--t3)", marginBottom:8, textAlign:"center" }}>Versleep het kader om bij te snijden</div>
      <div style={{ position:"relative", width:SIZE, height:SIZE, margin:"0 auto", cursor:"move", userSelect:"none", overflow:"hidden", borderRadius:8, background:"#000" }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={() => setDrag(false)} onMouseLeave={() => setDrag(false)}
        onTouchStart={onMouseDown} onTouchMove={onMouseMove} onTouchEnd={() => setDrag(false)}>
        <img ref={imgRef} src={src} onLoad={() => setImgLoaded(true)} style={{ width:SIZE, height:SIZE, objectFit:"contain", display:"block", pointerEvents:"none" }} />
        {imgLoaded && <>
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)", pointerEvents:"none" }} />
          <div style={{ position:"absolute", left:crop.x, top:crop.y, width:crop.size, height:crop.size, border:"2px solid #ff6b00", borderRadius:"50%", boxShadow:"0 0 0 9999px rgba(0,0,0,0.5)", background:"transparent", pointerEvents:"none" }} />
        </>}
      </div>
      <div style={{ display:"flex", gap:8, marginTop:10 }}>
        <button className="btn btn-out" style={{ flex:1, padding:"8px" }} onClick={onCancel}>Annuleren</button>
        <button className="btn btn-green" style={{ flex:1, padding:"8px" }} onClick={applyCrop}>✓ Bijsnijden</button>
      </div>
    </div>
  );
}

export default function App() {
  const [matches,       setMatches]       = useState([]);
  const matchesRef = useRef(matches);
  const [users,         setUsers]         = useState([]);
  const [preds,         setPreds]         = useState([]);
  const [bonusA,        setBonusA]        = useState([]);
  const [bonusR,        setBonusR]        = useState(null);
  const [bonusLocked,   setBonusLocked]   = useState(false);
  const [standingPreds, setStandingPreds] = useState([]);
  const [session,       setSession]       = useState(() => { try { const s = JSON.parse(localStorage.getItem("wkp2026")); return (s && s.id) ? s : null; } catch { return null; } });
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
  const [predsModal,    setPredsModal]    = useState(null);  // wedstrijd waarvan ieders tip getoond wordt
  const [modalLoading,  setModalLoading]  = useState(false);
  const [potN,          setPotN]          = useState(10);
  const [twinPopup,     setTwinPopup]     = useState(null);
  const [ptsPopup,      setPtsPopup]      = useState(null);
  const [importing,     setImporting]     = useState(false);
  const [chatMsgs,      setChatMsgs]      = useState([]);
  const [onlineUsers,   setOnlineUsers]   = useState(new Set());
  const [userProfiles,  setUserProfiles]  = useState({});  // {userId: {color, photo}}
  const [showProfile,   setShowProfile]   = useState(false);
  const [profileColor,  setProfileColor]  = useState(null);
  const [profilePhoto,  setProfilePhoto]  = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [showCrop, setShowCrop] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [lastSeen,      setLastSeen]      = useState({});
  const [chatInput,     setChatInput]     = useState("");
  const chatListRef = useRef(null);
  const [chatSending,   setChatSending]   = useState(false);
  const [importLog,     setImportLog]     = useState([]);
  const [lockAllLoading,setLockAllLoading]= useState(false);
  const [exportText,    setExportText]    = useState(null);

  // FIX #17: toast met ref
  const [toast, showToast] = useToast();

  const isAdmin  = session?.isAdmin === true;
  const myPreds  = useMemo(() => preds.filter(p => p.user_id === session?.id), [preds, session?.id]);
  const myBonusAns = useMemo(() => bonusA.find(b => b.user_id === session?.id)?.answers || {}, [bonusA, session?.id]);
  // Geen per-seconde re-render van de hele app meer: één flag die eenmalig omklapt
  const [wkStarted, setWkStarted] = useState(() => Date.now() >= WK_START.getTime());
  useEffect(() => {
    if (wkStarted) return;
    const id = setInterval(() => { if (Date.now() >= WK_START.getTime()) setWkStarted(true); }, 1000);
    return () => clearInterval(id);
  }, [wkStarted]);

  // Live-data centraal: één fetch (elke 8s, alleen als er een wedstrijd bezig is) die
  // zowel de live-balk als de Vandaag-kaarten voedt. Plus een 30s-tik zodat de
  // aftrap-countdown ververst zonder de hele app per seconde te hertekenen.
  // Laatst bekende live-stand uit de browser hydrateren (max 5 min oud), zodat je bij
  // een refresh meteen de stand ziet i.p.v. eerst "LIVE" tot de eerste fetch binnen is.
  const [liveData, setLiveData] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("wkp_live") || "null");
      if (raw && Date.now() - raw.t < 5 * 60 * 1000) return raw.d || [];
    } catch {}
    return [];
  });
  // 30s-tik: ververst de aftrap-countdown én laat hasLiveNow opnieuw evalueren
  // (zodat een wedstrijd die net begint vanzelf de live-fetch aanzet).
  const [nowTick, setNowTick] = useState(0);
  useEffect(() => {
    if (!wkStarted) return;
    const id = setInterval(() => setNowTick(t => t + 1), 30 * 1000);
    return () => clearInterval(id);
  }, [wkStarted]);
  // Is er nú een wedstrijd bezig? (herberekend zodra wedstrijden laden of bij elke tik)
  const hasLiveNow = useMemo(() => matches.some(m => {
    if (m.home_goals != null) return false;
    const st = parseMatchDate(m.match_date);
    return st && Date.now() >= st.getTime() && Date.now() <= st.getTime() + 2 * 60 * 60 * 1000;
  }), [matches, nowTick]);
  // Live-stand ophalen zolang er een wedstrijd bezig is: meteen + elke 8s. We wissen
  // liveData hier NIET als er niks live is, zodat de onthouden stand blijft staan.
  useEffect(() => {
    if (!wkStarted || !hasLiveNow) return;
    let cancelled = false;
    const fetchLive = async () => {
      try {
        const res = await fetch("/api/football-scores?live=1");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          const arr = data?.matches || [];
          setLiveData(arr);
          try { localStorage.setItem("wkp_live", JSON.stringify({ t: Date.now(), d: arr })); } catch {}
        }
      } catch {}
    };
    fetchLive();
    const id = setInterval(fetchLive, 8 * 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, [wkStarted, hasLiveNow]);

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
    // Per groep één keer voorberekenen (hangt niet af van de gebruiker):
    // is de groep volledig gespeeld, en wat is de echte eindvolgorde.
    const groupAllDone = {};
    const groupRealOrder = {};
    for (const g of GROUPS) {
      const gm = matches.filter(m => m.grp === g && m.phase === "group");
      groupAllDone[g] = gm.length > 0 && gm.every(m => m.home_goals != null);
      groupRealOrder[g] = (groupStandings[g] || []).map(r => r.team);
    }
    // Standenvoorspellingen één keer indexeren op "userId|group" voor O(1) lookup.
    const standPredMap = new Map(standingPreds.map(s => [s.user_id + "|" + s.group, s]));

    const standPtsCache = {};
    for (const u of users) {
      let sp = 0;
      for (const g of GROUPS) {
        if (!groupAllDone[g]) continue;
        const pred = standPredMap.get(u.id + "|" + g);
        if (!pred) continue;
        sp += calcStandingPts(pred.order, groupRealOrder[g]);
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

  // Bewegingspijltjes — sla vorige stand op en vergelijk
  const [prevRanks, setPrevRanks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("wkp_prevranks") || "{}"); } catch { return {}; }
  });
  const [lastLeaderboardPts, setLastLeaderboardPts] = useState("");
  useEffect(() => {
    if (leaderboard.length === 0) return;
    const currentPtsKey = leaderboard.map(u => u.id + ":" + u.pts).join(",");
    if (currentPtsKey === lastLeaderboardPts) return;
    const current = {};
    leaderboard.forEach((u, i) => { current[u.id] = i + 1; });
    try {
      const stored = JSON.parse(localStorage.getItem("wkp_prevranks") || "{}");
      if (Object.keys(stored).length > 0) {
        setPrevRanks(stored);
      }
      localStorage.setItem("wkp_prevranks", JSON.stringify(current));
    } catch {}
    setLastLeaderboardPts(currentPtsKey);
  }, [leaderboard]);

  // FIX #15: nextMatch niet op fragiele startsWith maar isPlaceholder helper
  const nextMatch = useMemo(() => matches
    .filter(m => m.home_goals == null && !isPlaceholder(m.home) && !isPlaceholder(m.away))
    .sort((a,b) => {
      const da = parseMatchDate(a.match_date)?.getTime() ?? 9e15;
      const db = parseMatchDate(b.match_date)?.getTime() ?? 9e15;
      return da - db || a.id - b.id;
    })[0], [matches]);

  // ── LOAD ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      // Voorspellingen in batches van 1000 ophalen (Supabase geeft standaard max 1000 per query)
      const fetchAllPreds = async () => {
        const all = [];
        let from = 0;
        const STEP = 1000;
        while (true) {
          const { data, error } = await sb
            .from("predictions")
            .select("user_id,match_id,home_goals,away_goals,id")
            .order("id")
            .range(from, from + STEP - 1);
          if (error || !data) break;
          all.push(...data);
          if (data.length < STEP) break;
          from += STEP;
        }
        return all;
      };
      const [{ data:m },{ data:u },p,{ data:ba },{ data:br },{ data:sp }] = await Promise.all([
        sb.from("matches").select("*").order("id"),
        sb.from("users").select("id,username,avatar_color,avatar_photo,last_seen"),
        fetchAllPreds(),
        sb.from("bonus_answers").select("*"),
        sb.from("bonus_results").select("*").maybeSingle(),
        sb.from("standing_predictions").select("user_id,group,order,id"),
      ]);
      if (m)  setMatches(m);
      if (u) {
        setUsers(u);
        const profiles = {};
        u.forEach(usr => { profiles[usr.id] = { color: usr.avatar_color, photo: usr.avatar_photo }; });
        setUserProfiles(profiles);
      }
      if (p)  setPreds(p);
      if (ba) setBonusA(ba);
      if (br) { setBonusR(br?.answers || null); if (br?.answers?._potN) setPotN(br.answers._potN); if (br?.answers?._bonusLocked) setBonusLocked(true); }
      if (sp) setStandingPreds(sp);
      setBooting(false);
    })();
  }, []);

  useEffect(() => { try { if (session && session.id) localStorage.setItem("wkp2026", JSON.stringify(session)); else localStorage.removeItem("wkp2026"); } catch {} }, [session]);
  useEffect(() => {
    if (!session?.id || session.isAdmin) return;
    // BELANGRIJK: .then() is nodig, anders verstuurt Supabase het verzoek niet (lazy query).
    const update = () => { sb.from("users").update({ last_seen: new Date().toISOString() }).eq("id", session.id).then(() => {}, () => {}); };
    update();
    const id = setInterval(update, 60 * 1000);
    // Schrijf last_seen op de momenten die mobiel altijd vuren: voorgrond halen én wegswipen.
    const onVisibility = () => { update(); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", update);
    window.addEventListener("pageshow", update);
    window.addEventListener("pagehide", update);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", update);
      window.removeEventListener("pageshow", update);
      window.removeEventListener("pagehide", update);
    };
  }, [session?.id]);
  useEffect(() => {
    if (!isAdmin) return;
    const id = setInterval(async () => {
      const { data } = await sb.from("users").select("id,username,avatar_color,avatar_photo,last_seen");
      if (data) setUsers(data);
    }, 30 * 1000);
    return () => clearInterval(id);
  }, [isAdmin]);
  // Versie-check: herlaad automatisch zodra er een nieuwere versie live staat, zodat
  // niemand op oude gecachte code blijft hangen (lost o.a. 'laatst gezien' structureel op).
  useEffect(() => {
    const current = document.querySelector('script[type="module"][src*="/assets/"]')?.getAttribute("src");
    if (!current) return;
    let reloading = false;
    const check = async () => {
      if (reloading || document.hidden) return;
      try {
        const html = await fetch("/?v=" + Date.now(), { cache: "no-store" }).then(r => r.text());
        const m = html.match(/\/assets\/index-[A-Za-z0-9_-]+\.js/);
        if (m && m[0] !== current) { reloading = true; location.reload(); }
      } catch {}
    };
    const onVis = () => { if (!document.hidden) check(); };
    const id = setInterval(check, 10 * 60 * 1000);
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, []);
  // Scroll chat alleen naar onderen bij nieuw bericht of bij openen van de tab
  useEffect(() => {
    if (tab === "chat" && chatListRef.current) chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
  }, [chatMsgs.length, tab]);

  // Auto-import draait nu server-side via GitHub Actions (elke 15 min), ook zonder
  // dat iemand is ingelogd — de in-app variant is daardoor overbodig en verwijderd.

  // ── AUTO VERGRENDELEN BIJ AANVANG WEDSTRIJD ──────────────────────────
  useEffect(() => {
    if (!matches.length || !isAdmin) return; // alleen admin-client schrijft locks weg
    const checkLocks = async () => {
      const now = new Date();
      for (const m of matches) {
        if (m.locked) continue;
        const deadline = tipDeadline(m.match_date);
        if (deadline && now >= deadline) {
          await sb.from("matches").update({ locked: true }).eq("id", m.id);
          setMatches(ms => ms.map(x => x.id === m.id ? { ...x, locked: true } : x));
        }
      }
    };
    checkLocks();
    const id = setInterval(checkLocks, 60 * 1000);
    return () => clearInterval(id);
  }, [matches.length, isAdmin]);

  // ── CHAT LADEN EN REALTIME + PRESENCE ──────────────────────────────
  useEffect(() => {
    if (!session) return;
    // Laad laatste 50 berichten
    sb.from("chat_messages").select("*").order("created_at", { ascending: true }).limit(100).then(({ data }) => {
      if (data) setChatMsgs(data);
    });
    // Realtime chat + presence (online indicator)
    const channel = sb.channel("wkpoule_presence")
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"chat_messages" }, payload => {
        setChatMsgs(ms => ms.some(m => m.id === payload.new.id) ? ms : [...ms, payload.new]);
      })
      .on("postgres_changes", { event:"DELETE", schema:"public", table:"chat_messages" }, payload => {
        setChatMsgs(ms => ms.filter(m => m.id !== payload.old.id));
      })
      .on("postgres_changes", { event:"UPDATE", schema:"public", table:"matches" }, payload => {
        setMatches(ms => ms.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
      })
      .on("presence", { event:"sync" }, () => {
        const state = channel.presenceState();
        const names = [...new Set(Object.values(state).flat().map(p => p.username).filter(Boolean))];
        setOnlineUsers(new Set(names));
        // Direct last_seen wegschrijven voor wie nu online is — vangnet voor toestellen
        // die hun eigen tijd niet wegschrijven (oude code). RLS staat uit, dus dit mag.
        const now = new Date().toISOString();
        names.forEach(name => { sb.from("users").update({ last_seen: now }).eq("username", name).then(() => {}, () => {}); });
      })
      .on("presence", { event:"join" }, ({ newPresences }) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          newPresences.forEach(p => next.add(p.username));
          return next;
        });
      })
      .on("presence", { event:"leave" }, ({ leftPresences }) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          leftPresences.forEach(p => next.delete(p.username));
          return next;
        });
        // Sla laatste gezien op (in geheugen voor directe weergave)
        const now = new Date().toISOString();
        setLastSeen(prev => {
          const next = {...prev};
          leftPresences.forEach(p => { next[p.username] = now; });
          return next;
        });
        // Schrijf óók naar de database vanaf dit (nog draaiende) toestel.
        // Het toestel dat wegswipet kan dit zelf vaak niet meer afmaken, een
        // ander online toestel wél. RLS staat uit, dus elke rij mag bijgewerkt.
        leftPresences.forEach(p => {
          if (p.username) sb.from("users").update({ last_seen: now }).eq("username", p.username).then(() => {}, () => {});
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ username: session.username, online_at: new Date().toISOString() });
        }
      });
    // Schrijf elke minuut last_seen weg voor ALLE online deelnemers, gezien via
    // presence. Sommige toestellen (mobiel) krijgen hun eigen REST-update niet
    // weggeschreven, maar presence werkt daar wél — dus laat elk draaiend
    // toestel de online gebruikers bijwerken. RLS staat uit, dus dit mag.
    const persistOnline = () => {
      const state = channel.presenceState();
      const names = [...new Set(Object.values(state).flat().map(p => p.username).filter(Boolean))];
      const now = new Date().toISOString();
      names.forEach(name => { sb.from("users").update({ last_seen: now }).eq("username", name).then(() => {}, () => {}); });
    };
    persistOnline();
    const persistId = setInterval(persistOnline, 30 * 1000);
    return () => { clearInterval(persistId); sb.removeChannel(channel); };
  }, [session?.username]);

  // ── AUTH ──────────────────────────────────────────────────────────────
  const login = async () => {
    const { u, p } = form;
    if (!u || !p) return setErr("Vul alles in.");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "login", username: u, password: p }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) return setErr(data.error || "Gebruikersnaam of wachtwoord onjuist.");
      setSession({ id: data.id, username: data.username, isAdmin: data.isAdmin === true });
      setErr(""); setForm({ u:"", p:"", p2:"" });
    } catch {
      setLoading(false);
      setErr("Verbinding mislukt, probeer opnieuw.");
    }
  };

  const register = async () => {
    const { u, p, p2 } = form;
    if (!u || !p || !p2) return setErr("Vul alles in.");
    if (u.length < 3) return setErr("Naam minimaal 3 tekens.");
    if (p.length < 6) return setErr("Wachtwoord minimaal 6 tekens.");
    if (p !== p2) return setErr("Wachtwoorden komen niet overeen.");
    if (u.toLowerCase() === "admin") return setErr("Naam niet beschikbaar.");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "register", username: u, password: p }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) return setErr(data.error || "Er ging iets mis, probeer opnieuw.");
      setUsers(us => [...us, { id:data.id, username:data.username }]);
      setSession({ id:data.id, username:data.username, isAdmin:false });
      setErr(""); setForm({ u:"", p:"", p2:"" });
      showToast(`Welkom ${data.username}! 🎉`);
    } catch {
      setLoading(false);
      setErr("Verbinding mislukt, probeer opnieuw.");
    }
  };

  // ── DATA ACTIONS — FIX #14: error handling ────────────────────────────
  const savePred = async (mid, hg, ag) => {
    if (!session?.id) return false;
    const mGuard = matchMap.get(mid);
    const deadline = mGuard ? tipDeadline(mGuard.match_date) : null;
    if (mGuard?.locked || (deadline && new Date() >= deadline)) {
      showToast("🔒 Te laat — tippen sluit 5 minuten voor aftrap", 3000); return false;
    }

    // Beide velden leeg → tip verwijderen (op user_id+match_id, niet op geheugen-id)
    const bothEmpty = (hg == null || Number.isNaN(hg)) && (ag == null || Number.isNaN(ag));
    if (bothEmpty) {
      const { error } = await sb.from("predictions").delete()
        .eq("user_id", session.id).eq("match_id", mid);
      if (error) { showToast("❌ Verwijderen mislukt", 3000); return false; }
      setPreds(ps => ps.filter(p => !(p.user_id === session.id && p.match_id === mid)));
      showToast("🗑️ Tip verwijderd");
      return true;
    }

    // Eén veld leeg of ongeldig getal → duidelijke melding i.p.v. cryptische DB-fout
    if (!Number.isInteger(hg) || !Number.isInteger(ag) || hg < 0 || ag < 0) {
      showToast("❌ Vul beide scores in", 3000); return false;
    }

    // In de knockout-fase bestaat geen gelijkspel — er moet een winnaar getipt worden.
    if (mGuard && mGuard.phase !== "group" && hg === ag) {
      showToast("❌ In de knockout kan het geen gelijkspel zijn — kies een winnaar", 3500); return false;
    }

    // Upsert op de unieke index (user_id, match_id): werkt ongeacht of de tip
    // al in het geheugen geladen is. Lost de 409 Conflict op bij grote datasets.
    const { data, error } = await sb.from("predictions")
      .upsert({ user_id:session.id, match_id:mid, home_goals:hg, away_goals:ag },
              { onConflict: "user_id,match_id" })
      .select().single();
    if (error) { showToast("❌ Opslaan mislukt", 3000); return false; }
    if (data) {
      setPreds(ps => {
        const found = ps.some(p => p.id === data.id);
        return found ? ps.map(p => p.id === data.id ? data : p) : [...ps, data];
      });
    }
    // Check voor exacte uitslag — confetti!
    const m = matchMap.get(mid);
    if (m && m.home_goals != null) {
      const r = scorePts(hg, ag, m.home_goals, m.away_goals);
      if (r.exact) {
        fireConfetti();
        setPtsPopup("+7 Exact! 🎯");
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

  // Houd matchesRef gelijk aan de actuele matches (voor runImport vanuit timers).
  useEffect(() => { matchesRef.current = matches; }, [matches]);

  // Kern van de uitslagen-import: API ophalen, WK-wedstrijden matchen, scores wegschrijven.
  // Gebruikt door zowel de handmatige knop als de automatische import na een wedstrijd.
  const runImport = async () => {
    const res = await fetch("/api/football-scores?days=2");
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(`Status ${res.status}: ${errData.body || errData.error || "onbekend"}`);
    }
    const data = await res.json();
    const events = data?.matches || [];
    const wkMatches = events.filter(e => TEAM_MAP[e.homeTeam] && TEAM_MAP[e.awayTeam]);
    let updated = 0, skipped = 0;
    const log = [];
    for (const e of wkMatches) {
      if (!e.finished) { skipped++; continue; }
      let hg = e.homeScore, ag = e.awayScore;
      if ((hg == null || ag == null) && e.scoreStr) {
        const parts = e.scoreStr.split("-").map(s => parseInt(s.trim(), 10));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) { hg = parts[0]; ag = parts[1]; }
      }
      if (hg == null || ag == null) { skipped++; continue; }
      const nlHome = TEAM_MAP[e.homeTeam], nlAway = TEAM_MAP[e.awayTeam];
      if (!nlHome || !nlAway) { log.push(`⚠️ Onbekend team: ${e.homeTeam} vs ${e.awayTeam}`); skipped++; continue; }
      const match = matchesRef.current.find(m => m.home?.includes(nlHome) && m.away?.includes(nlAway) && m.home_goals == null);
      if (!match) { skipped++; continue; }
      const { error } = await sb.from("matches").update({ home_goals: hg, away_goals: ag }).eq("id", match.id);
      if (!error) {
        setMatches(ms => ms.map(m => m.id === match.id ? { ...m, home_goals: hg, away_goals: ag } : m));
        log.push(`✓ ${nlHome} ${hg}–${ag} ${nlAway}`);
        updated++;
      }
    }
    return { updated, skipped, log, found: wkMatches.length };
  };

  // ── CLIENT-SIDE AUTO-IMPORT (aanvulling op GitHub Actions) ───────────
  // GitHub knijpt het */5-schema af tot ~1x/uur. Zolang de app open is draaien we
  // de import zelf elke 5 min, maar ALLEEN als er een wedstrijd bezig/net afgelopen is
  // (anders geen API-call → geen quotaverbruik). Alleen admin schrijft, zodat niet elke
  // client tegelijk dezelfde update pusht.
  const runImportRef = useRef(runImport);
  runImportRef.current = runImport;
  useEffect(() => {
    if (!isAdmin || !wkStarted) return;
    const maybeImport = async () => {
      const now = Date.now();
      const hasOpen = matchesRef.current.some(m => {
        if (m.home_goals != null) return false;
        const start = parseMatchDate(m.match_date);
        return start && now >= start.getTime();
      });
      if (!hasOpen) return; // niets te importeren → sla de API-call over
      try { await runImportRef.current(); } catch {}
    };
    maybeImport();
    const id = setInterval(maybeImport, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [isAdmin, wkStarted]);

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

  const saveProfile = async () => {
    if (!session?.id) return;
    setSavingProfile(true);
    const upd = {};
    if (profileColor) upd.avatar_color = profileColor;
    if (profilePhoto && typeof profilePhoto !== "string") {
      const ext = profilePhoto.name ? profilePhoto.name.split(".").pop() : "jpg";
      const path = `${session.id}.${ext}`;
      const { error: upErr } = await sb.storage.from("avatars").upload(path, profilePhoto, { upsert: true });
      if (upErr) { showToast("❌ Foto upload mislukt"); setSavingProfile(false); return; }
      const { data: urlData } = sb.storage.from("avatars").getPublicUrl(path);
      upd.avatar_photo = urlData.publicUrl + "?t=" + Date.now();
    }
    if (Object.keys(upd).length > 0) {
      await sb.from("users").update(upd).eq("id", session.id);
      const profileUpd = {};
      if (upd.avatar_color) profileUpd.color = upd.avatar_color;
      if (upd.avatar_photo) profileUpd.photo = upd.avatar_photo;
      setUserProfiles(prev => ({ ...prev, [session.id]: { ...prev[session.id], ...profileUpd } }));
      setUsers(us => us.map(u => u.id === session.id ? { ...u, ...upd } : u));
      showToast("✓ Profiel opgeslagen!");
    }
    setShowProfile(false);
    setSavingProfile(false);
    setProfilePhotoPreview(null);
    setProfileColor(null);
    setProfilePhoto(null);
  };

  const saveBonus = async (answers) => {
    if (!session?.id) return;
    const ex = bonusA.find(b => b.user_id === session.id);
    if (ex) {
      const { error } = await sb.from("bonus_answers").update({ answers }).eq("user_id", session.id);
      if (error) { showToast("❌ Opslaan mislukt", 3000); return; }
      setBonusA(bs => bs.map(b => b.user_id === session.id ? { ...b, answers } : b));
    } else {
      const { data, error } = await sb.from("bonus_answers").insert({ user_id:session.id, answers }).select().single();
      if (error) { showToast("❌ Opslaan mislukt", 3000); return; }
      if (data) setBonusA(bs => [...bs, data]);
    }
    showToast("✓ Bonus opgeslagen");
  };

  const deleteChat = async (msgId) => {
    await sb.from("chat_messages").delete().eq("id", msgId);
    setChatMsgs(ms => ms.filter(m => m.id !== msgId));
    showToast("🗑️ Bericht verwijderd");
  };

  const sendChat = async () => {
    if (!chatInput.trim() || !session) return;
    setChatSending(true);
    const msg = {
      user_id: session.id || "admin",
      username: session.username,
      message: chatInput.trim(),
    };
    const { data, error } = await sb.from("chat_messages").insert(msg).select().single();
    setChatSending(false);
    if (error) { showToast("❌ Bericht niet verzonden", 3000); return; }
    // Direct lokaal tonen (niet wachten op realtime-echo); dubbele voorkomen via id.
    if (data) setChatMsgs(ms => ms.some(m => m.id === data.id) ? ms : [...ms, data]);
    setChatInput("");
  };

  const saveBonusResults = async (res) => {
    const { data:ex } = await sb.from("bonus_results").select("*").maybeSingle();
    if (ex) await sb.from("bonus_results").update({ answers:res }).eq("id", ex.id);
    else await sb.from("bonus_results").insert({ answers:res });
    setBonusR(res); showToast("✓ Bonus resultaten opgeslagen");
  };

  const saveStandingPred = async (group, order) => {
    if (!session?.id) return;
    if (wkStarted) { showToast("🔒 WK is begonnen", 3000); return; }
    const ex = standingPreds.find(s => s.user_id === session.id && s.group === group);
    if (ex) {
      const { error } = await sb.from("standing_predictions").update({ order }).eq("id", ex.id);
      if (error) { showToast("❌ Opslaan mislukt", 3000); return; }
      setStandingPreds(sp => sp.map(s => s.id === ex.id ? { ...s, order } : s));
    } else {
      const { data, error } = await sb.from("standing_predictions").insert({ user_id:session.id, group, order }).select().single();
      if (error) { showToast("❌ Opslaan mislukt", 3000); return; }
      if (data) setStandingPreds(sp => [...sp, data]);
    }
    showToast("✓ Eindstand opgeslagen");
  };

  // ── RENDER GUARDS ──────────────────────────────────────────────────────
  if (!session) return <AuthPage mode={authMode} setMode={setAuthMode} form={form} setForm={setForm} err={err} loading={loading} onLogin={login} onRegister={register} />;

  if (booting) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:14 }}>
      <style>{CSS}</style>
      <div className="spin" style={{ fontSize:28 }}>⚽</div>
      <div style={{ color:"var(--t3)", fontSize:13, fontWeight:600 }}>Laden...</div>
    </div>
  );

  // Badge: wedstrijden vandaag zonder tip
  const todayMatches = matches.filter(m => {
    const d = parseMatchDate(m.match_date);
    if (!d) return false;
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth()
      && m.home_goals == null && !m.locked;
  });
  const todayUntiped = !isAdmin && todayMatches.filter(m => !myPreds.find(p => p.match_id === m.id)).length > 0;

  const TABS = isAdmin
    ? [{ id:"stand",ic:"🏆",lb:"Stand" },{ id:"vandaag",ic:"📅",lb:"Vandaag" },{ id:"groepen",ic:"⚽",lb:"Groepen" },{ id:"ko",ic:"🥊",lb:"KO" },{ id:"standen",ic:"📊",lb:"Standen" },{ id:"bonus",ic:"🎯",lb:"Bonus" },{ id:"pot",ic:"💶",lb:"Pot" },{ id:"beheer",ic:"👑",lb:"Beheer" }]
    : [{ id:"stand",ic:"🏆",lb:"Stand" },{ id:"vandaag",ic:"📅",lb:"Vandaag" },{ id:"groepen",ic:"⚽",lb:"Groepen" },{ id:"ko",ic:"🥊",lb:"KO" },{ id:"standen",ic:"📊",lb:"Standen" },{ id:"bonus",ic:"🎯",lb:"Bonus" },{ id:"pot",ic:"💶",lb:"Pot" },{ id:"mijn",ic:"📋",lb:"Mijn" }];

  const myStandingPred = standingPreds.find(s => s.user_id === session?.id && s.group === grp)?.order;

  return (
    <div style={{ background:"var(--bg)", minHeight:"100vh" }}>
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
      {predsModal && (
        <MatchPredsModal match={predsModal} users={users} allPreds={preds} userProfiles={userProfiles} myId={session?.id} onClose={() => setPredsModal(null)} />
      )}

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
      {/* PROFIEL MODAL */}
      {showProfile && !isAdmin && (
        <Modal title="👤 Mijn Profiel" onClose={() => { setShowProfile(false); setProfileColor(null); setProfilePhoto(null); setProfilePhotoPreview(null); }}>
          <div style={{ textAlign:"center", marginBottom:16 }}>
            <Avatar userId={session.id} username={session.username} size={72} profiles={profileColor || profilePhotoPreview || userProfiles[session.id]?.photo ? { [session.id]: { color: profileColor || userProfiles[session.id]?.color, photo: profilePhotoPreview || userProfiles[session.id]?.photo }} : userProfiles} />
            <div style={{ fontWeight:700, fontSize:14, marginTop:8 }}>{session.username}</div>
          </div>
          <div style={{ marginBottom:12 }}>
            <label className="lbl">🎨 Kies jouw kleur</label>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {["#10b981","#ff6b00","#3b82f6","#ec4899","#8b5cf6","#ef4444","#f59e0b","#14b8a6","#84cc16","#f97316","#a855f7","#06b6d4","#d946ef","#e11d48","#eab308","#64748b"].map(color => (
                <div key={color} onClick={() => setProfileColor(color)} style={{ width:30, height:30, borderRadius:"50%", background:color, cursor:"pointer", border: profileColor===color ? "3px solid white" : "3px solid transparent", transform: profileColor===color ? "scale(1.15)" : "scale(1)", transition:"all .15s" }}/>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label className="lbl">📸 Profielfoto uploaden</label>
            <input type="file" accept="image/*" style={{ display:"none" }} id="photoInput" onChange={e => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = ev => { setProfilePhotoPreview(ev.target.result); setShowCrop(true); };
              reader.readAsDataURL(file);
            }}/>
            <button className="btn btn-out" style={{ width:"100%", padding:"10px" }} onClick={() => document.getElementById("photoInput").click()}>
              {profilePhoto ? "✓ Foto bijgesneden" : "📸 Foto kiezen..."}
            </button>
            {profilePhoto && !showCrop && <div style={{ marginTop:8, textAlign:"center" }}><img src={profilePhotoPreview} style={{ width:60, height:60, borderRadius:"50%", objectFit:"cover", border:"2px solid var(--gr)" }}/></div>}
            {showCrop && profilePhotoPreview && <CropTool src={profilePhotoPreview} onCrop={blob => { setProfilePhoto(blob); setShowCrop(false); }} onCancel={() => { setShowCrop(false); setProfilePhotoPreview(null); }} />}
          </div>
          <button className="btn btn-green" disabled={savingProfile || (!profileColor && !profilePhoto)} onClick={saveProfile}>
            {savingProfile ? "Opslaan..." : "✓ Opslaan"}
          </button>
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
            {isAdmin && <span style={{ background:"rgba(255,107,0,.15)", color:"var(--gr)", fontSize:9, fontWeight:900, borderRadius:4, padding:"2px 6px", letterSpacing:.5, border:"1px solid rgba(255,107,0,.15)", flexShrink:0 }}>ADMIN</span>}
            <span style={{ fontSize:11, color:"var(--t3)", fontWeight:700, maxWidth:70, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{session.username}</span>
            <button className="btn btn-out btn-sm" style={{ padding:"4px 8px", fontSize:11 }} onClick={() => setShowProfile(true)}>👤</button>
            <button className="btn btn-out btn-sm" style={{ padding:"4px 8px", fontSize:11 }} onClick={async () => { if (session?.id && !isAdmin) { await sb.from("users").update({ last_seen: new Date().toISOString() }).eq("id", session.id); } setSession(null); setTab("stand"); }}>Uit</button>
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
                  <span style={{ fontSize:32, filter:"drop-shadow(0 0 10px rgba(255,107,0,.4))" }}>🏆</span>
                  <div>
                    <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:28, letterSpacing:.5, lineHeight:1 }}>WK <span style={{ color:"var(--gr)" }}>2026</span></div>
                    <div style={{ fontWeight:800, fontSize:13, color:"var(--am)", letterSpacing:2, textTransform:"uppercase", marginTop:2 }}>Boland's Special</div>
                  </div>
                </div>
                <div className="banner-divider" />
              </div>
            </div>

            <CountdownCard />

            {wkStarted && <LiveOrNext matches={matches} nextMatch={nextMatch} liveData={liveData} />}

            <div className="sec-title">Tussenstand</div>
            <div className="sec-sub">3pt winnaar · +1pt per team-goals · +2 bonus bij exact (= 7pt) · 10pt bonusvragen · 5pt eindstand</div>

            {leaderboard.length === 0
              ? <div className="empty"><div className="empty-i">👥</div><div className="empty-t">Nog geen deelnemers.<br />Deel de link met je vrienden!</div></div>
              : <div className="card">
                {/* Tabel header */}
                <div style={{ display:"grid", gridTemplateColumns:"36px 48px 1fr 44px 44px 50px", gap:6, padding:"8px 14px", borderBottom:"1px solid var(--bd)" }}>
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
                      display:"grid", gridTemplateColumns:"36px 48px 1fr 44px 44px 50px", gap:6,
                      padding:"11px 14px", borderBottom:"1px solid rgba(255,255,255,.06)",
                      alignItems:"center",
                      background: isMe ? "rgba(255,107,0,.06)" : "transparent",
                      borderLeft: isMe ? "2px solid var(--gr)" : "2px solid transparent",
                      animation:`fu .3s ease ${i*50}ms both`,
                    }}>
                      {/* Positie + pijltje */}
                      <div style={{ textAlign:"center", fontSize:13, color: i===0?"#f59e0b": i===1?"#94a3b8": i===2?"#cd7f32":"var(--t3)", fontWeight:700, display:"flex", flexDirection:"column", alignItems:"center", gap:1 }}>
                        {i < 3 ? medals[i] : i+1}
                        {(() => {
                          const prev = prevRanks[u.id];
                          const curr = i + 1;
                          if (!prev || prev === curr) return <span style={{ fontSize:8, color:"var(--t3)", lineHeight:1 }}>–</span>;
                          const diff = Math.abs(prev - curr);
                          if (prev > curr) return <span style={{ fontSize:9, color:"#22c55e", lineHeight:1, fontWeight:900 }}>▲{diff}</span>;
                          return <span style={{ fontSize:9, color:"#ef4444", lineHeight:1, fontWeight:900 }}>▼{diff}</span>;
                        })()}
                      </div>
                      {/* Avatar */}
                      <Avatar userId={u.id} username={u.username} size={44} profiles={userProfiles} />
                      {/* Naam + balk */}
                      <div style={{ minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
                          <span style={{ fontSize:13, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:"var(--t1)" }}>{u.username}</span>
                          {isMe && <span style={{ background:"rgba(255,107,0,.15)", color:"var(--gr)", fontSize:9, fontWeight:900, borderRadius:3, padding:"1px 5px", border:"1px solid rgba(255,107,0,.15)", flexShrink:0 }}>JIJ</span>}
                          {!isMe && onlineUsers.has(u.username) && <span style={{ width:7, height:7, borderRadius:"50%", background:"#22c55e", display:"inline-block", flexShrink:0, boxShadow:"0 0 5px #22c55e" }} title="Online"/>}
                        </div>
                        <div style={{ height:3, background:"var(--c3)", borderRadius:2, overflow:"hidden" }}>
                          <div style={{ width:`${pct}%`, height:"100%", background: color, borderRadius:2, transition:"width 1s ease" }} />
                        </div>
                      </div>
                      {/* Exact */}
                      <div style={{ fontSize:13, textAlign:"center", color:"var(--t2)" }}>{u.exact}×</div>
                      {/* Bonus */}
                      <div style={{ fontSize:13, textAlign:"center", color: u.bp>0 ? "var(--am)" : "var(--t3)" }}>{u.bp > 0 ? `+${u.bp}` : "—"}</div>
                      {/* Totaal */}
                      <div style={{ fontSize:17, fontWeight:700, textAlign:"right", color:"var(--gr)", fontFamily:"'Oswald',sans-serif" }}>
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
                <Collapse title="🏅 Speeldag winnaars">
                    {(() => {
                      const playedMatches = matches.filter(m => m.home_goals != null && m.away_goals != null && m.match_date);
                      if (playedMatches.length === 0) return <div style={{ fontSize:13, color:"var(--t3)", padding:"8px 0", textAlign:"center" }}>Nog geen gespeelde wedstrijden</div>;
                      const days = [...new Set(playedMatches.map(m => {
                        const parts = m.match_date.trim().split(" ");
                        return parts[1] + " " + parts[2];
                      }))].sort((a, b) => {
                        const pa = a.split(" "); const pb = b.split(" ");
                        return (NL_MONTHS[pa[1]?.toLowerCase()] * 31 + parseInt(pa[0])) - (NL_MONTHS[pb[1]?.toLowerCase()] * 31 + parseInt(pb[0]));
                      });
                      const dayWinners = days.map(day => {
                        const dayMatches = playedMatches.filter(m => {
                          const parts = m.match_date.trim().split(" ");
                          return (parts[1] + " " + parts[2]) === day;
                        });
                        const scores = {};
                        for (const u of leaderboard) {
                          const up = preds.filter(p => p.user_id === u.id && dayMatches.find(m => m.id === p.match_id));
                          let pts = 0;
                          for (const p of up) {
                            const m = dayMatches.find(x => x.id === p.match_id);
                            if (m) pts += scorePts(p.home_goals, p.away_goals, m.home_goals, m.away_goals).pts;
                          }
                          scores[u.id] = pts;
                        }
                        const maxPts = Math.max(...Object.values(scores));
                        const winners = leaderboard.filter(u => scores[u.id] === maxPts);
                        return { day, winners, pts: maxPts };
                      }).filter(d => d.winners.length && d.pts > 0);
                      if (dayWinners.length === 0) return <div style={{ fontSize:13, color:"var(--t3)", padding:"8px 0", textAlign:"center" }}>Nog geen winnaars</div>;
                      const winCounts = {};
                      dayWinners.forEach(d => d.winners.forEach(w => { winCounts[w.id] = (winCounts[w.id] || 0) + 1; }));
                      const mostWins = Math.max(...Object.values(winCounts));
                      const topWinner = leaderboard.find(u => winCounts[u.id] === mostWins);
                      const joinNames = (arr) => arr.length <= 1 ? (arr[0] || "") : arr.slice(0, -1).join(", ") + " & " + arr[arr.length - 1];
                      return (
                        <div>
                          {dayWinners.map((d, i) => {
                            const shared = d.winners.length > 1;
                            return (
                              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:"0.5px solid rgba(255,255,255,.05)" }}>
                                <span style={{ fontSize:18, width:24, textAlign:"center", flexShrink:0 }}>🥇</span>
                                <div style={{ display:"flex", flexShrink:0 }}>
                                  {d.winners.map((w, j) => (
                                    <div key={w.id} style={{ marginLeft: j === 0 ? 0 : -11, borderRadius:"50%", boxShadow:"0 0 0 2px var(--c1)" }}>
                                      <Avatar userId={w.id} username={w.username} size={32} profiles={userProfiles} />
                                    </div>
                                  ))}
                                </div>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ fontSize:13, fontWeight:700, color:"var(--t1)", lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                    {joinNames(d.winners.map(w => w.username))}
                                    {shared && <span style={{ fontSize:10, color:"var(--am)", fontWeight:700 }}> · gedeeld</span>}
                                  </div>
                                  <div style={{ fontSize:11, color:"var(--t3)" }}>dag {i+1} · {d.day}</div>
                                </div>
                                <div style={{ fontSize:15, fontWeight:700, color:"var(--gr)", fontFamily:"'Oswald',sans-serif", flexShrink:0 }}>{d.pts} pt</div>
                              </div>
                            );
                          })}
                          {topWinner && mostWins > 1 && (
                            <div style={{ marginTop:10, padding:"8px 12px", background:"rgba(255,107,0,.08)", borderRadius:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                              <span style={{ fontSize:12, color:"var(--t3)" }}>Meeste dagwinsten</span>
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <Avatar userId={topWinner.id} username={topWinner.username} size={22} profiles={userProfiles} />
                                <span style={{ fontSize:13, fontWeight:700, color:"var(--gr)" }}>{topWinner.username} · {mostWins}×</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                </Collapse>
                {leaderboard.some(u => u.bp > 0) && (
                  <Collapse title="Bonuspunten">
                      {[...leaderboard].sort((a,b) => b.bp - a.bp).map(u => {
                        const color = avatarColor(u.username);
                        const max = leaderboard.reduce((m,x) => Math.max(m, x.bp), 0) || 1;
                        const pct = Math.round((u.bp / max) * 100);
                        return (
                          <div key={u.id} className="stat-row">
                            <Avatar userId={u.id} username={u.username} size={44} profiles={userProfiles} />
                            <div className="stat-bar-wrap">
                              <div className="stat-name"><span>{u.username}</span><span style={{ color:"var(--am)" }}>+{u.bp}pt</span></div>
                              <div className="stat-bar"><div className="stat-fill" style={{ width:`${pct}%`, background:"var(--am)" }} /></div>
                            </div>
                          </div>
                        );
                      })}
                  </Collapse>
                )}
                {leaderboard.some(u => u.sp > 0) && (
                  <Collapse title="Eindstand punten">
                      {[...leaderboard].sort((a,b) => b.sp - a.sp).map(u => {
                        const color = avatarColor(u.username);
                        const max = leaderboard.reduce((m,x) => Math.max(m, x.sp), 0) || 1;
                        const pct = Math.round((u.sp / max) * 100);
                        return (
                          <div key={u.id} className="stat-row">
                            <Avatar userId={u.id} username={u.username} size={44} profiles={userProfiles} />
                            <div className="stat-bar-wrap">
                              <div className="stat-name"><span>{u.username}</span><span style={{ color:"#60a5fa" }}>+{u.sp}pt</span></div>
                              <div className="stat-bar"><div className="stat-fill" style={{ width:`${pct}%`, background:"#60a5fa" }} /></div>
                            </div>
                          </div>
                        );
                      })}
                  </Collapse>
                )}

                {/* ── BESTE RONDE ── */}
                {leaderboard.length > 0 && (() => {
                  // Groepeer wedstrijden per dag
                  const dayPts = {};
                  for (const u of leaderboard) {
                    const up = preds.filter(p => p.user_id === u.id);
                    for (const p of up) {
                      const m = matchMap.get(p.match_id);
                      if (!m || m.home_goals == null || m.away_goals == null || !m.match_date) continue;
                      const parts = m.match_date.trim().split(" ");
                      const dayKey = `${parts[1]} ${parts[2]}`; // "11 jun"
                      if (!dayPts[u.id]) dayPts[u.id] = {};
                      if (!dayPts[u.id][dayKey]) dayPts[u.id][dayKey] = 0;
                      const r = scorePts(p.home_goals, p.away_goals, m.home_goals, m.away_goals);
                      dayPts[u.id][dayKey] += r.pts;
                    }
                  }
                  // Vind beste ronde per gebruiker
                  const bestRounds = leaderboard.map(u => {
                    const days = dayPts[u.id] || {};
                    const best = Object.entries(days).sort((a,b) => b[1]-a[1])[0];
                    return { ...u, bestDay: best?.[0] || "—", bestPts: best?.[1] || 0 };
                  }).sort((a,b) => b.bestPts - a.bestPts);

                  if (bestRounds[0]?.bestPts === 0) return null;

                  return (
                    <Collapse title="🔥 Beste speeldag" sub="meeste punten op één dag">
                        {bestRounds.map(u => {
                          const color = avatarColor(u.username);
                          const max = bestRounds[0].bestPts || 1;
                          const pct = Math.round((u.bestPts / max) * 100);
                          return (
                            <div key={u.id} className="stat-row">
                              <Avatar userId={u.id} username={u.username} size={44} profiles={userProfiles} />
                              <div className="stat-bar-wrap">
                                <div className="stat-name">
                                  <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                                    {u.username}
                                    {u.bestDay !== "—" && <span style={{ fontSize:10, color:"var(--t3)", fontWeight:600 }}>op {u.bestDay}</span>}
                                  </span>
                                  <span style={{ color:"#f97316", fontWeight:800 }}>{u.bestPts}pt</span>
                                </div>
                                <div className="stat-bar"><div className="stat-fill" style={{ width:`${pct}%`, background:color }} /></div>
                              </div>
                            </div>
                          );
                        })}
                    </Collapse>
                  );
                })()}
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
            <GroupCard group={grp} matches={matches} isAdmin={isAdmin} myPreds={myPreds} onScore={setScore} onLock={toggleLock} onPred={savePred} onShowPreds={setPredsModal} />
          </div>
        )}

        {/* ── VANDAAG ── */}
        {tab === "vandaag" && (
          <div className="fu">
            <div className="sec-title">📅 Wedstrijden</div>
            <div className="sec-sub">Vandaag · morgen · overmorgen · 🔒 automatisch vergrendeld bij aanvang</div>
            {(() => {
              const now = new Date();
              const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              const matchDayOf = (m) => {
                if (!m.match_date) return null;
                const parts = m.match_date.trim().split(" ");
                if (parts.length < 3) return null;
                const day = parseInt(parts[1]);
                const month = NL_MONTHS[parts[2]?.toLowerCase()];
                if (isNaN(day) || month === undefined) return null;
                return new Date(now.getFullYear(), month, day);
              };
              const dayMatches = (offset) => {
                const target = new Date(today0.getFullYear(), today0.getMonth(), today0.getDate() + offset);
                return matches.filter(m => {
                  const md = matchDayOf(m);
                  return md && md.getTime() === target.getTime();
                }).sort((a,b) => (a.match_date?.split(" ")[3] || "00:00").localeCompare(b.match_date?.split(" ")[3] || "00:00"));
              };

              const splitTeam = (t) => { const s = t || "?"; const i = s.indexOf(" "); return i === -1 ? { flag:"", name:s } : { flag: s.slice(0, i), name: s.slice(i + 1) }; };

              const renderRow = (m) => {
                const mp = myPreds.find(p => p.match_id === m.id);
                const done = m.home_goals != null && m.away_goals != null;
                const parts = m.match_date.trim().split(" ");
                const day = parseInt(parts[1]);
                const month = NL_MONTHS[parts[2]?.toLowerCase()];
                const timeParts = (parts[3] || "00:00").split(":");
                const matchTime = new Date(now.getFullYear(), month, day, parseInt(timeParts[0]), parseInt(timeParts[1]));
                const started = now >= matchTime;
                // Tippen gesloten = DB-lock OF binnen 5 min voor aftrap (ook als admin offline is)
                const tipClosed = m.locked || now >= (matchTime - LOCK_LEAD_MS);
                const live = started && !done;
                const minsUntil = Math.max(0, Math.round((matchTime - now) / 60000));
                // Live-data koppelen (stand, minuut, fase, rode kaarten).
                const apiLive = live ? liveMatchFor(m, liveData) : null;
                const liveScore = apiLive && apiLive.homeScore != null && apiLive.awayScore != null;
                const liveMin = apiLive ? fmtMin(apiLive.minute) : null;
                const liveStage = apiLive?.stage ? (STAGE_NL[apiLive.stage] || apiLive.stage) : "";
                const liveStatus = [liveStage, (/half|extra/i.test(apiLive?.stage || "") && liveMin) ? liveMin : null].filter(Boolean).join(" · ");
                const hr = apiLive?.homeRed || 0, ar = apiLive?.awayRed || 0;
                const redTag = (n) => n > 0 ? <span style={{ display:"inline-flex", alignItems:"center", gap:2 }}><span style={{ width:8, height:11, background:"#ef4444", borderRadius:1.5, display:"inline-block" }}/>{n > 1 && <span style={{ fontSize:9, fontWeight:800, color:"#ef4444" }}>{n}</span>}</span> : null;
                // Aftrap-countdown (alleen binnen 24u, anders "aftrap").
                const untilMs = matchTime - now;
                const cdU = untilMs > 0 ? (() => { const d = Math.floor(untilMs/86400000), H = Math.floor(untilMs/3600000)%24, M = Math.floor(untilMs/60000)%60; return d > 0 ? `over ${d}d ${H}u` : (H > 0 ? `over ${H}u ${M}m` : `over ${M}m`); })() : "";
                let cls = "", lbl = "";
                if (!isAdmin && mp && done) {
                  const r = scorePts(mp.home_goals, mp.away_goals, m.home_goals, m.away_goals);
                  cls = r.cls; lbl = r.label;
                }
                const h = splitTeam(m.home), a = splitTeam(m.away);
                const phaseLabel = m.phase === "group" ? `Groep ${m.grp}` : (KO_PHASES.find(p => p.id === m.phase)?.full || m.phase);
                const statusLabel = done ? "gespeeld" : live ? (liveStatus || "live") : (minsUntil > 0 && minsUntil <= 60 ? `nog ${minsUntil} min` : "");
                return (
                  <div key={m.id} style={{ background:"var(--c1)", border:`1px solid ${live ? "rgba(34,197,94,.3)" : "var(--c3)"}`, borderRadius:12, overflow:"hidden", marginBottom:8 }}>
                    {/* kop */}
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 12px", background: live ? "rgba(34,197,94,.08)" : "rgba(255,255,255,.03)", borderBottom:`1px solid ${live ? "rgba(34,197,94,.2)" : "var(--c2)"}` }}>
                      <span style={{ fontSize:10, fontWeight:700, color: live ? "#22c55e" : "var(--t3)", textTransform:"uppercase", letterSpacing:.5, display:"flex", alignItems:"center", gap:5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {live && <span className="live" style={{ margin:0 }}/>}
                        {tipClosed ? "🔒 " : ""}{phaseLabel}{statusLabel ? ` · ${statusLabel}` : ""}
                      </span>
                      <span style={{ fontSize:10, color: (!done && !live && cdU) ? "var(--gr)" : "var(--t3)", fontWeight: (!done && !live && cdU) ? 700 : 400, flexShrink:0 }}>{(done || live) ? (parts[3] || "") : (cdU || "")}</span>
                    </div>
                    {/* scorebord */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:8, padding:"14px 12px" }}>
                      <div style={{ textAlign:"right", minWidth:0 }}>
                        <div style={{ fontSize:22, lineHeight:1 }}>{h.flag}</div>
                        <div style={{ fontSize:12, fontWeight:700, color:"var(--t1)", marginTop:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{h.name}</div>
                        {hr > 0 && <div style={{ marginTop:3 }}>{redTag(hr)}</div>}
                      </div>
                      <div style={{ flexShrink:0, textAlign:"center" }}>
                        {done
                          ? <span style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:30, color:"var(--gr)", letterSpacing:2 }}>{m.home_goals}<span style={{ color:"var(--bd)", margin:"0 4px" }}>–</span>{m.away_goals}</span>
                          : live
                            ? <div>
                                {liveScore
                                  ? <span style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:30, color:"#22c55e", letterSpacing:2 }}>{apiLive.homeScore}<span style={{ color:"rgba(34,197,94,.4)", margin:"0 4px" }}>–</span>{apiLive.awayScore}</span>
                                  : <span style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:16, color:"#22c55e", border:"1.5px solid rgba(34,197,94,.4)", borderRadius:8, padding:"4px 10px" }}>BEZIG</span>}
                                <div style={{ fontSize:9, color:"#22c55e", fontWeight:700, marginTop:3, textTransform:"uppercase", letterSpacing:.5 }}>{liveStatus || "live"}</div>
                              </div>
                            : <div>
                                <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:24, color:"var(--gr)", lineHeight:1 }}>{parts[3] || "vs"}</div>
                                <div style={{ fontSize:8, color:"var(--t3)", fontWeight:700, textTransform:"uppercase", letterSpacing:.5, marginTop:2 }}>aftrap</div>
                              </div>}
                      </div>
                      <div style={{ textAlign:"left", minWidth:0 }}>
                        <div style={{ fontSize:22, lineHeight:1 }}>{a.flag}</div>
                        <div style={{ fontSize:12, fontWeight:700, color:"var(--t1)", marginTop:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.name}</div>
                        {ar > 0 && <div style={{ marginTop:3 }}>{redTag(ar)}</div>}
                      </div>
                    </div>
                    {/* voet: jouw tip + punten + wie-tipte-wat */}
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, padding:"8px 12px", borderTop:"1px solid var(--c2)", background:"rgba(0,0,0,.15)" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0, flexWrap:"wrap" }}>
                        {!isAdmin && mp && <><span style={{ fontSize:11, color:"var(--t3)" }}>Jouw tip:</span><span style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:13, color:"var(--am)" }}>{mp.home_goals}–{mp.away_goals}</span></>}
                        {!isAdmin && mp && done && lbl && <span className={`pts-badge ${cls}`}>{lbl}</span>}
                        {!isAdmin && !mp && !tipClosed && <span style={{ fontSize:11, color:"var(--re)", fontWeight:700 }}>⚠️ Nog geen tip!</span>}
                        {!isAdmin && !mp && tipClosed && <span className="too-late">Te laat</span>}
                      </div>
                      {(() => {
                        const tipCount = preds.filter(p => p.match_id === m.id && p.home_goals != null).length;
                        return (
                          <button
                            title="Wie tipte wat?"
                            onClick={() => setPredsModal(m)}
                            style={{ flexShrink:0, background:"rgba(255,107,0,.12)", border:"1px solid rgba(255,107,0,.3)", color:"var(--gr)", padding:"6px 12px", fontSize:12, fontWeight:700, borderRadius:7, display:"inline-flex", alignItems:"center", gap:5, whiteSpace:"nowrap", cursor:"pointer" }}
                          >
                            👀 {tipCount > 0 ? `${tipCount} tip${tipCount === 1 ? "" : "s"} bekijken` : "Tips bekijken"}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                );
              };

              const sections = [
                { label: "Vandaag", offset: 0 },
                { label: "Morgen", offset: 1 },
                { label: "Overmorgen", offset: 2 },
              ];

              if (sections.every(s => dayMatches(s.offset).length === 0)) return (
                <div className="empty">
                  <div className="empty-i">📅</div>
                  <div className="empty-t">Geen wedstrijden de komende dagen.<br/>Geniet van de rustdag! 😴</div>
                </div>
              );

              return sections.map(s => {
                const ms = dayMatches(s.offset);
                const target = new Date(today0.getFullYear(), today0.getMonth(), today0.getDate() + s.offset);
                const dateLabel = target.toLocaleDateString("nl-NL", { weekday:"long", day:"numeric", month:"long" });
                return (
                  <div key={s.offset} style={{ marginBottom:18 }}>
                    <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", padding:"0 2px 8px", gap:8 }}>
                      <div style={{ display:"flex", alignItems:"baseline", gap:8, minWidth:0 }}>
                        <span className="card-title">{s.label}</span>
                        <span style={{ fontSize:10, color:"var(--t3)", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{dateLabel}</span>
                      </div>
                      <span style={{ fontSize:11, color:"var(--t3)", flexShrink:0 }}>
                        {ms.length === 0 ? "—" : `${ms.filter(m => m.home_goals != null).length}/${ms.length} gespeeld`}
                      </span>
                    </div>
                    {ms.length === 0
                      ? <div style={{ padding:"14px", fontSize:12, color:"var(--t3)", textAlign:"center", fontStyle:"italic", background:"var(--c1)", border:"1px solid var(--c3)", borderRadius:12 }}>Geen wedstrijden</div>
                      : ms.map(renderRow)}
                  </div>
                );
              });
            })()}
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
            <KOCard phase={kphase} matches={matches} isAdmin={isAdmin} myPreds={myPreds} onScore={setScore} onLock={toggleLock} onPred={savePred} allTeams={ALL_TEAMS} onShowPreds={setPredsModal} />
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
            {(() => {
              // Nummer 3 van elke groep, gerangschikt (punten → doelsaldo → doelpunten). Top 8 gaat door.
              const thirds = GROUPS
                .map(g => { const r = groupStandings[g]?.[2]; return r ? { ...r, grp: g } : null; })
                .filter(Boolean)
                .sort((a,b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
              if (thirds.length === 0) return null;
              return (
                <div className="card">
                  <div className="card-head">
                    <span className="card-title">🥉 Beste nummers 3</span>
                    <span style={{ fontSize:11, color:"var(--t3)" }}>top 8 gaat door</span>
                  </div>
                  <div style={{ padding:"2px 14px 10px" }}>
                    <div className="stand-row" style={{ padding:"4px 0", borderBottom:"1px solid var(--bd)" }}>
                      <div /><div style={{ fontSize:9, color:"var(--t3)", fontWeight:700, letterSpacing:.5 }}>TEAM</div>
                      {["W","G","V","DV","DA","Pnt"].map(h => <div key={h} className="stand-cell" style={{ fontSize:9, fontWeight:700, color:"var(--t3)" }}>{h}</div>)}
                    </div>
                    {thirds.map((r,i) => (
                      <div key={r.grp} className="stand-row" style={{ borderBottom: i===7 ? "2px solid var(--gr)" : undefined, opacity: i<8 ? 1 : .45 }}>
                        <div className="stand-num" style={{ color: i<8 ? "var(--gr)" : "var(--t3)" }}>{i+1}</div>
                        <div className="stand-team">{r.team} <span style={{ color:"var(--t3)", fontSize:9, fontWeight:600 }}>({r.grp})</span></div>
                        <div className="stand-cell">{r.w}</div>
                        <div className="stand-cell">{r.d}</div>
                        <div className="stand-cell">{r.l}</div>
                        <div className="stand-cell">{r.gf}</div>
                        <div className="stand-cell">{r.ga}</div>
                        <div className="stand-pts" style={{ color: i<8 ? "var(--gr)" : "var(--t1)" }}>{r.pts}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── BONUS ── */}
        {tab === "bonus" && (
          <div className="fu">
            <div className="sec-title">🎯 Bonusvragen</div>
            <div className="sec-sub">{BONUS_QS.length} vragen · 10 punten per goed antwoord{wkStarted ? " · 🔒 Gesloten" : " · sluit bij WK-start"}</div>
            {isAdmin
              ? <BonusAdmin bonusR={bonusR} onSave={saveBonusResults} bonusLocked={bonusLocked} onToggleLock={async () => {
                  const newLocked = !bonusLocked;
                  setBonusLocked(newLocked);
                  const { data:ex } = await sb.from("bonus_results").select("*").maybeSingle();
                  const updated = { ...(bonusR || {}), _bonusLocked: newLocked };
                  if (ex) await sb.from("bonus_results").update({ answers: updated }).eq("id", ex.id);
                  else await sb.from("bonus_results").insert({ answers: updated });
                  setBonusR(updated);
                  showToast(newLocked ? "🔒 Bonusvragen vergrendeld" : "🔓 Bonusvragen geopend");
                }} />
              : <BonusUser myAns={myBonusAns} bonusR={bonusR} onSave={saveBonus} wkStarted={wkStarted || bonusLocked} />
            }
          </div>
        )}

        {/* ── CHAT ── */}
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
                    <Avatar userId={session.id} username={session.username} size={52} profiles={userProfiles} />
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
                      { val:`${exact}×`, lbl:"Exact", sub:`+${exact*7}pt`, c:"var(--gr)" },
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
                          <div key={pred.match_id} style={{ display:"grid", gridTemplateColumns:"1fr 54px 54px 40px", gap:4, alignItems:"center", padding:"10px 12px", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
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
                        <div key={i} style={{ padding:"12px 14px", borderBottom: i<rows.length-1?"1px solid rgba(255,255,255,.06)":"none" }}>
                          <div style={{ fontSize:11, fontWeight:700, color:"var(--t3)", textTransform:"uppercase", letterSpacing:.5, marginBottom:8 }}>{r.lbl}</div>
                          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                            {[{lbl:"Jij", val:r.mine, c:r.color},{lbl:"Gem.", val:r.avg, c:"var(--t3)"}].map((b,j) => (
                              <div key={j} style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <div style={{ width:32, fontSize:10, fontWeight:700, color:b.c, flexShrink:0 }}>{b.lbl}</div>
                                <div style={{ flex:1, height:7, background:"var(--c3)", borderRadius:4, overflow:"hidden" }}>
                                  <div style={{ width:`${Math.round(b.val/r.max*100)}%`, height:"100%", background:b.c, borderRadius:4, transition:"width .8s ease", opacity: j===1?.6:1 }} />
                                </div>
                                <div style={{ fontSize:12, fontWeight:700, color:b.c, minWidth:28, textAlign:"right" }}>{b.val}{r.suffix}</div>
                                {j===0 && b.val > r.avg && <span style={{ fontSize:9, fontWeight:700, background:"rgba(255,107,0,.15)", color:"var(--gr)", borderRadius:3, padding:"1px 5px", border:"1px solid rgba(255,107,0,.15)", flexShrink:0 }}>↑ boven gem.</span>}
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

                  <div style={{ background:"rgba(255,107,0,.06)", border:"1px solid rgba(255,107,0,.15)", borderRadius:10, padding:"12px 14px", marginTop:4 }}>
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
              // TEAM_MAP staat nu op module-niveau (bovenin het bestand).
              // importing en importLog komen van component-level state

              const importScores = async () => {
                setImporting(true);
                setImportLog(["🔄 Uitslagen ophalen via API..."]);
                try {
                  const { updated, skipped, log, found } = await runImport();
                  if (found === 0) {
                    setImportLog(["⚠️ Geen WK-wedstrijden gevonden voor vandaag.", "Controleer of het WK al begonnen is."]);
                    setImporting(false); return;
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

            {/* ── ALLES VERGRENDELEN ── */}
            <div style={{ background:"var(--c2)", border:"1px solid var(--bd)", borderRadius:10, padding:"14px 16px", marginBottom:10 }}>
              <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:14, color:"var(--gr)", marginBottom:6 }}>🔒 Alles vergrendelen</div>
              <div style={{ fontSize:12, color:"var(--t3)", marginBottom:10, lineHeight:1.5 }}>
                Vergrendelt alle wedstrijden van vandaag in één klik. Niemand kan meer tippen.
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <button
                  className="btn btn-green"
                  style={{ flex:1 }}
                  disabled={lockAllLoading}
                  onClick={async () => {
                    setLockAllLoading(true);
                    const todayDate = new Date();
                    const todayDay = todayDate.getDate().toString();
                    const todayMonth = todayDate.toLocaleDateString("nl-NL", { month:"short" }).toLowerCase();
                    const todayMs = matches.filter(m => {
                      if (!m.match_date || m.locked) return false;
                      const d = m.match_date.toLowerCase();
                      return d.includes(todayDay + " " + todayMonth) || d.includes(todayDay + todayMonth);
                    });
                    let count = 0;
                    for (const m of todayMs) {
                      const { error } = await sb.from("matches").update({ locked: true }).eq("id", m.id);
                      if (!error) { setMatches(ms => ms.map(x => x.id === m.id ? { ...x, locked: true } : x)); count++; }
                    }

                    if (count === 0) {
                      showToast("ℹ️ Geen wedstrijden vandaag om te vergrendelen");
                    } else {
                      const names = todayMs.slice(0,3).map(m => m.home.replace(/[^\w\s]/g,"").trim() + " vs " + m.away.replace(/[^\w\s]/g,"").trim()).join(", ");
                      showToast(`🔒 ${count} vergrendeld: ${names}${count > 3 ? " ..." : ""}`);
                    }
                    setLockAllLoading(false);
                  }}
                >
                  {lockAllLoading ? <><span className="spin">⚽</span> Bezig...</> : "🔒 Vandaag vergrendelen"}
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
                  const lines = ["🏆 WK 2026 — Boland\'s Special", "━━━━━━━━━━━━━━━━━━━━", ""];
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
                      <Avatar userId={u.id} username={u.username} size={36} profiles={userProfiles} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:14, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:6 }}>
                          {u.username}
                          {rank > 0 && <span style={{ fontSize:9, color:"var(--t3)", fontWeight:700 }}>#{rank}</span>}
                        </div>
                        <div style={{ fontSize:11, color:"var(--t3)", marginTop:2, display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
                          {/* Laatst gezien — alleen voor admin */}
                          {(() => {
                            if (onlineUsers.has(u.username)) return <span style={{ color:"#22c55e", fontWeight:700, fontSize:10 }}>🟢 Nu online</span>;
                            // Eerst uit presence state, anders uit database
                            const ls = lastSeen[u.username] || u.last_seen;
                            if (!ls) return <span style={{ color:"var(--t3)", fontStyle:"italic", fontSize:10 }}>👁 Nog nooit ingelogd</span>;
                            const d = new Date(ls);
                            const now = new Date();
                            const diff = now - d;
                            const mins = Math.floor(diff/60000);
                            const hours = Math.floor(diff/3600000);
                            const days = Math.floor(diff/86400000);
                            let label = "";
                            if (mins < 1) label = "zojuist";
                            else if (mins < 60) label = `${mins}m geleden`;
                            else if (hours < 24) label = `${hours}u geleden`;
                            else label = `${days}d geleden`;
                            return <span style={{ color:"var(--t3)", fontStyle:"italic", fontSize:10 }}>👁 {label}</span>;
                          })()}
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
