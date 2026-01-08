using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using TechPromo.Api.Data;
using TechPromo.Api.DTO;
using TechPromo.Api.Model;
using TechPromo.Api.Services;
using TechPromo.Api.Search.Services;

namespace TechPromo.Api.Controllers
{
    // Kontroler administratora
    [ApiController]
    [Route("admin")]
    [Route("api/admin")]
    [Authorize(Roles = "Admin,Moderator")]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<Uzytkownik> _userManager;
        private readonly TechPromoDbContext _context;
        private readonly IBadgeService _badgeService;
        private readonly SerwisSync? _syncService;
        private readonly ILogger<AdminController> _logger;

    public AdminController(
        UserManager<Uzytkownik> userManager, 
        TechPromoDbContext context, 
        IBadgeService badgeService,
        ILogger<AdminController> logger,
        SerwisSync? syncService = null)
        {
            _userManager = userManager;
            _context = context;
            _badgeService = badgeService;
            _syncService = syncService;
            _logger = logger;
        }

        // Przelicz odznaki użytkownika
        [HttpPost("odznaki/przelicz/{id}")]
        public async Task<IActionResult> PrzeliczOdznakiUzytkownika(int id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
                return NotFound("Nie znaleziono użytkownika");

            await _badgeService.EvaluateForUserAsync(id);
            return Ok($"Odznaki użytkownika '{user.UserName}' zostały przeliczone.");
        }

        [HttpPost("odznaki/przelicz-wszystkich")]
        public async Task<IActionResult> PrzeliczOdznakiWszystkim()
        {
            var ids = await _context.Users.Select(u => u.Id).ToListAsync();
            foreach (var id in ids)
            {
                await _badgeService.EvaluateForUserAsync(id);
            }
            return Ok(new { przeliczono = ids.Count });
        }

        /// <summary>
        /// Przelicza punkty dla wszystkich użytkowników na podstawie ich aktywności:
        /// - 10 punktów za każdą opublikowaną ofertę
        /// - 2 punkty za każdy komentarz
        /// - 1 punkt za każdy oddany głos
        /// - 50 punktów za każdą posiadaną odznakę
        /// </summary>
        [HttpPost("punkty/przelicz-wszystkich")]
        public async Task<IActionResult> PrzeliczPunktyWszystkim()
        {
            var users = await _context.Users.ToListAsync();
            var wyniki = new List<object>();

            foreach (var user in users)
            {
                // Zlicz oferty użytkownika (aktywne/opublikowane)
                var ofertyCount = await _context.Oferty
                    .CountAsync(o => o.IdUzytkownik == user.Id && (o.Status == "opublikowana" || o.Status == "aktywny"));

                // Zlicz komentarze użytkownika
                var komentarzeCount = await _context.Komentarze
                    .CountAsync(k => k.IdUzytkownik == user.Id);

                // Zlicz oddane głosy
                var glosyCount = await _context.Glosy
                    .CountAsync(g => g.IdUzytkownik == user.Id);

                // Zlicz posiadane odznaki
                var odznakiCount = await _context.UzytkownikOdznaki
                    .CountAsync(uo => uo.IdUzytkownik == user.Id);

                // Oblicz punkty: 10 za ofertę, 2 za komentarz, 1 za głos, 50 za odznakę
                var starePunkty = user.Punkty;
                var nowePunkty = (ofertyCount * 10) + (komentarzeCount * 2) + (glosyCount * 1) + (odznakiCount * 50);
                
                user.Punkty = nowePunkty;

                wyniki.Add(new
                {
                    userId = user.Id,
                    userName = user.UserName,
                    starePunkty,
                    nowePunkty,
                    oferty = ofertyCount,
                    komentarze = komentarzeCount,
                    glosy = glosyCount,
                    odznaki = odznakiCount
                });
            }

            await _context.SaveChangesAsync();

            return Ok(new { 
                przeliczono = users.Count,
                wyniki 
            });
        }

        [HttpGet("odznaki")]
        public async Task<IActionResult> PobierzWszystkieOdznaki()
        {
            var odznaki = await _context.Odznaki
                .Select(o => new OdznakaDto
                {
                    idOdznaka = o.IdOdznaka,
                    nazwa = o.Nazwa,
                    opis = o.Opis ?? string.Empty,
                    ikona = o.Ikona ?? string.Empty,
                    dataPrzyznania = "" // Nie dotyczy - to lista wszystkich odznak
                })
                .ToListAsync();

            return Ok(odznaki);
        }

        [HttpGet("uzytkownik/{id}/odznaki")]
        public async Task<IActionResult> PobierzOdznakiUzytkownika(int id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
                return NotFound("Nie znaleziono użytkownika");

            var uzytkownikOdznaki = await _context.UzytkownikOdznaki
                .Include(uo => uo.Odznaka)
                .Where(uo => uo.IdUzytkownik == id)
                .ToListAsync();

            var odznakaList = uzytkownikOdznaki.Select(uo => new OdznakaDto
            {
                idOdznaka = uo.Odznaka.IdOdznaka,
                nazwa = uo.Odznaka.Nazwa,
                opis = uo.Odznaka.Opis ?? string.Empty,
                ikona = uo.Odznaka.Ikona ?? string.Empty,
                dataPrzyznania = uo.DataPrzyznania.ToString("yyyy-MM-dd")
            }).ToList();

            return Ok(new { 
                uzytkownik = user.UserName,
                odznaki = odznakaList 
            });
        }

        [HttpGet("uzytkownicy")]
        [Authorize(Roles = "Admin")] // Tylko Admin może przeglądać wszystkich użytkowników
        public async Task<IActionResult> PobierzWszystkichUzytkownikow()
        {
            var uzytkownicy = await _context.Users.ToListAsync();
            var uzytkownicyZRolami = new List<object>();

            foreach (var uzytkownik in uzytkownicy)
            {
                var role = await _userManager.GetRolesAsync(uzytkownik);
                uzytkownicyZRolami.Add(new {
                    id = uzytkownik.Id,
                    nick = uzytkownik.UserName,
                    email = uzytkownik.Email,
                    punkty = uzytkownik.Punkty,
                    dataRejestracji = uzytkownik.DataRejestracji.ToString("yyyy-MM-dd"),
                    emailConfirmed = uzytkownik.EmailConfirmed,
                    rola = role.FirstOrDefault() ?? "Brak"
                });
            }

            return Ok(uzytkownicyZRolami);
        }

        [HttpPost("utworz-odznake")]
        public async Task<IActionResult> UtworzOdznake([FromBody] UtworzOdznakaDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var odznaka = new Odznaka
            {
                Nazwa = dto.Nazwa,
                Opis = dto.Opis,
                Ikona = dto.Ikona
            };

            _context.Odznaki.Add(odznaka);
            await _context.SaveChangesAsync();

            return Ok($"Odznaka '{odznaka.Nazwa}' została utworzona z ID: {odznaka.IdOdznaka}");
        }

        [HttpDelete("odznaka/{id}")]
        public async Task<IActionResult> UsunOdznake(int id)
        {
            var odznaka = await _context.Odznaki.FindAsync(id);
            if (odznaka == null)
                return NotFound("Nie znaleziono odznaki");

            
            var uzytkownikOdznaki = await _context.UzytkownikOdznaki
                .Where(uo => uo.IdOdznaka == id)
                .ToListAsync();

            _context.UzytkownikOdznaki.RemoveRange(uzytkownikOdznaki);
            _context.Odznaki.Remove(odznaka);
            await _context.SaveChangesAsync();

            return Ok($"Odznaka '{odznaka.Nazwa}' została usunięta");
        }

        [HttpPut("uzytkownik/{id}/punkty")]
        [Authorize(Roles = "Admin")] // Tylko Admin może zmieniać punkty użytkowników
        public async Task<IActionResult> AktualizujPunktyUzytkownika(int id, [FromBody] AktualizujPunktyDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
                return NotFound("Nie znaleziono użytkownika");

            user.Punkty = dto.NowePunkty;
            await _userManager.UpdateAsync(user);

            return Ok($"Punkty użytkownika '{user.UserName}' zostały zaktualizowane na {dto.NowePunkty}");
        }

        // === PRZEGLĄDANIE ZGŁOSZEŃ ===
        [HttpGet("zgloszenia")]
        public async Task<IActionResult> PobierzWszystkieZgloszenia()
        {
            // Pobierz wszystkie zgłoszenia użytkowników (oferty, komentarze, etc.)
            var zgloszenia = await _context.Powiadomienia
                
                .Where(p => p.Typ == "Zgłoszenie" || p.Typ == "Zgloszenie") // Tylko zgłoszenia
                .Include(p => p.Uzytkownik)
                .Include(p => p.Oferta)
                .Include(p => p.Komentarz)
                .OrderByDescending(p => p.DataUtworzenia)
                .Select(p => new {
                    id = p.IdPowiadomienie,
                    tresc = p.Tresc,
                    dataZgloszenia = p.DataUtworzenia.ToString("yyyy-MM-dd HH:mm"),
                    zgloszonePrzez = p.Uzytkownik.UserName,
                    oferta = p.Oferta != null ? p.Oferta.Nazwa : null,
                    idOferta = p.IdOferta,
                    idKomentarz = p.IdKomentarz,
                    komentarzFragment = p.Komentarz != null ? p.Komentarz.Tresc.Substring(0, Math.Min(120, p.Komentarz.Tresc.Length)) : null,
                    typ = p.Typ
                })
                .ToListAsync();

            return Ok(zgloszenia);
        }

        // === ZATWIERDZANIE/ODRZUCANIE ZGŁOSZEŃ ===
        [HttpPut("zgloszenie/{id}/zatwierdz")]
        public async Task<IActionResult> ZatwierdzZgloszenie(int id)
        {
            var zgloszenie = await _context.Powiadomienia.FindAsync(id);
            if (zgloszenie == null)
                return NotFound("Nie znaleziono zgłoszenia");

            // Usuń zgłoszenie jako zatwierdzone
            _context.Powiadomienia.Remove(zgloszenie);
            await _context.SaveChangesAsync();

            return Ok($"Zgłoszenie zostało zatwierdzone i usunięte");
        }

        [HttpDelete("zgloszenie/{id}/odrzuc")]
        public async Task<IActionResult> OdrzucZgloszenie(int id)
        {
            var zgloszenie = await _context.Powiadomienia.FindAsync(id);
            if (zgloszenie == null)
                return NotFound("Nie znaleziono zgłoszenia");

            // Usuń zgłoszenie jako odrzucone
            _context.Powiadomienia.Remove(zgloszenie);
            await _context.SaveChangesAsync();

            return Ok($"Zgłoszenie zostało odrzucone i usunięte");
        }

        // === MODERACJA KOMENTARZY ===
        [HttpGet("komentarze")]
        public async Task<IActionResult> PobierzWszystkieKomentarze()
        {
            var komentarze = await _context.Komentarze
                .Include(k => k.Uzytkownik)
                .Include(k => k.Oferta)
                .OrderByDescending(k => k.DataDodania) // Prawidłowa nazwa właściwości
                .Select(k => new {
                    id = k.IdKomentarz,
                    tresc = k.Tresc,
                    autor = k.Uzytkownik != null ? k.Uzytkownik.UserName : string.Empty,
                    oferta = k.Oferta != null ? k.Oferta.Nazwa : string.Empty,
                    dataUtworzenia = k.DataDodania.ToString("yyyy-MM-dd HH:mm"),
                    idOferty = k.IdOferta,
                    status = k.Status
                })
                .ToListAsync();

            return Ok(komentarze);
        }

        [HttpDelete("komentarz/{id}")]
        public async Task<IActionResult> UsunKomentarz(int id)
        {
            var komentarz = await _context.Komentarze
                .Include(k => k.Uzytkownik)
                .FirstOrDefaultAsync(k => k.IdKomentarz == id);

            if (komentarz == null)
                return NotFound("Nie znaleziono komentarza");

            _context.Komentarze.Remove(komentarz);
            await _context.SaveChangesAsync();

            return Ok($"Komentarz użytkownika '{komentarz.Uzytkownik?.UserName}' został usunięty");
        }

        // === MODERACJA OFERT ===
        [HttpGet("oferty")]
        public async Task<IActionResult> PobierzWszystkieOferty()
        {
        var oferty = await _context.Oferty
                .Include(o => o.Uzytkownik)
                .Include(o => o.Kategoria)
                .OrderByDescending(o => o.DataDodania)
                .Select(o => new {
                    id = o.IdOferta,
                    idOferta = o.IdOferta, // Dodane dla zgodności z ModeratorController
                    tytul = o.Nazwa,
                    opis = o.Opis,
                    autor = o.Uzytkownik.UserName ?? "Nieznany",
                    kategoria = o.Kategoria != null ? o.Kategoria.Nazwa ?? "Brak" : "Brak",
                    dataUtworzenia = o.DataDodania.ToString("yyyy-MM-dd HH:mm"),
                    dataDodania = o.DataDodania.ToString("yyyy-MM-dd HH:mm"), // Dodane dla zgodności
                    status = o.Status,
                    aktywna = o.Aktywna, // Dodane pole z ModeratorController
                    zatwierdzona = o.Zatwierdzona, // Dodane pole z ModeratorController
                    cena = o.Cena,
            cenaPoprzednia = o.CenaPoprzednia,
                    link = o.Link
            ,typ = o.Typ
                })
                .ToListAsync();

            return Ok(oferty);
        }

        [HttpPut("oferta/{id}/zatwierdz")]
        public async Task<IActionResult> ZatwierdzOferte(int id)
        {
            var oferta = await _context.Oferty.FindAsync(id);
            if (oferta == null)
                return NotFound("Nie znaleziono oferty");

            // Zatwierdź i aktywuj ofertę - używaj tych samych pól co ModeratorController
            oferta.Zatwierdzona = true;
            oferta.Aktywna = true;
            oferta.Status = "aktywny"; // Dodatkowo ustaw status dla zgodności
            await _context.SaveChangesAsync();

            // Synchronizuj z Azure Search
            if (_syncService != null)
            {
                var syncResult = await _syncService.SynchronizujOferteAsync(id);
                if (syncResult)
                {
                    _logger.LogInformation("Oferta {OfertaId} zsynchronizowana z Azure Search podczas zatwierdzania przez admina", id);
                }
                else
                {
                    _logger.LogWarning("UWAGA: Synchronizacja oferty {OfertaId} z Azure Search nie powiodła się!", id);
                }
            }
            else
            {
                _logger.LogWarning("SerwisSync jest null - oferta {OfertaId} nie została zsynchronizowana z Azure Search", id);
            }

            // Automatycznie przelicz odznaki po zatwierdzeniu oferty
            await _badgeService.EvaluateForUserAsync(oferta.IdUzytkownik);

            return Ok($"Oferta '{oferta.Nazwa}' została zatwierdzona i aktywowana");
        }

        [HttpPut("oferta/{id}/odrzuc")]
        public async Task<IActionResult> OdrzucOferte(int id, [FromBody] OdrzucenieDto odrzucenieDto)
        {
            try
            {
                var oferta = await _context.Oferty.FindAsync(id);
                if (oferta == null)
                    return NotFound(new { message = "Oferta nie została znaleziona" });

                // Odrzuć ofertę - zgodnie z ModeratorController
                oferta.Zatwierdzona = false;
                oferta.Aktywna = false;
                oferta.Status = "odrzucony";
                await _context.SaveChangesAsync();

                // Usuń z Azure Search Index (odrzucone oferty nie powinny być wyszukiwalne)
                if (_syncService != null)
                {
                    var syncResult = await _syncService.UsunOferteZIndeksuAsync(id);
                    if (syncResult)
                    {
                        _logger.LogInformation("Odrzucona oferta {OfertaId} usunięta z Azure Search", id);
                    }
                    else
                    {
                        _logger.LogWarning("UWAGA: Usunięcie odrzuconej oferty {OfertaId} z Azure Search nie powiodło się!", id);
                    }
                }

                return Ok(new { message = "Oferta została odrzucona" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Błąd podczas odrzucania oferty", error = ex.Message });
            }
        }

        [HttpDelete("oferta/{id}")]
        public async Task<IActionResult> UsunOferte(int id)
        {
            var oferta = await _context.Oferty
                .Include(o => o.Uzytkownik)
                .FirstOrDefaultAsync(o => o.IdOferta == id);

            if (oferta == null)
                return NotFound("Nie znaleziono oferty");

            // Usuń powiązane komentarze
            var komentarze = await _context.Komentarze
                .Where(k => k.IdOferta == id)
                .ToListAsync();
            _context.Komentarze.RemoveRange(komentarze);

            // Usuń ofertę
            _context.Oferty.Remove(oferta);
            await _context.SaveChangesAsync();

            // Usuń z Azure Search Index
            if (_syncService != null)
            {
                _ = Task.Run(async () => await _syncService.UsunOferteZIndeksuAsync(id));
            }

            return Ok($"Oferta '{oferta.Nazwa}' użytkownika '{oferta.Uzytkownik.UserName}' została usunięta");
        }

        [HttpPut("oferta/{id}")]
        [Authorize(Roles = "Admin,Moderator")] // Pozwól też moderatorom edytować
        public async Task<IActionResult> AktualizujOferte(int id, [FromBody] UpdateOfertaDto dto)
        {
            try
            {
                var oferta = await _context.Oferty.FirstOrDefaultAsync(o => o.IdOferta == id);
                if (oferta == null)
                    return NotFound(new { message = "Nie znaleziono oferty" });

                bool changed = false;

                if (dto.Tytul != null && dto.Tytul != oferta.Nazwa)
                {
                    if (dto.Tytul.Length > 100) return BadRequest(new { message = "Tytuł max 100 znaków" });
                    oferta.Nazwa = dto.Tytul.Trim();
                    changed = true;
                }
                if (dto.Opis != null && dto.Opis != oferta.Opis)
                {
                    oferta.Opis = dto.Opis.Trim();
                    changed = true;
                }
                if (dto.Cena.HasValue && dto.Cena.Value != oferta.Cena)
                {
                    if (dto.Cena < 0) return BadRequest(new { message = "Cena nie może być ujemna" });
                    oferta.Cena = decimal.Round(dto.Cena.Value, 2);
                    changed = true;
                }
                if (dto.CenaPoprzednia.HasValue && dto.CenaPoprzednia.Value != oferta.CenaPoprzednia)
                {
                    if (dto.CenaPoprzednia < 0) return BadRequest(new { message = "Cena poprzednia nie może być ujemna" });
                    oferta.CenaPoprzednia = decimal.Round(dto.CenaPoprzednia.Value, 2);
                    changed = true;
                }
                if (dto.Kod != null && dto.Kod != oferta.Kod)
                {
                    if (dto.Kod.Length > 50) return BadRequest(new { message = "Kod max 50 znaków" });
                    oferta.Kod = dto.Kod.Trim();
                    changed = true;
                }
                if (dto.Link != null && dto.Link != oferta.Link)
                {
                    oferta.Link = dto.Link.Trim();
                    changed = true;
                }
                if (dto.Aktywna.HasValue && dto.Aktywna.Value != oferta.Aktywna)
                {
                    oferta.Aktywna = dto.Aktywna.Value;
                    changed = true;
                }
                if (dto.Zatwierdzona.HasValue && dto.Zatwierdzona.Value != oferta.Zatwierdzona)
                {
                    oferta.Zatwierdzona = dto.Zatwierdzona.Value;
                    // Gdy zatwierdzamy – automatycznie aktywuj
                    if (oferta.Zatwierdzona) oferta.Aktywna = true;
                    changed = true;
                }
                if (dto.WaznoscOd.HasValue && dto.WaznoscOd.Value != oferta.WaznoscOd)
                {
                    oferta.WaznoscOd = dto.WaznoscOd.Value;
                    changed = true;
                }
                if (dto.WaznoscDo.HasValue && dto.WaznoscDo.Value != oferta.WaznoscDo)
                {
                    oferta.WaznoscDo = dto.WaznoscDo.Value;
                    changed = true;
                }

                if (!changed)
                    return Ok(new { message = "Brak zmian", oferta = new { oferta.IdOferta } });

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Oferta zaktualizowana",
                    oferta = new
                    {
                        id = oferta.IdOferta,
                        tytul = oferta.Nazwa,
                        opis = oferta.Opis,
                        cena = oferta.Cena,
                        cenaPoprzednia = oferta.CenaPoprzednia,
                        kod = oferta.Kod,
                        link = oferta.Link,
                        aktywna = oferta.Aktywna,
                        zatwierdzona = oferta.Zatwierdzona,
                        waznoscOd = oferta.WaznoscOd,
                        waznoscDo = oferta.WaznoscDo
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Błąd podczas aktualizacji oferty", error = ex.Message });
            }
        }

        [HttpPut("oferta/{id}/moderuj")]
        public async Task<IActionResult> ModerujOferte(int id, [FromBody] ModerujOfertaDto dto)
        {
            var oferta = await _context.Oferty.FindAsync(id);
            if (oferta == null)
                return NotFound("Nie znaleziono oferty");

            // Zaktualizuj status oferty
            oferta.Status = dto.Aktywna ? "aktywny" : "nieaktywny";
            
            // Jeśli admin edytuje treść
            if (!string.IsNullOrEmpty(dto.NowyTytul))
                oferta.Nazwa = dto.NowyTytul;
            
            if (!string.IsNullOrEmpty(dto.NowyOpis))
                oferta.Opis = dto.NowyOpis;

            await _context.SaveChangesAsync();

            return Ok($"Oferta '{oferta.Nazwa}' została zmoderowana");
        }

    // Usunięto duplikat endpointu EdytujOferte - używaj AktualizujOferte

        [HttpPut("uzytkownik/{id}/rola")]
        [Authorize(Roles = "Admin")] // Tylko Admin może zmieniać role użytkowników
        public async Task<IActionResult> ZmienRoleUzytkownika(int id, [FromBody] ZmienRoleDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var uzytkownik = await _userManager.FindByIdAsync(id.ToString());
                if (uzytkownik == null)
                    return NotFound("Nie znaleziono użytkownika");

                // Sprawdź czy nowa rola jest poprawna
                var dostepneRole = new[] { "Admin", "Moderator", "Uzytkownik" };
                if (!dostepneRole.Contains(dto.NowaRola))
                    return BadRequest("Nieprawidłowa rola. Dostępne role: Admin, Moderator, Uzytkownik");

                // Pobierz obecną rolę
                var obecneRole = await _userManager.GetRolesAsync(uzytkownik);
                var obecnaRola = obecneRole.FirstOrDefault();
                
                // Sprawdź czy użytkownik już ma wymaganą rolę
                if (obecnaRola == dto.NowaRola)
                    return Ok($"Użytkownik '{uzytkownik.UserName}' już ma rolę '{dto.NowaRola}'");

                // Usuń starą rolę tylko jeśli istnieje
                if (!string.IsNullOrEmpty(obecnaRola))
                {
                    var usunResult = await _userManager.RemoveFromRoleAsync(uzytkownik, obecnaRola);
                    if (!usunResult.Succeeded)
                        return BadRequest($"Błąd podczas usuwania starej roli '{obecnaRola}'");
                }

                // Dodaj nową rolę
                var dodajResult = await _userManager.AddToRoleAsync(uzytkownik, dto.NowaRola);
                if (!dodajResult.Succeeded)
                    return BadRequest("Błąd podczas dodawania nowej roli");

                return Ok($"Rola użytkownika '{uzytkownik.UserName}' została zmieniona z '{obecnaRola ?? "Brak"}' na '{dto.NowaRola}'");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Błąd serwera: {ex.Message}");
            }
        }

        [HttpGet("role")]
        public IActionResult PobierzDostepneRole()
        {
            var role = new[] { "Admin", "Moderator", "Uzytkownik" };
            return Ok(role);
        }

        // Synchronizuj wszystkie aktywne oferty z Azure Search
        [HttpPost("sync/azure-search")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SynchronizujAzureSearch()
        {
            try
            {
                if (_syncService == null)
                {
                    return BadRequest(new { message = "Azure Search nie jest skonfigurowany" });
                }

                var aktywnOferty = await _context.Oferty
                    .Where(o => o.Aktywna && o.Zatwierdzona)
                    .Select(o => o.IdOferta)
                    .ToListAsync();

                int sukces = 0;
                int blad = 0;

                foreach (var ofertaId in aktywnOferty)
                {
                    var result = await _syncService.SynchronizujOferteAsync(ofertaId);
                    if (result)
                        sukces++;
                    else
                        blad++;
                }

                return Ok(new 
                { 
                    message = "Synchronizacja zakończona",
                    zsynchronizowane = sukces,
                    bledy = blad,
                    lacznie = aktywnOferty.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Błąd podczas synchronizacji", error = ex.Message });
            }
        }

        // Synchronizuj pojedynczą ofertę
        [HttpPost("sync/azure-search/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SynchronizujOferte(int id)
        {
            try
            {
                if (_syncService == null)
                {
                    return BadRequest(new { message = "Azure Search nie jest skonfigurowany" });
                }

                var result = await _syncService.SynchronizujOferteAsync(id);
                
                if (result)
                {
                    return Ok(new { message = $"Oferta {id} zsynchronizowana z Azure Search" });
                }
                else
                {
                    return StatusCode(500, new { message = $"Nie udało się zsynchronizować oferty {id}" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Błąd podczas synchronizacji", error = ex.Message });
            }
        }
    }
}
