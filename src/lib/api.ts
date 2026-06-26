export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = localStorage.getItem('token');
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(input, { ...init, headers, credentials: 'include' });
  if (res.status === 401) {
    localStorage.removeItem('token');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  return res;
};
