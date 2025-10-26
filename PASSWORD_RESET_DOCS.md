# Funkcja resetowania hasła przez email

## Przegląd
Zaimplementowano pełny system resetowania hasła wykorzystujący Azure Communication Services Email.

## Architektura

### Backend (.NET)
- **EmailService**: Serwis wysyłający emaile przez Azure Communication Services
- **IEmailService**: Interface dla email service
- **AccountController**: 2 nowe endpointy:
  - `POST /konto/zapomniane-haslo` - generuje token i wysyła email
  - `POST /konto/resetuj-haslo` - resetuje hasło używając tokenu
- **DTOs**:
  - `ZapomnianeHasloDto` - email
  - `ResetujHasloDto` - email, token, nowe hasło

### Frontend (React + TypeScript)
- **ForgotPasswordPage**: Formularz do wprowadzenia emaila
- **ResetPasswordPage**: Formularz do ustawienia nowego hasła (token z URL)
- **publicPost**: Nowa funkcja w `utils/api.ts` dla requestów bez autoryzacji

### Azure Services
- **Azure Communication Services Email**
- Domain: `DoNotReply@1913b791-d642-46d4-aafd-92ac241a2198.azurecomm.net`
- Free tier: 750 emaili/miesiąc
- Endpoint: `techpromo-comm.europe.communication.azure.com`

## Workflow

1. **Użytkownik zapomniał hasła**:
   - Przechodzi na `/zapomniane-haslo`
   - Wprowadza email i klika "Wyślij link resetujący"
   - Frontend: POST do `/konto/zapomniane-haslo`

2. **Backend generuje token**:
   - Sprawdza czy email istnieje (bez ujawniania użytkownikowi)
   - Generuje token resetowania: `_userManager.GeneratePasswordResetTokenAsync(user)`
   - Koduje token do URL: `Uri.EscapeDataString(resetToken)`
   - Buduje reset URL: `http://localhost:5173/resetuj-haslo?token={token}&email={email}`
   - Wysyła HTML email przez Azure Communication Services
   - Zwraca generyczną wiadomość sukcesu (security best practice)

3. **Użytkownik otrzymuje email**:
   - Email zawiera przycisk "Resetuj hasło" z linkiem
   - Link jest ważny przez 1 godzinę (domyślnie w ASP.NET Identity)

4. **Użytkownik klika link**:
   - Otwiera się `/resetuj-haslo?token=...&email=...`
   - Frontend wyciąga token i email z URL query params
   - Formularz do wprowadzenia nowego hasła (2x dla potwierdzenia)

5. **Resetowanie hasła**:
   - Frontend: POST do `/konto/resetuj-haslo` z { email, token, noweHaslo }
   - Backend: `_userManager.ResetPasswordAsync(user, token, noweHaslo)`
   - Jeśli sukces → komunikat "Hasło zresetowane" → redirect do logowania
   - Jeśli błąd → komunikat błędu (token wygasł / nieprawidłowy)

## Bezpieczeństwo

✅ **Token expiration**: Tokeny wygasają po 1 godzinie
✅ **Generic responses**: Backend nie ujawnia czy email istnieje w systemie
✅ **URL encoding**: Token i email są enkodowane dla bezpieczeństwa URL
✅ **HTTPS ready**: Wspiera HTTPS w produkcji (Request.Scheme)
✅ **Password validation**: Minimum 6 znaków (frontend + backend)
✅ **One-time tokens**: Token można użyć tylko raz

## Konfiguracja

### appsettings.Development.json
```json
{
  "AzureEmail": {
    "ConnectionString": "endpoint=https://techpromo-comm.europe.communication.azure.com/;accesskey=...",
    "SenderAddress": "DoNotReply@1913b791-d642-46d4-aafd-92ac241a2198.azurecomm.net"
  }
}
```

### Program.cs
```csharp
builder.Services.AddScoped<IEmailService, EmailService>();
```

## Routing

### Frontend Routes (App.tsx)
- `/zapomniane-haslo` → `ForgotPasswordPage`
- `/resetuj-haslo` → `ResetPasswordPage`
- Link na `/auth/login` → "Zapomniałeś hasła?"

### Backend Endpoints
- `POST /konto/zapomniane-haslo` - publiczny endpoint
- `POST /konto/resetuj-haslo` - publiczny endpoint

## Testowanie

### Scenariusz happy path:
1. Uruchom backend: `cd backend/TechPromo.Api && dotnet run`
2. Uruchom frontend: `cd frontend && npm run dev`
3. Przejdź na http://localhost:5173/auth/login
4. Kliknij "Zapomniałeś hasła?"
5. Wprowadź istniejący email
6. Sprawdź skrzynkę pocztową (Azure Communication Services)
7. Kliknij link w emailu
8. Wprowadź nowe hasło (2x)
9. Zaloguj się nowym hasłem

### Scenariusze edge case:
- Nieistniejący email → generyczny komunikat sukcesu (bez ujawniania)
- Token wygasły → komunikat błędu "Link wygasł lub nieprawidłowy"
- Token nieprawidłowy → komunikat błędu
- Hasła nie pasują → walidacja frontend
- Hasło < 6 znaków → walidacja frontend + backend

## Monitoring

Backend loguje:
- ✅ Sukces wysyłki emaila: `EmailService: Email resetowania hasła wysłany do {email}`
- ⚠️ Błąd wysyłki: `EmailService: Błąd wysyłania emaila do {email}: {error}`
- ⚠️ Nieudana wysyłka (console): `Nie udało się wysłać emaila resetowania hasła do {email}`

## Przyszłe ulepszenia

- [ ] Email verification przy rejestracji (użyj `WyslijEmailPowitalnyAsync`)
- [ ] Rate limiting (max 5 requestów/godzinę na email)
- [ ] Email templates w osobnych plikach HTML
- [ ] Konfigurowalny czas wygaśnięcia tokenu
- [ ] Monitoring wysyłki emaili (dashboard)
- [ ] Testy jednostkowe dla EmailService
- [ ] Integracja z Azure Application Insights

## Dependencies

### Backend
- `Azure.Communication.Email` (1.1.0)
- `Microsoft.AspNetCore.Identity` (wbudowane)

### Frontend
- React Router DOM (routing)
- Tailwind CSS (styling)
- Lucide React (ikony - loading spinner)
