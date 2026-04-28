# Luminary Auth — Next.js + Supabase

Production-ready auth with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Quick Start

```bash
npm install
cp .env.local.example .env.local   # add your Supabase keys
npm run dev
```

## Supabase Setup

1. Create a project at supabase.com
2. Run `supabase/schema.sql` in the SQL Editor
3. Copy keys from Dashboard → Project Settings → API into `.env.local`

## Profiles Table

| Column | Type | Notes |
|---|---|---|
| id | uuid | FK to auth.users |
| email | text | Unique |
| first_name | text | Required |
| middle_name | text | Optional |
| last_name | text | Required |
| department | enum | Engineering, Design, etc. |
| role | enum | admin, manager, engineer, etc. |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto-updated |

## Routes

- `/login` — Sign in
- `/signup` — Create account (all profile fields)
- `/dashboard` — Protected profile view

## Project Structure

```
lib/auth.ts              — signUp / signIn / signOut
lib/supabase/client.ts   — browser client
lib/supabase/server.ts   — server client
types/user.ts            — TypeScript types
supabase/schema.sql      — DB migration
middleware.ts            — session refresh + route guards
```
