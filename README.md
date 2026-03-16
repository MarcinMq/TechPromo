# TechPromo 🚀

TechPromo to nowoczesna platforma internetowa stworzona z myślą o miłośnikach technologii, umożliwiająca dzielenie się, odkrywanie i ocenianie najlepszych promocji, kuponów oraz okazji ze świata IT i elektroniki.

## 🌟 Główne funkcje

* **Zarządzanie ofertami:** Użytkownicy mogą dodawać nowe okazje i kody rabatowe, edytować je oraz kategoryzować.
* **Zaawansowana wyszukiwarka:** Szybkie i precyzyjne wyszukiwanie ofert dzięki integracji z chmurowym systemem wyszukiwania (Azure AI Search), w tym obsługa sugestii i filtrów.
* **System społecznościowy:** Możliwość głosowania (upvote/downvote), komentowania ofert oraz zapisywania ulubionych okazji na później.
* **Grywalizacja i odznaki:** System przyznawania odznak za aktywność, motywujący społeczność do działania.
* **Moderacja i bezpieczeństwo:** Wbudowane mechanizmy wykrywania duplikatów ofert oraz automatyczna moderacja treści. Dedykowany panel dla administratorów i moderatorów.
* **Rekomendacje:** Spersonalizowane propozycje ofert dla użytkowników na podstawie ich aktywności.

## 🛠️ Stos technologiczny

Projekt został zbudowany w architekturze klient-serwer przy użyciu nowoczesnych narzędzi:

### Frontend
* **Framework:** React 18
* **Język:** TypeScript
* **Narzędzie budowania:** Vite
* **Stylistyka:** Tailwind CSS
* **Routing:** React Router

### Backend
* **Framework:** .NET 8 (ASP.NET Core Web API)
* **Język:** C#
* **ORM:** Entity Framework Core
* **Baza danych:** SQL Server
* **Autoryzacja:** JWT (JSON Web Tokens)
* **Architektura:** N-warstwowa (Kontrolery, Serwisy, Repozytoria/Modele)

### Infrastruktura & Narzędzia
* **Infrastruktura jako kod (IaC):** Bicep (chmura Azure)
* **Wyszukiwanie:** Azure AI Search
* **Testy:** xUnit (testy jednostkowe i integracyjne)

## 📁 Struktura projektu

```text
TechPromo/
├── backend/                  # Kod źródłowy serwera (API)
│   ├── TechPromo.Api/        # Główny projekt ASP.NET Core
│   │   ├── Controllers/      # Endpointy API (Oferty, Użytkownicy, Auth itp.)
│   │   ├── Data/             # Kontekst bazy danych i migracje EF Core
│   │   ├── DTO/              # Obiekty transferu danych (Data Transfer Objects)
│   │   ├── Model/            # Modele domenowe
│   │   ├── Search/           # Logika integracji z Azure AI Search
│   │   └── Services/         # Logika biznesowa (odznaki, maile, duplikaty)
│   └── TechPromo.Testy/      # Projekt z testami xUnit
├── frontend/                 # Aplikacja kliencka React
│   ├── src/
│   │   ├── components/       # Komponenty reużywalne UI (przyciski, formularze, modale)
│   │   ├── pages/            # Widoki stron (Logowanie, Strona Główna, Panel Admina)
│   │   ├── utils/            # Funkcje pomocnicze i konfiguracja połączeń API
│   │   └── assets/           # Statyczne zasoby (obrazy, ikony)
│   └── ...konfiguracja Vite i Tailwind
├── infra/                    # Skrypty wdrożeniowe Azure (pliki .bicep)
└── skrypty PowerShell        # Skrypty narzędziowe (.ps1) np. do diagnostyki
```

## 🚀 Jak uruchomić projekt lokalnie

### Wymagania wstępne
* Zestaw SDK .NET 8
* Node.js (wersja 18+ lub nowsza)
* Serwer bazy danych SQL Server (LocalDB lub pełna instancja)

### Uruchamianie Backendu

1. Przejdź do folderu z głównym API:

```bash
cd backend/TechPromo.Api
```

2. Skonfiguruj plik `appsettings.Development.json` upewniając się, że `ConnectionStrings` wskazuje na Twoją lokalną bazę danych.

3. Zaktualizuj bazę danych (wykonaj migracje):

```bash
dotnet ef database update
```

4. Uruchom serwer aplikacji:

```bash
dotnet run
```

API domyślnie będzie dostępne pod adresem m.in. `https://localhost:5001` (wraz z dokumentacją interaktywną Swagger).

### Uruchamianie Frontendu

1. Przejdź do folderu z aplikacją React w nowym oknie terminala:

```bash
cd frontend
```

2. Zainstaluj niezbędne pakiety NPM:

```bash
npm install
```

3. Uruchom serwer deweloperski:

```bash
npm run dev
```

Aplikacja powinna być dostępna pod adresem `http://localhost:5173`.

## 🧪 Testowanie

Projekt posiada rozbudowany zestaw testów dla backendu. Aby je uruchomić, wpisz w konsoli:

```bash
cd backend/TechPromo.Testy
dotnet test
```

## ☁️ Wdrożenie (Deployment)

Infrastruktura chmurowa jest definiowana jako kod. Aby wdrożyć zasoby w chmurze Microsoft Azure (np. usługę wyszukiwania), wykorzystaj skrypty Bicep:

```bash
az deployment group create --resource-group <TwojaGrupaZasobow> --template-file infra/main.bicep
```

W głównym katalogu znajdziesz też skrypty PowerShell (np. `diagnose-search.ps1`), które ułatwiają synchronizację i diagnostykę działania wyszukiwarki.

## 📝 Licencja

Ten projekt jest udostępniany na licencji MIT. Zobacz szczegóły poniżej.

```
MIT License

Copyright (c) 2024 TechPromo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
