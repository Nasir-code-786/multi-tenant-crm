# Deploy: Railway (server) + Vercel (client)

**Repo:** https://github.com/Nasir-code-786/multi-tenant-crm

One GitHub repo, two deployments:

| Part | Platform | Root folder |
|------|----------|-------------|
| API + Database | Railway | `server` |
| Frontend | Vercel | `client` |

Users open the **Vercel URL** to login. Railway API runs in the background.

---

## BEFORE YOU DEPLOY — Push code to GitHub

```bash
cd multi-tenant-crm
git add .
git commit -m "Production ready for Railway and Vercel"
git push origin main
```

Generate JWT secret (save for Step 3):

```bash
openssl rand -base64 32
```

---

## STEP 1 — Railway: Create PostgreSQL

1. Open https://railway.app → Login with GitHub
2. Click **New Project**
3. Click **+ New** → **Database** → **PostgreSQL**
4. Wait until Postgres shows **Active** (green)

---

## STEP 2 — Railway: Deploy the server

1. Same project → **+ New** → **GitHub Repo**
2. Select **Nasir-code-786/multi-tenant-crm**
3. Click the **new service** (NOT Postgres) → **Settings**
4. Set **Root Directory** → `server`
5. Railway auto-reads `server/railway.toml` (build + start commands)

---

## STEP 3 — Railway: Set environment variables

Click the **server service** → **Variables** → add these:

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Paste output from `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | `7d` |
| `DATABASE_SYNCHRONIZE` | `true` |
| `DATABASE_URL` | Click **Add Reference** → select **Postgres** → `DATABASE_URL` |

Wait for redeploy to finish.

---

## STEP 4 — Railway: Generate public URL

1. Server service → **Settings** → **Networking**
2. Click **Generate Domain**
3. Copy URL, example: `https://multi-tenant-crm-production.up.railway.app`

**Test in browser:**

```
https://YOUR-RAILWAY-URL/api/health
```

Should show: `{"status":"ok","timestamp":"..."}`

Also test Swagger:

```
https://YOUR-RAILWAY-URL/api/docs
```

---

## STEP 5 — Seed the database (REQUIRED)

Without seed, login will NOT work.

Install Railway CLI and run seed:

```bash
npm install -g @railway/cli
railway login
railway link
```

Select your project → **server service**, then:

```bash
cd server
railway run npm run seed:prod
```

You should see: `🌱 Seeding complete`

**Test login accounts:**

| Email | Password |
|-------|----------|
| alice@techcorp.com | password123 |
| bob@techcorp.com | password123 |
| dave@startupxyz.com | password123 |

---

## STEP 6 — Turn off auto schema sync

Railway → server service → **Variables**:

- Change `DATABASE_SYNCHRONIZE` to `false`

(Railway redeploys automatically.)

---

## STEP 7 — Vercel: Deploy the client

1. Open https://vercel.com → Login with GitHub
2. **Add New** → **Project**
3. Import **Nasir-code-786/multi-tenant-crm**
4. **Root Directory** → click **Edit** → type `client` → Continue
5. **Environment Variables** → add:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-RAILWAY-URL/api` |

Example: `https://multi-tenant-crm-production.up.railway.app/api`

> Must end with `/api`

6. Click **Deploy**
7. Copy Vercel URL, example: `https://multi-tenant-crm.vercel.app`

---

## STEP 8 — Connect CORS on Railway

Railway → server service → **Variables** → add:

| Variable | Value |
|----------|--------|
| `CLIENT_URL` | `https://YOUR-VERCEL-URL.vercel.app` |

No trailing slash. Wait for redeploy.

---

## STEP 9 — Test everything live

1. Open your **Vercel URL** in browser
2. Login: `alice@techcorp.com` / `password123`
3. You should see the customers page
4. Try: create customer, add note, assign user

---

## Your submission URLs (fill in after deploy)

| | URL |
|---|-----|
| GitHub | https://github.com/Nasir-code-786/multi-tenant-crm |
| Frontend (users login here) | https://________________.vercel.app |
| API | https://________________.up.railway.app/api |
| Swagger docs | https://________________.up.railway.app/api/docs |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Railway build fails | Root Directory must be `server`. Check deploy logs. |
| Database connection error | Use `DATABASE_URL` as Reference to Postgres service |
| `/api/health` does not load | Check Railway logs. Verify `DATABASE_URL` is set. |
| Login fails on Vercel | Run `railway run npm run seed:prod` (Step 5) |
| Network / CORS error | Set `CLIENT_URL` to exact Vercel URL (Step 8) |
| API 404 from frontend | `NEXT_PUBLIC_API_URL` must end with `/api` |
| JWT error on startup | Set `JWT_SECRET` on Railway |

---

## What stays on your computer (never push to GitHub)

| File | Purpose |
|------|---------|
| `server/.env` | Local dev secrets |
| `client/.env.local` | Local frontend API URL |

These are in `.gitignore`. Only `.env.example` files go to GitHub.

---

## Railway variables summary

```
NODE_ENV=production
JWT_SECRET=<your-random-secret>
JWT_EXPIRES_IN=7d
DATABASE_SYNCHRONIZE=false        (true only on first deploy)
DATABASE_URL=${{Postgres.DATABASE_URL}}
CLIENT_URL=https://your-app.vercel.app
```

## Vercel variables summary

```
NEXT_PUBLIC_API_URL=https://your-api.up.railway.app/api
```
