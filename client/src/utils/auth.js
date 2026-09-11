const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/**
 * Retrieves the stored JWT token from localStorage.
 * @returns {string|null}
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Retrieves the stored user object from localStorage.
 * @returns {object|null}
 */
export const getUser = () => {
  try {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (err) {
    console.error('Failed to parse stored user:', err);
    return null;
  }
};

/**
 * Checks whether the user is currently authenticated with a token.
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Logs the user out by removing token and user from localStorage.
 */
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Constructs headers including the Authorization Bearer header.
 * @param {Record<string, string>} [customHeaders={}]
 * @returns {Record<string, string>}
 */
export const getAuthHeaders = (customHeaders = {}) => {
  const token = getToken();
  const headers = { ...customHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Performs an authenticated fetch call. Automatically attaches Authorization: Bearer <token>.
 * If the response returns HTTP 401 (expired/invalid token), clears stored credentials
 * and redirects to /login while avoiding redirect loops.
 * @param {string} url
 * @param {RequestInit} [options={}]
 * @returns {Promise<Response>}
 */
export const authFetch = async (url, options = {}) => {
  const headers = getAuthHeaders(options.headers || {});
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    logout();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  return response;
};
