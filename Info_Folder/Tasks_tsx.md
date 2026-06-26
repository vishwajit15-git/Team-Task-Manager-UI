# Detailed Breakdown: `src/pages/Tasks.tsx`

## 1. Overview & Importance
This is the Kanban/List view where team members actually manage their work. It handles fetching tasks for the currently active project and rendering them with status badges, priority levels, and due dates.

**What problem it solves:**
It provides full CRUD (Create, Read, Update, Delete) capabilities for Tasks directly from the frontend, seamlessly talking to our new Node.js backend.

## 2. Line-by-Line Breakdown
- **Task Fetching**: Uses React Query to hit `/api/tasks`. If the active project changes in the sidebar, React Query automatically refetches the tasks for the new project.
- **Status Updates**: Contains mutations to `PATCH /api/tasks/:id` to instantly change a task from TODO to IN_PROGRESS. Our new backend then automatically fires off a WebSocket notification to the assignee!
