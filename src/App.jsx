import { useState, useEffect, useCallback } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const sb = createClient(
  "https://lhoeabvsnjprmahsnzzh.supabase.co",
  "sb_publishable_tbtPN0fnjygO1RcK6tMFxw__4LxEnyq"
);
const ADMIN_USER = "admin";
const ADMIN_PASS = "Admin2026!";

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
const ALL_TEAMS = Object.values(GROUP_TEAMS).flat().sort((a,b)=>{const cl=s=>s.replace(/[^a-zA-ZÀ-ÿ ]/g,'').trim();return cl(a).localeCompare(cl(b),'nl');});

// Avatar kleuren per letter
const AVATAR_COLORS = ["#10b981","#f59e0b","#3b82f6","#ec4899","#8b5cf6","#ef4444","#14b8a6","#f97316","#84cc16","#06b6d4","#a855f7","#d946ef"];

const BONUS_QS = [
  {id:"b8",label:"⚽ Hoeveel goals totaal in de groepsfase?",type:"number"},
  {id:"b3",label:"🥅 Hoeveel goals in de finale?",type:"number"},
  {id:"b5",label:"🔥 Welk team scoort de meeste goals?",type:"team"},
  {id:"b6",label:"🛡️ Welk team krijgt de meeste goals tegen?",type:"team"},
  {id:"b2",label:"👟 Wie wordt topscorer?",type:"text"},
  {id:"b1",label:"🏆 Wie wordt wereldkampioen?",type:"team"},
];

const KO_PHASES = [
  {id:"r32",label:"1/16",full:"⚔️ Zestiende Finale"},
  {id:"r16",label:"1/8",full:"🏹 Achtste Finale"},
  {id:"qf",label:"QF",full:"💥 Kwartfinale"},
  {id:"sf",label:"HF",full:"🔥 Halve Finale"},
  {id:"3p",label:"3P",full:"🥉 3e Plaats"},
  {id:"final",label:"🏆",full:"🏆 Finale"},
];

// WK 2026 start
const WK_START = new Date("2026-06-11T21:00:00+02:00");

function hashPw(pw){let h=0;for(let c of pw)h=Math.imul(31,h)+c.charCodeAt(0)|0;return h.toString(36);}
function avatarColor(name){let h=0;for(let c of name)h=Math.imul(31,h)+c.charCodeAt(0)|0;return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length];}

function calcMatchPts(preds,matches){
  let pts=0,exact=0,outcome=0;
  for(const p of preds){
    const m=matches.find(x=>x.id===p.match_id);
    if(!m||m.home_goals==null||m.away_goals==null)continue;
    const[ph,pa,mh,ma]=[+p.home_goals,+p.away_goals,+m.home_goals,+m.away_goals];
    if(ph===mh&&pa===ma){pts+=3;exact++;}
    else{const po=ph>pa?1:ph<pa?-1:0,mo=mh>ma?1:mh<ma?-1:0;if(po===mo){pts+=1;outcome++;}}
  }
  return{pts,exact,outcome};
}

function calcBonusPts(ans,res){
  if(!res||!ans)return 0;
  return BONUS_QS.reduce((s,q)=>{
    const a=ans[q.id],r=res[q.id];
    return s+(a&&r&&a.toString().toLowerCase().trim()===r.toString().toLowerCase().trim()?5:0);
  },0);
}

function getStanding(matches,grp){
  const gm=matches.filter(m=>m.grp===grp&&m.phase==="group");
  const teams=GROUP_TEAMS[grp]||[];
  const s=Object.fromEntries(teams.map(t=>[t,{pts:0,w:0,d:0,l:0,gf:0,ga:0,mp:0}]));
  for(const m of gm){
    if(m.home_goals==null)continue;
    const[mh,ma]=[+m.home_goals,+m.away_goals];
    if(!s[m.home]||!s[m.away])continue;
    s[m.home].mp++;s[m.away].mp++;
    s[m.home].gf+=mh;s[m.home].ga+=ma;
    s[m.away].gf+=ma;s[m.away].ga+=mh;
    if(mh>ma){s[m.home].pts+=3;s[m.home].w++;s[m.away].l++;}
    else if(mh<ma){s[m.away].pts+=3;s[m.away].w++;s[m.home].l++;}
    else{s[m.home].pts++;s[m.away].pts++;s[m.home].d++;s[m.away].d++;}
  }
  return teams.sort((a,b)=>s[b].pts-s[a].pts||(s[b].gf-s[b].ga)-(s[a].gf-s[a].ga)||s[b].gf-s[a].gf).map(t=>({team:t,...s[t]}));
}

function useCountdown(target){
  const[t,setT]=useState({d:0,h:0,m:0,s:0,started:false});
  useEffect(()=>{
    const tick=()=>{
      const now=new Date(),diff=target-now;
      if(diff<=0){setT({d:0,h:0,m:0,s:0,started:true});return;}
      setT({d:Math.floor(diff/864e5),h:Math.floor(diff/36e5)%24,m:Math.floor(diff/6e4)%60,s:Math.floor(diff/1e3)%60,started:false});
    };
    tick();
    const id=setInterval(tick,1000);
    return()=>clearInterval(id);
  },[target]);
  return t;
}

// ── CSS ───────────────────────────────────────────────────────────────────
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&family=Oswald:wght@500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
:root{
  --gr:#ff6b00;--gr2:#e55f00;--am:#ffb347;--am2:#ff8c00;
  --re:#f43f5e;--bg:#1c1c1e;--c1:#2c2c2e;--c2:#3a3a3c;--c3:#48484a;
  --bd:#545456;--t1:#f5f5f7;--t2:#aeaeb2;--t3:#6e6e73;
  --r:12px;--shadow:0 4px 24px rgba(0,0,0,.4);
}
html,body{background:var(--bg);font-family:'Figtree',sans-serif;color:var(--t1);min-height:100vh;overflow-x:hidden}
*{-webkit-font-smoothing:antialiased}
::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-thumb{background:var(--gr);border-radius:2px;opacity:.3}
input,button,select,textarea{font-family:inherit}button{cursor:pointer}

/* LAYOUT */
.page{max-width:560px;margin:0 auto;padding:12px 12px 90px}

/* HEADER */
.hdr{background:linear-gradient(180deg,var(--c1) 0%,rgba(44,44,46,.97) 100%);backdrop-filter:blur(12px);border-bottom:1px solid var(--bd);position:sticky;top:0;z-index:100}
.hdr-in{max-width:560px;margin:0 auto;padding:0 14px;display:flex;align-items:center;justify-content:space-between;height:52px}
.logo{display:flex;align-items:center;gap:8px}
.logo-text{font-family:'Oswald',sans-serif;font-weight:700;font-size:18px;letter-spacing:.5px}
.logo-text span{color:var(--gr)}
.logo-chip{background:var(--gr);color:#fff;font-size:9px;font-weight:900;border-radius:4px;padding:2px 6px;letter-spacing:.8px;text-transform:uppercase}

/* BOTTOM NAV */
.bnav{position:fixed;bottom:0;left:0;right:0;background:rgba(28,28,30,.97);backdrop-filter:blur(16px);border-top:1px solid var(--bd);display:flex;z-index:100;padding-bottom:env(safe-area-inset-bottom,0)}
.bn{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:9px 2px 8px;border:none;background:none;color:var(--t3);font-size:9px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;transition:all .2s;position:relative}
.bn.on{color:var(--gr)}
.bn.on::after{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:20px;height:2px;background:var(--gr);border-radius:0 0 2px 2px}
.bn-ic{font-size:20px;line-height:1}

/* COUNTDOWN */
.countdown{background:linear-gradient(135deg,#2c2c2e,#3a3a3c);border:1px solid rgba(255,107,0,.2);border-radius:var(--r);padding:16px 14px;margin-bottom:12px;position:relative;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.2)}
.countdown::before{content:'⚽';position:absolute;right:-10px;bottom:-10px;font-size:80px;opacity:.05;transform:rotate(-15deg)}
.countdown::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 0% 100%,rgba(255,107,0,.07),transparent 50%)}
.cd-title{font-size:11px;color:var(--t3);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}
.cd-boxes{display:flex;gap:8px;align-items:center}
.cd-box{background:var(--c1);border:1px solid var(--bd);border-radius:8px;padding:8px 10px;text-align:center;flex:1}
.cd-num{font-family:'Oswald',sans-serif;font-weight:700;font-size:26px;color:var(--gr);line-height:1;display:block}
.cd-lbl{font-size:9px;color:var(--t3);font-weight:700;text-transform:uppercase;letter-spacing:.5px;display:block;margin-top:2px}
.cd-sep{font-family:'Oswald',sans-serif;font-weight:700;font-size:20px;color:var(--t3);margin-bottom:8px}

/* BANNER */
.banner{background:linear-gradient(160deg,#1a1200 0%,#2a1800 35%,#1f1500 65%,#1a1200 100%);border-radius:var(--r);padding:22px 16px 20px;margin-bottom:12px;position:relative;overflow:hidden;border:1px solid rgba(255,107,0,.15);box-shadow:0 0 30px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,107,0,.08)}
.banner::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 10% 100%,rgba(255,107,0,.08),transparent 45%),radial-gradient(ellipse at 90% 0%,rgba(255,179,71,.05),transparent 45%)}
.banner::after{content:'⚽';position:absolute;right:-8px;bottom:-12px;font-size:100px;opacity:.03;transform:rotate(20deg)}
.banner-flags{position:absolute;right:14px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:5px;opacity:.25;font-size:30px;filter:saturate(.5)}
.banner-divider{height:1.5px;background:linear-gradient(90deg,transparent,var(--gr),var(--am),var(--gr),transparent);margin-top:14px;border-radius:1px;box-shadow:0 0 8px rgba(255,107,0,.4)}
.banner-stars{position:absolute;inset:0;pointer-events:none}

/* CARDS */
.card{background:var(--c1);border:1px solid var(--bd);border-radius:var(--r);overflow:hidden;margin-bottom:10px}
.card-head{padding:12px 14px 10px;border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;gap:6px}
.card-title{font-family:'Oswald',sans-serif;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:var(--gr)}

/* LEADERBOARD */
.lb-row{display:flex;align-items:center;gap:11px;padding:12px 14px;border-bottom:1px solid rgba(30,45,74,.6);transition:background .15s;position:relative}
.lb-row:last-child{border-bottom:none}
.lb-row.me{background:linear-gradient(90deg,rgba(255,107,0,.1),transparent 60%)}
.lb-row.me::before{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--gr)}
.lb-pos{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0}
.lb-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Oswald',sans-serif;font-weight:700;font-size:16px;flex-shrink:0;border:2px solid var(--bd)}
.lb-name{font-weight:700;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lb-sub{font-size:11px;color:var(--t3);margin-top:2px;display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.lb-pts{font-family:'Oswald',sans-serif;font-weight:700;font-size:24px;text-align:right;flex-shrink:0}
.lb-bar{height:3px;background:var(--c3);border-radius:2px;margin-top:4px;overflow:hidden}
.lb-bar-fill{height:100%;border-radius:2px;transition:width .6s ease}

/* MATCH ROW */
.mr{padding:11px 14px;border-bottom:1px solid rgba(30,45,74,.5)}
.mr:last-child{border-bottom:none}
.mr-teams{display:grid;grid-template-columns:1fr auto 1fr;gap:6px;align-items:center}
.mr-home{font-size:12px;font-weight:700;text-align:right;line-height:1.3}
.mr-away{font-size:12px;font-weight:700;text-align:left;line-height:1.3}
.score-btn{background:var(--bg);border:1.5px solid var(--bd);border-radius:8px;padding:6px 10px;font-family:'Oswald',sans-serif;font-weight:600;font-size:15px;color:var(--t3);min-width:54px;text-align:center;white-space:nowrap;transition:all .15s;cursor:default}
.score-btn.done{border-color:rgba(255,107,0,.3);color:var(--gr);background:rgba(255,107,0,.06)}
.score-btn.editable{border-color:var(--t3);cursor:pointer}
.score-btn.editable:active{border-color:var(--gr)}
.mr-meta{display:flex;align-items:center;justify-content:space-between;margin-top:7px;flex-wrap:wrap;gap:5px}
.mr-time{font-size:10px;color:var(--t3);font-weight:600;display:flex;align-items:center;gap:4px}
.mr-actions{display:flex;align-items:center;gap:5px;flex-wrap:wrap}

/* SCORE EDITOR */
.score-edit{display:flex;align-items:center;gap:7px;margin-top:8px;background:var(--bg);border-radius:8px;padding:10px 12px;flex-wrap:wrap}
.ni{width:42px;height:38px;background:var(--c2);border:1.5px solid var(--bd);border-radius:7px;color:var(--t1);text-align:center;font-size:17px;font-weight:700;outline:none;-webkit-appearance:none}
.ni:focus{border-color:var(--gr)}

/* PILLS */
.pill{background:rgba(255,107,0,.1);border:1px solid rgba(255,107,0,.25);border-radius:6px;padding:3px 9px;font-family:'Oswald',sans-serif;font-weight:600;font-size:12px;color:var(--gr);white-space:nowrap}
.pill.green{background:rgba(255,179,71,.15);border-color:rgba(255,179,71,.3);color:var(--am)}
.pts-badge{font-size:11px;font-weight:700;padding:2px 7px;border-radius:5px;white-space:nowrap}
.pts-3{background:rgba(255,107,0,.15);color:var(--gr)}
.pts-1{background:rgba(251,191,36,.15);color:var(--am)}
.pts-0{background:rgba(244,63,94,.15);color:var(--re)}
.lock-tag{font-size:10px;background:rgba(255,107,0,.1);color:var(--am);border:1px solid rgba(255,107,0,.2);border-radius:4px;padding:2px 6px;font-weight:700}

/* BUTTONS */
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

/* INPUTS */
.inp{width:100%;background:var(--c2);border:1.5px solid var(--bd);border-radius:8px;color:var(--t1);padding:12px 13px;font-size:14px;outline:none;transition:border-color .15s;-webkit-appearance:none}
.inp:focus{border-color:var(--gr)}
.inp::placeholder{color:var(--t3)}
.sel{width:100%;background:var(--c2);border:1.5px solid var(--bd);border-radius:8px;color:var(--t1);padding:12px 13px;font-size:14px;outline:none;-webkit-appearance:none}
.sel:focus{border-color:var(--gr)}
.lbl{font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:6px}

/* GROUP TABS */
.gtabs{display:flex;gap:5px;overflow-x:auto;padding-bottom:8px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.gtabs::-webkit-scrollbar{display:none}
.gtab{flex-shrink:0;width:34px;height:34px;border-radius:8px;border:1.5px solid var(--bd);background:var(--c1);color:var(--t3);font-family:'Oswald',sans-serif;font-weight:600;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all .15s}
.gtab.on{background:var(--gr);border-color:var(--gr);color:#fff}

/* PHASE TABS */
.ptabs{display:flex;gap:5px;overflow-x:auto;padding-bottom:8px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.ptabs::-webkit-scrollbar{display:none}
.ptab{flex-shrink:0;padding:7px 13px;border-radius:20px;border:1.5px solid var(--bd);background:var(--c1);color:var(--t3);font-size:12px;font-weight:700;transition:all .15s;white-space:nowrap}
.ptab.on{background:var(--gr);border-color:var(--gr);color:#fff}

/* STANDING TABLE */
.stand-row{display:grid;grid-template-columns:14px 1fr 22px 22px 22px 22px 22px 26px;gap:3px;align-items:center;padding:7px 0;border-bottom:1px solid rgba(30,45,74,.4)}
.stand-row:last-child{border-bottom:none}
.stand-num{font-size:10px;font-weight:700;text-align:center}
.stand-team{font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.stand-cell{font-size:11px;text-align:center;color:var(--t3);font-variant-numeric:tabular-nums}
.stand-pts{font-family:'Oswald',sans-serif;font-weight:700;font-size:14px;text-align:center}

/* STAT BARS */
.stat-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(30,45,74,.4)}
.stat-row:last-child{border-bottom:none}
.stat-avatar{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Oswald',sans-serif;font-weight:700;font-size:13px;flex-shrink:0}
.stat-bar-wrap{flex:1}
.stat-name{font-size:12px;font-weight:700;margin-bottom:3px;display:flex;justify-content:space-between;align-items:center}
.stat-bar{height:5px;background:var(--c3);border-radius:3px;overflow:hidden}
.stat-fill{height:100%;border-radius:3px;transition:width .8s ease}

/* USER ROW */
.ur{display:flex;align-items:center;gap:11px;padding:12px 14px;border-bottom:1px solid rgba(30,45,74,.5)}
.ur:last-child{border-bottom:none}

/* BONUS */
.bq{background:var(--c2);border:1px solid var(--bd);border-radius:10px;padding:13px;margin-bottom:9px;transition:border-color .2s}
.bq.ok{border-color:rgba(255,107,0,.4)}
.bq.no{border-color:rgba(244,63,94,.3)}

/* SECTION */
.sec-title{font-family:'Oswald',sans-serif;font-weight:700;font-size:20px;letter-spacing:.3px;margin-bottom:2px}
.sec-sub{font-size:12px;color:var(--t3);margin-bottom:13px}

/* TOAST */
.toast{position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:999;background:var(--c2);border:1px solid var(--gr);border-radius:10px;padding:10px 18px;font-size:13px;font-weight:700;color:var(--gr);box-shadow:0 8px 32px rgba(0,0,0,.6);white-space:nowrap;pointer-events:none}

/* INFO BOX */
.infobox{background:var(--c2);border:1px solid var(--bd);border-radius:9px;padding:11px 13px;margin-bottom:12px;display:flex;gap:9px;align-items:flex-start}
.infobox-i{font-size:16px;flex-shrink:0;margin-top:1px}
.infobox-t{font-size:12px;color:var(--t2);line-height:1.5}

/* AUTH */
.auth{min-height:100vh;background:var(--bg);display:flex;flex-direction:column}
.auth-hero{padding:40px 20px 30px;text-align:center;position:relative;overflow:hidden}
.auth-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 120%,rgba(255,107,0,.1),transparent 60%)}
.auth-body{flex:1;padding:0 16px 40px;max-width:400px;width:100%;margin:0 auto}
.auth-tabs{display:grid;grid-template-columns:1fr 1fr;background:var(--c2);border-radius:10px;padding:3px;gap:3px;margin-bottom:18px}
.auth-tab{padding:10px;border:none;border-radius:8px;font-size:13px;font-weight:700;background:transparent;color:var(--t3);transition:all .15s}
.auth-tab.on{background:var(--c1);color:var(--t1)}
.fg{margin-bottom:12px}
.errbox{background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.3);border-radius:8px;padding:10px 13px;font-size:13px;color:var(--re);margin-bottom:11px}

/* EMPTY */
.empty{text-align:center;padding:36px 16px;color:var(--t3)}
.empty-i{font-size:36px;margin-bottom:8px}
.empty-t{font-size:13px;line-height:1.5}

/* NEXT MATCH */
.next-match{background:linear-gradient(135deg,var(--c2),var(--c3));border:1px solid var(--bd);border-radius:var(--r);padding:14px 16px;margin-bottom:12px}
.nm-label{font-size:10px;color:var(--t3);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.nm-teams{display:flex;align-items:center;justify-content:space-between;gap:8px}
.nm-team{font-size:13px;font-weight:700;flex:1}
.nm-team.away{text-align:right}
.nm-vs{font-family:'Oswald',sans-serif;font-size:13px;color:var(--t3);font-weight:600;flex-shrink:0}

/* ANIMS */
@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.fu{animation:fu .22s ease both}
@keyframes spin{to{transform:rotate(360deg)}}
.spin{animation:spin .8s linear infinite;display:inline-block}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
.live{animation:pulse 1.5s infinite;display:inline-block;width:7px;height:7px;background:#22c55e;border-radius:50%;margin-right:4px;vertical-align:middle}
@keyframes count{from{transform:scale(1.1)}to{transform:scale(1)}}
`;

export default function App(){
  const[matches, setMatches]=useState([]);
  const[users,   setUsers]  =useState([]);
  const[preds,   setPreds]  =useState([]);
  const[bonusA,  setBonusA] =useState([]);
  const[bonusR,  setBonusR] =useState(null);
  const[session, setSession]=useState(()=>{try{return JSON.parse(localStorage.getItem("wkp2026"));}catch{return null;}});
  const[tab,     setTab]    =useState("stand");
  const[authMode,setAuthMode]=useState("login");
  const[form,    setForm]   =useState({u:"",p:"",p2:""});
  const[err,     setErr]    =useState("");
  const[loading, setLoading]=useState(false);
  const[toast,   setToast]  =useState(null);
  const[booting, setBooting]=useState(true);
  const[grp,     setGrp]   =useState("A");
  const[kphase,  setKphase] =useState("r32");

  const isAdmin=session?.isAdmin===true;
  const myPreds=preds.filter(p=>p.user_id===session?.id);
  const myBonusAns=bonusA.find(b=>b.user_id===session?.id)?.answers||{};
  const countdown=useCountdown(WK_START);

  const toast$=(m,ms=2600)=>{setToast(m);setTimeout(()=>setToast(null),ms);};

  // ── LOAD ──────────────────────────────────────────────────────────────
  useEffect(()=>{
    (async()=>{
      const[{data:m},{data:u},{data:p},{data:ba},{data:br}]=await Promise.all([
        sb.from("matches").select("*").order("id"),
        sb.from("users").select("id,username"),
        sb.from("predictions").select("*"),
        sb.from("bonus_answers").select("*"),
        sb.from("bonus_results").select("*").maybeSingle(),
      ]);
      if(m)setMatches(m);
      if(u)setUsers(u);
      if(p)setPreds(p);
      if(ba)setBonusA(ba);
      if(br)setBonusR(br?.answers||null);
      setBooting(false);
    })();
  },[]);

  useEffect(()=>{try{localStorage.setItem("wkp2026",JSON.stringify(session));}catch{};},[session]);

  // ── AUTH ──────────────────────────────────────────────────────────────
  const login=async()=>{
    const{u,p}=form;
    if(!u||!p)return setErr("Vul alles in.");
    if(u.toLowerCase()===ADMIN_USER&&p===ADMIN_PASS){
      setSession({isAdmin:true,username:ADMIN_USER});setErr("");setForm({u:"",p:"",p2:""});return;
    }
    setLoading(true);
    const{data}=await sb.from("users").select("*").ilike("username",u).maybeSingle();
    setLoading(false);
    if(!data||data.pw_hash!==hashPw(p))return setErr("Gebruikersnaam of wachtwoord onjuist.");
    setSession({id:data.id,username:data.username,isAdmin:false});
    setErr("");setForm({u:"",p:"",p2:""});
  };

  const register=async()=>{
    const{u,p,p2}=form;
    if(!u||!p||!p2)return setErr("Vul alles in.");
    if(u.length<3)return setErr("Naam minimaal 3 tekens.");
    if(p.length<6)return setErr("Wachtwoord minimaal 6 tekens.");
    if(p!==p2)return setErr("Wachtwoorden komen niet overeen.");
    if(u.toLowerCase()===ADMIN_USER)return setErr("Naam niet beschikbaar.");
    setLoading(true);
    const{data:ex}=await sb.from("users").select("id").ilike("username",u).maybeSingle();
    if(ex){setLoading(false);return setErr("Naam al in gebruik.");}
    const{data:nu,error}=await sb.from("users").insert({username:u,pw_hash:hashPw(p)}).select().single();
    setLoading(false);
    if(error||!nu)return setErr("Er ging iets mis, probeer opnieuw.");
    setUsers(us=>[...us,{id:nu.id,username:nu.username}]);
    setSession({id:nu.id,username:nu.username,isAdmin:false});
    setErr("");setForm({u:"",p:"",p2:""});
    toast$(`Welkom ${nu.username}! 🎉`);
  };

  // ── DATA ACTIONS ──────────────────────────────────────────────────────
  const savePred=async(mid,hg,ag)=>{
    if(!session?.id)return;
    const ex=preds.find(p=>p.user_id===session.id&&p.match_id===mid);
    if(ex){
      const{error}=await sb.from("predictions").update({home_goals:hg,away_goals:ag}).eq("id",ex.id);
      if(!error)setPreds(ps=>ps.map(p=>p.id===ex.id?{...p,home_goals:hg,away_goals:ag}:p));
    }else{
      const{data,error}=await sb.from("predictions").insert({user_id:session.id,match_id:mid,home_goals:hg,away_goals:ag}).select().single();
      if(!error&&data)setPreds(ps=>[...ps,data]);
    }
    toast$("✓ Voorspelling opgeslagen");
  };

  const setScore=async(id,upd)=>{
    const{error}=await sb.from("matches").update(upd).eq("id",id);
    if(!error)setMatches(ms=>ms.map(m=>m.id===id?{...m,...upd}:m));
  };

  const toggleLock=async(id,locked)=>{
    const{error}=await sb.from("matches").update({locked:!locked}).eq("id",id);
    if(!error){setMatches(ms=>ms.map(m=>m.id===id?{...m,locked:!locked}:m));toast$(locked?"🔓 Wedstrijd geopend":"🔒 Wedstrijd vergrendeld");}
  };

  const deleteUser=async(uid,name)=>{
    if(!confirm(`${name} definitief verwijderen?\nAlle voorspellingen worden ook verwijderd.`))return;
    const{error}=await sb.from("users").delete().eq("id",uid);
    if(!error){
      setUsers(us=>us.filter(u=>u.id!==uid));
      setPreds(ps=>ps.filter(p=>p.user_id!==uid));
      setBonusA(bs=>bs.filter(b=>b.user_id!==uid));
      toast$(`🗑️ ${name} verwijderd`);
    }else toast$("❌ Fout bij verwijderen");
  };

  const resetPw=async(uid,name)=>{
    const pw=prompt(`Nieuw wachtwoord voor "${name}" (min. 6 tekens):`);
    if(!pw)return;
    if(pw.length<6){alert("Minimum 6 tekens!");return;}
    const{error}=await sb.from("users").update({pw_hash:hashPw(pw)}).eq("id",uid);
    if(!error)toast$(`🔑 Wachtwoord van ${name} gewijzigd`);
    else toast$("❌ Fout bij wijzigen");
  };

  const saveBonus=async(answers)=>{
    if(!session?.id)return;
    const ex=bonusA.find(b=>b.user_id===session.id);
    if(ex){
      await sb.from("bonus_answers").update({answers}).eq("user_id",session.id);
      setBonusA(bs=>bs.map(b=>b.user_id===session.id?{...b,answers}:b));
    }else{
      const{data}=await sb.from("bonus_answers").insert({user_id:session.id,answers}).select().single();
      if(data)setBonusA(bs=>[...bs,data]);
    }
    toast$("✓ Bonus opgeslagen");
  };

  const saveBonusResults=async(res)=>{
    const{data:ex}=await sb.from("bonus_results").select("*").maybeSingle();
    if(ex)await sb.from("bonus_results").update({answers:res}).eq("id",ex.id);
    else await sb.from("bonus_results").insert({answers:res});
    setBonusR(res);toast$("✓ Bonus resultaten opgeslagen");
  };

  // ── LEADERBOARD ───────────────────────────────────────────────────────
  const leaderboard=[...users].map(u=>{
    const up=preds.filter(p=>p.user_id===u.id);
    const{pts,exact,outcome}=calcMatchPts(up,matches);
    const ba=bonusA.find(b=>b.user_id===u.id)?.answers||{};
    const bp=calcBonusPts(ba,bonusR);
    return{...u,pts:pts+bp,mp:pts,bp,exact,outcome,pc:up.length};
  }).sort((a,b)=>b.pts-a.pts||b.exact-a.exact);

  const maxPts=leaderboard[0]?.pts||1;

  // Next match
  const nextMatch=matches.filter(m=>m.phase==="group"&&m.home_goals==null).sort((a,b)=>a.id-b.id)[0];

  if(!session)return<AuthPage mode={authMode} setMode={setAuthMode} form={form} setForm={setForm} err={err} loading={loading} onLogin={login} onRegister={register}/>;

  if(booting)return(
    <div style={{minHeight:"100vh",background:"#080b12",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14}}>
      <style>{CSS}</style>
      <div className="spin" style={{fontSize:28}}>⚽</div>
      <div style={{color:"#455575",fontSize:13,fontWeight:600}}>Laden...</div>
    </div>
  );

  const TABS=isAdmin
    ?[{id:"stand",ic:"🏆",lb:"Stand"},{id:"groepen",ic:"⚽",lb:"Groepen"},{id:"ko",ic:"🥊",lb:"Knockout"},{id:"standen",ic:"📊",lb:"Standen"},{id:"bonus",ic:"🎯",lb:"Bonus"},{id:"beheer",ic:"👑",lb:"Beheer"}]
    :[{id:"stand",ic:"🏆",lb:"Stand"},{id:"groepen",ic:"⚽",lb:"Groepen"},{id:"ko",ic:"🥊",lb:"Knockout"},{id:"standen",ic:"📊",lb:"Standen"},{id:"bonus",ic:"🎯",lb:"Bonus"},{id:"mijn",ic:"📋",lb:"Mijn"}];

  return(
    <div style={{background:"#080b12",minHeight:"100vh"}}>
      <style>{CSS}</style>
      {toast&&<div className="toast">{toast}</div>}

      {/* HEADER */}
      <header className="hdr">
        <div className="hdr-in">
          <div className="logo">
            <span style={{fontSize:20}}>⚽</span>
            <div className="logo-text">WK <span>2026</span></div>
            <span className="logo-chip">DINXPERLO</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {isAdmin&&<span style={{background:"rgba(255,107,0,.15)",color:"var(--gr)",fontSize:9,fontWeight:900,borderRadius:4,padding:"2px 7px",letterSpacing:.5,border:"1px solid rgba(255,107,0,.2)"}}>ADMIN</span>}
            <span style={{fontSize:12,color:"var(--t3)",fontWeight:700,maxWidth:90,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{session.username}</span>
            <button className="btn btn-out btn-sm" onClick={()=>{setSession(null);setTab("stand");}}>Uit</button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="page">

        {/* ── STAND ── */}
        {tab==="stand"&&(
          <div className="fu">
            {/* Banner */}
            <div className="banner">
              {/* Decorative dots */}
              {[...Array(8)].map((_,i)=>(
                <div key={i} style={{position:"absolute",width:i%2===0?3:2,height:i%2===0?3:2,borderRadius:"50%",background:"rgba(0,201,125,.2)",top:`${10+i*12}%`,left:`${5+i*12}%`,pointerEvents:"none"}}/>
              ))}
              <div style={{position:"relative",zIndex:1}}>
                <div className="banner-flags">
                  <span>🇺🇸</span><span>🇲🇽</span><span>🇨🇦</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                  <span style={{fontSize:32,filter:"drop-shadow(0 0 10px rgba(255,107,0,.5))"}}>🏆</span>
                  <div>
                    <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:28,letterSpacing:.5,lineHeight:1}}>
                      WK <span style={{color:"var(--gr)"}}>2026</span>
                    </div>
                    <div style={{fontWeight:800,fontSize:13,color:"var(--am)",letterSpacing:2,textTransform:"uppercase",marginTop:2}}>Dinxperlo Boys</div>
                  </div>
                </div>
                <div style={{fontSize:10,color:"var(--t3)",letterSpacing:1.5,textTransform:"uppercase"}}>⚽ 48 Teams · 104 Wedstrijden · Noord-Amerika</div>
                <div className="banner-divider"/>
                <div style={{display:"flex",gap:12,marginTop:10,alignItems:"center"}}>
                  <div style={{background:"rgba(0,201,125,.1)",border:"1px solid rgba(255,107,0,.2)",borderRadius:6,padding:"4px 10px",fontSize:10,color:"var(--gr)",fontWeight:700,letterSpacing:.5}}>⚽ 104 Wedstrijden</div>
                  <div style={{background:"rgba(251,191,36,.1)",border:"1px solid rgba(251,191,36,.2)",borderRadius:6,padding:"4px 10px",fontSize:10,color:"var(--am)",fontWeight:700,letterSpacing:.5}}>🌍 3 Landen</div>
                  <div style={{background:"rgba(59,130,246,.1)",border:"1px solid rgba(59,130,246,.2)",borderRadius:6,padding:"4px 10px",fontSize:10,color:"#60a5fa",fontWeight:700,letterSpacing:.5}}>🏟️ 16 Stadions</div>
                </div>
              </div>
            </div>

            {/* Countdown */}
            {!countdown.started&&(
              <div className="countdown">
                <div className="cd-title">⏱ Aftellen tot het WK begint</div>
                <div className="cd-boxes">
                  {[{n:countdown.d,l:"Dagen"},{n:countdown.h,l:"Uur"},{n:countdown.m,l:"Min"},{n:countdown.s,l:"Sec"}].map((c,i)=>(
                    <div key={i} className="cd-box">
                      <span className="cd-num">{String(c.n).padStart(2,"0")}</span>
                      <span className="cd-lbl">{c.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {countdown.started&&nextMatch&&(
              <div className="next-match">
                <div className="nm-label">⚽ Volgende wedstrijd</div>
                <div className="nm-teams">
                  <span className="nm-team">{nextMatch.home}</span>
                  <span className="nm-vs">vs</span>
                  <span className="nm-team away">{nextMatch.away}</span>
                </div>
                <div style={{fontSize:11,color:"var(--t3)",marginTop:6}}>📅 {nextMatch.match_date} · Groep {nextMatch.grp}</div>
              </div>
            )}

            {/* Ranglijst */}
            <div className="sec-title">Tussenstand</div>
            <div className="sec-sub">3pt exact · 1pt winnaar · 5pt bonus</div>

            {leaderboard.length===0
              ?<div className="empty"><div className="empty-i">👥</div><div className="empty-t">Nog geen deelnemers.<br/>Deel de link met je vrienden!</div></div>
              :<div className="card">
                {leaderboard.map((u,i)=>{
                  const isMe=u.id===session?.id;
                  const medals=["🥇","🥈","🥉"],mc=["#f59e0b","#94a3b8","#cd7f32"];
                  const color=avatarColor(u.username);
                  const pct=maxPts>0?Math.round((u.pts/maxPts)*100):0;
                  return(
                    <div key={u.id} className={`lb-row${isMe?" me":""}`} style={{animationDelay:`${i*40}ms`}}>
                      <div className="lb-pos" style={{background:i<3?mc[i]+"20":"var(--c3)",border:`2px solid ${i<3?mc[i]+"50":"var(--bd)"}`,color:i<3?mc[i]:"var(--t3)"}}>
                        {i<3?medals[i]:i+1}
                      </div>
                      <div className="lb-avatar" style={{background:color+"20",borderColor:color+"40",color}}>
                        {u.username[0].toUpperCase()}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                          <span className="lb-name">{u.username}</span>
                          {isMe&&<span style={{background:"rgba(255,107,0,.15)",color:"var(--gr)",fontSize:9,fontWeight:900,borderRadius:3,padding:"1px 5px",border:"1px solid rgba(255,107,0,.2)"}}>JIJ</span>}
                        </div>
                        <div style={{height:4,background:"var(--c3)",borderRadius:2,overflow:"hidden"}}>
                          <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${color},${color}99)`,borderRadius:2,transition:"width .8s ease"}}/>
                        </div>
                        <div className="lb-sub" style={{marginTop:3}}>
                          <span>{u.exact}× exact</span>
                          <span style={{color:"var(--bd)"}}>·</span>
                          <span>{u.outcome}× winnaar</span>
                          {u.bp>0&&<><span style={{color:"var(--bd)"}}>·</span><span style={{color:"var(--am)"}}>+{u.bp}pt bonus</span></>}
                        </div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div className="lb-pts" style={{color:i===0?"#f59e0b":i===1?"#94a3b8":i===2?"#cd7f32":"var(--gr)"}}>{u.pts}</div>
                        <div style={{fontSize:9,color:"var(--t3)",fontWeight:600}}>PUNTEN</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            }

            {/* Stats overzicht */}
            {leaderboard.length>0&&(
              <div style={{marginTop:16}}>
                <div className="sec-title" style={{fontSize:16}}>📈 Statistieken</div>
                <div className="sec-sub">Wie voorspelt het beste?</div>
                <div className="card">
                  <div className="card-head"><span className="card-title">Exacte uitslagen</span></div>
                  <div style={{padding:"4px 14px 10px"}}>
                    {[...leaderboard].sort((a,b)=>b.exact-a.exact).map(u=>{
                      const color=avatarColor(u.username);
                      const max=leaderboard.reduce((m,x)=>Math.max(m,x.exact),0)||1;
                      const pct=Math.round((u.exact/max)*100);
                      return(
                        <div key={u.id} className="stat-row">
                          <div className="stat-avatar" style={{background:color+"20",color,border:`1.5px solid ${color}40`}}>{u.username[0].toUpperCase()}</div>
                          <div className="stat-bar-wrap">
                            <div className="stat-name">
                              <span style={{fontSize:12,fontWeight:700}}>{u.username}</span>
                              <span style={{fontSize:12,fontWeight:800,color:"var(--gr)"}}>{u.exact}×</span>
                            </div>
                            <div className="stat-bar"><div className="stat-fill" style={{width:`${pct}%`,background:color}}/></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── GROEPEN ── */}
        {tab==="groepen"&&(
          <div className="fu">
            <div className="sec-title">⚽ Groepswedstrijden</div>
            <div className="sec-sub">{isAdmin?"Klik op score · 🔒 vergrendelen":"Kies groep · 🎯 tip invoeren"}</div>
            <div className="gtabs">{GROUPS.map(g=><button key={g} className={`gtab${grp===g?" on":""}`} onClick={()=>setGrp(g)}>{g}</button>)}</div>
            <GroupCard group={grp} matches={matches} isAdmin={isAdmin} myPreds={myPreds} onScore={setScore} onLock={toggleLock} onPred={savePred}/>
          </div>
        )}

        {/* ── KNOCKOUT ── */}
        {tab==="ko"&&(
          <div className="fu">
            <div className="sec-title">🥊 Knockout Fase</div>
            <div className="sec-sub">{isAdmin?"Teams en scores invullen · namen aanpassen":"Kies fase · tip invoeren"}</div>
            <div className="ptabs">{KO_PHASES.map(p=><button key={p.id} className={`ptab${kphase===p.id?" on":""}`} onClick={()=>setKphase(p.id)}>{p.full}</button>)}</div>
            <KOCard phase={kphase} matches={matches} isAdmin={isAdmin} myPreds={myPreds} onScore={setScore} onLock={toggleLock} onPred={savePred} allTeams={ALL_TEAMS}/>
          </div>
        )}

        {/* ── STANDEN ── */}
        {tab==="standen"&&(
          <div className="fu">
            <div className="sec-title">📊 Alle Groepsstanden</div>
            <div className="sec-sub">Top 2 + 8 beste nummers 3 gaan door naar knockout</div>
            {GROUPS.map(g=>(
              <div key={g} className="card">
                <div className="card-head">
                  <span className="card-title">Groep {g}</span>
                  <span style={{fontSize:10,color:"var(--t3)",fontWeight:600}}>{GROUP_TEAMS[g].slice(0,2).join(" · ")}...</span>
                </div>
                <div style={{padding:"2px 14px 10px"}}>
                  <div className="stand-row" style={{padding:"4px 0",borderBottom:"1px solid var(--bd)"}}>
                    <div/><div style={{fontSize:9,color:"var(--t3)",fontWeight:700,letterSpacing:.5}}>TEAM</div>
                    {["W","G","V","DV","DA","Pnt"].map(h=><div key={h} className="stand-cell" style={{fontSize:9,fontWeight:700,color:"var(--t3)"}}>{h}</div>)}
                  </div>
                  {getStanding(matches,g).map((r,i)=>(
                    <div key={r.team} className="stand-row">
                      <div className="stand-num" style={{color:i<2?"var(--gr)":"var(--t3)"}}>{i+1}</div>
                      <div className="stand-team">{r.team}</div>
                      <div className="stand-cell">{r.w}</div>
                      <div className="stand-cell">{r.d}</div>
                      <div className="stand-cell">{r.l}</div>
                      <div className="stand-cell">{r.gf}</div>
                      <div className="stand-cell">{r.ga}</div>
                      <div className="stand-pts" style={{color:i<2?"var(--gr)":"var(--t1)"}}>{r.pts}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── BONUS ── */}
        {tab==="bonus"&&(
          <div className="fu">
            <div className="sec-title">🎯 Bonusvragen</div>
            <div className="sec-sub">{BONUS_QS.length} vragen · 5 punten per goed antwoord</div>
            {isAdmin?<BonusAdmin bonusR={bonusR} onSave={saveBonusResults}/>:<BonusUser myAns={myBonusAns} bonusR={bonusR} onSave={saveBonus}/>}
          </div>
        )}

        {/* ── MIJN ── */}
        {tab==="mijn"&&!isAdmin&&(
          <div className="fu">
            <div className="sec-title">📋 Mijn Poule</div>
            <div className="sec-sub">{session.username} · {calcMatchPts(myPreds,matches).pts+calcBonusPts(myBonusAns,bonusR)} punten totaal</div>
            {myPreds.length===0
              ?<div className="empty"><div className="empty-i">🎯</div><div className="empty-t">Nog geen tips ingevoerd.<br/>Ga naar Groepen of Knockout!</div></div>
              :<div className="card">
                {myPreds.map(pred=>{
                  const m=matches.find(x=>x.id===pred.match_id);
                  if(!m)return null;
                  const done=m.home_goals!=null&&m.away_goals!=null;
                  let cls="",lbl="";
                  if(done){
                    const[ph,pa,mh,ma]=[+pred.home_goals,+pred.away_goals,+m.home_goals,+m.away_goals];
                    if(ph===mh&&pa===ma){cls="pts-3";lbl="+3";}
                    else{const po=ph>pa?1:ph<pa?-1:0,mo=mh>ma?1:mh<ma?-1:0;cls=po===mo?"pts-1":"pts-0";lbl=po===mo?"+1":"0";}
                  }
                  return(
                    <div key={pred.match_id} style={{padding:"10px 14px",borderBottom:"1px solid rgba(30,45,74,.4)"}}>
                      <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,marginBottom:5,display:"flex",alignItems:"center",gap:5}}>
                        {m.phase==="group"?`Groep ${m.grp}`:(KO_PHASES.find(p=>p.id===m.phase)?.full||m.phase)}
                        <span style={{color:"var(--bd)"}}>·</span>
                        {m.match_date}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                        <span style={{fontSize:12,fontWeight:700,flex:1,minWidth:80}}>{m.home||"?"} vs {m.away||"?"}</span>
                        <div style={{display:"flex",alignItems:"center",gap:5}}>
                          <span className="pill">{pred.home_goals}–{pred.away_goals}</span>
                          {done&&<><span style={{color:"var(--t3)"}}>→</span><span className="pill green">{m.home_goals}–{m.away_goals}</span></>}
                          {done&&<span className={`pts-badge ${cls}`}>{lbl}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            }
          </div>
        )}

        {/* ── BEHEER (admin) ── */}
        {tab==="beheer"&&isAdmin&&(
          <div className="fu">
            <div className="sec-title">👑 Deelnemers Beheer</div>
            <div className="sec-sub">{users.length} deelnemer{users.length!==1?"s":""} · 🔑 wachtwoord · 🗑️ verwijderen</div>
            {users.length===0
              ?<div className="empty"><div className="empty-i">👤</div><div className="empty-t">Nog geen deelnemers aangemeld.</div></div>
              :<div className="card">
                {[...users].map((u,i)=>{
                  const up=preds.filter(p=>p.user_id===u.id);
                  const{pts,exact}=calcMatchPts(up,matches);
                  const ba=bonusA.find(b=>b.user_id===u.id)?.answers||{};
                  const bp=calcBonusPts(ba,bonusR);
                  const color=avatarColor(u.username);
                  const rank=leaderboard.findIndex(l=>l.id===u.id)+1;
                  return(
                    <div key={u.id} className="ur">
                      <div style={{width:36,height:36,borderRadius:"50%",background:color+"20",border:`2px solid ${color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:16,color,flexShrink:0}}>
                        {u.username[0].toUpperCase()}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:6}}>
                          {u.username}
                          {rank>0&&<span style={{fontSize:9,color:"var(--t3)",fontWeight:700}}>#{rank}</span>}
                        </div>
                        <div style={{fontSize:11,color:"var(--t3)",marginTop:2}}>{up.length} tips · {exact}× exact · {bp}pt bonus</div>
                      </div>
                      <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:18,color:"var(--gr)",marginRight:8,flexShrink:0}}>{pts+bp}<span style={{fontSize:10,color:"var(--t3)"}}> pt</span></div>
                      <div style={{display:"flex",gap:5,flexShrink:0}}>
                        <button className="btn btn-out btn-sm btn-ic" title="Wachtwoord resetten" onClick={()=>resetPw(u.id,u.username)}>🔑</button>
                        <button className="btn btn-del btn-sm btn-ic" title="Definitief verwijderen" onClick={()=>deleteUser(u.id,u.username)}>🗑️</button>
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
        {TABS.map(t=>(
          <button key={t.id} className={`bn${tab===t.id?" on":""}`} onClick={()=>setTab(t.id)}>
            <span className="bn-ic">{t.ic}</span>
            {t.lb}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ── GROUP CARD ────────────────────────────────────────────────────────────
function GroupCard({group,matches,isAdmin,myPreds,onScore,onLock,onPred}){
  const gm=matches.filter(m=>m.grp===group&&m.phase==="group");
  const[ed,setEd]=useState(null);
  const[ts,setTs]=useState({h:"",a:""});
  const[pe,setPe]=useState(null);
  const[tp,setTp]=useState({h:"",a:""});
  const[sav,setSav]=useState(false);
  if(!gm.length)return<div className="empty"><div className="empty-i">⚽</div><div className="empty-t">Geen wedstrijden gevonden.</div></div>;
  return(
    <div className="card">
      <div className="card-head">
        <span className="card-title">Groep {group}</span>
        <span style={{fontSize:10,color:"var(--t3)",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160}}>{GROUP_TEAMS[group]?.join(" · ")}</span>
      </div>
      {gm.map(m=>{
        const mp=myPreds.find(p=>p.match_id===m.id);
        const done=m.home_goals!=null&&m.away_goals!=null;
        const isE=ed===m.id,isP=pe===m.id;
        const canP=!isAdmin&&!m.locked;
        let cls="",lbl="";
        if(!isAdmin&&mp&&done){
          const[ph,pa,mh,ma]=[+mp.home_goals,+mp.away_goals,+m.home_goals,+m.away_goals];
          if(ph===mh&&pa===ma){cls="pts-3";lbl="+3";}
          else{const po=ph>pa?1:ph<pa?-1:0,mo=mh>ma?1:mh<ma?-1:0;cls=po===mo?"pts-1":"pts-0";lbl=po===mo?"+1":"0";}
        }
        return(
          <div key={m.id} className="mr">
            <div className="mr-teams">
              <div className="mr-home">{m.home}</div>
              {isAdmin&&isE?(
                <div className="score-edit" style={{padding:"6px 8px"}}>
                  <input type="number" min="0" max="20" className="ni" style={{width:38,height:34,fontSize:15}} value={ts.h} onChange={e=>setTs(s=>({...s,h:e.target.value}))}/>
                  <span style={{color:"var(--t3)",fontWeight:700}}>–</span>
                  <input type="number" min="0" max="20" className="ni" style={{width:38,height:34,fontSize:15}} value={ts.a} onChange={e=>setTs(s=>({...s,a:e.target.value}))}/>
                  <button className="btn-confirm" onClick={async()=>{await onScore(m.id,{home_goals:ts.h||null,away_goals:ts.a||null});setEd(null);}}>✓</button>
                  <button className="btn btn-out btn-sm" onClick={()=>setEd(null)}>✕</button>
                </div>
              ):(
                <div className={`score-btn${done?" done":""}${isAdmin&&!m.locked?" editable":""}`}
                  onClick={()=>{if(isAdmin&&!m.locked){setEd(m.id);setTs({h:m.home_goals??"",a:m.away_goals??""});}}}>
                  {done?`${m.home_goals}–${m.away_goals}`:"vs"}
                </div>
              )}
              <div className="mr-away">{m.away}</div>
            </div>
            <div className="mr-meta">
              <span className="mr-time">📅 {m.match_date}</span>
              <div className="mr-actions">
                {m.locked&&!isAdmin&&<span className="lock-tag">🔒 Gesloten</span>}
                {!isAdmin&&mp&&done&&<span className={`pts-badge ${cls}`}>{lbl}</span>}
                {!isAdmin&&mp&&!isP&&<span className="pill">{mp.home_goals}–{mp.away_goals}</span>}
                {canP&&!isP&&<button className="btn btn-out btn-sm" onClick={()=>{setPe(m.id);setTp({h:mp?.home_goals??"",a:mp?.away_goals??""});}}>{mp?"✏️ Wijzig":"🎯 Tip"}</button>}
                {isAdmin&&!isE&&<button className="btn btn-out btn-sm" onClick={()=>onLock(m.id,m.locked)}>{m.locked?"🔓 Open":"🔒 Sluit"}</button>}
              </div>
            </div>
            {!isAdmin&&isP&&(
              <div className="score-edit">
                <span style={{fontSize:11,color:"var(--t2)",fontWeight:700}}>Jouw tip:</span>
                <input type="number" min="0" max="20" className="ni" value={tp.h} onChange={e=>setTp(p=>({...p,h:e.target.value}))}/>
                <span style={{color:"var(--t3)",fontWeight:700}}>–</span>
                <input type="number" min="0" max="20" className="ni" value={tp.a} onChange={e=>setTp(p=>({...p,a:e.target.value}))}/>
                <button className="btn-confirm" disabled={sav} onClick={async()=>{setSav(true);await onPred(m.id,tp.h,tp.a);setSav(false);setPe(null);}}>{sav?"...":"✓"}</button>
                <button className="btn btn-out btn-sm" onClick={()=>setPe(null)}>✕</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── KO CARD ───────────────────────────────────────────────────────────────
function KOCard({phase,matches,isAdmin,myPreds,onScore,onLock,onPred,allTeams}){
  const km=matches.filter(m=>m.phase===phase);
  const[ed,setEd]=useState(null);
  const[ts,setTs]=useState({h:"",a:"",home:"",away:""});
  const[pe,setPe]=useState(null);
  const[tp,setTp]=useState({h:"",a:""});
  const[sav,setSav]=useState(false);
  const phaseInfo=KO_PHASES.find(p=>p.id===phase);
  if(!km.length)return<div className="empty"><div className="empty-i">🥊</div><div className="empty-t">Geen wedstrijden in deze fase.</div></div>;
  return(
    <div className="card">
      <div className="card-head"><span className="card-title">{phaseInfo?.full||phase}</span><span style={{fontSize:10,color:"var(--t3)"}}>{km.length} wedstrijden</span></div>
      {km.map(m=>{
        const mp=myPreds.find(p=>p.match_id===m.id);
        const done=m.home_goals!=null&&m.away_goals!=null;
        // Check if it's a real team (not placeholder text)
        const isRealHome=m.home&&!m.home.startsWith("Winnaar")&&!m.home.startsWith("Verliezer")&&!m.home.startsWith("1e")&&!m.home.startsWith("2e")&&!m.home.startsWith("Beste");
        const isRealAway=m.away&&!m.away.startsWith("Winnaar")&&!m.away.startsWith("Verliezer")&&!m.away.startsWith("1e")&&!m.away.startsWith("2e")&&!m.away.startsWith("Beste");
        const hasTeams=isRealHome&&isRealAway;
        const isE=ed===m.id,isP=pe===m.id;
        const canP=!isAdmin&&!m.locked&&hasTeams;
        let cls="",lbl="";
        if(!isAdmin&&mp&&done){
          const[ph,pa,mh,ma]=[+mp.home_goals,+mp.away_goals,+m.home_goals,+m.away_goals];
          if(ph===mh&&pa===ma){cls="pts-3";lbl="+3";}
          else{const po=ph>pa?1:ph<pa?-1:0,mo=mh>ma?1:mh<ma?-1:0;cls=po===mo?"pts-1":"pts-0";lbl=po===mo?"+1":"0";}
        }
        return(
          <div key={m.id} className="mr">
            <div style={{fontSize:10,color:"var(--t3)",fontWeight:600,marginBottom:6}}>📅 {m.match_date}</div>
            {isAdmin&&isE?(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"flex",gap:7}}>
                  <div style={{flex:1}}>
                    <div className="lbl" style={{marginBottom:4}}>Thuisteam</div>
                    <select className="sel" style={{fontSize:13,padding:"8px 11px"}} value={ts.home} onChange={e=>setTs(s=>({...s,home:e.target.value}))}>
                      <option value="">— Kies team —</option>
                      {allTeams.map(t=><option key={t} value={t}>{t}</option>)}
                      <option value="custom">Handmatig invullen...</option>
                    </select>
                    {ts.home==="custom"&&<input className="inp" style={{marginTop:5,fontSize:13,padding:"8px 11px"}} placeholder="Naam thuisteam..." value={ts.homeCustom||""} onChange={e=>setTs(s=>({...s,homeCustom:e.target.value}))}/>}
                  </div>
                  <div style={{flex:1}}>
                    <div className="lbl" style={{marginBottom:4}}>Uitteam</div>
                    <select className="sel" style={{fontSize:13,padding:"8px 11px"}} value={ts.away} onChange={e=>setTs(s=>({...s,away:e.target.value}))}>
                      <option value="">— Kies team —</option>
                      {allTeams.map(t=><option key={t} value={t}>{t}</option>)}
                      <option value="custom">Handmatig invullen...</option>
                    </select>
                    {ts.away==="custom"&&<input className="inp" style={{marginTop:5,fontSize:13,padding:"8px 11px"}} placeholder="Naam uitteam..." value={ts.awayCustom||""} onChange={e=>setTs(s=>({...s,awayCustom:e.target.value}))}/>}
                  </div>
                </div>
                <div className="score-edit">
                  <span style={{fontSize:11,color:"var(--t2)"}}>Score:</span>
                  <input type="number" min="0" max="20" className="ni" value={ts.h} onChange={e=>setTs(s=>({...s,h:e.target.value}))}/>
                  <span style={{color:"var(--t3)",fontWeight:700}}>–</span>
                  <input type="number" min="0" max="20" className="ni" value={ts.a} onChange={e=>setTs(s=>({...s,a:e.target.value}))}/>
                  <button className="btn-confirm" onClick={async()=>{
                    const homeVal=ts.home==="custom"?ts.homeCustom:ts.home;
                    const awayVal=ts.away==="custom"?ts.awayCustom:ts.away;
                    await onScore(m.id,{home:homeVal||null,away:awayVal||null,home_goals:ts.h||null,away_goals:ts.a||null});
                    setEd(null);
                  }}>✓ Opslaan</button>
                  <button className="btn btn-out btn-sm" onClick={()=>setEd(null)}>✕</button>
                </div>
              </div>
            ):(
              <div className="mr-teams">
                <div className="mr-home" style={{color:hasTeams?"var(--t1)":"var(--t3)",fontStyle:hasTeams?"normal":"italic",fontSize:hasTeams?12:11}}>
                  {m.home||"Nog onbekend"}
                </div>
                <div className={`score-btn${done?" done":""}${isAdmin&&!m.locked?" editable":""}`}
                  onClick={()=>{if(isAdmin&&!m.locked){setEd(m.id);setTs({h:m.home_goals??"",a:m.away_goals??"",home:m.home??"",away:m.away??""});}}}>
                  {done?`${m.home_goals}–${m.away_goals}`:hasTeams?"vs":"?"}
                </div>
                <div className="mr-away" style={{color:hasTeams?"var(--t1)":"var(--t3)",fontStyle:hasTeams?"normal":"italic",fontSize:hasTeams?12:11}}>
                  {m.away||"Nog onbekend"}
                </div>
              </div>
            )}
            {!hasTeams&&!isAdmin&&<div style={{fontSize:10,color:"var(--t3)",textAlign:"center",marginTop:4,fontStyle:"italic"}}>Teams worden bekendgemaakt na vorige ronde</div>}
            <div className="mr-meta">
              <span></span>
              <div className="mr-actions">
                {m.locked&&!isAdmin&&<span className="lock-tag">🔒</span>}
                {!isAdmin&&mp&&done&&<span className={`pts-badge ${cls}`}>{lbl}</span>}
                {!isAdmin&&mp&&!isP&&<span className="pill">{mp.home_goals}–{mp.away_goals}</span>}
                {canP&&!isP&&<button className="btn btn-out btn-sm" onClick={()=>{setPe(m.id);setTp({h:mp?.home_goals??"",a:mp?.away_goals??""});}}>{mp?"✏️":"🎯 Tip"}</button>}
                {isAdmin&&!isE&&<button className="btn btn-out btn-sm" onClick={()=>onLock(m.id,m.locked)}>{m.locked?"🔓":"🔒"}</button>}
              </div>
            </div>
            {!isAdmin&&isP&&(
              <div className="score-edit">
                <span style={{fontSize:11,color:"var(--t2)",fontWeight:700}}>Jouw tip:</span>
                <input type="number" min="0" max="20" className="ni" value={tp.h} onChange={e=>setTp(p=>({...p,h:e.target.value}))}/>
                <span style={{color:"var(--t3)",fontWeight:700}}>–</span>
                <input type="number" min="0" max="20" className="ni" value={tp.a} onChange={e=>setTp(p=>({...p,a:e.target.value}))}/>
                <button className="btn-confirm" disabled={sav} onClick={async()=>{setSav(true);await onPred(m.id,tp.h,tp.a);setSav(false);setPe(null);}}>{sav?"...":"✓"}</button>
                <button className="btn btn-out btn-sm" onClick={()=>setPe(null)}>✕</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── BONUS USER ────────────────────────────────────────────────────────────
function BonusUser({myAns,bonusR,onSave}){
  const[ans,setAns]=useState(myAns||{});
  const[sav,setSav]=useState(false);
  const correct=BONUS_QS.filter(q=>bonusR?.[q.id]&&ans[q.id]?.toString().toLowerCase().trim()===bonusR[q.id].toString().toLowerCase().trim()).length;
  const total=BONUS_QS.length;
  return(
    <div>
      <div className="infobox">
        <span className="infobox-i">💡</span>
        <div className="infobox-t">
          5 punten per goed antwoord · {total} vragen · max {total*5} punten.
          {bonusR&&<span style={{color:"var(--gr)",fontWeight:700}}> Jij hebt {correct}/{total} goed!</span>}
        </div>
      </div>
      {BONUS_QS.map((q,i)=>{
        const r=bonusR?.[q.id],a=ans[q.id]||"";
        const ok=r&&a.toString().toLowerCase().trim()===r.toString().toLowerCase().trim();
        return(
          <div key={q.id} className={`bq${r?ok?" ok":" no":""}`} style={{animationDelay:`${i*40}ms`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:9,gap:8}}>
              <span style={{fontWeight:700,fontSize:13,flex:1}}>{q.label}</span>
              {r&&<span className={`pts-badge ${ok?"pts-3":"pts-0"}`} style={{flexShrink:0}}>{ok?"+5 ✓":"0 ✗"}</span>}
            </div>
            {q.type==="team"
              ?<select className="sel" value={a} onChange={e=>setAns(v=>({...v,[q.id]:e.target.value}))}>
                <option value="">— Kies een land —</option>
                {ALL_TEAMS.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              :<input className="inp" type={q.type==="number"?"number":"text"} placeholder={q.type==="number"?"Aantal goals...":"Naam speler..."} value={a} onChange={e=>setAns(v=>({...v,[q.id]:e.target.value}))}/>
            }
            {r&&<div style={{fontSize:11,color:"var(--t3)",marginTop:7}}>Correct antwoord: <b style={{color:"var(--t1)"}}>{r}</b></div>}
          </div>
        );
      })}
      <button className="btn btn-green" disabled={sav} onClick={async()=>{setSav(true);await onSave(ans);setSav(false);}}>
        {sav?"Opslaan...":"✓ Antwoorden opslaan"}
      </button>
    </div>
  );
}

// ── BONUS ADMIN ───────────────────────────────────────────────────────────
function BonusAdmin({bonusR,onSave}){
  const[res,setRes]=useState(bonusR||{});
  const[sav,setSav]=useState(false);
  return(
    <div>
      <div className="infobox">
        <span className="infobox-i">👑</span>
        <div className="infobox-t">Vul de correcte antwoorden in. Punten worden direct bijgewerkt voor alle deelnemers.</div>
      </div>
      {BONUS_QS.map(q=>(
        <div key={q.id} className="bq">
          <div style={{fontWeight:700,fontSize:13,marginBottom:9}}>{q.label}</div>
          {q.type==="team"
            ?<select className="sel" value={res[q.id]||""} onChange={e=>setRes(r=>({...r,[q.id]:e.target.value}))}>
              <option value="">— Kies een land —</option>
              {ALL_TEAMS.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            :<input className="inp" type={q.type==="number"?"number":"text"} placeholder={q.type==="number"?"Aantal goals...":"Naam speler..."} value={res[q.id]||""} onChange={e=>setRes(r=>({...r,[q.id]:e.target.value}))}/>
          }
        </div>
      ))}
      <button className="btn btn-green" disabled={sav} onClick={async()=>{setSav(true);await onSave(res);setSav(false);}}>
        {sav?"Opslaan...":"✓ Resultaten opslaan"}
      </button>
    </div>
  );
}

// ── AUTH PAGE ─────────────────────────────────────────────────────────────
function AuthPage({mode,setMode,form,setForm,err,loading,onLogin,onRegister}){
  const f=k=>e=>setForm(x=>({...x,[k]:e.target.value}));
  return(
    <div className="auth">
      <style>{CSS}</style>
      <div className="auth-hero">
        <div style={{position:"relative",zIndex:1}}>
          <div style={{fontSize:48,marginBottom:12,filter:"drop-shadow(0 0 16px rgba(255,107,0,.45))"}}>🏆</div>
          <div style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:32,letterSpacing:.5}}>WK <span style={{color:"var(--gr)"}}>2026</span></div>
          <div style={{fontWeight:800,fontSize:14,color:"var(--am)",letterSpacing:2,textTransform:"uppercase",marginTop:6}}>Dinxperlo Boys</div>
          <div style={{height:1.5,background:"linear-gradient(90deg,transparent,var(--gr),var(--am),var(--gr),transparent)",margin:"14px auto",maxWidth:160,borderRadius:1}}/>
          <div style={{fontSize:10,color:"var(--t3)",letterSpacing:2,textTransform:"uppercase"}}>48 Teams · Noord-Amerika · 2026</div>
        </div>
      </div>
      <div className="auth-body">
        <div className="auth-tabs">
          {["login","register"].map(m=>(
            <button key={m} className={`auth-tab${mode===m?" on":""}`} onClick={()=>setMode(m)}>
              {m==="login"?"Inloggen":"Account aanmaken"}
            </button>
          ))}
        </div>
        <div className="fg"><label className="lbl">Gebruikersnaam</label>
          <input className="inp" placeholder="Jouw naam..." value={form.u} onChange={f("u")} autoCapitalize="none" autoCorrect="off" onKeyDown={e=>e.key==="Enter"&&(mode==="login"?onLogin():onRegister())}/>
        </div>
        <div className="fg"><label className="lbl">Wachtwoord</label>
          <input className="inp" type="password" placeholder="••••••••" value={form.p} onChange={f("p")} onKeyDown={e=>e.key==="Enter"&&(mode==="login"?onLogin():onRegister())}/>
        </div>
        {mode==="register"&&(
          <div className="fg"><label className="lbl">Wachtwoord bevestigen</label>
            <input className="inp" type="password" placeholder="••••••••" value={form.p2} onChange={f("p2")} onKeyDown={e=>e.key==="Enter"&&onRegister()}/>
          </div>
        )}
        {err&&<div className="errbox">{err}</div>}
        <button className="btn btn-green" disabled={loading} onClick={mode==="login"?onLogin:onRegister} style={{marginTop:4}}>
          {loading?<span className="spin">⚽</span>:mode==="login"?"Inloggen →":"Account aanmaken →"}
        </button>
        <div style={{textAlign:"center",marginTop:16,fontSize:13,color:"var(--t3)"}}>
          {mode==="login"?"Nog geen account? ":"Al een account? "}
          <button onClick={()=>setMode(mode==="login"?"register":"login")} style={{background:"none",border:"none",color:"var(--gr)",fontWeight:700,fontSize:13,cursor:"pointer"}}>
            {mode==="login"?"Aanmaken":"Inloggen"}
          </button>
        </div>
      </div>
    </div>
  );
}
