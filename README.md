# Strata Tech Website

Full-stack static site for Strata Tech — web design & software agency, Nairobi.

## Stack
- **Frontend**: Vanilla HTML / CSS / JS (no framework — fast, no build step)
- **Backend**: Supabase (free tier) — stores all enquiries
- **Email**: Resend (free tier) — sends confirmation to client + alert to Joseph
- **Hosting**: Netlify (free) — connected to this GitHub repo, auto-deploys on push

## Setup (one-time, when domain is ready)

### 1. Supabase
1. Go to https://supabase.com → New project (name: `strata-tech`)
2. Run the SQL in `supabase/schema.sql` in the Supabase SQL editor
3. Copy your **Project URL** and **anon public key** from Project Settings → API
4. Paste them into `js/config.js`

### 2. Resend
1. Go to https://resend.com → add domain `stratatech.co.ke`
2. Add the DNS records they give you (takes ~10 min to verify)
3. Create an API key → paste into Supabase Edge Function (see `supabase/functions/`)
4. OR use Resend's direct API from the frontend (see `js/config.js` comments)

### 3. Netlify
1. Go to https://netlify.com → "Add new site" → "Import from Git"
2. Connect to this repo → deploy
3. Add custom domain `stratatech.co.ke` in Site Settings → Domain Management
4. Set environment variables (Supabase URL + key) in Site Settings → Environment Variables

## Project structure
```
strata-site/
├── index.html          # Main site
├── admin/
│   └── index.html      # Password-protected admin dashboard
├── js/
│   ├── config.js       # Supabase credentials (swap these when live)
│   ├── form.js         # Booking form submission logic
│   └── admin.js        # Admin dashboard logic
├── supabase/
│   └── schema.sql      # Run this once in Supabase SQL editor
└── netlify.toml        # Netlify config (redirects, headers)
```

## Swapping placeholders (before go-live)
- WhatsApp: `0712924595` → business line in `js/config.js`
- Email: `hello@stratatech.co.ke` → real address in `js/config.js`
- Supabase URL + key: in `js/config.js`
- Resend API key: in Netlify environment variables as `RESEND_API_KEY`
