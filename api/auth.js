// Server-side login & registratie. Controleert wachtwoorden op de server met de
// Supabase service-key, zodat de wachtwoord-hash nooit naar de browser reist.
// De browser krijgt alleen { id, username, isAdmin } terug.
//
// Laag 2 (jul 2026): wachtwoorden worden nu met scrypt gehasht (formaat
// "s2$salt$hash"). Oude accounts met de zwakke 32-bit hash worden bij hun
// eerstvolgende succesvolle login automatisch geüpgraded naar scrypt.
//
// Archiefmodus (WK afgelopen): registreren van nieuwe accounts is gesloten.

import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

// De oude zwakke hash — alleen nog nodig om bestaande accounts te herkennen.
function legacyHashPw(pw) {
  let h = 0;
  for (const c of pw) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return h.toString(36);
}

function hashPwStrong(pw) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 32).toString("hex");
  return `s2$${salt}$${hash}`;
}

function verifyPw(pw, stored) {
  if (typeof stored !== "string" || !stored) return false;
  if (stored.startsWith("s2$")) {
    const [, salt, hash] = stored.split("$");
    if (!salt || !hash) return false;
    const calc = scryptSync(pw, salt, 32).toString("hex");
    const a = Buffer.from(calc, "hex");
    const b = Buffer.from(hash, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  }
  return stored === legacyHashPw(pw);
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
      // Archiefmodus: het WK is afgelopen, geen nieuwe accounts meer.
      return res.status(403).json({ error: "Het WK is afgelopen — nieuwe accounts zijn niet meer mogelijk." });
    }

    // Standaard: login
    const r = await fetch(
      `${supaUrl}/rest/v1/users?${ilike(username)}&select=id,username,pw_hash,is_admin`,
      { headers }
    );
    const rows = await r.json();
    const u = Array.isArray(rows) ? rows[0] : null;
    if (!u || !verifyPw(password, u.pw_hash)) {
      return res.status(401).json({ error: "Gebruikersnaam of wachtwoord onjuist." });
    }

    // Oude zwakke hash? Meteen upgraden naar scrypt (mag stilletjes mislukken).
    const upd = { last_seen: new Date().toISOString() };
    if (!u.pw_hash.startsWith("s2$")) upd.pw_hash = hashPwStrong(password);
    fetch(`${supaUrl}/rest/v1/users?id=eq.${u.id}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify(upd),
    }).catch(() => {});

    return res.json({ id: u.id, username: u.username, isAdmin: u.is_admin === true });
  } catch (e) {
    return res.status(500).json({ error: "Serverfout, probeer opnieuw." });
  }
}
