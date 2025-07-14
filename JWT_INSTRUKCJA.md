# JWT Authentication - Instrukcja dla Frontend

## Zmiany wprowadzone:

### 1. **Nowe pliki utility**:
- `src/utils/auth.ts` - funkcje do obsługi JWT
- `src/utils/api.ts` - wrapper dla fetch z autoryzacją
- `src/components/ProtectedRoute.tsx` - komponent do ochrony tras
- `src/components/UserInfo.tsx` - komponent informacji o użytkowniku

### 2. **Zaktualizowane komponenty**:
- `Login.tsx` - teraz zapisuje token JWT i dane użytkownika
- `Register.tsx` - analogicznie jak Login
- `Profil.tsx` - używa JWT do autoryzacji zapytań
- `App.tsx` - sprawdza autoryzację lokalnie zamiast zapytań do API

### 3. **Jak używać**:

#### Sprawdzanie czy użytkownik jest zalogowany:
```typescript
import { isAuthenticated, getUserData } from '../utils/auth';

if (isAuthenticated()) {
  const user = getUserData();
  console.log(user?.nick);
}
```

#### Wykonywanie autoryzowanych zapytań:
```typescript
import { authorizedFetch, apiGet, apiPost } from '../utils/api';

// Sposób 1:
const response = await authorizedFetch('/api/protected-endpoint');

// Sposób 2:
const data = await apiGet('/api/some-data');
const result = await apiPost('/api/create-something', { name: 'test' });
```

#### Ochrona tras:
```tsx
<Route path="/protected" element={
  <ProtectedRoute>
    <SomeComponent />
  </ProtectedRoute>
} />

<Route path="/admin" element={
  <ProtectedRoute requiredRole="Admin">
    <AdminPanel />
  </ProtectedRoute>
} />
```

### 4. **Dane przechowywane w localStorage**:
- `authToken` - JWT token
- `userNick` - nick użytkownika
- `userEmail` - email użytkownika
- `userRole` - rola użytkownika
- `userPoints` - punkty użytkownika

### 5. **Automatyczne wylogowywanie**:
System automatycznie wylogowuje użytkownika gdy:
- Token JWT wygaśnie
- API zwróci 401 Unauthorized
- Token zostanie uszkodzony

## Testowanie:

1. Uruchom backend: `dotnet run` w folderze TechPromo.Api
2. Uruchom frontend: `npm run dev` w folderze frontend
3. Przejdź na http://localhost:5173
4. Zarejestruj nowego użytkownika lub zaloguj się istniejącym
5. Sprawdź czy token jest zapisany w localStorage (F12 → Application → Local Storage)
6. Sprawdź czy chronione endpointy działają (Profil, Admin Panel)
