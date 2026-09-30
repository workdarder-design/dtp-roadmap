-- Short public share codes (4–5 alphanumeric) instead of long hex tokens

create or replace function public.random_share_code(len int default 5)
returns text
language plpgsql
as $$
declare
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i int;
  n int := greatest(4, least(5, coalesce(len, 5)));
begin
  for i in 1..n loop
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return result;
end;
$$;

update public.app_settings
set share_token = public.random_share_code(5)
where id = 1
  and (share_token is null or share_token !~ '^[a-z0-9]{4,5}$');

alter table public.app_settings
  drop constraint if exists app_settings_share_token_format;

alter table public.app_settings
  add constraint app_settings_share_token_format
  check (share_token ~ '^[a-z0-9]{4,5}$');
