# Skrypt diagnostyczny do sprawdzenia problemu z Azure Search
# Uruchom API przed wykonaniem tego skryptu

$baseUrl = "http://localhost:5023"

Write-Host "=== Diagnostyka Azure Search ===" -ForegroundColor Cyan

# 1. Sprawdź statystyki indeksu
Write-Host "`n1. Statystyki indeksu Azure Search..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$baseUrl/api/wyszukiwarka/statystyki" -Method Get
    Write-Host "Liczba ofert w indeksie: $($stats.liczbaOfertWIndeksie)" -ForegroundColor Green
} catch {
    Write-Host "BLAD: Nie mozna pobrac statystyk. Czy API dziala?" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# 2. Pobierz wszystkie oferty z wyszukiwarki (bez filtrow)
Write-Host "`n2. Wszystkie oferty w Azure Search (bez filtrow)..." -ForegroundColor Yellow
try {
    $searchAll = Invoke-RestMethod -Uri "$baseUrl/api/wyszukiwarka?tylkoAktywne=false&tylkoZatwierdzone=false" -Method Get
    Write-Host "Znaleziono: $($searchAll.totalCount) ofert" -ForegroundColor Green
    
    if ($searchAll.items.Count -gt 0) {
        Write-Host "`nPierwsze 5 ofert:" -ForegroundColor Gray
        $searchAll.items | Select-Object -First 5 | ForEach-Object {
            $doc = $_.document
            Write-Host "  ID: $($doc.ofertaId) | $($doc.nazwa) | Kat: $($doc.kategoria) | Aktywna: $($doc.aktywna) | Zatwierdzona: $($doc.zatwierdzona)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "BLAD podczas wyszukiwania: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Pobierz oferty tylko zatwierdzone i aktywne
Write-Host "`n3. Oferty zatwierdzone i aktywne..." -ForegroundColor Yellow
try {
    $searchApproved = Invoke-RestMethod -Uri "$baseUrl/api/wyszukiwarka?tylkoAktywne=true&tylkoZatwierdzone=true" -Method Get
    Write-Host "Znaleziono: $($searchApproved.totalCount) ofert zatwierdzonych i aktywnych" -ForegroundColor Green
} catch {
    Write-Host "BLAD: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Sprawdz kategorie (facets)
Write-Host "`n4. Kategorie w indeksie (facets)..." -ForegroundColor Yellow
try {
    $searchWithFacets = Invoke-RestMethod -Uri "$baseUrl/api/wyszukiwarka" -Method Get
    if ($searchWithFacets.facets -and $searchWithFacets.facets.Kategoria) {
        Write-Host "Kategorie:" -ForegroundColor Green
        $searchWithFacets.facets.Kategoria | ForEach-Object {
            Write-Host "  $($_.value): $($_.count) ofert" -ForegroundColor Gray
        }
    } else {
        Write-Host "Brak kategorii w facets" -ForegroundColor Yellow
    }
} catch {
    Write-Host "BLAD: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Pobierz liste ofert z bazy (przez API ofert)
Write-Host "`n5. Oferty z bazy danych (przez API)..." -ForegroundColor Yellow
try {
    $dbOffers = Invoke-RestMethod -Uri "$baseUrl/api/oferta?strona=1&rozmiar=100" -Method Get
    Write-Host "Oferty z bazy: $($dbOffers.totalCount)" -ForegroundColor Green
    
    # Policz zatwierdzone
    $zatwierdzone = 0
    $niezatwierdzone = 0
    # API moze nie zwracac flagi zatwierdzona - sprawdz strukture
} catch {
    Write-Host "BLAD: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Wymus pelna synchronizacje
Write-Host "`n6. Wymuszona synchronizacja wszystkich ofert..." -ForegroundColor Yellow
try {
    $syncResult = Invoke-RestMethod -Uri "$baseUrl/api/wyszukiwarka/synchronizuj" -Method Post
    Write-Host "Synchronizacja zakonczona:" -ForegroundColor Green
    Write-Host "  Zsynchronizowane: $($syncResult.zsynchronizowane)" -ForegroundColor Gray
    Write-Host "  Bledy: $($syncResult.bledy)" -ForegroundColor Gray
    Write-Host "  Calkowite: $($syncResult.calkowite)" -ForegroundColor Gray
} catch {
    Write-Host "BLAD synchronizacji: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. Sprawdz ponownie statystyki po synchronizacji
Write-Host "`n7. Statystyki po synchronizacji..." -ForegroundColor Yellow
try {
    Start-Sleep -Seconds 2  # Poczekaj na zaindeksowanie
    $statsAfter = Invoke-RestMethod -Uri "$baseUrl/api/wyszukiwarka/statystyki" -Method Get
    Write-Host "Liczba ofert w indeksie: $($statsAfter.liczbaOfertWIndeksie)" -ForegroundColor Green
} catch {
    Write-Host "BLAD: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Diagnostyka zakonczona ===" -ForegroundColor Cyan
