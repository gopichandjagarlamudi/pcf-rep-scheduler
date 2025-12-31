<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# PCF Rep Scheduler

An automated schedule generation system for field representatives that creates optimized weekly work schedules across multiple store locations.

## Features

- **Smart Scheduling**: Intelligent shift assignment with constraint satisfaction
- **Real Authentication**: Secure login with Supabase (admin-controlled user access)
- **Persistent Schedules**: Auto-save and auto-load schedules per user
- **Analytics Dashboard**: Real-time statistics and compliance tracking
- **Excel/CSV Import**: Easy data upload for reps, locations, and availability
- **Location Optimization**: Distance-based assignment with rotation rules
- **Export Functionality**: Download schedules as CSV

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Supabase account (free tier available)

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure authentication:**
   - See [SETUP.md](SETUP.md) for detailed Supabase setup instructions
   - Copy `.env.example` to `.env.local` and add your Supabase credentials

3. **Set up database:**
   - See [DATABASE_SETUP.md](DATABASE_SETUP.md) to enable schedule persistence
   - Run the SQL script in your Supabase project (takes 2 minutes)

4. **Run the app:**
   ```bash
   npm run dev
   ```

5. **Access the app:**
   - Open `http://localhost:3000`
   - Login with credentials created in Supabase
   - Your schedules will auto-save and persist across sessions!

## Authentication Setup

This app uses **Supabase** for authentication with admin-only user creation.

**📖 Complete setup guide: [SETUP.md](SETUP.md)**

Quick overview:
1. Create a free Supabase account
2. Get your project URL and API key
3. Add credentials to `.env.local`
4. Manually add users through Supabase dashboard
5. Deploy to Vercel (free)

## Deployment

### Deploy to Vercel (Recommended)
```bash
npm run build
vercel
```

See [SETUP.md](SETUP.md) for detailed deployment instructions.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Authentication**: Supabase
- **Charts**: Recharts
- **Data Processing**: XLSX, date-fns

## User Management

Users are managed through the Supabase dashboard:
1. Go to your Supabase project → Authentication → Users
2. Click "Add User" to create new accounts
3. Share credentials securely with authorized personnel

## Support

For setup issues or questions, see [SETUP.md](SETUP.md) or check the Supabase documentation.
