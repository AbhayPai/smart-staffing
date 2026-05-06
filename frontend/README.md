## Smart Staffing Frontend

## Local
```
npm run dev
```

## Supabase Profiles Table Statement
```
create table
  public.profiles (
    id uuid not null references auth.users on delete cascade,
    full_name text,
    email text unique,
    avatar_url text,
    primary key (id)
  );

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles for
select
  using (true);

create policy "Users can insert their own profile." on profiles for insert
with
  check (auth.uid () = id);

create policy "Users can update own profile." on profiles
for update
  using (auth.uid () = id);

create function public.handle_new_user () returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'email'
    );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users for each row
execute procedure public.handle_new_user ();
```

## File Checksum Table
```
create table file_checksums (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fid text not null,
  checksum text not null,
  filename text not null,
  created_at timestamp with time zone default now(),
  unique (checksum)
);

create index file_checksums_user_id_idx on file_checksums(user_id);
create index file_checksums_checksum_idx on file_checksums(checksum);

create policy "Allow users to insert their own checksums"
on file_checksums
for insert
to authenticated
with check (auth.uid() = user_id);
```

## Storage RLS Policy
```
create policy "Allow authenticated users to list files in resumes"
on storage.objects
for select
to authenticated
using (bucket_id = 'resumes');

create policy "Allow uploads to resumes"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'resumes');

```


```
REPLACE:
  {{ .ConfirmationURL }}

WITH:
  {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup
```
