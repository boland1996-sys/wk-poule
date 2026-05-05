import { useState, useEffect } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://lhoeabvsnjprmahsnzzh.supabase.co";
const SUPABASE_KEY = "sb_publishable_tbtPN0fnjygO1RcK6tMFxw__4LxEnyq";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN = { username: "admin", password: "Admin2026!" };
const GROUPS = ["A","B","C","D"];

function hashPw(pw) { let h = 0; for (let c of pw) h = Math.imul(31,h)+c.charCodeAt(0)|0; return h.toString(36); }

function calcPoints(predictions, matches) {
  let pts=0, exact=0, outcome=0;
  for (const p of predictions) {
    const m = matches.find(x=>x.id===p.match_id);
    if (!m||m.home_goals===null||m.away_goals===null) continue;
    const [ph,pa,mh,ma]=[+p.home_goals,+p.away_goals,+m.home_goals,+m.away_goals];
    if (ph===mh&&pa===ma){pts+=3;exact++;}
    else{const po=ph>pa?1:ph<pa?-1:0,mo=mh>ma?1:mh<ma?-1:0;if(po===mo){pts+=1;outcome++;}}
  }
  return {pts,exact,outcome};
}

function groupStandings(matches, group) {
  const gm = matches.filter(m=>m.grp===group);
  const teams = [...new Set(gm.flatMap(m=>[m.home,m.away]))];
  const stats = Object.fromEntries(teams.map(t=>[t,{pts:0,w:0,d:0,l:0,gf:0,ga:0,mp:0}]));
  for (const m of gm) {
    if (m.home_goals===null) continue;
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

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&family=DM+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{background:#060d1a;font-family:'Outfit',sans-serif;color:#dde6f0;overflow-x:hidden}
  ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#060d1a}::-webkit-scrollbar-thumb{background:#1e4d7b;border-radius:4px}
  input,button,select{font-family:inherit}
  .inp{width:100%;background:#0b1829;border:1.5px solid #1a3554;border-radius:10px;color:#dde6f0;padding:11px 16px;font-size:14px;outline:none;transition:border-color .2s}
  .inp:focus{border-color:#38bdf8}
  .btn{border:none;border-radius:10px;font-weight:700;cursor:pointer;transition:all .18s;letter-spacing:.5px}
  .btn-primary{background:linear-gradient(135deg,#0ea5e9,#38bdf8);color:#fff;padding:11px 28px;font-size:14px}
  .btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 24px #0ea5e966}
  .btn-primary:disabled{opacity:.5;transform:none;cursor:not-allowed}
  .btn-danger{background:#7f1d1d;color:#fca5a5;padding:8px 18px;font-size:13px;border-radius:8px}
  .btn-danger:hover{background:#991b1b}
  .btn-ghost{background:transparent;border:1.5px solid #1a3554;color:#6b8fa8;padding:9px 20px;font-size:13px;border-radius:10px}
  .btn-ghost:hover{border-color:#38bdf8;color:#38bdf8}
  .btn-sm{padding:6px 14px;font-size:12px;border-radius:8px}
  .card{background:#0b1829;border:1px solid #152d4a;border-radius:16px;padding:20px}
  .tab{background:none;border:none;border-bottom:2.5px solid transparent;color:#4a6f8a;padding:12px 16px;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;white-space:nowrap}
  .tab.on{color:#38bdf8;border-bottom-color:#38bdf8}
  .tab:hover{color:#dde6f0}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  .fu{animation:fadeUp .3s ease both}
  @keyframes spin{to{transform:rotate(360deg)}}
  .spin{animation:spin .8s linear infinite;display:inline-block}
`;

export default function App() {
  const [matches,      setMatches]      = useState([]);
  const [users,        setUsers]        = useState([]);
  const [allPreds,     setAllPreds]     = useState([]);
  const [session,      setSession]      = useState(() => { try{return JSON.parse(localStorage.getItem("wkp_session"));}catch{return null;} });
  const [page,         setPage]         = useState("ranglijst");
  const [authMode,     setAuthMode]     = useState("login");
  const [form,         setForm]         = useState({username:"",password:"",confirmPw:""});
  const [formErr,      setFormErr]      = useState("");
  const [loading,      setLoading]      = useState(false);
  const [toast,        setToast]        = useState(null);
  const [dataLoading,  setDataLoading]  = useState(true);

  const isAdmin = session?.username === ADMIN.username;
  const currentUser = isAdmin ? null : users.find(u=>u.id===session?.id);
  const myPreds = allPreds.filter(p=>p.user_id===session?.id);

  const showToast = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  // ── Load all data ──
  const loadData = async () => {
    setDataLoading(true);
    const [{ data: mData }, { data: uData }, { data: pData }] = await Promise.all([
      supabase.from("matches").select("*").order("id"),
      supabase.from("users").select("id,username,created_at"),
      supabase.from("predictions").select("*"),
    ]);
    if (mData) setMatches(mData);
    if (uData) setUsers(uData);
    if (pData) setAllPreds(pData);
    setDataLoading(false);
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { try{localStorage.setItem("wkp_session",JSON.stringify(session));}catch{} }, [session]);

  // ── AUTH ──
  const handleLogin = async () => {
    const {username, password} = form;
    if (!username||!password) return setFormErr("Vul alles in.");
    if (username.toLowerCase()===ADMIN.username&&password===ADMIN.password) {
      setSession({username:ADMIN.username,isAdmin:true});
      setFormErr(""); setForm({username:"",password:"",confirmPw:""});
      return;
    }
    setLoading(true);
    const {data} = await supabase.from("users").select("*").ilike("username",username).single();
    setLoading(false);
    if (!data||data.pw_hash!==hashPw(password)) return setFormErr("Gebruikersnaam of wachtwoord klopt niet.");
    setSession({id:data.id,username:data.username});
    setFormErr(""); setForm({username:"",password:"",confirmPw:""});
  };

  const handleRegister = async () => {
    const {username, password, confirmPw} = form;
    if (!username||!password||!confirmPw) return setFormErr("Vul alles in.");
    if (username.length<3) return setFormErr("Gebruikersnaam min. 3 tekens.");
    if (password.length<6) return setFormErr("Wachtwoord min. 6 tekens.");
    if (password!==confirmPw) return setFormErr("Wachtwoorden komen niet overeen.");
    if (username.toLowerCase()===ADMIN.username) return setFormErr("Deze naam is niet beschikbaar.");
    setLoading(true);
    const {data:exists} = await supabase.from("users").select("id").ilike("username",username).single();
    if (exists) { setLoading(false); return setFormErr("Gebruikersnaam al in gebruik."); }
    const {data:newUser, error} = await supabase.from("users").insert({username,pw_hash:hashPw(password)}).select().single();
    setLoading(false);
    if (error||!newUser) return setFormErr("Er ging iets mis. Probeer opnieuw.");
    setUsers(us=>[...us,{id:newUser.id,username:newUser.username}]);
    setSession({id:newUser.id,username:newUser.username});
    setFormErr(""); setForm({username:"",password:"",confirmPw:""});
    showToast(`Welkom ${username}! 🎉`);
  };

  // ── PREDICTIONS ──
  const savePrediction = async (matchId, homeGoals, awayGoals) => {
    if (!session?.id) return;
    const existing = allPreds.find(p=>p.user_id===session.id&&p.match_id===matchId);
    if (existing) {
      await supabase.from("predictions").update({home_goals:homeGoals,away_goals:awayGoals}).eq("id",existing.id);
      setAllPreds(ps=>ps.map(p=>p.id===existing.id?{...p,home_goals:homeGoals,away_goals:awayGoals}:p));
    } else {
      const {data} = await supabase.from("predictions").insert({user_id:session.id,match_id:matchId,home_goals:homeGoals,away_goals:awayGoals}).select().single();
      if (data) setAllPreds(ps=>[...ps,data]);
    }
    showToast("Voorspelling opgeslagen ✓");
  };

  // ── ADMIN: score ──
  const setScore = async (id, homeGoals, awayGoals) => {
    await supabase.from("matches").update({home_goals:homeGoals===''?null:homeGoals, away_goals:awayGoals===''?null:awayGoals}).eq("id",id);
    setMatches(ms=>ms.map(m=>m.id===id?{...m,home_goals:homeGoals===''?null:homeGoals,away_goals:awayGoals===''?null:awayGoals}:m));
  };

  const toggleLock = async (id, locked) => {
    await supabase.from("matches").update({locked:!locked}).eq("id",id);
    setMatches(ms=>ms.map(m=>m.id===id?{...m,locked:!locked}:m));
  };

  const deleteUser = async (uid) => {
    await supabase.from("users").delete().eq("id",uid);
    setUsers(us=>us.filter(u=>u.id!==uid));
    setAllPreds(ps=>ps.filter(p=>p.user_id!==uid));
    showToast("Deelnemer verwijderd.");
  };

  // ── LEADERBOARD ──
  const leaderboard = [...users].map(u=>{
    const preds = allPreds.filter(p=>p.user_id===u.id);
    const {pts,exact,outcome} = calcPoints(preds,matches);
    return {...u,pts,exact,outcome,predCount:preds.length};
  }).sort((a,b)=>b.pts-a.pts||b.exact-a.exact);

  if (!session) return <AuthPage authMode={authMode} setAuthMode={setAuthMode} form={form} setForm={setForm} formErr={formErr} loading={loading} onLogin={handleLogin} onRegister={handleRegister} />;

  if (dataLoading) return (
    <div style={{minHeight:"100vh",background:"#060d1a",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <style>{css}</style>
      <div className="spin" style={{fontSize:32}}>⚽</div>
      <div style={{color:"#2a4f70",fontSize:14}}>Data laden...</div>
    </div>
  );

  const tabs = isAdmin
    ? ["ranglijst","wedstrijden","standen","deelnemers"]
    : ["ranglijst","wedstrijden","standen","mijn"];

  return (
    <div style={{minHeight:"100vh",background:"#060d1a"}}>
      <style>{css}</style>

      {toast && (
        <div style={{position:"fixed",top:16,right:16,zIndex:999,background:toast.type==="ok"?"#0f2e4a":"#3b0a0a",border:`1px solid ${toast.type==="ok"?"#38bdf8":"#dc2626"}`,borderRadius:12,padding:"12px 20px",fontSize:14,fontWeight:600,color:toast.type==="ok"?"#38bdf8":"#fca5a5",boxShadow:"0 8px 32px #000a",animation:"fadeUp .3s ease"}}>
          {toast.msg}
        </div>
      )}

      <header style={{background:"#080f1e",borderBottom:"1px solid #101f35",position:"sticky",top:0,zIndex:50}}>
        <div style={{maxWidth:860,margin:"0 auto",padding:"0 16px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>⚽</span>
            <div>
              <div style={{fontWeight:900,fontSize:16,letterSpacing:.5,lineHeight:1.1}}>WK <span style={{color:"#38bdf8"}}>POULE</span> 2026</div>
              <div style={{fontSize:9,color:"#1e3a55",letterSpacing:1.5,textTransform:"uppercase"}}>Noord-Amerika</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {isAdmin && <span style={{background:"#0c2a12",color:"#4ade80",border:"1px solid #16a34a44",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700}}>👑 Admin</span>}
            <span style={{fontSize:12,color:"#4a6f8a",fontWeight:600,maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{session.username}</span>
            <button className="btn btn-ghost btn-sm" onClick={()=>{setSession(null);setPage("ranglijst");}}>Uit</button>
          </div>
        </div>
        <div style={{maxWidth:860,margin:"0 auto",padding:"0 8px",display:"flex",overflowX:"auto",gap:0}}>
          {tabs.map(t=>(
            <button key={t} className={`tab${page===t?" on":""}`} onClick={()=>setPage(t)}>
              {{"ranglijst":"🏆 Ranglijst","wedstrijden":"⚽ Wedstrijden","standen":"📊 Standen","deelnemers":"👥 Deelnemers","mijn":"📋 Mijn Poule"}[t]}
            </button>
          ))}
        </div>
      </header>

      <main style={{maxWidth:860,margin:"0 auto",padding:"20px 12px"}}>

        {/* RANGLIJST */}
        {page==="ranglijst" && (
          <div className="fu">
            <div style={{marginBottom:18}}>
              <h2 style={{fontWeight:900,fontSize:20,display:"flex",alignItems:"center",gap:8}}>🏆 Tussenstand</h2>
              <div style={{fontSize:11,color:"#2a4f70",marginTop:3}}>3 pt = exacte uitslag · 1 pt = juiste winnaar</div>
            </div>
            {leaderboard.length===0
              ? <div className="card" style={{textAlign:"center",padding:48,color:"#2a4f70"}}><div style={{fontSize:36,marginBottom:12}}>👥</div>Nog geen deelnemers aangemeld.</div>
              : leaderboard.map((u,i)=>{
                const isMe = u.id===session?.id;
                const medals=["🥇","🥈","🥉"],mc=["#fbbf24","#94a3b8","#cd7f32"];
                return (
                  <div key={u.id} className="card fu" style={{marginBottom:8,display:"flex",alignItems:"center",gap:12,border:isMe?"1px solid #38bdf855":"1px solid #152d4a",background:isMe?"#0d1f38":"#0b1829",animationDelay:`${i*35}ms`}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:i<3?mc[i]+"22":"#0f2440",border:`2px solid ${i<3?mc[i]+"66":"#1a3554"}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:i<3?18:13,color:i<3?mc[i]:"#4a6f8a",flexShrink:0}}>
                      {i<3?medals[i]:i+1}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                        {u.username}
                        {isMe&&<span style={{background:"#0c2440",color:"#38bdf8",border:"1px solid #38bdf844",borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:700}}>jij</span>}
                      </div>
                      <div style={{fontSize:11,color:"#3a6080",marginTop:1}}>{u.exact} exact · {u.outcome} winnaar · {u.predCount} voorspellingen</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:24,color:i===0?"#fbbf24":i===1?"#94a3b8":i===2?"#cd7f32":"#38bdf8"}}>{u.pts}</div>
                      <div style={{fontSize:10,color:"#2a4f70"}}>punten</div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}

        {/* WEDSTRIJDEN */}
        {page==="wedstrijden" && (
          <div className="fu">
            <div style={{marginBottom:18}}>
              <h2 style={{fontWeight:900,fontSize:20}}>⚽ Wedstrijden</h2>
              <div style={{fontSize:11,color:"#2a4f70",marginTop:3}}>{isAdmin?"Stel uitslagen in en vergrendel wedstrijden":"Vul je voorspellingen in vóór de wedstrijd"}</div>
            </div>
            {GROUPS.map(g=>(
              <GroupMatches key={g} group={g} matches={matches} isAdmin={isAdmin}
                myPreds={myPreds} allPreds={allPreds}
                onSetScore={setScore} onToggleLock={toggleLock} onSavePred={savePrediction}
                sessionId={session?.id} />
            ))}
          </div>
        )}

        {/* STANDEN */}
        {page==="standen" && (
          <div className="fu">
            <h2 style={{fontWeight:900,fontSize:20,marginBottom:18}}>📊 Groepsstanden</h2>
            {GROUPS.map(g=><GroupStanding key={g} group={g} matches={matches}/>)}
          </div>
        )}

        {/* MIJN POULE */}
        {page==="mijn" && !isAdmin && (
          <div className="fu">
            <div style={{marginBottom:18}}>
              <h2 style={{fontWeight:900,fontSize:20}}>📋 Mijn Poule</h2>
              <div style={{fontSize:11,color:"#2a4f70",marginTop:3}}>{currentUser?.username} · {calcPoints(myPreds,matches).pts} punten</div>
            </div>
            {myPreds.length===0
              ? <div className="card" style={{textAlign:"center",padding:48,color:"#2a4f70"}}><div style={{fontSize:36,marginBottom:12}}>🎯</div>Nog geen voorspellingen. Ga naar Wedstrijden!</div>
              : myPreds.map(pred=>{
                const m=matches.find(x=>x.id===pred.match_id);
                if(!m)return null;
                const done=m.home_goals!==null;
                let ptLabel="",ptColor="#4a6f8a";
                if(done){
                  const [ph,pa,mh,ma]=[+pred.home_goals,+pred.away_goals,+m.home_goals,+m.away_goals];
                  if(ph===mh&&pa===ma){ptLabel="+3";ptColor="#22c55e";}
                  else{const po=ph>pa?1:ph<pa?-1:0,mo=mh>ma?1:mh<ma?-1:0;ptLabel=po===mo?"+1":"0";ptColor=po===mo?"#fbbf24":"#ef4444";}
                }
                return (
                  <div key={pred.match_id} className="card" style={{marginBottom:8,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                    <div style={{flex:1,minWidth:120}}>
                      <div style={{fontSize:13,fontWeight:600}}>{m.home} <span style={{color:"#2a4f70"}}>vs</span> {m.away}</div>
                      <div style={{fontSize:11,color:"#2a5070",marginTop:2}}>Groep {m.grp} · {m.match_date}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <ScorePill h={pred.home_goals} a={pred.away_goals}/>
                      {done&&<><span style={{color:"#1a3554"}}>→</span><ScorePill h={m.home_goals} a={m.away_goals} accent/></>}
                      {done&&<span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:15,color:ptColor,minWidth:28,textAlign:"right"}}>{ptLabel}</span>}
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}

        {/* DEELNEMERS (admin) */}
        {page==="deelnemers" && isAdmin && (
          <div className="fu">
            <div style={{marginBottom:18}}>
              <h2 style={{fontWeight:900,fontSize:20}}>👥 Deelnemers</h2>
              <div style={{fontSize:11,color:"#2a4f70",marginTop:3}}>{users.length} deelnemers aangemeld</div>
            </div>
            {users.length===0
              ? <div className="card" style={{textAlign:"center",padding:48,color:"#2a4f70"}}><div style={{fontSize:36,marginBottom:12}}>👤</div>Nog niemand aangemeld.</div>
              : users.map(u=>{
                const preds=allPreds.filter(p=>p.user_id===u.id);
                const {pts,exact,outcome}=calcPoints(preds,matches);
                return (
                  <div key={u.id} className="card" style={{marginBottom:8,display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:"#0f2440",border:"2px solid #1a3554",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:15,color:"#38bdf8",flexShrink:0}}>
                      {u.username[0].toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:14}}>{u.username}</div>
                      <div style={{fontSize:11,color:"#3a6080"}}>{preds.length} voorspellingen · {exact} exact · {outcome} winnaar</div>
                    </div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:18,color:"#38bdf8",flexShrink:0}}>{pts} <span style={{fontSize:10,color:"#2a4f70"}}>pt</span></div>
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

function GroupMatches({group,matches,isAdmin,myPreds,onSetScore,onToggleLock,onSavePred,sessionId}) {
  const gm = matches.filter(m=>m.grp===group);
  const [editing,   setEditing]   = useState(null);
  const [tempScore, setTempScore] = useState({h:"",a:""});
  const [predEdit,  setPredEdit]  = useState(null);
  const [tempPred,  setTempPred]  = useState({h:"",a:""});
  const [saving,    setSaving]    = useState(false);

  return (
    <div className="card" style={{marginBottom:14}}>
      <div style={{fontWeight:900,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#38bdf8",marginBottom:14}}>Groep {group}</div>
      {gm.map(m=>{
        const myPred=myPreds.find(p=>p.match_id===m.id);
        const hasResult=m.home_goals!==null;
        const isEditingScore=editing===m.id;
        const isEditingPred=predEdit===m.id;
        const canPredict=!isAdmin&&!m.locked;
        let myPts=null;
        if(!isAdmin&&myPred&&hasResult){
          const [ph,pa,mh,ma]=[+myPred.home_goals,+myPred.away_goals,+m.home_goals,+m.away_goals];
          if(ph===mh&&pa===ma)myPts=3;
          else{const po=ph>pa?1:ph<pa?-1:0,mo=mh>ma?1:mh<ma?-1:0;myPts=po===mo?1:0;}
        }
        return (
          <div key={m.id} style={{borderBottom:"1px solid #0f2035",paddingBottom:10,marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{flex:1,textAlign:"right",fontSize:12,fontWeight:600,lineHeight:1.3}}>{m.home}</div>
              {isAdmin&&isEditingScore?(
                <div style={{display:"flex",gap:5,alignItems:"center",flexShrink:0}}>
                  <NumInput val={tempScore.h} onChange={v=>setTempScore(s=>({...s,h:v}))}/>
                  <span style={{color:"#2a4f70"}}>:</span>
                  <NumInput val={tempScore.a} onChange={v=>setTempScore(s=>({...s,a:v}))}/>
                  <button className="btn btn-primary btn-sm" onClick={async()=>{await onSetScore(m.id,tempScore.h,tempScore.a);setEditing(null);}}>✓</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setEditing(null)}>✕</button>
                </div>
              ):(
                <div onClick={()=>{if(isAdmin&&!m.locked){setEditing(m.id);setTempScore({h:m.home_goals??"",a:m.away_goals??""});}}}
                  style={{background:"#060d1a",border:"1.5px solid",borderColor:hasResult?"#1a4a2e":"#1a2f4a",borderRadius:8,padding:"5px 12px",fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:16,color:hasResult?"#4ade80":"#2a4f70",cursor:isAdmin&&!m.locked?"pointer":"default",minWidth:64,textAlign:"center",flexShrink:0}}>
                  {hasResult?`${m.home_goals} - ${m.away_goals}`:"? - ?"}
                </div>
              )}
              <div style={{flex:1,fontSize:12,fontWeight:600,lineHeight:1.3}}>{m.away}</div>
              {isAdmin&&(
                <button className="btn btn-sm" style={{background:m.locked?"#2d1a00":"#0f2040",border:"1px solid",borderColor:m.locked?"#92400e":"#1a3554",color:m.locked?"#fbbf24":"#4a6f8a",borderRadius:7,fontSize:11,padding:"4px 10px",flexShrink:0}} onClick={()=>onToggleLock(m.id,m.locked)}>
                  {m.locked?"🔒":"🔓"}
                </button>
              )}
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:7,flexWrap:"wrap",gap:6}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:10,color:"#2a4f70"}}>📅 {m.match_date}</span>
                {m.locked&&!isAdmin&&<span style={{fontSize:10,color:"#92400e",background:"#2d1a00",borderRadius:4,padding:"2px 6px"}}>🔒 Vergrendeld</span>}
              </div>
              {!isAdmin&&(
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  {myPred&&hasResult&&<span style={{fontSize:11,fontWeight:700,color:myPts===3?"#22c55e":myPts===1?"#fbbf24":"#ef4444"}}>{myPts===3?"✓ +3":myPts===1?"~ +1":"✗ 0"}</span>}
                  {myPred&&!isEditingPred&&<ScorePill h={myPred.home_goals} a={myPred.away_goals}/>}
                  {canPredict&&!isEditingPred&&(
                    <button className="btn btn-ghost btn-sm" onClick={()=>{setPredEdit(m.id);setTempPred({h:myPred?.home_goals??"",a:myPred?.away_goals??""});}}>
                      {myPred?"✏️":"🎯 Voorspel"}
                    </button>
                  )}
                </div>
              )}
            </div>
            {!isAdmin&&isEditingPred&&(
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10,background:"#060d1a",borderRadius:10,padding:"10px 12px",flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:"#4a6f8a",fontWeight:600}}>Voorspelling:</span>
                <NumInput val={tempPred.h} onChange={v=>setTempPred(p=>({...p,h:v}))}/>
                <span style={{color:"#2a4f70"}}>–</span>
                <NumInput val={tempPred.a} onChange={v=>setTempPred(p=>({...p,a:v}))}/>
                <button className="btn btn-primary btn-sm" disabled={saving} onClick={async()=>{setSaving(true);await onSavePred(m.id,tempPred.h,tempPred.a);setSaving(false);setPredEdit(null);}}>
                  {saving?"...":"Opslaan"}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setPredEdit(null)}>✕</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GroupStanding({group,matches}) {
  const rows=groupStandings(matches,group);
  return (
    <div className="card" style={{marginBottom:14}}>
      <div style={{fontWeight:900,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#38bdf8",marginBottom:12}}>Groep {group}</div>
      <div style={{display:"flex",gap:4,fontSize:10,color:"#2a4f70",textTransform:"uppercase",letterSpacing:.8,paddingBottom:6,borderBottom:"1px solid #0f2035",fontWeight:700}}>
        <div style={{flex:1}}>Team</div>
        {["MP","W","G","V","DV","DA","Pnt"].map(h=><div key={h} style={{width:26,textAlign:"center"}}>{h}</div>)}
      </div>
      {rows.map((r,i)=>(
        <div key={r.team} style={{display:"flex",gap:4,alignItems:"center",padding:"7px 0",borderBottom:i<rows.length-1?"1px solid #0b1a2e":"none",fontSize:12}}>
          <div style={{width:16,fontSize:10,color:i<2?"#38bdf8":"#2a4f70",fontWeight:700}}>{i+1}</div>
          <div style={{flex:1,fontWeight:600,fontSize:12}}>{r.team}</div>
          {[r.mp,r.w,r.d,r.l,r.gf,r.ga].map((v,j)=>(
            <div key={j} style={{width:26,textAlign:"center",color:"#4a6f8a",fontFamily:"'DM Mono',monospace",fontSize:11}}>{v}</div>
          ))}
          <div style={{width:26,textAlign:"center",fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:13,color:i<2?"#38bdf8":"#dde6f0"}}>{r.pts}</div>
        </div>
      ))}
    </div>
  );
}

function AuthPage({authMode,setAuthMode,form,setForm,formErr,loading,onLogin,onRegister}) {
  const f=(k)=>(e)=>setForm(x=>({...x,[k]:e.target.value}));
  return (
    <div style={{minHeight:"100vh",background:"#060d1a",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <style>{css}</style>
      <div style={{position:"fixed",inset:0,backgroundImage:"linear-gradient(#0d2a4a18 1px,transparent 1px),linear-gradient(90deg,#0d2a4a18 1px,transparent 1px)",backgroundSize:"36px 36px",pointerEvents:"none"}}/>
      <div style={{width:"100%",maxWidth:380,position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:48,marginBottom:8}}>⚽</div>
          <div style={{fontWeight:900,fontSize:28,letterSpacing:1}}>WK POULE <span style={{color:"#38bdf8"}}>2026</span></div>
          <div style={{fontSize:11,color:"#2a4f70",letterSpacing:2,textTransform:"uppercase",marginTop:4}}>Meedoen met vrienden</div>
        </div>
        <div className="card fu">
          <div style={{display:"flex",background:"#060d1a",borderRadius:10,padding:3,marginBottom:20,gap:3}}>
            {["login","register"].map(m=>(
              <button key={m} onClick={()=>setAuthMode(m)} style={{flex:1,border:"none",borderRadius:8,padding:"9px 0",fontWeight:700,fontSize:13,cursor:"pointer",transition:"all .2s",background:authMode===m?"#0d2a48":"transparent",color:authMode===m?"#38bdf8":"#3a6080"}}>
                {m==="login"?"Inloggen":"Account aanmaken"}
              </button>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
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
          <div style={{marginTop:16,textAlign:"center",fontSize:12,color:"#2a4f70"}}>
            {authMode==="login"?"Nog geen account? ":"Al een account? "}
            <button onClick={()=>setAuthMode(authMode==="login"?"register":"login")} style={{background:"none",border:"none",color:"#38bdf8",cursor:"pointer",fontWeight:700,fontSize:12}}>
              {authMode==="login"?"Aanmaken":"Inloggen"}
            </button>
          </div>
        </div>
        <div style={{textAlign:"center",marginTop:14,fontSize:10,color:"#1a3554"}}>
          Admin: gebruikersnaam <b style={{color:"#2a5070"}}>admin</b> · wachtwoord <b style={{color:"#2a5070"}}>Admin2026!</b>
        </div>
      </div>
    </div>
  );
}

function ScorePill({h,a,accent}) {
  return (
    <div style={{background:accent?"#0c2e1a":"#060d1a",border:`1px solid ${accent?"#16a34a44":"#1a2f4a"}`,borderRadius:7,padding:"3px 10px",fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:13,color:accent?"#4ade80":"#38bdf8",flexShrink:0}}>
      {h} – {a}
    </div>
  );
}

function NumInput({val,onChange}) {
  return (
    <input type="number" min="0" max="20" value={val} onChange={e=>onChange(e.target.value)}
      style={{width:42,height:32,background:"#060d1a",border:"1.5px solid #1a3554",borderRadius:7,color:"#fff",textAlign:"center",fontSize:15,fontWeight:700,outline:"none",fontFamily:"'DM Mono',monospace"}}/>
  );
}
