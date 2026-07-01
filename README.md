<div align="center">

# TechPromo

**Platforma do odkrywania, oceniania i moderowania promocji technologicznych.**  
**A full-stack platform for discovering, rating, and moderating technology deals.**

<p>
  <a href="#pl"><img alt="Polski" src="https://img.shields.io/badge/README-PL-e11d48?style=for-the-badge"></a>
  <a href="#en"><img alt="English" src="https://img.shields.io/badge/README-EN-2563eb?style=for-the-badge"></a>
</p>

<p>
  <img alt="React" src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=0f172a">
  <img alt=".NET" src="https://img.shields.io/badge/.NET-8-512bd4?style=for-the-badge&logo=dotnet&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-4169e1?style=for-the-badge&logo=postgresql&logoColor=white">
  <img alt="Azure" src="https://img.shields.io/badge/Azure_AI_Search-0078d4?style=for-the-badge&logo=microsoftazure&logoColor=white">
  <img alt="JWT" src="https://img.shields.io/badge/JWT-secured-f59e0b?style=for-the-badge&logo=jsonwebtokens&logoColor=white">
</p>

</div>

---

<a id="pl"></a>

## PL | O projekcie

**TechPromo** to aplikacja webowa full-stack dla społeczności szukającej okazji na sprzęt, software, narzędzia i usługi technologiczne. Użytkownicy mogą publikować promocje, kupony i oferty, głosować, komentować, zapisywać ulubione znaleziska oraz korzystać z wyszukiwania i rekomendacji.

Projekt łączy frontend w React, backend w ASP.NET Core, bazę PostgreSQL, autoryzację JWT, panele administracyjne i moderatorskie, mechanizmy bezpieczeństwa oraz integrację z Azure AI Search.

### Najważniejsze funkcje

- Publikowanie ofert i kuponów z kategoriami, tagami, zdjęciami oraz datami ważności.
- Konta użytkowników, profile, avatary, zapisane oferty, komentarze i powiadomienia.
- Głosowanie, punkty, odznaki i elementy gamifikacji.
- Panel administratora i moderatora do obsługi ofert, komentarzy, zgłoszeń, ról i synchronizacji wyszukiwarki.
- Azure AI Search: pełnotekstowe wyszukiwanie, sugestie, podobne oferty i synchronizacja indeksu.
- Wykrywanie duplikatów i moderacja treści, aby ograniczyć spam oraz niskiej jakości zgłoszenia.
- Rekomendacje oparte o aktywność użytkownika i metadane ofert.
- Infrastruktura jako kod w Bicep dla zasobów Azure.

### Stack technologiczny

| Obszar | Technologie |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React Router, Lucide |
| Backend | .NET 8, ASP.NET Core Web API, Entity Framework Core, Identity |
| Baza danych | PostgreSQL, Npgsql |
| Bezpieczeństwo | JWT Bearer, role, CORS, HSTS, nagłówki bezpieczeństwa |
| Chmura | Azure AI Search, Azure Content Safety, Azure Communication Email |
| Testy i narzędzia | xUnit, FluentAssertions, Moq, Bicep |

### Struktura repozytorium

```text
TechPromo/
|-- backend/
|   |-- TechPromo.Api/        # ASP.NET Core API
|   |   |-- Controller/       # Główne kontrolery API
|   |   |-- Controllers/      # Kontrolery wyszukiwania/testowe
|   |   |-- Data/             # DbContext i dane startowe
|   |   |-- DTO/              # Kontrakty request/response
|   |   |-- Migrations/       # Migracje EF Core
|   |   |-- Model/            # Encje domenowe
|   |   |-- Search/           # Integracja Azure AI Search
|   |   `-- Services/         # Logika biznesowa
|   `-- TechPromo.Testy/      # Testy jednostkowe i integracyjne
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- contexts/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- services/
|   |   `-- utils/
|   `-- package.json
|-- infra/                    # Szablony Bicep
|-- diagnose-search.ps1       # Diagnostyka wyszukiwarki
|-- test-search.ps1           # Testowanie wyszukiwarki
|-- test-sync.ps1             # Test synchronizacji indeksu
`-- TechPromo.sln
```

### Wymagania

- .NET SDK 8 lub nowszy
- Node.js 18 lub nowszy
- PostgreSQL
- Opcjonalnie: Azure CLI do wdrożeń chmurowych
- Opcjonalnie: Azure AI Search, Azure Content Safety i Azure Communication Email

### Konfiguracja

Sekrety nie są przechowywane w repozytorium. Do konfiguracji lokalnej użyj zmiennych środowiskowych, `.NET user-secrets` albo lokalnego pliku ustawień ignorowanego przez Git.

Wymagana konfiguracja produkcyjna:

```text
ConnectionStrings__DefaultConnection
JWT_SECRET_KEY
Jwt__Issuer
Jwt__Audience
Cors__AllowedOrigins__0
AllowedHosts
AzureSearch__Endpoint
AzureSearch__ApiKey
AzureSearch__IndexName
ContentSafety__Endpoint
ContentSafety__ApiKey
EmailSettings__ConnectionString
EmailSettings__SenderAddress
EmailSettings__FrontendUrl
```

Przykładowa konfiguracja lokalna:

```powershell
cd backend/TechPromo.Api
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=techpromo;Username=postgres;Password=your-password"
dotnet user-secrets set "Jwt:Key" "replace-with-at-least-32-bytes-local-secret"
dotnet user-secrets set "Jwt:Issuer" "TechPromoApi"
dotnet user-secrets set "Jwt:Audience" "TechPromoUsers"
```

### Uruchomienie lokalne

Backend:

```powershell
cd backend/TechPromo.Api
dotnet restore
dotnet ef database update
dotnet run
```

Domyślny adres API:

```text
http://localhost:5023
```

Swagger w trybie development:

```text
http://localhost:5023/swagger
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Domyślny adres frontendu:

```text
http://localhost:5173
```

### Testy

```powershell
dotnet test backend/TechPromo.Testy/TechPromo.Testy.csproj
```

```powershell
cd frontend
npm run lint
npm run build
```

### Bezpieczeństwo i produkcja

API celowo zatrzymuje start w produkcji, jeśli brakuje krytycznych ustawień.

Wprowadzone zabezpieczenia obejmują:

- Brak haseł, kluczy API, sekretów JWT i connection stringów w repozytorium.
- Wymagane jawne domeny CORS.
- Wymagane jawne `AllowedHosts`.
- Wymagany silny klucz podpisu JWT.
- HSTS poza środowiskiem development/test.
- Nagłówki bezpieczeństwa dla przeglądarki.
- Endpointy utrzymaniowe Azure AI Search dostępne tylko dla administratorów.
- Seed danych i synchronizacja wyszukiwarki wyłączone domyślnie w produkcji.
- Uploady runtime i logi buildów ignorowane przez Git.
- Limity uploadu obrazów: maksymalnie 5 plików, do 5 MB każdy, formaty `jpg`, `jpeg`, `png`, `webp`.

Jeśli jakikolwiek sekret był wcześniej opublikowany w historii Git, należy go obrócić u dostawcy i usunąć z historii repozytorium przed uznaniem projektu za bezpieczny.

### Wdrożenie Azure

Szablony infrastruktury znajdują się w katalogu `infra/`.

```powershell
az deployment group create `
  --resource-group <resource-group-name> `
  --template-file infra/main.bicep
```

Po utworzeniu zasobów ustaw wartości produkcyjne w hostingu, sekretach CI/CD, Azure App Service settings albo Key Vault.

---

<a id="en"></a>

## EN | Project Overview

**TechPromo** is a full-stack web application for a community focused on technology deals, coupons, tools, hardware, software, and digital services. Users can publish offers, vote, comment, save favorites, and discover better deals through search and recommendations.

The project combines a React frontend, an ASP.NET Core backend, PostgreSQL storage, JWT authentication, admin and moderation workflows, production security hardening, and Azure AI Search integration.

### Highlights

- Deal and coupon publishing with categories, tags, images, expiration dates, and voting.
- User accounts, profiles, avatars, saved offers, comments, and notifications.
- Voting, points, badges, and gamification features.
- Admin and moderator panels for offers, comments, reports, roles, points, badges, and search synchronization.
- Azure AI Search for full-text search, suggestions, similar offers, and index synchronization.
- Duplicate detection and content moderation to reduce spam and low-quality submissions.
- Recommendation engine based on user activity and offer metadata.
- Infrastructure as code with Bicep templates for Azure resources.

### Technology Stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React Router, Lucide |
| Backend | .NET 8, ASP.NET Core Web API, Entity Framework Core, Identity |
| Database | PostgreSQL, Npgsql |
| Security | JWT Bearer, roles, CORS, HSTS, security headers |
| Cloud | Azure AI Search, Azure Content Safety, Azure Communication Email |
| Testing and tooling | xUnit, FluentAssertions, Moq, Bicep |

### Repository Structure

```text
TechPromo/
|-- backend/
|   |-- TechPromo.Api/        # ASP.NET Core API
|   |   |-- Controller/       # Main API controllers
|   |   |-- Controllers/      # Search/test controllers
|   |   |-- Data/             # EF Core DbContext and seed data
|   |   |-- DTO/              # Request/response contracts
|   |   |-- Migrations/       # EF Core migrations
|   |   |-- Model/            # Domain entities
|   |   |-- Search/           # Azure AI Search integration
|   |   `-- Services/         # Business services
|   `-- TechPromo.Testy/      # Unit and integration tests
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- contexts/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- services/
|   |   `-- utils/
|   `-- package.json
|-- infra/                    # Bicep infrastructure templates
|-- diagnose-search.ps1       # Search diagnostics helper
|-- test-search.ps1           # Search test helper
|-- test-sync.ps1             # Search sync helper
`-- TechPromo.sln
```

### Prerequisites

- .NET SDK 8 or newer
- Node.js 18 or newer
- PostgreSQL database
- Optional: Azure CLI for cloud deployment
- Optional: Azure AI Search, Azure Content Safety, and Azure Communication Email

### Configuration

Secrets are intentionally not stored in the repository. Configure local values with environment variables, `.NET user-secrets`, or a local ignored settings file.

Required production configuration:

```text
ConnectionStrings__DefaultConnection
JWT_SECRET_KEY
Jwt__Issuer
Jwt__Audience
Cors__AllowedOrigins__0
AllowedHosts
AzureSearch__Endpoint
AzureSearch__ApiKey
AzureSearch__IndexName
ContentSafety__Endpoint
ContentSafety__ApiKey
EmailSettings__ConnectionString
EmailSettings__SenderAddress
EmailSettings__FrontendUrl
```

Recommended local setup:

```powershell
cd backend/TechPromo.Api
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=techpromo;Username=postgres;Password=your-password"
dotnet user-secrets set "Jwt:Key" "replace-with-at-least-32-bytes-local-secret"
dotnet user-secrets set "Jwt:Issuer" "TechPromoApi"
dotnet user-secrets set "Jwt:Audience" "TechPromoUsers"
```

For local development, Azure integrations can stay empty. The API can start without Azure Search outside production, but search endpoints that depend on Azure Search require those settings to work.

### Running Locally

Backend:

```powershell
cd backend/TechPromo.Api
dotnet restore
dotnet ef database update
dotnet run
```

Default API URL:

```text
http://localhost:5023
```

Swagger in development:

```text
http://localhost:5023/swagger
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Default frontend URL:

```text
http://localhost:5173
```

### Testing

```powershell
dotnet test backend/TechPromo.Testy/TechPromo.Testy.csproj
```

```powershell
cd frontend
npm run lint
npm run build
```

### Production Security

The API is configured to fail fast in production when critical settings are missing. This is intentional.

Production hardening includes:

- No committed database passwords, API keys, JWT secrets, or email connection strings.
- Required explicit CORS origins.
- Required explicit `AllowedHosts`.
- Required strong JWT signing key.
- HSTS outside development and testing.
- Browser security headers.
- Admin-only Azure AI Search maintenance endpoints.
- Startup seed and search synchronization disabled by default in production.
- Runtime uploads and build logs ignored by Git.
- Image upload limits: max 5 files, max 5 MB each, allowed formats `jpg`, `jpeg`, `png`, `webp`.

If a secret was ever committed to Git history, rotate it in the provider dashboard and remove it from history before treating the repository as safe.

### Azure Deployment

Infrastructure templates are stored in `infra/`.

```powershell
az deployment group create `
  --resource-group <resource-group-name> `
  --template-file infra/main.bicep
```

After provisioning, configure production values through your hosting provider, CI/CD secrets, Azure App Service settings, or Key Vault.

---

## Scripts

| Script | Purpose |
| --- | --- |
| `diagnose-search.ps1` | Checks Azure AI Search configuration and diagnostics. |
| `test-search.ps1` | Helps validate search behavior. |
| `test-sync.ps1` | Helps validate search synchronization. |

## License

MIT License. Add a dedicated `LICENSE` file before publishing the project broadly.
