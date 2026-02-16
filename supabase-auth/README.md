# Supabase Auth + Next.js

Minimal boilerplate for email/password authentication with [Supabase](https://supabase.com) and Next.js (App Router). Uses `@supabase/ssr` for server-side session handling.

## What’s included

- **Email/password** sign up, sign in, sign out
- **Email confirmation** via link → `/auth/confirm`
- **Session refresh** and **route protection** via the Next.js **proxy** (not middleware; Next.js 16+ uses `proxy.ts` / `proxy()`)
- **Protected route** example: `/dashboard` redirects to `/login` when unauthenticated

## Setup

### 1. Supabase project

1. Create a project at [app.supabase.com](https://app.supabase.com).
2. In **Authentication** → **Providers**, enable **Email** (and optionally “Confirm email”).
3. In **Project settings** → **API**, copy the **Project URL** and **anon public** key.

### 2. Environment variables

Copy the example env file and set your Supabase values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

In the Supabase dashboard, under **Authentication** → **URL Configuration**, set **Site URL** (e.g. `http://localhost:3000` for dev) and add **Redirect URLs** (e.g. `http://localhost:3000/auth/confirm`) so confirmation and magic links work.

### 3. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Sign up** / **Log in** and check your email if confirmation is enabled.

---

## Using this in a new Next.js app

When you copy this auth setup into another Next.js app:

1. **Copy these pieces**
    - `lib/supabase/server.ts` – server Supabase client
    - `lib/supabase/client.ts` – browser Supabase client
    - `lib/supabase/proxy.ts` – session refresh + redirect logic
    - Root `proxy.ts` – Next.js 16 proxy entry (calls `updateSession`; **do not** rename to `middleware.ts` – the proxy convention is the current approach)
    - `app/auth/confirm/route.ts` – handles email confirmation / OTP callback
    - `app/actions.ts` – server actions for `login`, `signup`, `signout`
    - Your login/signup/dashboard pages and any protected layouts

2. **Proxy matcher**  
   The proxy runs only on routes that need session refresh or protection. In `proxy.ts`:

    ```ts
    matcher: ["/", "/login", "/signup", "/dashboard", "/auth/:path*"],
    ```

    **When you add new protected or auth-related routes** (e.g. `/settings`, `/account`), add them to the `matcher` array so the proxy runs there too.

3. **Env in the new app**  
   Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the new app’s `.env.local` (and configure redirect URLs in Supabase for that app’s origin).

---

## Key files

| Path                        | Purpose                                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.ts` (root)           | Next.js 16 proxy; runs session refresh and route checks. Matcher limits which paths run through it.                                                |
| `lib/supabase/proxy.ts`     | `updateSession()` – creates server client, calls `getClaims()` to refresh session, redirects unauthenticated users to `/login` on protected paths. |
| `lib/supabase/server.ts`    | Server Supabase client (used in Server Components and server actions).                                                                             |
| `lib/supabase/client.ts`    | Browser Supabase client (for client components if needed).                                                                                         |
| `app/auth/confirm/route.ts` | GET handler for email confirmation links (`token_hash` + `type`); supports `?next=` for redirect after confirm.                                    |
| `app/actions.ts`            | Server actions: `login`, `signup`, `signout`.                                                                                                      |

---

## Optional next steps

- **Forgot password** – add a page that calls `resetPasswordForEmail()` and use `/auth/confirm` (or a dedicated route) for the reset link.
- **Better errors** – map Supabase `error.code` / `error.message` to user-facing messages on login/signup.
- **Email redirect** – set `emailRedirectTo` in `signUp()` and `resetPasswordForEmail()` so confirmation/reset links point at your app.
- **OAuth** – add “Sign in with Google” (or GitHub, etc.) via `signInWithOAuth()` and a callback route.
