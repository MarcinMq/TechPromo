# TechPromo - Instrukcje uruchamiania

## Wymagane zmienne środowiskowe

### Sposób 1: Plik .env (zalecane dla rozwoju)
Stwórz plik `.env` w folderze `backend/TechPromo.Api/`:
```
JWT_SECRET_KEY=TechPromo2025_SecretKey_B8f9E3mX7pQ2wR5tY8uI9oP1aS3dF6gH4jK7lZ0xC2vB5nM8
```

### Sposób 2: Zmienne środowiskowe systemu (Windows)
```powershell
$env:JWT_SECRET_KEY="TechPromo2025_SecretKey_B8f9E3mX7pQ2wR5tY8uI9oP1aS3dF6gH4jK7lZ0xC2vB5nM8"
```

### Sposób 3: Visual Studio / VS Code
Dodaj w `Properties/launchSettings.json`:
```json
"environmentVariables": {
  "JWT_SECRET_KEY": "TechPromo2025_SecretKey_B8f9E3mX7pQ2wR5tY8uI9oP1aS3dF6gH4jK7lZ0xC2vB5nM8"
}
```

### Sposób 4: Azure/Produkcja
W Azure App Service → Configuration → Application settings:
- Name: `JWT_SECRET_KEY`
- Value: `[twój-bezpieczny-klucz]`

## Uruchamianie

1. **Backend** (port 5023):
   ```bash
   cd backend/TechPromo.Api
   dotnet run
   ```

2. **Frontend** (port 5173):
   ```bash
   cd frontend
   npm run dev
   ```

## Bezpieczeństwo

⚠️ **NIGDY** nie commituj pliku `.env` do repozytorium!
✅ Plik `.env` jest już dodany do `.gitignore`
✅ W produkcji używaj Azure Key Vault lub podobnych usług
