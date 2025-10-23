# Skrypt testowy do wyszukiwania drona

$baseUrl = "http://localhost:5023"

Write-Host "=== Test wyszukiwania drona ===" -ForegroundColor Cyan

# Test 1: Szukaj "dron"
Write-Host "`n1. Szukam 'dron'..." -ForegroundColor Yellow
try {
    $searchUrl = "$baseUrl/api/wyszukiwarka?q=dron&strona=1&rozmiarStrony=10"
    $response1 = Invoke-RestMethod -Uri $searchUrl -Method Get
    Write-Host "OK Znaleziono: $($response1.totalCount) wynikow" -ForegroundColor Green
    if ($response1.totalCount -gt 0) {
        $response1.items | ForEach-Object {
            Write-Host "  - ID: $($_.document.ofertaId) | $($_.document.nazwa)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}

# Test 2: Szukaj "drone"
Write-Host "`n2. Szukam 'drone'..." -ForegroundColor Yellow
try {
    $searchUrl = "$baseUrl/api/wyszukiwarka?q=drone&strona=1&rozmiarStrony=10"
    $response2 = Invoke-RestMethod -Uri $searchUrl -Method Get
    Write-Host "OK Znaleziono: $($response2.totalCount) wynikow" -ForegroundColor Green
    if ($response2.totalCount -gt 0) {
        $response2.items | ForEach-Object {
            Write-Host "  - ID: $($_.document.ofertaId) | $($_.document.nazwa)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}

# Test 3: Szukaj "DJI"
Write-Host "`n3. Szukam 'DJI'..." -ForegroundColor Yellow
try {
    $searchUrl = "$baseUrl/api/wyszukiwarka?q=DJI&strona=1&rozmiarStrony=10"
    $response3 = Invoke-RestMethod -Uri $searchUrl -Method Get
    Write-Host "OK Znaleziono: $($response3.totalCount) wynikow" -ForegroundColor Green
    if ($response3.totalCount -gt 0) {
        $response3.items | ForEach-Object {
            Write-Host "  - ID: $($_.document.ofertaId) | $($_.document.nazwa)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}

# Test 4: Wszystkie oferty (bez query)
Write-Host "`n4. Wszystkie oferty..." -ForegroundColor Yellow
try {
    $searchUrl = "$baseUrl/api/wyszukiwarka?strona=1&rozmiarStrony=20"
    $response4 = Invoke-RestMethod -Uri $searchUrl -Method Get
    Write-Host "OK Znaleziono: $($response4.totalCount) wynikow" -ForegroundColor Green
    $response4.items | ForEach-Object {
        Write-Host "  - ID: $($_.document.ofertaId) | $($_.document.nazwa)" -ForegroundColor Gray
    }
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}

Write-Host "`n=== Test zakonczony ===" -ForegroundColor Cyan
