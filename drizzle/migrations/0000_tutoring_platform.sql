create type public.app_role as enum ('tutor','student');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "own role read" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'tutor'));
create policy "profiles read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'tutor'));
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'tutor'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), new.email);
  if not exists (select 1 from public.user_roles where role = 'tutor') then
    insert into public.user_roles (user_id, role) values (new.id, 'tutor');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'student');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  starts_at timestamptz not null,
  duration_min int not null default 60,
  topic text not null default '',
  notes text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.lessons to authenticated;
grant all on public.lessons to service_role;
alter table public.lessons enable row level security;
create policy "tutor all lessons" on public.lessons for all to authenticated using (public.has_role(auth.uid(),'tutor')) with check (public.has_role(auth.uid(),'tutor'));
create policy "student own lessons" on public.lessons for select to authenticated using (student_id = auth.uid());

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  url text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.materials to authenticated;
grant all on public.materials to service_role;
alter table public.materials enable row level security;
create policy "tutor all materials" on public.materials for all to authenticated using (public.has_role(auth.uid(),'tutor')) with check (public.has_role(auth.uid(),'tutor'));
create policy "student materials" on public.materials for select to authenticated using (student_id is null or student_id = auth.uid());

create table public.homework (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  submission text,
  submitted_at timestamptz,
  feedback text,
  grade text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.homework to authenticated;
grant all on public.homework to service_role;
alter table public.homework enable row level security;
create policy "tutor all homework" on public.homework for all to authenticated using (public.has_role(auth.uid(),'tutor')) with check (public.has_role(auth.uid(),'tutor'));
create policy "student read homework" on public.homework for select to authenticated using (student_id = auth.uid());
create policy "student submit homework" on public.homework for update to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());

-- students may only change submission fields
create or replace function public.guard_homework_update()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not public.has_role(auth.uid(),'tutor') then
    if new.title is distinct from old.title or new.description is distinct from old.description
       or new.due_date is distinct from old.due_date or new.feedback is distinct from old.feedback
       or new.grade is distinct from old.grade or new.student_id is distinct from old.student_id then
      raise exception 'Uczeń może zmienić tylko swoje rozwiązanie';
    end if;
  end if;
  return new;
end $$;
create trigger homework_guard before update on public.homework for each row execute function public.guard_homework_update();

-- students may not edit notes on their profile? allow; but prevent changing id/email is fine.