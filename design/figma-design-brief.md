# habit. — Figma design brief

Paste this file into Figma Make, or use it as the source of truth for a new Figma file. UI copy is English. Build a dark, mobile-first iOS app. Do not invent extra tabs, filters, or form fields.

Working wordmark: **habit.** (placeholder, trailing period in lime).

Sample moment: Friday, 16 October 2026, 22:35, locale en-US, timezone Europe/Budapest.

## How to build the file

1. Create one page named `habit MVP`.
2. Add a `Foundations` frame with the color, type, and component specs below.
3. Add one iPhone frame per screen listed in **Screens**. Frame size **390 × 844**. Background `#080D0B`. Status bar time **22:35**.
4. Use auto layout. Do not place screens as a single long scroll of every day.
5. Keep the exact strings in quotes. Do not translate them.

## Product

A daily habit and task list with visible progress.

- Today shows only that day’s items. Completing one is a single tap.
- XP, level, and streak come from one formula and stay visible.
- Friends can poke. Private task titles stay hidden.
- Money is an at-risk preview. Nothing is charged in this build.

Out of scope: feed, chat, teams, AI planner, shop, wearables, real money transfer, undo, XP picker, frequency picker, Today/Habits/Tasks filter, Upcoming tab, Deadlines tab.

## Personas used in the comps

Two sample identities are intentional. Do not merge them into one person.

| Surface | Identity |
| --- | --- |
| Today, Plan, day detail, Leaderboard, Social, empty Today | **Mina Kovacs**, initials **MK**, level **12**, streak **6**, total XP **5 680**, level progress **180 / 500** |
| Profile (opened from the avatar) | Photo portrait, name **Alex**, **21 years old**, **Level 12**, pill **1250/1800**, **24 day streak**, **142 completed** |

Level formula used everywhere except the Profile pill: `level = floor(totalXp / 500) + 1`. The Profile pill is the reference composition and shows `1250/1800`.

## Foundations

### Color

| Token | Hex | Use |
| --- | --- | --- |
| Background | `#080D0B` | Screen |
| Surface | `#111815` | Cards, inputs, segments |
| Elevated | `#171E1A` | Icon buttons, secondary avatars |
| Tab bar | `#0C1210` | Bottom navigation |
| Border | `#252D28` | 1 px strokes |
| Text | `#F5F7F5` | Primary text, money figure |
| Secondary | `#A4ADA7` | Labels, meta |
| Muted | `#8B968F` | Date line, inactive tab |
| Disabled | `#6E7872` | Placeholder, disabled poke |
| Accent | `#B6FF70` | Primary, selected, done, XP |
| On accent | `#10210A` | Text and icons on lime |
| Goal open | `#FF4D4D` | Left stripe while a goal is open |
| Goal done stripe | `#B6FF70` | Left stripe after a goal is done |
| Due today chip | `#FF6B6B` on `rgba(255,77,77,0.16)` | Deadline due today |
| Warning | `#FF9F43` | Streak fire, due-soon, commitment banner |
| Overdue | `#FF8ABF` | Overdue chip |
| Study | `#5EE0FF` | Category |
| Fitness | `#FF9F43` | Category |
| Hygiene | `#7EE0C6` | Category |
| Work | `#B388FF` | Category |
| Personal | `#FF6BB5` | Category |
| Other | `#A4ADA7` | Category |

Category color always ships with an icon and a text label. Never color alone.

Focus ring: 2 px `#B6FF70`. Reduced motion: no spring animation.

### Type

SF Pro, or a similar grotesque. Tight tracking on large numbers and titles.

| Style | Size / weight | Sample |
| --- | --- | --- |
| Screen title | 28 / 650, tracking -0.04em | Leaderboard |
| Name on profile | 26 / 680 | Alex |
| Money hero | 48 / 650, `#F5F7F5`, centered | −€4.00 |
| Day title | 26 / 650 | Sat, Oct 17 |
| Row title | 13 / 620 | Drink water |
| Section label | 10 / 700, uppercase, tracking 0.12em, `#A4ADA7` | TODAY'S GOALS |
| Section count | 13 / 720, `#F5F7F5`, not uppercase | 1/2 |
| Meta / date | 12 / 600, `#8B968F` or `#A4ADA7` | Today · Fri, Oct 16 |
| XP | 11 / 700, `#B6FF70` | +20 XP |
| Tab label | 8 / 650 | Today |
| Button | 15 / 720 | Create habit |

### Space and radius

Spacing scale: 4, 8, 12, 16, 20, 24, 32.

| Token | Value |
| --- | --- |
| Screen horizontal padding | 16 |
| Card radius | 14–16 |
| Card padding | 8 × 10, min height 52 |
| Button height / radius | 46–52 / 14 |
| Touch target | minimum 44 |
| Icon tile | 32–36, radius 10–12 |
| Tab bar | 64 plus home indicator |
| Money block | 26 above, 30 below the number |
| Input radius | 12 |
| Pill radius | 999 |

### Shared chrome

**Status bar.** Left: `22:35`. Right: signal, LTE, battery. Color `#F5F7F5`.

**Top bar, Today and day detail.** No level bar.

- Left: 40 px circular avatar, initials `MK`, fill `#B6FF70`, text `#10210A`. A 16 px lime badge overlaps the bottom-right and reads `12`. Tap opens Profile.
- Right of the avatar: fire icon `#FF9F43` and the streak `6`, weight 760, size 15. Pushed to the right.
- Far right: 34 × 34 gear button, radius 12, fill `#171E1A`, stroke `#252D28`.

**Top bar, Plan, Calendar, Leaderboard.** Same avatar and badge, then a thin XP bar (8 px tall, track `#1C2621`, fill `#B6FF70` at 36%), then the fire streak, then the gear.

**Bottom tab bar.** Five slots. Fill `#0C1210`. Top stroke `#252D28`. Inactive `#8B968F`. Active `#B6FF70`.

1. **Today** — sun icon.
2. **Plan** — calendar icon.
3. Center **Create** — 40 px lime circle, plus icon in `#10210A`. No label.
4. **Leaderboard** — podium / bar-chart icon.
5. **Social** — two people icon.

Create is a full-screen flow and hides this bar. Profile is not a tab.

**Row.** Horizontal auto layout, gap 8, fill `#111815`, stroke `#252D28`, radius 14, min height 52.

- 32 px category icon tile.
- Title only. No subtitle such as “Habit · Daily”.
- Optional lime `+N XP`.
- Optional 16 px `€` circle, stroke `#3C4A42`, text `#8B968F`.
- Optional 22 px check: empty ring, or lime fill with a `#10210A` check.

**Goal row.** Same row, plus a 4 px stripe on the left edge. Open `#FF4D4D`. Done `#B6FF70`. Done goals stay at full card opacity; title, XP, icon, and € drop to 48% opacity. The green stripe stays strong.

**Done habit row.** Whole row at 48% opacity, lime check.

**Deadline row.** No € mark. No left stripe. A chip on the right.

**Chips.** Pill, 11 / 700.

- Neutral lime: `6 days left`.
- Warning: `Due today`.
- Hot due-today on a row that is due today: red chip `Due today`.
- Bad: `Overdue`.

**Primary button.** Full width, height 46, radius 14, fill `#B6FF70`, text `#10210A`.

**Secondary button.** Fill `#111815`, text `#F5F7F5`, stroke `#252D28`.

**Segmented control.** Pill track `#111815`, stroke `#252D28`. Selected segment fill `#B6FF70`, text `#10210A`.

## Screens

Build these frames, in this order, 80 px apart.

### 01 Today

Tab **Today** selected.

Vertical stack:

1. Top bar without the XP bar.
2. Centered date: `Today · Fri, Oct 16`. Size 12, `#8B968F`.
3. Centered money: `−€4.00`. Size 48, white `#F5F7F5`. 26 px above, 30 px below. No caption under the number. This is a preview of money still at risk, not a completed charge. Two open money items × €2.
4. Section `TODAY'S GOALS` with right-aligned count `1/2` (done / total).
5. Goal row, open, red stripe, Work icon: `Project report`, `+50 XP`, €, empty check.
6. Goal row, done, green stripe, Other icon: `Clean room`, `+20 XP`, €, lime check. Text dimmed, stripe full strength.
7. Section `HABITS`.
8. Habit row, Personal icon: `Meditate`, `+15 XP`, €, empty check.
9. Habit row, done, Hygiene icon: `Drink water`, `+10 XP`, €, lime check.
10. Section `DEADLINE`.
11. Deadline row, Study icon: `Submit essay`, red chip `Due today`. No €. No red card frame.

Do not add “2 still open”. Do not show Saturday on this screen.

### 02 Plan · List

Tab **Plan** selected. Top bar includes the XP bar.

Segment: `Calendar` idle, `List` selected.

Section `UPCOMING TASKS`.

Day group `Sat, Oct 17` with count `2`:

- Goal, red stripe, Study: `Study group`, `+25 XP`, €. No check.
- Goal, red stripe, Work: `Clean slides`, `+20 XP`, €.

Day group `Sun, Oct 18` with count `1`:

- Goal, red stripe, Personal: `Call mentor`, `+15 XP`, €.

Day group `Wed, Oct 22` with count `1`:

- Deadline, Study, no stripe, no €: `Algorithm exam`, lime chip `6 days left`.

Tapping a day group opens screen 04 for that date. Days left are computed in the user timezone, midnight to midnight. Today would read `Due today`. Past would read `Overdue`.

### 03 Plan · Calendar

Tab **Plan** selected. Segment: `Calendar` selected, `List` idle.

Month header: chevron, `October 2026`, chevron.

Week starts Sunday because the sample locale is en-US: `S M T W T F S`. A Hungarian locale would start on Monday.

October 2026 grid. Day 1 falls on Thursday, so the first four cells are empty.

- Today, **16**: lime inset ring, lime habit dot, orange task dot.
- Selected, **20**: lime fill, number `#10210A`. This is not today.
- Orange task dots also on 14, 22, and 28.
- Lime habit dots on the other dated cells.

Sheet under the grid: `Tue, Oct 20 · 2`.

- Fitness: `Workout`, `+30 XP`, €.
- Personal: `Meditate`, `+15 XP`, €.

Dots mean scheduled items, not completion. Completion lives on the Profile activity grid.

Empty day: friendly empty state and an add action that opens Create with that date filled in.

### 04 Day from Plan

Opened from Plan, not by scrolling Today. Tab **Plan** stays selected. Top bar has no XP bar.

Date, centered: `Sat, Oct 17`.

Money, centered, white: `−€8.00`. Four open money items × €2.

Section `GOALS`, count `0/2`.

- Study, red stripe: `Study group`, `+25 XP`, €, empty check.
- Work, red stripe: `Clean slides`, `+20 XP`, €, empty check.

Section `HABITS`.

- Hygiene: `Drink water`, `+10 XP`, €, empty check.
- Fitness: `Workout`, `+30 XP`, €, empty check.

Section `DEADLINE`.

- Single quiet row: `Nothing due`.

The next day does not appear below this list.

### 05 Create habit

No tab bar. Back chevron and title `Create`.

Three type cards. **Habit / Repeats** selected: lime stroke, lime-tinted fill. Others idle: **Task / Once**, **Deadline / A date**.

Fields:

- Title, filled: `Drink water`.
- Description, placeholder: `Optional`.
- Category chips: Study, Fitness, **Hygiene** selected (lime stroke and lime label), Work, Personal, Other.
- Starts: `Fri, Oct 16, 2026`.

Helper, secondary: `A new occurrence appears each day. You can complete it once per day.`

Primary button: `Create habit`.

Do not add a Frequency field. Do not add an XP reward control. A habit in the MVP is daily. The system awards XP when the user completes an item.

Task variant, same screen, Task selected: title required, due date defaults to today when opened from Today. Deadline variant: due date required. Empty title shows an orange field stroke and `Add a title.` Missing deadline date shows `Choose a due date.` Typed values stay on error. The button reads `Saving` while submitting and cannot be pressed twice. Cancel creates nothing. Success returns to the tab the user came from.

### 06 Leaderboard

Tab **Leaderboard** selected. Top bar includes the XP bar.

Title `Leaderboard`. Subtitle `This week`.

Rows, ranked by current streak. Rank, avatar initials, name, fire streak on the right. No task titles, descriptions, or money.

| Rank | Initials | Name | Streak | Note |
| --- | --- | --- | --- | --- |
| 1, lime | MA | Maya | 28 | Avatar text `#FF9F43` |
| 2 | AL | Alex | 24 | Avatar text `#B6FF70` |
| 3 | MK | You | 6 | Own row, lime initials on lime avatar |
| 4 | SA | Sam | 4 | Avatar text `#5EE0FF` |
| 5 | JO | Jordan | 2 | Avatar text `#FF6BB5` |

Footer: `Ranked by current streak. Task titles stay private.`

Empty state, if there are no friends: short sentence and a button that switches to the Social tab.

### 07 Profile and stats

Not a tab. Opened by the top-left avatar. Back returns to the previous screen. Neither Leaderboard nor Social is selected.

Header: back button, centered title `Profile`, gear button.

Centered circular photo, 78 px. Name `Alex`. Secondary line `21 years old` (show age only when the user provided it). `Level 12`.

Progress pill, full width, height 28, track `#2A3330`. Lime fill about 69% of the width. Right-aligned label inside the lime: `1250/1800`, text `#10210A`.

Two cards in a row:

- Fire icon and `24 day streak`.
- Lime check icon and `142 completed`.

Section title `Activity`. A 12-column heatmap, 5 rows, 14 px cells, radius 3, gap 3. Greens from dark `#14301C` through `#2E8A45` and `#5ED86A` to `#B6FF70`. The last few cells of the final rows are the darkest green.

Section title `Achievements`. Five circular icon badges, label under each, 8 px:

1. Lime ring, star — `7 Day Streak`.
2. Lime ring, leaf — `Level 10`.
3. Orange ring — `50 Tasks`.
4. Cyan ring — `Early Bird`.
5. Purple ring `#C084FC` — `Longest streak`.

The gear on this screen opens Settings. Friends are not listed here.

### 08 Social

Tab **Social** selected.

Title `Social`. Subtitle `Friends and pokes`.

Search input: `Username or invite link`.

Section `REQUESTS`.

- Avatar `JO`, name `Jordan`, meta `Wants to connect`, lime pill `Accept`.

Section `FRIENDS`.

- `AL` Alex, meta `Done today`, disabled pill `Poke`.
- `MA` Maya, meta `2 left today`, lime pill `Poke`.
- `SA` Sam, meta `5 left · poked today`, disabled pill `Sent`.

Footer: `Friends see progress, not task names.`

Poke rules to respect in the UI:

- One poke per sender per friend per local day.
- The sender earns 5 XP only if the recipient still had eligible items and finishes all of them after the poke, before local midnight.
- If the recipient already finished, the poke stays quiet and pays nothing. That is why Alex’s button is disabled.
- The recipient never loses XP for ignoring a poke.
- Success toast for the sender: `Your poke helped — +5 XP`.

### 09 Commitment

Opened from Settings. No tab bar. Back chevron and title `Commitment`.

Orange banner: `Off until you review and confirm. No money moves in this build.`

Key-value rows:

- Amount — `2.00 EUR / missed task`
- Destination — `Charity · saved`
- Eligible — `Work tasks`
- Cutoff — `23:59 · Budapest`

Card: title `At risk tonight`, meta `Finish project report is still open`, warning chip `2.00 EUR`.

Notes:

- Charged per missed task, not a flat fee.
- You can pause before the cutoff.
- A transfer is never shown as paid early.

Lock row: `Money transfer · unavailable`.

Primary: `Enable calculation`. Secondary: `Keep off`.

No card field. No bank login. The UI never starts a transfer when a task is checked. Three missed tasks would preview 6 EUR, not a flat fee.

### 10 Empty Today

Same chrome as Today. Tab **Today** selected.

Date: `Today · Fri, Oct 16`.

Money: `−€0.00`, white, centered, same large spacing.

No goal, habit, or deadline sections.

Centered empty state: dashed circle with a plus, title `Nothing due today`, body `Add a habit or a task. A streak starts when you complete one.`

Primary button: `+ Add task`.

### 11 Settings

Opened from the gear. No tab bar. Title `Settings`. Simple link rows, one line each:

- Account
- Time zone
- Notifications
- Privacy
- Commitment
- Log out

Commitment row opens screen 09. Do not design notification scheduling, a card form, or a bank connection.

## Feedback states

Put these on a small `States` frame, not as extra app tabs.

**Toasts**

- Success, lime bar: `Task completed · +30 XP`.
- Level-up, once: `Level 13`.
- Poke reward: `Your poke helped — +5 XP`.
- Error, orange bar: name the failure. Do not use `Something went wrong` alone. The list rolls back.

**Loading.** 4–6 dark blocks, 52 px tall, radius 16, where rows will be. Tab bar is visible immediately.

**Form error.** Title stroke turns orange. Under it: `Add a title.` Deadline without a date: `Choose a due date.`

**Other empty copy to include**

- Plan, empty week: short line plus a Create button.
- Deadline section with nothing due: `Nothing due`.
- Leaderboard with no friends: short line plus a button to Social.

## Interaction map

| From | Action | To |
| --- | --- | --- |
| Any main screen | Avatar | Profile |
| Profile | Back | Previous screen |
| Any main screen | Gear | Settings |
| Settings | Commitment | Commitment |
| Today, Plan, Leaderboard, Social | Center plus | Create |
| Plan list | Day group | That day’s detail |
| Calendar | Day cell | Sheet for that day |
| Create | Success | The tab the user came from |

Checking an item awards XP once. There is no undo. A streak counts when at least one habit or task is completed that local day. The day closes at local midnight.

## Money rules for the comps

€2 per still-open goal or habit. Deadlines never show €.

| Screen | Figure | Why |
| --- | --- | --- |
| Today | `−€4.00` | Project report and Meditate still open |
| Saturday from Plan | `−€8.00` | Four open goals and habits |
| Empty Today | `−€0.00` | Nothing open |

The number is white, large, and centered, with generous space above and below. It is a preview. A transfer, if the commitment rule is later turned on, happens only after the cutoff.
