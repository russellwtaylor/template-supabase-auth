# Supabase Auth + Next.js Boilerplate

A minimal, cloneable boilerplate for Next.js 16 with Supabase email/password authentication. Use it as a starting point for new projects or as a reference for adding auth to an existing app.

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- [React 19](https://react.dev/)
- [Supabase](https://supabase.com/) (Auth)
- [Tailwind CSS v4](https://tailwindcss.com/)
- TypeScript

## What's Included

- Email/password sign up and login
- Session management via proxy (automatic token refresh)
- Protected routes (unauthenticated users redirected to `/login`)
- Email confirmation callback handler
- Server actions for auth (no client-side JavaScript required for forms)

## File Structure

```
├── proxy.ts                     # Session refresh + route protection
├── lib/supabase/
│   ├── client.ts                # Browser client (for client components)
│   ├── server.ts                # Server client (for server components/actions)
│   └── proxy.ts                 # updateSession() helper for the proxy
├── app/
│   ├── actions.ts               # Server actions: login, signup, signout
│   ├── page.tsx                 # Landing page
│   ├── login/page.tsx           # Login form
│   ├── signup/page.tsx          # Signup form
│   ├── dashboard/page.tsx       # Protected page (requires auth)
│   └── auth/confirm/route.ts    # Email confirmation callback
└── .env.local.example           # Environment variable template
```

### Key files

| Path                        | Purpose                                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.ts` (root)           | Next.js 16 proxy; runs session refresh and route checks. Matcher limits which paths run through it.                                                |
| `lib/supabase/proxy.ts`     | `updateSession()` – creates server client, calls `getClaims()` to refresh session, redirects unauthenticated users to `/login` on protected paths. |
| `lib/supabase/server.ts`    | Server Supabase client (used in Server Components and server actions).                                                                             |
| `lib/supabase/client.ts`    | Browser Supabase client (for client components if needed).                                                                                         |
| `app/auth/confirm/route.ts` | GET handler for email confirmation links (`token_hash` + `type`); supports `?next=` for redirect after confirm.                                     |
| `app/actions.ts`            | Server actions: `login`, `signup`, `signout`.                                                                                                      |

## Getting Started

### Option A: Clone This Template

```bash
git clone <repo-url> my-app
cd my-app
cp .env.local.example .env.local
# Fill in your Supabase credentials (see step 2 below)
npm install
npm run dev
```

### Option B: Add Auth to an Existing Next.js 16 Project

Install the Supabase dependencies:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

Then copy these files into your project:

1. `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/proxy.ts`
2. `proxy.ts` (root level)
3. `app/actions.ts`
4. `app/login/page.tsx`, `app/signup/page.tsx`
5. `app/auth/confirm/route.ts`
6. `app/dashboard/page.tsx` (or adapt for your own protected page)

Create a `.env.local` with your Supabase credentials (see below).

---

### 1. Create a Supabase Project

Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.

### 2. Set Up Environment Variables

Copy the example env file and fill in your Supabase project details:

```bash
cp .env.local.example .env.local
```

Find your credentials in your Supabase project under **Settings > API**:

| Variable                               | Where to find it                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | Project URL (e.g. `https://abc123.supabase.co`)                                                  |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key under API Keys. For older projects, use your `anon` key — it works the same way. |

### 3. Configure Supabase Auth

In your Supabase dashboard, go to **Authentication > URL Configuration** and set:

- **Site URL**: `http://localhost:3000` (or your production URL)
- **Redirect URLs**: Add `http://localhost:3000/**` (allows all local callback paths)

For production, add your deployed URL to the redirect allowlist as well (e.g. `https://myapp.com/**`).

### 4. Configure Email Templates (Optional)

By default, Supabase sends a confirmation email with a link like:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

If you've customized your email templates, make sure the confirmation link points to `/auth/confirm` with `token_hash` and `type` query params. You can configure this under **Authentication > Email Templates** in the Supabase dashboard.

### 5. Install and Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How Auth Works

### Session Management

The root `proxy.ts` runs on every request. It calls `updateSession()` which:

1. Creates a Supabase client using cookies from the request
2. Calls `getClaims()` to refresh the session token
3. Writes updated cookies back to the response
4. Redirects unauthenticated users away from protected routes

This is critical — without the proxy, server-side Supabase clients won't have valid sessions and users may be randomly logged out.

### Public vs. Protected Routes

**Public routes** (no auth required): `/`, `/login`, `/signup`, `/auth/*`

**All other routes** are protected — unauthenticated users are redirected to `/login`.

When you add new protected or auth-related routes (e.g. `/settings`, `/account`), add them to the **matcher** array in root `proxy.ts` so the proxy runs on those paths. To change which routes are considered public (no redirect), edit `lib/supabase/proxy.ts`:

```ts
// In the updateSession() function, modify these conditions:
if (
	!user &&
	!request.nextUrl.pathname.startsWith("/login") &&
	!request.nextUrl.pathname.startsWith("/signup") &&
	!request.nextUrl.pathname.startsWith("/auth") &&
	request.nextUrl.pathname !== "/"
) {
	// redirect to login
}
```

### Sign Up Flow

1. User submits the signup form at `/signup`
2. The `signup` server action calls `supabase.auth.signUp()`
3. Supabase sends a confirmation email to the user
4. User clicks the link, which hits `/auth/confirm`
5. The route handler calls `verifyOtp()` to confirm the email
6. On success, the user is redirected to `/dashboard`

### Login Flow

1. User submits the login form at `/login`
2. The `login` server action calls `supabase.auth.signInWithPassword()`
3. On success, the user is redirected to `/dashboard`

### Sign Out

The dashboard has a sign out button that calls the `signout` server action, which clears the session and redirects to `/login`.

## Extending

### Add More Protected Pages

Any route not listed as public in `lib/supabase/proxy.ts` is automatically protected. Just create new pages under `app/` — the proxy handles the redirect.

### Access User Data in Server Components

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function MyPage() {
	const supabase = await createClient();
	const { data, error } = await supabase.auth.getClaims();

	if (error || !data?.claims) {
		redirect("/login");
	}

	const email = data.claims.email as string;

	return <p>Hello, {email}</p>;
}
```

### Access User Data in Client Components

```tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function UserGreeting() {
	const [email, setEmail] = useState<string | null>(null);

	useEffect(() => {
		const supabase = createClient();
		supabase.auth.getUser().then(({ data }) => {
			setEmail(data.user?.email ?? null);
		});
	}, []);

	if (!email) return null;
	return <p>Hello, {email}</p>;
}
```

### Add OAuth Providers

1. Enable providers in your Supabase dashboard under **Authentication > Providers**
2. Add a button that calls `supabase.auth.signInWithOAuth()`:

```tsx
"use client";

import { createClient } from "@/lib/supabase/client";

export function GitHubLoginButton() {
	const handleLogin = () => {
		const supabase = createClient();
		supabase.auth.signInWithOAuth({
			provider: "github",
			options: { redirectTo: `${location.origin}/auth/callback` },
		});
	};

	return <button onClick={handleLogin}>Sign in with GitHub</button>;
}
```

### Query the Supabase Database

The same Supabase client used for auth can query your database:

```tsx
const supabase = await createClient();
const { data: posts } = await supabase.from("posts").select("*");
```

See the [Supabase docs](https://supabase.com/docs) for more on database, storage, and realtime features.

### Optional next steps

- **Forgot password** – add a page that calls `resetPasswordForEmail()` and use `/auth/confirm` (or a dedicated route) for the reset link.
- **Better errors** – map Supabase `error.code` / `error.message` to user-facing messages on login/signup.
- **Email redirect** – set `emailRedirectTo` in `signUp()` and `resetPasswordForEmail()` so confirmation/reset links point at your app.
- **OAuth** – see [Add OAuth Providers](#add-oauth-providers) above for Google, GitHub, etc.
