# PersonAIs — Frontend (Alpha 0.4.0)

Next.js 16 (App Router) front end for the PersonAIs digital-twin alpha.

## What changed in 0.4.0

- **New theme — Frutiger Aero.** A 2000s–2010s light-blue-and-green look: glossy
  aqua buttons, frosted glass panels, sky-to-grass gradients and floating
  bubbles. Tokens and component classes live in `app/globals.css`; every page
  builds on them.
- **Signup and login fixed.** See [Auth](#auth) below.
- **Email verification removed.** The Resend confirmation step is gone for this
  release — see [Turn off email confirmation](#turn-off-email-confirmation).
- **Updated temporary alpha terms.** `app/lib/legal.js` is the single source of
  truth, rendered by both the signup dialog and `/legal`.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

### Environment variables

Create `.env.local` (git-ignored):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
NEXT_PUBLIC_BACKEND_URL=https://personais-api.net   # optional, this is the default
```

If either Supabase value is missing the app no longer white-screens — it renders
and tells you which variable to set.

## Auth

### What was broken

1. **Signup silently did nothing for existing emails.** Supabase masks
   "this address is taken" to prevent user enumeration: `signUp()` returns a
   decoy user with an empty `identities` array and *no error*. The old code read
   that as success and showed "check your email", so returning testers believed
   they had registered when nothing had happened. The signup handler now detects
   the empty `identities` array and sends you to the login tab instead.
2. **Login redirected even when it failed.** The old handler navigated to
   `/setup` whenever no error came back, and `/setup` had no auth guard of its
   own — so a rejected sign-in could still land inside the app. Sign-in now
   requires a real session object before it navigates anywhere, and `/setup`,
   `/settings` and `/` all verify the session themselves.
3. **Errors were unreadable.** Raw Supabase strings ("Invalid login
   credentials") are mapped to messages that say what to do next, in
   `app/lib/authErrors.js`.

### Other signup hardening

- Confirm-password field — with no reset email in this release, a typo is
  unrecoverable, so it is caught at the form.
- Minimum password length enforced client-side before the API call.
- Email is trimmed and lower-cased so `You@Example.com ` and `you@example.com`
  are the same account.

### Turn off email confirmation

**This is a dashboard setting, not code.** In your Supabase project go to
**Authentication → Sign In / Providers → Email** and switch **Confirm email**
off.

The app is written to cope either way: after `signUp()` returns without a
session it immediately calls `signInWithPassword()` to finish the job. But if
Confirm Email is still on, Supabase rejects that sign-in with
`email_not_confirmed`, and the UI will tell the user the toggle still needs
flipping. Accounts created under 0.3.3 that were never confirmed have to be
confirmed once (or deleted and re-registered) after you flip it.

## Routes

| Route       | Auth      | Purpose                                        |
| ----------- | --------- | ---------------------------------------------- |
| `/`         | Required  | Chat with your digital twin                    |
| `/auth`     | Public    | Log in / create account                        |
| `/legal`    | Public    | Temporary alpha terms of service               |
| `/setup`    | Required  | Upload the reference photo for your twin       |
| `/settings` | Required  | Account, sign out, rebuild twin                |
| `/pricing`  | Public    | Alpha tier and Founder pre-order               |

`/auth` and `/legal` render without the app sidebar — signed-out visitors should
not see Settings and Feedback controls. That switch lives in
`app/components/AppShell.jsx`.

## Layout

```
app/
├── components/    AppShell (chrome), AeroBubbles, TermsDialog
├── lib/           supabaseClient, authErrors, legal
├── auth/          gateway (login + signup)
├── legal/         alpha terms of service
├── setup/         twin initialization
├── settings/      account
├── pricing/       tiers
├── globals.css    Frutiger Aero tokens + component classes
└── layout.jsx     root layout (server component, exports metadata)
```

## Checks

```bash
npm run lint
npm run build
```

## Known alpha limitations

- The reference photo is kept in `localStorage`, not uploaded anywhere.
- Feedback submissions are not persisted yet.
- Pre-orders are a stub; no payment is taken.
- There is no password reset, because there is no verification email.
