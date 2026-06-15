// Server-side login & registratie. Controleert wachtwoorden op de server met de
// Supabase service-key, zodat de wachtwoord-hash nooit naar de browser reist.
// De browser krijgt alleen { id, username, isAdmin } terug.

// Zelfde hash als voorheen in de client — bestaande wachtwoorden blijven dus werken.
function hashPw(pw) {
  let h = 0;
  for (const c of pw) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return h.toString(36);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const supaUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supaUrl || !serviceKey) return res.status(500).json({ error: "server niet geconfigureerd" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const action = body?.action;
  const username = (body?.username || "").trim();
  const password = body?.password || "";
  if (!username || !password) return res.status(400).json({ error: "Vul alles in." });

  const headers = {
    apikey: serviceKey,
    authorization: `Bearer ${serviceKey}`,
    "content-type": "application/json",
  };
  const ilike = (name) => `username=ilike.${encodeURIComponent(name)}`;

  try {
    if (action === "register") {
      if (username.length < 3) return res.status(400).json({ error: "Naam minimaal 3 tekens." });
      if (password.length < 6) return res.status(400).json({ error: "Wachtwoord minimaal 6 tekens." });
      if (username.toLowerCase() === "admin") return res.status(400).json({ error: "Naam niet beschikbaar." });

      const exRes = await fetch(`${supaUrl}/rest/v1/users?${ilike(username)}&select=id`, { headers });
      const ex = await exRes.json();
      if (Array.isArray(ex) && ex.length > 0) return res.status(409).json({ error: "Naam al in gebruik." });

      const insRes = await fetch(`${supaUrl}/rest/v1/users`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({ username, pw_hash: hashPw(password) }),
      });
      if (!insRes.ok) return res.status(500).json({ error: "Er ging iets mis, probeer opnieuw." });
      const nu = (await insRes.json())[0];
      return res.json({ id: nu.id, username: nu.username, isAdmin: false });
    }

    // Standaard: login
    const r = await fetch(
      `${supaUrl}/rest/v1/users?${ilike(username)}&select=id,username,pw_hash,is_admin`,
      { headers }
    );
    const rows = await r.json();
    const u = Array.isArray(rows) ? rows[0] : null;
    if (!u || u.pw_hash !== hashPw(password)) {
      return res.status(401).json({ error: "Gebruikersnaam of wachtwoord onjuist." });
    }
    // last_seen bijwerken (mag stilletjes mislukken)
    fetch(`${supaUrl}/rest/v1/users?id=eq.${u.id}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({ last_seen: new Date().toISOString() }),
    }).catch(() => {});
    return res.json({ id: u.id, username: u.username, isAdmin: u.is_admin === true });
  } catch (e) {
    return res.status(500).json({ error: "Serverfout, probeer opnieuw." });
  }
}
