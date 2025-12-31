# Industry Standards Testing Checklist

This comprehensive checklist covers all aspects of testing your PCF Rep Scheduler to ensure it meets industry standards before deployment.

---

## 1. Authentication & Security Testing

### Authentication Flow
- [ ] **Login with valid credentials** - Should succeed
- [ ] **Login with invalid email** - Should show error message
- [ ] **Login with invalid password** - Should show error message
- [ ] **Login with empty fields** - Should show validation error
- [ ] **Session persistence** - Refresh page, should stay logged in
- [ ] **Logout functionality** - Should clear session and redirect to login
- [ ] **Auto-login on return** - Close browser, reopen, should stay logged in (if session valid)

### Security
- [ ] **Password visibility** - Password should be masked (••••)
- [ ] **SQL injection attempt** - Try `' OR '1'='1` in email/password (should fail safely)
- [ ] **XSS attempt** - Try `<script>alert('xss')</script>` in fields (should be sanitized)
- [ ] **Direct URL access** - Try accessing app without login (should redirect to login)
- [ ] **Session expiration** - Wait for session to expire, should logout automatically
- [ ] **Row Level Security** - User A cannot see User B's schedules
- [ ] **API key exposure** - Check browser DevTools, .env values should NOT appear

### Environment Variables
- [ ] **Missing env vars** - App should show warning if Supabase credentials missing
- [ ] **.env.local not committed** - Verify `.env.local` is in `.gitignore`
- [ ] **Production env vars** - Verify environment variables work on Vercel/production

---

## 2. Database & Data Persistence

### Schedule Saving
- [ ] **First schedule save** - Generate schedule, should save to database
- [ ] **Schedule update** - Generate new schedule, should replace old one
- [ ] **Verify in Supabase** - Check Supabase Table Editor, schedule should be there
- [ ] **Schedule data integrity** - Verify JSON structure is correct in database

### Schedule Loading
- [ ] **Load on login** - Login should load saved schedule automatically
- [ ] **Load on refresh** - Refresh page, schedule should still be there
- [ ] **No schedule scenario** - New user with no saved schedule (should show empty state)
- [ ] **Corrupted data handling** - If database has invalid JSON, app shouldn't crash

### User Isolation
- [ ] **User A creates schedule** - Login as User A, generate schedule
- [ ] **User B cannot see User A's schedule** - Login as User B, should not see User A's data
- [ ] **User B creates own schedule** - Should save independently
- [ ] **User A's schedule unchanged** - Login back as User A, original schedule still there

---

## 3. Core Functionality Testing

### File Upload
- [ ] **Upload valid Excel file (.xlsx)** - Should succeed
- [ ] **Upload valid CSV file (.csv)** - Should succeed
- [ ] **Upload invalid file type (.pdf, .txt)** - Should reject or show error
- [ ] **Upload empty file** - Should handle gracefully
- [ ] **Upload large file (>10MB)** - Should handle or show size limit error
- [ ] **Upload file with special characters in name** - Should work
- [ ] **Re-upload same file** - Should replace previous data

### Data Parsing
- [ ] **Parse Reps file** - Should extract all columns correctly
- [ ] **Parse Locations file** - Should extract coordinates correctly
- [ ] **Parse Availability file** - Should parse date/time correctly
- [ ] **Parse Time-off file** - Should handle optional file
- [ ] **Missing required columns** - Should show helpful error
- [ ] **Extra columns in file** - Should ignore extra columns
- [ ] **Empty rows in Excel** - Should skip empty rows
- [ ] **Special characters in data** - Names with accents, apostrophes, etc.

### Schedule Generation
- [ ] **Generate with minimum data** - 3 required files only (reps, locations, availability)
- [ ] **Generate with all 4 files** - Including time-off
- [ ] **Generate without time-off** - Should work (optional file)
- [ ] **Attempt generate without required files** - Should show error
- [ ] **Generate with date range** - Custom start/end dates
- [ ] **Generate with default dates** - Should use next 2 weeks
- [ ] **Re-generate with new data** - Upload new files, generate again

### Schedule Algorithm
- [ ] **Full-time rep gets ~40 hours** - Verify in stats
- [ ] **Part-time rep gets ~24 hours** - Verify in stats
- [ ] **Rep not assigned same location twice in a row** - Check rotation
- [ ] **Location within 5km preferred** - Check distance calculations
- [ ] **Time-off respected** - Rep not scheduled on time-off days
- [ ] **Availability respected** - Rep only scheduled when available
- [ ] **Overflow days detected** - When demand > capacity

---

## 4. UI/UX Testing

### Visual Testing
- [ ] **Responsive on desktop (1920x1080)** - Layout looks good
- [ ] **Responsive on laptop (1366x768)** - Layout looks good
- [ ] **Responsive on tablet (iPad)** - Layout adapts properly
- [ ] **Responsive on mobile (iPhone)** - Usable on small screens
- [ ] **Dark mode compatibility** - If OS uses dark mode (nice-to-have)

### User Interface
- [ ] **Loading states** - Spinners show during async operations
- [ ] **Error messages** - Clear, helpful error messages
- [ ] **Success feedback** - User knows when actions succeed
- [ ] **Disabled states** - Buttons disabled when action not allowed
- [ ] **Empty states** - Helpful messages when no data
- [ ] **Form validation** - Red borders/messages for invalid input

### User Experience
- [ ] **Login is intuitive** - First-time user can login easily
- [ ] **File upload is clear** - Drag-drop works, or click to browse
- [ ] **Schedule generation is obvious** - Clear CTA button
- [ ] **Stats are readable** - Charts and numbers easy to understand
- [ ] **Export works** - CSV download works and opens in Excel
- [ ] **Navigation is clear** - User knows where they are
- [ ] **No broken UI** - No cut-off text, overlapping elements

---

## 5. Performance Testing

### Load Times
- [ ] **Initial page load < 3 seconds** - First contentful paint
- [ ] **Login response < 2 seconds** - From click to dashboard
- [ ] **Schedule generation < 5 seconds** - For typical dataset (50 reps)
- [ ] **File upload < 3 seconds** - For typical file size
- [ ] **Database save/load < 1 second** - Background operation

### Large Datasets
- [ ] **100 reps** - App should handle without crashing
- [ ] **500 schedule entries** - UI should render smoothly
- [ ] **Large Excel file (5MB)** - Should parse without timeout
- [ ] **Multiple files uploaded quickly** - Shouldn't cause race conditions

### Browser Performance
- [ ] **No memory leaks** - Check DevTools Memory tab after 5 minutes
- [ ] **Smooth scrolling** - Schedule table scrolls smoothly
- [ ] **No console errors** - Check browser console (F12)
- [ ] **No console warnings** - Clean console output

---

## 6. Browser Compatibility

### Desktop Browsers
- [ ] **Chrome (latest)** - Full functionality
- [ ] **Firefox (latest)** - Full functionality
- [ ] **Safari (latest)** - Full functionality
- [ ] **Edge (latest)** - Full functionality

### Mobile Browsers
- [ ] **Safari on iOS** - Works on iPhone
- [ ] **Chrome on Android** - Works on Android
- [ ] **Mobile responsiveness** - Touch-friendly, readable

---

## 7. Data Integrity Testing

### Schedule Accuracy
- [ ] **Shift times correct** - 8h (11:00-19:00), 6h (13:00-19:00)
- [ ] **Hour calculations correct** - Total hours match expectations
- [ ] **Date ranges correct** - Schedules within specified dates
- [ ] **Rep names match** - Correct rep assigned to shifts
- [ ] **Location names match** - Correct location for each shift

### Statistics
- [ ] **Shift counts accurate** - Count matches actual schedule
- [ ] **Hour totals accurate** - Sum of all shifts correct
- [ ] **Compliance metrics accurate** - % meeting targets correct
- [ ] **Top 10 chart accurate** - Shows correct top workers
- [ ] **Gap reports accurate** - Lists correct non-compliant reps

### Export
- [ ] **CSV export complete** - All schedule data included
- [ ] **CSV format correct** - Opens properly in Excel/Google Sheets
- [ ] **CSV encoding correct** - Special characters display properly
- [ ] **Dates formatted correctly** - Readable date format

---

## 8. Error Handling

### Network Errors
- [ ] **No internet connection** - Shows helpful error
- [ ] **Supabase down** - Graceful degradation
- [ ] **Slow connection** - Loading states, timeout handling
- [ ] **API rate limits** - Handles Supabase rate limits

### Application Errors
- [ ] **Invalid file format** - Shows error, doesn't crash
- [ ] **Corrupted Excel file** - Shows error, doesn't crash
- [ ] **Missing required data** - Shows which data is missing
- [ ] **Algorithm edge cases** - 0 reps, 0 locations, etc.
- [ ] **Date parsing errors** - Invalid dates in Excel

### User Errors
- [ ] **Wrong file uploaded** - Clear error message
- [ ] **Duplicate uploads** - Handles gracefully
- [ ] **Cancel file upload** - Can cancel and retry
- [ ] **Invalid date range** - End date before start date

---

## 9. Accessibility (WCAG Standards)

### Keyboard Navigation
- [ ] **Tab through form fields** - Logical tab order
- [ ] **Enter to submit forms** - Works without mouse
- [ ] **Esc to close modals** - If any modals exist
- [ ] **Focus indicators visible** - Can see which field is focused

### Screen Reader Support
- [ ] **Form labels readable** - Screen reader announces labels
- [ ] **Error messages announced** - Errors read by screen reader
- [ ] **Button purposes clear** - Descriptive button text
- [ ] **Alt text on icons** - Icons have descriptive labels

### Visual Accessibility
- [ ] **Color contrast ratio > 4.5:1** - Text readable for colorblind users
- [ ] **Text size adjustable** - Browser zoom works (100%, 150%, 200%)
- [ ] **Focus indicators** - Clear visual focus states
- [ ] **No flashing content** - Nothing triggers seizures

---

## 10. Deployment & Production

### Build Process
- [ ] **`npm run build` succeeds** - No build errors
- [ ] **Build output < 5MB** - Reasonable bundle size
- [ ] **No console errors in production build** - Check after deployment
- [ ] **Environment variables work** - Production uses correct Supabase instance

### Deployment
- [ ] **Deploy to Vercel** - Deployment succeeds
- [ ] **Production URL works** - App loads at deployed URL
- [ ] **HTTPS enabled** - Secure connection (padlock icon)
- [ ] **Environment variables set** - Supabase credentials configured

### Post-Deployment
- [ ] **Login works in production** - Real authentication
- [ ] **Database operations work** - Save/load schedules
- [ ] **File uploads work** - Can upload files in production
- [ ] **Performance acceptable** - Load times similar to local

---

## 11. Edge Cases & Stress Testing

### Edge Cases
- [ ] **Empty database** - Brand new user, no data
- [ ] **Single rep** - Only 1 rep in system
- [ ] **Single location** - Only 1 location
- [ ] **No availability** - Rep has no availability windows
- [ ] **All time-off** - Rep has time-off for entire period
- [ ] **Overlapping availability** - Multiple availability windows
- [ ] **Far locations** - All locations >100km away

### Stress Tests
- [ ] **10 concurrent users** - Multiple users logged in
- [ ] **Rapid file uploads** - Upload 4 files quickly
- [ ] **Rapid schedule generation** - Click generate 10 times fast
- [ ] **Large date range** - 6 months schedule
- [ ] **Maximum capacity** - 500 reps, 100 locations

---

## 12. Security Audit

### Authentication Security
- [ ] **Passwords hashed** - Not stored in plain text (Supabase handles)
- [ ] **JWT tokens secure** - HttpOnly cookies or secure storage
- [ ] **Session timeout** - Inactive sessions expire
- [ ] **Logout clears tokens** - No residual session data

### Data Security
- [ ] **HTTPS only** - No HTTP allowed in production
- [ ] **XSS prevention** - User input sanitized
- [ ] **CSRF protection** - Supabase handles this
- [ ] **SQL injection prevention** - Parameterized queries (Supabase)

### API Security
- [ ] **Anon key only** - Never expose service_role key
- [ ] **Row Level Security enabled** - Verified in Supabase
- [ ] **Rate limiting** - Supabase default limits active
- [ ] **CORS configured** - Only your domain allowed

---

## 13. Documentation Quality

### User Documentation
- [ ] **README is clear** - First-time users can set up
- [ ] **SETUP.md is complete** - Covers all steps
- [ ] **DATABASE_SETUP.md works** - Can follow to create tables
- [ ] **QUICKSTART.md accurate** - Actually takes 15 minutes

### Developer Documentation
- [ ] **Code is commented** - Complex logic explained
- [ ] **Type definitions clear** - TypeScript types make sense
- [ ] **Function signatures documented** - Purpose clear from name
- [ ] **Architecture understandable** - File structure logical

---

## 14. Git & Version Control

### Repository
- [ ] **README updated** - Reflects current features
- [ ] **.gitignore correct** - Sensitive files excluded
- [ ] **Commit history clean** - Meaningful commit messages
- [ ] **No secrets in history** - API keys never committed

### Code Quality
- [ ] **No console.log in production** - Remove debug logs
- [ ] **No commented-out code** - Clean up dead code
- [ ] **Consistent formatting** - Code style consistent
- [ ] **No TypeScript errors** - `npm run build` clean

---

## Priority Levels

### Critical (Must Pass Before Production)
1. Authentication & Security (Section 1)
2. Database & Data Persistence (Section 2)
3. Core Functionality (Section 3)
4. Security Audit (Section 12)

### High Priority (Should Pass)
5. Error Handling (Section 8)
6. Performance Testing (Section 5)
7. Deployment & Production (Section 10)

### Medium Priority (Nice to Have)
8. UI/UX Testing (Section 4)
9. Browser Compatibility (Section 6)
10. Data Integrity (Section 7)

### Lower Priority (Can Address Later)
11. Accessibility (Section 9)
12. Edge Cases (Section 11)
13. Documentation (Section 13)

---

## Testing Tools You Can Use

### Manual Testing
- **Browser DevTools** (F12) - Check console, network, performance
- **Different browsers** - Chrome, Firefox, Safari, Edge
- **Different devices** - Desktop, tablet, mobile
- **Supabase Dashboard** - Verify database operations

### Automated Testing (Optional)
- **Lighthouse** (Chrome DevTools) - Performance, accessibility, SEO scores
- **WAVE** - Web accessibility checker
- **GTmetrix** - Performance analysis
- **BrowserStack** - Cross-browser testing

---

## How to Use This Checklist

1. **Print or copy this checklist**
2. **Go through each section systematically**
3. **Check off items as you test**
4. **Note any failures** - Document what went wrong
5. **Fix issues** - Address failures before moving on
6. **Re-test after fixes**
7. **Get 100% on Critical sections** before deploying

---

## Quick Test Script (10 Minutes)

If you're short on time, run this quick test:

1. ✅ Login with valid credentials
2. ✅ Upload 3 required files
3. ✅ Generate schedule
4. ✅ Verify schedule appears
5. ✅ Check stats are accurate
6. ✅ Export CSV and verify
7. ✅ Refresh page - schedule still there
8. ✅ Logout
9. ✅ Login again - schedule loads
10. ✅ Check Supabase - schedule in database

If all 10 pass → Good to deploy!

---

## Need Help?

- **Test failures**: Document the exact error message
- **Can't reproduce**: Try in incognito/private mode
- **Performance issues**: Check Network tab in DevTools
- **Database issues**: Check Supabase logs

Let me know which tests fail and I can help fix them!
