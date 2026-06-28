// Server-side import: haalt afgelopen WK-uitslagen op en schrijft ze naar Supabase.
// Wordt periodiek aangeroepen door een externe planner (bv. GitHub Actions) zodat het
// ook draait als niemand de app open heeft. Beveiligd met een geheim token.

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

export default async function handler(req, res) {
  // Beveiliging: alleen met juist token (voorkomt misbruik van je API-quota).
  const secret = process.env.CRON_SECRET;
  const provided = req.query.secret || (req.headers.authorization || "").replace("Bearer ", "");
  if (!secret || provided !== secret) return res.status(401).json({ error: "unauthorized" });

  const rapidKey = process.env.RAPIDAPI_KEY;
  const supaUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supaKey = process.env.VITE_SUPABASE_KEY || process.env.SUPABASE_KEY;
  if (!rapidKey || !supaUrl || !supaKey) return res.status(500).json({ error: "env vars ontbreken" });

  // 1. Uitslagen ophalen via flashscore (vandaag + gisteren, voor nachtwedstrijden).
  const getDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split("T")[0];
  };
  let fixtures = [];
  for (const date of [getDate(1), getDate(0)]) {
    const r = await fetch(
      `https://flashscore4.p.rapidapi.com/api/flashscore/v2/matches/list-by-date?sport_id=1&date=${date}&timezone=Europe%2FBerlin`,
      { headers: { "x-rapidapi-key": rapidKey, "x-rapidapi-host": "flashscore4.p.rapidapi.com" } }
    );
    if (!r.ok) continue;
    const d = await r.json();
    const tournaments = Array.isArray(d) ? d : (d?.data || []);
    for (const t of tournaments) for (const m of (t.matches || [])) fixtures.push(m);
  }

  // 2. Wedstrijden zonder uitslag uit Supabase halen.
  const sbHeaders = { apikey: supaKey, authorization: `Bearer ${supaKey}`, "content-type": "application/json" };
  const mRes = await fetch(`${supaUrl}/rest/v1/matches?home_goals=is.null&select=id,home,away`, { headers: sbHeaders });
  if (!mRes.ok) return res.status(500).json({ error: "Supabase lezen mislukt", status: mRes.status });
  const dbMatches = await mRes.json();

  // 3. Matchen en wegschrijven.
  let updated = 0;
  const log = [];
  for (const f of fixtures) {
    if (f.match_status?.is_finished !== true) continue;
    // Op penalty's beslist: API geeft alleen de gelijke stand na verlenging
    // (geen penalty-uitslag/winnaar). Niet auto-importeren — admin vult zelf in.
    if (f.match_status?.is_finished_after_penalties === true) continue;
    const nlHome = TEAM_MAP[f.home_team?.name], nlAway = TEAM_MAP[f.away_team?.name];
    if (!nlHome || !nlAway) continue;
    const hg = f.scores?.home, ag = f.scores?.away;
    if (hg == null || ag == null) continue;
    const match = dbMatches.find(m => m.home?.includes(nlHome) && m.away?.includes(nlAway));
    if (!match) continue;
    const up = await fetch(`${supaUrl}/rest/v1/matches?id=eq.${match.id}`, {
      method: "PATCH",
      headers: { ...sbHeaders, Prefer: "return=minimal" },
      body: JSON.stringify({ home_goals: hg, away_goals: ag }),
    });
    if (up.ok) { updated++; log.push(`${nlHome} ${hg}-${ag} ${nlAway}`); }
  }

  // 4. Tegenstanders volgende KO-ronde invullen. Kost GEEN flashscore-calls
  //    (alleen Supabase). Draait elke run, dus ook als de admin offline is.
  //    "Winnaar duel N"/"Verliezer duel N" wordt het echte team zodra duel N
  //    een duidelijke winnaar heeft (gelijkspel/penalty's → admin vult zelf in).
  let filled = 0;
  const isPlaceholder = (n) => !n || /^(Winnaar|Verliezer|1e Groep|2e Groep|Beste nr|Nummer)/.test(n);
  const koRes = await fetch(`${supaUrl}/rest/v1/matches?phase=neq.group&select=id,home,away,home_goals,away_goals`, { headers: sbHeaders });
  if (koRes.ok) {
    const ko = await koRes.json();
    const byId = new Map(ko.map(m => [m.id, m]));
    for (const m of ko) {
      for (const col of ["home", "away"]) {
        const val = m[col];
        const win = /^Winnaar duel (\d+)$/.exec(val || "");
        const los = /^Verliezer duel (\d+)$/.exec(val || "");
        const mt = win || los;
        if (!mt) continue;
        const src = byId.get(parseInt(mt[1], 10));
        if (!src) continue;
        if (src.home_goals == null || src.away_goals == null) continue;
        if (src.home_goals === src.away_goals) continue; // winnaar onbekend
        if (isPlaceholder(src.home) || isPlaceholder(src.away)) continue;
        const winner = src.home_goals > src.away_goals ? src.home : src.away;
        const loser  = src.home_goals > src.away_goals ? src.away : src.home;
        const desired = win ? winner : loser;
        if (!desired || desired === val) continue;
        const up = await fetch(`${supaUrl}/rest/v1/matches?id=eq.${m.id}`, {
          method: "PATCH",
          headers: { ...sbHeaders, Prefer: "return=minimal" },
          body: JSON.stringify({ [col]: desired }),
        });
        if (up.ok) { filled++; byId.set(m.id, { ...m, [col]: desired }); log.push(`→ ${val} = ${desired}`); }
      }
    }
  }

  res.json({ ok: true, updated, filled, log });
}
