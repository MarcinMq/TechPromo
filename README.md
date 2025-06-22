# TechPromo



## Konfiguracja

1. Ustaw zmienną środowiskową `TECHPROMO_CONNECTION_STRING` z odpowiednim connection stringiem do bazy PostgreSQL.
2. Przy pierwszym uruchomieniu aplikacja utworzy role *Administrator*, *Moderator* i *Uzytkownik* oraz konto administracyjne `admin@test.pl` z hasłem `Qwerty123!`.

## Backend

```bash
cd backend/TechPromo.Api
 dotnet run
```

Serwer wystartuje na domyślnym porcie i automatycznie zastosuje seedy bazy danych.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Serwer deweloperski Vite będzie dostępny pod adresem wyświetlonym w konsoli.

