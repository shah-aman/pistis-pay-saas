# SolaPay MVP - Setup Guide

## Prerequisites

- Node.js 18+ installed
- pnpm package manager
- Supabase account
- Sphere Labs API access

## Step 1: Clone and Install Dependencies

```bash
git clone <your-repo>
cd pistis-pay-saas
pnpm install
```

## Step 2: Setup Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned
3. Go to Project Settings > API
4. Copy the following:
   - Project URL
   - Anon (public) key
   - Service role key

## Step 3: Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (from Supabase Project Settings > Database)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[HOST]:[PORT]/postgres?schema=public

# Auth Secret (generate a random string)
AUTH_SECRET=your-random-secret-key-here

# Sphere Labs
SPHERE_API_KEY=your-sphere-api-key
SPHERE_WEBHOOK_SECRET=your-sphere-webhook-secret
NEXT_PUBLIC_SPHERE_ENV=sandbox

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Setup Database with Prisma

Run Prisma migrations to create database tables:

```bash
pnpm prisma:generate
pnpm prisma:push
```

To view your database:

```bash
pnpm prisma:studio
```

## Step 5: Setup Supabase Auth

1. In your Supabase dashboard, go to Authentication > Providers
2. Enable Email provider
3. Configure email templates if desired
4. Go to Authentication > URL Configuration
5. Add `http://localhost:3000` to Redirect URLs

## Step 6: Get Sphere Labs API Keys

1. Go to [spherepay.co](https://spherepay.co)
2. Sign up for a developer account
3. Get your sandbox API key from the dashboard
4. Add to `.env.local` as shown above

## Step 7: Setup Webhooks (Optional for Local Development)

Webhooks are required for real-time payment status updates, but you can skip this step initially and set it up later.

### Option A: Use ngrok for Local Development (Recommended)

1. Install ngrok: `brew install ngrok` (Mac) or download from [ngrok.com](https://ngrok.com)
2. Start your Next.js dev server: `pnpm dev`
3. In a new terminal, expose port 3000:
   ```bash
   ngrok http 3000
   ```
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. In Sphere dashboard, configure webhook URL: `https://your-ngrok-url.ngrok.io/api/webhooks/sphere`
6. Get the webhook secret from Sphere dashboard and add to `.env.local`:
   ```bash
   SPHERE_WEBHOOK_SECRET=your-webhook-secret-from-sphere
   ```

**Note:** ngrok URLs change each time you restart ngrok (unless you have a paid plan). You'll need to update the webhook URL in Sphere dashboard each time.

### Option B: Deploy to Vercel First

1. Push your code to GitHub
2. Connect to Vercel and deploy
3. Use the Vercel preview/production URL for webhook configuration
4. Configure webhook in Sphere dashboard: `https://your-app.vercel.app/api/webhooks/sphere`

### Option C: Skip Webhooks for Now

You can test payment creation and listing without webhooks. Payment status updates will need to be manually refreshed or will be updated when you set up webhooks later.

## Step 8: Run Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Step 9: First Time Setup

1. Click "Sign Up" and create an account
2. You'll be automatically logged in and redirected to dashboard
3. Complete your merchant profile in Settings

## Project Structure

```
├── app/
│   ├── (dashboard)/          # Protected dashboard pages
│   │   ├── dashboard/         # Main dashboard
│   │   ├── pricing/           # Pricing page
│   │   └── layout.tsx         # Dashboard layout
│   ├── (login)/               # Auth pages
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   └── actions.ts         # Auth server actions
│   └── api/                   # API routes
│       ├── payments/          # Payment APIs
│       ├── user/              # User API
│       └── webhooks/          # Webhook handlers
├── components/
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── supabase/              # Supabase client
│   ├── sphere/                # Sphere SDK wrapper
│   ├── auth/                  # Auth utilities
│   └── prisma.ts              # Prisma client
├── prisma/
│   └── schema.prisma          # Database schema
└── types/                     # TypeScript types
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm prisma:generate` - Generate Prisma client
- `pnpm prisma:migrate` - Run database migrations
- `pnpm prisma:studio` - Open Prisma Studio
- `pnpm prisma:push` - Push schema changes to database

## Troubleshooting

### Database Connection Errors

Make sure your `DATABASE_URL` is correct. You can find it in Supabase:
Project Settings > Database > Connection string

### Prisma Client Not Generated

Run: `pnpm prisma:generate`

### Supabase Auth Not Working

1. Check that `NEXT_PUBLIC_SUPABASE_URL` and keys are correct
2. Verify email provider is enabled in Supabase dashboard
3. Check redirect URLs are configured

### Sphere API Errors

1. Verify your `SPHERE_API_KEY` is valid
2. Make sure you're using sandbox mode for development
3. Check Sphere dashboard for API logs

## Next Steps

1. **If you skipped webhooks:** You can still test payment link creation and listing. Payment status updates will require webhook setup.

2. **If you set up webhooks:** Test the payment flow:
   - Create a payment link from dashboard
   - Pay using Solana USDC (devnet for sandbox)
   - Verify payment appears in dashboard

3. Deploy to Vercel (see DEPLOYMENT.md)

## Support

For issues:
- Supabase: https://supabase.com/docs
- Sphere Labs: https://docs.spherepay.co
- Prisma: https://www.prisma.io/docs


