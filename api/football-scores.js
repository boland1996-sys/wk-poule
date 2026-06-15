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

  // TIJDELIJKE PROBE v2 (?probe=2): nieuwe invalshoeken voor scorers. Weghalen na test.
  if (req.query?.probe === "2") {
    res.setHeader("Cache-Control", "no-store");
    const out = { detailProbes: {}, includeProbes: {} };
    const liveRes = await fetch(`https://${HOST}/api/flashscore/v2/matches/live?sport_id=1&timezone=Europe%2FBerlin`, { headers });
    let id = null;
    if (liveRes.ok) {
      const data = await liveRes.json();
      const tns = Array.isArray(data) ? data : (data?.data || []);
      const fm = tns.flatMap(t => t.matches || [])[0];
      id = fm?.match_id || null;
      out.sampleMatchId = id;
    }
    if (id) {
      // a) nieuwe event-namen onder matches/ en match/ (enkelvoud)
      const names = ["match-events","live-events","play-by-play","key-events","goalscorers","goals-scorers","match-incidents","match-summary","scorer","scoring","latest-incidents","results","event"];
      const paths = [];
      for (const n of names) paths.push(`matches/${n}?match_id=${id}`);
      for (const n of ["incidents","events","detail","summary","h2h"]) paths.push(`match/${n}?match_id=${id}`);
      paths.push(`match/${id}`);
      for (const p of paths) {
        try {
          const r = await fetch(`https://${HOST}/api/flashscore/v2/${p}`, { headers });
          const e = { status: r.status };
          if (r.status === 200) e.snippet = (await r.text()).slice(0, 500);
          out.detailProbes[p] = e;
        } catch (err) { out.detailProbes[p] = { error: String(err) }; }
      }
      // b) include/expand-parameters op de live-lijst — zit er dan ineens een events-veld in?
      const params = ["include=incidents","include=events","expand=incidents","events=1","incidents=1","details=1","detailed=true"];
      for (const pm of params) {
        try {
          const r = await fetch(`https://${HOST}/api/flashscore/v2/matches/live?sport_id=1&timezone=Europe%2FBerlin&${pm}`, { headers });
          if (r.ok) {
            const d = await r.json();
            const tns = Array.isArray(d) ? d : (d?.data || []);
            const fm = tns.flatMap(t => t.matches || [])[0];
            out.includeProbes[pm] = { status: r.status, matchKeys: fm ? Object.keys(fm) : null };
          } else out.includeProbes[pm] = { status: r.status };
        } catch (err) { out.includeProbes[pm] = { error: String(err) }; }
      }
    }
    return res.json(out);
  }

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
