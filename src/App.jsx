export default function App() {
  return (
    <div className="auth">
      <style>{CSS}</style>

      {/* Achtergrond */}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 0%,rgba(255,107,0,.12),transparent 60%),radial-gradient(ellipse at 100% 100%,rgba(255,179,71,.07),transparent 50%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", top:-60, left:-60, width:300, height:300, borderRadius:"50%", background:"rgba(255,107,0,.04)", filter:"blur(60px)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-80, right:-60, width:350, height:350, borderRadius:"50%", background:"rgba(251,191,36,.04)", filter:"blur(80px)", pointerEvents:"none" }} />

      {/* Vlaggen ticker boven */}
      <div style={{ position:"absolute", top:0, left:0, right:0, overflow:"hidden", height:44, pointerEvents:"none" }}>
        <div style={{ display:"flex", gap:18, animation:"ticker 35s linear infinite", whiteSpace:"nowrap", paddingTop:8 }}>
          {FLAGS.concat(FLAGS).map((f,i) => <span key={i} style={{ fontSize:24, opacity:.35, flexShrink:0 }}>{f}</span>)}
        </div>
      </div>

      {/* Vlaggen ticker onder */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, overflow:"hidden", height:44, pointerEvents:"none" }}>
        <div style={{ display:"flex", gap:18, animation:"ticker2 40s linear infinite", whiteSpace:"nowrap", paddingTop:8 }}>
          {[...FLAGS].reverse().concat([...FLAGS].reverse()).map((f,i) => <span key={i} style={{ fontSize:24, opacity:.25, flexShrink:0 }}>{f}</span>)}
        </div>
      </div>

      <div style={{ width:"100%", maxWidth:400, position:"relative", zIndex:1 }}>

        {/* Hero */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ position:"relative", display:"inline-block", marginBottom:14 }}>
            <div style={{ width:140, height:140, borderRadius:"50%", overflow:"hidden", border:"4px solid #ff6b00", outline:"2px solid #fbbf24", outlineOffset:4, margin:"0 auto", boxShadow:"0 8px 32px rgba(255,107,0,.4)" }}>
              <img src="/gullit.jpg" alt="gullit" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top" }} />
            </div>
            <div style={{ position:"absolute", bottom:2, right:2, background:"linear-gradient(135deg,#ff6b00,#e55f00)", borderRadius:"50%", width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, border:"2px solid #1c1c1e" }}>👑</div>
          </div>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:38, letterSpacing:1, lineHeight:1, color:"var(--t1)" }}>
            WK <span style={{ color:"var(--gr)", textShadow:"0 0 20px rgba(255,107,0,.4)" }}>2026</span>
          </div>
          <div style={{ fontWeight:900, fontSize:13, color:"var(--am)", letterSpacing:3, textTransform:"uppercase", marginTop:6 }}>Boland's Special</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:12 }}>
            <div style={{ background:"rgba(255,107,0,.1)", border:"1px solid rgba(255,107,0,.25)", borderRadius:20, padding:"6px 16px", fontSize:12, color:"var(--gr)", fontWeight:700, display:"flex", alignItems:"center", gap:6 }}>
              👑 Georganiseerd door <span style={{ color:"#fff8ee", fontWeight:900 }}>Ramon Boland</span>
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{ background:"var(--c1)", border:"1px solid rgba(255,107,0,.15)", borderRadius:20, padding:"28px 24px", boxShadow:"0 20px 60px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.03), 0 0 40px rgba(255,107,0,.08)", textAlign:"center" }}>

          {/* Offline melding */}
          <div style={{ fontSize:40, marginBottom:12 }}>🔒</div>
          <div style={{ fontFamily:"'Oswald',sans-serif", fontWeight:700, fontSize:22, color:"var(--t1)", marginBottom:10 }}>
            De site is tijdelijk offline
          </div>
          <div style={{ fontSize:14, color:"var(--t3)", lineHeight:1.6, marginBottom:24 }}>
            Het WK 2026 is afgelopen — bedankt voor het meedoen!<br />
            Inloggen is op dit moment niet mogelijk.
          </div>

          <div style={{ background:"rgba(255,107,0,.08)", border:"1px solid rgba(255,107,0,.2)", borderRadius:12, padding:"14px 18px", fontSize:13, color:"var(--am)", fontWeight:600 }}>
            ✨ Iets nieuws komt eraan...
          </div>
        </div>
      </div>
    </div>
  );
}

const FLAGS = ["🇲🇽","🇿🇦","🇰🇷","🇨🇿","🇨🇦","🇧🇦","🇶🇦","🇨🇭","🇧🇷","🇲🇦","🇭🇹","🏴󠁧󠁢󠁳󠁣󠁴󠁿","🇺🇸","🇵🇾","🇦🇺","🇹🇷","🇩🇪","🇨🇼","🇨🇮","🇪🇨","🇳🇱","🇯🇵","🇸🇪","🇹🇳","🇧🇪","🇪🇬","🇮🇷","🇳🇿","🇪🇸","🇨🇻","🇸🇦","🇺🇾","🇫🇷","🇸🇳","🇮🇶","🇳🇴","🇦🇷","🇩🇿","🇦🇹","🇯🇴","🇵🇹","🇨🇩","🇺🇿","🇨🇴","🏴󠁧󠁢󠁥󠁮󠁧󠁿","🇭🇷","🇬🇭","🇵🇦"];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&family=Oswald:wght@500;600;700&display=swap');
:root {
  --gr:#ff6b00;--gr2:#e55f00;--am:#ffb347;--am2:#ff8c00;
  --re:#f43f5e;--bg:#1c1c1e;--c1:#2c2c2e;--c2:#3a3a3c;
  --bd:#636366;--t1:#f5f5f7;--t2:#aeaeb2;--t3:#8e8e93;
}
html,body { background:var(--bg); font-family:'Figtree',sans-serif; color:var(--t1); min-height:100vh; overflow-x:hidden; margin:0; }
.auth { min-height:100vh; background:var(--bg); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:0 20px; position:relative; overflow:hidden; }
@keyframes ticker  { from{transform:translateX(0)}  to{transform:translateX(-50%)} }
@keyframes ticker2 { from{transform:translateX(-50%)} to{transform:translateX(0)} }
`;
