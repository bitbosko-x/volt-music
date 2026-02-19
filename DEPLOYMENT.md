# Volt Music - Production Deployment Guide

## 1. Backend Deployment (Render)

We use **Render** to host the Python API. It's free and connects directly to GitHub.

### Steps to Deploy (Free Tier - No Card Required)

1.  **Log in to Render**: [dashboard.render.com](https://dashboard.render.com/).
2.  Click **"New"** -> **"Web Service"** (NOT Blueprint).
3.  Connect your public `volt-music` repository.
4.  **Configure Settings**:
    *   **Name**: `volt-backend`
    *   **Region**: Closest to you (e.g., Singapore/US).
    *   **Runtime**: `Python 3`
    *   **Root Directory**: Leave blank (uses root).
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `gunicorn api:app`
5.  **Choose Plan**: Select **"Free"** (Scroll down to find it).
6.  Click **"Create Web Service"**.

### Persistence
*Note: The free tier of Render does NOT support persistent disks. This means the file-based cache (`cache/`) will be cleared every time the app restarts or deploys. This is fine for this app, but just be aware.*

### Updating the App
*   Just push changes to GitHub. Render will auto-deploy.


## 2. Frontend Deployment (Cloudflare Pages)

We use **Cloudflare Pages** for the React frontend as it's free, fast, and handles SPA routing via `_redirects`.

### Steps

1. **Push your code** to GitHub.
2. **Import Project in Cloudflare**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) -> **Compute (Workers & Pages)**.
   - Click **"Create Application"** -> **"Pages"** -> **"Connect to Git"**.
   - Select your GitHub repository.

3. **Configure Building**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
   - **Root Directory**: `frontend` (Important!)

4. **Environment Variables**:
   Add the following variable in the "Environment variables" section:
   - `VITE_API_URL`: `https://your-render-app-name.onrender.com/api`
     - *Note: Do not include trailing slash.*
     - *Must be HTTPS to avoid mixed content errors.*

5. **Deploy**:
   - Click **Save and Deploy**.
   - Cloudflare will build and assign a domain (e.g., `volt-music.pages.dev`).

### SPA Routing
- We added a `public/_redirects` file that Cloudflare uses to route all traffic to `index.html`. This ensures refreshing pages like `/artist/xyz` works.

### Updating the Frontend
- Just push changes to GitHub. Cloudflare will auto-deploy.
