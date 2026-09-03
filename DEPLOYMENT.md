# 🚀 Ghost AI — Complete Production Deployment Guide

This guide provides step-by-step instructions to deploy **Ghost AI** to **Vercel** utilizing **100% Free-Tier** services for database, authentication, real-time collaboration, blob storage, background compute, and generative AI.

---

## 📊 Free-Tier Architecture Overview

| Component | Platform / Service | Free Tier Allowance | Purpose in Ghost AI |
| :--- | :--- | :--- | :--- |
| **Web & API Host** | [Vercel](https://vercel.com) | Hobby Plan (Unlimited free deployments, Edge & Serverless functions, Automatic SSL) | Frontend UI & Next.js App Router API Routes |
| **Database (Postgres)** | [Neon Postgres](https://neon.tech) / [Prisma Postgres](https://prisma.io) | 0.5 GB storage, autoscaling serverless, connection pooling with SSL | Projects, collaborators, specs metadata, task runs |
| **Authentication** | [Clerk](https://clerk.com) | 10,000 Monthly Active Users (MAU), Social Logins | User signup, login, session tokens, JWTs |
| **Realtime Canvas** | [Liveblocks](https://liveblocks.io) | 50 Monthly Active Users, 500K connections | Realtime canvas state, live cursor presence, node dragging |
| **Blob Storage** | [Vercel Blob](https://vercel.com/dashboard/stores) | 1 GB Storage, 50,000 operations/month | Architectural Markdown specs, snapshot backups |
| **AI Architecture Engine**| [Google Gemini API](https://aistudio.google.com) | 15 Requests/Min, 1,000,000 Tokens/Min (gemini-2.5-flash) | Autonomous canvas design agent & technical spec writer |
| **Background Tasks** | [Trigger.dev](https://trigger.dev) | 10,000 runs/month, real-time frontend streaming | Durable async execution for heavy multi-step canvas tasks |

---

## 🛠️ Step-by-Step Setup Instructions

### 1. Database (PostgreSQL via Prisma / Neon)

Ghost AI uses Prisma ORM with connection pooling. You can use your existing **Prisma Postgres** database or create a new free instance on **Neon**.

#### Option A: Existing Prisma Postgres
- If you already have a Prisma connection string (e.g. from db.prisma.io), your connection string will look like:
  `env
  DATABASE_URL="postgres://username:password@pooled.db.prisma.io:5432/postgres?sslmode=require"
  `

#### Option B: Neon Serverless Postgres (Recommended Free Tier)
1. Sign up at [neon.tech](https://neon.tech).
2. Create a new project (e.g. ghost-ai-prod).
3. Select **Pooled connection string** (with pgbouncer enabled and sslmode=require).
4. Copy the connection string.

#### Push Database Schema:
From your local terminal, push the Prisma schema to create all tables:
`ash
npm run db:push
`

---

### 2. Authentication (Clerk)

1. Sign up at [clerk.com](https://clerk.com) and create a new application named **Ghost AI**.
2. Select your desired sign-in methods (Email/Password, Google, GitHub).
3. Under **Configure > API Keys**, copy:
   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (starts with pk_live_ or pk_test_)
   - CLERK_SECRET_KEY (starts with sk_live_ or sk_test_)
4. Under **Configure > Paths**, ensure standard routes are configured:
   - Sign-in URL: /sign-in
   - Sign-up URL: /sign-up
   - After sign-in: /
   - After sign-up: /

---

### 3. Realtime Collaboration (Liveblocks)

1. Sign up at [liveblocks.io](https://liveblocks.io) and create a new project.
2. In your Liveblocks Dashboard, go to **API Keys** and copy:
   - LIVEBLOCKS_PUBLIC_KEY (starts with pk_live_ or pk_dev_)
   - LIVEBLOCKS_SECRET_KEY (starts with sk_live_ or sk_dev_)

---

### 4. Storage (Vercel Blob)

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and navigate to **Storage**.
2. Click **Create Database** and select **Blob**.
3. Name your store (e.g. ghost-ai-blob) and create it.
4. Go to **Settings > Access Tokens** and copy:
   - BLOB_READ_WRITE_TOKEN (starts with ercel_blob_rw_...)

---

### 5. Google Gemini AI API

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Click **Create API Key**.
3. Copy your GEMINI_API_KEY.
4. The recommended production model is gemini-2.5-flash (or gemini-2.0-flash).

---

### 6. Background Tasks (Trigger.dev) [Optional / Recommended]

Ghost AI supports both **Trigger.dev Cloud** (for durable background jobs) and **in-process direct execution fallback**.

1. Sign up at [trigger.dev](https://trigger.dev) and create a project.
2. Under **Project Settings > API Keys**, copy your TRIGGER_SECRET_KEY (	r_prod_... or 	r_dev_...).
3. Deploy your Trigger.dev tasks from the terminal:
   `ash
   npm run trigger:deploy
   `

---

## 🚢 Deploying to Vercel (Step-by-Step)

### Step 1: Push Code to GitHub
Ensure all your latest code is pushed to your GitHub repository:
`ash
git add .
git commit -m "chore: prepare for production deployment"
git push origin main
`

### Step 2: Import Project in Vercel
1. Go to [vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and click **Import** next to your Ghost-AI repository.
3. Keep default settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: prisma generate && next build (or default 
pm run build)
   - **Install Command**: 
pm install

### Step 3: Add Environment Variables in Vercel
In the **Environment Variables** section, paste the following keys:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| DATABASE_URL | postgres://user:pass@host:5432/db?sslmode=require | PostgreSQL pooled connection string |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | pk_live_... | Clerk Public Key |
| CLERK_SECRET_KEY | sk_live_... | Clerk Secret Key |
| NEXT_PUBLIC_CLERK_SIGN_IN_URL | /sign-in | Clerk Sign In URL |
| NEXT_PUBLIC_CLERK_SIGN_UP_URL | /sign-up | Clerk Sign Up URL |
| NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL | / | Redirect after Sign In |
| NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL | / | Redirect after Sign Up |
| LIVEBLOCKS_PUBLIC_KEY | pk_live_... | Liveblocks Public Key |
| LIVEBLOCKS_SECRET_KEY | sk_live_... | Liveblocks Secret Key |
| BLOB_READ_WRITE_TOKEN | ercel_blob_rw_... | Vercel Blob Read-Write Token |
| GEMINI_API_KEY | AIzaSy... | Google AI Studio Key |
| GEMINI_MODEL | gemini-2.5-flash | Gemini Model Identifier |
| TRIGGER_SECRET_KEY | 	r_prod_... | Trigger.dev Secret Key (Optional) |

### Step 4: Click Deploy
Click **Deploy**! Vercel will build the Next.js application, generate Prisma Client, optimize static assets, and deploy to your custom .vercel.app domain with free SSL.

---

## 🔍 Post-Deployment Verification Checklist

- [ ] **Authentication**: Navigate to /sign-in, create an account or sign in with Google/Email.
- [ ] **Dashboard**: Create a new architecture project; verify it creates and loads in PostgreSQL.
- [ ] **Realtime Canvas**: Open the project editor; verify dragging nodes, zooming, and panning works smoothly.
- [ ] **Multiplayer Presence**: Open the editor in two different browser tabs; verify cursor presence and live changes sync via Liveblocks.
- [ ] **AI Canvas Generation**: Type an architecture prompt in the AI Workspace sidebar (e.g. *"Create a microservices e-commerce system with event streaming"*); verify nodes & edges generate on the canvas.
- [ ] **Technical Spec Generation**: Click **Generate Spec**; verify the specification document generates, displays in the preview modal, and saves to Vercel Blob.
- [ ] **Spec Download**: Click **Download (.md)**; verify the .md file downloads cleanly to your device.
- [ ] **Revisiting Specs**: Switch to the **Specs** tab in the sidebar; verify past specifications are listed and viewable anytime.

---

## 🛠️ Troubleshooting

- **Prisma Client not found in Vercel**: Ensure "postinstall": "prisma generate" is present in package.json.
- **Database Connection Error (P1001)**: Ensure your DATABASE_URL contains ?sslmode=require and uses the **pooled connection port** (e.g., 5432 or 6543 for PgBouncer).
- **Vercel Blob 403 Forbidden**: Verify BLOB_READ_WRITE_TOKEN is correctly set in Vercel Environment Variables.
- **Clerk Domain Warning**: In Clerk Dashboard under **Production Domains**, add your Vercel deployment domain (e.g. your-app.vercel.app) if using production keys.
