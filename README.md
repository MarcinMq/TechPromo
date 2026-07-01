# TechPromo

TechPromo is a full-stack web platform for sharing, discovering, rating, and managing technology deals, coupons, and promotions. The project combines a React frontend, an ASP.NET Core API, PostgreSQL storage, JWT authentication, moderation tools, gamification, recommendations, and Azure AI Search integration.

## Highlights

- Deal and coupon publishing with categories, tags, images, validity dates, and voting.
- User accounts, JWT authentication, profiles, avatars, saved offers, comments, and notifications.
- Admin and moderator panels for reviewing offers, comments, reports, roles, points, badges, and search sync.
- Azure AI Search integration for full-text search, suggestions, similar offers, and index synchronization.
- Content moderation and duplicate detection to reduce spam and low-quality submissions.
- Recommendation engine based on user activity and offer metadata.
- Infrastructure as code with Bicep templates for Azure resources.

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide icons

### Backend

- .NET 8
- ASP.NET Core Web API
- Entity Framework Core
- PostgreSQL via `Npgsql.EntityFrameworkCore.PostgreSQL`
- ASP.NET Core Identity
- JWT Bearer authentication
- Swagger/OpenAPI in development

### Cloud And Tooling

- Azure AI Search
- Azure Communication Email
- Azure Content Safety
- Bicep
- xUnit, FluentAssertions, Moq

## Repository Structure

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

## Prerequisites

- .NET SDK 8 or newer
- Node.js 18 or newer
- PostgreSQL database
- Optional: Azure CLI for cloud deployment
- Optional: Azure resources for AI Search, Content Safety, and Communication Email

## Configuration

Secrets are intentionally not stored in the repository. Configure local values with environment variables, .NET user secrets, or a local ignored settings file.

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

Recommended local setup with user secrets:

```powershell
cd backend/TechPromo.Api
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=techpromo;Username=postgres;Password=your-password"
dotnet user-secrets set "Jwt:Key" "replace-with-at-least-32-bytes-local-secret"
dotnet user-secrets set "Jwt:Issuer" "TechPromoApi"
dotnet user-secrets set "Jwt:Audience" "TechPromoUsers"
```

For local development, Azure integrations can stay empty. The API will start without Azure Search outside production, but search endpoints that depend on Azure Search need those settings to work.

## Running Locally

### Backend

```powershell
cd backend/TechPromo.Api
dotnet restore
dotnet ef database update
dotnet run
```

Default local API URL from launch settings:

```text
http://localhost:5023
```

Swagger is available in development at:

```text
http://localhost:5023/swagger
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Default local frontend URL:

```text
http://localhost:5173
```

## Testing

Run backend tests:

```powershell
dotnet test backend/TechPromo.Testy/TechPromo.Testy.csproj
```

Run frontend checks:

```powershell
cd frontend
npm run lint
npm run build
```

## Production Notes

The API is configured to fail fast in production when critical settings are missing. This is intentional.

Production hardening includes:

- No committed database passwords, API keys, JWT secrets, or email connection strings.
- Required explicit CORS origins.
- Required explicit `AllowedHosts`.
- Required strong JWT signing key.
- HSTS outside development and testing.
- Security headers for content type, framing, referrer policy, and browser permissions.
- Admin-only protection for Azure Search maintenance endpoints.
- Startup seed/search synchronization disabled by default.
- Runtime uploads and build logs ignored by Git.
- Upload limits for images: max 5 files, max 5 MB each, allowed formats `jpg`, `jpeg`, `png`, `webp`.

Before deploying a public instance, rotate any secrets that were ever committed to Git history.

## Azure Deployment

Infrastructure templates are stored in `infra/`.

Example deployment:

```powershell
az deployment group create `
  --resource-group <resource-group-name> `
  --template-file infra/main.bicep
```

After provisioning, configure the application with production values through your hosting provider, CI/CD secrets, Azure App Service settings, or Key Vault.

## Useful Scripts

- `diagnose-search.ps1` - checks Azure AI Search configuration and diagnostics.
- `test-search.ps1` - helper for validating search behavior.
- `test-sync.ps1` - helper for search synchronization checks.

## Security

Do not commit:

- `.env` files
- `appsettings.Production.json`
- local secrets
- database dumps
- runtime uploads
- build logs

If a secret is exposed, rotate it in the provider dashboard and remove it from Git history before treating the repository as safe.

## License

MIT License. See the license text in this repository or add a dedicated `LICENSE` file before publishing the project broadly.
