# Skrypt testowy do synchronizacji Azure Search

$baseUrl = "http://localhost:5023"

Write-Host "=== Test synchronizacji Azure Search ===" -ForegroundColor Cyan

# 1. Logowanie jako admin
Write-Host "`n1. Logowanie jako admin..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@techpromo.pl"
    password = "Qwerty123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/konto/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "OK Zalogowano pomyslnie" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "ERROR Blad logowania: $_" -ForegroundColor Red
    exit 1
}

# 2. Synchronizacja wszystkich ofert
Write-Host "`n2. Synchronizacja wszystkich ofert..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $syncResponse = Invoke-RestMethod -Uri "$baseUrl/api/admin/sync/azure-search" -Method Post -Headers $headers
    Write-Host "OK Synchronizacja wykonana" -ForegroundColor Green
    Write-Host "Odpowiedz:" -ForegroundColor Gray
    $syncResponse | ConvertTo-Json -Depth 3 | Write-Host
} catch {
    Write-Host "ERROR Blad synchronizacji: $_" -ForegroundColor Red
    Write-Host $_.Exception.Response.StatusCode -ForegroundColor Red
    exit 1
}

# 3. Sprawdzenie liczby ofert w Azure Search
Write-Host "`n3. Sprawdzanie liczby ofert w indeksie..." -ForegroundColor Yellow
try {
    $countResponse = Invoke-RestMethod -Uri "$baseUrl/api/wyszukiwarka/test/count" -Method Get -Headers $headers
    Write-Host "OK Liczba ofert w Azure Search: $countResponse" -ForegroundColor Green
} catch {
    Write-Host "WARNING Nie udalo sie pobrac liczby ofert" -ForegroundColor Yellow
}

Write-Host "`n=== Test zakonczony ===" -ForegroundColor Cyan
