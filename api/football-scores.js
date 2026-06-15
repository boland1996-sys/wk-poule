const HOST = "flashscore4.p.rapidapi.com";

// Zet de flashscore-respons (lijst van toernooien met matches) om naar platte lijst.
function flatten(data) {
  const tournaments = Array.isArray(data) ? data : (data?.data || []);
  const out = [];
  for (const t of tournaments) {
    for (const m of (t.matches || [])) {
      const st = m.match_status || {};
      out.push({
        id: m.match_id,
        tournament: t.name || "",
        finished: st.is_finished === true,
        live: st.is_in_progress === true,
        minute: st.live_time,
        stage: st.stage || "",
        homeTeam: m.home_team?.name || "",
        awayTeam: m.away_team?.name || "",
        homeScore: m.scores?.home ?? null,
        awayScore: m.scores?.away ?? null,
        homeRed: m.home_team?.red_cards ?? 0,
        awayRed: m.away_team?.red_cards ?? 0,
        scoreStr: "",
      });
    }
  }
  return out;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const key = process.env.RAPIDAPI_KEY;
  if (!key) return res.status(500).json({ error: "RAPIDAPI_KEY not configured" });
  const headers = { "x-rapidapi-key": key, "x-rapidapi-host": HOST };

  // LIVE-modus (?live=1): klein endpoint met alleen wedstrijden die nu bezig zijn.
  if (req.query?.live === "1") {
    res.setHeader("Cache-Control", "s-maxage=6, stale-while-revalidate=12");
    const apiRes = await fetch(`https://${HOST}/api/flashscore/v2/matches/live?sport_id=1&timezone=Europe%2FBerlin`, { headers });
    if (!apiRes.ok) {
      const body = await apiRes.text();
      return res.status(apiRes.status).json({ error: "API error", status: apiRes.status, body });
    }
    return res.json({ matches: flatten(await apiRes.json()) });
  }

  // IMPORT-modus: wedstrijden per datum (vandaag + afgelopen dagen).
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
  const getDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  };
  const daysParam = parseInt(req.query?.days, 10);
  const numDays = (daysParam >= 1 && daysParam <= 7) ? daysParam : 3;
  const dates = [];
  for (let i = numDays - 1; i >= 0; i--) dates.push(getDate(i));

  let matches = [];
  for (const date of dates) {
    const apiRes = await fetch(
      `https://${HOST}/api/flashscore/v2/matches/list-by-date?sport_id=1&date=${date}&timezone=Europe%2FBerlin`,
      { headers }
    );
    if (!apiRes.ok) {
      if (dates.length === 1) {
        const body = await apiRes.text();
        return res.status(apiRes.status).json({ error: "API error", status: apiRes.status, body });
      }
      continue;
    }
    matches = matches.concat(flatten(await apiRes.json()));
  }

  res.json({ matches });
}
