# Audyt bezpieczeństwa TechPromo

Data: 14 października 2026 r.  
Badany commit: `7216e9aaf69f25a7666eeaca5da2eb6b967c2c7b`  
Zakres: React 19 / TypeScript / Vite, ASP.NET Core 8 / Identity / JWT, przesyłanie plików, Azure AI Search i Content Safety, Bicep, zależności oraz wybrany stan historii Git.

## Stan po naprawach

Wdrożono poprawki w kodzie 14 października 2026 r. Poniższe ustalenia audytu zachowano jako zapis stanu wyjściowego; numery linii w ich opisach odnoszą się do badanego commita sprzed zmian.

| Ustalenie | Stan |
| --- | --- |
| SEC-01: historia sekretów | Nadal wymaga rotacji u dostawców i uzgodnionego oczyszczenia historii Git. Nie używano znalezionych danych do logowania. |
| SEC-02: uploady | Wspólny middleware: dekodowanie SkiaSharp, ponowne kodowanie PNG, limity bajtów, wymiarów, liczby zdjęć i współbieżności. Istniejące aktywne pliki pod `/uploads` są blokowane. |
| SEC-03: logowanie | Lockout Identity po 5 błędach na 15 minut, limit 10 żądań uwierzytelniania/minutę/IP, globalny limit 120/minutę/IP. |
| SEC-04: e-mail | Aktualne hasło i potwierdzenie nowej skrzynki; adres nie zmienia się przed potwierdzeniem. Rejestracja nie oznacza adresu jako potwierdzonego. |
| SEC-05: JWT | Weryfikacja security stamp, lockoutu i bieżących ról; reset hasła, wylogowanie i zmiana ról odcinają stare sesje. Zapis profilu zachowuje pierwotny termin wygaśnięcia JWT. |
| SEC-06: endpoint testowy | Cały kontroler wymaga Admin, tekst ma limit długości. |
| SEC-07: zależności | Usunięto AutoMapper, zaktualizowano pakiety .NET i npm. Audyty nie zgłaszają znanych podatności. Tailwind zaktualizowano do 4 z zachowaniem konfiguracji projektu. |
| SEC-08: konta demo | Brak stałego hasła w seedzie; tworzenie tylko w Development po podaniu lokalnego sekretu. Istniejące konta w zewnętrznej bazie nadal wymagają sprawdzenia/zmiany haseł. |
| SEC-09: e-maile użytkowników | Endpoint listy wymaga Admin. |
| SEC-10: moderacja | Błędy lub brak konfiguracji nie oznaczają akceptacji; dodatkowy endpoint komentarzy moderuje treść; edycja jest sprawdzana przed mutacją encji. |
| SEC-11: ukryte oferty | Kontrola widoczności komentarzy i wymóg aktywnej, zatwierdzonej oferty przy dopisywaniu komentarza. |
| SEC-12: Bicep | Usunięto outputy kluczy administratora. Rotacja wcześniej ujawnionych kluczy wymaga dostępu do Azure. |
| SEC-13: przeglądarka | JWT wyłącznie w pamięci, bez localStorage i logowania Authorization. Nagłówki hostingu SPA nadal należy potwierdzić we wdrożeniu. |
| SEC-14: wyjątki | Usunięto szczegóły wyjątków z odpowiedzi, pozostawiono chronione logowanie i ogólną obsługę nieprzechwyconych błędów. |

### Weryfikacja napraw

- Backend kompiluje się; frontend przechodzi `npm run build`.
- 179 testów jednostkowych i 20 przypadków regresji bezpieczeństwa przechodzi: 199/199.
- Pełny zestaw: 216/237 przechodzi, 21 starszych testów integracyjnych nadal nie przechodzi. Sprawdzone przyczyny obejmują brak zastępczego serwisu Azure Search w konfiguracji testowej, przestarzałe adresy endpointów oraz oczekiwanie anonimowego dostępu do chronionej operacji wykrywania duplikatów. Nie osłabiono zabezpieczeń w celu spełnienia tych oczekiwań.
- Testy bezpieczeństwa obejmują role, lockout, reset hasła, wylogowanie, brak przesuwania terminu sesji, potwierdzanie e-maila, ukryte komentarze, brak zapisu odrzuconej edycji, fałszywe obrazy, ponowne kodowanie, limity uploadów, 429 i awarie Azure.
- Kontrola wyglądu po aktualizacji CSS: ekran główny na desktopie i ekran potwierdzenia e-maila na telefonie; brak poziomego przepełnienia w badanym widoku mobilnym.

### Wymagania przy wdrożeniu

- Konieczna rotacja historycznych danych dostępowych oraz sprawdzenie istniejących kont demo; nie można wykonać tego przez samą zmianę kodu.
- Wszystkie stare JWT bez security stamp zostaną odrzucone. Użytkownicy muszą zalogować się ponownie. Token w pamięci oznacza również ponowne logowanie po pełnym odświeżeniu strony.
- E-mail i hasło zmienia się osobno, aby zmiana security stamp nie unieważniała jednocześnie wysłanego linku zmiany adresu.
- Do publikowania treści i obrazów potrzebna jest działająca konfiguracja moderacji, również lokalnie. Potwierdzanie adresów wymaga skonfigurowanej poczty i właściwego `EmailSettings:FrontendUrl` (HTTPS w Production).
- Limity i blokady współbieżności działają w jednym procesie API. Wieloinstancyjne wdrożenie wymaga wspólnych limitów gatewaya i egzekwowania quota w magazynie danych.
- Nie wykonano testów prawdziwej wysyłki Azure Email, rzeczywistej moderacji, Linuxowych bibliotek natywnych SkiaSharp ani produkcyjnego proxy/CDN. Potwierdzono przepływy z izolowaną bazą i zastępczymi usługami.

## Podsumowanie audytu wyjściowego

W kodzie i konfiguracji znaleziono problemy wymagające naprawy przed uznaniem aplikacji za gotową do produkcji. Najważniejsze to historyczne dane dostępowe w Git, niespójna walidacja plików, brak blokady prób logowania, zmiana e-maila bez ponownego uwierzytelnienia i brak unieważniania JWT. Publiczny endpoint ujawnia e-maile użytkowników, a inny pozwala anonimowo zużywać zasoby Azure Content Safety.

Raport zawiera 14 ustaleń: 8 o wysokiej wadze (w tym ryzyka warunkowe i obecność podatnych zależności), 5 o średniej oraz 1 o niskiej. Nie potwierdzono krytycznej podatności działającego wdrożenia. Jeżeli historyczne dane dostępowe nadal są aktywne, problem SEC-01 należy potraktować jako krytyczny: osoba mająca dostęp do repozytorium może uzyskać nieautoryzowany dostęp do usług.

`npm audit` w katalogu `frontend` zgłosił 31 podatnych pozycji pakietów: 25 high, 4 moderate, 2 low. To nie jest liczba niezależnych, potwierdzonych ataków na aplikację; część wyników pochodzi z tej samej zależności przechodniej. NuGet wskazał 3 podatne pakiety przechodnie i 4 advisory, wszystkie high.

Audyt jest analizą kodu i zależności, a nie testem penetracyjnym produkcji. Nie wykonywano prób przejęcia kont, masowych żądań ani połączeń przy użyciu znalezionych danych dostępowych. Kod aplikacji nie został zmieniony.

## Wysoka waga

### SEC-01: Dane dostępowe pozostają w historii Git

- **Reguła:** zarządzanie sekretami / CWE-798.
- **Lokalizacja:** `backend/TechPromo.Api/appsettings.json` w commicie `e90cbfb7134656f2c66911363f5ba1f81815fe5d`, linie 3, 7 i 17.
- **Dowód:** poprzednia konfiguracja zawiera connection string z literalnym hasłem bazy, niepusty klucz Azure Search oraz connection string poczty z `accesskey=`. Wartości celowo pominięto w raporcie. Aktualny plik ma te pola puste, ale poprzedni commit nadal jest dostępny lokalnie.
- **Skutek:** odczyt historii pozwala odzyskać dane dostępowe; usunięcie ich z najnowszego pliku nie unieważnia kluczy.
- **Warunek:** nie zweryfikowano ważności danych ani widoczności repozytorium. Potwierdzona jest obecność w historii, nie aktualny dostęp do usług.
- **Naprawa:** natychmiast potwierdzić rotację hasła bazy, kluczy Search i poczty; sprawdzić logi użycia. Następnie zaplanować usunięcie sekretów z historii, uwzględniając kopie, forki i inne klony. Dodać skanowanie sekretów do CI.
- **Weryfikacja:** stare dane nie działają, nowe pochodzą z magazynu sekretów, skan pełnej historii nie znajduje aktywnych sekretów.

### SEC-02: Endpoint dodawania zdjęć przyjmuje pliki o dowolnym rozszerzeniu

- **Reguła:** bezpieczny upload / CWE-434.
- **Lokalizacja:** [UzytkownikController.cs:961](backend/TechPromo.Api/Controller/UzytkownikController.cs#L961), szczególnie linie 983, 998 i 1002; [SerwisModeracjiTresci.cs:339](backend/TechPromo.Api/Services/SerwisModeracjiTresci.cs#L339); [Program.cs:304](backend/TechPromo.Api/Program.cs#L304).
- **Dowód:** `UploadOfferImages` sprawdza tylko deklarowany przez klienta `ContentType.StartsWith("image/")` i rozmiar. `Path.GetExtension(file.FileName)` trafia do nazwy publicznego pliku bez allowlisty. Błąd API moderacji obrazu jest zwracany jako `Bezpieczny()`.
- **Skutek:** zalogowany właściciel oferty może przechowywać i udostępniać pliki HTML/SVG podszywające się pod obrazy. Brak łącznego limitu zdjęć pozwala też stopniowo zajmować dysk. Ograniczenie liczby plików podczas tworzenia oferty nie chroni tej osobnej ścieżki.
- **Warunek:** nie potwierdzono wykonania JavaScript ani kodu serwera. Produkcyjna CSP na API blokuje skrypty i ogranicza ryzyko XSS; w Development tej CSP nie ma. Udostępnienie aktywnego typu pliku pozostaje możliwe w analizowanym przepływie.
- **Naprawa:** wspólna walidacja wszystkich uploadów: allowlista jpg/jpeg/png/webp, odczyt i dekodowanie obrazu, kontrola wymiarów, ponowne kodowanie, losowe nazwy, limit całkowity na ofertę i użytkownika. Błąd AI nie może oznaczać poprawnego obrazu.
- **Weryfikacja:** plik `.html` z nagłówkiem `image/png`, SVG oraz niepoprawne bajty w `.png` są odrzucane także przy odpowiedzi Azure 400/429/500. Limit jest egzekwowany po wielu kolejnych uploadach.

### SEC-03: Logowanie omija blokadę konta i nie ogranicza prób

- **Reguła:** ochrona uwierzytelniania / CWE-307.
- **Lokalizacja:** [AccountController.cs:80](backend/TechPromo.Api/Controller/AccountController.cs#L80), linia 92; [Program.cs:101](backend/TechPromo.Api/Program.cs#L101).
- **Dowód:** `_userManager.CheckPasswordAsync(user, loginDto.Password)` jest bezpośrednio używane do wydania JWT. Brak `CheckPasswordSignInAsync(..., lockoutOnFailure: true)`, naliczania błędnych prób oraz widocznego w aplikacji rate limitera.
- **Skutek:** credential stuffing i zgadywanie haseł; nawet ustawienie lockoutu w Identity nie chroni tej ścieżki sprawdzania samego hasła.
- **Warunek:** WAF lub reverse proxy może ograniczać żądania; konfiguracji takiej ochrony nie ma w repozytorium i nie zbadano wdrożenia.
- **Naprawa:** korzystać z mechanizmu kontroli logowania Identity z lockoutem, zachowując JWT; limity per konto i per IP, bezpieczne jednakowe komunikaty oraz monitoring. Osobne limity rejestracji i resetowania hasła.
- **Weryfikacja:** zablokowane konto nie otrzymuje JWT mimo poprawnego hasła, błędne próby uruchamiają lockout, nadmiar żądań daje 429.
- **Źródło:** [Microsoft: konfiguracja Identity i lockout](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity-configuration).

### SEC-04: Zmiana adresu e-mail bez hasła i potwierdzenia własności

- **Reguła:** ponowne uwierzytelnianie przy zmianach konta / CWE-287.
- **Lokalizacja:** [AccountController.cs:192](backend/TechPromo.Api/Controller/AccountController.cs#L192), linie 205-208 i 219-228; rejestracja: linia 50.
- **Dowód:** `user.Email = dto.Email.Trim()` jest zapisywane przy użyciu samego JWT. Aktualne hasło jest wymagane tylko przy podaniu nowego hasła. Rejestracja ustawia `EmailConfirmed = true` bez weryfikacji skrzynki.
- **Skutek:** osoba z przejętym tokenem może zmienić adres odzyskiwania konta na własny i otrzymywać linki resetu. Użytkownicy mogą też przedstawiać cudzy adres jako potwierdzony.
- **Warunek:** wymaga ważnego tokenu ofiary; nie jest anonimowym przejęciem dowolnego konta.
- **Naprawa:** wymagać aktualnego hasła lub świeżego silnego uwierzytelnienia, używać potwierdzanej tokenem zmiany e-maila Identity, wysłać powiadomienie na poprzedni adres. Włączyć unikalność i walidację e-maili oraz prawdziwe potwierdzanie adresu.
- **Weryfikacja:** sam JWT nie pozwala zmienić adresu; nowy adres staje się adresem odzyskiwania dopiero po potwierdzeniu.

### SEC-05: JWT pozostają ważne po resecie hasła i odebraniu uprawnień

- **Reguła:** unieważnianie sesji / CWE-613.
- **Lokalizacja:** [JwtService.cs:46](backend/TechPromo.Api/Services/JwtService.cs#L46), linie 56 i 63; [Program.cs:140](backend/TechPromo.Api/Program.cs#L140); [AccountController.cs:228](backend/TechPromo.Api/Controller/AccountController.cs#L228), linia 340; [AdminController.cs:673](backend/TechPromo.Api/Controller/AdminController.cs#L673).
- **Dowód:** JWT zawiera role, ale nie wersję sesji/security stamp. Walidacja sprawdza podpis, issuer, audience i czas, bez sprawdzenia bieżącego stanu konta. Zmiana roli i reset hasła nie unieważniają tokenów. `PUT /konto/profil` generuje kolejny JWT także dla pustego DTO.
- **Skutek:** były administrator zachowuje rolę z tokenu do jego wygaśnięcia (domyślnie 60 minut). Przejęty token użytkownika może być odnawiany przez aktualizację profilu także po resecie hasła, o ile napastnik odnawia go przed wygaśnięciem.
- **Naprawa:** wersja sesji/security stamp sprawdzana przy walidacji JWT, zmieniana po resecie hasła, zmianie roli i unieważnieniu sesji. Kontrolowany mechanizm odnawiania z rotacją i odwoływaniem refresh tokenów zamiast odnawiania przez zapis profilu.
- **Weryfikacja:** stary JWT daje 401 po resecie hasła lub odebraniu roli; pusty zapis profilu nie przedłuża unieważnionej sesji.

### SEC-06: Anonimowy endpoint wywołuje płatną usługę moderacji

- **Reguła:** kontrola kosztownych operacji / CWE-400.
- **Lokalizacja:** [TestController.cs:28](backend/TechPromo.Api/Controllers/TestController.cs#L28), linia 36; [Program.cs:309](backend/TechPromo.Api/Program.cs#L309).
- **Dowód:** `POST /test/moderacja` nie ma `[Authorize]`, limitu tekstu w DTO ani ograniczenia do Development. Wywołuje `ModerujTekstAsync`, a kontrolery są mapowane również w Production.
- **Skutek:** anonimowy klient może zużywać quota Azure, generować koszty i powodować niedostępność moderacji dla normalnych operacji. W połączeniu z SEC-10 awaria usługi skutkuje przepuszczaniem treści.
- **Warunek:** wymaga konfiguracji Azure; zewnętrzny gateway może ograniczać dostęp, ale nie potwierdzono takiej konfiguracji.
- **Naprawa:** wyłączyć kontroler testowy w produkcji albo ograniczyć go do administratorów; walidować długość tekstu, dodać limity żądań i współbieżności.
- **Weryfikacja:** anonimowe żądanie w Production nie uruchamia wywołania Azure.

### SEC-07: Pakiety z opublikowanymi podatnościami

- **Reguła:** aktualizacja zależności / CWE-1104.
- **Lokalizacja:** [TechPromo.Api.csproj:10](backend/TechPromo.Api/TechPromo.Api.csproj#L10), linie 14-18; [frontend/package-lock.json:3913](frontend/package-lock.json#L3913), linia 4558. Rozwiązane zależności backendu: `backend/TechPromo.Api/obj/project.assets.json`, linie 585 i 1375 (plik generowany).
- **Dowód npm:** 31 pozycji; m.in. React Router / react-router-dom 7.6.2 oraz Vite 6.3.5. Zgłoszenia obejmują również narzędzia kompilacji, lintowania i zależności przechodnie.
- **Dowód NuGet:** AutoMapper 12.0.1: GHSA-rvv3-g6hj-g44x; Microsoft.Extensions.Caching.Memory 8.0.0: GHSA-qj66-m88j-hmgj; System.Text.Json 8.0.0: GHSA-hh2w-p6rv-4g7w i GHSA-8g4q-xg66-9fp4.
- **Skutek i ograniczenia:** znane problemy obejmują DoS oraz inne ryzyka zależne od użytych funkcji. Nie znaleziono wywołań AutoMapper w kodzie aplikacji. React Router jest używany jako SPA, więc zgłoszenia dotyczące SSR, server actions czy komponentu Meta nie oznaczają automatycznie podatności tego wdrożenia. Vite jest narzędziem developerskim; przykładowy problem odczytu HTML wymaga dostępnego dev/preview servera. Faktycznie ładowane biblioteki .NET zależą również od runtime i sposobu publikacji.
- **Naprawa:** usunąć nieużywany AutoMapper, zaktualizować spójnie pakiety Microsoft/.NET i zależności frontendowe do wersji bez zgłoszeń w ponownym audycie. Nie wykonywać ślepo `npm audit fix --force`. Serwerów Vite dev/preview nie używać jako publicznego hostingu produkcji.
- **Weryfikacja:** ponowny `npm audit`, NuGet audit, build i regresja logowania, routingu, JSON oraz uploadów; sprawdzić runtime i biblioteki rzeczywistego artefaktu produkcyjnego.
- **Źródła:** [AutoMapper](https://github.com/advisories/GHSA-rvv3-g6hj-g44x), [Caching.Memory](https://github.com/advisories/GHSA-qj66-m88j-hmgj), [System.Text.Json: CVE-2024-30105](https://github.com/advisories/GHSA-hh2w-p6rv-4g7w), [System.Text.Json: CVE-2024-43485](https://github.com/advisories/GHSA-8g4q-xg66-9fp4), [Vite: odczyt HTML](https://github.com/vitejs/vite/security/advisories/GHSA-jqfw-vq24-v9c3), [React Router: przekierowania](https://github.com/remix-run/react-router/security/advisories/GHSA-wrjc-x8rr-h8h6).

### SEC-08: Seed tworzy konta uprzywilejowane ze znanym hasłem

- **Reguła:** brak stałych danych logowania / CWE-798.
- **Lokalizacja:** [SeedData.cs:26](backend/TechPromo.Api/Data/SeedData.cs#L26), linia 27; [Program.cs:236](backend/TechPromo.Api/Program.cs#L236); `appsettings.Development.json`, sekcja `Startup`.
- **Dowód:** seed tworzy administratora i moderatora ze stałym, wspólnym hasłem zapisanym w źródłach. `Startup:SeedData` może włączyć go także w Production.
- **Skutek:** dostępna z sieci instalacja z takimi kontami może zostać przejęta przez osobę znającą kod. Wyłączenie seedowania nie usuwa istniejących kont ani nie zmienia ich haseł.
- **Warunek:** Production domyślnie wyłącza seed. Nie sprawdzono, czy konta już istnieją w produkcyjnej bazie; to ryzyko warunkowe, a nie potwierdzony dostęp administracyjny.
- **Naprawa:** oddzielić seed danych słownikowych od kont; demo konta wyłącznie w Development, bez współdzielonego stałego hasła. Konta produkcyjne tworzyć kontrolowaną procedurą; zmienić hasła lub usunąć konta demonstracyjne.
- **Weryfikacja:** włączony seed w Production nie tworzy demo kont; istniejące konta nie akceptują hasła ze źródeł.

## Średnia waga

### SEC-09: Publiczna lista ujawnia e-maile użytkowników

- **Reguła:** minimalizacja publicznych danych / CWE-200.
- **Lokalizacja:** [UzytkownicyController.cs:20](backend/TechPromo.Api/Controller/UzytkownicyController.cs#L20), linia 24.
- **Dowód:** anonimowy `GET /api/uzytkownicy` zwraca `new { u.Id, u.UserName, u.Email }` dla pierwszych 20 użytkowników. W klasie ani akcji nie ma autoryzacji; brak globalnej polityki wymagającej uwierzytelnienia.
- **Skutek:** pozyskanie danych osobowych, phishing i ułatwienie zgadywania haseł. Limit 20 ogranicza zakres, ale nie zabezpiecza danych.
- **Naprawa:** usunąć debug endpoint lub ograniczyć do Admin; publicznie zwracać wyłącznie dane przeznaczone do profilu, bez e-maila.
- **Weryfikacja:** anonimowa odpowiedź nie zawiera adresów e-mail.

### SEC-10: Moderację można ominąć, a błędy AI oznaczają akceptację

- **Reguła:** jednolite egzekwowanie polityki / CWE-636, CWE-841.
- **Lokalizacja:** [UzytkownikController.cs:650](backend/TechPromo.Api/Controller/UzytkownikController.cs#L650), linie 672-688; [SerwisModeracjiTresci.cs:230](backend/TechPromo.Api/Services/SerwisModeracjiTresci.cs#L230), linie 237, 302, 344 i 386. Porównanie: [OfertaController.cs:459](backend/TechPromo.Api/Controller/OfertaController.cs#L459).
- **Dowód:** `POST /api/uzytkownik/oferta/{id}/komentarz` zapisuje treść ze statusem `aktywny` bez wywołania moderacji, podczas gdy drugi endpoint komentarzy moderuje tekst. Serwis AI zwraca `Bezpieczny()` przy błędach API i wyjątkach. W `UpdateOwnOffer` zmodyfikowana encja może też zostać zapisana przez `SaveChangesAsync` podczas tworzenia kategorii lub tagów (linie 862 i 910), przed późniejszą moderacją tekstu.
- **Skutek:** użytkownik może publikować treści pomimo zasad moderacji. Nie oznacza to samo w sobie wykonania JavaScript; treść React jest standardowo escapowana. Błędy AI mogą prowadzić do automatycznego zatwierdzania ofert i obrazów.
- **Naprawa:** wspólny serwis zapisu/moderacji dla każdej ścieżki; wynik trójstanowy: dozwolone, zablokowane, błąd. Przy błędzie odroczyć publikację lub zwrócić kontrolowane 503. Moderować przed zmianami w bazie albo objąć operację transakcją.
- **Weryfikacja:** ten sam tekst jest jednakowo odrzucany na obu endpointach; Azure 429/500 nie powoduje publikacji; odrzucona edycja z nową kategorią lub tagiem nie zmienia zapisanej treści.

### SEC-11: Komentarze ukrytych ofert można odczytywać i dopisywać

- **Reguła:** autoryzacja obiektu / CWE-862.
- **Lokalizacja:** [OfertaController.cs:569](backend/TechPromo.Api/Controller/OfertaController.cs#L569), linia 580; [UzytkownikController.cs:650](backend/TechPromo.Api/Controller/UzytkownikController.cs#L650), linia 655. Poprawne ograniczenie szczegółów oferty: `OfertaController.cs`, linia 429.
- **Dowód:** publiczna lista komentarzy filtruje tylko po `IdOferta`, bez sprawdzenia widoczności oferty. Alternatywne dodawanie komentarza korzysta z `FindAsync(id)`, bez warunku zatwierdzenia, aktywności i dostępu do oferty.
- **Skutek:** anonimowa osoba może czytać istniejące komentarze oferty niedostępnej przez endpoint szczegółów; zalogowany użytkownik może komentować cudze ukryte/odrzucone oferty i generować powiadomienia.
- **Warunek:** oferta musi mieć komentarze; nie wykazano odczytu całej ukrytej oferty tą drogą.
- **Naprawa:** wspólna polityka widoczności i prawa komentowania; autor/moderator/admin mogą mieć osobny dozwolony podgląd.
- **Weryfikacja:** anonimowy i obcy użytkownik dostają 404/403 dla komentarzy ukrytej oferty, a dopisanie komentarza jest odrzucane.

### SEC-12: Bicep ujawnia klucze administratora w outputach

- **Reguła:** poufność sekretów infrastruktury / CWE-532.
- **Lokalizacja:** [ai-search.bicep:77](infra/ai-search.bicep#L77), linia 80.
- **Dowód:** zwykłe outputy `primaryKey` i `secondaryKey` wywołują `searchService.listAdminKeys()`, bez `@secure()`.
- **Skutek:** klucze zarządzania Search mogą być widoczne w wynikach/historii wdrożeń i logach narzędzi. Główny szablon nie wypisuje ich ponownie, ale moduł nadal deklaruje niezabezpieczone outputy.
- **Warunek:** wymaga dostępu do danych wdrożenia lub ich logów; nie oznacza anonimowego odczytu kluczy z API aplikacji.
- **Naprawa:** usunąć nieużywane outputy; preferować Managed Identity z minimalnym RBAC. Jeżeli przekazanie sekretu jest konieczne, użyć obsługiwanych secure outputs lub Key Vault. Sprawdzić istniejące logi i potrzebę rotacji.
- **Weryfikacja:** wynik wdrożenia nie pokazuje kluczy.
- **Źródła:** [Microsoft: sekrety w Bicep](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/scenarios-secrets), [Microsoft: secure outputs](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/outputs).

### SEC-13: Długotrwały token sesji jest dostępny dla JavaScript

- **Reguła:** REACT-AUTH / JS-STORAGE-001.
- **Lokalizacja:** [auth.ts:59](frontend/src/utils/auth.ts#L59); dodatkowo [api.ts:74](frontend/src/utils/api.ts#L74).
- **Dowód:** `localStorage.setItem('authToken', loginResponse.token)` przechowuje bearer token. Pomocniczy `apiPostFormData` loguje `getAuthHeaders()` do konsoli; nie znaleziono użycia tego helpera w komponentach, więc nie potwierdzono rzeczywistego logowania przez aktywny przepływ.
- **Skutek:** ewentualny XSS lub kompromitacja skryptu uruchomionego na originie aplikacji pozwala ukraść token. W połączeniu z SEC-04/05 konsekwencje są większe niż dostęp przez jedną godzinę.
- **Warunek:** nie potwierdzono działającego XSS w aktywnym frontendzie. Sam zapis w localStorage nie daje osobie z innej strony dostępu do tokenu.
- **Naprawa:** rozważyć BFF/sesję w ciasteczku HttpOnly/Secure z ochroną CSRF lub krótko żyjący token w pamięci i bezpieczne odnawianie. Usunąć logowanie Authorization. Sprawdzić CSP i pozostałe nagłówki odpowiedzi HTML na hostingu frontendu; nagłówki API nie chronią automatycznie osobnego originu SPA.
- **Weryfikacja:** żaden log nie zawiera tokenu, polityka sesji ogranicza jego kradzież i umożliwia unieważnienie.

## Niska waga

### SEC-14: Odpowiedzi API zawierają szczegóły wyjątków

- **Reguła:** bezpieczna obsługa błędów / CWE-209.
- **Lokalizacja:** [WyszukiwarkaController.cs:138](backend/TechPromo.Api/Controllers/WyszukiwarkaController.cs#L138), linia 218; [OfertaController.cs:866](backend/TechPromo.Api/Controller/OfertaController.cs#L866), linia 975.
- **Dowód:** publiczne wyszukiwanie zwraca `error = ex.Message`; endpoint inicjalizacji indeksu dodatkowo `stackTrace = ex.StackTrace`, lecz wymaga Admin.
- **Skutek:** błędy mogą ujawniać nazwy usług, indeksów, wewnętrzne ścieżki i szczegóły implementacji. Nie potwierdzono konkretnego wycieku sekretu z wyjątku.
- **Naprawa:** ogólne komunikaty i identyfikator zdarzenia dla klienta; szczegóły wyłącznie w chronionych logach, z redakcją danych wrażliwych.
- **Weryfikacja:** wymuszony błąd usługi nie zwraca message wyjątku ani stack trace.

## Wykonane sprawdzenia i ograniczenia

- Przegląd kodu uwierzytelniania, ról, dostępu do ofert, komentarzy, uploadów, wyszukiwania, konfiguracji i Bicep; kontrola aktywnego routingu React.
- Przeszukanie frontendu pod kątem `dangerouslySetInnerHTML`, DOM `innerHTML` i `eval`: nie znaleziono tych wzorców w przeszukanym kodzie aplikacji.
- Kontrola mechanizmów JWT: walidacja podpisu, issuer, audience i czasu jest włączona; nie wykazano możliwości sfałszowania JWT przez zmianę roli w localStorage.
- Kontrola istotnych operacji: endpointy konserwacji Search wymagają Admin, zmiana ról wymaga Admin, a badane operacje edycji/usuwania własnych zdjęć sprawdzają właściciela.
- `npm audit --json --ignore-scripts` uruchomiono w `frontend`. Początkowy odczyt był blokowany przez DNS sandboxa; ponowienie z dostępem sieciowym zwróciło 31 zgłoszeń. Wynik z katalogu głównego nie obejmuje zależności frontendu i nie jest miarodajnym audytem aplikacji.
- `dotnet list ... package --vulnerable --include-transitive` po ponowieniu zwrócił wskazane 3 pakiety. W output pozostawało ostrzeżenie NU1900 z restore, dlatego nie traktować listy jako gwarancji kompletności wszystkich aktualnych advisory. Wskazane advisory sprawdzono dodatkowo w publicznych źródłach.
- Sprawdzono poprzedni commit konfiguracji, bez wypisywania sekretów. Nie skanowano automatycznie całej historii wszystkich plików, branchy i zewnętrznych forków.
- Nie wykonano testów integracyjnych, kontrolowanych exploitów, testów wydajnościowych ani pomiarów nagłówków produkcyjnych. Wnioski o przepływach kodu są statyczne; wymagają wskazanych testów regresji po naprawach.
- Skill `security-best-practices` ma wskazówki React/JavaScript, ale nie zawiera osobnego przewodnika C#/ASP.NET Core. Backend sprawdzono przez analizę kodu i dokumentację Microsoft.
- Nie sprawdzono bieżących ustawień Azure, proxy/WAF, rotacji danych dostępowych, produkcyjnego runtime, uprawnień bazy ani kopii zapasowych. Publiczna sieć Azure Search wymaga poprawnego uwierzytelniania i sama nie dowodzi nieautoryzowanego dostępu.

## Kolejność napraw

1. Potwierdzić rotację historycznych danych dostępowych i stan kont demo (SEC-01, SEC-08).
2. Zamknąć publiczne endpointy debug/test, ujednolicić uploady i ograniczyć nadużycia logowania (SEC-02, SEC-03, SEC-06, SEC-09).
3. Naprawić zmianę e-maila, unieważnianie i odnawianie sesji (SEC-04, SEC-05).
4. Zaktualizować zależności i zweryfikować rzeczywisty artefakt produkcyjny (SEC-07).
5. Ujednolicić moderację i widoczność komentarzy, usunąć outputy sekretów oraz poprawić przechowywanie sesji i obsługę błędów (SEC-10 do SEC-14).

Naprawy należy potwierdzać testami z użytkownikiem anonimowym, właścicielem, obcym użytkownikiem, moderatorem i administratorem oraz scenariuszami awarii usług Azure.
