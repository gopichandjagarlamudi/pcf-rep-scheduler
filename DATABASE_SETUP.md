# Database Setup for Schedule Persistence

This guide will help you set up the database table in Supabase to enable schedule persistence.

## Why You Need This

Without the database table:
- ❌ Schedules disappear when you refresh the page
- ❌ Each user can't have their own saved schedules

With the database table:
- ✅ Schedules are automatically saved when generated
- ✅ Schedules load automatically when you login
- ✅ Each user has their own private schedules
- ✅ Schedules persist across browser sessions

---

## Setup Steps (5 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your `pcf-rep-scheduler` project
3. Click on **SQL Editor** in the left sidebar (database icon)
4. Click **"New Query"**

### Step 2: Copy the SQL Schema

1. Open the file `supabase-schema.sql` in your project folder
2. Copy **all the contents** of that file
3. Paste it into the Supabase SQL Editor

### Step 3: Run the SQL

1. Click **"Run"** button (or press Cmd/Ctrl + Enter)
2. You should see a success message: "Success. No rows returned"
3. That's it! The database table is created.

---

## What Was Created

The SQL script created:

### 1. **schedules table**
Stores user schedules with these columns:
- `id` - Unique identifier
- `user_id` - Links to the authenticated user
- `schedule_data` - The generated schedule (JSON)
- `stats_data` - Schedule statistics (JSON)
- `date_range_start` - Start date of the schedule
- `date_range_end` - End date of the schedule
- `created_at` - When the schedule was created
- `updated_at` - When the schedule was last updated

### 2. **Security Policies (Row Level Security)**
- Users can only see their own schedules
- Users can only create/update/delete their own schedules
- Complete privacy between users

### 3. **Indexes**
- Fast queries by user_id
- Fast queries for latest schedule

### 4. **Auto-update Trigger**
- Automatically updates `updated_at` timestamp

---

## How It Works Now

### When You Generate a Schedule:
1. Click "Generate Weekly Plan"
2. Schedule is displayed on screen
3. **Automatically saved to database** (happens in background)
4. Linked to your user account

### When You Login:
1. Enter your email and password
2. App authenticates you
3. **Automatically loads your last schedule** (if you have one)
4. Schedule appears on screen

### When You Logout:
1. Click logout button
2. Schedule clears from screen
3. Schedule remains safely in database
4. Will reload when you login again

---

## Verify It's Working

### Test Schedule Persistence:

1. **Login** to your app
2. **Upload files** and **generate a schedule**
3. **Refresh the page** (F5 or Cmd+R)
   - ✅ You should still be logged in
   - ✅ Your schedule should still be there!
4. **Logout** and **login again**
   - ✅ Your schedule should load automatically
5. **Generate a new schedule**
   - ✅ Old schedule is replaced with new one

---

## Troubleshooting

### "relation schedules does not exist"
- You haven't run the SQL script yet
- Go back to Step 1 and run `supabase-schema.sql`

### "permission denied for table schedules"
- Row Level Security might not be set up correctly
- Re-run the SQL script (it's safe to run multiple times)

### Schedule doesn't load after login
- Check browser console (F12) for errors
- Make sure you ran the SQL script successfully
- Verify you generated a schedule while logged in

### Schedule not saving
- Check browser console for errors
- Verify your Supabase credentials in `.env.local`
- Make sure you're logged in when generating

---

## Check Your Database

To see your saved schedules in Supabase:

1. Go to Supabase dashboard
2. Click **Table Editor** (left sidebar)
3. Select **schedules** table
4. You'll see all your saved schedules

**Note:** You can only see schedules for your own user account due to Row Level Security.

---

## Advanced: View All Schedules (Admin Only)

If you want to see ALL users' schedules (as an admin):

1. Go to Supabase → **SQL Editor**
2. Run this query:
```sql
SELECT
  s.id,
  u.email as user_email,
  s.date_range_start,
  s.date_range_end,
  s.created_at
FROM schedules s
JOIN auth.users u ON s.user_id = u.id
ORDER BY s.created_at DESC;
```

This bypasses Row Level Security (only works in SQL Editor).

---

## Need Help?

- **SQL script errors**: Check that you copied the entire `supabase-schema.sql` file
- **Permission errors**: Make sure you're the project owner in Supabase
- **Can't find SQL Editor**: It's in the left sidebar with a database icon

---

## What's Next?

Your schedule persistence is now set up! Each user will have their own private, persistent schedules.

Future enhancements you could add:
- Schedule history (keep multiple past schedules)
- Schedule versioning
- Export/import schedules
- Share schedules between users
- Schedule comparison

Let me know if you want any of these features!
