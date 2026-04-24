## Skew Backtest

This project is set up to work in two modes:

- Local mode: React frontend + Flask backend for live refreshes.
- GitHub Pages mode: static frontend that reads exported CSV data from `frontend/public/`.

GitHub Pages cannot run Flask or any Python server code, so the backend is handled by exporting its results ahead of time.

## Delivery model

The repository now uses a split CI/CD design:

- `Continuous Integration`
  Verifies the frontend build, Python backend imports, and CodeQL analysis on pull requests and non-main pushes for fast feedback.

- `Deliver GitHub Pages`
  Regenerates static data inside the workflow, rebuilds the site from a clean environment, creates a provenance attestation, and only then deploys to GitHub Pages.

This keeps delivery artifact-based and avoids scheduled workflows pushing generated files straight into `main`.

## Local development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend uses the backend API at `http://localhost:5002` by default in development.

### Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python3 backend/app.py
```

## Export static data for GitHub Pages

Run:

```bash
python3 public/export_to_frontend.py
```

This generates:

- `frontend/public/df.csv`
- `frontend/public/df_cum.csv`
- `frontend/public/dataset-manifest.json`

The production frontend build reads those files directly, so the published site works without a live backend.

## GitHub Actions

This repo includes these automation workflows:

- `.github/workflows/ci.yml`
  Fast verification for frontend, backend, and CodeQL on pull requests and non-main pushes.

- `.github/workflows/delivery-pages.yml`
  Rebuilds data and the static site from a clean runner, attests the output, and deploys the promoted Pages artifact.

- `.github/dependabot.yml`
  Keeps GitHub Actions, npm, and Python dependencies moving through reviewable update PRs.

## If you want a live backend in production

Deploy the Flask app separately on a platform like Render, Railway, or Fly.io, then point the frontend to it with `VITE_API_BASE`. GitHub Pages itself can only host the static frontend.
