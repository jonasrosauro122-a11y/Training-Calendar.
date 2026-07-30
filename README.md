# LAVA Automation — Multi-VA Training Portal

A training-schedule portal for managing multiple Virtual Assistant onboarding
calendars. Managers can add VA calendars, set the agency / name / support type /
active day / photo, and share a read-only "view link" for each VA.

Originally a single static HTML file (in-memory only, everything lost on reload).
It's now wired to **Supabase** for real persistence + photo storage, and packaged
to deploy on **Vercel** as a static site.

## What changed

- **Real persistence** — calendars live in a Supabase `calendars` table instead
  of memory. Edits auto-save (debounced) as you type.
- **Photo storage** — uploaded VA photos go to a Supabase Storage bucket and are
  served by URL, instead of being stuffed into the page as base64.
- **Clean share links** — `?id=<uuid>` pointing at a real row, instead of the old
  giant base64 blob in the URL hash. (Old `#va=` links still open, for safety.)
- **Live status** — a pill in the toolbar shows Connected / Saving / Local only.
- A first-run banner appears until `config.js` is filled in.

The visual design is unchanged.

---

## File overview

| File | What it is |
|------|------------|
| `index.html` | The app (markup + styles). Loads Supabase + `config.js` + `app.js`. |
| `app.js` | All application logic (data layer, rendering, sharing). |
| `config.js` | **You edit this** — your Supabase URL + anon key. |
| `supabase-schema.sql` | Run once in Supabase to create the table, policies, and storage bucket. |
| `vercel.json` | Static deploy config. |

---

## Setup — Step 1: Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard, open **SQL Editor → New query**, paste the entire contents
   of `supabase-schema.sql`, and click **Run**. This creates:
   - the `calendars` table,
   - Row Level Security policies,
   - a public `va-photos` storage bucket.
3. Open **Project Settings → API** and copy two values:
   - **Project URL**
   - **anon / public** key
4. Paste both into `config.js`:
   ```js
   window.LAVA_CONFIG = {
     SUPABASE_URL: "https://xxxxxxxx.supabase.co",
     SUPABASE_ANON_KEY: "eyJhbGciOi...your-anon-key...",
     PHOTO_BUCKET: "va-photos",
   };
   ```

> The anon key is meant to be public in a static site. What it can actually do is
> constrained by the RLS policies you ran in step 2.

### Test locally
Serve the folder (opening the file directly won't let it load `config.js`
reliably):
```bash
# any static server works, e.g.:
python3 -m http.server 5173
# then visit http://localhost:5173
```
The banner should disappear and the pill should read **Connected**. Add a
calendar, edit a field, reload — your changes persist.

---

## Setup — Step 2: Deploy to Vercel

**Option A — Git (recommended)**
1. Push this folder to a GitHub/GitLab repo.
2. In Vercel, **Add New → Project**, import the repo.
3. Framework preset: **Other**. Root directory: the folder with `index.html`.
   No build command, no output directory — it's static.
4. Deploy. Your portal is live.

**Option B — CLI**
```bash
npm i -g vercel
vercel        # from inside this folder
```

Because `config.js` ships with the site, your Supabase values are already in
place after deploy — nothing else to configure.

---

## Security note (read this before real use)

The default policies in `supabase-schema.sql` let **anyone with the site URL read
and edit** the calendars. That's fine for an internal link you only share with
staff, and it's what makes the portal work the moment you deploy.

For a real/public deployment, switch to the **locked-down** policies (commented
in the SQL file): public can *view* calendars (so share links keep working), but
only a signed-in manager can add/edit/delete. That requires adding a Supabase
Auth login step for managers. The SQL file shows exactly which policies to swap.

---

## How sharing works

Each VA card has a **Copy Link** button that produces `.../?id=<uuid>`. Opening
that link loads just that VA's calendar in read-only **Presentation Mode** —
editing controls are hidden. Great for sending to a client or the VA themselves.
