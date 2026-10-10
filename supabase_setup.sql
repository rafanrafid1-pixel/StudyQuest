-- Run this in Supabase SQL Editor for StudyQuest V7.4.
create table if not exists public.studyquest_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.studyquest_data enable row level security;
revoke all on public.studyquest_data from anon;
grant select, insert, update on public.studyquest_data to authenticated;

drop policy if exists "Users can read their own StudyQuest data" on public.studyquest_data;
create policy "Users can read their own StudyQuest data"
  on public.studyquest_data for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own StudyQuest data" on public.studyquest_data;
create policy "Users can insert their own StudyQuest data"
  on public.studyquest_data for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own StudyQuest data" on public.studyquest_data;
create policy "Users can update their own StudyQuest data"
  on public.studyquest_data for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
