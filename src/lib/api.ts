const API_URL = '/api';

export async function apiFetch(endpoint: string, options: any = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only reload if we are not already on the login page to avoid loops
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?error=session_expired';
      }
      throw new Error('Your session has expired. Please log in again.');
    }
    
    let errorMessage = 'Something went wrong';
    try {
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } else {
        errorMessage = `Server Error (${response.status}): ${await response.text().then(t => t.slice(0, 100))}`;
      }
    } catch (e) {
      errorMessage = `Error ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text();
}
