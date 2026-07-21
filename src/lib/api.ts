export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = localStorage.getItem('token');
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(input, { ...init, headers, credentials: 'include' });
  if (res.status === 401) {
    localStorage.removeItem('token');
    const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
    if (!publicPaths.some(path => window.location.pathname.startsWith(path))) {
      window.location.href = '/login';
    }
  }
  return res;
};
