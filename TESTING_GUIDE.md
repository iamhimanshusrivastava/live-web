# Testing Guide - Live-Web Platform

**Last Updated**: January 7, 2026

This guide provides step-by-step manual testing procedures for all features.

---

## Prerequisites

- Dev server running: `bun run dev`
- Access to Supabase dashboard
- Valid Codekaro email account
- Browser with DevTools

---

## 🧪 User Testing Routes

### Route: `/login`

| Test | Steps | Expected |
|------|-------|----------|
| Valid login | Enter valid Codekaro email → Click Continue | Redirect to `/sessions`, toast: "Welcome!" |
| Invalid login | Enter non-existent email → Click Continue | Error toast, stay on page |
| Empty email | Click Continue with empty field | Form validation error |

### Route: `/sessions`

| Test | Steps | Expected |
|------|-------|----------|
| View sessions | Login → Navigate to `/sessions` | List of upcoming sessions |
| Join session | Click "Join" on any session | Redirect to `/session/{id}` |
| Protected access | Logout → Go to `/sessions` | Redirect to `/login` |

### Route: `/session/:id`

#### Pre-Join (Before Scheduled Start)

| Test | Steps | Expected |
|------|-------|----------|
| Countdown display | Open session before start time | CountdownScreen with timer |
| Timer accuracy | Watch countdown | Counts down to 0 in sync |
| Title shown | Check screen | Session title visible |

#### Live State

| Test | Steps | Expected |
|------|-------|----------|
| Video plays | Open live session | Video autoplays |
| No controls | Right-click video | No pause/seek options |
| LIVE badge | Check top bar | 🔴 LIVE with timer |
| Viewer count | Check top bar | "X watching" |

#### Dual Video

| Test | Steps | Expected |
|------|-------|----------|
| PiP visible | Session with face_url | Small video in corner |
| PiP move | Click PiP | Moves to next corner |
| PiP close | Click X on PiP | PiP hides, "Show" button appears |

#### Chat

| Test | Steps | Expected |
|------|-------|----------|
| Send message | Type message → Click Send | Message appears in chat |
| Rate limit | Send 2 messages quickly | Second blocked, wait message |
| Long message | Type 501+ chars | Error: too long |
| Auto-scroll | Wait for new messages | Chat scrolls down |
| Load more | Scroll to top (100+ msgs) | "Load More" button |

#### Sync

| Test | Steps | Expected |
|------|-------|----------|
| Mid-join | Join 5 min after start | Video at 5:00 mark |
| Tab switch | Switch tab, wait 30s, return | Video resyncs |
| Refresh | Refresh page | Resume at correct offset |

#### Session End

| Test | Steps | Expected |
|------|-------|----------|
| Ended state | Wait past video duration | "Session ended" screen |
| No replay | Check for controls | No playback options |

---

## 🛠️ Admin Testing Routes

### Route: `/admin/:id`

#### Dashboard Access

| Test | Steps | Expected |
|------|-------|----------|
| Load dashboard | Go to `/admin/{sessionId}` | Stats cards visible |
| Real-time stats | Open viewer window | Viewer count updates |

#### Stats Cards

| Stat | Verification |
|------|--------------|
| Live Viewers | Match viewer count in session |
| Total Messages | Match chat message count |
| Peak Viewers | Historical max (after analytics) |
| Avg Watch Time | Minutes (after analytics) |

#### Session Controls

| Test | Steps | Expected |
|------|-------|----------|
| Toggle chat | Switch "Chat Enabled" off | Users see disabled input |
| Turn chat on | Switch back on | Users can type again |
| Admin message | Type message → Send as Admin | Appears with "Admin" badge |

#### Message Moderation

| Test | Steps | Expected |
|------|-------|----------|
| Pin message | Click "Pin" on any message | "Pinned" badge appears |
| Unpin | Click "Unpin" | Badge removed |
| Delete | Click "Delete" | Message removed from all views |

#### Analytics

| Test | Steps | Expected |
|------|-------|----------|
| End session | Click "End Session & Generate Report" | is_live = false |
| View analytics | Scroll to analytics section | Stats populated |
| Download log | Click "Download Chat Log" | JSON file downloads |

---

## 🔄 Real-time Testing

### Two-Window Sync Test

1. Open Session Page in Window A
2. Open same session in Window B (incognito)
3. Send message in Window A
4. **Expected**: Message appears in Window B instantly

### Viewer Count Test

1. Open session in Window A (note count)
2. Open same session in Window B
3. **Expected**: Count increases in both windows
4. Close Window B
5. **Expected**: Count decreases in Window A

---

## 🔒 Security Testing

### RLS Verification

```sql
-- In Supabase SQL Editor

-- Test as anon user (should work)
SELECT * FROM sessions WHERE is_live = true;

-- Test insert without auth (should fail)
INSERT INTO messages (session_id, user_id, user_name, content)
VALUES ('uuid', 'uuid', 'Hacker', 'Test');
-- Expected: RLS violation
```

### Protected Routes

| Test | Steps | Expected |
|------|-------|----------|
| Direct URL access | Paste `/session/abc` while logged out | Redirect to `/login` |
| Invalid session | Go to `/session/nonexistent` | "Session not found" |

---

## ⚡ Performance Testing

### Page Load

| Page | Target |
|------|--------|
| Login | < 1s |
| Sessions List | < 2s |
| Session Page | < 3s |
| Admin Dashboard | < 2s |

### Video Performance

| Metric | Target |
|--------|--------|
| Initial load | < 3s |
| Buffering | < 1 event/min |
| Sync drift | < 250ms |

---

## 📱 Mobile Testing

### Responsive Breakpoints

| Width | Expected |
|-------|----------|
| 375px (iPhone) | Single column, stacked layout |
| 768px (iPad) | Two columns |
| 1024px+ | Full layout with sidebar |

### Touch Targets

- All buttons: >= 44x44px
- Inputs: Easy to tap
- No horizontal scroll

---

## 🐛 Bug Report Template

```markdown
**Title**: [Short description]
**Route**: /session/abc123
**Steps**:
1. Step 1
2. Step 2

**Expected**: X
**Actual**: Y

**Browser**: Chrome 120
**Console Errors**: [Paste if any]
```

---

## ✅ Test Checklist

### User Flow
- [ ] Login (valid/invalid)
- [ ] View sessions list
- [ ] Join session
- [ ] Watch countdown → live transition
- [ ] Send chat messages
- [ ] Rate limiting works
- [ ] Mid-join correct offset
- [ ] Tab visibility resync
- [ ] Session ended state

### Admin Flow
- [ ] Access dashboard
- [ ] Toggle chat
- [ ] Send admin message
- [ ] Pin/unpin messages
- [ ] Delete messages
- [ ] End session
- [ ] Download chat log

### Real-time
- [ ] Messages sync across windows
- [ ] Viewer count updates
- [ ] Connection status toast

### Security
- [ ] Protected routes work
- [ ] RLS blocks unauthorized access
- [ ] Invalid session handled
