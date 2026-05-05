import { useState, useEffect } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://lhoeabvsnjprmahsnzzh.supabase.co";
const SUPABASE_KEY = "sb_publishable_tbtPN0fnjygO1RcK6tMFxw__4LxEnyq";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const ADMIN = { username: "admin", password: "Admin2026!" };

const ALL_GROUPS = {
  A: ["🇲🇽 Mexico", "🇿🇦 Zuid-Afrika", "🇰🇷 Zuid-Korea", "🇨🇿 Tsjechië"],
  B: ["🇨🇦 Canada", "🇧🇦 Bosnië-Herz.", "🇶🇦 Qatar", "🇨🇭 Zwitserland"],
  C: ["🇧🇷 Brazilië", "🇲🇦 Marokko", "🇭🇹 Haïti", "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Schotland"],
  D: ["🇺🇸 USA", "🇵🇾 Paraguay", "🇦🇺 Australië", "🇹🇷 Turkije"],
  E: ["🇩🇪 Duitsland", "🇨🇼 Curaçao", "🇨🇮 Ivoorkust", "🇪🇨 Ecuador"],
  F: ["🇳🇱 Nederland", "🇯🇵 Japan", "🇸🇪 Zweden", "🇹🇳 Tunesië"],
  G: ["🇧🇪 België", "🇪🇬 Egypte", "🇮🇷 Iran", "🇳🇿 Nieuw-Zeeland"],
  H: ["🇪🇸 Spanje", "🇨🇻 Kaapverdië", "🇸🇦 Saoedi-Arabië", "🇺🇾 Uruguay"],
  I: ["🇫🇷 Frankrijk", "🇸🇳 Senegal", "🇮🇶 Irak", "🇳🇴 Noorwegen"],
  J: ["🇦🇷 Argentinië", "🇩🇿 Algerije", "🇦🇹 Oostenrijk", "🇯🇴 Jordanië"],
  K: ["🇵🇹 Portugal", "🇨🇩 DR Congo", "🇺🇿 Oezbekistan", "🇨🇴 Colombia"],
  L: ["🏴󠁧󠁢󠁥󠁮󠁧󠁿 Engeland", "🇭🇷 Kroatië", "🇬🇭 Ghana", "🇵🇦 Panama"],
};
const GROUPS = Object.keys(ALL_GROUPS);
const ALL_TEAMS = Object.values(ALL_GROUPS).flat();

// Official WK 2026 knockout bracket
// W=groepswinnaar, R=nummer 2, Q=beste nr3
const KNOCKOUT_MATCHES = [
  // Zestiende finales (R32) - 16 wedstrijden
  { id:100, phase:"r32", home_slot:"W-A", away_slot:"R-B", label:"W Groep A vs 2e Groep B", match_date:"28 jun" },
  { id:101, phase:"r32", home_slot:"W-C", away_slot:"R-D", label:"W Groep C vs 2e Groep D", match_date:"29 jun" },
  { id:102, phase:"r32", home_slot:"W-E", away_slot:"R-F", label:"W Groep E vs 2e Groep F", match_date:"29 jun" },
  { id:103, phase:"r32", home_slot:"W-G", away_slot:"R-H", label:"W Groep G vs 2e Groep H", match_date:"30 jun" },
  { id:104, phase:"r32", home_slot:"W-I", away_slot:"R-J", label:"W Groep I vs 2e Groep J", match_date:"30 jun" },
  { id:105, phase:"r32", home_slot:"W-K", away_slot:"R-L", label:"W Groep K vs 2e Groep L", match_date:"1 jul" },
  { id:106, phase:"r32", home_slot:"W-B", away_slot:"R-A", label:"W Groep B vs 2e Groep A", match_date:"1 jul" },
  { id:107, phase:"r32", home_slot:"W-D", away_slot:"R-C", label:"W Groep D vs 2e Groep C", match_date:"2 jul" },
  { id:108, phase:"r32", home_slot:"W-F", away_slot:"R-E", label:"W Groep F vs 2e Groep E", match_date:"2 jul" },
  { id:109, phase:"r32", home_slot:"W-H", away_slot:"R-G", label:"W Groep H vs 2e Groep G", match_date:"3 jul" },
  { id:110, phase:"r32", home_slot:"W-J", away_slot:"R-I", label:"W Groep J vs 2e Groep I", match_date:"3 jul" },
  { id:111, phase:"r32", home_slot:"W-L", away_slot:"R-K", label:"W Groep L vs 2e Groep K", match_date:"4 jul" },
  { id:112, phase:"r32", home_slot:"Q3-1", away_slot:"Q3-2", label:"Beste nr3 #1 vs Beste nr3 #2", match_date:"4 jul" },
  { id:113, phase:"r32", home_slot:"Q3-3", away_slot:"Q3-4", label:"Beste nr3 #3 vs Beste nr3 #4", match_date:"5 jul" },
  { id:114, phase:"r32", home_slot:"Q3-5", away_slot:"Q3-6", label:"Beste nr3 #5 vs Beste nr3 #6", match_date:"5 jul" },
  { id:115, phase:"r32", home_slot:"Q3-7", away_slot:"Q3-8", label:"Beste nr3 #7 vs Beste nr3 #8", match_date:"6 jul" },
  // Achtste finales (R16) - 8 wedstrijden
  { id:200, phase:"r16", label:"W R32-1 vs W R32-2",   match_date:"6 jul" },
  { id:201, phase:"r16", label:"W R32-3 vs W R32-4",   match_date:"7 jul" },
  { id:202, phase:"r16", label:"W R32-5 vs W R32-6",   match_date:"7 jul" },
  { id:203, phase:"r16", label:"W R32-7 vs W R32-8",   match_date:"8 jul" },
  { id:204, phase:"r16", label:"W R32-9 vs W R32-10",  match_date:"8 jul" },
  { id:205, phase:"r16", label:"W R32-11 vs W R32-12", match_date:"9 jul" },
  { id:206, phase:"r16", label:"W R32-13 vs W R32-14", match_date:"9 jul" },
  { id:207, phase:"r16", label:"W R32-15 vs W R32-16", match_date:"10 jul" },
  // Kwartfinales - 4 wedstrijden
  { id:300, phase:"qf", label:"W R16-1 vs W R16-2", match_date:"10 jul" },
  { id:301, phase:"qf", label:"W R16-3 vs W R16-4", match_date:"11 jul" },
  { id:302, phase:"qf", label:"W R16-5 vs W R16-6", match_date:"11 jul" },
  { id:303, phase:"qf", label:"W R16-7 vs W R16-8", match_date:"12 jul" },
  // Halve finales - 2 wedstrijden
  { id:400, phase:"sf", label:"W QF-1 vs W QF-2", match_date:"15 jul" },
  { id:401, phase:"sf", label:"W QF-3 vs W QF-4", match_date:"16 jul" },
  // Troostfinale
  { id:500, phase:"3p", label:"Troostfinale — 3e plaats", match_date:"18 jul" },
  // Finale
  { id:501, phase:"final", label:"🏆 FINALE WK 2026", match_date:"19 jul" },
];

function generateGroupMatches() {
  const matches = [];
  let id = 1;
  const dates = {
    A:["11 jun","12 jun","17 jun"], B:["12 jun","13 jun","18 jun"],
    C:["13 jun","14 jun","19 jun"], D:["14 jun","15 jun","20 jun"],
    E:["15 jun","16 jun","21 jun"], F:["14 jun","20 jun","26 jun"],
    G:["16 jun","17 jun","22 jun"], H:["17 jun","18 jun","23 jun"],
    I:["18 jun","19 jun","24 jun"], J:["19 jun","20 jun","25 jun"],
    K:["20 jun","21 jun","26 jun"], L:["21 jun","22 jun","27 jun"],
  };
  for (const grp of GROUPS) {
    const teams = ALL_GROUPS[grp];
    const pairs = [[0,1],[2,3],[0,2],[1,3],[0,3],[1,2]];
    pairs.forEach(([a,b], i) => {
      matches.push({ id, grp, phase:"group", home:teams[a], away:teams[b], match_date:dates[grp][Math.floor(i/2)], home_goals:null, away_goals:null, locked:false });
      id++;
    });
  }
  return matches;
}

function hashPw(pw) { let h=0; for(let c of pw) h=Math.imul(31,h)+c.charCodeAt(0)|0; return h.toString(36); }

function calcMatchPoints(predictions, matches) {
  let pts=0, exact=0, outcome=0;
  for(const p of predictions) {
    const m=matches.find(x=>x.id===p.match_id);
    if(!m||m.home_goals===null||m.away_goals===null) continue;
    const [ph,pa,mh,ma]=[+p.home_goals,+p.away_goals,+m.home_goals,+m.away_goals];
    if(ph===mh&&pa===ma){pts+=3;exact++;}
    else{const po=ph>pa?1:ph<pa?-1:0,mo=mh>ma?1:mh<ma?-1:0;if(po===mo){pts+=1;outcome++;}}
  }
  return {pts,exact,outcome};
}

const BONUS_QS = [
  {id:"b1", label:"🏆 Wie wordt wereldkampioen?", type:"team"},
  {id:"b2", label:"👟 Wie wordt topscorer?", type:"text"},
  {id:"b3", label:"⚽ Hoeveel goals in de finale?", type:"number"},
  {id:"b4", label:"❌ Welk land valt als eerste uit?", type:"team"},
  {id:"b5", label:"🔥 Welk team maakt de meeste goals?", type:"team"},
  {id:"b6", label:"🛡️ Welk team krijgt de meeste goals tegen?", type:"team"},
  {id:"b7", label:"🃏 Welk land verrast het meest (underdog)?", type:"team"},
  {id:"b8", label:"🥅 Hoeveel goals in totaal in de groepsfase?", type:"number"},
];

function calcBonusPoints(bonusAnswers, bonusResults) {
  if(!bonusResults||!bonusAnswers) return 0;
  let pts=0;
  for(const q of BONUS_QS) {
    const a=bonusAnswers[q.id], r=bonusResults[q.id];
    if(a&&r&&a.toString().toLowerCase().trim()===r.toString().toLowerCase().trim()) pts+=5;
  }
  return pts;
}

function groupStandings(matches, group) {
  const gm=matches.filter(m=>m.grp===group&&m.phase==="group");
  const teams=ALL_GROUPS[group]||[];
  const stats=Object.fromEntries(teams.map(t=>[t,{pts:0,w:0,d:0,l:0,gf:0,ga:0,mp:0}]));
  for(const m of gm) {
    if(m.home_goals===null) continue;
    const [mh,ma]=[+m.home_goals,+m.away_goals];
    stats[m.home].mp++;stats[m.away].mp++;
    stats[m.home].gf+=mh;stats[m.home].ga+=ma;
    stats[m.away].gf+=ma;stats[m.away].ga+=mh;
    if(mh>ma){stats[m.home].pts+=3;stats[m.home].w++;stats[m.away].l++;}
    else if(mh<ma){stats[m.away].pts+=3;stats[m.away].w++;stats[m.home].l++;}
    else{stats[m.home].pts+=1;stats[m.away].pts+=1;stats[m.home].d++;stats[m.away].d++;}
  }
  return teams.sort((a,b)=>{
    const sa=stats[a],sb=stats[b];
    return sb.pts-sa.pts||(sb.gf-sb.ga)-(sa.gf-sa.ga)||sb.gf-sa.gf;
  }).map(t=>({team:t,...stats[t]}));
}

const PHASE_LABELS={group:"Groepsfase",r32:"Zestiende Finale",r16:"Achtste Finale",qf:"Kwartfinale",sf:"Halve Finale","3p":"Troostfinale",final:"Finale"};

const css=`
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&family=DM+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{background:#060d1a;font-family:'Outfit',sans-serif;color:#dde6f0;overflow-x:hidden}
  ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#060d1a}::-webkit-scrollbar-thumb{background:#f9731633;border-radius:4px}
  input,button,select{font-family:inherit}
  .inp{width:100%;background:#0b1829;border:1.5px solid #1a3554;border-radius:10px;color:#dde6f0;padding:11px 16px;font-size:14px;outline:none;transition:border-color .2s}
  .inp:focus{border-color:#f97316}
  .sel{width:100%;background:#0b1829;border:1.5px solid #1a3554;border-radius:10px;color:#dde6f0;padding:11px 16px;font-size:14px;outline:none;cursor:pointer}
  .sel:focus{border-color:#f97316}
  .btn{border:none;border-radius:10px;font-weight:700;cursor:pointer;transition:all .18s}
  .btn-primary{background:linear-gradient(135deg,#ea580c,#f97316);color:#fff;padding:11px 24px;font-size:14px}
  .btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 24px #f9731444}
  .btn-primary:disabled{opacity:.5;transform:none;cursor:not-allowed}
  .btn-ghost{background:transparent;border:1.5px solid #1a3554;color:#6b8fa8;padding:8px 16px;font-size:13px;border-radius:10px}
  .btn-ghost:hover{border-color:#f97316;color:#f97316}
  .btn-sm{padding:5px 11px;font-size:12px;border-radius:7px}
  .btn-danger{background:#7f1d1d;color:#fca5a5;border-radius:8px}
  .btn-danger:hover{background:#991b1b}
  .card{background:#0b1829;border:1px solid #152d4a;border-radius:16px;padding:18px}
  .tab{background:none;border:none;border-bottom:2.5px solid transparent;color:#4a6f8a;padding:10px 12px;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;white-space:nowrap}
  .tab.on{color:#f97316;border-bottom-color:#f97316}
  .tab:hover{color:#dde6f0}
  .grp-btn{border:none;border-radius:8px;font-weight:700;font-size:12px;padding:5px 11px;cursor:pointer;transition:all .15s}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .fu{animation:fadeUp .3s ease both}
  @keyframes spin{to{transform:rotate(360deg)}}
  .spin{animation:spin .8s linear infinite;display:inline-block}
  @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
`;

// ── MESSI & RONALDO BANNER ────────────────────────────────────────────────
function Banner() {
  return (
    <div style={{position:"relative",overflow:"hidden",background:"#060d1a"}}>
      {/* Background gradient */}
      <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,#0a1628 0%,#0d2010 40%,#1a0a00 70%,#0a1628 100%)"}}/>
      {/* Stars */}
      {[...Array(20)].map((_,i)=><div key={i} style={{position:"absolute",width:i%3===0?3:2,height:i%3===0?3:2,borderRadius:"50%",background:"#ffffff20",top:`${Math.random()*100}%`,left:`${Math.random()*100}%`}}/>)}
      {/* Green pitch lines */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:3,background:"linear-gradient(90deg,transparent,#16a34a44,transparent)"}}/>

      {/* Left player silhouette - Messi style */}
      <div style={{position:"absolute",left:0,bottom:0,width:160,height:220,overflow:"hidden",opacity:.15}}>
        <svg viewBox="0 0 160 220" style={{width:"100%",height:"100%"}}>
          <ellipse cx="80" cy="30" rx="22" ry="24" fill="#4ade80"/>
          <path d="M58 54 Q45 80 40 130 Q38 160 45 180 Q52 200 65 210 L75 210 L70 160 L80 120 L90 160 L85 210 L95 210 Q108 200 115 180 Q122 160 120 130 Q115 80 102 54 Z" fill="#4ade80"/>
          <path d="M58 70 Q35 75 25 100 Q18 120 22 140 L40 135 Q42 115 50 95 Z" fill="#4ade80"/>
          <path d="M102 70 Q125 75 135 100 Q142 120 138 140 L120 135 Q118 115 110 95 Z" fill="#4ade80"/>
        </svg>
      </div>

      {/* Right player silhouette - Ronaldo style */}
      <div style={{position:"absolute",right:0,bottom:0,width:160,height:230,overflow:"hidden",opacity:.15}}>
        <svg viewBox="0 0 160 230" style={{width:"100%",height:"100%"}}>
          <ellipse cx="80" cy="28" rx="20" ry="22" fill="#f97316"/>
          <path d="M60 50 Q48 75 44 125 Q42 155 50 175 Q57 195 70 205 L80 205 L75 155 L80 115 L85 155 L80 205 L90 205 Q103 195 110 175 Q118 155 116 125 Q112 75 100 50 Z" fill="#f97316"/>
          <path d="M60 65 Q38 72 28 95 Q20 115 24 138 L42 132 Q44 112 52 92 Z" fill="#f97316"/>
          <path d="M100 65 Q122 72 132 95 Q140 115 136 138 L118 132 Q116 112 108 92 Z" fill="#f97316"/>
        </svg>
      </div>

      {/* Center content */}
      <div style={{position:"relative",zIndex:1,textAlign:"center",padding:"32px 20px 28px",maxWidth:860,margin:"0 auto"}}>
        {/* Trophy */}
        <div style={{fontSize:36,marginBottom:8,filter:"drop-shadow(0 0 12px #f9731666)"}}>🏆</div>
        {/* Title */}
        <div style={{fontWeight:900,fontSize:34,letterSpacing:3,textTransform:"uppercase",lineHeight:1,marginBottom:6}}>
          WK <span style={{color:"#f97316",textShadow:"0 0 20px #f9731666"}}>2026</span>
        </div>
        {/* Club name */}
        <div style={{fontWeight:900,fontSize:18,color:"#4ade80",letterSpacing:3,textTransform:"uppercase",marginBottom:8,textShadow:"0 0 16px #4ade8044"}}>
          Dinxperlo Boys
        </div>
        {/* Subtitle */}
        <div style={{fontSize:11,color:"#2a5070",letterSpacing:2,textTransform:"uppercase",marginBottom:16}}>
          Voorspellingen · 48 Teams · Noord-Amerika 2026
        </div>
        {/* Flags */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
          {["🇺🇸","🇲🇽","🇨🇦"].map((f,i)=><span key={i} style={{fontSize:24,filter:"drop-shadow(0 2px 6px #0008)"}}>{f}</span>)}
        </div>
        {/* Divider */}
        <div style={{marginTop:16,height:2,background:"linear-gradient(90deg,transparent,#f97316,#4ade80,#f97316,transparent)",borderRadius:2}}/>
      </div>
    </div>
  );
}

export default function App() {
  const [matches,      setMatches]      = useState([]);
  const [users,        setUsers]        = useState([]);
  const [allPreds,     setAllPreds]     = useState([]);
  const [bonusAnswers, setBonusAnswers] = useState([]);
  const [bonusResults, setBonusResults] = useState(null);
  const [session,      setSession]      = useState(()=>{try{return JSON.parse(localStorage.getItem("wkp_session"));}catch{return null;}});
  const [page,         setPage]         = useState("ranglijst");
  const [authMode,     setAuthMode]     = useState("login");
  const [form,         setForm]         = useState({username:"",password:"",confirmPw:""});
  const [formErr,      setFormErr]      = useState("");
  const [loading,      setLoading]      = useState(false);
  const [toast,        setToast]        = useState(null);
  const [dataLoading,  setDataLoading]  = useState(true);
  const [activeGroup,  setActiveGroup]  = useState("A");
  const [knockTab,     setKnockTab]     = useState("r32");

  const isAdmin=session?.username===ADMIN.username;
  const myPreds=allPreds.filter(p=>p.user_id===session?.id);
  const myBonusAnswers=bonusAnswers.find(b=>b.user_id===session?.id)?.answers||{};
  const showToast=(msg)=>{setToast(msg);setTimeout(()=>setToast(null),3000);};

  const loadData=async()=>{
    setDataLoading(true);
    const [{data:mData},{data:uData},{data:pData},{data:baData},{data:brData}]=await Promise.all([
      supabase.from("matches").select("*").order("id"),
      supabase.from("users").select("id,username"),
      supabase.from("predictions").select("*"),
      supabase.from("bonus_answers").select("*"),
      supabase.from("bonus_results").select("*").maybeSingle(),
    ]);
    let loadedMatches=mData||[];
    // If no matches or missing phase column, seed
    if(loadedMatches.length===0||!loadedMatches[0].hasOwnProperty('phase')) {
      const groupMatches=generateGroupMatches();
      const koMatches=KNOCKOUT_MATCHES.map(t=>({...t,home:null,away:null,home_goals:null,away_goals:null,locked:false,grp:null}));
      const all=[...groupMatches,...koMatches];
      await supabase.from("matches").upsert(all);
      loadedMatches=all;
    }
    setMatches(loadedMatches);
    if(uData) setUsers(uData);
    if(pData) setAllPreds(pData);
    if(baData) setBonusAnswers(baData);
    if(brData) setBonusResults(brData.answers);
    setDataLoading(false);
  };

  useEffect(()=>{loadData();},[]);
  useEffect(()=>{try{localStorage.setItem("wkp_session",JSON.stringify(session));}catch{};},[session]);

  const handleLogin=async()=>{
    const {username,password}=form;
    if(!username||!password) return setFormErr("Vul alles in.");
    if(username.toLowerCase()===ADMIN.username&&password===ADMIN.password){
      setSession({username:ADMIN.username,isAdmin:true});
      setFormErr("");setForm({username:"",password:"",confirmPw:""});return;
    }
    setLoading(true);
    const {data}=await supabase.from("users").select("*").ilike("username",username).maybeSingle();
    setLoading(false);
    if(!data||data.pw_hash!==hashPw(password)) return setFormErr("Gebruikersnaam of wachtwoord klopt niet.");
    setSession({id:data.id,username:data.username});
    setFormErr("");setForm({username:"",password:"",confirmPw:""});
  };

  const handleRegister=async()=>{
    const {username,password,confirmPw}=form;
    if(!username||!password||!confirmPw) return setFormErr("Vul alles in.");
    if(username.length<3) return setFormErr("Min. 3 tekens.");
    if(password.length<6) return setFormErr("Wachtwoord min. 6 tekens.");
    if(password!==confirmPw) return setFormErr("Wachtwoorden komen niet overeen.");
    if(username.toLowerCase()===ADMIN.username) return setFormErr("Naam niet beschikbaar.");
    setLoading(true);
    const {data:ex}=await supabase.from("users").select("id").ilike("username",username).maybeSingle();
    if(ex){setLoading(false);return setFormErr("Naam al in gebruik.");}
    const {data:nu,error}=await supabase.from("users").insert({username,pw_hash:hashPw(password)}).select().single();
    setLoading(false);
    if(error||!nu) return setFormErr("Er ging iets mis.");
    setUsers(us=>[...us,{id:nu.id,username:nu.username}]);
    setSession({id:nu.id,username:nu.username});
    setFormErr("");setForm({username:"",password:"",confirmPw:""});
    showToast(`Welkom ${username}! 🎉`);
  };

  const savePrediction=async(matchId,hg,ag)=>{
    if(!session?.id) return;
    const ex=allPreds.find(p=>p.user_id===session.id&&p.match_id===matchId);
    if(ex){
      await supabase.from("predictions").update({home_goals:hg,away_goals:ag}).eq("id",ex.id);
      setAllPreds(ps=>ps.map(p=>p.id===ex.id?{...p,home_goals:hg,away_goals:ag}:p));
    } else {
      const {data}=await supabase.from("predictions").insert({user_id:session.id,match_id:matchId,home_goals:hg,away_goals:ag}).select().single();
      if(data) setAllPreds(ps=>[...ps,data]);
    }
    showToast("Voorspelling opgeslagen ✓");
  };

  const setScore=async(id,updates)=>{
    await supabase.from("matches").update(updates).eq("id",id);
    setMatches(ms=>ms.map(m=>m.id===id?{...m,...updates}:m));
  };

  const toggleLock=async(id,locked)=>{
    await supabase.from("matches").update({locked:!locked}).eq("id",id);
    setMatches(ms=>ms.map(m=>m.id===id?{...m,locked:!locked}:m));
  };

  const saveBonusAnswer=async(answers)=>{
    if(!session?.id) return;
    const ex=bonusAnswers.find(b=>b.user_id===session.id);
    if(ex){
      await supabase.from("bonus_answers").update({answers}).eq("user_id",session.id);
      setBonusAnswers(bs=>bs.map(b=>b.user_id===session.id?{...b,answers}:b));
    } else {
      const {data}=await supabase.from("bonus_answers").insert({user_id:session.id,answers}).select().single();
      if(data) setBonusAnswers(bs=>[...bs,data]);
    }
    showToast("Bonus opgeslagen ✓");
  };

  const saveBonusResults=async(results)=>{
    const {data:ex}=await supabase.from("bonus_results").select("*").maybeSingle();
    if(ex) await supabase.from("bonus_results").update({answers:results}).eq("id",ex.id);
    else await supabase.from("bonus_results").insert({answers:results});
    setBonusResults(results);
    showToast("Bonus resultaten opgeslagen ✓");
  };

  const deleteUser=async(uid)=>{
    await supabase.from("users").delete().eq("id",uid);
    setUsers(us=>us.filter(u=>u.id!==uid));
    setAllPreds(ps=>ps.filter(p=>p.user_id!==uid));
    showToast("Deelnemer verwijderd.");
  };

  const resetPassword=async(uid,username)=>{
    const newPw=prompt(`Nieuw wachtwoord instellen voor ${username}:`);
    if(!newPw) return;
    if(newPw.length<6){ alert("Wachtwoord moet minimaal 6 tekens zijn!"); return; }
    await supabase.from("users").update({pw_hash:hashPw(newPw)}).eq("id",uid);
    showToast(`Wachtwoord van ${username} gewijzigd ✓`);
  };

  const leaderboard=[...users].map(u=>{
    const preds=allPreds.filter(p=>p.user_id===u.id);
    const {pts,exact,outcome}=calcMatchPoints(preds,matches);
    const ba=bonusAnswers.find(b=>b.user_id===u.id)?.answers||{};
    const bpts=calcBonusPoints(ba,bonusResults);
    return {...u,pts:pts+bpts,matchPts:pts,bonusPts:bpts,exact,outcome,predCount:preds.length};
  }).sort((a,b)=>b.pts-a.pts||b.exact-a.exact);

  if(!session) return <AuthPage authMode={authMode} setAuthMode={setAuthMode} form={form} setForm={setForm} formErr={formErr} loading={loading} onLogin={handleLogin} onRegister={handleRegister}/>;

  if(dataLoading) return(
    <div style={{minHeight:"100vh",background:"#060d1a",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <style>{css}</style>
      <div className="spin" style={{fontSize:32}}>⚽</div>
      <div style={{color:"#2a4f70",fontSize:14}}>WK 2026 laden...</div>
    </div>
  );

  const tabs=isAdmin
    ?["ranglijst","wedstrijden","knockout","standen","bonus","deelnemers"]
    :["ranglijst","wedstrijden","knockout","standen","bonus","mijn"];

  return(
    <div style={{minHeight:"100vh",background:"#060d1a"}}>
      <style>{css}</style>
      {toast&&<div style={{position:"fixed",top:16,right:16,zIndex:999,background:"#1a0f00",border:"1px solid #f97316",borderRadius:12,padding:"12px 20px",fontSize:14,fontWeight:600,color:"#f97316",boxShadow:"0 8px 32px #000a",animation:"fadeUp .3s ease"}}>{toast}</div>}

      <Banner/>

      <header style={{background:"#080f1e",borderBottom:"1px solid #101f35",position:"sticky",top:0,zIndex:50}}>
        <div style={{maxWidth:860,margin:"0 auto",padding:"0 16px",display:"flex",alignItems:"center",justifyContent:"space-between",height:44}}>
          <div style={{fontWeight:900,fontSize:13}}>⚽ <span style={{color:"#f97316"}}>Dinxperlo Boys</span> <span style={{color:"#4a6f8a",fontSize:10}}>WK 2026</span></div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {isAdmin&&<span style={{background:"#0c2a12",color:"#4ade80",border:"1px solid #16a34a44",borderRadius:5,padding:"2px 7px",fontSize:10,fontWeight:700}}>👑 Admin</span>}
            <span style={{fontSize:12,color:"#4a6f8a",fontWeight:600,maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{session.username}</span>
            <button className="btn btn-ghost btn-sm" onClick={()=>{setSession(null);setPage("ranglijst");}}>Uit</button>
          </div>
        </div>
        <div style={{maxWidth:860,margin:"0 auto",padding:"0 8px",display:"flex",overflowX:"auto"}}>
          {tabs.map(t=>(
            <button key={t} className={`tab${page===t?" on":""}`} onClick={()=>setPage(t)}>
              {{"ranglijst":"🏆 Stand","wedstrijden":"⚽ Groepen","knockout":"🥊 Knockout","standen":"📊 Standen","bonus":"🎯 Bonus","deelnemers":"👥 Spelers","mijn":"📋 Mijn"}[t]}
            </button>
          ))}
        </div>
      </header>

      <main style={{maxWidth:860,margin:"0 auto",padding:"18px 12px"}}>

        {/* RANGLIJST */}
        {page==="ranglijst"&&(
          <div className="fu">
            <div style={{marginBottom:16}}>
              <h2 style={{fontWeight:900,fontSize:20}}>🏆 Tussenstand</h2>
              <div style={{fontSize:11,color:"#2a4f70",marginTop:3}}>3pt exact · 1pt winnaar · 5pt per bonus</div>
            </div>
            {leaderboard.length===0
              ?<Empty icon="👥" text="Nog geen deelnemers. Vrienden kunnen zich aanmelden!"/>
              :leaderboard.map((u,i)=>{
                const isMe=u.id===session?.id;
                const medals=["🥇","🥈","🥉"],mc=["#fbbf24","#94a3b8","#cd7f32"];
                return(
                  <div key={u.id} className="card fu" style={{marginBottom:8,display:"flex",alignItems:"center",gap:12,border:isMe?"1px solid #f9731655":"1px solid #152d4a",background:isMe?"#120c02":"#0b1829",animationDelay:`${i*30}ms`}}>
                    <div style={{width:34,height:34,borderRadius:"50%",background:i<3?mc[i]+"22":"#0f2440",border:`2px solid ${i<3?mc[i]+"66":"#1a3554"}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:i<3?17:13,color:i<3?mc[i]:"#4a6f8a",flexShrink:0}}>
                      {i<3?medals[i]:i+1}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                        {u.username}
                        {isMe&&<span style={{background:"#1a0c00",color:"#f97316",border:"1px solid #f9731444",borderRadius:4,padding:"1px 5px",fontSize:10}}>jij</span>}
                      </div>
                      <div style={{fontSize:11,color:"#3a6080",marginTop:1}}>{u.exact} exact · {u.outcome} winnaar{u.bonusPts>0&&<span style={{color:"#f97316"}}> · +{u.bonusPts} bonus</span>}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:22,color:i===0?"#fbbf24":i===1?"#94a3b8":i===2?"#cd7f32":"#f97316"}}>{u.pts}</div>
                      <div style={{fontSize:10,color:"#2a4f70"}}>punten</div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}

        {/* GROEPSWEDSTRIJDEN */}
        {page==="wedstrijden"&&(
          <div className="fu">
            <div style={{marginBottom:12}}>
              <h2 style={{fontWeight:900,fontSize:20}}>⚽ Groepswedstrijden</h2>
              <div style={{fontSize:11,color:"#2a4f70",marginTop:3}}>{isAdmin?"Klik op score om te bewerken en vergrendel wedstrijden":"Kies een groep en vul je voorspellingen in"}</div>
            </div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
              {GROUPS.map(g=>(
                <button key={g} className="grp-btn" onClick={()=>setActiveGroup(g)} style={{background:activeGroup===g?"#f97316":"#0b1829",color:activeGroup===g?"#fff":"#4a6f8a",border:`1px solid ${activeGroup===g?"#f97316":"#1a3554"}`}}>
                  {g}
                </button>
              ))}
            </div>
            <GroupMatchesCard group={activeGroup} matches={matches} isAdmin={isAdmin} myPreds={myPreds} onSetScore={setScore} onToggleLock={toggleLock} onSavePred={savePrediction}/>
          </div>
        )}

        {/* KNOCKOUT */}
        {page==="knockout"&&(
          <div className="fu">
            <div style={{marginBottom:12}}>
              <h2 style={{fontWeight:900,fontSize:20}}>🥊 Knock-out Fase</h2>
              <div style={{fontSize:11,color:"#2a4f70",marginTop:3}}>{isAdmin?"Vul de teams en uitslagen in per ronde":"Voorspel de knockout wedstrijden"}</div>
            </div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
              {[["r32","1/16 Finale"],["r16","1/8 Finale"],["qf","Kwartfinale"],["sf","Halve Finale"],["final","Finale"]].map(([k,l])=>(
                <button key={k} className="grp-btn" onClick={()=>setKnockTab(k)} style={{background:knockTab===k?"#f97316":"#0b1829",color:knockTab===k?"#fff":"#4a6f8a",border:`1px solid ${knockTab===k?"#f97316":"#1a3554"}`}}>
                  {l}
                </button>
              ))}
            </div>
            <KnockoutCard phase={knockTab} matches={matches} isAdmin={isAdmin} myPreds={myPreds} onSetScore={setScore} onToggleLock={toggleLock} onSavePred={savePrediction}/>
          </div>
        )}

        {/* STANDEN */}
        {page==="standen"&&(
          <div className="fu">
            <h2 style={{fontWeight:900,fontSize:20,marginBottom:12}}>📊 Groepsstanden</h2>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
              {GROUPS.map(g=>(
                <button key={g} className="grp-btn" onClick={()=>setActiveGroup(g)} style={{background:activeGroup===g?"#f97316":"#0b1829",color:activeGroup===g?"#fff":"#4a6f8a",border:`1px solid ${activeGroup===g?"#f97316":"#1a3554"}`}}>
                  {g}
                </button>
              ))}
            </div>
            <StandingCard group={activeGroup} matches={matches}/>
          </div>
        )}

        {/* BONUS */}
        {page==="bonus"&&(
          <div className="fu">
            <div style={{marginBottom:14}}>
              <h2 style={{fontWeight:900,fontSize:20}}>🎯 Bonusvragen</h2>
              <div style={{fontSize:11,color:"#2a4f70",marginTop:3}}>5 punten per goed antwoord — {BONUS_QS.length} vragen!</div>
            </div>
            {isAdmin?<AdminBonus bonusResults={bonusResults} onSave={saveBonusResults}/>:<UserBonus myAnswers={myBonusAnswers} bonusResults={bonusResults} onSave={saveBonusAnswer}/>}
          </div>
        )}

        {/* MIJN POULE */}
        {page==="mijn"&&!isAdmin&&(
          <div className="fu">
            <div style={{marginBottom:14}}>
              <h2 style={{fontWeight:900,fontSize:20}}>📋 Mijn Poule</h2>
              <div style={{fontSize:11,color:"#2a4f70",marginTop:3}}>{session.username} · {calcMatchPoints(myPreds,matches).pts+calcBonusPoints(myBonusAnswers,bonusResults)} punten</div>
            </div>
            {myPreds.length===0?<Empty icon="🎯" text="Nog geen voorspellingen! Ga naar Groepen of Knockout."/>:
              myPreds.map(pred=>{
                const m=matches.find(x=>x.id===pred.match_id);
                if(!m) return null;
                const done=m.home_goals!==null;
                let ptLabel="",ptColor="#4a6f8a";
                if(done){
                  const [ph,pa,mh,ma]=[+pred.home_goals,+pred.away_goals,+m.home_goals,+m.away_goals];
                  if(ph===mh&&pa===ma){ptLabel="+3";ptColor="#22c55e";}
                  else{const po=ph>pa?1:ph<pa?-1:0,mo=mh>ma?1:mh<ma?-1:0;ptLabel=po===mo?"+1":"0";ptColor=po===mo?"#fbbf24":"#ef4444";}
                }
                return(
                  <div key={pred.match_id} className="card" style={{marginBottom:7,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                    <div style={{flex:1,minWidth:100}}>
                      <div style={{fontSize:12,fontWeight:600}}>{m.home||"?"} <span style={{color:"#2a4f70"}}>vs</span> {m.away||"?"}</div>
                      <div style={{fontSize:10,color:"#2a5070",marginTop:2}}>{PHASE_LABELS[m.phase]} · {m.match_date}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <ScorePill h={pred.home_goals} a={pred.away_goals}/>
                      {done&&<><span style={{color:"#1a3554"}}>→</span><ScorePill h={m.home_goals} a={m.away_goals} accent/></>}
                      {done&&<span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:14,color:ptColor}}>{ptLabel}</span>}
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}

        {/* DEELNEMERS (admin) */}
        {page==="deelnemers"&&isAdmin&&(
          <div className="fu">
            <div style={{marginBottom:14}}>
              <h2 style={{fontWeight:900,fontSize:20}}>👥 Deelnemers ({users.length})</h2>
            </div>
            {users.length===0?<Empty icon="👤" text="Nog niemand aangemeld."/>:
              users.map(u=>{
                const preds=allPreds.filter(p=>p.user_id===u.id);
                const {pts,exact}=calcMatchPoints(preds,matches);
                const ba=bonusAnswers.find(b=>b.user_id===u.id)?.answers||{};
                const bpts=calcBonusPoints(ba,bonusResults);
                return(
                  <div key={u.id} className="card" style={{marginBottom:7,display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:34,height:34,borderRadius:"50%",background:"#120c02",border:"2px solid #f9731633",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:"#f97316",flexShrink:0}}>{u.username[0].toUpperCase()}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:14}}>{u.username}</div>
                      <div style={{fontSize:11,color:"#3a6080"}}>{preds.length} voorspellingen · {exact} exact · {bpts}pt bonus</div>
                    </div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:17,color:"#f97316",flexShrink:0}}>{pts+bpts}<span style={{fontSize:10,color:"#2a4f70"}}> pt</span></div>
                    <button className="btn btn-sm" style={{background:"#0c2240",border:"1px solid #1e4d7b",color:"#38bdf8",padding:"5px 10px",flexShrink:0}} onClick={()=>resetPassword(u.id,u.username)}>🔑</button>
                    <button className="btn btn-danger btn-sm" style={{padding:"5px 10px",flexShrink:0}} onClick={()=>{if(confirm(`${u.username} verwijderen?`))deleteUser(u.id);}}>✕</button>
                  </div>
                );
              })
            }
          </div>
        )}
      </main>
    </div>
  );
}

// ─── GROUP MATCHES CARD ───────────────────────────────────────────────────
function GroupMatchesCard({group,matches,isAdmin,myPreds,onSetScore,onToggleLock,onSavePred}) {
  const gm=matches.filter(m=>m.grp===group&&m.phase==="group");
  const [editing,  setEditing]  = useState(null);
  const [ts,       setTs]       = useState({h:"",a:""});
  const [predEdit, setPredEdit] = useState(null);
  const [tp,       setTp]       = useState({h:"",a:""});
  const [saving,   setSaving]   = useState(false);

  if(gm.length===0) return <div className="card" style={{color:"#2a4f70",textAlign:"center",padding:32}}>Geen wedstrijden gevonden voor groep {group}.</div>;

  // Group by date
  const byDate={};
  gm.forEach(m=>{if(!byDate[m.match_date]) byDate[m.match_date]=[]; byDate[m.match_date].push(m);});

  return(
    <div>
      {Object.entries(byDate).map(([date,ms])=>(
        <div key={date} className="card" style={{marginBottom:12}}>
          <div style={{fontWeight:900,fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#f97316",marginBottom:12}}>
            Groep {group} · 📅 {date}
          </div>
          {ms.map(m=>{
            const myPred=myPreds.find(p=>p.match_id===m.id);
            const hasResult=m.home_goals!==null;
            const isES=editing===m.id, isEP=predEdit===m.id;
            const canPredict=!isAdmin&&!m.locked;
            let myPts=null;
            if(!isAdmin&&myPred&&hasResult){
              const [ph,pa,mh,ma]=[+myPred.home_goals,+myPred.away_goals,+m.home_goals,+m.away_goals];
              if(ph===mh&&pa===ma)myPts=3;
              else{const po=ph>pa?1:ph<pa?-1:0,mo=mh>ma?1:mh<ma?-1:0;myPts=po===mo?1:0;}
            }
            return(
              <div key={m.id} style={{borderBottom:"1px solid #0f2035",paddingBottom:10,marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{flex:1,textAlign:"right",fontSize:12,fontWeight:700}}>{m.home}</div>
                  {isAdmin&&isES?(
                    <div style={{display:"flex",gap:5,alignItems:"center",flexShrink:0}}>
                      <NumInput val={ts.h} onChange={v=>setTs(s=>({...s,h:v}))}/>
                      <span style={{color:"#2a4f70"}}>:</span>
                      <NumInput val={ts.a} onChange={v=>setTs(s=>({...s,a:v}))}/>
                      <button className="btn btn-primary btn-sm" onClick={async()=>{await onSetScore(m.id,{home_goals:ts.h===''?null:ts.h,away_goals:ts.a===''?null:ts.a});setEditing(null);}}>✓</button>
                      <button className="btn btn-ghost btn-sm" onClick={()=>setEditing(null)}>✕</button>
                    </div>
                  ):(
                    <div onClick={()=>{if(isAdmin&&!m.locked){setEditing(m.id);setTs({h:m.home_goals??"",a:m.away_goals??""});}}}
                      style={{background:"#060d1a",border:"1.5px solid",borderColor:hasResult?"#1a4a2e":"#1a2f4a",borderRadius:8,padding:"5px 10px",fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:15,color:hasResult?"#4ade80":"#2a4f70",cursor:isAdmin&&!m.locked?"pointer":"default",minWidth:58,textAlign:"center",flexShrink:0}}>
                      {hasResult?`${m.home_goals}-${m.away_goals}`:"?-?"}
                    </div>
                  )}
                  <div style={{flex:1,fontSize:12,fontWeight:700}}>{m.away}</div>
                  {isAdmin&&<button className="btn btn-sm" style={{background:m.locked?"#2d1a00":"#0f2040",border:"1px solid",borderColor:m.locked?"#92400e":"#1a3554",color:m.locked?"#fbbf24":"#4a6f8a",flexShrink:0}} onClick={()=>onToggleLock(m.id,m.locked)}>{m.locked?"🔒":"🔓"}</button>}
                </div>
                {/* User predict row */}
                {!isAdmin&&(
                  <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:6,marginTop:6,flexWrap:"wrap"}}>
                    {m.locked&&<span style={{fontSize:10,color:"#92400e",background:"#2d1a00",borderRadius:4,padding:"1px 5px"}}>🔒 Vergrendeld</span>}
                    {myPred&&hasResult&&<span style={{fontSize:11,fontWeight:700,color:myPts===3?"#22c55e":myPts===1?"#fbbf24":"#ef4444"}}>{myPts===3?"✓+3":myPts===1?"~+1":"✗0"}</span>}
                    {myPred&&!isEP&&<ScorePill h={myPred.home_goals} a={myPred.away_goals}/>}
                    {canPredict&&!isEP&&<button className="btn btn-ghost btn-sm" onClick={()=>{setPredEdit(m.id);setTp({h:myPred?.home_goals??"",a:myPred?.away_goals??""});}}>{myPred?"✏️ Wijzig":"🎯 Voorspel"}</button>}
                  </div>
                )}
                {!isAdmin&&isEP&&(
                  <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,background:"#060d1a",borderRadius:10,padding:"8px 12px",flexWrap:"wrap"}}>
                    <span style={{fontSize:12,color:"#4a6f8a",fontWeight:600}}>Jouw score:</span>
                    <NumInput val={tp.h} onChange={v=>setTp(p=>({...p,h:v}))}/>
                    <span style={{color:"#2a4f70"}}>–</span>
                    <NumInput val={tp.a} onChange={v=>setTp(p=>({...p,a:v}))}/>
                    <button className="btn btn-primary btn-sm" disabled={saving} onClick={async()=>{setSaving(true);await onSavePred(m.id,tp.h,tp.a);setSaving(false);setPredEdit(null);}}>{saving?"...":"Opslaan"}</button>
                    <button className="btn btn-ghost btn-sm" onClick={()=>setPredEdit(null)}>✕</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── KNOCKOUT CARD ────────────────────────────────────────────────────────
function KnockoutCard({phase,matches,isAdmin,myPreds,onSetScore,onToggleLock,onSavePred}) {
  const km=matches.filter(m=>m.phase===phase);
  const [editing,  setEditing]  = useState(null);
  const [ts,       setTs]       = useState({h:"",a:"",home:"",away:""});
  const [predEdit, setPredEdit] = useState(null);
  const [tp,       setTp]       = useState({h:"",a:""});
  const [saving,   setSaving]   = useState(false);

  if(km.length===0) return <div className="card" style={{color:"#2a4f70",textAlign:"center",padding:32}}>Geen wedstrijden in deze fase.</div>;

  return(
    <div className="card">
      <div style={{fontWeight:900,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#f97316",marginBottom:14}}>{PHASE_LABELS[phase]}</div>
      {km.map(m=>{
        const myPred=myPreds.find(p=>p.match_id===m.id);
        const hasResult=m.home_goals!==null;
        const hasTeams=m.home&&m.away;
        const isES=editing===m.id, isEP=predEdit===m.id;
        const canPredict=!isAdmin&&!m.locked&&hasTeams;
        let myPts=null;
        if(!isAdmin&&myPred&&hasResult){
          const [ph,pa,mh,ma]=[+myPred.home_goals,+myPred.away_goals,+m.home_goals,+m.away_goals];
          if(ph===mh&&pa===ma)myPts=3;
          else{const po=ph>pa?1:ph<pa?-1:0,mo=mh>ma?1:mh<ma?-1:0;myPts=po===mo?1:0;}
        }
        // Determine label
        const koInfo=KNOCKOUT_MATCHES.find(k=>k.id===m.id);
        const label=koInfo?.label||m.label||`Wedstrijd ${m.id}`;
        return(
          <div key={m.id} style={{borderBottom:"1px solid #0f2035",paddingBottom:12,marginBottom:12}}>
            <div style={{fontSize:10,color:"#3a5570",marginBottom:7,fontWeight:600}}>📅 {m.match_date} · {label}</div>
            {isAdmin&&isES?(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <input className="inp" style={{flex:1,minWidth:110}} placeholder="Thuisploeg..." value={ts.home} onChange={e=>setTs(s=>({...s,home:e.target.value}))}/>
                  <input className="inp" style={{flex:1,minWidth:110}} placeholder="Uitploeg..." value={ts.away} onChange={e=>setTs(s=>({...s,away:e.target.value}))}/>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{fontSize:12,color:"#4a6f8a"}}>Uitslag:</span>
                  <NumInput val={ts.h} onChange={v=>setTs(s=>({...s,h:v}))}/>
                  <span style={{color:"#2a4f70"}}>:</span>
                  <NumInput val={ts.a} onChange={v=>setTs(s=>({...s,a:v}))}/>
                  <button className="btn btn-primary btn-sm" onClick={async()=>{
                    await onSetScore(m.id,{home:ts.home||null,away:ts.away||null,home_goals:ts.h===''?null:ts.h,away_goals:ts.a===''?null:ts.a});
                    setEditing(null);
                  }}>✓ Opslaan</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setEditing(null)}>✕</button>
                </div>
              </div>
            ):(
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{flex:1,textAlign:"right",fontSize:12,fontWeight:700,color:hasTeams?"#dde6f0":"#3a5570",fontStyle:hasTeams?"normal":"italic"}}>
                  {m.home||"Nog onbekend"}
                </div>
                <div onClick={()=>{if(isAdmin&&!m.locked){setEditing(m.id);setTs({h:m.home_goals??"",a:m.away_goals??"",home:m.home??"",away:m.away??""});}}}
                  style={{background:"#060d1a",border:"1.5px solid",borderColor:hasResult?"#1a4a2e":hasTeams?"#1e3a5f":"#0f1e30",borderRadius:8,padding:"5px 10px",fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:15,color:hasResult?"#4ade80":hasTeams?"#2a4f70":"#1a2f40",cursor:isAdmin&&!m.locked?"pointer":"default",minWidth:58,textAlign:"center",flexShrink:0}}>
                  {hasResult?`${m.home_goals}-${m.away_goals}`:"?-?"}
                </div>
                <div style={{flex:1,fontSize:12,fontWeight:700,color:hasTeams?"#dde6f0":"#3a5570",fontStyle:hasTeams?"normal":"italic"}}>
                  {m.away||"Nog onbekend"}
                </div>
                {isAdmin&&<button className="btn btn-sm" style={{background:m.locked?"#2d1a00":"#0f2040",border:"1px solid",borderColor:m.locked?"#92400e":"#1a3554",color:m.locked?"#fbbf24":"#4a6f8a",flexShrink:0}} onClick={()=>onToggleLock(m.id,m.locked)}>{m.locked?"🔒":"🔓"}</button>}
              </div>
            )}
            {!hasTeams&&!isAdmin&&<div style={{fontSize:10,color:"#2a4f70",textAlign:"center",marginTop:6,fontStyle:"italic"}}>Teams bekend na groepsfase</div>}
            {!isAdmin&&hasTeams&&(
              <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:6,marginTop:6,flexWrap:"wrap"}}>
                {m.locked&&<span style={{fontSize:10,color:"#92400e",background:"#2d1a00",borderRadius:4,padding:"1px 5px"}}>🔒</span>}
                {myPred&&hasResult&&<span style={{fontSize:11,fontWeight:700,color:myPts===3?"#22c55e":myPts===1?"#fbbf24":"#ef4444"}}>{myPts===3?"✓+3":myPts===1?"~+1":"✗0"}</span>}
                {myPred&&!isEP&&<ScorePill h={myPred.home_goals} a={myPred.away_goals}/>}
                {canPredict&&!isEP&&<button className="btn btn-ghost btn-sm" onClick={()=>{setPredEdit(m.id);setTp({h:myPred?.home_goals??"",a:myPred?.away_goals??""});}}>{myPred?"✏️":"🎯 Voorspel"}</button>}
              </div>
            )}
            {!isAdmin&&isEP&&(
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,background:"#060d1a",borderRadius:10,padding:"8px 12px",flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:"#4a6f8a",fontWeight:600}}>Jouw score:</span>
                <NumInput val={tp.h} onChange={v=>setTp(p=>({...p,h:v}))}/>
                <span style={{color:"#2a4f70"}}>–</span>
                <NumInput val={tp.a} onChange={v=>setTp(p=>({...p,a:v}))}/>
                <button className="btn btn-primary btn-sm" disabled={saving} onClick={async()=>{setSaving(true);await onSavePred(m.id,tp.h,tp.a);setSaving(false);setPredEdit(null);}}>{saving?"...":"Opslaan"}</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setPredEdit(null)}>✕</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StandingCard({group,matches}) {
  const rows=groupStandings(matches,group);
  return(
    <div className="card">
      <div style={{fontWeight:900,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#f97316",marginBottom:12}}>Stand Groep {group}</div>
      <div style={{display:"flex",gap:4,fontSize:10,color:"#2a4f70",textTransform:"uppercase",letterSpacing:.8,paddingBottom:6,borderBottom:"1px solid #0f2035",fontWeight:700}}>
        <div style={{flex:1}}>Team</div>
        {["W","G","V","DV","DA","Pnt"].map(h=><div key={h} style={{width:26,textAlign:"center"}}>{h}</div>)}
      </div>
      {rows.map((r,i)=>(
        <div key={r.team} style={{display:"flex",gap:4,alignItems:"center",padding:"7px 0",borderBottom:i<rows.length-1?"1px solid #0b1a2e":"none"}}>
          <div style={{width:16,fontSize:10,color:i<2?"#f97316":"#2a4f70",fontWeight:700}}>{i+1}</div>
          <div style={{flex:1,fontWeight:600,fontSize:12}}>{r.team}</div>
          {[r.w,r.d,r.l,r.gf,r.ga].map((v,j)=>(
            <div key={j} style={{width:26,textAlign:"center",color:"#4a6f8a",fontFamily:"'DM Mono',monospace",fontSize:11}}>{v}</div>
          ))}
          <div style={{width:26,textAlign:"center",fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:13,color:i<2?"#f97316":"#dde6f0"}}>{r.pts}</div>
        </div>
      ))}
      <div style={{fontSize:10,color:"#f9731533",marginTop:8}}>🟠 Top 2 gaat door · Beste 8 nummers 3 ook</div>
    </div>
  );
}

function UserBonus({myAnswers,bonusResults,onSave}) {
  const [answers,setAnswers]=useState(myAnswers||{});
  const [saving,setSaving]=useState(false);
  const totalCorrect=Object.keys(answers).filter(k=>bonusResults?.[k]&&answers[k].toString().toLowerCase().trim()===bonusResults[k].toString().toLowerCase().trim()).length;
  return(
    <div>
      <div className="card" style={{marginBottom:14,background:"#120c02",border:"1px solid #f9731622"}}>
        <div style={{fontSize:13,color:"#f97316",fontWeight:700,marginBottom:4}}>💡 {BONUS_QS.length} bonusvragen · 5 punten per goed antwoord</div>
        <div style={{fontSize:12,color:"#5a4030"}}>Je kunt je antwoorden later nog wijzigen. {bonusResults&&<span style={{color:"#f97316"}}>✓ {totalCorrect} goed!</span>}</div>
      </div>
      {BONUS_QS.map(q=>{
        const result=bonusResults?.[q.id];
        const myAns=answers[q.id]||"";
        const correct=result&&myAns.toString().toLowerCase().trim()===result.toString().toLowerCase().trim();
        return(
          <div key={q.id} className="card" style={{marginBottom:10,border:result?(correct?"1px solid #16a34a55":"1px solid #7f1d1d44"):"1px solid #152d4a"}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:9,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
              <span>{q.label}</span>
              {result&&<span style={{fontSize:12,fontWeight:700,color:correct?"#22c55e":"#ef4444"}}>{correct?"✓ +5":"✗ 0"}</span>}
            </div>
            {q.type==="team"
              ?<select className="sel" value={myAns} onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))}>
                <option value="">— Kies een land —</option>
                {ALL_TEAMS.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              :<input className="inp" type={q.type==="number"?"number":"text"} placeholder={q.type==="number"?"Aantal...":"Naam speler of land..."} value={myAns} onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))}/>
            }
            {result&&<div style={{marginTop:7,fontSize:11,color:"#3a6080"}}>Antwoord: <b style={{color:"#dde6f0"}}>{result}</b></div>}
          </div>
        );
      })}
      <button className="btn btn-primary" style={{width:"100%"}} disabled={saving} onClick={async()=>{setSaving(true);await onSave(answers);setSaving(false);}}>
        {saving?"Opslaan...":"Antwoorden opslaan"}
      </button>
    </div>
  );
}

function AdminBonus({bonusResults,onSave}) {
  const [results,setResults]=useState(bonusResults||{});
  const [saving,setSaving]=useState(false);
  return(
    <div>
      <div className="card" style={{marginBottom:14,background:"#0d1a0d",border:"1px solid #16a34a33"}}>
        <div style={{fontSize:13,color:"#4ade80",fontWeight:700,marginBottom:4}}>👑 Vul de correcte antwoorden in</div>
        <div style={{fontSize:12,color:"#3a6050"}}>Punten worden automatisch berekend voor alle deelnemers zodra je opslaat.</div>
      </div>
      {BONUS_QS.map(q=>(
        <div key={q.id} className="card" style={{marginBottom:10}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:9}}>{q.label}</div>
          {q.type==="team"
            ?<select className="sel" value={results[q.id]||""} onChange={e=>setResults(r=>({...r,[q.id]:e.target.value}))}>
              <option value="">— Kies een land —</option>
              {ALL_TEAMS.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            :<input className="inp" type={q.type==="number"?"number":"text"} placeholder={q.type==="number"?"Aantal...":"Naam..."} value={results[q.id]||""} onChange={e=>setResults(r=>({...r,[q.id]:e.target.value}))}/>
          }
        </div>
      ))}
      <button className="btn btn-primary" style={{width:"100%"}} disabled={saving} onClick={async()=>{setSaving(true);await onSave(results);setSaving(false);}}>
        {saving?"Opslaan...":"Antwoorden opslaan"}
      </button>
    </div>
  );
}

function AuthPage({authMode,setAuthMode,form,setForm,formErr,loading,onLogin,onRegister}) {
  const f=(k)=>(e)=>setForm(x=>({...x,[k]:e.target.value}));
  return(
    <div style={{minHeight:"100vh",background:"#060d1a",display:"flex",flexDirection:"column"}}>
      <style>{css}</style>
      {/* Auth banner */}
      <div style={{position:"relative",overflow:"hidden",background:"#060d1a",padding:"40px 20px 32px",textAlign:"center"}}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,#0a1628,#0d2010,#1a0a00,#0a1628)"}}/>
        {/* Silhouettes */}
        <div style={{position:"absolute",left:0,bottom:0,width:120,height:180,opacity:.12}}>
          <svg viewBox="0 0 120 180"><ellipse cx="60" cy="25" rx="18" ry="20" fill="#4ade80"/>
          <path d="M42 45Q32 65 30 105Q28 130 35 150Q42 165 52 172L60 172L56 130L60 95L64 130L60 172L68 172Q78 165 85 150Q92 130 90 105Q88 65 78 45Z" fill="#4ade80"/>
          <path d="M42 58Q25 63 18 84Q12 100 15 118L30 113Q31 95 38 78Z" fill="#4ade80"/>
          <path d="M78 58Q95 63 102 84Q108 100 105 118L90 113Q89 95 82 78Z" fill="#4ade80"/></svg>
        </div>
        <div style={{position:"absolute",right:0,bottom:0,width:120,height:180,opacity:.12}}>
          <svg viewBox="0 0 120 180"><ellipse cx="60" cy="23" rx="17" ry="19" fill="#f97316"/>
          <path d="M43 42Q34 62 32 100Q30 126 37 146Q44 162 54 169L60 169L56 127L60 92L64 127L60 169L66 169Q76 162 83 146Q90 126 88 100Q86 62 77 42Z" fill="#f97316"/>
          <path d="M43 55Q26 60 19 80Q13 96 16 114L31 109Q32 91 39 74Z" fill="#f97316"/>
          <path d="M77 55Q94 60 101 80Q107 96 104 114L89 109Q88 91 81 74Z" fill="#f97316"/></svg>
        </div>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{fontSize:40,marginBottom:8,filter:"drop-shadow(0 0 12px #f9731655)"}}>🏆</div>
          <div style={{fontWeight:900,fontSize:28,letterSpacing:2,textTransform:"uppercase"}}>WK <span style={{color:"#f97316"}}>2026</span></div>
          <div style={{fontWeight:900,fontSize:16,color:"#4ade80",letterSpacing:2,marginTop:5,textTransform:"uppercase"}}>Dinxperlo Boys</div>
          <div style={{height:2,background:"linear-gradient(90deg,transparent,#f97316,#4ade80,#f97316,transparent)",borderRadius:2,margin:"12px auto",maxWidth:200}}/>
          <div style={{fontSize:10,color:"#2a4f70",letterSpacing:2,textTransform:"uppercase"}}>48 Teams · Noord-Amerika 2026</div>
        </div>
      </div>
      {/* Form */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{width:"100%",maxWidth:360}}>
          <div className="card fu">
            <div style={{display:"flex",background:"#060d1a",borderRadius:10,padding:3,marginBottom:18,gap:3}}>
              {["login","register"].map(m=>(
                <button key={m} onClick={()=>setAuthMode(m)} style={{flex:1,border:"none",borderRadius:8,padding:"9px 0",fontWeight:700,fontSize:13,cursor:"pointer",transition:"all .2s",background:authMode===m?"#120c02":"transparent",color:authMode===m?"#f97316":"#3a6080"}}>
                  {m==="login"?"Inloggen":"Account aanmaken"}
                </button>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div>
                <label style={{fontSize:11,color:"#3a6080",fontWeight:700,textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:5}}>Gebruikersnaam</label>
                <input className="inp" placeholder="Jouw naam..." value={form.username} onChange={f("username")} onKeyDown={e=>e.key==="Enter"&&(authMode==="login"?onLogin():onRegister())}/>
              </div>
              <div>
                <label style={{fontSize:11,color:"#3a6080",fontWeight:700,textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:5}}>Wachtwoord</label>
                <input className="inp" type="password" placeholder="••••••••" value={form.password} onChange={f("password")} onKeyDown={e=>e.key==="Enter"&&(authMode==="login"?onLogin():onRegister())}/>
              </div>
              {authMode==="register"&&(
                <div>
                  <label style={{fontSize:11,color:"#3a6080",fontWeight:700,textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:5}}>Bevestig wachtwoord</label>
                  <input className="inp" type="password" placeholder="••••••••" value={form.confirmPw} onChange={f("confirmPw")} onKeyDown={e=>e.key==="Enter"&&onRegister()}/>
                </div>
              )}
              {formErr&&<div style={{background:"#3b0a0a",border:"1px solid #7f1d1d",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#fca5a5"}}>{formErr}</div>}
              <button className="btn btn-primary" style={{width:"100%",marginTop:4}} disabled={loading} onClick={authMode==="login"?onLogin:onRegister}>
                {loading?<span className="spin">⚽</span>:authMode==="login"?"Inloggen →":"Account aanmaken →"}
              </button>
            </div>
            <div style={{marginTop:14,textAlign:"center",fontSize:12,color:"#2a4f70"}}>
              {authMode==="login"?"Nog geen account? ":"Al een account? "}
              <button onClick={()=>setAuthMode(authMode==="login"?"register":"login")} style={{background:"none",border:"none",color:"#f97316",cursor:"pointer",fontWeight:700,fontSize:12}}>
                {authMode==="login"?"Aanmaken":"Inloggen"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScorePill({h,a,accent}) {
  return <div style={{background:accent?"#0c2e1a":"#060d1a",border:`1px solid ${accent?"#16a34a44":"#1a2f4a"}`,borderRadius:7,padding:"3px 9px",fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:12,color:accent?"#4ade80":"#f97316",flexShrink:0,whiteSpace:"nowrap"}}>{h}–{a}</div>;
}
function NumInput({val,onChange}) {
  return <input type="number" min="0" max="30" value={val} onChange={e=>onChange(e.target.value)} style={{width:40,height:30,background:"#060d1a",border:"1.5px solid #1a3554",borderRadius:7,color:"#fff",textAlign:"center",fontSize:14,fontWeight:700,outline:"none",fontFamily:"'DM Mono',monospace"}}/>;
}
function Empty({icon,text}) {
  return <div className="card" style={{textAlign:"center",padding:"36px 24px",color:"#2a4f70"}}><div style={{fontSize:34,marginBottom:10}}>{icon}</div>{text}</div>;
}
