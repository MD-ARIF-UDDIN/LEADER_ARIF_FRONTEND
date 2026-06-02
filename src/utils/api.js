const BASE_URL = 'https://leader-arif-server.onrender.com';

const getAuthToken = () => localStorage.getItem('somiti_token');

/**
 * Custom fetch API wrapper.
 * @param {string} endpoint - API route
 * @param {object} options - Fetch options (method, body, headers, etc)
 * @returns {Promise<any>}
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  // If unauthorized / token expired
  if (response.status === 401) {
    localStorage.removeItem('somiti_token');
    localStorage.removeItem('somiti_user');
    // If not already on login page, redirect
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'সেশন শেষ হয়েছে, অনুগ্রহ করে আবার লগইন করুন');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'সার্ভার ত্রুটি, অনুগ্রহ করে আবার চেষ্টা করুন');
  }

  return data;
};
