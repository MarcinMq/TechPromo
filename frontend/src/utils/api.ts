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

export const apiPut = (url: string, data: any) => 
  authorizedFetch(url, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

export const apiDelete = (url: string) => 
  authorizedFetch(url, {
    method: 'DELETE'
  });
