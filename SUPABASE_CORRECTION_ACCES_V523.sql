-- NEXORA V523 — séparation durable des accès Élèves et Pro.
-- À exécuter une seule fois dans Supabase > SQL Editor avant le redéploiement Vercel.

begin;

create table if not exists public.nexora_subscriptions_v523 (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_code text not null check (product_code in ('eleves', 'pro')),
  status text not null default 'active',
  plan_code text not null default '',
  duration_months integer,
  amount_gnf bigint,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  last_payment_request_id uuid,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_code),
  check (ends_at > starts_at)
);

create table if not exists public.nexora_subscription_events_v523 (
  payment_request_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_code text not null check (product_code in ('eleves', 'pro')),
  duration_months integer not null check (duration_months > 0),
  amount_gnf bigint,
  segment_starts_at timestamptz not null,
  segment_ends_at timestamptz not null,
  approved_by uuid,
  approved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (segment_ends_at > segment_starts_at)
);

create index if not exists nexora_subscriptions_v523_active_idx
  on public.nexora_subscriptions_v523 (user_id, product_code, ends_at desc)
  where status = 'active';

create index if not exists nexora_subscription_events_v523_user_idx
  on public.nexora_subscription_events_v523 (user_id, product_code, approved_at);

alter table public.nexora_subscriptions_v523 enable row level security;
alter table public.nexora_subscription_events_v523 enable row level security;

revoke all on table public.nexora_subscriptions_v523 from public, anon, authenticated;
revoke all on table public.nexora_subscription_events_v523 from public, anon, authenticated;

create or replace function public.nexora_subscription_product_v523(
  p_product_code text,
  p_plan_code text default null
)
returns text
language sql
immutable
set search_path = pg_catalog, public
as $function$
  select case
    when lower(trim(coalesce(p_product_code, ''))) in
      ('pro', 'modules', 'professional', 'professionnel')
      or upper(trim(coalesce(p_plan_code, ''))) like 'NX-PRO-%'
      then 'pro'
    else 'eleves'
  end
$function$;

revoke all on function public.nexora_subscription_product_v523(text, text) from public;

create or replace function public.nexora_admin_review_payment_request_v264(
  p_request_id uuid,
  p_decision text,
  p_admin_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth, storage, extensions
as $function$
declare
  v_admin uuid;
  v_decision text := lower(trim(coalesce(p_decision, '')));
  v_request public.nexora_payment_requests%rowtype;
  v_existing public.nexora_subscriptions_v523%rowtype;
  v_saved public.nexora_subscriptions_v523%rowtype;
  v_duration integer;
  v_amount bigint;
  v_plan_code text;
  v_product text;
  v_access_start timestamptz;
  v_segment_start timestamptz;
  v_access_end timestamptz;
begin
  v_admin := public.nexora_admin_assert_v264();

  select * into v_request
  from public.nexora_payment_requests
  where id = p_request_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'message', 'Demande de paiement introuvable.');
  end if;

  if v_decision in ('reject', 'rejected', 'refuse') then
    if exists (
      select 1 from public.nexora_subscription_events_v523
      where payment_request_id = p_request_id
    ) then
      return jsonb_build_object(
        'success', false,
        'message', 'Ce paiement a déjà activé un abonnement et ne peut plus être refusé.'
      );
    end if;

    update public.nexora_payment_requests
    set status = 'rejected',
        code_status = 'rejected',
        reviewed_at = now(),
        reviewed_by = v_admin,
        admin_note = left(trim(coalesce(p_admin_note, 'Paiement refusé.')), 800),
        updated_at = now()
    where id = p_request_id;

    return jsonb_build_object(
      'success', true,
      'accepted', false,
      'request_id', p_request_id,
      'status', 'rejected',
      'message', 'Paiement refusé. Aucun accès n’a été ouvert.'
    );
  end if;

  if v_decision not in ('approve', 'approved', 'accept', 'validate') then
    return jsonb_build_object('success', false, 'message', 'Décision de paiement non reconnue.');
  end if;

  v_duration := v_request.duration_months;
  -- nexora_payment_requests ne possède pas forcément une colonne plan_code.
  -- Le code du plan est donc toujours résolu depuis plan_id.
  v_plan_code := '';

  if v_request.plan_id is not null
     and to_regclass('public.nexora_subscription_plans') is not null then
    execute 'select coalesce($2, duration_months), coalesce(plan_code, '''')
             from public.nexora_subscription_plans where id = $1'
      into v_duration, v_plan_code
      using v_request.plan_id, v_duration;
  end if;

  if v_duration is null or v_duration not in (3, 6, 9, 12) then
    return jsonb_build_object('success', false, 'message', 'La durée doit être 3, 6, 9 ou 12 mois.');
  end if;

  if v_request.user_id is null then
    return jsonb_build_object('success', false, 'message', 'Le paiement n’est rattaché à aucun compte Nexora.');
  end if;

  v_product := public.nexora_subscription_product_v523(v_request.product_code, v_plan_code);
  v_amount := coalesce(v_request.amount_gnf, v_duration::bigint * 60000);

  if exists (
    select 1 from public.nexora_subscription_events_v523
    where payment_request_id = p_request_id
  ) then
    select * into v_saved
    from public.nexora_subscriptions_v523
    where user_id = v_request.user_id and product_code = v_product;

    return jsonb_build_object(
      'success', true,
      'accepted', v_saved.status = 'active' and v_saved.ends_at > now(),
      'already_processed', true,
      'request_id', p_request_id,
      'user_id', v_request.user_id,
      'product_code', v_product,
      'status', v_saved.status,
      'starts_at', v_saved.starts_at,
      'ends_at', v_saved.ends_at,
      'server_now', now(),
      'message', 'Ce paiement avait déjà été accepté. Aucun mois supplémentaire n’a été ajouté.'
    );
  end if;

  select * into v_existing
  from public.nexora_subscriptions_v523
  where user_id = v_request.user_id and product_code = v_product
  for update;

  if found and v_existing.status = 'active' and v_existing.ends_at > now() then
    v_access_start := v_existing.starts_at;
    v_segment_start := v_existing.ends_at;
    v_access_end := v_existing.ends_at + make_interval(months => v_duration);
  else
    v_access_start := now();
    v_segment_start := v_access_start;
    v_access_end := v_access_start + make_interval(months => v_duration);
  end if;

  insert into public.nexora_subscriptions_v523 (
    user_id, product_code, status, plan_code, duration_months, amount_gnf,
    starts_at, ends_at, last_payment_request_id,
    approved_by, approved_at, created_at, updated_at
  ) values (
    v_request.user_id, v_product, 'active', v_plan_code, v_duration, v_amount,
    v_access_start, v_access_end, p_request_id,
    v_admin, now(), now(), now()
  )
  on conflict (user_id, product_code) do update
  set status = 'active',
      plan_code = excluded.plan_code,
      duration_months = excluded.duration_months,
      amount_gnf = excluded.amount_gnf,
      starts_at = excluded.starts_at,
      ends_at = excluded.ends_at,
      last_payment_request_id = excluded.last_payment_request_id,
      approved_by = excluded.approved_by,
      approved_at = excluded.approved_at,
      updated_at = now()
  returning * into v_saved;

  insert into public.nexora_subscription_events_v523 (
    payment_request_id, user_id, product_code, duration_months, amount_gnf,
    segment_starts_at, segment_ends_at, approved_by, approved_at
  ) values (
    p_request_id, v_request.user_id, v_product, v_duration, v_amount,
    v_segment_start, v_access_end, v_admin, now()
  );

  update public.nexora_payment_requests
  set product_code = v_product,
      duration_months = v_duration,
      amount_gnf = v_amount,
      status = 'approved',
      code_status = 'approved',
      reviewed_at = now(),
      reviewed_by = v_admin,
      admin_note = left(trim(coalesce(p_admin_note, 'Paiement accepté et abonnement activé.')), 800),
      subscription_starts_at = v_segment_start,
      subscription_ends_at = v_access_end,
      updated_at = now()
  where id = p_request_id;

  return jsonb_build_object(
    'success', true,
    'accepted', true,
    'request_id', p_request_id,
    'user_id', v_saved.user_id,
    'product_code', v_saved.product_code,
    'status', v_saved.status,
    'duration_months', v_duration,
    'amount_gnf', v_amount,
    'starts_at', v_saved.starts_at,
    'ends_at', v_saved.ends_at,
    'server_now', now(),
    'message', case when v_product = 'pro'
      then 'Paiement accepté : accès Pro activé sans ouvrir l’espace Élèves.'
      else 'Paiement accepté : accès Élèves activé sans ouvrir l’espace Pro.' end
  );
end;
$function$;

create or replace function public.nexora_my_subscription_status_v264(
  p_product_code text default 'all'
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth, storage, extensions
as $function$
declare
  v_user uuid := auth.uid();
  v_requested text := lower(trim(coalesce(p_product_code, 'all')));
  v_product text;
  v_start timestamptz;
  v_end timestamptz;
  v_plan text := '';
  v_duration integer;
  v_amount bigint;
  v_source text := '';
  v_days integer;
  v_latest_end timestamptz;
begin
  if v_user is null then
    return jsonb_build_object(
      'version', 'v523', 'authoritative', true, 'authenticated', false,
      'active', false, 'status', 'not_connected', 'server_now', now()
    );
  end if;

  v_requested := case
    when v_requested in ('modules', 'pro', 'professional', 'professionnel') then 'pro'
    when v_requested in ('academy', 'orientation', 'subjects', 'novels', 'eleves', 'élèves', 'student') then 'eleves'
    when v_requested = 'adams' then 'adams'
    else 'all'
  end;

  select q.starts_at, q.ends_at, q.product_code, q.plan_code,
         q.duration_months, q.amount_gnf, q.source
  into v_start, v_end, v_product, v_plan, v_duration, v_amount, v_source
  from (
    select s.starts_at, s.ends_at, s.product_code, s.plan_code,
           s.duration_months, s.amount_gnf, 'payment'::text as source
    from public.nexora_subscriptions_v523 s
    where s.user_id = v_user
      and s.status = 'active'
      and s.ends_at > now()
      and (v_requested = 'all' or s.product_code = v_requested)

    union all

    select a.starts_at, a.ends_at,
           case
             when lower(a.product_code) in ('modules', 'pro') then 'pro'
             when lower(a.product_code) in ('academy', 'orientation', 'eleves', 'élèves') then 'eleves'
             else lower(a.product_code)
           end,
           coalesce(a.product_code, ''), null::integer, null::bigint,
           'activation_code'::text
    from public.nexora_user_access_v4 a
    where a.user_id = v_user
      and a.status = 'active'
      and a.ends_at > now()
      and (
        v_requested = 'all'
        or lower(a.product_code) = 'all'
        or (v_requested = 'pro' and lower(a.product_code) in ('pro', 'modules'))
        or (v_requested = 'eleves' and lower(a.product_code) in ('eleves', 'élèves', 'academy', 'orientation'))
        or (v_requested = 'adams' and lower(a.product_code) = 'adams')
      )
  ) q
  order by q.ends_at desc
  limit 1;

  if v_end is not null and v_end > now() then
    v_days := greatest(1, ceil(extract(epoch from (v_end - now())) / 86400.0)::integer);
    return jsonb_build_object(
      'version', 'v523',
      'authoritative', true,
      'authenticated', true,
      'active', true,
      'status', 'active',
      'source', v_source,
      'requested_product_code', v_requested,
      'product_code', v_product,
      'plan_code', coalesce(v_plan, ''),
      'duration_months', v_duration,
      'amount_gnf', v_amount,
      'starts_at', v_start,
      'ends_at', v_end,
      'days_remaining', v_days,
      'notice_due', v_days <= 7,
      'notice_message', case when v_days <= 7
        then 'Votre abonnement Nexora arrive bientôt à expiration.' else '' end,
      'server_now', now()
    );
  end if;

  select max(q.ends_at) into v_latest_end
  from (
    select s.ends_at
    from public.nexora_subscriptions_v523 s
    where s.user_id = v_user
      and (v_requested = 'all' or s.product_code = v_requested)
    union all
    select a.ends_at
    from public.nexora_user_access_v4 a
    where a.user_id = v_user
      and (
        v_requested = 'all'
        or lower(a.product_code) = 'all'
        or (v_requested = 'pro' and lower(a.product_code) in ('pro', 'modules'))
        or (v_requested = 'eleves' and lower(a.product_code) in ('eleves', 'élèves', 'academy', 'orientation'))
        or (v_requested = 'adams' and lower(a.product_code) = 'adams')
      )
  ) q;

  return jsonb_build_object(
    'version', 'v523',
    'authoritative', true,
    'authenticated', true,
    'active', false,
    'status', case when v_latest_end is not null and v_latest_end <= now()
      then 'expired' else 'inactive' end,
    'requested_product_code', v_requested,
    'product_code', v_requested,
    'ends_at', v_latest_end,
    'notice_due', false,
    'server_now', now()
  );
end;
$function$;

-- Reconstitution idempotente de l’historique : chaque paiement accepté est
-- appliqué une seule fois et uniquement à son espace réel.
do $migration$
declare
  r record;
  v_existing public.nexora_subscriptions_v523%rowtype;
  v_product text;
  v_event_at timestamptz;
  v_start timestamptz;
  v_segment_start timestamptz;
  v_end timestamptz;
  v_duration integer;
  v_plan text;
begin
  for r in
    select *
    from public.nexora_payment_requests
    where user_id is not null
      and lower(coalesce(status, '')) in ('approved', 'activated', 'active', 'accepted', 'validated')
    order by coalesce(reviewed_at, declared_at, updated_at, created_at), created_at, id
  loop
    if exists (
      select 1 from public.nexora_subscription_events_v523
      where payment_request_id = r.id
    ) then
      continue;
    end if;

    v_duration := r.duration_months;
    if v_duration is null or v_duration <= 0 then
      continue;
    end if;

    -- Même compatibilité pendant la reprise des anciens paiements :
    -- ne jamais supposer que nexora_payment_requests contient plan_code.
    v_plan := '';
    if r.plan_id is not null
       and to_regclass('public.nexora_subscription_plans') is not null then
      execute 'select coalesce(plan_code, '''')
               from public.nexora_subscription_plans where id = $1'
        into v_plan
        using r.plan_id;
      v_plan := coalesce(v_plan, '');
    end if;
    v_product := public.nexora_subscription_product_v523(r.product_code, v_plan);
    v_event_at := coalesce(r.reviewed_at, r.declared_at, r.updated_at, r.created_at, now());

    select * into v_existing
    from public.nexora_subscriptions_v523
    where user_id = r.user_id and product_code = v_product
    for update;

    if found and v_existing.ends_at > v_event_at then
      v_start := v_existing.starts_at;
      v_segment_start := v_existing.ends_at;
      v_end := v_existing.ends_at + make_interval(months => v_duration);
    else
      v_start := v_event_at;
      v_segment_start := v_event_at;
      v_end := v_event_at + make_interval(months => v_duration);
    end if;

    insert into public.nexora_subscriptions_v523 (
      user_id, product_code, status, plan_code, duration_months, amount_gnf,
      starts_at, ends_at, last_payment_request_id,
      approved_by, approved_at, created_at, updated_at
    ) values (
      r.user_id, v_product, 'active', v_plan, v_duration, r.amount_gnf,
      v_start, v_end, r.id,
      r.reviewed_by, v_event_at, now(), now()
    )
    on conflict (user_id, product_code) do update
    set status = 'active', plan_code = excluded.plan_code,
        duration_months = excluded.duration_months, amount_gnf = excluded.amount_gnf,
        starts_at = excluded.starts_at, ends_at = excluded.ends_at,
        last_payment_request_id = excluded.last_payment_request_id,
        approved_by = excluded.approved_by, approved_at = excluded.approved_at,
        updated_at = now();

    insert into public.nexora_subscription_events_v523 (
      payment_request_id, user_id, product_code, duration_months, amount_gnf,
      segment_starts_at, segment_ends_at, approved_by, approved_at
    ) values (
      r.id, r.user_id, v_product, v_duration, r.amount_gnf,
      v_segment_start, v_end, r.reviewed_by, v_event_at
    );
  end loop;
end;
$migration$;

-- Conserve les anciens abonnements Élèves qui ne possèdent aucun paiement
-- historique exploitable, sans jamais les transformer en accès Pro.
insert into public.nexora_subscriptions_v523 (
  user_id, product_code, status, plan_code, duration_months, amount_gnf,
  starts_at, ends_at, last_payment_request_id,
  approved_by, approved_at, created_at, updated_at
)
select s.user_id, 'eleves', s.status, s.plan_code, s.duration_months, s.amount_gnf,
       s.starts_at, s.ends_at, s.last_payment_request_id,
       s.approved_by, s.approved_at, now(), now()
from public.nexora_subscriptions_v264 s
where lower(coalesce(s.status, '')) = 'active'
  and s.ends_at > now()
  and upper(coalesce(s.plan_code, '')) not like 'NX-PRO-%'
  and not exists (
    select 1 from public.nexora_subscriptions_v523 n
    where n.user_id = s.user_id and n.product_code = 'eleves'
  )
on conflict (user_id, product_code) do nothing;

revoke all on function public.nexora_admin_review_payment_request_v264(uuid, text, text) from public, anon;
grant execute on function public.nexora_admin_review_payment_request_v264(uuid, text, text) to authenticated;

revoke all on function public.nexora_my_subscription_status_v264(text) from public, anon;
grant execute on function public.nexora_my_subscription_status_v264(text) to authenticated;

commit;

-- Contrôle après exécution : une ligne Élèves et une ligne Pro peuvent coexister.
select user_id, product_code, status, plan_code, starts_at, ends_at,
       last_payment_request_id
from public.nexora_subscriptions_v523
order by updated_at desc, user_id, product_code;
