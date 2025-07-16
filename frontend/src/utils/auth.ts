// Moje funkcje do obsługi logowania z JWT tokenami

export interface UserData {
  nick: string;
  email: string;
  role: string;
  points: number;
}

// Sprawdzam czy użytkownik jest zalogowany - patrzę na token w localStorage
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('authToken');
  if (!token) return false;
  
  try {
    // JWT składa się z 3 części oddzielonych kropkami: header.payload.signature
    // Mnie interesuje payload (środkowa część) - tam są dane użytkownika
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    // Sprawdzam czy token nie wygasł (exp = expiration time)
    return payload.exp > currentTime;
  } catch {
    // Jeśli token jest nieprawidłowy - traktuję jako niezalogowany
    return false;
  }
};

// Pobieram dane użytkownika które zapisałem po logowaniu
export const getUserData = (): UserData | null => {
  if (!isAuthenticated()) return null;
  
  try {
    return {
      nick: localStorage.getItem('userNick') || '',
      email: localStorage.getItem('userEmail') || '',
      role: localStorage.getItem('userRole') || '',
      points: parseInt(localStorage.getItem('userPoints') || '0')
    };
  } catch {
    return null;
  }
};

// Wylogowuję użytkownika - po prostu kasuje wszystkie dane z localStorage
export const logout = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userNick');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userPoints');
  
  // Informuję resztę aplikacji że stan się zmienił
  window.dispatchEvent(new Event('authChanged'));
};

// Zapisuję session po logowaniu - wszystkie dane w jednym miejscu
export const saveUserSession = (loginResponse: any): void => {
  localStorage.setItem('authToken', loginResponse.token);
  localStorage.setItem('userNick', loginResponse.nick);
  localStorage.setItem('userEmail', loginResponse.email);
  localStorage.setItem('userRole', loginResponse.rola);
  localStorage.setItem('userPoints', loginResponse.punkty.toString());
  
  // Informuję resztę aplikacji że ktoś się zalogował
  window.dispatchEvent(new Event('authChanged'));
};

// Pobieram token do wysyłania zapytań do API
export const getAuthToken = (): string | null => {
  return isAuthenticated() ? localStorage.getItem('authToken') : null;
};

// Tworzę nagłówki HTTP z tokenem JWT - używam w każdym zapytaniu do API
export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    // Jeśli mam token - dodaję go jako Bearer authorization
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Sprawdzam czy użytkownik ma konkretną rolę (Admin, Uzytkownik) 
// Obsługuje też wiele ról oddzielonych przecinkami (np. "Moderator,Admin")
export const hasRole = (role: string): boolean => {
  const userData = getUserData();
  if (!userData) return false;
  
  // Jeśli role zawiera przecinek, to sprawdzam każdą rolę oddzielnie
  const allowedRoles = role.split(',').map(r => r.trim());
  return allowedRoles.includes(userData.role);
};

// Skrót do sprawdzenia czy ktoś jest adminem
export const isAdmin = (): boolean => {
  return hasRole('Admin');
};
