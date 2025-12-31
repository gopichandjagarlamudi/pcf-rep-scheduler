# Schedule Persistence Feature

## What Was Implemented

Your PCF Rep Scheduler now has **persistent schedules**! Each user's schedules are automatically saved to the database and reload when they log in.

---

## How It Works

### Auto-Save
✅ When you click "Generate Weekly Plan":
- Schedule is generated and displayed
- **Automatically saved to Supabase database** (background)
- Linked to your user account
- Replaces any previous schedule (only latest is kept)

### Auto-Load
✅ When you login:
- Your most recent schedule **loads automatically**
- No need to regenerate or re-upload files
- Schedule appears instantly

### User Isolation
✅ Privacy & Security:
- Each user has their own private schedule
- You can only see your own schedules
- Complete isolation between users
- Row Level Security enforced at database level

---

## What Changed

### New Files Created:

1. **`lib/scheduleDb.ts`** - Database functions
   - `saveSchedule()` - Saves schedule to database
   - `loadSchedule()` - Loads latest schedule from database
   - `deleteSchedule()` - Deletes user's schedule

2. **`supabase-schema.sql`** - Database schema
   - Creates `schedules` table
   - Sets up Row Level Security policies
   - Creates indexes for fast queries
   - You need to run this in Supabase SQL Editor

3. **`DATABASE_SETUP.md`** - Setup instructions
   - Step-by-step guide to set up the database
   - Troubleshooting tips
   - Verification steps

### Files Modified:

1. **`App.tsx`**
   - Added `loadSchedule()` call on login
   - Added `saveSchedule()` call after generating schedule
   - Clears schedule data on logout

2. **`README.md`**
   - Added "Persistent Schedules" to features
   - Added database setup step to Quick Start

---

## Setup Required

**IMPORTANT:** You need to run the SQL script once in Supabase!

### Quick Setup (2 minutes):

1. Open `supabase-schema.sql` in your project
2. Go to Supabase → SQL Editor
3. Copy and paste the entire SQL script
4. Click "Run"
5. Done! ✅

**Full instructions:** See [DATABASE_SETUP.md](DATABASE_SETUP.md)

---

## User Experience

### Before (Without Persistence):
- ❌ Generate schedule
- ❌ Refresh page → schedule **gone**
- ❌ Logout/login → schedule **gone**
- ❌ Have to re-upload files and regenerate every time

### After (With Persistence):
- ✅ Generate schedule once
- ✅ Refresh page → schedule **still there**
- ✅ Logout/login → schedule **loads automatically**
- ✅ Never lose your work

---

## Database Schema

The `schedules` table has these columns:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier |
| `user_id` | UUID | References auth.users (who owns this) |
| `schedule_data` | JSONB | The generated schedule entries |
| `stats_data` | JSONB | Schedule statistics |
| `date_range_start` | DATE | Start date of schedule |
| `date_range_end` | DATE | End date of schedule |
| `created_at` | TIMESTAMP | When created |
| `updated_at` | TIMESTAMP | When last updated |

---

## Implementation Details

### Save Logic:
```typescript
// After generating schedule
const saveResult = await saveSchedule(
  result.schedule,
  result.stats,
  dateRange.start,
  dateRange.end
);
```

### Load Logic:
```typescript
// On login
const result = await loadSchedule();
if (result.success && result.schedule) {
  setSchedule(result.schedule);
  setStats(result.stats);
  setDateRange(result.dateRange);
}
```

### Behavior:
- **One schedule per user** (latest only)
- New schedules **overwrite old ones**
- Schedules **persist forever** (until overwritten)
- **No manual save required** (automatic)

---

## Testing

### Test Schedule Persistence:

1. **Login** to your app
2. **Generate a schedule** (upload files, click Generate)
3. **Refresh the browser** (F5)
   - ✅ Schedule should still be there
4. **Logout** and **login again**
   - ✅ Schedule should load automatically
5. **Generate a new schedule**
   - ✅ Old schedule is replaced

### Verify in Supabase:

1. Go to Supabase → Table Editor
2. Click on `schedules` table
3. You should see your saved schedule
4. Each row represents one user's latest schedule

---

## Security

### Row Level Security (RLS):
- **Enabled** on `schedules` table
- Users can only access their own schedules
- Enforced at database level (not just frontend)

### Policies Created:
1. Users can **view** only their own schedules
2. Users can **create** only their own schedules
3. Users can **update** only their own schedules
4. Users can **delete** only their own schedules

### Privacy:
- User A cannot see User B's schedules
- Even admins need SQL access to view all schedules
- Complete data isolation

---

## Future Enhancements (Optional)

If you want to extend this feature, you could add:

### 1. Schedule History
- Keep multiple past schedules
- Browse previous schedules
- Compare different schedules
- Restore old schedules

### 2. Schedule Sharing
- Share schedules with other users
- Team-wide schedules
- Read-only access for certain users

### 3. Schedule Versioning
- Track changes to schedules
- See who made what changes
- Rollback to previous versions

### 4. Schedule Templates
- Save schedules as templates
- Reuse common schedules
- Quick-start from templates

### 5. Export/Import
- Export schedules to different formats
- Import schedules from other systems
- Backup/restore functionality

Let me know if you want any of these!

---

## Troubleshooting

### Schedule doesn't save
- Check browser console (F12) for errors
- Verify SQL script was run successfully
- Make sure you're logged in

### Schedule doesn't load
- Check if SQL script created the table
- Verify user has permission to read
- Check browser console for errors

### "relation schedules does not exist"
- You haven't run the SQL script yet
- Go to DATABASE_SETUP.md and follow steps

### Permission denied errors
- Row Level Security not set up correctly
- Re-run the SQL script

---

## Summary

✅ **Implemented**: Option A (latest schedule only)
✅ **Auto-save**: Schedules save automatically when generated
✅ **Auto-load**: Schedules load automatically on login
✅ **User isolation**: Each user has private schedules
✅ **Persistent**: Schedules never disappear
✅ **Secure**: Row Level Security enforced

**Next step:** Run the SQL script in Supabase to activate this feature!

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed instructions.
