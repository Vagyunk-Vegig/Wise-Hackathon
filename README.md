# Morrow.

A dark, mobile-first habit app. You plan a small set of daily goals, keep habits, and mark deadlines. Unfinished money tasks stay on the line as forints. Friends can see progress, not task titles.

This README is a map for reviewing the work. The UI copy is English.

## Run

```bash
npm install
npx expo start --web
```

`npm run ios` and `npm run android` start the native apps. Sign in with Google or email. Tasks, streaks, XP, and badges are stored in Supabase.

## Where to look

| Area | Start here |
| --- | --- |
| Today list | `src/screens/TodayScreen.tsx`, `src/components/DayList.tsx` |
| Create a goal, habit, or deadline | `src/screens/CreateScreen.tsx` |
| What shows on a given day | `src/schedule.ts` |
| Plan list and calendar | `src/screens/PlanScreen.tsx`, `src/screens/DayScreen.tsx` |
| Task note | `src/screens/TaskDetailScreen.tsx` |
| Completing an item, streak, poke | `src/store.tsx` |
| XP amounts and level curve | `src/db.ts` (`xpFor`), `src/sample.ts` (`levelProgress`) |
| Profile, activity, badges | `src/screens/ProfileScreen.tsx`, `src/components/ActivityCalendar.tsx`, `src/badges.ts` |
| Social and leaderboard | `src/screens/SocialScreen.tsx`, `src/screens/LeaderboardScreen.tsx` |

## Today's goals

Today is the home tab. It lists that day's goals, habits, and any deadline due today.

A goal belongs to one date. Checking it marks it done, awards 20 XP, and moves it to the end of the list. During onboarding you choose how many goals tomorrow should have, from 0 to 6, default 3. Today then shows a banner, `Tomorrow 0/3`, until that many tomorrow goals exist. The same count can be changed later in Settings, under Commitment.

## Habits

A habit starts on a date and then appears every day from that date on. Each day is its own check, stored as a date in `doneDates`. Checking a habit awards 10 XP. You cannot check a habit on a future day. A finished check for today also moves to the end of the list.

## Deadlines

A deadline is a single date and does not award XP. It is not part of the money penalty and it does not count toward the daily goal quota. On Today, a deadline that is due today can be checked. That saves it as done and shows `Deadline completed`. Past or future deadlines are not checkable from Today.

## The money penalty

Goals and habits are money tasks. Deadlines are not.

Each open money task is worth the commitment amount, 800 Ft by default. Today shows the total still at risk for that day. When every money task for the day is done, the amount is replaced by a clear mark. The amount can be changed in Settings, under Commitment. Turning the calculation on there saves the new forint value and the daily goal count.

## Calendar and task tracking

Plan has two views.

- **List.** Upcoming days that still have open goals, habits, or deadlines. Today includes habits. Later days list what is dated there and not done.
- **Calendar.** A month grid. Days with something planned are marked. Selecting a day shows that day's items, and opens the day screen.

The day screen is the same list as Today for that date. Open an item to edit its note on the task detail screen.

The profile keeps a year of real completions, drawn like a contribution graph. A habit check counts on the day it was checked. A finished goal or deadline counts on its date. Task titles are not on this graph, only the count.

A streak grows when you complete something today, including a deadline. Completing another item the same day does not increase it again. Missing a day resets the current streak. The longest streak only goes up.

## Social, leaderboard, and friends

Social has three jobs.

- **Search.** Find an account by username and send a friend request. Incoming requests can be accepted.
- **Friends.** A friend row opens their profile. You see their streak, level, XP, completed count, activity graph, and badges. You do not see their task titles.
- **Poke.** You can poke up to 5 friends a day. If that friend has already finished today's tasks, the poke pays +5 XP. Otherwise it is only a poke. Pull down on Social to reload the board.

The leaderboard ranks accounts by current streak, then by XP. Tapping a row opens that person's profile. The signed-in row is labeled You and opens your own profile.

## Badges and XP

XP is awarded when you finish work, not when you create it.

| Action | XP |
| --- | --- |
| Habit check | 10 |
| Goal | 20 |
| Deadline | 0 |
| Helpful poke | 5 |

Level 1 asks for 240 XP. Every next level asks for 40 XP more than the one before it, so level 2 asks for 280, level 3 for 320, and so on. The profile bar and the level on the top bar both use this curve.

Badges sit at the bottom of the profile, under the activity graph. There are 36, in six groups: streak, tasks, level, mornings before 9:00, perfect days, and habits. Each badge is earned once and stays earned if a streak breaks. The reward is a one-time XP bonus, shown in a toast such as `7 Day Streak · +20 XP`. A bonus counts toward the next level, and it is smaller than one level, so it cannot skip a level badge.

The full ladder, with thresholds and rewards, is in [design/badges.md](design/badges.md). The rules live in `src/badges.ts`.

## A short review pass

1. Sign in and finish onboarding, or open Settings and set Commitment.
2. On Today, add a goal, a habit, and a deadline for today. Check each one. Confirm the XP toast, the forint total, and that the deadline toast has no XP.
3. Open Plan. Switch between List and Calendar, open a day, and edit a task note.
4. Open Profile. Check the level bar, the activity graph, and the badge collection. Hover or tap a badge to see its XP.
5. On Social, search for an account, accept or send a request, open a friend profile, and poke someone.
6. On the leaderboard, tap a player and confirm their profile opens.
