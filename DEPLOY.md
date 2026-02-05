# Deploying bgpiesa to Render

This guide walks you through deploying the full bgpiesa stack (backend + PostgreSQL + frontend) to [Render](https://render.com) for free.

## Prerequisites

- A [GitHub](https://github.com) account
- A [Render](https://render.com) account (free sign-up)
- Your project pushed to a GitHub repository
- [Cloudinary](https://cloudinary.com) account (for image/PDF storage)

---

## Option A: Deploy with Blueprint (Recommended)

The `render.yaml` in this repo defines the entire stack. Deploy in a few clicks.

### 1. Push to GitHub

Ensure your code is in a GitHub repository:

```bash
git add .
git commit -m "Add Render deployment config"
git push origin main
```

### 2. Connect to Render

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **Blueprint**
3. Connect your GitHub account if needed
4. Select the **bgpiesa** repository
5. Render will detect `render.yaml` and show the services to create

### 3. Provide Environment Variables

Render will prompt you for secrets (marked `sync: false`). Fill them in:

| Variable | Where to get it | Example |
|----------|-----------------|---------|
| **ADMIN_PASSWORD** | Choose a secure password for admin login | `YourSecurePass123!` |
| **CLOUDINARY_CLOUD_NAME** | Cloudinary Dashboard → Settings | `dfyjeopw9` |
| **CLOUDINARY_API_KEY** | Cloudinary Dashboard → Settings | `639354315774653` |
| **CLOUDINARY_API_SECRET** | Cloudinary Dashboard → Settings | `aAxlwN...` |
| **BACKEND_CORS_ORIGINS** | JSON array of allowed origins | `["https://bgpiesa-frontend.onrender.com"]` |
| **VITE_API_BASE_URL** | Backend URL (see step 4) | `https://bgpiesa-backend.onrender.com` |

> **Important:** For `BACKEND_CORS_ORIGINS`, use your frontend URL. After the first deploy, you'll get URLs like:
> - Backend: `https://bgpiesa-backend.onrender.com`
> - Frontend: `https://bgpiesa-frontend.onrender.com`
>
> If you deploy backend first, use a placeholder for the frontend, then update `BACKEND_CORS_ORIGINS` and redeploy the backend. Or use `["*"]` for testing (allows any origin).

### 4. First Deploy – Two-Pass Setup

Because the frontend needs the backend URL at build time:

1. **First deploy:** Leave `VITE_API_BASE_URL` empty or use `https://bgpiesa-backend.onrender.com` (Render uses this naming pattern).
2. After the backend deploys, copy its URL from the Render dashboard (e.g. `https://bgpiesa-backend.onrender.com`).
3. In the **bgpiesa-frontend** service → **Environment**:
   - Set `VITE_API_BASE_URL` = your backend URL (no trailing slash).
4. In the **bgpiesa-backend** service → **Environment**:
   - Set `BACKEND_CORS_ORIGINS` = `["https://bgpiesa-frontend.onrender.com"]` (use your actual frontend URL).
5. **Manual Deploy** both services so they pick up the new env vars.

### 5. Access Your App

- **Frontend:** `https://bgpiesa-frontend.onrender.com`
- **Backend API:** `https://bgpiesa-backend.onrender.com`
- **Health check:** `https://bgpiesa-backend.onrender.com/api/health`

---

## Option B: Manual Setup (Step by Step)

If you prefer to create services manually:

### 1. Create PostgreSQL Database

1. **New +** → **PostgreSQL**
2. Name: `bgpiesa-db`
3. Plan: **Free**
4. Create Database
5. Copy the **Internal Database URL** (use this for services in the same Render account)

### 2. Create Backend Web Service

1. **New +** → **Web Service**
2. Connect your repo, select the **bgpiesa** repository
3. Configure:
   - **Name:** `bgpiesa-backend`
   - **Region:** Oregon (or nearest)
   - **Root Directory:** `backend`
   - **Runtime:** Docker
   - **Plan:** Free

4. **Environment Variables:**

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Paste the Internal Database URL from step 1 |
   | `ADMIN_PASSWORD` | Your admin password |
   | `JWT_SECRET` | Random string (e.g. from `openssl rand -base64 32`) |
   | `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
   | `CLOUDINARY_API_KEY` | Your Cloudinary API key |
   | `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |
   | `BACKEND_CORS_ORIGINS` | `["https://YOUR-FRONTEND-URL.onrender.com"]` |

5. Create Web Service

### 3. Create Frontend Static Site

1. **New +** → **Static Site**
2. Connect your repo, select **bgpiesa**
3. Configure:
   - **Name:** `bgpiesa-frontend`
   - **Root Directory:** (leave blank)
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Publish Directory:** `frontend/dist`

4. **Environment Variable:**
   - `VITE_API_BASE_URL` = `https://bgpiesa-backend.onrender.com` (your backend URL)

5. Create Static Site

### 4. Update CORS

In the backend service, set `BACKEND_CORS_ORIGINS` to your frontend URL (from the Static Site dashboard), then redeploy the backend.

---

## Database URL Format

Render provides a URL like `postgresql://user:pass@host:port/dbname`. If you see connection errors, try changing it to:

```
postgresql+psycopg2://user:pass@host:port/dbname
```

Replace the first `postgresql://` with `postgresql+psycopg2://`.

---

## Free Tier Notes

- **Backend:** Spins down after ~15 minutes of inactivity. First request may take 30–60 seconds (cold start).
- **PostgreSQL:** Free tier has storage and connection limits; suitable for demos and small usage.
- **Static Site:** Served from CDN; no spin-down.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Frontend shows "Request failed" | Ensure `VITE_API_BASE_URL` is correct and backend is deployed. Rebuild frontend after changing env vars. |
| CORS errors | Add your frontend URL to `BACKEND_CORS_ORIGINS` and redeploy the backend. |
| Database connection failed | Check `DATABASE_URL` format. Use Internal URL for services in the same Render account. |
| 502 Bad Gateway | Backend may be starting. Wait a minute and retry. Check backend logs in the Render dashboard. |
