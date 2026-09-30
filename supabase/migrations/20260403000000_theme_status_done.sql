-- Configurable success green (status-done) from Settings

alter table public.app_settings
  add column if not exists status_done_color text,
  add column if not exists status_done_color_dark text;

alter table public.app_settings
  drop constraint if exists app_settings_status_done_color_format;

alter table public.app_settings
  add constraint app_settings_status_done_color_format
  check (
    status_done_color is null
    or status_done_color ~ '^(oklch\\([^)]+\\)|#[0-9a-fA-F]{3,8})$'
  );

alter table public.app_settings
  drop constraint if exists app_settings_status_done_color_dark_format;

alter table public.app_settings
  add constraint app_settings_status_done_color_dark_format
  check (
    status_done_color_dark is null
    or status_done_color_dark ~ '^(oklch\\([^)]+\\)|#[0-9a-fA-F]{3,8})$'
  );
