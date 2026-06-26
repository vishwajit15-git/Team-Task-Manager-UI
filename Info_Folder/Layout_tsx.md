# Detailed Breakdown: `src/components/Layout.tsx`

## 1. Overview & Importance
The `Layout` component is the structural shell of the protected portion of the app. It contains the Sidebar (navigation links, project selector) and the Header (search bar, user profile, notifications).

**What problem it solves:**
Instead of copying and pasting the Sidebar and Header into every single page (Dashboard, Tasks, Messages), we use React Router's `<Outlet />` inside this Layout. The Sidebar and Header render once, and the page content dynamically swaps out in the middle.

## 2. Line-by-Line Breakdown
- **`<Outlet />`**: This is the magic React Router component. When a user clicks "Tasks" on the sidebar, the URL changes to `/tasks`, and the `Layout` stays exactly the same, but the `<Outlet />` is replaced with the `<Tasks />` component.
- **Active Project Context**: It uses a dropdown selector to choose which Project the user is currently viewing, storing that in global state so all child components fetch the right data.
