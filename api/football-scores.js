export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  // CDN-cache: alle gebruikers delen één opgehaalde versie (max 1 upstream-call per 30s).
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
  if (req.method === "OPTIONS") return res.status(200).end();

  const key = process.env.RAPIDAPI_KEY;
  if (!key) return res.status(500).json({ error: "RAPIDAPI_KEY not configured" });

  // Flashscore wil datum als YYYY-MM-DD.
  const getDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split("T")[0];
  };

  // ?days=1 (live, alleen vandaag) of standaard 3 (import van afgelopen dagen).
  const daysParam = parseInt(req.query?.days, 10);
  const numDays = (daysParam >= 1 && daysParam <= 7) ? daysParam : 3;
  const dates = [];
  for (let i = numDays - 1; i >= 0; i--) dates.push(getDate(i));

  let matches = [];
  for (const date of dates) {
    const apiRes = await fetch(
      `https://flashscore4.p.rapidapi.com/api/flashscore/v2/matches/list-by-date?sport_id=1&date=${date}&timezone=Europe%2FBerlin`,
      { headers: { "x-rapidapi-key": key, "x-rapidapi-host": "flashscore4.p.rapidapi.com" } }
    );
    if (!apiRes.ok) {
      if (dates.length === 1) {
        const body = await apiRes.text();
        return res.status(apiRes.status).json({ error: "API error", status: apiRes.status, body });
      }
      continue;
    }
    const data = await apiRes.json();
    const tournaments = Array.isArray(data) ? data : (data?.data || []);
    for (const t of tournaments) {
      for (const m of (t.matches || [])) {
        const st = m.match_status || {};
        matches.push({
          id: m.match_id,
          tournament: t.name || "",
          finished: st.is_finished === true,
          live: st.is_in_progress === true,
          minute: st.live_time,
          homeTeam: m.home_team?.name || "",
          awayTeam: m.away_team?.name || "",
          homeScore: m.scores?.home ?? null,
          awayScore: m.scores?.away ?? null,
          scoreStr: "",
        });
      }
    }
  }

  res.json({ matches });
}
