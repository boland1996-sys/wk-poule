export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  // CDN-cache: alle gebruikers delen één opgehaalde versie (max 1 upstream-call per 30s),
  // zodat veel mensen tegelijk op de stand-pagina de API-limiet niet opblazen.
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
  if (req.method === "OPTIONS") return res.status(200).end();

  const key = process.env.RAPIDAPI_KEY;
  if (!key) return res.status(500).json({ error: "RAPIDAPI_KEY not configured" });

  const getDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split("T")[0].replace(/-/g, "");
  };

  // ?days=1 (live, alleen vandaag) of standaard 3 (import van afgelopen dagen).
  const daysParam = parseInt(req.query?.days, 10);
  const numDays = (daysParam >= 1 && daysParam <= 7) ? daysParam : 3;
  const dates = [];
  for (let i = numDays - 1; i >= 0; i--) dates.push(getDate(i));
  let fixtures = [];

  for (const date of dates) {
    const apiRes = await fetch(
      `https://free-api-live-football-data.p.rapidapi.com/football-get-matches-by-date?date=${date}`,
      { headers: { "x-rapidapi-key": key, "x-rapidapi-host": "free-api-live-football-data.p.rapidapi.com" } }
    );
    if (!apiRes.ok) continue;
    const data = await apiRes.json();
    const day = data?.response?.matches || data?.matches || data?.response || [];
    fixtures = fixtures.concat(day);
  }

  const matches = fixtures.map(f => {
    const st = f.status || {};
    // Live minuut zit afhankelijk van de API in liveTime.short / .long.
    const lt = st.liveTime;
    const minute = (lt && (lt.short || lt.long)) || (typeof lt === "string" ? lt : null);
    return {
      id: f.id,
      tournament: "",
      category: "",
      finished: st.finished === true,
      started: st.started === true,
      live: st.started === true && st.finished !== true,
      minute,
      homeTeam: f.home?.name || "",
      awayTeam: f.away?.name || "",
      homeScore: f.home?.score ?? null,
      awayScore: f.away?.score ?? null,
      scoreStr: st.scoreStr || "",
    };
  });

  res.json({ matches });
}
