# PCF Rep Scheduler - Authentication Setup Guide

This guide will walk you through setting up real authentication for your PCF Rep Scheduler application using Supabase.

## Table of Contents
1. [Create Supabase Account](#1-create-supabase-account)
2. [Configure Your Project](#2-configure-your-project)
3. [Add Users](#3-add-users)
4. [Local Development](#4-local-development)
5. [Deploy to Production](#5-deploy-to-production)

---

## 1. Create Supabase Account

### Step 1.1: Sign Up for Supabase
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up using GitHub, Google, or Email

### Step 1.2: Create a New Project
1. Click "New Project" in your Supabase dashboard
2. Fill in the following:
   - **Project Name**: `pcf-rep-scheduler` (or any name you prefer)
   - **Database Password**: Create a strong password (save this securely!)
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Select "Free" (sufficient for <50 users)
3. Click "Create new project"
4. Wait 2-3 minutes for the project to be provisioned

---

## 2. Configure Your Project

### Step 2.1: Get Your API Keys
1. In your Supabase project dashboard, click on the ⚙️ **Settings** icon (bottom left)
2. Click on **API** in the settings menu
3. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
4. Keep this tab open - you'll need these values next

### Step 2.2: Update Your .env.local File
1. Open your project folder in your code editor
2. Open the `.env.local` file
3. Replace the placeholder values:

```bash
VITE_SUPABASE_URL=https://your-actual-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-actual-anon-key-here
```

### Step 2.3: Enable Email Authentication
1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Make sure **Email** is enabled (it should be by default)
3. Scroll down to **Email Auth** settings and configure:
   - **Enable email confirmations**: Turn this OFF for easier testing (you can enable later)
   - Click **Save**

---

## 3. Add Users

### Option A: Add Users Manually (Recommended for Admin-Only Access)

1. In Supabase dashboard, go to **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Fill in:
   - **Email**: user@yourcompany.com
   - **Password**: Create a strong password
   - **Auto Confirm User**: Turn this ON (so they don't need email verification)
4. Click **Create User**
5. Repeat for each person who needs access

**Important**: Share the credentials securely with each user (don't send passwords via email!)

### Option B: User Self-Registration (Not Implemented Yet)
Currently, users cannot sign up themselves. If you want this feature, let me know and I can add a registration page that you can enable/disable.

---

## 4. Local Development

### Step 4.1: Install Dependencies
```bash
npm install
```

### Step 4.2: Run Development Server
```bash
npm run dev
```

### Step 4.3: Test Authentication
1. Open your browser to `http://localhost:3000`
2. You should see the login page
3. Enter the email and password of a user you created in Supabase
4. If successful, you'll see the PCF Rep Scheduler dashboard

### Troubleshooting
- **"Invalid login credentials" error**: Double-check the email and password
- **Blank screen or errors**: Check browser console (F12) for error messages
- **"Supabase credentials not found" warning**: Make sure `.env.local` has correct values
- **Connection errors**: Verify your Project URL is correct in `.env.local`

---

## 5. Deploy to Production

### Option A: Deploy to Vercel (Recommended - Free & Easy)

#### Step 5.1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 5.2: Build Your Project
```bash
npm run build
```

#### Step 5.3: Deploy
```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Choose your account
- **Link to existing project?** No
- **Project name?** pcf-rep-scheduler (or your preferred name)
- **Directory with code?** ./ (just press Enter)
- **Override settings?** No

#### Step 5.4: Add Environment Variables to Vercel
1. Go to [https://vercel.com](https://vercel.com) and log in
2. Click on your project (`pcf-rep-scheduler`)
3. Go to **Settings** → **Environment Variables**
4. Add these two variables:
   - **Name**: `VITE_SUPABASE_URL`, **Value**: Your Supabase URL
   - **Name**: `VITE_SUPABASE_ANON_KEY`, **Value**: Your Supabase anon key
5. Click **Save**

#### Step 5.5: Redeploy
```bash
vercel --prod
```

Your app is now live! Vercel will give you a URL like `https://pcf-rep-scheduler.vercel.app`

---

### Option B: Deploy to Netlify

#### Step 5.1: Build Your Project
```bash
npm run build
```

#### Step 5.2: Install Netlify CLI
```bash
npm install -g netlify-cli
```

#### Step 5.3: Deploy
```bash
netlify deploy
```

Follow the prompts, then for production deployment:
```bash
netlify deploy --prod
```

#### Step 5.4: Add Environment Variables
1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Click on your site
3. Go to **Site settings** → **Environment variables**
4. Add your Supabase credentials

---

## Security Best Practices

### 1. Row Level Security (RLS)
Supabase automatically handles user authentication, but if you add database tables in the future:
1. Go to Supabase dashboard → **Database** → **Tables**
2. Enable RLS on all tables
3. Create policies to restrict access

### 2. Password Policy
When creating users, enforce strong passwords:
- At least 12 characters
- Mix of uppercase, lowercase, numbers, and symbols
- Don't reuse passwords

### 3. User Management
- Regularly audit your user list in Supabase
- Remove access for users who no longer need it
- Consider adding Multi-Factor Authentication (MFA) for admins

### 4. Monitoring
- Check Supabase dashboard → **Authentication** → **Users** regularly
- Monitor login attempts and failed authentications
- Set up email notifications for unusual activity

---

## Common Tasks

### Reset a User's Password
1. Go to Supabase dashboard → **Authentication** → **Users**
2. Click on the user
3. Click **Reset Password**
4. Option 1: Send password reset email (if email confirmations enabled)
5. Option 2: Set a new password manually and share it securely

### Delete a User
1. Go to Supabase dashboard → **Authentication** → **Users**
2. Click on the user
3. Click **Delete User**
4. Confirm deletion

### View Login Activity
1. Go to Supabase dashboard → **Authentication** → **Logs**
2. You can see all authentication events

---

## Need Help?

### Supabase Documentation
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase Dashboard](https://app.supabase.com)

### Vercel Documentation
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Environment Variables](https://vercel.com/docs/environment-variables)

### Support
If you encounter issues, check:
1. Browser console for error messages (F12)
2. Supabase dashboard → **Logs** for backend errors
3. Vercel/Netlify deployment logs
