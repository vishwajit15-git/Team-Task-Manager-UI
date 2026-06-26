# Detailed Breakdown: `src/lib/api.ts`

## 1. Overview & Importance
This file contains the `apiFetch` wrapper function. It is a custom utility that replaces the standard browser `fetch()` API across your entire frontend codebase.

**What problem it solves:**
If we used standard `fetch()`, we would have to manually retrieve the JWT token from `localStorage` and attach it to the `Authorization: Bearer` header on *every single API call* we write (e.g., fetching tasks, posting messages, creating projects). This wrapper does it automatically.

## 2. Line-by-Line Breakdown

### Automatic Header Injection
```typescript
export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = localStorage.getItem('token');
  const headers = new Headers(init?.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  return fetch(input, { ...init, headers });
};
```
*   **Why we used it:** This intercepts the outgoing HTTP request right before it leaves the browser. It grabs the user's JWT token, creates a `Headers` object, and injects the token.
*   **Note for the Future:** Right now, this code relies on `localStorage.getItem('token')`. However, on the backend, we upgraded to using **HTTP-Only Cookies** for maximum security! This means we will actually be modifying this file soon to remove the `localStorage` dependency and configure it to send cookies natively via `credentials: 'include'`.
