export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const key = process.env.RAPIDAPI_KEY;
  if (!key) return res.status(500).json({ error: "RAPIDAPI_KEY not configured" });

  const getDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split("T")[0].replace(/-/g, "");
  };

  const dates = [getDate(2), getDate(1), getDate(0)];
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
