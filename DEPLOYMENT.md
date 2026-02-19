# Volt Music - Production Deployment Guide

## 1. Backend Deployment (Oracle Cloud)

We use **Docker** to containerize the application and **Caddy** as a reverse proxy to automatically handle HTTPS (SSL certificates).

### Prerequisites
- An Oracle Cloud VM (Always Free ARM instance recommended: 4 OCPUs, 24GB RAM).
- A domain name pointing to your VM's public IP (Required for HTTPS).
- Docker and Docker Compose installed on the VM.

### Steps

1. **Clone the Repository** to your VM.
2. **Update `Caddyfile`**:
   - Open `Caddyfile` and replace `:80` with your actual domain name (e.g., `api.yourdomain.com`).
   - If you don't have a domain yet, you can keep `:80` but Vercel will struggle to connect due to Mixed Content errors.

3. **Start Services**:
   ```bash
   docker-compose up -d --build
   ```

4. **Verify**:
   - Check if running: `docker-compose ps`
   - Check logs: `docker-compose logs -f`
   - Test URL: `https://your-domain.com/api/search?q=test`

### Persistence
- **Cache**: The `cache/` directory is mounted as a volume, so your cache persists across restarts.
- **Certificates**: Caddy stores SSL certificates in a docker volume `caddy_data`.

### Updating the App
To deploy new code changes:
```bash
git pull
docker-compose up -d --build
```

---

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
   - `VITE_API_URL`: `https://your-backend-domain.com/api`
     - *Note: Do not include trailing slash.*
     - *Must be HTTPS to avoid mixed content errors.*

5. **Deploy**:
   - Click **Save and Deploy**.
   - Cloudflare will build and assign a domain (e.g., `volt-music.pages.dev`).

### SPA Routing
- We added a `public/_redirects` file that Cloudflare uses to route all traffic to `index.html`. This ensures refreshing pages like `/artist/xyz` works.

### Updating the Frontend
- Just push changes to GitHub. Cloudflare will auto-deploy.
