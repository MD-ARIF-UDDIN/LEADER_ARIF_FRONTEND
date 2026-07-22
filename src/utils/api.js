const BASE_URL = 'https://leader-arif-server.onrender.com';

const getAuthToken = () => localStorage.getItem('somiti_token');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Custom fetch API wrapper with automatic retry support for handling server cold starts.
 * @param {string} endpoint - API route
 * @param {object} options - Fetch options (method, body, headers, retries, etc)
 * @returns {Promise<any>}
 */
export const apiRequest = async (endpoint, options = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  const maxRetries = options.retries !== undefined ? options.retries : (method === 'GET' ? 3 : 1);
  const retryDelay = options.retryDelay || 2500;

  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    try {
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

      // Handle server spinning up / gateway transient errors (502, 503, 504)
      if ([502, 503, 504].includes(response.status) && attempt < maxRetries) {
        console.warn(`Server returning ${response.status} (attempt ${attempt}/${maxRetries}), retrying in ${retryDelay}ms...`);
        await delay(retryDelay);
        continue;
      }

      // If unauthorized / token expired
      if (response.status === 401) {
        localStorage.removeItem('somiti_token');
        localStorage.removeItem('somiti_user');
        // If not already on login page, redirect
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        const errData = await response.json().catch(() => ({}));
        const authErr = new Error(errData.message || 'সেশন শেষ হয়েছে, অনুগ্রহ করে আবার লগইন করুন');
        authErr.isAuthError = true;
        throw authErr;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'সার্ভার ত্রুটি, অনুগ্রহ করে আবার চেষ্টা করুন');
      }

      return data;
    } catch (err) {
      // If it's explicit Auth error, rethrow immediately without retrying
      if (err.isAuthError) {
        throw err;
      }

      // On last attempt or non-retriable error, throw
      if (attempt >= maxRetries) {
        throw err;
      }

      console.warn(`API request failed (attempt ${attempt}/${maxRetries}): ${err.message}. Retrying in ${retryDelay}ms...`);
      await delay(retryDelay);
    }
  }
};

