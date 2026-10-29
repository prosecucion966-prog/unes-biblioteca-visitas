-- Asignación de un núcleo por operador.
-- Ejecutar en Supabase > SQL Editor después de desplegar el código.
alter table public.profiles add column if not exists nucleo text;

-- Los administradores pueden quedar sin núcleo. Los operadores existentes
-- deben recibir un núcleo desde el panel de Supabase antes de registrar visitas.
create or replace function public.enforce_profile_nucleo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'admin' then
    new.nucleo := null;
  elsif new.role = 'operator' and nullif(btrim(coalesce(new.nucleo, '')), '') is null then
    raise exception 'Todo operador debe tener un núcleo asignado';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_require_nucleo on public.profiles;
create trigger profiles_require_nucleo
before insert or update of role, nucleo on public.profiles
for each row execute function public.enforce_profile_nucleo();

create or replace function public.assign_visit_nucleo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_nucleo text;
begin
  select p.role, p.nucleo into v_role, v_nucleo
  from public.profiles p
  where p.id = (select auth.uid()) and p.active = true;

  if v_role is null then
    raise exception 'No hay un perfil institucional activo';
  end if;

  if v_role = 'operator' then
    if nullif(btrim(coalesce(v_nucleo, '')), '') is null then
      raise exception 'Solicita al administrador que asigne tu núcleo';
    end if;
    new.nucleo := v_nucleo;
  elsif nullif(btrim(coalesce(new.nucleo, '')), '') is null then
    raise exception 'El administrador debe seleccionar el núcleo de la visita';
  end if;

  return new;
end;
$$;

drop trigger if exists visitas_assign_profile_nucleo on public.visitas;
create trigger visitas_assign_profile_nucleo
before insert on public.visitas
for each row execute function public.assign_visit_nucleo();

-- Los operadores solo consultan visitas de su propio núcleo.
drop policy if exists visitas_read_active on public.visitas;
create policy visitas_read_active on public.visitas
for select to authenticated
using (
  (select public.current_app_active())
  and (
    (select public.current_app_role()) = 'admin'
    or nucleo = (
      select p.nucleo from public.profiles p
      where p.id = (select auth.uid()) and p.active = true
    )
  )
);
