# Supabase Auth + Next.js Boilerplate

A minimal, cloneable boilerplate for Next.js 16 with Supabase authentication. Includes email/password auth, Google OAuth, password reset, a full profile management page, and TOTP two-factor authentication — all wired up and ready to extend.

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- [React 19](https://react.dev/)
- [Supabase](https://supabase.com/) (Auth, Database, Storage)
- [Tailwind CSS v4](https://tailwindcss.com/)
- TypeScript

## What's Included

- ✅ Email/password sign up and login
- ✅ **Google OAuth authentication** (sign in/up with Google) — [Setup Guide](#google-oauth-setup-guide)
- ✅ Password reset flow with email verification
- ✅ Session management via proxy (automatic token refresh)
- ✅ Protected routes (unauthenticated users redirected to `/login`)
- ✅ Email confirmation callback handler
- ✅ OAuth callback handler for third-party auth
- ✅ Server actions for auth (no client-side JavaScript required for forms)
- ✅ Input validation and user-friendly error messages
- ✅ Security best practices (`getUser()` for auth verification, input validation)
- ✅ **Profile management** — update display name, email, avatar, phone number — [Setup Guide](#profile-management-setup)
- ✅ **Avatar upload** — Supabase Storage with per-user folders and public CDN URLs
- ✅ **TOTP two-factor authentication** — authenticator app enrollment, login challenge, and unenrollment — [Setup Guide](#totp-2fa-setup)
- ✅ **Account deletion** — permanent self-serve account deletion with confirmation step — [Setup Guide](#account-deletion-setup)

## File Structure

```
├── proxy.ts                     # Session refresh + route protection
├── lib/supabase/
│   ├── client.ts                # Browser client (for client components)
│   ├── server.ts                # Server client (for server components/actions)
│   └── proxy.ts                 # updateSession() helper for the proxy
├── app/
│   ├── actions/
│   │   ├── index.ts                      # Barrel re-export (all actions importable from @/app/actions)
│   │   ├── utils.ts                      # Shared helpers: validation, auth checks, error mapping
│   │   ├── auth.ts                       # login, signup, signout
│   │   ├── profile.ts                    # updateProfile, updateEmail, updateAvatar, updatePhone
│   │   ├── password.ts                   # requestPasswordReset, sendPasswordReset, updatePassword
│   │   ├── sessions.ts                   # revokeSession, revokeOtherSessions
│   │   └── account.ts                    # deleteAccount
│   ├── components/
│   │   ├── google-auth-button.tsx        # Google OAuth login button (client component)
│   │   ├── avatar-upload.tsx             # Avatar upload with Storage (client component)
│   │   ├── mfa-challenge.tsx             # TOTP code entry for login (client component)
│   │   ├── totp-manager.tsx              # TOTP enrollment/unenrollment UI (client component)
│   │   └── account-delete-button.tsx     # Account deletion with inline confirmation (client component)
│   ├── page.tsx                          # Landing page
│   ├── login/page.tsx                    # Login form (with Google OAuth)
│   ├── signup/page.tsx                   # Signup form (with Google OAuth)
│   ├── dashboard/page.tsx                # Protected page (requires auth)
│   ├── forgot-password/page.tsx          # Password reset request form
│   ├── update-password/page.tsx          # New password entry form
│   ├── profile/
│   │   ├── page.tsx                      # Profile management page (name, email, avatar, phone, 2FA)
│   │   └── totp/page.tsx                 # TOTP enrollment/management page
│   ├── mfa/page.tsx                      # MFA login challenge page (post-login TOTP verification)
│   └── auth/
│       ├── confirm/route.ts              # Email confirmation callback
│       ├── callback/route.ts             # OAuth callback handler
│       └── reset-password/route.ts       # Password reset verification callback
└── .env.local.example                    # Environment variable template
```

### Key files

| Path                                       | Purpose                                                                                                                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.ts` (root)                          | Next.js 16 proxy; runs session refresh and route checks. Matcher limits which paths run through it.                                                                         |
| `lib/supabase/proxy.ts`                    | `updateSession()` – creates server client, calls `getUser()` to verify session, redirects unauthenticated users to `/login` on protected paths.                             |
| `lib/supabase/server.ts`                   | Server Supabase client (used in Server Components and server actions).                                                                                                      |
| `lib/supabase/client.ts`                   | Browser Supabase client (for client components, used by OAuth and MFA flows).                                                                                               |
| `app/actions/`                             | Server actions, split by domain. Barrel `index.ts` re-exports everything so imports use `@/app/actions`. |
| `app/actions/utils.ts`                     | Shared helpers: validation (`isValidEmail`, `isValidPassword`), `requireAuth()`, `mapSupabaseError()`, `rethrowIfRedirect()`. |
| `app/actions/auth.ts`                      | `login`, `signup`, `signout`. |
| `app/actions/profile.ts`                   | `updateProfile`, `updateEmail`, `updateAvatar`, `updatePhone`. |
| `app/actions/password.ts`                  | `requestPasswordReset`, `sendPasswordReset`, `updatePassword`. |
| `app/actions/sessions.ts`                  | `revokeSession`, `revokeOtherSessions`. |
| `app/actions/account.ts`                   | `deleteAccount` (uses admin client). |
| `app/components/google-auth-button.tsx`    | Google OAuth login button component; handles OAuth flow with `signInWithOAuth()`.                                                                                           |
| `app/components/avatar-upload.tsx`         | Client component; validates file size, uploads to Supabase Storage, calls `updateAvatar` server action.                                                                     |
| `app/components/mfa-challenge.tsx`         | Client component; `listFactors` → `challenge` → `verify` → redirect to `/dashboard`. Used on the `/mfa` page after password login.                                          |
| `app/components/totp-manager.tsx`          | Client component; handles TOTP enrollment (QR code display), code verification, and unenrollment with confirmation.                                                         |
| `app/components/account-delete-button.tsx` | Client component; shows a "Delete account" button with an inline confirmation step before calling the `deleteAccount` server action.                                        |
| `lib/supabase/admin.ts`                    | Creates a Supabase client using the service role key for admin operations (account deletion). Never imported client-side.                                                   |
| `app/auth/confirm/route.ts`                | GET handler for email confirmation links (`token_hash` + `type`); supports `?next=` for redirect after confirm.                                                             |
| `app/auth/callback/route.ts`               | GET handler for OAuth callbacks; exchanges code for session and redirects to dashboard.                                                                                     |
| `app/auth/reset-password/route.ts`         | GET handler for password reset links; supports multiple auth flows (PKCE, token hash, session-based).                                                                       |

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
3. `app/actions/` (the entire directory)
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

| Variable                               | Where to find it                                                                                 | Required for                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Project URL (e.g. `https://abc123.supabase.co`)                                                  | All features                  |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key under API Keys. For older projects, use your `anon` key — it works the same way. | All features                  |
| `NEXT_PUBLIC_SITE_URL`                 | Your app's URL (e.g. `http://localhost:3000` for local dev, `https://myapp.com` for production)  | Password reset, avatar upload |

### 3. Configure Supabase Auth

In your Supabase dashboard, configure authentication settings:

#### A. URL Configuration

Go to **Authentication > URL Configuration** and set:

- **Site URL**: `http://localhost:3000` (for local development)
    - For production, change this to your deployed URL (e.g. `https://myapp.com`)
- **Redirect URLs**: Add the following URLs to the allowlist:
    - `http://localhost:3000/**` (allows all local callback paths)
    - `http://localhost:3000/auth/reset-password` (password reset callback)
    - For production, add your production URLs as well (e.g. `https://myapp.com/**`)

#### B. Email Auth Settings

Go to **Authentication > Providers** and ensure **Email** is enabled:

- ✅ Enable email provider
- ✅ Confirm email (recommended for production)
- Set **Minimum Password Length** to `6` or higher

#### C. Email Rate Limiting (Optional)

Go to **Authentication > Rate Limits** to prevent abuse:

- Set rate limits for signup, login, and password reset requests
- Recommended: 5-10 requests per hour per IP for sensitive operations

### 4. Configure Email Templates (Recommended)

Go to **Authentication > Email Templates** in the Supabase dashboard and update the templates for better security and consistency.

#### Confirm signup template:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your email:</p>
<p>
	<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email"
		>Confirm your email</a
	>
</p>
```

#### Reset Password template:

**Option 1: Token Hash (Recommended)** - More explicit control and better error handling:

```html
<h2>Reset Password</h2>

<p>Follow this link to reset your password:</p>
<p>
	<a
		href="{{ .SiteURL }}/auth/reset-password?token_hash={{ .TokenHash }}&type=recovery"
		>Reset Password</a
	>
</p>
```

**Option 2: Confirmation URL** - Simpler but less control:

```html
<h2>Reset Password</h2>

<p>Follow this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

The token hash approach is recommended because it:

- Gives you explicit control over the URL structure
- Provides better error handling capabilities
- Is consistent with the email confirmation flow

### 5. Set Up Profile Management (Required for profile page and avatars)

See the full [Profile Management Setup](#profile-management-setup) section for SQL and Storage configuration.

### 6. Set Up TOTP Two-Factor Authentication (Optional)

See the [TOTP 2FA Setup](#totp-2fa-setup) section.

### 7. Configure Google OAuth (Optional but Recommended)

Google OAuth allows users to sign in with their Google account. Follow the detailed setup guide in the [Google OAuth Setup](#google-oauth-setup-guide) section below.

### 8. Install and Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying to Vercel

Vercel detects Next.js automatically — no special framework config is needed. The main steps are setting environment variables, then updating Supabase (and Google OAuth if you're using it) to accept your production domain.

### Step 1: Push Your Code to Git

Vercel deploys from a Git repository (GitHub, GitLab, or Bitbucket). Make sure your code is pushed to a repo before continuing.

### Step 2: Import the Project in Vercel

**Option A — Vercel Dashboard (recommended):**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"** and select your repo
3. Vercel will detect Next.js automatically — leave the build settings as-is
4. **Do not deploy yet** — add environment variables first (Step 3)

**Option B — Vercel CLI:**

```bash
npm install -g vercel
vercel
```

Follow the prompts. When asked about environment variables, add them as shown in Step 3.

### Step 3: Set Environment Variables

In the Vercel project settings under **Settings → Environment Variables**, add:

| Variable                               | Value                              | Notes                                                                                 |
| -------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | `https://your-project.supabase.co` | From Supabase → Settings → API                                                        |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `eyJ...`                           | Publishable / anon key from Supabase → Settings → API                                 |
| `NEXT_PUBLIC_SITE_URL`                 | `https://your-app.vercel.app`      | Your production URL — update after first deploy if you don't have a custom domain yet |

Set all three variables for the **Production** environment. If you want password reset and avatar uploads to work in preview deployments too, add them to **Preview** as well (using the appropriate preview URL or a wildcard).

> **Tip:** After your first deploy, Vercel will show you the assigned `.vercel.app` URL. If it differs from what you entered for `NEXT_PUBLIC_SITE_URL`, update the variable and redeploy.

### Step 4: Deploy

Click **Deploy** in the dashboard, or run `vercel --prod` from the CLI. Vercel will build and deploy the app.

### Step 5: Update Supabase URL Configuration

Your Supabase project needs to know about the production domain for redirects (email confirmation, password reset, OAuth callbacks) to work correctly.

In **Supabase Dashboard → Authentication → URL Configuration**:

1. Update **Site URL** to your production URL:

    ```
    https://your-app.vercel.app
    ```

2. Add your production domain to **Redirect URLs**:

    ```
    https://your-app.vercel.app/**
    ```

3. If you want redirects to work in Vercel preview deployments too, add a wildcard for your Vercel preview URLs:
    ```
    https://*-your-username.vercel.app/**
    ```

### Step 6: Update Google OAuth (if using Google)

Production deployments need the production domain registered in Google Cloud Console.

In **Google Cloud Console → APIs & Services → Credentials**, edit your OAuth client:

1. Under **Authorized JavaScript origins**, add:

    ```
    https://your-app.vercel.app
    ```

2. The **Authorized redirect URIs** entry (`https://YOUR_REF.supabase.co/auth/v1/callback`) does **not** need to change — it points to Supabase, not your app.

3. Save.

### Step 7: Add a Custom Domain (Optional)

In **Vercel Dashboard → Settings → Domains**, add your custom domain. Then:

1. Update `NEXT_PUBLIC_SITE_URL` in Vercel environment variables to your custom domain (e.g. `https://myapp.com`)
2. Update **Site URL** in Supabase to the custom domain
3. Add the custom domain to Supabase **Redirect URLs**: `https://myapp.com/**`
4. Add the custom domain to Google Cloud Console **Authorized JavaScript origins** (if using Google OAuth)
5. Redeploy (`vercel --prod` or push a new commit)

### Preview Deployments

Vercel creates a unique URL for every branch and pull request. Auth flows that depend on `NEXT_PUBLIC_SITE_URL` (password reset emails, avatar uploads) will use the production URL by default, since that's what the variable is set to.

To make password reset work correctly in preview deployments, you can use Vercel's [System Environment Variables](https://vercel.com/docs/projects/environment-variables/system-environment-variables) and set `NEXT_PUBLIC_SITE_URL` to `$VERCEL_URL` for the Preview environment. Note that `VERCEL_URL` is not prefixed with `https://`, so you'd need to handle that in your code, or simply leave it pointing to production (password reset still works — it just redirects back to the production URL).

### Checklist

- [ ] Environment variables set in Vercel (Production + Preview)
- [ ] Supabase Site URL updated to production domain
- [ ] Supabase Redirect URLs include production domain (and optionally preview wildcard)
- [ ] Google OAuth Authorized JavaScript origins includes production domain
- [ ] `NEXT_PUBLIC_SITE_URL` matches the deployed URL exactly

---

## Profile Management Setup

The `/profile` page lets users update their display name, email address, phone number, and avatar, and send themselves a password reset link. It requires a `profiles` table in Supabase and a Storage bucket for avatars.

### Step 1: Run the SQL Migration

In **Supabase Dashboard → SQL Editor**, run:

```sql
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  phone text,
  updated_at timestamp with time zone
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### Step 2: Create the Avatars Storage Bucket

1. In **Supabase Dashboard → Storage**, click **"New bucket"**
2. Name it `avatars`, toggle it **Public**, click **Save**

Then in **SQL Editor**, add the storage policies:

```sql
create policy "Authenticated users can upload avatars"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Authenticated users can update own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Avatars are publicly viewable"
  on storage.objects for select to public
  using (bucket_id = 'avatars');
```

### Verification

1. Run the SQL → confirm `profiles` table appears in Supabase Table Editor
2. Sign up a new test user → confirm a row auto-appears in `profiles` (trigger worked)
3. Visit `/profile` while logged in → page loads with email pre-filled
4. Update display name → confirm it persists on page refresh
5. Upload an avatar → confirm image appears and persists after refresh

---

## TOTP 2FA Setup

TOTP (Time-based One-Time Password) lets users secure their account with an authenticator app (Google Authenticator, Authy, 1Password, etc.). No SMS or additional dependencies needed — Supabase handles the QR code and secret generation.

### Step 1: Enable MFA in Supabase

1. Go to **Supabase Dashboard → Authentication → MFA**
2. Toggle **TOTP** to **Enabled**
3. Save

### How It Works

**Enrollment** (from `/profile/totp`):

1. User clicks "Enable two-factor authentication"
2. A QR code is displayed (generated by Supabase's `mfa.enroll()`)
3. User scans with their authenticator app, or manually enters the setup key
4. User enters the 6-digit code to confirm — triggers `mfa.challenge()` + `mfa.verify()`
5. TOTP factor is marked verified; 2FA is now active

**Login with 2FA**:

1. User logs in with email + password
2. `login` server action checks `mfa.getAuthenticatorAssuranceLevel()`
3. If `nextLevel === 'aal2'`, user is redirected to `/mfa` instead of `/dashboard`
4. User enters 6-digit code → `mfa.challenge()` + `mfa.verify()` → redirected to `/dashboard`

**Disabling 2FA** (from `/profile/totp`):

1. User clicks "Disable two-factor authentication"
2. User enters current 6-digit code to confirm
3. `mfa.challenge()` + `mfa.verify()` elevates session to AAL2
4. `mfa.unenroll()` removes the factor

### A Note on AAL Enforcement

The current proxy only checks that a session exists — it does not enforce that users with 2FA enrolled must be at AAL2 to access protected routes. In the normal login flow, users with TOTP are always redirected through `/mfa`, but a user who bypasses login (e.g. via a direct URL) could still access routes at AAL1.

To enforce AAL2 on all protected routes, add an AAL check to `lib/supabase/proxy.ts`:

```ts
const { data: aalData } =
	await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
if (user && aalData?.nextLevel === "aal2" && aalData?.currentLevel !== "aal2") {
	const url = request.nextUrl.clone();
	url.pathname = "/mfa";
	return NextResponse.redirect(url);
}
```

---

## How Auth Works

### Session Management

The root `proxy.ts` runs on every request. It calls `updateSession()` which:

1. Creates a Supabase client using cookies from the request
2. Calls `getUser()` to verify the session with Supabase servers
3. Writes updated cookies back to the response
4. Redirects unauthenticated users away from protected routes

**Security Note:** This implementation uses `getUser()` instead of `getClaims()` for route protection. According to [Supabase best practices](https://supabase.com/docs/guides/auth/server-side/nextjs), `getUser()` validates the session with Supabase auth servers on every request, while `getClaims()` only performs local JWT validation and doesn't verify if the session is still valid.

This is critical — without the proxy, server-side Supabase clients won't have valid sessions and users may be randomly logged out.

### Public vs. Protected Routes

**Public routes** (no auth required): `/`, `/login`, `/signup`, `/forgot-password`, `/auth/*`

**Protected routes** (auth required): `/dashboard`, `/profile`, `/profile/totp`, `/mfa`, `/update-password`, and all other routes not explicitly listed as public.

Unauthenticated users attempting to access protected routes are automatically redirected to `/login`.

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
3. After success, `mfa.getAuthenticatorAssuranceLevel()` is checked
    - If the user has TOTP enabled (`nextLevel === 'aal2'`), they are redirected to `/mfa`
    - Otherwise, they go directly to `/dashboard`

### MFA Login Flow

1. User arrives at `/mfa` after password login
2. The `MfaChallenge` client component calls `mfa.listFactors()` to find their TOTP factor
3. `mfa.challenge()` creates a new challenge for the factor
4. User enters their 6-digit code; `mfa.verify()` confirms it and elevates session to AAL2
5. User is redirected to `/dashboard`

### Sign Out

The dashboard has a sign out button that calls the `signout` server action, which clears the session and redirects to `/login`.

### Password Reset Flow

1. User clicks "Forgot password?" on the login page → `/forgot-password`
2. User enters their email and submits
3. The `requestPasswordReset` server action calls `supabase.auth.resetPasswordForEmail()`
4. Supabase sends a password reset email to the user
5. User clicks the link in the email, which hits `/auth/reset-password`
6. The route handler verifies the token and creates an authenticated session
7. User is redirected to `/update-password` with `verified=true` query param
8. User enters their new password and submits
9. The `updatePassword` server action:
    - Updates the password via `supabase.auth.updateUser()`
    - Signs the user out (security best practice)
    - Redirects to `/login` with a success message
10. User logs in with their new password

**Security features:**

- Single-use reset tokens
- Token expiration (default: 1 hour)
- Forced sign-out after password change
- No email enumeration (always shows success message even if email doesn't exist)

---

## Account Deletion Setup

Account deletion uses Supabase's Admin API, which requires the service role key. This runs only in server actions and is never exposed to the client.

### 1. Add the Service Role Key

Add `SUPABASE_SERVICE_ROLE_KEY` to your `.env.local`:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Find it in: **Supabase Dashboard → Settings → API → Service role key** (secret).

> **Important:** Never use `NEXT_PUBLIC_` prefix on this key — it must stay server-side only.

### 2. How It Works

When a user clicks **Delete account** on the profile page:

1. They're shown an inline confirmation warning (cannot be undone)
2. On confirm, the `deleteAccount` server action runs:
    - Verifies the user's session with `getUser()`
    - Calls `adminClient.auth.admin.deleteUser(userId)` — this permanently removes the account from Supabase Auth
    - The `profiles` row is deleted automatically via the `ON DELETE CASCADE` foreign key set up in the SQL migration
    - Signs out the session
    - Redirects to `/login` with a confirmation message

### 3. Verify for Vercel Deployment

If deploying to Vercel, add `SUPABASE_SERVICE_ROLE_KEY` to your Vercel project's environment variables (same place as the other Supabase vars).

---

## Session Management Setup

The `/profile/sessions` page lets users view all active sessions (device info, IP, last activity) and revoke individual sessions or sign out all other sessions at once. This requires two SQL functions that safely query `auth.sessions` on behalf of the current user.

### Step 1: Run the SQL Migration

In **Supabase Dashboard → SQL Editor**, run:

```sql
-- List sessions for the currently authenticated user
create or replace function public.get_user_sessions()
returns table (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  user_agent text,
  ip text
)
language sql
security definer
set search_path = ''
as $$
  select id, created_at, updated_at, user_agent, ip::text
  from auth.sessions
  where user_id = (select auth.uid())
  order by updated_at desc;
$$;

-- Delete a single session (only if it belongs to the current user)
create or replace function public.delete_user_session(session_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.sessions
  where id = session_id
    and user_id = (select auth.uid());
$$;
```

Both functions use `SECURITY DEFINER` so they can read/write `auth.sessions` without granting direct table access to users. The `where user_id = (select auth.uid())` clause ensures users can only see and delete their own sessions.

### How It Works

- **List sessions**: The page calls `supabase.rpc('get_user_sessions')` to fetch all sessions for the authenticated user, ordered by most recently active.
- **Revoke a session**: The `revokeSession` server action calls `supabase.rpc('delete_user_session', { session_id })`, which deletes the row from `auth.sessions`. The next request from that session will be rejected as expired.
- **Sign out all others**: The `revokeOtherSessions` server action calls `supabase.auth.signOut({ scope: 'others' })`, which invalidates all sessions except the current one.
- **Current session detection**: The current session's ID (`sid` claim) is extracted from the JWT access token so it can be marked with a "This device" badge.

### Verification

1. Run the SQL → confirm the two functions appear in **Supabase Dashboard → Database → Functions**
2. Visit `/profile` → see "Active sessions" section with a "Manage sessions" link
3. Click → `/profile/sessions` shows a list of sessions with device info and IP
4. The current session is marked "This device"; other sessions have a Revoke button
5. Click Revoke → session is removed from the list; success message shown
6. "Sign out all other sessions" button appears when there are other active sessions

---

## Extending

### Add More Protected Pages

Any route not listed as public in `lib/supabase/proxy.ts` is automatically protected. Just create new pages under `app/` — the proxy handles the redirect.

### Access User Data in Server Components

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function MyPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	return <p>Hello, {user.email}</p>;
}
```

**Important:** Always use `getUser()` in Server Components and Server Actions to protect sensitive data. Never use `getClaims()` or `getSession()` for authorization checks, as they don't verify the session with Supabase servers.

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

### Query the Supabase Database

The same Supabase client used for auth can query your database:

```tsx
const supabase = await createClient();
const { data: posts } = await supabase.from("posts").select("*");
```

See the [Supabase docs](https://supabase.com/docs) for more on database, storage, and realtime features.

---

## Google OAuth Setup Guide

This template includes Google OAuth authentication out of the box. Follow these steps to enable it.

### Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)
- Your Supabase project already created

### Part 1: Google Cloud Console Setup (~5 minutes)

#### Step 1: Create a Google Cloud Project

1. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown in the top navigation bar
3. Click **"New Project"**
    - Project name: Choose a name (e.g., "My App Authentication")
    - Click **"Create"**
4. Wait for the project to be created, then select it from the project dropdown

#### Step 2: Configure OAuth Consent Screen

1. In the left sidebar, navigate to **APIs & Services** → **OAuth consent screen**
2. Choose **"External"** user type (unless you have Google Workspace, then choose "Internal")
3. Click **"Create"**
4. Fill in the required fields:
    - **App name**: Your application name (e.g., "My Awesome App")
    - **User support email**: Your email address
    - **App logo**: (Optional) Upload your app logo
    - **Application home page**: `http://localhost:3000` (update for production later)
    - **Authorized domains**: (Leave empty for now, add your production domain later)
    - **Developer contact information**: Your email address
5. Click **"Save and Continue"**
6. **Scopes** screen: Click **"Save and Continue"** (default scopes are fine)
7. **Test users** screen (for External apps): Click **"Save and Continue"**
8. **Summary** screen: Click **"Back to Dashboard"**

#### Step 3: Create OAuth Credentials

1. In the left sidebar, navigate to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Configure the OAuth client:
    - **Application type**: Select **"Web application"**
    - **Name**: Give it a descriptive name (e.g., "My App - Web Client")

4. **Authorized JavaScript origins**: Click **"Add URI"** and add:

    ```
    http://localhost:3000
    ```

    _(For production, add your production URL like `https://yourdomain.com`)_

5. **Authorized redirect URIs**: Click **"Add URI"** and add:

    ```
    https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
    ```

    **📋 How to find YOUR_PROJECT_REF:**
    - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
    - Select your project
    - Look at the browser URL or **Project Settings** → **API**
    - Your Project URL looks like: `https://abcdefghijk.supabase.co`
    - The project ref is the subdomain: `abcdefghijk`
    - So your redirect URI would be: `https://abcdefghijk.supabase.co/auth/v1/callback`

6. Click **"Create"**

7. **Important!** A modal will appear with your credentials:
    - **Client ID**: Copy this (looks like `123456789-abc123.apps.googleusercontent.com`)
    - **Client Secret**: Copy this (looks like `GOCSPX-abc123xyz`)
    - Click **"OK"** (you can always find these again in the Credentials page)

#### Step 4: Note Your Credentials

Keep these handy for the next step:

- ✅ **Client ID**
- ✅ **Client Secret**

### Part 2: Supabase Dashboard Configuration (~2 minutes)

#### Step 1: Enable Google Provider

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. In the left sidebar, navigate to **Authentication** → **Providers**
4. Scroll down to find **Google** in the provider list
5. Toggle the **Google** provider to **Enabled** (ON)

#### Step 2: Add Google OAuth Credentials

1. In the Google provider settings, you'll see two fields:
    - **Client ID (for OAuth)**: Paste the **Client ID** from Google Cloud Console
    - **Client Secret (for OAuth)**: Paste the **Client Secret** from Google Cloud Console

2. **Verify the Callback URL** shown on the page:

    ```
    https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
    ```

    This should match exactly what you entered in Google Cloud Console.

3. Click **"Save"** at the bottom of the page

#### Step 3: Verify Site URL (Important!)

1. Still in Supabase Dashboard, navigate to **Authentication** → **URL Configuration**
2. Verify **Site URL** is set to:
    - Development: `http://localhost:3000`
    - Production: `https://yourdomain.com`
3. The **Redirect URLs** section should already include the wildcard pattern `http://localhost:3000/**`

### Part 3: Test Google OAuth (~30 seconds)

1. Open [http://localhost:3000/login](http://localhost:3000/login) in your browser
2. Click the **"Continue with Google"** button
3. Complete the Google OAuth flow
4. You should be redirected to `/dashboard` with an authenticated session

### Production Setup

When deploying to production, update these settings:

#### Google Cloud Console

1. Go to **APIs & Services** → **Credentials**
2. Edit your OAuth client
3. Add your production URLs:
    - **Authorized JavaScript origins**: Add `https://yourdomain.com`
    - **Authorized redirect URIs**: Already has `https://YOUR_REF.supabase.co/auth/v1/callback`
4. Save

#### Supabase Dashboard

1. Go to **Authentication** → **URL Configuration**
2. Update **Site URL** to your production domain: `https://yourdomain.com`
3. Add your production domain to **Redirect URLs**: `https://yourdomain.com/**`

### How It Works

1. User clicks "Continue with Google"
2. `GoogleAuthButton` component calls `supabase.auth.signInWithOAuth()`
3. User is redirected to Google's OAuth consent screen
4. After approval, Google redirects to Supabase's callback URL
5. Supabase verifies the OAuth code and creates a session
6. Supabase redirects to your app's `/auth/callback` route
7. The callback handler exchanges the code for a session
8. User is redirected to `/dashboard` with authenticated session

### Security Features

- ✅ **PKCE flow** (Proof Key for Code Exchange) for enhanced security
- ✅ **HTTP-only cookies** - Session tokens not accessible via JavaScript
- ✅ **Server-side session validation** - Uses `getUser()` to verify with Supabase servers
- ✅ **Email pre-verified** - Google-authenticated users don't need email confirmation
- ✅ **Automatic token refresh** - Handled by middleware

### Troubleshooting

#### Error: "redirect_uri_mismatch"

**Cause:** The redirect URI in your Google OAuth client doesn't match the one Supabase is using.

**Solution:**

1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Verify the redirect URI is **exactly**: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
4. Note: It must be the Supabase URL, not your app's URL
5. Save and try again

#### Error: "Access blocked: This app's request is invalid"

**Cause:** OAuth consent screen is not properly configured.

**Solution:**

1. Go to Google Cloud Console → **APIs & Services** → **OAuth consent screen**
2. Verify all required fields are filled in
3. Make sure the app is published (or you're added as a test user for External apps)

#### Error: "OAuth provider is not enabled"

**Cause:** Google provider is not enabled in Supabase or credentials are missing.

**Solution:**

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Verify Google is toggled ON
3. Verify Client ID and Client Secret are saved
4. Click "Save" again to ensure changes persist

#### Google OAuth works locally but not in production

**Cause:** Production URLs not configured in Google Cloud Console.

**Solution:**

1. Add your production domain to Google Cloud Console:
    - Authorized JavaScript origins: `https://yourdomain.com`
2. Update Supabase Site URL to production domain
3. Clear your browser cache and try again

### Add Other OAuth Providers (GitHub, Microsoft, etc.)

The Google OAuth implementation can be easily extended to support other providers. Here's how:

**Step 1: Enable the Provider in Supabase**

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Find the provider you want (GitHub, Microsoft, Azure, etc.)
3. Toggle it ON and configure the required credentials (similar to Google setup)

**Step 2: Create an Auth Button Component**

Create a new component similar to `GoogleAuthButton`. For example, for GitHub:

```tsx
// app/components/github-auth-button.tsx
"use client";

import { createClient } from "@/lib/supabase/client";

export function GitHubAuthButton() {
	const handleLogin = async () => {
		const supabase = createClient();
		await supabase.auth.signInWithOAuth({
			provider: "github",
			options: { redirectTo: `${location.origin}/auth/callback` },
		});
	};

	return (
		<button
			type="button"
			onClick={handleLogin}
			className="flex w-full items-center justify-center gap-3 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
		>
			{/* Add GitHub icon SVG here */}
			Continue with GitHub
		</button>
	);
}
```

**Step 3: Add the Button to Your Pages**

Import and use the new button component in your login/signup pages, just like the `GoogleAuthButton`.

**Note:** The existing `/auth/callback` route handler in your app already supports all OAuth providers — no code changes needed!

---

## Security Best Practices

This template follows [Supabase's official security recommendations](https://supabase.com/docs/guides/auth/server-side/nextjs):

### ✅ Implemented

1. **Server-side session validation with `getUser()`**
    - Never use `getClaims()` or `getSession()` for route protection
    - `getUser()` validates with Supabase auth servers on every request
    - Prevents stale or invalidated sessions from accessing protected data

2. **Input validation on all server actions**
    - Email format validation
    - Password length requirements (minimum 6 characters)
    - Phone number digit count validation
    - Display name length cap
    - Required field validation

3. **User-friendly error messages**
    - Maps Supabase error codes to clear, actionable messages
    - No technical jargon exposed to users
    - Detailed errors logged server-side for debugging

4. **Secure password reset flow**
    - Single-use tokens with expiration
    - Forced sign-out after password change
    - No email enumeration protection
    - Multiple authentication flow support (PKCE, token hash, session-based)

5. **Cookie-based session management**
    - HTTP-only cookies (not localStorage)
    - Automatic token refresh via middleware
    - Server-side rendering support
    - XSS protection

6. **TOTP two-factor authentication**
    - Authenticator app-based (no SMS required)
    - Unenrollment requires verifying the current TOTP code (elevates to AAL2 first)
    - Login checks assurance level and gates dashboard access behind `/mfa`

7. **Avatar upload security**
    - Files uploaded to per-user Storage folders (`{userId}/...`)
    - RLS policies restrict upload/update to folder owner only
    - File size validated client-side (max 2MB)
    - Only PNG, JPEG, and WebP accepted

### 📋 Recommended Additional Steps

1. **Enable Row Level Security (RLS)** on all database tables
    - Example policy:
        ```sql
        CREATE POLICY "Users can only access their own data"
        ON your_table
        FOR ALL
        USING (auth.uid() = user_id);
        ```

2. **Set up rate limiting** in Supabase dashboard
    - Limit login attempts per IP
    - Limit signup requests per IP
    - Limit password reset requests

3. **Enable email confirmation** for production
    - Go to **Authentication > Providers > Email**
    - Toggle "Confirm email" to ON

4. **Use environment-specific redirect URLs**
    - Maintain separate allowlists for development and production
    - Never allow wildcards in production

5. **Enforce AAL2 for all protected routes** (if using TOTP 2FA)
    - Add an assurance level check to `lib/supabase/proxy.ts` (see [TOTP 2FA Setup](#totp-2fa-setup))

6. **Monitor authentication events**
    - Set up logging for failed login attempts
    - Alert on suspicious activity patterns

7. **Implement CAPTCHA** for public forms (optional)
    - Add to signup, login, and password reset forms
    - Prevents automated abuse

---

## Optional Next Steps

- ✅ **Password reset** – Already implemented
- ✅ **Better error handling** – Already implemented with user-friendly messages
- ✅ **Google OAuth** – Already implemented
- ✅ **Profile management** – Already implemented (display name, email, phone, avatar)
- ✅ **TOTP two-factor authentication** – Already implemented
- **Additional OAuth providers** – Add GitHub, Microsoft, Twitter, etc. (see [Add Other OAuth Providers](#add-other-oauth-providers-github-microsoft-etc) above)
- ✅ **Enforce AAL2 globally** – Already implemented (middleware enforces TOTP verification on all protected routes)
- ✅ **Session management** – Show users active sessions and allow them to revoke access
- ✅ **Account deletion** – Already implemented (permanent self-serve deletion via Admin API)
- **Magic link authentication** – Passwordless login via email links
- **SMS 2FA** – Phone-based OTP (requires an SMS provider like Twilio configured in Supabase)
