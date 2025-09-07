/**
 * API Utility Functions
 * Provides consistent API URL handling and error management
 */

/**
 * Get the correct API base URL
 * Handles cases where NEXT_PUBLIC_API_BASE_URL might include '/api' or not
 */
export const getApiBaseUrl = (): string => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
  return apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`;
};

/**
 * Build API endpoint URL
 */
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};

/**
 * Handle API response and errors
 */
export const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      
      // Handle specific error types
      if (response.status === 429) {
        // Rate limiting error
        const retryAfter = response.headers.get('Retry-After');
        const retryMessage = retryAfter ? ` Please try again after ${retryAfter} seconds.` : ' Please try again later.';
        throw new Error(`Too many requests.${retryMessage}`);
      }
      
      throw new Error(errorData.message || `API Error: ${response.status}`);
    } else {
      // If response is not JSON (like HTML error page), throw a generic error
      if (response.status === 429) {
        throw new Error('Too many requests. Please try again later.');
      }
      throw new Error(`Server Error: ${response.status} - ${response.statusText}`);
    }
  }
  
  return response.json();
};

/**
 * Make authenticated API call
 */
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = buildApiUrl(endpoint);
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
  
  const response = await fetch(url, defaultOptions);
  return handleApiResponse(response);
};

export default {
  getApiBaseUrl,
  buildApiUrl,
  handleApiResponse,
  apiCall,
};
