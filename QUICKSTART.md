# Quick Start Guide - Get Your App Running in 15 Minutes

Follow these steps to set up authentication and deploy your PCF Rep Scheduler.

## Step 1: Create Supabase Account (5 minutes)

1. Go to **https://supabase.com**
2. Click **"Start your project"** and sign up
3. Click **"New Project"**
4. Fill in:
   - Name: `pcf-rep-scheduler`
   - Password: (create and save a strong password)
   - Region: (choose closest to you)
   - Plan: Free
5. Click **"Create new project"**
6. ⏰ Wait 2-3 minutes for setup

## Step 2: Get Your API Keys (2 minutes)

1. In Supabase, click **⚙️ Settings** (bottom left)
2. Click **API**
3. Copy these two values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (long string starting with `eyJ`)

## Step 3: Configure Your App (2 minutes)

1. Open your project folder
2. Open `.env.local` file
3. Replace the placeholder text:

```bash
VITE_SUPABASE_URL=paste-your-project-url-here
VITE_SUPABASE_ANON_KEY=paste-your-anon-key-here
```

4. Save the file

## Step 4: Disable Email Confirmation (1 minute)

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Email** section
3. Scroll to **"Confirm email"**
4. Toggle it **OFF**
5. Click **Save**

## Step 5: Create Your First User (2 minutes)

1. In Supabase, go to **Authentication** → **Users**
2. Click **"Add User"** → **"Create new user"**
3. Fill in:
   - Email: your-email@example.com
   - Password: (create a password you'll remember)
   - Auto Confirm User: **ON**
4. Click **"Create User"**

## Step 6: Run Your App Locally (1 minute)

```bash
npm install
npm run dev
```

Open **http://localhost:3000** and login with your credentials!

## Step 7: Deploy to Vercel (2 minutes)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Build and deploy:
```bash
npm run build
vercel
```

3. Follow the prompts (just hit Enter for most)

4. Add environment variables:
   - Go to **https://vercel.com**
   - Click your project
   - Go to **Settings** → **Environment Variables**
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

5. Redeploy:
```bash
vercel --prod
```

## 🎉 Done!

Your app is now live with real authentication!

**Add more users:**
- Supabase → Authentication → Users → Add User

**Your live URL:**
- Check your Vercel dashboard for the URL

---

## Troubleshooting

**Can't login?**
- Check that email confirmation is disabled in Supabase
- Verify "Auto Confirm User" was ON when creating the user
- Double-check email and password

**"Supabase credentials not found" warning?**
- Make sure `.env.local` has your actual Supabase URL and key
- Restart your dev server (`npm run dev`)

**Still stuck?**
- Check [SETUP.md](SETUP.md) for detailed instructions
- Check browser console (F12) for error messages
