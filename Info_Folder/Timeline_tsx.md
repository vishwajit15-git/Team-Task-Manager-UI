# Detailed Breakdown: `src/pages/Timeline.tsx`

## 1. Overview & Importance
The Timeline view is a highly complex visual component that renders tasks on a Gantt-style calendar grid. 

**What problem it solves:**
It takes a flat array of Task objects (which just have `startDate` and `dueDate` strings) and performs mathematical date logic to calculate exactly how many pixels wide a task bar should be, and exactly where it should start on the grid relative to the current month being viewed.

## 2. Line-by-Line Breakdown
- **Date-Fns Math**: It relies heavily on `date-fns` to calculate days between dates, ensuring that if a task spans from May 28 to June 4, the bar accurately crosses the month boundary visually.
- **Track Layout Algorithm**: It uses an algorithm to prevent task bars from overlapping vertically if they happen on the same day.
