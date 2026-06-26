# Detailed Breakdown: `src/lib/auth.tsx`

## 1. Overview & Importance
This file contains the **React Context API** implementation for user authentication. It provides a global state wrapper so that any component in the app can instantly know if a user is logged in, without having to pass "props" down through dozens of parent components.

**What problem it solves:**
When a user refreshes the page, React's memory resets. This file runs a `useEffect` on the very first render, checks if a token exists in `localStorage`, and if so, reaches out to the backend to verify the token and fetch the user's latest avatar and role.

## 2. Line-by-Line Breakdown

### The Validation Effect
```tsx
useEffect(() => {
  const initAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await apiFetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };
  initAuth();
}, []);
```
*   **Why we used it:** This prevents "flashing" (where the user sees the login screen for 1 second before the dashboard loads). It sets `loading: true` globally, reaches out to the `/api/auth/me` endpoint to cryptographically verify the JWT, and then sets the global User state. If the token is expired or hacked, it strictly deletes it and kicks the user out.
