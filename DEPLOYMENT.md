## 1. Backend Deployment (Render)

We use **Render** to host the Python API. It's free and connects directly to GitHub.

### Steps

1.  **Push your code** to GitHub (including `render.yaml`).
2.  **Log in to Render**: [dashboard.render.com](https://dashboard.render.com/).
3.  Click **"New"** -> **"Blueprint"**.
4.  Connect your `volt-music` repository.
5.  Render will detect the `render.yaml` file and set everything up automatically.
6.  Click **"Apply"** or **"Create Service"**.

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
