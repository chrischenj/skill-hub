const BASE = '/api';

export async function api(url, options = {}) {
  const token = localStorage.getItem('skilhub_token');
  const headers = { ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${url}`, { ...options, headers });
  if (res.status === 401 && window.location.pathname !== '/login') {
    localStorage.removeItem('skilhub_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  return res;
}
