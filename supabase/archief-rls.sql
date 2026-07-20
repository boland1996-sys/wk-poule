-- ============================================================================
-- WK-POULE ARCHIEFMODUS (Laag 3) — jul 2026, WK afgelopen
--
-- Zet de hele database op alleen-lezen voor de publieke anon-key:
--   * iedereen kan nog alles LEZEN (stand, uitslagen, tips, bonus, chat)
--   * NIEMAND kan meer schrijven met de anon-key (die in de browser zit)
--   * login blijft werken: api/auth.js gebruikt de service-role-key en die
--     gaat altijd langs RLS heen (ook voor de automatische hash-upgrade)
--
-- Uitvoeren: Supabase dashboard → SQL Editor → plak dit hele script → Run.
-- Terugdraaien (bv. voor een volgend toernooi): zie onderaan.
-- ============================================================================

-- 1. Eventuele oude policies op de app-tabellen opruimen (schone lei).
do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('matches','users','predictions','bonus_answers',
                        'bonus_results','standing_predictions','chat_messages')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- 2. RLS aanzetten + alleen-lezen policy per tabel.
--    (Geen INSERT/UPDATE/DELETE-policies = schrijven geblokkeerd.)
alter table public.matches              enable row level security;
alter table public.users                enable row level security;
alter table public.predictions          enable row level security;
alter table public.bonus_answers        enable row level security;
alter table public.bonus_results        enable row level security;
alter table public.standing_predictions enable row level security;
alter table public.chat_messages        enable row level security;

create policy "archief lezen" on public.matches              for select using (true);
create policy "archief lezen" on public.users                for select using (true);
create policy "archief lezen" on public.predictions          for select using (true);
create policy "archief lezen" on public.bonus_answers        for select using (true);
create policy "archief lezen" on public.bonus_results        for select using (true);
create policy "archief lezen" on public.standing_predictions for select using (true);
create policy "archief lezen" on public.chat_messages        for select using (true);

-- 3. Extra slot op de deur: schrijfrechten ook op grant-niveau intrekken.
--    (RLS blokkeert al, maar dit houdt óók stand als RLS ooit per ongeluk
--    uitgezet wordt.)
revoke insert, update, delete on all tables in schema public from anon, authenticated;

-- 4. Storage (avatars-bucket): upload/wijzig/verwijder-policies weghalen.
--    De foto's zelf blijven zichtbaar (public bucket = lezen blijft werken).
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and cmd <> 'SELECT'
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;

-- ============================================================================
-- TERUGDRAAIEN (volgend toernooi): per tabel
--   alter table public.<tabel> disable row level security;
-- en de schrijfrechten teruggeven:
--   grant insert, update, delete on all tables in schema public to anon;
-- Voor avatars-uploads: in het dashboard (Storage → avatars → Policies)
-- opnieuw een INSERT/UPDATE-policy aanmaken.
-- Let op: zet dan in src/App.jsx ook ARCHIEF weer op false.
-- ============================================================================
