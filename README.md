# VideoMenu

QR-code video menus for restaurants. Diners scan a table QR code and land on a mobile-first menu page where every dish has a short video. Restaurant staff manage items and upload videos through a simple multi-tenant dashboard.

## Stack

- **apps/web** — Next.js 14 (App Router) + Tailwind + TypeScript. Public menu pages + restaurant dashboard.
- **apps/api** — Express + TypeScript + Prisma. REST API, auth, S3 presigned uploads, QR generation.
- **Postgres** — one shared database, tenant-scoped by `restaurantId`.
- **AWS S3 + CloudFront** — private bucket for videos/thumbnails/QR codes, served publicly through a CDN.

## Auth model

The public menu (`/menu/[slug]`, what the QR code opens) requires **no login at all**. JWT cookie auth guards only `/dashboard/*` and the mutating API routes used by restaurant staff.

## Onboarding a restaurant

There is no public signup for the MVP. A platform admin runs a script to create each tenant:

```bash
npm run create-restaurant -w apps/api -- --name "Trattoria Bella" --slug trattoria-bella --email owner@trattoria.com
```

This prints a generated temporary password for the owner to log in with at `/login`.

## Local development

1. **Start Postgres**
   ```bash
   docker compose up -d
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure environment** — copy each `.env.example` to `.env` and fill in values:
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```
   For local dev without a real AWS account, you can leave the AWS_* vars blank — everything works except actually uploading/serving video (upload requests will fail until a bucket is configured; see below).
4. **Run migrations**
   ```bash
   npm run prisma:migrate
   ```
5. **Create your first restaurant**
   ```bash
   npm run create-restaurant -w apps/api -- --name "Demo Diner" --slug demo-diner --email owner@demo.com
   ```
6. **Run both apps**
   ```bash
   npm run dev
   ```
   - API: http://localhost:4000
   - Web: http://localhost:3000
   - Public menu: http://localhost:3000/menu/demo-diner
   - Dashboard: http://localhost:3000/login

## AWS setup (S3 + CloudFront)

1. Create a private S3 bucket (block all public access on).
2. Create a CloudFront distribution with the bucket as its origin, using **Origin Access Control (OAC)** so only CloudFront can read objects — never make the bucket itself public.
3. Set CORS on the bucket to allow `PUT` from your web app's origin(s), so the browser can upload directly via presigned URLs:
   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:3000", "https://your-web-domain.vercel.app"],
       "AllowedMethods": ["PUT"],
       "AllowedHeaders": ["*"]
     }
   ]
   ```
4. Create an IAM user (or role) with `s3:PutObject`/`s3:GetObject` scoped to that bucket only, and put its access key in `apps/api/.env`.
5. Put the CloudFront domain (e.g. `d123abc.cloudfront.net`) in `apps/api/.env` as `CLOUDFRONT_DOMAIN`.

## Deployment

- **apps/web → Vercel**: import the repo, set root directory to `apps/web`, add the env vars from `apps/web/.env.example`.
- **apps/api → Render**: new Web Service, root directory `apps/api`, build command `npm install && npm run build && npx prisma migrate deploy`, start command `npm start`. Add a Render Postgres instance and set `DATABASE_URL`. Add the remaining env vars from `apps/api/.env.example`.
- Set `CORS_ORIGIN` on the API to your Vercel URL, and `NEXT_PUBLIC_API_URL` on the web app to your Render URL. Cookies are cross-domain (`SameSite=None; Secure`), so both must be served over HTTPS in production.

## Phase 2 (explicitly out of scope for this MVP)

Video compression/transcoding, analytics, search & dish filters, public self-serve restaurant signup, password reset, billing.
