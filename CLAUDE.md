# WK-Poule — Projectdocumentatie

> Complete kennisbank over deze app. Online bekijkbaar op GitHub, zodat de kennis overal beschikbaar is (ook buiten Claude Code). Te kopiëren/plakken in elk Claude-gesprek.

## Wat is het

Een WK 2026 poule-app voor Ramon Boland en vrienden ("Boland's Special"). Deelnemers voorspellen wedstrijduitslagen en verdienen punten. Bevat: tussenstand/klassement, bonusvragen, groepsstand-voorspellingen, chat, en potbeheer (prijzengeld). **Het WK is afgelopen (jul 2026) — de site staat nu in archiefmodus** (zie "Archiefmodus / beveiliging" hieronder): alles is terug te kijken, niets is meer te wijzigen.

- **Domein:** ramonboland.com
- **Repo:** boland1996-sys/wk-poule (GitHub)
- **Eigenaar:** Ramon Boland (boland1996@gmail.com)

## Tech stack

- **Frontend:** React 19 + Vite 8. Alle app-logica zit in één bestand: `src/App.jsx` (~3200 regels) — componenten, state, CSS-string, en render. Geen TypeScript.
- **Backend:** Supabase (PostgreSQL database + auth + realtime + storage).
- **Hosting:** Vercel. Push naar `main` → automatische deploy naar ramonboland.com.
- **Data-API:** flashscore4 via RapidAPI (uitslagen + live scores).

## Bestandsstructuur

| Bestand | Doel |
|---------|------|
| `src/App.jsx` | Alles: componenten, state, CSS (als string-const, via `<style>`), render |
| `src/main.jsx` | Entry point |
| `src/assets/` | hero.png / gullit.jpg |
| `api/auth.js` | Server-side login (scrypt-hash, verbergt wachtwoord-hash; registratie gesloten in archiefmodus) |
| `supabase/archief-rls.sql` | SQL-script voor de Supabase SQL Editor: RLS aan, database alleen-lezen (archiefmodus) |
| `api/football-scores.js` | Proxy naar flashscore (verbergt RapidAPI-key) |
| `api/cron-import.js` | Server-side (elke minuut): importeert eindstanden + vult tegenstanders volgende KO-ronde in + vergrendelt wedstrijden 5 min voor aftrap |
| `vercel.json` | Alleen rewrite voor `/api/*`. Geen Vercel-cron |

## Database-tabellen (Supabase)

- **matches** — `id, home, away, home_goals, away_goals, grp (groep A–L), phase ("group"|"r32"|"r16"|"qf"|"sf"|"3p"|"final"), match_date (string bv. "do 11 jun 21:00"), locked (bool)`
- **users** — `id, username, pw_hash, is_admin, avatar_color, avatar_photo, last_seen`
- **predictions** — `id, user_id, match_id, home_goals, away_goals`. Unieke index op (user_id, match_id) → upsert. Opgehaald in batches van 1000.
- **bonus_answers** — `user_id, answers (JSON)` — antwoorden van deelnemers op de 8 bonusvragen
- **bonus_results** — één rij: `id, answers (JSON)` — de juiste antwoorden + speciale keys `_potN` (aantal pot-deelnemers) en `_bonusLocked` (bool)
- **standing_predictions** — `id, user_id, group, order (array van 4 teams)` — voorspelde groepseindstand
- **chat_messages** — `id, user_id, username, message, created_at`
- **Storage bucket** `avatars` — profielfoto's, pad `{userId}.{ext}`

## Communicatie / data-flow

**Client → Supabase (direct):** met de **anon-key** (`VITE_SUPABASE_URL` / `VITE_SUPABASE_KEY`, in de browser-bundle). Alle leesacties en de meeste schrijfacties.

**Client → eigen serverless API (`/api/*` op Vercel):**
- `api/auth.js` — login/registratie met `SUPABASE_SERVICE_ROLE_KEY` zodat `pw_hash` nooit naar de browser gaat. Browser krijgt alleen `{id, username, isAdmin}`.
- `api/football-scores.js` — flashscore-proxy. Modi: `?live=1` (live, cache 6s) en import (`?days=N`, cache 30s).
- `api/cron-import.js` — schrijft eindstanden naar Supabase. Beveiligd met `CRON_SECRET`.

**Uitslagen-import:**
- Bron: flashscore4 (`flashscore4.p.rapidapi.com`, `/api/flashscore/v2/`, Ultra-plan: 10.000 req/dag).
- **cron-job.org** (externe dienst, NIET in repo) riep **elke minuut** `https://www.ramonboland.com/api/cron-import?secret=...` aan — **verwijderd op 20 jul 2026** (WK afgelopen, archiefmodus).
- `cron-import.js` pakt afgewerkte matches, vertaalt teamnamen via `TEAM_MAP` (EN→NL), matcht op DB-wedstrijden zonder uitslag, en PATCH't de score. Daarnaast (stappen 4 en 5, kosten geen flashscore-calls): (4) vult `"Winnaar duel N"` / `"Verliezer duel N"` van de volgende ronde met het echte team zodra duel N een duidelijke winnaar heeft, en (5) zet `locked=true` zodra het 5 min voor aftrap is (CEST→UTC via `Date.UTC(...,hh-2,...)`).
- GitHub Actions (`.github/workflows/import-scores.yml`) is nu **alleen handmatig** (`workflow_dispatch`) als reserve — geen schema meer.
- Client-side aanvulling: admin-app draait import + doorstroom + lock elke 5 min/60s als die open is.
- **Penalty's:** flashscore geeft alleen de stand ná verlenging (geen penalty-uitslag/winnaar; `winner`-veld is altijd null). Wedstrijden met `is_finished_after_penalties` worden door de import **overgeslagen** — admin vult de beslissende uitslag handmatig in, daarna stroomt de winnaar alsnog door.

**Realtime (Supabase channel "wkpoule_presence"):** live chat (chat_messages INSERT/DELETE), live score/lock updates (matches UPDATE), en online-indicator via presence. RLS staat UIT.

**Env-variabelen (in Vercel):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY` (anon, ook in browser), `SUPABASE_SERVICE_ROLE_KEY` (server), `RAPIDAPI_KEY` (server), `CRON_SECRET` (server).

## Puntensysteem

- 3pt: winnaar/gelijkspel goed
- +1pt: thuisgoals exact goed · +1pt: uitgoals exact goed
- Exacte uitslag = 5pt + 2 bonus = **7pt**
- **10pt** per goed bonusvraag-antwoord (8 vragen). Admin kan per bonusvraag **meerdere** correcte antwoorden opgeven (bij gelijke stand, bv. twee landen met de meeste goals tegen) via "+ antwoord toevoegen". Opgeslagen als array in `bonus_results`; een deelnemer met één van de goede antwoorden krijgt de punten. Centrale check: `bonusIsCorrect(a, r, type)` (r = string óf array).
- **5pt** per correct geplaatst team in groepseindstand (telt pas als groep volledig gespeeld)

Klassement: punten → bij gelijk aantal exacte uitslagen als tiebreak. Admin-account telt niet mee.

## Tabs

Deelnemer: 🏆 Stand · 📅 Vandaag · ⚽ Groepen · 🥊 KO · 🗺️ Schema · 📊 Standen · 🎯 Bonus · 💶 Pot · 📋 Mijn
Admin: idem, laatste tab = 👑 Beheer (i.p.v. Mijn). 9 tabs; op smalle telefoons (<360px) tonen de knoppen alleen het icoon.

## Belangrijke features / gedrag

- **Auto-lock (5 min voor aftrap):** wedstrijden sluiten **5 minuten vóór aftrap** (helper `tipDeadline(md) = parseMatchDate - 5min`). Op 4 niveaus: (a) server-side `cron-import.js` zet de DB-lock — 100% dicht, ook als admin offline is; (b) admin-client zet de lock ook (60s, realtime); (c) `savePred`-guard weigert tips binnen 5 min; (d) UI toont "🔒 Te laat" / "Tippen gesloten".
- **Auto-doorstroom KO:** `"Winnaar duel N"`/`"Verliezer duel N"` worden automatisch het echte team zodra duel N een duidelijke winnaar heeft. Client-side (admin online) + server-side (cron, altijd). Cascadeert door de rondes. Match-ids 73–104 = officiële FIFA-nummers; structuur geverifieerd tegen het echte WK 2026 schema.
- **KO = geen gelijkspel:** `savePred` weigert een gelijke tip als `phase !== "group"` ("kies een winnaar"). In de KO-tab staat hierover een oranje banner voor deelnemers.
- **Tip opslaan:** upsert; beide velden leeg = tip verwijderen. Exacte uitslag → confetti + "+7 Exact!". "Twin"-melding (zelfde tip als ander) alleen nog in de **groepsfase** (in KO tipt iedereen hetzelfde → uitgezet).
- **🗺️ Schema-tab:** visueel KO-bracket (`Bracket`-component, dynamische SVG): gespiegeld model met de finale in het midden (NOS-stijl), vlag + landnaam, winnaar oranje + score, placeholders cursief, 3e-plaats apart. Horizontaal scrollbaar op mobiel. Vult automatisch mee met de doorstroom.
- **Tippen vanaf Stand-pagina:** de "⚽ Volgende wedstrijd"-kaart (`LiveOrNext`) heeft een inline tip-invoer (zelfde regels: KO-blok + 5-min-deadline). Toont ook náást de live-balk de eerstvolgende nog niet begonnen wedstrijd. Tip is **bevroren** na opslaan (read-only + ✏️ Wijzig om aan te passen).
- **Tippen vanaf Vandaag-tab:** elke wedstrijdkaart (`TodayMatchCard`) heeft dezelfde bevroren inline tip-editor als de Stand-pagina (✏️ Wijzig / ⚽ Tip-knop → invoervelden → ✓ opslaan, via `savePred` dus zelfde KO- en deadline-regels). Was eerder alleen read-only tekst.
- **KO-tab sortering:** wedstrijden binnen een fase chronologisch op aftraptijd.
- **Live-balk:** pollt `/api/football-scores?live=1` elke 8s, broadcast-stijl met wedstrijdfase + rode kaarten. Gecached in localStorage voor directe weergave bij refresh.
- **Klassement:** top 3 = 🥇🥈🥉, daarna gewone nummers. Positiepijltjes ▲/▼/– via `prevRanks` in localStorage.
- **Auto-reload:** checkt elke 10 min op een nieuwe build (asset-hash) en herlaadt automatisch, zodat niemand op oude cache blijft.
- **Online/laatst gezien:** via realtime presence + `last_seen` updates op meerdere events (vangnet voor mobiel).
- **Sessie:** in localStorage (`wkp2026`), simpel `{id, username, isAdmin}` — geen JWT.

## Pot / prijzengeld

Inleg × aantal deelnemers. Verdeling: winnaar 50% · nr.2 30% · nr.3 20%.

## Archiefmodus / beveiliging (jul 2026, na afloop WK)

De beveiliging is in "lagen" opgebouwd:

- **Laag 1 (jun 2026):** login/registratie server-side via `api/auth.js` met de service-role-key; `pw_hash` gaat nooit naar de browser. In Supabase: `REVOKE SELECT (pw_hash) ON public.users FROM anon, authenticated`.
- **Laag 2 (jul 2026):** wachtwoorden gehasht met **scrypt** (formaat `s2$salt$hash`, `node:crypto` scryptSync + timingSafeEqual). Oude accounts met de zwakke 32-bit hash worden bij hun eerstvolgende succesvolle login automatisch geüpgraded (login vergelijkt eerst scrypt, valt terug op legacy-hash en PATCH't dan de nieuwe hash).
- **Laag 3 = archiefmodus (jul 2026):** RLS aan op alle 7 tabellen met alleen een SELECT-policy (`supabase/archief-rls.sql`, uitvoeren in de Supabase SQL Editor). Schrijven met de publieke anon-key is onmogelijk; extra `REVOKE insert/update/delete` op grant-niveau; storage-schrijfpolicies (avatars) verwijderd. Login blijft werken (service-role-key gaat langs RLS heen).

In de app: const `ARCHIEF = true` bovenin `src/App.jsx` → archief-banner op Stand, registratie-UI verborgen op de loginpagina, 👤 profiel-knop verborgen, archiefmelding op de Beheer-tab. Registratie is ook server-side dicht (403 in `api/auth.js`).

**Terugdraaien voor een volgend toernooi:** zie het commentaarblok onderaan `supabase/archief-rls.sql` + `ARCHIEF = false` zetten + registratie in `api/auth.js` weer activeren.

**Let op:** `api/cron-import.js` schrijft met de anon-key en werkt dus niet meer onder RLS — niet erg, het WK is voorbij. De externe cron (cron-job.org) is op 20 jul 2026 door Ramon verwijderd; bij een volgend toernooi moet die opnieuw aangemaakt worden (elke minuut naar `https://www.ramonboland.com/api/cron-import?secret=...`).

## Bekende beperkingen

- **Geen doelpuntenmakers:** flashscore4 heeft alleen `matches/{list-by-date,live,h2h,odds,standings}` — geen events/scorers. ~60 endpoint-combinaties getest (juni 2026), niet mogelijk. Zou een andere API vereisen (bv. API-Football). Niet opnieuw onderzoeken.
- **Geen penalty-uitslag:** flashscore geeft bij een shootout alleen de gelijke stand na verlenging, geen penalty-score of winnaar. Daarom worden penalty-wedstrijden niet automatisch geïmporteerd; admin vult ze handmatig in. Niet opnieuw onderzoeken.
- **Admin-rechten** (`isAdmin`) zitten client-side. In archiefmodus maakt dat niet uit (schrijven is sowieso geblokkeerd door RLS); bij hergebruik voor een volgend toernooi zouden admin-schrijfacties eigenlijk via een server-endpoint moeten.
- De client-side `hashPw` in `App.jsx` wordt alleen nog gebruikt door de (in archiefmodus toch niet-werkende) admin wachtwoord-reset; echte hashing gebeurt server-side met scrypt.

## Workflow-afspraak

- Na elke code-wijziging: direct `git add` → `commit` → `push` (geen aparte bevestiging nodig). Push naar `main` triggert automatisch de Vercel-deploy.
- Na betekenisvolle wijzigingen ook dit `CLAUDE.md` bijwerken, zodat de kennis online (op GitHub) blijft staan en op elke pc terug te lezen is.
