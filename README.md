# PersonAIs — Frontend (Alpha 0.4.5)

Next.js 16 (App Router) front end for the PersonAIs digital-twin alpha.

## What's new in 0.4.5 — your colour, and a daily limit on twin rounds

### Pick the theme colour

**Settings → Theme colour** dresses the whole app in Aero's own sky and grass
(the default, unchanged) or any of the basic colours: **red, orange, yellow,
green, blue, purple, pink, brown or grey**. It changes the moment you pick —
the page you are on is the preview — and this browser remembers it. The
signed-out pages (sign-in, terms) wear it too.

It is still Frutiger Aero in every colour: the gloss, glass and bubbles stay,
only the two accents change. Each colour keeps Aero's lightness at every step
of its scales, so a heading, a label or a link is exactly as readable in every
colour as in Aero, and nowhere less.

How it works, for whoever touches it next:

- `app/globals.css` — every colour in the app is a `--color-aero-*` token (or
  mixed from one), and Tailwind classes such as `text-aero-sky-800` read them
  through `var()`. A theme is just a block of new token values under
  `:root[data-theme="…"]`, at the end of the file. Aero's own token values are
  unchanged. Turning the old hard-coded colours into tokens was checked with a
  screenshot diff of every page against 0.4.4: no pixel moved by more than
  4/255.
- `app/lib/theme.js` — the list of colours, and the helpers that apply and
  remember one (`localStorage`, key `personais_theme`).
- `app/layout.jsx` — a tiny inline script in `<head>` sets `data-theme` while
  the page is still being parsed, so a red page never paints blue first (the
  pattern from Next's *Preventing flash before hydration* guide).
  `components/AppShell.jsx` re-applies it after React's development remount
  and follows a colour picked in another tab.
- `app/components/ThemePicker.jsx` — the picker: native radio buttons, so the
  arrow keys move through the colours.

To add a colour: add a block to the end of `globals.css` (both scales, `aqua`,
`ink`, `ink-soft`) and an entry to `THEMES` in `lib/theme.js`.

### A daily limit on twin discussions

A pair of twins that would not agree could spend a whole balance in one
sitting. The engine now caps it: **each of you may spend up to three credits a
day on twin rounds** — three rounds a day, since a round costs each side one.
The day is the UTC day; the pages turn that into your own time.

- **In a room**, a 🗓 chip next to your credits shows what is left today
  ("2 of 3 today"), and the header says how much your friend has left.
- **When the limit is reached** the twins stop, both of you see why, and the
  buttons say when they can carry on — "The twins can carry on at 8:00 PM."
  The room reopens by itself when the day turns over; nobody has to press
  anything. Disagreeing still works: your objection is kept, and your twin
  argues it in the next round.
- **On `/discuss`** your allowance sits under the heading, and a room held by
  the limit reads *Daily limit reached* rather than *Out of credits*.
- Typing to each other is still free and unlimited.

The limit lives in the engine (`DISCUSSION_DAILY_CREDIT_LIMIT`, default `3`);
the pages show whatever it reports. **The engine needs its 0.4.5 migration
run** (`migrations/0002_discussion_limits_0.4.5.sql` in the backend repo).
Until then friends and discussions keep working, but asking for a twin round
shows the engine's message naming that file.

## What's new in 0.4.4 — friends, and twins that argue for you

Until now your twin only ever talked to you. 0.4.4 adds other people.

- **A twin network.** `/friends` gives you a friend code (`PA-` and six
  characters). Swap codes with somebody, accept the request, and you are
  connected. Your email address is never searchable — with confirmation off in
  this release, a hit would confirm the address has an account behind it.
- **Shared discussions.** `/discuss` is a room per topic, shared with one
  friend. There are two ways to talk in it, and they share one transcript:
  - **Type it yourself.** An ordinary message. Free.
  - **Send your twin.** Both twins take a turn — a *round* — working from the
    topic, the transcript, and whatever you have typed, which your twin treats
    as orders rather than suggestions. A round costs you one credit and your
    friend one credit.
- **Agree, or send them back round.** The twin that closes a round leaves a
  proposal. You each vote on it. Both agree and it is settled. **Either of you
  disagrees and the twins go again** — your objection becomes your twin's brief
  for the next round — and they keep going until somebody agrees or the credits
  run out. There is a Stop button, because it is your balance.
- **Standing instructions.** On `/friends` you can tell your twin what it must
  never give away ("never commit me to a weekend", "keep any budget under
  £400"). It carries those into every discussion.

Each round is its own request, so you watch them land one at a time rather than
waiting for a balance to drain into a single response. The room polls every few
seconds, so a discussion updates while your friend is typing in it.

**The backend needs its 0.4.4 migration run before any of this works** — the
SQL is in the backend repo's `README.md`, and `GET /api/health` reports
`social_schema: ready` once it has been. Until then the pages say so instead of
failing quietly.

### Talking to the engine

`app/lib/api.js` is the one place that calls the backend. It attaches the
Supabase access token to every request, because the social endpoints identify
you from that token and ignore any user id in the body — a private discussion
between two people cannot be readable by anyone who can guess a uuid.

## What changed in 0.4.3

Patch release, backend only. Build labels move here; nothing else does.

- **The real cause of the chat failure was found.** 0.4.2 added a boot self
  test that sends one real message; on its first run it reported a `400` from
  the API: the production key is organisation-scoped, so every request must
  name a workspace, and nothing was naming one. That rejected **every** message
  on every tier — it was never the model id. The engine now sends the workspace
  header on every call, and the missing piece is a dashboard value
  (`ANTHROPIC_WORKSPACE_ID`, or a workspace-scoped API key).
- **`/api/health` now carries a `remedy` field** — `null` when healthy, and
  otherwise the exact environment variable to change and where to find its
  value.

Setup steps are in the backend repo's `README.md`.

## What changed in 0.4.2

Patch release. No UI, auth or theme changes — the fix is entirely in the
backend engine. Only the build labels move here.

- **Pro and Ultra accounts could not chat at all.** Every message came back as
  `Critical error: The AI engine is not set up correctly, so this message could
  not be answered.` 0.4.1 sent those tiers to a second model, `claude-fable-5`,
  which is not available on the production API key — the API answers an
  unavailable model with a 404, and the old message named neither the model nor
  the tier, so it looked like a key problem while `/api/health` kept reporting
  the key as fine. Free and guest accounts were unaffected, which is why it
  looked intermittent.
- **One model now serves every tier**, and it is the one that was already
  working (`claude-haiku-4-5-20251001`). The tier still selects the persona and
  still meters credits; it no longer selects a model. There is no pro-tier
  model until one is actually available on the key.
- **The engine tests itself at boot.** It asks the API which models the key can
  serve and then sends one real message. Both results, plus the list of
  servable model ids, are on `/api/health` — so a bad model id shows up on the
  health page at deploy time instead of in somebody's chat window.
- **Configuration failures now say what failed.** The chat message names the
  model and quotes the provider's own explanation instead of a flat sentence.

Deploy settings, the full environment variable list and a post-deploy checklist
live in the backend repo's `README.md`.

## What changed in 0.4.1

Patch release. No UI or auth changes — the fixes are all in the backend engine.

- **Chat no longer dies on a bad API key.** An `ANTHROPIC_API_KEY` that is
  missing, blank, or pasted with wrapping quotes or a trailing newline used to
  build a client cleanly and then fail on the first message as
  `Critical error: Anthropic Engine Error: Error code: 401`. The key is now
  trimmed of quotes and whitespace, checked when the service boots, and the
  problem is named in the deploy log.
- **Provider errors stop leaking into the chat window.** A raw 401 body from
  Anthropic used to be passed straight through to the user as chat text.
  Failures now map to their own status codes (503 config, 429 busy, 502
  upstream) with a plain-language message; the detail goes to the server log.
- **Pro/Ultra replies were guaranteed to crash.** The engine read
  `content[0].text`, but the Pro/Ultra model always emits a thinking block
  first and that block has no `.text` field. Replies are now selected by block
  type instead of position.
- **New `/api/health` probe** reports whether the key and database are
  configured, without exposing any secret.
- **Per-tier token budgets.** Pro/Ultra runs a model that always reasons, and
  reasoning is billed against the same token budget as the reply — so the
  shared 1024 cap could be spent before the answer started. Pro/Ultra now gets
  4096 tokens at bounded reasoning depth; the free tier is unchanged.

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
| `/settings` | Required  | Account, theme colour, sign out, rebuild twin  |
| `/pricing`  | Public    | Alpha tier and Founder pre-order               |
| `/friends`  | Required  | Your friend code, requests, and connected twins |
| `/discuss`  | Required  | Your shared discussions                        |
| `/discuss/[id]` | Required | One discussion: transcript, twin rounds, verdicts |

`/auth` and `/legal` render without the app sidebar — signed-out visitors should
not see Settings and Feedback controls. That switch lives in
`app/components/AppShell.jsx`.

## Layout

```
app/
├── components/    AppShell (chrome), AeroBubbles, TermsDialog, ThemePicker
├── lib/           supabaseClient, api (engine client), session (auth guard),
│                  authErrors, legal, theme (colour themes), limits (daily
│                  allowance copy)
├── auth/          gateway (login + signup)
├── legal/         alpha terms of service
├── setup/         twin initialization
├── settings/      account
├── pricing/       tiers
├── friends/       twin network: friend code, requests, connected twins
├── discuss/       shared discussions, and [id]/ the room itself
├── globals.css    Frutiger Aero tokens, component classes, colour themes
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
- A discussion room polls every six seconds rather than subscribing, so a
  friend's message can take that long to appear.
- A discussion is between exactly two people.
- Both of you can ask for a round at the same moment. The engine refuses the
  second one (`409`) and the room reloads instead of charging twice.
- The theme colour is kept in this browser, like the reference photo — it
  does not follow your account to another browser or device.
- The daily allowance turns over at midnight UTC for everybody, so in the
  Americas it comes back in the evening. The pages show that time in yours.
