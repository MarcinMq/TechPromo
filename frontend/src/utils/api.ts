import { getAuthHeaders, isAuthenticated, logout } from './auth';

// Bazowy URL API - można przenieść do env później
const API_BASE = 'http://localhost:5023';

// Wrapper dla fetch z automatyczną obsługą autoryzacji
export const authorizedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  if (!isAuthenticated()) {
    throw new Error('Nie jesteś zalogowany');
  }

  // Automatycznie dodaję API_BASE jeśli URL zaczyna się od /
  const fullUrl = url.startsWith('/') ? `${API_BASE}${url}` : url;

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json', // Domyślny Content-Type
      ...getAuthHeaders(),
      ...options.headers
    }
  });

  // Jeśli token wygasł, wyloguj użytkownika
  if (response.status === 401) {
    logout();
    window.location.href = '/auth/login';
    throw new Error('Sesja wygasła. Zaloguj się ponownie.');
  }

  return response;
};

// Uproszczone funkcje dla różnych metod HTTP
export const apiGet = (url: string) => authorizedFetch(url);

export const apiPost = (url: string, data: any) => 
  authorizedFetch(url, {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const apiPostFormData = async (url: string, formData: FormData) => {
  if (!isAuthenticated()) {
    throw new Error('Nie jesteś zalogowany');
  }

  const fullUrl = url.startsWith('/') ? `${API_BASE}${url}` : url;

  console.log('=== apiPostFormData Debug ===');
  console.log('URL:', fullUrl);
  console.log('Auth headers:', getAuthHeaders());
  
  // Debug FormData contents
  console.log('FormData contents:');
  for (let [key, value] of formData.entries()) {
    console.log(`${key}:`, value);
  }

  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      ...getAuthHeaders()
      // Nie ustawiamy Content-Type - przeglądarka automatycznie ustawi z boundary
    },
    body: formData
  });

  console.log('Response status:', response.status);
  console.log('Response headers:', [...response.headers.entries()]);

  // Obsługa błędów autoryzacji
  if (response.status === 401) {
    logout();
    window.location.href = '/auth/login';
    throw new Error('Sesja wygasła. Zaloguj się ponownie.');
  }

  return response;
};

export const apiPut = (url: string, data: any) => 
  authorizedFetch(url, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

// Uniwersalna funkcja API - automatycznie wybiera metodę i parsuje JSON
export const api = async (url: string, options: RequestInit = {}): Promise<any> => {
  // Automatycznie dodaję API_BASE jeśli URL zaczyna się od /
  const fullUrl = url.startsWith('/') ? `${API_BASE}/${url}` : `${API_BASE}/${url}`;

  const response = await authorizedFetch(fullUrl, options);
  
  // Parsuj JSON jeśli response ma zawartość
  if (response.status === 204) {
    return null; // No content
  }

  return await response.json();
};

export const apiDelete = (url: string) => 
  authorizedFetch(url, {
    method: 'DELETE'
  });
