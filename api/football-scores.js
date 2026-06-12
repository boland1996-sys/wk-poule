export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const key = process.env.RAPIDAPI_KEY;
  if (!key) return res.status(500).json({ error: "RAPIDAPI_KEY not configured" });

  // Format: YYYYMMDD
  const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const apiRes = await fetch(
    `https://free-api-live-football-data.p.rapidapi.com/football-get-matches-by-date?date=${today}`,
    { headers: { "x-rapidapi-key": key, "x-rapidapi-host": "free-api-live-football-data.p.rapidapi.com" } }
  );

  if (!apiRes.ok) {
    const body = await apiRes.text();
    return res.status(apiRes.status).json({ error: "API error", status: apiRes.status, body });
  }

  const data = await apiRes.json();
  const fixtures = data?.response?.matches || data?.matches || data?.response || [];

  const tournamentNames = [...new Set(fixtures.map(f => f.tournament?.name || f.league?.name || f.competition?.name).filter(Boolean))];

  const matches = fixtures.map(f => ({
    id: f.id || f.fixture?.id,
    tournament: f.tournament?.name || f.league?.name || f.competition?.name || "",
    category: f.tournament?.category?.name || f.league?.country || f.country?.name || "",
    status: f.status?.type || f.fixture?.status?.short || f.status || "",
    homeTeam: f.homeTeam?.name || f.teams?.home?.name || f.home?.name || "",
    awayTeam: f.awayTeam?.name || f.teams?.away?.name || f.away?.name || "",
    homeScore: f.homeScore?.current ?? f.goals?.home ?? f.score?.home ?? null,
    awayScore: f.awayScore?.current ?? f.goals?.away ?? f.score?.away ?? null,
  }));

  res.json({ matches, tournamentNames, _raw: fixtures.slice(0, 2) });
}
