export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const key = process.env.RAPIDAPI_KEY;
  if (!key) return res.status(500).json({ error: "RAPIDAPI_KEY not configured" });

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

  const matches = fixtures.map(f => ({
    id: f.id,
    tournament: "",
    category: "",
    finished: f.status?.finished === true,
    homeTeam: f.home?.name || "",
    awayTeam: f.away?.name || "",
    homeScore: f.home?.score ?? null,
    awayScore: f.away?.score ?? null,
    scoreStr: f.status?.scoreStr || "",
  }));

  res.json({ matches });
}
