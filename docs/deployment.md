# AgroVerse AI — Render Deployment

The root `render.yaml` deploys the FastAPI backend and Next.js frontend as separate Render web services. The backend uses PostgreSQL; you can supply a PostgreSQL connection string from Supabase or another provider.

## Deploy with a Blueprint

1. Push the repository to GitHub without committing `.env` files or credentials.
2. In Render, choose **New → Blueprint**, connect the repository, and deploy the `render.yaml` Blueprint.
3. When prompted, set `DATABASE_URL` to a PostgreSQL connection URI. For Supabase, use the Session Pooler URI from **Project Settings → Database → Connection string** and append `?sslmode=require` if it is not already present.
4. Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the project's Supabase publishable key. This public key is exposed to the browser by design; never use a Supabase secret/service-role key here.
5. Render generates `SECRET_KEY` and `AGRO_DEVICE_TOKEN`. If using Gemini, set `AI_PROVIDER=gemini` and provide `GEMINI_API_KEY` in the backend service's environment. Otherwise, the default local assistant needs no AI key.
6. Wait for both services to deploy. Open the frontend at `https://agroverse-frontend.onrender.com`.

The frontend environment variables are set in `render.yaml`. If Render assigns different service URLs, update `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, and backend `CORS_ORIGINS` to match, then redeploy.

## Supabase and Google OAuth

In Supabase **Authentication → URL Configuration**, set the Site URL to the deployed frontend URL and allow `https://agroverse-frontend.onrender.com/dashboard` as a redirect URL. Keep the Google OAuth authorized redirect URI set to `https://<project-ref>.supabase.co/auth/v1/callback`.

## Local Development

The same backend and frontend commands remain available locally. The frontend production start script uses the `PORT` environment variable when provided by Render and defaults to port 3000 otherwise.
