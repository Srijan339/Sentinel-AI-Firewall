# Sentinel AI (local copy)

This repository contains the frontend and a small self-hosted FastAPI MVP for the "Sentinel AI" project.

Contents
- `App.tsx`, `index.tsx`, and other frontend sources — a Vite + React app.
- `sentinel_selfhost_fastapi_mvp/` — a minimal FastAPI backend with `requirements.txt`.

Quick start (frontend)

1. Install dependencies:

```bash
npm install
```

2. Run the dev server:

```bash
npm run dev
```

Backend (FastAPI)

1. Create a Python virtual environment and install requirements:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r sentinel_selfhost_fastapi_mvp/requirements.txt
```

2. Run the FastAPI app (example):

```bash
uvicorn sentinel_selfhost_fastapi_mvp.app.main:app --reload --port 8000
```

Notes
- This file was added locally and a `prepare-for-github` branch was created for safe review before pushing to the remote GitHub repository `https://github.com/Srijan339/Sentinel-AI-Firewall`.
- To publish these changes, add the remote and push (instructions below).

License
- Add a license file if you want to publish this repository publicly.


