-- Vincula cada operador a un núcleo institucional.
-- Ejecutar una sola vez en Supabase > SQL Editor.
alter table public.profiles
  add column if not exists nucleo text;

-- Los administradores pueden quedar sin núcleo; los operadores existentes
-- deben recibir un núcleo desde la pantalla de administración antes de operar.
drop policy if exists visitas_insert_active on public.visitas;
create policy visitas_insert_active on public.visitas
for insert to authenticated
with check (
  (select public.current_app_active())
  and (created_by is null or created_by = (select auth.uid()))
  and (
    (select public.current_app_role()) = 'admin'
    or nucleo = (
      select p.nucleo from public.profiles p
      where p.id = (select auth.uid()) and p.active = true
    )
  )
);
