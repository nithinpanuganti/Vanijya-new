const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}, isFormData: boolean = false): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('vanijya_token') : null;

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  // Only set application/json if NOT sending FormData (let browser set multipart boundary)
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}`;
      let errorData = null;
      try {
        errorData = await response.json();
        if (Array.isArray(errorData.message)) {
          errorMessage = errorData.message.join(', ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Response was not JSON (e.g. 413 Payload Too Large raw HTML/text)
        if (response.status === 413) {
          errorMessage = 'Profile photo exceeds the 5 MB size limit.';
        }
      }
      throw new ApiError(response.status, errorMessage, errorData);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, error.message || 'Network connection failed. Please verify the backend is running.');
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { method: 'GET', ...options }),
  post: <T>(endpoint: string, data?: any, options?: RequestInit) => {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    return request<T>(
      endpoint,
      {
        method: 'POST',
        body: isFormData ? data : data ? JSON.stringify(data) : undefined,
        ...options,
      },
      isFormData,
    );
  },
  patch: <T>(endpoint: string, data?: any, options?: RequestInit) => {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    return request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: isFormData ? data : data ? JSON.stringify(data) : undefined,
        ...options,
      },
      isFormData,
    );
  },
  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { method: 'DELETE', ...options }),
};
