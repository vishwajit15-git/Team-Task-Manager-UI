# Detailed Breakdown: `src/pages/Login.tsx`

## 1. Overview & Importance
This file renders the Login screen where users authenticate themselves. It acts as the gateway to the protected portions of the Team Task Manager.

**What problem it solves:**
It securely captures user credentials, sends them to the Node backend via `apiFetch`, and upon success, saves the resulting JWT (JSON Web Token) to local storage. It then updates the global Auth Context so the rest of the application knows who is logged in.

## 2. Line-by-Line Breakdown

### The API Connection
```tsx
const res = await apiFetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password })
});
```
*   **Why we used it:** We use our custom `apiFetch` wrapper instead of the standard browser `fetch`. The `/api/auth/login` endpoint is intercepted by the Vite Proxy in `vite.config.ts`, which safely forwards the raw email and password to our backend running on `localhost:3000`.

### State Management
```tsx
if (data.token) localStorage.setItem('token', data.token);
setUser(data.user);
navigate("/");
toast.success("Welcome back!");
```
*   **Why we used it:** 
    *   `localStorage` keeps the user logged in even if they refresh the page.
    *   `setUser` instantly triggers a re-render of the `App.tsx` router, fulfilling the protected route requirement.
    *   `navigate("/")` pushes the browser to the Dashboard visually.
