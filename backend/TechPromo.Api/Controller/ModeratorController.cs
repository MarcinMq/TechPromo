using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Data;
using TechPromo.Api.Model;
using TechPromo.Api.DTO;

namespace TechPromo.Api.Controllers
{
    [ApiController]
    [Route("moderator")]
    [Authorize(Roles = "Moderator,Admin")] // Moderator i Admin mają dostęp
    public class ModeratorController : ControllerBase
    {
        private readonly TechPromoDbContext _context;
        private readonly UserManager<Uzytkownik> _userManager;

        public ModeratorController(TechPromoDbContext context, UserManager<Uzytkownik> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        #region Moderacja komentarzy

        [HttpGet("komentarze")]
        public async Task<IActionResult> PobierzKomentarze()
        {
            try
            {
                var komentarze = await _context.Komentarze
                    .Include(k => k.Uzytkownik)
                    .Include(k => k.Oferta)
                    .OrderByDescending(k => k.DataDodania)
                    .Select(k => new
                    {
                        idKomentarz = k.IdKomentarz,
                        tresc = k.Tresc,
                        dataDodania = k.DataDodania.ToString("yyyy-MM-dd HH:mm"),
                        autor = k.Uzytkownik != null ? (k.Uzytkownik.UserName ?? "Nieznany") : "Nieznany",
                        ofertaTytul = k.Oferta != null ? (k.Oferta.Nazwa ?? "Brak") : "Brak",
                        zgloszen = _context.Powiadomienia.Count(p => p.Tresc.Contains(k.IdKomentarz.ToString()) && p.Typ == "Zgłoszenie")
                    })
                    .ToListAsync();

                return Ok(komentarze);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Błąd podczas pobierania komentarzy", error = ex.Message });
            }
        }

        [HttpDelete("komentarz/{id}")]
        public async Task<IActionResult> UsunKomentarz(int id)
        {
            try
            {
                var komentarz = await _context.Komentarze.FindAsync(id);
                if (komentarz == null)
                    return NotFound(new { message = "Komentarz nie został znaleziony" });

                // Usuń powiązane powiadomienia (zgłoszenia, ostrzeżenia, itd.) odnoszące się do tego komentarza
                var powiadomieniaKomentarza = await _context.Powiadomienia
                    .Where(p => p.IdKomentarz == id)
                    .ToListAsync();
                if (powiadomieniaKomentarza.Count > 0)
                {
                    _context.Powiadomienia.RemoveRange(powiadomieniaKomentarza);
                }

                _context.Komentarze.Remove(komentarz);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Komentarz został usunięty" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Błąd podczas usuwania komentarza", error = ex.Message });
            }
        }

        [HttpPost("komentarz/{id}/ostrzez")]
        public async Task<IActionResult> OstrzezUzytkownika(int id, [FromBody] OstrzezenieDto ostrzezenieDto)
        {
            try
            {
                var komentarz = await _context.Komentarze
                    .Include(k => k.Uzytkownik)
                    .FirstOrDefaultAsync(k => k.IdKomentarz == id);

                if (komentarz == null)
                    return NotFound(new { message = "Komentarz nie został znaleziony" });

                var moderator = await _userManager.GetUserAsync(User);
                if (moderator == null)
                    return Unauthorized(new { message = "Nie znaleziono moderatora" });

                // Tworzę powiadomienie z ostrzeżeniem
                var powiadomienie = new Powiadomienie
                {
                    IdUzytkownik = komentarz.IdUzytkownik,
                    Typ = "Ostrzeżenie",
                    Tresc = $"Moderator {moderator.UserName} ostrzegł Cię za komentarz: \"{komentarz.Tresc}\". Powód: {ostrzezenieDto.Powod}",
                    DataUtworzenia = DateTime.UtcNow
                };

                _context.Powiadomienia.Add(powiadomienie);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Ostrzeżenie zostało wysłane do użytkownika" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Błąd podczas wysyłania ostrzeżenia", error = ex.Message });
            }
        }

        #endregion

        #region Moderacja ofert

        [HttpGet("oferty")]
        public async Task<IActionResult> PobierzOferty()
        {
            try
            {
                var oferty = await _context.Oferty
                    .Include(o => o.Uzytkownik)
                    .Include(o => o.Kategoria)
                    .OrderByDescending(o => o.DataDodania)
                    .Select(o => new
                    {
                        idOferta = o.IdOferta,
                        tytul = o.Nazwa,
                        opis = o.Opis,
                        cena = o.Cena,
                        dataDodania = o.DataDodania.ToString("yyyy-MM-dd HH:mm"),
                        autor = o.Uzytkownik.UserName ?? "Nieznany",
                        kategoria = o.Kategoria != null ? (o.Kategoria.Nazwa ?? "Brak") : "Brak",
                        aktywna = o.Aktywna,
                        zatwierdzona = o.Zatwierdzona
                    })
                    .ToListAsync();

                return Ok(oferty);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Błąd podczas pobierania ofert", error = ex.Message });
            }
        }

        [HttpPut("oferta/{id}/zatwierdz")]
        public async Task<IActionResult> ZatwierdzOferte(int id)
        {
            try
            {
                var oferta = await _context.Oferty.FindAsync(id);
                if (oferta == null)
                    return NotFound(new { message = "Oferta nie została znaleziona" });

                oferta.Zatwierdzona = true;
                oferta.Aktywna = true;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Oferta została zatwierdzona i aktywowana" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Błąd podczas zatwierdzania oferty", error = ex.Message });
            }
        }

        [HttpPut("oferta/{id}/odrzuc")]
        public async Task<IActionResult> OdrzucOferte(int id, [FromBody] OdrzucenieDto odrzucenieDto)
        {
            try
            {
                var oferta = await _context.Oferty
                    .Include(o => o.Uzytkownik)
                    .FirstOrDefaultAsync(o => o.IdOferta == id);

                if (oferta == null)
                    return NotFound(new { message = "Oferta nie została znaleziona" });

                oferta.Zatwierdzona = false;
                oferta.Aktywna = false;

                var moderator = await _userManager.GetUserAsync(User);
                if (moderator == null)
                    return Unauthorized(new { message = "Nie znaleziono moderatora" });

                // Powiadomienie do autora oferty
                var powiadomienie = new Powiadomienie
                {
                    IdUzytkownik = oferta.IdUzytkownik,
                    Typ = "Odrzucenie",
                    Tresc = $"Moderator {moderator.UserName} odrzucił Twoją ofertę \"{oferta.Nazwa}\". Powód: {odrzucenieDto.Powod}",
                    DataUtworzenia = DateTime.UtcNow,
                    Przeczytane = false
                };

                _context.Powiadomienia.Add(powiadomienie);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Oferta została odrzucona, autor został powiadomiony" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Błąd podczas odrzucania oferty", error = ex.Message });
            }
        }

        [HttpPut("oferta/{id}/edytuj")]
        public async Task<IActionResult> EdytujOferte(int id, [FromBody] EdycjaOfertaDto edycjaDto)
        {
            try
            {
                var oferta = await _context.Oferty
                    .Include(o => o.Uzytkownik)
                    .FirstOrDefaultAsync(o => o.IdOferta == id);

                if (oferta == null)
                    return NotFound(new { message = "Oferta nie została znaleziona" });

                // Zapisuję oryginalne wartości
                var oryginalnyTytul = oferta.Nazwa;
                var oryginalnyOpis = oferta.Opis;

                // Aktualizuję dane
                if (!string.IsNullOrEmpty(edycjaDto.NowyTytul))
                    oferta.Nazwa = edycjaDto.NowyTytul;

                if (!string.IsNullOrEmpty(edycjaDto.NowyOpis))
                    oferta.Opis = edycjaDto.NowyOpis;

                var moderator = await _userManager.GetUserAsync(User);
                if (moderator == null)
                    return Unauthorized(new { message = "Nie znaleziono moderatora" });

                // Powiadomienie do autora o edycji
                var powiadomienie = new Powiadomienie
                {
                    IdUzytkownik = oferta.IdUzytkownik,
                    Typ = "Edycja",
                    Tresc = $"Moderator {moderator.UserName} zedytował Twoją ofertę \"{oryginalnyTytul}\". Powód: {edycjaDto.Powod}",
                    DataUtworzenia = DateTime.UtcNow,
                    Przeczytane = false
                };

                _context.Powiadomienia.Add(powiadomienie);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Oferta została zedytowana, autor został powiadomiony" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Błąd podczas edycji oferty", error = ex.Message });
            }
        }

        #endregion

        #region Obsługa zgłoszeń

        [HttpGet("zgloszenia")]
        public async Task<IActionResult> PobierzZgloszenia()
        {
            try
            {
                var zgloszenia = await _context.Powiadomienia
                    // Akceptuj również historyczne wpisy bez ogonka
                    .Where(p => p.Typ == "Zgłoszenie" || p.Typ == "Zgloszenie")
                    .Include(p => p.Uzytkownik)
                    .Include(p => p.Komentarz)
                    .Include(p => p.Oferta)
                    .OrderByDescending(p => p.DataUtworzenia)
                    .Select(p => new
                    {
                        idZgloszenie = p.IdPowiadomienie,
                        typ = p.Typ,
                        tresc = p.Tresc,
                        dataDodania = p.DataUtworzenia.ToString("yyyy-MM-dd HH:mm"),
                        zgloszonePrzez = p.Uzytkownik.UserName ?? "Nieznany",
                        status = p.Przeczytane ? "Rozpatrzone" : "Oczekujące",
                        idKomentarz = p.IdKomentarz,
                        fragmentKomentarza = p.Komentarz != null ? p.Komentarz.Tresc.Substring(0, Math.Min(120, p.Komentarz.Tresc.Length)) : null,
                        idOferta = p.IdOferta,
                        tytulOferty = p.Oferta != null ? p.Oferta.Nazwa : null
                    })
                    .ToListAsync();

                return Ok(zgloszenia);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Błąd podczas pobierania zgłoszeń", error = ex.Message });
            }
        }

        [HttpPut("zgloszenie/{id}/rozpatrz")]
        public async Task<IActionResult> RozpatrzZgloszenie(int id, [FromBody] RozpatrzenieDto rozpatrzenieDto)
        {
            try
            {
                var zgloszenie = await _context.Powiadomienia.FindAsync(id);
                if (zgloszenie == null)
                    return NotFound(new { message = "Zgłoszenie nie zostało znalezione" });

                zgloszenie.Przeczytane = true;
                
                var moderator = await _userManager.GetUserAsync(User);
                if (moderator == null)
                    return Unauthorized(new { message = "Nie znaleziono moderatora" });

                // Odpowiedź do zgłaszającego
                var odpowiedz = new Powiadomienie
                {
                    IdUzytkownik = zgloszenie.IdUzytkownik,
                    Typ = "Odpowiedź",
                    Tresc = $"Moderator {moderator.UserName} rozpatrzył Twoje zgłoszenie. Odpowiedź: {rozpatrzenieDto.Odpowiedz}",
                    DataUtworzenia = DateTime.UtcNow,
                    Przeczytane = false
                };

                _context.Powiadomienia.Add(odpowiedz);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Zgłoszenie zostało rozpatrzone, użytkownik został powiadomiony" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Błąd podczas rozpatrywania zgłoszenia", error = ex.Message });
            }
        }

        [HttpPost("zgloszenie/{id}/przekaz-adminowi")]
        public async Task<IActionResult> PrzekazAdminowi(int id, [FromBody] PrzekazanieDto przekazanieDto)
        {
            try
            {
                var zgloszenie = await _context.Powiadomienia
                    .Include(p => p.Uzytkownik)
                    .FirstOrDefaultAsync(p => p.IdPowiadomienie == id);

                if (zgloszenie == null)
                    return NotFound(new { message = "Zgłoszenie nie zostało znalezione" });

                var moderator = await _userManager.GetUserAsync(User);
                if (moderator == null)
                    return Unauthorized(new { message = "Nie znaleziono moderatora" });

                // Znajduję wszystkich adminów
                var adminowie = await _userManager.GetUsersInRoleAsync("Admin");
                
                // Tworzę powiadomienie dla każdego admina
                foreach (var admin in adminowie)
                {
                    var powiadomienie = new Powiadomienie
                    {
                        IdUzytkownik = admin.Id,
                        Typ = "Eskalacja",
                        Tresc = $"Moderator {moderator.UserName} przekazał zgłoszenie od {zgloszenie.Uzytkownik.UserName}: \"{zgloszenie.Tresc}\". Komentarz moderatora: {przekazanieDto.Komentarz}",
                        DataUtworzenia = DateTime.UtcNow,
                        Przeczytane = false
                    };

                    _context.Powiadomienia.Add(powiadomienie);
                }

                // Oznaczam oryginalne zgłoszenie jako rozpatrzone
                zgloszenie.Przeczytane = true;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Zgłoszenie zostało przekazane do adminów" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Błąd podczas przekazywania zgłoszenia", error = ex.Message });
            }
        }

        #endregion

        #region Pomocnicze metody

        [HttpGet("statystyki")]
        public async Task<IActionResult> PobierzStatystyki()
        {
            try
            {
                var statystyki = new
                {
                    oczekujaceOferty = await _context.Oferty.CountAsync(o => !o.Zatwierdzona),
                    zgloszeniaOczekujace = await _context.Powiadomienia.CountAsync(p => p.Typ == "Zgłoszenie" && !p.Przeczytane),
                    komentarzeOstatnich24h = await _context.Komentarze.CountAsync(k => k.DataDodania > DateTime.UtcNow.AddHours(-24)),
                    oferty24h = await _context.Oferty.CountAsync(o => o.DataDodania > DateTime.UtcNow.AddHours(-24))
                };

                return Ok(statystyki);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Błąd podczas pobierania statystyk", error = ex.Message });
            }
        }

        #endregion
    }
}
