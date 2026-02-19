# Interface Design System
# template-supabase-auth

## Intent

**Who:** Developers cloning this as an auth foundation for a new SaaS app.
**Task:** Understand the patterns quickly, then customize for their product.
**Feel:** Vercel/Linear settings — restrained, precise, nothing decorative. Developer-grade without being spartan.

---

## Direction

Zinc neutrals throughout. No decorative color. Semantic color only (red = danger, green = enabled/success). Every element earns its place.

---

## Depth Strategy

**Borders-only.** Clean, technical. No shadows.

- Standard border: `border-zinc-300 dark:border-zinc-700`
- Soft separation: `border-zinc-200 dark:border-zinc-800` (section dividers)
- Cards/interactive rows: `rounded-md border bg-white dark:bg-zinc-900`
- Page background: `bg-zinc-50 dark:bg-black`

---

## Spacing

Base unit: `4px` (Tailwind default).

- Within form fields: `space-y-1` (label → error message)
- Within form groups: `space-y-3` (input → button → helper text)
- Between sections: `pt-6` with `border-t` divider
- Page header to content: `mb-8`
- Page vertical padding: `py-12`

---

## Typography

Font: Geist Sans (`var(--font-sans)`). Applied in `globals.css` body rule with `-webkit-font-smoothing: antialiased`.

| Role | Classes |
|---|---|
| Page heading | `text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50` |
| Section label | `text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500` |
| Body / input label | `text-sm font-medium text-zinc-700 dark:text-zinc-300` |
| Secondary / helper | `text-sm text-zinc-500 dark:text-zinc-400` |
| Metadata / timestamps | `text-xs text-zinc-400 dark:text-zinc-500` |
| Error message | `text-xs text-red-600 dark:text-red-400` |

**Key distinction:** Section labels use `uppercase tracking-wider` at `text-xs` — clearly distinguishable from body text without adding visual weight.

---

## Color

All zinc. No accent color. Semantic only:

| Use | Light | Dark |
|---|---|---|
| Page bg | `bg-zinc-50` | `bg-black` |
| Card/input bg | `bg-white` | `bg-zinc-900` |
| Primary button | `bg-zinc-900 text-white` | `bg-zinc-50 text-zinc-900` |
| Border | `border-zinc-300` | `border-zinc-700` |
| Soft border | `border-zinc-200` | `border-zinc-800` |
| Success | `text-green-600 / bg-green-50 border-green-200` | `text-green-400 / bg-green-950 border-green-800` |
| Danger | `text-red-600 / bg-red-50 border-red-200` | `text-red-400 / bg-red-950 border-red-800` |

---

## Components

### AuthCard

Centered full-screen wrapper for auth pages.

```tsx
<div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
  <div className="w-full max-w-sm space-y-6 px-4">{children}</div>
</div>
```

Used for: login, signup, forgot-password, update-password, mfa, dashboard, sessions, totp.

### Input

`app/components/ui/input.tsx` — accepts `error?: boolean` for error-state styling.

```tsx
<Input
  name="email"
  type="email"
  error={!!emailError}
  aria-invalid={!!emailError}
  aria-describedby={emailError ? "email-error" : undefined}
/>
{emailError && (
  <p id="email-error" role="alert" className="text-xs text-red-600 dark:text-red-400">
    {emailError}
  </p>
)}
```

### Alert

`app/components/ui/alert.tsx` — always use these, never hand-roll alert divs.

```tsx
<ErrorAlert>{error}</ErrorAlert>
<SuccessAlert>{message}</SuccessAlert>
```

### Primary Button

```tsx
className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
```

### Secondary Button

```tsx
className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
```

### Interactive Row (navigable card)

Used for 2FA link, sessions link, connected accounts.

```tsx
className="flex items-center justify-between rounded-md border border-zinc-300 bg-white px-4 py-3 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
```

### Profile Section Pattern

Two local helpers in `profile/page.tsx` — replicate if building similar settings pages.

```tsx
function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 ${className ?? ""}`}>
      {children}
    </h2>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
      {children}
    </div>
  );
}
```

### Divider with label (auth pages)

```tsx
<div className="relative">
  <div className="absolute inset-0 flex items-center">
    <span className="w-full border-t border-zinc-300 dark:border-zinc-700" />
  </div>
  <div className="relative flex justify-center text-xs uppercase">
    <span className="bg-zinc-50 px-2 text-zinc-500 dark:bg-black dark:text-zinc-400">
      Or continue with
    </span>
  </div>
</div>
```

---

## Layout Patterns

### Auth page (login, signup, etc.)
Centered card, max-w-sm, `space-y-6` between sections.

### Settings/profile page
Full-width centered column, max-w-sm, `py-12` vertical padding. Sections separated by `border-t pt-6`. Header (`mb-8`) above content, back link at bottom with `border-t mt-8 pt-6`.

### Sub-pages (totp, sessions)
Use `AuthCard`. Back link at top (`← Back to profile`), centered heading + description, then component content.

---

## Rules

- Never hand-roll alert divs — always use `ErrorAlert` / `SuccessAlert`
- Never use `font-family: Arial` — body font is `var(--font-sans)` (Geist)
- No decorative color — zinc only; red/green only for semantic meaning
- No shadows — borders define depth
- Inputs use the shared `Input` component; never inline the full className
- Section labels: `text-xs uppercase tracking-wider`, not `text-sm font-medium`
