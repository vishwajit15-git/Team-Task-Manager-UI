# Detailed Breakdown: `src/pages/Dashboard.tsx`

## 1. Overview & Importance
This is the main control center of the frontend. It fetches multiple high-level data points (Tasks, Projects, Activity) and renders them into specialized sub-components (Metric Cards, Kanban Tabs, and Activity Logs).

**What problem it solves:**
It utilizes `@tanstack/react-query` to pull heavy data asynchronously in the background. It also handles data formatting (like converting raw ISO database dates into human-readable strings).

## 2. Line-by-Line Breakdown

### React Query Hooks
```tsx
const { data: tasks, isLoading: isLoadingTasks } = useQuery({
  queryKey: ['tasks'],
  queryFn: async () => {
    const res = await apiFetch('/api/tasks');
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  }
});
```
*   **Why we used it:** Instead of manually using `useState` and `useEffect` to fetch tasks, React Query handles caching. If the user navigates away from the Dashboard and comes back, React Query instantly loads the cached data instead of waiting for a slow network request, resulting in a lightning-fast UI.

### Data Filtering (Kanban Tabs)
```tsx
const ongoingTasks = tasks?.data?.tasks.filter((t: any) => t.status === 'IN_PROGRESS' || t.status === 'REVIEW') || [];
```
*   **Why we used it:** Instead of asking the backend for 3 different task arrays (Ongoing, Pending, Overdue), we ask the backend for all tasks *once*, and then use fast client-side Javascript `.filter()` arrays to split them up into the tabs for the UI.
