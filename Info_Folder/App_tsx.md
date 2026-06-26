# Detailed Breakdown: `src/App.tsx`

## 1. Overview & Importance
This file is the "Traffic Controller" of your entire React application. It uses `react-router-dom` to dictate exactly what UI components are shown on the screen based on the URL in the browser. 

**What problem it solves:**
Without a router, a Single Page Application (SPA) would have to manually use massive `if/else` statements to figure out what page to show. The router handles browser history (the back button), URL parameters, and most importantly, **Protected Routes**.

## 2. Line-by-Line Breakdown

### The Protected Route Wrapper
```tsx
<Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
  <Route index element={<Dashboard />} />
  <Route path="tasks" element={<Tasks />} />
  // ...
</Route>
```
*   **Why we used it:** This is called a "Layout Route" or "Nested Route". Because the `<Layout />` component contains your Sidebar and Header, every route nested inside it (like `/tasks` or `/messages`) will automatically have the Sidebar and Header surrounding it. 
*   **Security:** The ternary operator `user ? <Layout /> : <Navigate to="/login" />` acts as a frontend bouncer. If a user tries to type `http://localhost:5173/tasks` into the URL bar but they aren't logged in, it instantly kicks them back to the `/login` screen.

### Public Route Redirection
```tsx
<Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
```
*   **Why we used it:** This is the reverse of a protected route. If a user is *already* logged in and they accidentally navigate to the `/login` page, we don't want them to see a login form. This instantly redirects them to the Dashboard (`/`).
