import { useState, useEffect } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://lhoeabvsnjprmahsnzzh.supabase.co";
const SUPABASE_KEY = "sb_publishable_tbtPN0fnjygO1RcK6tMFxw__4LxEnyq";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const ADMIN = { username: "admin", password: "Admin2026!" };

// ── ALL 48 TEAMS ────────────────────────────────────────────────────────────
const ALL_GROUPS = {
  A: ["🇲🇽 Mexico", "🇿🇦 Zuid-Afrika", "🇰🇷 Zuid-Korea", "🇨🇿 Tsjechië"],
  B: ["🇨🇦 Canada", "🇧🇦 Bosnië-Herzegovina", "🇶🇦 Qatar", "🇨🇭 Zwitserland"],
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

// Generate group matches (each team plays the other 3 teams once)
function generateGroupMatches() {
  const matches = [];
  let id = 1;
  const dates = {
    A: ["11 jun","12 jun","17 jun"],
    B: ["12 jun","13 jun","18 jun"],
    C: ["13 jun","14 jun","19 jun"],
    D: ["14 jun","15 jun","20 jun"],
    E: ["15 jun","16 jun","21 jun"],
    F: ["14 jun","20 jun","26 jun"],
    G: ["16 jun","17 jun","22 jun"],
    H: ["17 jun","18 jun","23 jun"],
    I: ["18 jun","19 jun","24 jun"],
    J: ["19 jun","20 jun","25 jun"],
    K: ["20 jun","21 jun","26 jun"],
    L: ["21 jun","22 jun","27 jun"],
  };
  for (const grp of GROUPS) {
    const teams = ALL_GROUPS[grp];
    const pairs = [[0,1],[2,3],[0,2],[1,3],[0,3],[1,2]];
    pairs.forEach(([a,b], i) => {
      matches.push({
        id, grp, phase:"group",
        home: teams[a], away: teams[b],
        match_date: dates[grp][Math.floor(i/2)],
        home_goals: null, away_goals: null, locked: false
      });
      id++;
    });
  }
  return matches;
}

// Knockout phase template (16 matches R32, 8 R16, 4 QF, 2 SF, 1 F, 1 3P)
const KNOCKOUT_TEMPLATE = [
  // R32 (zestiende finales) - 16 matches
  { id:100, phase:"r32", slot:"R32-1",  label:"W Groep A vs 2e Groep B", match_date:"28 jun" },
  { id:101, phase:"r32", slot:"R32-2",  label:"W Groep C vs 2e Groep D", match_date:"28 jun" },
  { id:102, phase:"r32", slot:"R32-3",  label:"W Groep E vs 2e Groep F", match_date:"29 jun" },
  { id:103, phase:"r32", slot:"R32-4",  label:"W Groep G vs 2e Groep H", match_date:"29 jun" },
  { id:104, phase:"r32", slot:"R32-5",  label:"W Groep I vs 2e Groep J", match_date:"30 jun" },
  { id:105, phase:"r32", slot:"R32-6",  label:"W Groep K vs 2e Groep L", match_date:"30 jun" },
  { id:106, phase:"r32", slot:"R32-7",  label:"W Groep B vs 2e Groep A", match_date:"1 jul" },
  { id:107, phase:"r32", slot:"R32-8",  label:"W Groep D vs 2e Groep C", match_date:"1 jul" },
  { id:108, phase:"r32", slot:"R32-9",  label:"W Groep F vs 2e Groep E", match_date:"2 jul" },
  { id:109, phase:"r32", slot:"R32-10", label:"W Groep H vs 2e Groep G", match_date:"2 jul" },
  { id:110, phase:"r32", slot:"R32-11", label:"W Groep J vs 2e Groep I", match_date:"3 jul" },
  { id:111, phase:"r32", slot:"R32-12", label:"W Groep L vs 2e Groep K", match_date:"3 jul" },
  { id:112, phase:"r32", slot:"R32-13", label:"Beste nr3 #1 vs Beste nr3 #2", match_date:"4 jul" },
  { id:113, phase:"r32", slot:"R32-14", label:"Beste nr3 #3 vs Beste nr3 #4", match_date:"4 jul" },
  { id:114, phase:"r32", slot:"R32-15", label:"Beste nr3 #5 vs Beste nr3 #6", match_date:"5 jul" },
  { id:115, phase:"r32", slot:"R32-16", label:"Beste nr3 #7 vs Beste nr3 #8", match_date:"5 jul" },
  // R16 (achtste finales) - 8 matches
  { id:200, phase:"r16", slot:"R16-1", label:"W R32-1 vs W R32-2",  match_date:"6 jul" },
  { id:201, phase:"r16", slot:"R16-2", label:"W R32-3 vs W R32-4",  match_date:"6 jul" },
  { id:202, phase:"r16", slot:"R16-3", label:"W R32-5 vs W R32-6",  match_date:"7 jul" },
  { id:203, phase:"r16", slot:"R16-4", label:"W R32-7 vs W R32-8",  match_date:"7 jul" },
  { id:204, phase:"r16", slot:"R16-5", label:"W R32-9 vs W R32-10", match_date:"8 jul" },
  { id:205, phase:"r16", slot:"R16-6", label:"W R32-11 vs W R32-12",match_date:"8 jul" },
  { id:206, phase:"r16", slot:"R16-7", label:"W R32-13 vs W R32-14",match_date:"9 jul" },
  { id:207, phase:"r16", slot:"R16-8", label:"W R32-15 vs W R32-16",match_date:"9 jul" },
  // QF
  { id:300, phase:"qf", slot:"QF-1", label:"W R16-1 vs W R16-2", match_date:"10 jul" },
  { id:301, phase:"qf", slot:"QF-2", label:"W R16-3 vs W R16-4", match_date:"10 jul" },
  { id:302, phase:"qf", slot:"QF-3", label:"W R16-5 vs W R16-6", match_date:"11 jul" },
  { id:303, phase:"qf", slot:"QF-4", label:"W R16-7 vs W R16-8", match_date:"11 jul" },
  // SF
  { id:400, phase:"sf", slot:"SF-1", label:"W QF-1 vs W QF-2", match_date:"15 jul" },
  { id:401, phase:"sf", slot:"SF-2", label:"W QF-3 vs W QF-4", match_date:"16 jul" },
  // 3rd place
  { id:500, phase:"3p", slot:"3P", label:"Troostfinale (3e plaats)", match_date:"18 jul" },
  // Final
  { id:501, phase:"final", slot:"FINAL", label:"🏆 FINALE", match_date:"19 jul" },
];

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

function calcBonusPoints(bonusAnswers, bonusResults) {
  if(!bonusResults||!bonusAnswers) return 0;
  let pts=0;
  const qs=["b1","b2","b3","b4"];
  for(const q of qs) {
    const a=bonusAnswers[q], r=bonusResults[q];
    if(a&&r&&a.toString().toLowerCase().trim()===r.toString().toLowerCase().trim()) pts+=5;
  }
  return pts;
}

function groupStandings(matches, group) {
  const gm=matches.filter(m=>m.grp===group&&m.phase==="group");
  const teams=[...new Set(gm.flatMap(m=>[m.home,m.away]))];
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

const PHASE_LABELS = { group:"Groepsfase", r32:"1/16 Finale", r16:"1/8 Finale", qf:"Kwartfinale", sf:"Halve Finale", "3p":"Troostfinale", final:"Finale" };

const css = `
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
  .btn-primary{background:linear-gradient(135deg,#ea580c,#f97316);color:#fff;padding:11px 28px;font-size:14px}
  .btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 24px #f9731644}
  .btn-primary:disabled{opacity:.5;transform:none;cursor:not-allowed}
  .btn-danger{background:#7f1d1d;color:#fca5a5;padding:8px 18px;font-size:13px;border-radius:8px}
  .btn-ghost{background:transparent;border:1.5px solid #1a3554;color:#6b8fa8;padding:9px 18px;font-size:13px;border-radius:10px}
  .btn-ghost:hover{border-color:#f97316;color:#f97316}
  .btn-sm{padding:5px 12px;font-size:12px;border-radius:7px}
  .card{background:#0b1829;border:1px solid #152d4a;border-radius:16px;padding:18px}
  .tab{background:none;border:none;border-bottom:2.5px solid transparent;color:#4a6f8a;padding:11px 12px;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;white-space:nowrap}
  .tab.on{color:#f97316;border-bottom-color:#f97316}
  .tab:hover{color:#dde6f0}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .fu{animation:fadeUp .3s ease both}
  @keyframes spin{to{transform:rotate(360deg)}}
  .spin{animation:spin .8s linear infinite;display:inline-block}
  .phase-header{font-weight:900;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#f97316;padding:12px 0 6px;border-bottom:1px solid #0f2035;margin-bottom:10px}
`;

function Banner() {
  return (
    <div style={{background:"linear-gradient(135deg,#0a1f3a,#0c2210,#0a1f3a)",borderBottom:"2px solid #f9731622",padding:"24px 20px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle at 15% 50%,#f9731610,transparent 50%),radial-gradient(circle at 85% 50%,#16a34a10,transparent 50%)"}}/>
      {[...Array(14)].map((_,i)=><div key={i} style={{position:"absolute",width:2,height:2,borderRadius:"50%",background:"#ffffff12",top:`${8+Math.sin(i*1.4)*42}%`,left:`${3+i*7}%`}}/>)}
      <div style={{maxWidth:860,margin:"0 auto",position:"relative",zIndex:1,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:52,height:52,borderRadius:"50%",background:"linear-gradient(135deg,#fff 45%,#1a1a1a 45%)",border:"3px solid #ffffff33",boxShadow:"0 4px 20px #f9731633",flexShrink:0}}/>
          <div>
            <div style={{fontWeight:900,fontSize:28,letterSpacing:2,lineHeight:1,textTransform:"uppercase"}}>WK <span style={{color:"#f97316"}}>2026</span></div>
            <div style={{fontWeight:900,fontSize:15,color:"#4ade80",letterSpacing:2,textTransform:"uppercase",marginTop:3}}>Dinxperlo Boys</div>
            <div style={{fontSize:10,color:"#2a5070",letterSpacing:2,textTransform:"uppercase",marginTop:2}}>Voorspellingen · Noord-Amerika · 48 teams</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,fontSize:28}}>{"🇺🇸🇲🇽🇨🇦".match(/\p{Emoji_Presentation}/gu)?.map((f,i)=><span key={i} style={{filter:"drop-shadow(0 2px 8px #0008)"}}>{f}</span>)}</div>
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

  const isAdmin = session?.username===ADMIN.username;
  const myPreds = allPreds.filter(p=>p.user_id===session?.id);
  const myBonusAnswers = bonusAnswers.find(b=>b.user_id===session?.id)?.answers||{};
  const showToast=(msg,type="ok")=>{setToast({msg,type});setTimeout(()=>setToast(null),3000);};

  const loadData=async()=>{
    setDataLoading(true);
    const [{data:mData},{data:uData},{data:pData},{data:baData},{data:brData}]=await Promise.all([
      supabase.from("matches").select("*").order("id"),
      supabase.from("users").select("id,username"),
      supabase.from("predictions").select("*"),
      supabase.from("bonus_answers").select("*"),
      supabase.from("bonus_results").select("*").maybeSingle(),
    ]);
    if(mData&&mData.length>0){ setMatches(mData); }
    else {
      // Seed matches into DB
      const groupMatches = generateGroupMatches();
      const koMatches = KNOCKOUT_TEMPLATE.map(t=>({...t, home:null, away:null, home_goals:null, away_goals:null, locked:false}));
      const all=[...groupMatches,...koMatches];
      await supabase.from("matches").upsert(all);
      setMatches(all);
    }
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
    if(username.length<3) return setFormErr("Gebruikersnaam min. 3 tekens.");
    if(password.length<6) return setFormErr("Wachtwoord min. 6 tekens.");
    if(password!==confirmPw) return setFormErr("Wachtwoorden komen niet overeen.");
    if(username.toLowerCase()===ADMIN.username) return setFormErr("Naam niet beschikbaar.");
    setLoading(true);
    const {data:exists}=await supabase.from("users").select("id").ilike("username",username).maybeSingle();
    if(exists){setLoading(false);return setFormErr("Gebruikersnaam al in gebruik.");}
    const {data:newUser,error}=await supabase.from("users").insert({username,pw_hash:hashPw(password)}).select().single();
    setLoading(false);
    if(error||!newUser) return setFormErr("Er ging iets mis.");
    setUsers(us=>[...us,{id:newUser.id,username:newUser.username}]);
    setSession({id:newUser.id,username:newUser.username});
    setFormErr("");setForm({username:"",password:"",confirmPw:""});
    showToast(`Welkom ${username}! 🎉`);
  };

  const savePrediction=async(matchId,homeGoals,awayGoals)=>{
    if(!session?.id) return;
    const existing=allPreds.find(p=>p.user_id===session.id&&p.match_id===matchId);
    if(existing){
      await supabase.from("predictions").update({home_goals:homeGoals,away_goals:awayGoals}).eq("id",existing.id);
      setAllPreds(ps=>ps.map(p=>p.id===existing.id?{...p,home_goals:homeGoals,away_goals:awayGoals}:p));
    }else{
      const {data}=await supabase.from("predictions").insert({user_id:session.id,match_id:matchId,home_goals:homeGoals,away_goals:awayGoals}).select().single();
      if(data) setAllPreds(ps=>[...ps,data]);
    }
    showToast("Voorspelling opgeslagen ✓");
  };

  const setScore=async(id,home,away,homeGoals,awayGoals)=>{
    const upd={home_goals:homeGoals===''?null:homeGoals, away_goals:awayGoals===''?null:awayGoals};
    if(home!==undefined) upd.home=home||null;
    if(away!==undefined) upd.away=away||null;
    await supabase.from("matches").update(upd).eq("id",id);
    setMatches(ms=>ms.map(m=>m.id===id?{...m,...upd}:m));
  };

  const toggleLock=async(id,locked)=>{
    await supabase.from("matches").update({locked:!locked}).eq("id",id);
    setMatches(ms=>ms.map(m=>m.id===id?{...m,locked:!locked}:m));
  };

  const saveBonusAnswer=async(answers)=>{
    if(!session?.id) return;
    const existing=bonusAnswers.find(b=>b.user_id===session.id);
    if(existing){
      await supabase.from("bonus_answers").update({answers}).eq("user_id",session.id);
      setBonusAnswers(bs=>bs.map(b=>b.user_id===session.id?{...b,answers}:b));
    }else{
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
    showToast("Verwijderd.");
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
      {toast&&<div style={{position:"fixed",top:16,right:16,zIndex:999,background:"#1a0f00",border:"1px solid #f97316",borderRadius:12,padding:"12px 20px",fontSize:14,fontWeight:600,color:"#f97316",boxShadow:"0 8px 32px #000a",animation:"fadeUp .3s ease"}}>{toast.msg}</div>}
      <Banner/>
      <header style={{background:"#080f1e",borderBottom:"1px solid #101f35",position:"sticky",top:0,zIndex:50}}>
        <div style={{maxWidth:860,margin:"0 auto",padding:"0 16px",display:"flex",alignItems:"center",justifyContent:"space-between",height:44}}>
          <div style={{fontWeight:900,fontSize:13,letterSpacing:1}}>⚽ <span style={{color:"#f97316"}}>Dinxperlo Boys</span></div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {isAdmin&&<span style={{background:"#0c2a12",color:"#4ade80",border:"1px solid #16a34a44",borderRadius:5,padding:"2px 7px",fontSize:10,fontWeight:700}}>👑 Admin</span>}
            <span style={{fontSize:12,color:"#4a6f8a",fontWeight:600,maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{session.username}</span>
            <button className="btn btn-ghost btn-sm" onClick={()=>{setSession(null);setPage("ranglijst");}}>Uit</button>
          </div>
        </div>
        <div style={{maxWidth:860,margin:"0 auto",padding:"0 8px",display:"flex",overflowX:"auto"}}>
          {tabs.map(t=>(
            <button key={t} className={`tab${page===t?" on":""}`} onClick={()=>setPage(t)}>
              {{"ranglijst":"🏆","wedstrijden":"⚽","knockout":"🥊","standen":"📊","bonus":"🎯","deelnemers":"👥","mijn":"📋"}[t]} {{"ranglijst":"Ranglijst","wedstrijden":"Wedstrijden","knockout":"Knockout","standen":"Standen","bonus":"Bonus","deelnemers":"Deelnemers","mijn":"Mijn Poule"}[t]}
            </button>
          ))}
        </div>
      </header>

      <main style={{maxWidth:860,margin:"0 auto",padding:"18px 12px"}}>

        {/* RANGLIJST */}
        {page==="ranglijst"&&(
          <div className="fu">
            <div style={{marginBottom:16}}>
              <h2 style={{fontWeight:900,fontSize:20}}>🏆 Tussenstand — Dinxperlo Boys</h2>
              <div style={{fontSize:11,color:"#2a4f70",marginTop:3}}>3pt exact · 1pt winnaar · 5pt bonus</div>
            </div>
            {leaderboard.length===0
              ?<Empty icon="👥" text="Nog geen deelnemers aangemeld."/>
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
                        {isMe&&<span style={{background:"#1a0c00",color:"#f97316",border:"1px solid #f9731444",borderRadius:4,padding:"1px 6px",fontSize:10}}>jij</span>}
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
            <div style={{marginBottom:14}}>
              <h2 style={{fontWeight:900,fontSize:20}}>⚽ Groepswedstrijden</h2>
              <div style={{fontSize:11,color:"#2a4f70",marginTop:3}}>{isAdmin?"Klik op een score om te bewerken":"Selecteer een groep en vul je voorspellingen in"}</div>
            </div>
            {/* Group selector */}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
              {GROUPS.map(g=>(
                <button key={g} onClick={()=>setActiveGroup(g)} className="btn btn-sm" style={{background:activeGroup===g?"#f97316":"#0b1829",color:activeGroup===g?"#fff":"#4a6f8a",border:`1px solid ${activeGroup===g?"#f97316":"#1a3554"}`,borderRadius:8,fontWeight:700}}>
                  Groep {g}
                </button>
              ))}
            </div>
            <GroupMatches group={activeGroup} matches={matches} isAdmin={isAdmin} myPreds={myPreds} onSetScore={setScore} onToggleLock={toggleLock} onSavePred={savePrediction}/>
          </div>
        )}

        {/* KNOCKOUT */}
        {page==="knockout"&&(
          <div className="fu">
            <div style={{marginBottom:14}}>
              <h2 style={{fontWeight:900,fontSize:20}}>🥊 Knock-out Fase</h2>
              <div style={{fontSize:11,color:"#2a4f70",marginTop:3}}>{isAdmin?"Vul teams en uitslagen in per ronde":"Voorspel de knockout wedstrijden"}</div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
              {[["r32","1/16"],["r16","1/8"],["qf","Kwart"],["sf","Halve"],["final","Finale"]].map(([k,l])=>(
                <button key={k} onClick={()=>setKnockTab(k)} className="btn btn-sm" style={{background:knockTab===k?"#f97316":"#0b1829",color:knockTab===k?"#fff":"#4a6f8a",border:`1px solid ${knockTab===k?"#f97316":"#1a3554"}`,borderRadius:8,fontWeight:700}}>
                  {l}
                </button>
              ))}
            </div>
            <KnockoutMatches phase={knockTab} matches={matches} isAdmin={isAdmin} myPreds={myPreds} onSetScore={setScore} onToggleLock={toggleLock} onSavePred={savePrediction}/>
          </div>
        )}

        {/* STANDEN */}
        {page==="standen"&&(
          <div className="fu">
            <h2 style={{fontWeight:900,fontSize:20,marginBottom:16}}>📊 Groepsstanden</h2>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
              {GROUPS.map(g=>(
                <button key={g} onClick={()=>setActiveGroup(g)} className="btn btn-sm" style={{background:activeGroup===g?"#f97316":"#0b1829",color:activeGroup===g?"#fff":"#4a6f8a",border:`1px solid ${activeGroup===g?"#f97316":"#1a3554"}`,borderRadius:8,fontWeight:700}}>
                  Groep {g}
                </button>
              ))}
            </div>
            <GroupStanding group={activeGroup} matches={matches}/>
          </div>
        )}

        {/* BONUS */}
        {page==="bonus"&&(
          <div className="fu">
            <div style={{marginBottom:16}}>
              <h2 style={{fontWeight:900,fontSize:20}}>🎯 Bonusvragen</h2>
              <div style={{fontSize:11,color:"#2a4f70",marginTop:3}}>5 punten per goed antwoord!</div>
            </div>
            {isAdmin
              ?<AdminBonus bonusResults={bonusResults} onSave={saveBonusResults}/>
              :<UserBonus myAnswers={myBonusAnswers} bonusResults={bonusResults} onSave={saveBonusAnswer}/>
            }
          </div>
        )}

        {/* MIJN POULE */}
        {page==="mijn"&&!isAdmin&&(
          <div className="fu">
            <div style={{marginBottom:16}}>
              <h2 style={{fontWeight:900,fontSize:20}}>📋 Mijn Poule</h2>
              <div style={{fontSize:11,color:"#2a4f70",marginTop:3}}>{session.username} · {calcMatchPoints(myPreds,matches).pts+calcBonusPoints(myBonusAnswers,bonusResults)} punten</div>
            </div>
            {myPreds.length===0
              ?<Empty icon="🎯" text="Nog geen voorspellingen!"/>
              :myPreds.map(pred=>{
                const m=matches.find(x=>x.id===pred.match_id);
                if(!m) return null;
                const done=m.home_goals!==null;
                let ptLabel="",ptColor="#4a6f8a";
                if(done){
                  const [ph,pa,mh,ma]=[+pred.home_goals,+pred.away_goals,+m.home_goals,+m.away_goals];
                  if(ph===mh&&pa===ma){ptLabel="+3";ptColor="#22c55e";}
                  else{const po=ph>pa?1:ph<pa?-1:0,mo=mh>ma?1:mh<ma?-1:0;ptLabel=po===mo?"+1":"0";ptColor=po===mo?"#fbbf24":"#ef4444";}
                }
                const home=m.home||m.label?.split(" vs ")[0]||"Team 1";
                const away=m.away||m.label?.split(" vs ")[1]||"Team 2";
                return(
                  <div key={pred.match_id} className="card" style={{marginBottom:8,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                    <div style={{flex:1,minWidth:100}}>
                      <div style={{fontSize:12,fontWeight:600}}>{home} <span style={{color:"#2a4f70"}}>vs</span> {away}</div>
                      <div style={{fontSize:10,color:"#2a5070",marginTop:2}}>{PHASE_LABELS[m.phase]||""} · {m.match_date}</div>
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
            <div style={{marginBottom:16}}>
              <h2 style={{fontWeight:900,fontSize:20}}>👥 Deelnemers ({users.length})</h2>
            </div>
            {users.length===0?<Empty icon="👤" text="Nog niemand aangemeld."/>:
              users.map(u=>{
                const preds=allPreds.filter(p=>p.user_id===u.id);
                const {pts,exact}=calcMatchPoints(preds,matches);
                const ba=bonusAnswers.find(b=>b.user_id===u.id)?.answers||{};
                const bpts=calcBonusPoints(ba,bonusResults);
                return(
                  <div key={u.id} className="card" style={{marginBottom:8,display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:34,height:34,borderRadius:"50%",background:"#120c02",border:"2px solid #f9731633",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:"#f97316",flexShrink:0}}>{u.username[0].toUpperCase()}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:14}}>{u.username}</div>
                      <div style={{fontSize:11,color:"#3a6080"}}>{preds.length} voorspellingen · {exact} exact · bonus: {bpts}pt</div>
                    </div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:17,color:"#f97316",flexShrink:0}}>{pts+bpts}<span style={{fontSize:10,color:"#2a4f70"}}> pt</span></div>
                    <button className="btn btn-danger btn-sm" onClick={()=>{if(confirm(`${u.username} verwijderen?`))deleteUser(u.id);}}>✕</button>
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

// ─── GROUP MATCHES ────────────────────────────────────────────────────────
function GroupMatches({group, matches, isAdmin, myPreds, onSetScore, onToggleLock, onSavePred}) {
  const gm = matches.filter(m=>m.grp===group&&m.phase==="group");
  const [editing,   setEditing]   = useState(null);
  const [tempScore, setTempScore] = useState({h:"",a:""});
  const [predEdit,  setPredEdit]  = useState(null);
  const [tempPred,  setTempPred]  = useState({h:"",a:""});
  const [saving,    setSaving]    = useState(false);

  return(
    <div className="card">
      <div className="phase-header">Groep {group} — {ALL_GROUPS[group]?.join(", ")}</div>
      {gm.map(m=>{
        const myPred=myPreds.find(p=>p.match_id===m.id);
        const hasResult=m.home_goals!==null;
        const isEditScore=editing===m.id;
        const isEditPred=predEdit===m.id;
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
              <div style={{flex:1,textAlign:"right",fontSize:12,fontWeight:600,lineHeight:1.3}}>{m.home}</div>
              {isAdmin&&isEditScore?(
                <div style={{display:"flex",gap:5,alignItems:"center",flexShrink:0}}>
                  <NumInput val={tempScore.h} onChange={v=>setTempScore(s=>({...s,h:v}))}/>
                  <span style={{color:"#2a4f70"}}>:</span>
                  <NumInput val={tempScore.a} onChange={v=>setTempScore(s=>({...s,a:v}))}/>
                  <button className="btn btn-primary btn-sm" onClick={async()=>{await onSetScore(m.id,undefined,undefined,tempScore.h,tempScore.a);setEditing(null);}}>✓</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setEditing(null)}>✕</button>
                </div>
              ):(
                <div onClick={()=>{if(isAdmin&&!m.locked){setEditing(m.id);setTempScore({h:m.home_goals??"",a:m.away_goals??""});}}}
                  style={{background:"#060d1a",border:"1.5px solid",borderColor:hasResult?"#1a4a2e":"#1a2f4a",borderRadius:8,padding:"5px 10px",fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:15,color:hasResult?"#4ade80":"#2a4f70",cursor:isAdmin&&!m.locked?"pointer":"default",minWidth:60,textAlign:"center",flexShrink:0}}>
                  {hasResult?`${m.home_goals}-${m.away_goals}`:"?-?"}
                </div>
              )}
              <div style={{flex:1,fontSize:12,fontWeight:600,lineHeight:1.3}}>{m.away}</div>
              {isAdmin&&<button className="btn btn-sm" style={{background:m.locked?"#2d1a00":"#0f2040",border:"1px solid",borderColor:m.locked?"#92400e":"#1a3554",color:m.locked?"#fbbf24":"#4a6f8a",borderRadius:7,fontSize:11,padding:"4px 8px",flexShrink:0}} onClick={()=>onToggleLock(m.id,m.locked)}>{m.locked?"🔒":"🔓"}</button>}
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:6,flexWrap:"wrap",gap:5}}>
              <span style={{fontSize:10,color:"#2a4f70"}}>📅 {m.match_date}{m.locked&&!isAdmin&&<span style={{color:"#92400e",background:"#2d1a00",borderRadius:4,padding:"1px 5px",marginLeft:6}}>🔒</span>}</span>
              {!isAdmin&&(
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {myPred&&hasResult&&<span style={{fontSize:11,fontWeight:700,color:myPts===3?"#22c55e":myPts===1?"#fbbf24":"#ef4444"}}>{myPts===3?"✓+3":myPts===1?"~+1":"✗0"}</span>}
                  {myPred&&!isEditPred&&<ScorePill h={myPred.home_goals} a={myPred.away_goals}/>}
                  {canPredict&&!isEditPred&&<button className="btn btn-ghost btn-sm" onClick={()=>{setPredEdit(m.id);setTempPred({h:myPred?.home_goals??"",a:myPred?.away_goals??""});}}>{myPred?"✏️":"🎯"}</button>}
                </div>
              )}
            </div>
            {!isAdmin&&isEditPred&&(
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,background:"#060d1a",borderRadius:10,padding:"8px 12px",flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:"#4a6f8a",fontWeight:600}}>Jouw score:</span>
                <NumInput val={tempPred.h} onChange={v=>setTempPred(p=>({...p,h:v}))}/>
                <span style={{color:"#2a4f70"}}>–</span>
                <NumInput val={tempPred.a} onChange={v=>setTempPred(p=>({...p,a:v}))}/>
                <button className="btn btn-primary btn-sm" disabled={saving} onClick={async()=>{setSaving(true);await onSavePred(m.id,tempPred.h,tempPred.a);setSaving(false);setPredEdit(null);}}>{saving?"...":"Opslaan"}</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setPredEdit(null)}>✕</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── KNOCKOUT MATCHES ─────────────────────────────────────────────────────
function KnockoutMatches({phase, matches, isAdmin, myPreds, onSetScore, onToggleLock, onSavePred}) {
  const km = matches.filter(m=>m.phase===phase);
  const [editing,   setEditing]   = useState(null);
  const [tempScore, setTempScore] = useState({h:"",a:"",home:"",away:""});
  const [predEdit,  setPredEdit]  = useState(null);
  const [tempPred,  setTempPred]  = useState({h:"",a:""});
  const [saving,    setSaving]    = useState(false);

  if(km.length===0) return <div className="card" style={{textAlign:"center",padding:32,color:"#2a4f70"}}>Nog geen wedstrijden in deze fase.</div>;

  return(
    <div className="card">
      <div className="phase-header">{PHASE_LABELS[phase]}</div>
      {km.map(m=>{
        const myPred=myPreds.find(p=>p.match_id===m.id);
        const hasResult=m.home_goals!==null;
        const hasTeams=m.home&&m.away;
        const isEditScore=editing===m.id;
        const isEditPred=predEdit===m.id;
        const canPredict=!isAdmin&&!m.locked&&hasTeams;
        let myPts=null;
        if(!isAdmin&&myPred&&hasResult){
          const [ph,pa,mh,ma]=[+myPred.home_goals,+myPred.away_goals,+m.home_goals,+m.away_goals];
          if(ph===mh&&pa===ma)myPts=3;
          else{const po=ph>pa?1:ph<pa?-1:0,mo=mh>ma?1:mh<ma?-1:0;myPts=po===mo?1:0;}
        }
        return(
          <div key={m.id} style={{borderBottom:"1px solid #0f2035",paddingBottom:10,marginBottom:10}}>
            {/* Label */}
            <div style={{fontSize:10,color:"#3a6080",marginBottom:6,fontWeight:600}}>{m.label||m.slot} · {m.match_date}</div>
            {isAdmin&&isEditScore?(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <input className="inp" style={{flex:1,minWidth:120}} placeholder="Thuisploeg..." value={tempScore.home} onChange={e=>setTempScore(s=>({...s,home:e.target.value}))}/>
                  <input className="inp" style={{flex:1,minWidth:120}} placeholder="Uitploeg..." value={tempScore.away} onChange={e=>setTempScore(s=>({...s,away:e.target.value}))}/>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{fontSize:12,color:"#4a6f8a"}}>Uitslag:</span>
                  <NumInput val={tempScore.h} onChange={v=>setTempScore(s=>({...s,h:v}))}/>
                  <span style={{color:"#2a4f70"}}>:</span>
                  <NumInput val={tempScore.a} onChange={v=>setTempScore(s=>({...s,a:v}))}/>
                  <button className="btn btn-primary btn-sm" onClick={async()=>{await onSetScore(m.id,tempScore.home,tempScore.away,tempScore.h,tempScore.a);setEditing(null);}}>✓ Opslaan</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setEditing(null)}>✕</button>
                </div>
              </div>
            ):(
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{flex:1,textAlign:"right",fontSize:12,fontWeight:600}}>{m.home||<span style={{color:"#2a4f70",fontStyle:"italic"}}>Nog onbekend</span>}</div>
                <div onClick={()=>{if(isAdmin&&!m.locked){setEditing(m.id);setTempScore({h:m.home_goals??"",a:m.away_goals??"",home:m.home??"",away:m.away??""});}}}
                  style={{background:"#060d1a",border:"1.5px solid",borderColor:hasResult?"#1a4a2e":"#1a2f4a",borderRadius:8,padding:"5px 10px",fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:15,color:hasResult?"#4ade80":"#2a4f70",cursor:isAdmin&&!m.locked?"pointer":"default",minWidth:60,textAlign:"center",flexShrink:0}}>
                  {hasResult?`${m.home_goals}-${m.away_goals}`:"?-?"}
                </div>
                <div style={{flex:1,fontSize:12,fontWeight:600}}>{m.away||<span style={{color:"#2a4f70",fontStyle:"italic"}}>Nog onbekend</span>}</div>
                {isAdmin&&<button className="btn btn-sm" style={{background:m.locked?"#2d1a00":"#0f2040",border:"1px solid",borderColor:m.locked?"#92400e":"#1a3554",color:m.locked?"#fbbf24":"#4a6f8a",borderRadius:7,fontSize:11,padding:"4px 8px",flexShrink:0}} onClick={()=>onToggleLock(m.id,m.locked)}>{m.locked?"🔒":"🔓"}</button>}
              </div>
            )}
            {!isAdmin&&hasTeams&&(
              <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:6,marginTop:6}}>
                {myPred&&hasResult&&<span style={{fontSize:11,fontWeight:700,color:myPts===3?"#22c55e":myPts===1?"#fbbf24":"#ef4444"}}>{myPts===3?"✓+3":myPts===1?"~+1":"✗0"}</span>}
                {myPred&&!isEditPred&&<ScorePill h={myPred.home_goals} a={myPred.away_goals}/>}
                {canPredict&&!isEditPred&&<button className="btn btn-ghost btn-sm" onClick={()=>{setPredEdit(m.id);setTempPred({h:myPred?.home_goals??"",a:myPred?.away_goals??""});}}>{myPred?"✏️":"🎯 Voorspel"}</button>}
              </div>
            )}
            {!isAdmin&&isEditPred&&(
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,background:"#060d1a",borderRadius:10,padding:"8px 12px",flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:"#4a6f8a",fontWeight:600}}>Jouw score:</span>
                <NumInput val={tempPred.h} onChange={v=>setTempPred(p=>({...p,h:v}))}/>
                <span style={{color:"#2a4f70"}}>–</span>
                <NumInput val={tempPred.a} onChange={v=>setTempPred(p=>({...p,a:v}))}/>
                <button className="btn btn-primary btn-sm" disabled={saving} onClick={async()=>{setSaving(true);await onSavePred(m.id,tempPred.h,tempPred.a);setSaving(false);setPredEdit(null);}}>{saving?"...":"Opslaan"}</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setPredEdit(null)}>✕</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GroupStanding({group, matches}) {
  const rows=groupStandings(matches,group);
  return(
    <div className="card">
      <div className="phase-header">Stand Groep {group}</div>
      <div style={{display:"flex",gap:4,fontSize:10,color:"#2a4f70",textTransform:"uppercase",letterSpacing:.8,paddingBottom:6,borderBottom:"1px solid #0f2035",fontWeight:700}}>
        <div style={{flex:1}}>Team</div>
        {["MP","W","G","V","DV","DA","Pnt"].map(h=><div key={h} style={{width:26,textAlign:"center"}}>{h}</div>)}
      </div>
      {rows.map((r,i)=>(
        <div key={r.team} style={{display:"flex",gap:4,alignItems:"center",padding:"7px 0",borderBottom:i<rows.length-1?"1px solid #0b1a2e":"none",fontSize:12}}>
          <div style={{width:16,fontSize:10,color:i<2?"#f97316":"#2a4f70",fontWeight:700}}>{i+1}</div>
          <div style={{flex:1,fontWeight:600,fontSize:12}}>{r.team}</div>
          {[r.mp,r.w,r.d,r.l,r.gf,r.ga].map((v,j)=>(
            <div key={j} style={{width:26,textAlign:"center",color:"#4a6f8a",fontFamily:"'DM Mono',monospace",fontSize:11}}>{v}</div>
          ))}
          <div style={{width:26,textAlign:"center",fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:13,color:i<2?"#f97316":"#dde6f0"}}>{r.pts}</div>
        </div>
      ))}
      <div style={{fontSize:10,color:"#f9731555",marginTop:8}}>🟠 = mogelijk door naar knockout</div>
    </div>
  );
}

const WK_TEAMS_LIST = Object.values(ALL_GROUPS).flat();
const BONUS_QS = [
  {id:"b1",label:"🏆 Wie wordt wereldkampioen?",type:"team"},
  {id:"b2",label:"👟 Wie wordt topscorer?",type:"text"},
  {id:"b3",label:"⚽ Hoeveel goals in de finale?",type:"number"},
  {id:"b4",label:"❌ Welk land valt als eerste uit?",type:"team"},
];

function UserBonus({myAnswers,bonusResults,onSave}) {
  const [answers,setAnswers]=useState(myAnswers||{});
  const [saving,setSaving]=useState(false);
  return(
    <div>
      <div className="card" style={{marginBottom:14,background:"#120c02",border:"1px solid #f9731622"}}>
        <div style={{fontSize:13,color:"#f97316",fontWeight:700,marginBottom:4}}>💡 5 punten per goed antwoord!</div>
        <div style={{fontSize:12,color:"#5a4030"}}>Je kunt antwoorden later nog wijzigen.</div>
      </div>
      {BONUS_QS.map(q=>{
        const result=bonusResults?.[q.id];
        const myAns=answers[q.id]||"";
        const correct=result&&myAns.toString().toLowerCase().trim()===result.toString().toLowerCase().trim();
        return(
          <div key={q.id} className="card" style={{marginBottom:12,border:result?(correct?"1px solid #16a34a55":"1px solid #7f1d1d55"):"1px solid #152d4a"}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <span>{q.label}</span>
              {result&&<span style={{fontSize:12,fontWeight:700,color:correct?"#22c55e":"#ef4444"}}>{correct?"✓ +5 pt":"✗ 0 pt"}</span>}
            </div>
            {q.type==="team"
              ?<select className="sel" value={myAns} onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))}>
                <option value="">— Kies een land —</option>
                {WK_TEAMS_LIST.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              :<input className="inp" type={q.type==="number"?"number":"text"} placeholder={q.type==="number"?"Aantal goals...":"Naam speler..."} value={myAns} onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))}/>
            }
            {result&&<div style={{marginTop:8,fontSize:12,color:"#3a6080"}}>Antwoord: <b style={{color:"#dde6f0"}}>{result}</b></div>}
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
        <div style={{fontSize:12,color:"#3a6050"}}>Punten worden automatisch berekend.</div>
      </div>
      {BONUS_QS.map(q=>(
        <div key={q.id} className="card" style={{marginBottom:12}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:10}}>{q.label}</div>
          {q.type==="team"
            ?<select className="sel" value={results[q.id]||""} onChange={e=>setResults(r=>({...r,[q.id]:e.target.value}))}>
              <option value="">— Kies een land —</option>
              {WK_TEAMS_LIST.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            :<input className="inp" type={q.type==="number"?"number":"text"} placeholder={q.type==="number"?"Aantal goals...":"Naam speler..."} value={results[q.id]||""} onChange={e=>setResults(r=>({...r,[q.id]:e.target.value}))}/>
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
      <div style={{background:"linear-gradient(135deg,#0a1f3a,#0c2210,#0a1f3a)",padding:"40px 20px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle at 20% 50%,#f9731610,transparent 50%),radial-gradient(circle at 80% 50%,#16a34a10,transparent 50%)"}}/>
        {[...Array(16)].map((_,i)=><div key={i} style={{position:"absolute",width:2,height:2,borderRadius:"50%",background:"#ffffff12",top:`${5+Math.sin(i)*45}%`,left:`${i*6.5}%`}}/>)}
        <div style={{position:"relative",zIndex:1}}>
          <div style={{width:60,height:60,borderRadius:"50%",background:"linear-gradient(135deg,#fff 45%,#1a1a1a 45%)",border:"3px solid #ffffff44",margin:"0 auto 14px",boxShadow:"0 4px 24px #f9731644"}}/>
          <div style={{fontWeight:900,fontSize:30,letterSpacing:2,textTransform:"uppercase"}}>WK <span style={{color:"#f97316"}}>2026</span></div>
          <div style={{fontWeight:900,fontSize:17,color:"#4ade80",letterSpacing:2,marginTop:5,textTransform:"uppercase"}}>Dinxperlo Boys</div>
          <div style={{fontSize:10,color:"#2a4f70",letterSpacing:2,textTransform:"uppercase",marginTop:6}}>48 Teams · Voorspellingen · Noord-Amerika</div>
        </div>
      </div>
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
  return <div style={{background:accent?"#0c2e1a":"#060d1a",border:`1px solid ${accent?"#16a34a44":"#1a2f4a"}`,borderRadius:7,padding:"3px 9px",fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:12,color:accent?"#4ade80":"#f97316",flexShrink:0}}>{h}–{a}</div>;
}

function NumInput({val,onChange}) {
  return <input type="number" min="0" max="20" value={val} onChange={e=>onChange(e.target.value)} style={{width:40,height:30,background:"#060d1a",border:"1.5px solid #1a3554",borderRadius:7,color:"#fff",textAlign:"center",fontSize:14,fontWeight:700,outline:"none",fontFamily:"'DM Mono',monospace"}}/>;
}

function Empty({icon,text}) {
  return <div className="card" style={{textAlign:"center",padding:"40px 24px",color:"#2a4f70"}}><div style={{fontSize:36,marginBottom:12}}>{icon}</div>{text}</div>;
}
