export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const key = process.env.RAPIDAPI_KEY;
  if (!key) return res.status(500).json({ error: "RAPIDAPI_KEY not configured" });

  const today = new Date().toISOString().split("T")[0];
  const apiRes = await fetch(
    `https://allsportsapi2.p.rapidapi.com/api/football/matches/${today}`,
    { headers: { "x-rapidapi-key": key, "x-rapidapi-host": "allsportsapi2.p.rapidapi.com" } }
  );

  if (!apiRes.ok) return res.status(apiRes.status).json({ error: "API error" });

  const data = await apiRes.json();
  const events = data?.events || [];

  // Return all events with only the fields we need, plus unique tournament names for debugging
  const tournamentNames = [...new Set(events.map(e => e.tournament?.name).filter(Boolean))];

  const matches = events.map(e => ({
    id: e.id,
    tournament: e.tournament?.name,
    category: e.tournament?.category?.name,
    status: e.status?.type,
    homeTeam: e.homeTeam?.name,
    awayTeam: e.awayTeam?.name,
    homeScore: e.homeScore?.current,
    awayScore: e.awayScore?.current,
  }));

  res.json({ matches, tournamentNames });
}
