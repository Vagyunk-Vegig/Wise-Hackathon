# Badges

Badges live at the bottom of Profile, under Activity. There is no separate Badges page.

A badge is earned once and kept if a streak breaks. The reward is a one-time XP bonus, shown in a toast as `7 Day Streak · +20 XP`. Bonus XP counts toward level. Each bonus is smaller than the XP one level asks for, so it cannot skip a level badge. Earned ids are stored on `user.badges`.

Level 1 asks for 240 XP. Every next level asks for 40 XP more than the one before it. A habit is 10 XP. A task is 20 XP. A deadline is 0 XP and does not count.

## Streaks

Current streak. `streaks.longest` only grows.

- 7 Day Streak, +20 XP
- 14 Day Streak, +40 XP, after 7
- 30 Day Streak, +80 XP, after 14
- 60 Day Streak, +120 XP, after 30
- 100 Day Streak, +200 XP, after 60
- Longest streak, +20 XP, the first time the best streak reaches 7. The card shows that best.

## Task milestones

Completed habits and goals. Deadlines do not count.

- First Task, +10 XP
- 10 Tasks, +20 XP
- 50 Tasks, +40 XP
- 100 Tasks, +80 XP
- 250 Tasks, +120 XP
- 500 Tasks, +200 XP, after 250

## Level journey

- Level 1, +0 XP, on the first sign-in
- Level 5, +25 XP
- Level 10, +50 XP
- Level 15, +75 XP
- Level 20, +100 XP, after 15
- Level 30, +150 XP, after 20

## Morning rituals

A day counts once when something is completed before 9:00 local time. Dates live in `streaks.mornings`.

- Early Bird, 1 day, +10 XP
- Morning Momentum, 5 days, +20 XP
- Rise & Shine, 10 days, +40 XP
- Dawn Regular, 25 days, +80 XP
- Sunrise Club, 50 days, +120 XP
- Morning Master, 100 days, +200 XP

## Perfect days

A day is perfect when it has at least one planned task or habit and every one of them is done. Dates live in `streaks.perfectDays`.

- Clean Slate, 1 day, +15 XP
- Five for Five, 5 days, +30 XP
- Perfect Ten, 10 days, +50 XP
- Golden Days, 25 days, +80 XP
- All Clear, 50 days, +120 XP
- Century of Wins, 100 days, +200 XP

## Habit building

Created habits, plus the most check-ins on a single habit.

- First Habit, 1 habit, +10 XP
- Routine Builder, 3 habits, +20 XP
- Habit Explorer, 5 habits, +30 XP
- Habit Architect, 10 habits, +50 XP, after Explorer
- Habit Regular, 30 check-ins on one habit, +40 XP
- Second Nature, 100 check-ins on one habit, +80 XP, after Regular

## When they are checked

After a task or habit is completed, after poke XP, after a habit is created, and once when the signed-in profile loads. A locked badge stays locked until the previous badge in its ladder is earned. The next-up card is the in-progress badge closest to its goal.
