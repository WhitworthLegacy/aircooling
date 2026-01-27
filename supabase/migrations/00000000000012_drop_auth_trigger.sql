-- Drop the auth trigger that tries to insert into the (dropped) profiles table
-- This trigger was created in migration 00 but profiles was dropped in migration 11

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
