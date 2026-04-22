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
      // Try to parse JSON strictly first
      if (contentType && (contentType.includes('application/json') || contentType.includes('text/json'))) {
        const error = await response.json();
        errorMessage = error.error || error.message || errorMessage;
      } else {
        // Handle common plain text errors gracefully
        const text = await response.text();
        if (response.status === 403 && (text.toLowerCase().includes('forbidden') || !text)) {
          errorMessage = 'Access Restricted: You do not have permission to perform this analytical operation.';
        } else {
          errorMessage = `Infrastructure Message (${response.status}): ${text.slice(0, 150) || 'No details provided'}`;
        }
      }
    } catch (e) {
      if (response.status === 403) {
        errorMessage = 'Analytical Access Denied (403)';
      } else {
        errorMessage = `Operational Exception ${response.status}: ${response.statusText}`;
      }
    }
    throw new Error(errorMessage);
  }

  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text();
}
