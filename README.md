# Samsara Community App

Community project platform for the Samsara inner circle — members collaborate on land projects across two realms (Samsara community and VrischGewagt farm).

## Quick Start

```bash
npm install
cp .env.example .env.local   # fill in Supabase credentials
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anon key — both vars required, app throws on startup if missing |

## Project Structure

```
src/
  pages/
    circle/        # Community circle page
    detail/        # Project detail page (tasks, updates, timeline)
    login/         # Auth page
    projects/      # Project listing page per realm
    vg/            # VrischGewagt farm sub-app (dashboard, animals, produce, etc.)
  components/
    ui/            # Shared primitives (Button, Modal, ErrorBoundary, LoadingSpinner)
    portal/        # Portal/overlay components
  hooks/           # Shared React hooks
  lib/
    supabase.js    # Supabase client
```

## Key Concepts

- **Two realms**: `samsara` (community projects) and `vrisch` (VrischGewagt farm projects)
- **Roles**: Creator starts and manages a project; Contributors join and add updates
- **Project lifecycle**: Open → Application → Closed → Completed (with optional review)
- **BOM (Bill of Materials)**: Creators can track material costs per project
- **VrischGewagt sub-app**: Separate dashboard for farm operations (animals, produce, accommodation, history)
- **Service worker**: Registered in production for offline capability

## Tech Stack

- React 18 (JSX)
- Vite
- React Router v6
- Tanstack React Query
- Supabase (auth + database)
- Tailwind CSS
- React Hook Form
- heic2any (HEIC image conversion)

## Deploy

```bash
npm run build
docker build -t jrfmdev/samsara-community-app:prod . --no-cache
docker push jrfmdev/samsara-community-app:prod
# Restart on ArgoCD: https://deploy.simplydevops.co.za/applications/argocd/prod-samsara-community-app
```
