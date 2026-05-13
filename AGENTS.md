# FiberNet Conciliador - Agent Guidance

## Stack
- Next.js 15 (App Router)
- React 19
- Supabase (Auth + Database)

## Run Commands
- `npm run dev` - Development server (port 3000/3001)
- `npm run build` - Production build

## Auth Setup
1. Create Supabase project at supabase.com
2. Copy URL and anon key to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```
3. Enable Email Auth in Supabase dashboard

## Project Structure
- `app/` - Next.js App Router pages
- `components/` - React components
- `lib/supabase/` - Supabase client utilities
- `middleware.js` - Route protection

## Auth Flow
- `/login` - Login/signup page
- All other routes protected by `middleware.js`
- Client: use `lib/supabase/client.js`
- Server: use `lib/supabase/server.js`

## Important
- `@/` alias maps to project root (configured in `jsconfig.json`)
- Supabase auth cookies handled automatically by middleware