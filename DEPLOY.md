# Deploy StrideMatch — step by step (Vercel + GitHub)

**Goal:** Put your app on the internet so anyone can open a link like  
`https://stridematch.vercel.app`

**Time:** about 15–20 minutes the first time  
**Cost:** free for a personal project  
**You need:** a GitHub account (you have this) and a free Vercel account

---

## What “deploy” means (simple)

Right now StrideMatch only runs on **your computer**.

| Word | Meaning |
|------|---------|
| **Build** | Turn your React code into plain website files (folder `dist/`) |
| **Deploy** | Upload those files to a host so the world can open them |
| **Vercel** | A free host that is excellent for React apps |
| **GitHub** | Where we store the code; Vercel can rebuild whenever you update it |

You do **not** need a database, server, or domain name for this.

---

## Path overview

```
1. Put code on GitHub
2. Sign up for Vercel with GitHub
3. Import the project → Deploy
4. Open your live URL and test
```

---

# Part A — Put StrideMatch on GitHub

Do this on **your computer** (the machine where the `running-shoe-finder` folder lives).

### A1. Open a terminal in the project folder

```bash
cd running-shoe-finder
```

(If the folder is somewhere else, `cd` into that path instead.)

### A2. Check Node works (optional)

```bash
node -v
npm -v
```

You should see version numbers. If not, install Node from https://nodejs.org (LTS).

### A3. Make sure the app builds

```bash
npm install
npm run build
```

You want to see something like **✓ built** and a `dist/` folder.  
If this fails, fix errors before deploying.

### A4. Create a Git repository (one-time)

```bash
git init
git add .
git commit -m "Initial StrideMatch app"
```

### A5. Create an empty repo on GitHub

1. Open https://github.com/new  
2. **Repository name:** e.g. `stridematch` (any name is fine)  
3. Leave it **Public** (easiest) or Private  
4. **Do not** tick “Add a README” (your folder already has files)  
5. Click **Create repository**

GitHub will show commands. Use the ones similar to below.

### A6. Connect your folder to GitHub and push

Replace `YOUR_USERNAME` and `stridematch` with your real GitHub username and repo name:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/stridematch.git
git push -u origin main
```

- If GitHub asks you to log in, use the browser or a **Personal Access Token** (not your normal password).  
- When it finishes, refresh the GitHub page — you should see your files (`src`, `package.json`, etc.).

**Checkpoint:** You can open `https://github.com/YOUR_USERNAME/stridematch` and see the code.

---

# Part B — Deploy with Vercel (click-by-click)

### B1. Sign up for Vercel

1. Open https://vercel.com/signup  
2. Choose **Continue with GitHub**  
3. Approve access when GitHub asks  

### B2. Import the project

1. On the Vercel dashboard, click **Add New…** → **Project**  
2. You should see your GitHub repos. Find **stridematch** (or whatever you named it)  
3. Click **Import**

If you don’t see the repo:

- Click **Adjust GitHub App Permissions**  
- Grant Vercel access to that repository (or all repos)  
- Refresh and try Import again  

### B3. Configure the project (usually leave defaults)

Vercel should detect Vite. Confirm:

| Setting | Value |
|---------|--------|
| **Framework Preset** | Vite (or Other) |
| **Root Directory** | `.` (leave default) — unless the app is inside a subfolder |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

**Environment Variables:** leave empty (this app needs none).

The file `vercel.json` in the project already tells Vercel how to handle page routes like `/catalog` and `/results`.

### B4. Deploy

1. Click **Deploy**  
2. Wait 1–2 minutes while it builds  
3. When you see **Congratulations** / a screenshot of the site, click the link  

Your site is live. Example URL:

`https://stridematch-xxxx.vercel.app`

You can rename it later under **Project → Settings → Domains**.

**Checkpoint:** Opening that URL shows the StrideMatch home page.

---

# Part C — Test the live site (important)

Open your Vercel URL and check:

1. **Home** loads  
2. Click **Analyze** (or Find my shoes)  
3. Skip photos → answer the quiz → **See my matches**  
4. Open **Catalog**  
5. Refresh the page on `/catalog` or `/results` — it should **not** show a 404  
6. Optional: toggle **EN / BM**, open **Stores (MY)**  

If refresh on `/catalog` shows 404, the SPA rewrite failed — make sure `vercel.json` is in the repo root and redeploy.

---

# Part D — Update the site later

Whenever you change the app on your computer:

```bash
cd running-shoe-finder
git add .
git commit -m "Describe your change"
git push
```

Vercel will **auto-rebuild and redeploy** in a minute or two.  
Watch progress: Vercel dashboard → your project → **Deployments**.

---

# Optional: deploy from the terminal instead of the website

Only if you prefer the command line (still free):

```bash
cd running-shoe-finder
npm install -g vercel
# or: npx vercel
npx vercel login
npx vercel --prod
```

Answer the prompts (link to existing GitHub project if asked).  
Most beginners are happier using the **Import on the website** (Part B).

---

# Common problems

### “npm run build” fails on my PC
- Run `npm install` again  
- Read the red error lines (often a TypeScript issue)  
- Don’t deploy until build succeeds  

### Git push asks for a password and rejects me
GitHub no longer accepts account passwords for `git push`.  
Use one of:
- **GitHub CLI** (`gh auth login`), or  
- A **Personal Access Token** as the password, or  
- SSH keys  

Guide: https://docs.github.com/en/authentication  

### Vercel build fails
Open the failed deployment → **Building** logs.  
Typical fixes:
- Output directory must be `dist`  
- Build command must be `npm run build`  
- Node version: in Project Settings you can set Node to **20.x**  

### Site works on home, but `/analyze` refresh is blank/404
Confirm `vercel.json` exists in the **root** of the GitHub repo:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Push again and redeploy.

### I only have the files in Arena / this workspace
Download or copy the whole `running-shoe-finder` folder to your PC, then start at **Part A**.  
Vercel needs the project on **your** GitHub (or uploaded via CLI from your machine).

### Custom domain (later)
Vercel → Project → **Settings** → **Domains** → add `yourdomain.com` and follow DNS instructions. Not required for sharing a `.vercel.app` link.

---

# What success looks like

- [ ] Code visible on GitHub  
- [ ] Green deployment on Vercel  
- [ ] You can open the public URL on your phone (not just your PC)  
- [ ] Friends can open the same link  

That’s it — StrideMatch is deployed.

---

## Quick cheat sheet

```bash
# First time (on your PC)
cd running-shoe-finder
npm install && npm run build
git init && git add . && git commit -m "Initial StrideMatch app"
# create empty repo on github.com/new then:
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/REPO.git
git push -u origin main
# then: vercel.com → Import → Deploy

# Later updates
git add . && git commit -m "Update" && git push
```
