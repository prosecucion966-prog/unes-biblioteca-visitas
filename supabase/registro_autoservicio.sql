-- Crear automáticamente un perfil pendiente cuando alguien se registra.
-- Ejecutar en Supabase SQL Editor. Las cuentas nuevas NO pueden registrar visitas
-- hasta que un administrador las active en public.profiles.
create or replace function public.handle_new_operator_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_nucleo text;
begin
  v_name := coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), '');
  v_nucleo := nullif(btrim(new.raw_user_meta_data ->> 'nucleo'), '');

  if v_nucleo is null then
    v_nucleo := '';
  end if;

  insert into public.profiles (id, full_name, role, active, nucleo)
  values (new.id, v_name, 'operator', false, v_nucleo)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_operator_profile on auth.users;
create trigger on_auth_user_created_operator_profile
after insert on auth.users
for each row execute function public.handle_new_operator_signup();
