using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Data;
using TechPromo.Api.Model;
using TechPromo.Api.DTO;
using TechPromo.Api.Services;

namespace TechPromo.Api.Controllers
{
    /// <summary>
    /// Kontroler moderatora - zarządzanie treściami, moderacja komentarzy i ofert
    /// </summary>
    [ApiController]
    [Route("moderator")]
    [Route("api/moderator")]
    [Authorize(Roles = "Moderator,Admin")]
    public class ModeratorController : ControllerBase
    {
        private readonly TechPromoDbContext _context;
        private readonly UserManager<Uzytkownik> _userManager;
        private readonly IBadgeService _badgeService;

        public ModeratorController(TechPromoDbContext context, UserManager<Uzytkownik> userManager, IBadgeService badgeService)
        {
            _context = context;
            _userManager = userManager;
            _badgeService = badgeService;
        }

        #region Moderacja komentarzy

        /// <summary>
        /// Pobiera wszystkie komentarze z systemem zgłoszeń dla moderacji
        /// </summary>
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

        /// <summary>
        /// Usuwa komentarz wraz z powiązanymi powiadomieniami
        /// </summary>
        /// <param name="id">Identyfikator komentarza do usunięcia</param>
        [HttpDelete("komentarz/{id}")]
        public async Task<IActionResult> UsunKomentarz(int id)
        {
            try
            {
                var komentarz = await _context.Komentarze.FindAsync(id);
                if (komentarz == null)
                    return NotFound(new { message = "Komentarz nie został znaleziony" });

                // Usuń powiązane powiadomienia odnoszące się do tego komentarza
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

        /// <summary>
        /// Wysyła ostrzeżenie do użytkownika za nieodpowiedni komentarz
        /// </summary>
        /// <param name="id">Identyfikator komentarza</param>
        /// <param name="ostrzezenieDto">Dane ostrzeżenia z powodem</param>
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

                // Utworzenie powiadomienia z ostrzeżeniem
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

        /// <summary>
        /// Pobiera wszystkie oferty do moderacji z informacjami o autorach i kategoriach
        /// </summary>
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

        /// <summary>
        /// Zatwierdza ofertę do publikacji
        /// </summary>
        /// <param name="id">Identyfikator oferty do zatwierdzenia</param>
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

                // Automatyczne przeliczenie odznak po zatwierdzeniu oferty
                await _badgeService.EvaluateForUserAsync(oferta.IdUzytkownik);

                return Ok(new { message = "Oferta została zatwierdzona i aktywowana" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Błąd podczas zatwierdzania oferty", error = ex.Message });
            }
        }

        /// <summary>
        /// Odrzuca ofertę z podaniem powodu i powiadamianiem autora
        /// </summary>
        /// <param name="id">Identyfikator oferty do odrzucenia</param>
        /// <param name="odrzucenieDto">Dane z powodem odrzucenia</param>
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

        /// <summary>
        /// Edytuje ofertę przez moderatora z powiadamianiem autora
        /// </summary>
        /// <param name="id">Identyfikator oferty do edycji</param>
        /// <param name="edycjaDto">Dane do aktualizacji oferty</param>
        [HttpPut("oferta/{id}/edytuj")]
        public async Task<IActionResult> EdytujOferte(int id, [FromBody] EdycjaOfertaDto edycjaDto)
        {
            try
            {
                var oferta = await _context.Oferty
                    .Include(o => o.Uzytkownik)
                    .Include(o => o.Zdjecia)
                    .FirstOrDefaultAsync(o => o.IdOferta == id);

                if (oferta == null)
                    return NotFound(new { message = "Oferta nie została znaleziona" });

                // Zapisanie oryginalnych wartości do powiadomienia
                var oryginalnyTytul = oferta.Nazwa;
                var oryginalnyOpis = oferta.Opis;

                // Aktualizacja podstawowych danych oferty
                if (!string.IsNullOrWhiteSpace(edycjaDto.NowyTytul))
                    oferta.Nazwa = edycjaDto.NowyTytul.Trim();

                if (!string.IsNullOrWhiteSpace(edycjaDto.NowyOpis))
                    oferta.Opis = edycjaDto.NowyOpis.Trim();

                if (edycjaDto.Cena.HasValue)
                    oferta.Cena = edycjaDto.Cena.Value;
                if (edycjaDto.CenaPoprzednia.HasValue)
                    oferta.CenaPoprzednia = edycjaDto.CenaPoprzednia.Value;
                
                // Obsługa opcjonalnych pól - pozwala na usuwanie wartości
                if (edycjaDto.Kod != null)
                    oferta.Kod = string.IsNullOrWhiteSpace(edycjaDto.Kod) ? string.Empty : edycjaDto.Kod.Trim();
                
                // Pozwala na usuwanie wartości w polach opcjonalnych
                if (edycjaDto.Link != null)
                    oferta.Link = string.IsNullOrWhiteSpace(edycjaDto.Link) ? string.Empty : edycjaDto.Link.Trim();
                    
                if (edycjaDto.Aktywna.HasValue)
                    oferta.Aktywna = edycjaDto.Aktywna.Value;
                if (edycjaDto.Zatwierdzona.HasValue)
                    oferta.Zatwierdzona = edycjaDto.Zatwierdzona.Value;

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

        /// <summary>
        /// Usuwa ofertę wraz z wszystkimi powiązanymi danymi
        /// </summary>
        /// <param name="id">Identyfikator oferty do usunięcia</param>
        /// <param name="dto">Opcjonalne dane z powodem usunięcia</param>
        [HttpDelete("oferta/{id}")]
        public async Task<IActionResult> UsunOferte(int id, [FromBody] UsuniecieDto? dto)
        {
            try
            {
                var oferta = await _context.Oferty
                    .Include(o => o.Uzytkownik)
                    .Include(o => o.Komentarze)
                    .Include(o => o.Zdjecia)
                    .FirstOrDefaultAsync(o => o.IdOferta == id);
                if (oferta == null)
                    return NotFound(new { message = "Oferta nie została znaleziona" });

                // Usuwanie powiązanych danych w kolejności zależności
                var glosy = _context.Glosy.Where(g => g.IdOferta == id);
                _context.Glosy.RemoveRange(glosy);
                
                // Usuwanie komentarzy z powiadomieniami
                if (oferta.Komentarze.Any())
                {
                    var komentarzeIds = oferta.Komentarze.Select(k => k.IdKomentarz).ToList();
                    var powiadomieniaKomentarzy = _context.Powiadomienia.Where(p => p.IdKomentarz != null && komentarzeIds.Contains(p.IdKomentarz.Value));
                    _context.Powiadomienia.RemoveRange(powiadomieniaKomentarzy);
                    _context.Komentarze.RemoveRange(oferta.Komentarze);
                }
                
                // Usuwanie tagów i pozostałych powiązań
                var tagi = _context.OfertaTagi.Where(t => t.IdOferta == id);
                _context.OfertaTagi.RemoveRange(tagi);
                
                // Usuwanie powiadomień związanych z ofertą
                var powiadomieniaOferty = _context.Powiadomienia.Where(p => p.IdOferta == id);
                _context.Powiadomienia.RemoveRange(powiadomieniaOferty);
                // Usuwanie zdjęć fizycznych i rekordów
                if (oferta.Zdjecia.Any())
                {
                    try
                    {
                        var env = HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>();
                        var root = env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                        foreach (var z in oferta.Zdjecia)
                        {
                            var physical = Path.Combine(root, z.UrlZdjecia.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                            if (System.IO.File.Exists(physical))
                            {
                                try { System.IO.File.Delete(physical); } catch { /* ignoruj */ }
                            }
                        }
                    }
                    catch { /* brak środowiska - ignoruj */ }
                    _context.OfertyZdjecia.RemoveRange(oferta.Zdjecia);
                }

                // Powiadomienie autora o usunięciu oferty
                if (oferta.IdUzytkownik != 0)
                {
                    var powod = dto?.Powod?.Trim();
                    if (!string.IsNullOrEmpty(powod))
                    {
                        var moderator = await _userManager.GetUserAsync(User);
                        if (moderator != null)
                        {
                            _context.Powiadomienia.Add(new Powiadomienie
                            {
                                IdUzytkownik = oferta.IdUzytkownik,
                                Typ = "Usunięcie",
                                Tresc = $"Moderator {moderator.UserName} usunął Twoją ofertę '{oferta.Nazwa}'. Powód: {powod}",
                                DataUtworzenia = DateTime.UtcNow,
                                Przeczytane = false
                            });
                        }
                    }
                }

                _context.Oferty.Remove(oferta);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Oferta została usunięta" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Błąd podczas usuwania oferty", error = ex.Message });
            }
        }

        #endregion

        #region Zarządzanie zdjęciami oferty

        /// <summary>
        /// Dodaje zdjęcia do oferty przez moderatora
        /// </summary>
        /// <param name="id">Identyfikator oferty</param>
        /// <param name="files">Lista plików graficznych do dodania</param>
        [HttpPost("oferta/{id}/zdjecia")]
        public async Task<IActionResult> DodajZdjecia(int id, [FromForm(Name = "zdjecia")] List<IFormFile> files)
        {
            try
            {
                var oferta = await _context.Oferty.Include(o => o.Zdjecia).FirstOrDefaultAsync(o => o.IdOferta == id);
                if (oferta == null) return NotFound(new { message = "Oferta nie została znaleziona" });

                // Alternatywne pobranie plików w przypadku problemów z model binderem
                if ((files == null || files.Count == 0) && Request.Form?.Files?.Count > 0)
                {
                    files = Request.Form.Files.GetFiles("zdjecia").ToList();
                    if (files.Count == 0)
                    {
                        // Pobranie wszystkich plików w przypadku różnej nazwy pola
                        files = Request.Form.Files.ToList();
                    }
                }

                if (files == null || files.Count == 0)
                {
                    return BadRequest(new { message = "Brak plików w polu 'zdjecia'", formKeys = Request.Form?.Keys });
                }

                var env = HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>();
                var root = env.WebRootPath;
                if (string.IsNullOrEmpty(root))
                {
                    root = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                }
                Directory.CreateDirectory(root);
                var uploadPath = Path.Combine(root, "uploads", "oferty");
                Directory.CreateDirectory(uploadPath);

                int startOrder = oferta.Zdjecia?.Any() == true ? oferta.Zdjecia.Max(z => z.Kolejnosc) : 0;
                int added = 0;
                foreach (var file in files)
                {
                    if (file.Length <= 0) continue;
                    var fileName = $"{id}_{DateTime.UtcNow.Ticks}_{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                    var fullPath = Path.Combine(uploadPath, fileName);
                    using (var stream = new FileStream(fullPath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }
                    _context.OfertyZdjecia.Add(new OfertaZdjecie
                    {
                        IdOferta = id,
                        UrlZdjecia = $"/uploads/oferty/{fileName}",
                        Kolejnosc = ++startOrder
                    });
                    added++;
                }
                await _context.SaveChangesAsync();
                var urls = await _context.OfertyZdjecia
                    .Where(z => z.IdOferta == id)
                    .OrderBy(z => z.Kolejnosc)
                    .Select(z => z.UrlZdjecia)
                    .ToListAsync();
                return Ok(new { message = $"Dodano {added} plik(ów)", zdjecia = urls });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Błąd podczas dodawania zdjęć", error = ex.Message });
            }
        }

        /// <summary>
        /// Pobiera listę zdjęć oferty z identyfikatorami i kolejnością
        /// </summary>
        /// <param name="id">Identyfikator oferty</param>
        [HttpGet("oferta/{id}/zdjecia")]
        public async Task<IActionResult> PobierzZdjecia(int id)
        {
            var oferta = await _context.Oferty
                .Include(o => o.Zdjecia)
                .FirstOrDefaultAsync(o => o.IdOferta == id);
            if (oferta == null) return NotFound(new { message = "Oferta nie została znaleziona" });
            var list = oferta.Zdjecia
                .OrderBy(z => z.Kolejnosc)
                .Select(z => new { z.IdOfertaZdjecie, z.UrlZdjecia, z.Kolejnosc })
                .ToList();
            return Ok(list);
        }

        /// <summary>
        /// Usuwa zdjęcie z oferty wraz z plikiem fizycznym
        /// </summary>
        /// <param name="id">Identyfikator oferty</param>
        /// <param name="fotoId">Identyfikator zdjęcia do usunięcia</param>
        [HttpDelete("oferta/{id}/zdjecie/{fotoId}")]
        public async Task<IActionResult> UsunZdjecie(int id, int fotoId)
        {
            try
            {
                var foto = await _context.OfertyZdjecia.FirstOrDefaultAsync(f => f.IdOferta == id && f.IdOfertaZdjecie == fotoId);
                if (foto == null) return NotFound(new { message = "Zdjęcie nie znalezione" });
                // Usuwanie pliku fizycznego z dysku
                try
                {
                    var env = HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>();
                    var root = env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                    var physical = Path.Combine(root, foto.UrlZdjecia.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                    if (System.IO.File.Exists(physical)) System.IO.File.Delete(physical);
                }
                catch { /* ignorowanie błędów dostępu do plików */ }
                _context.OfertyZdjecia.Remove(foto);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Usunięto zdjęcie" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Błąd podczas usuwania zdjęcia", error = ex.Message });
            }
        }

        /// <summary>
        /// Zmienia kolejność zdjęć w ofercie
        /// </summary>
        /// <param name="id">Identyfikator oferty</param>
        /// <param name="dto">Dane z nową kolejnością zdjęć</param>
        [HttpPut("oferta/{id}/zdjecia/kolejnosc")]
        public async Task<IActionResult> ZmienKolejnosc(int id, [FromBody] ZmienKolejnoscZdjecDto dto)
        {
            try
            {
                if (dto?.Kolejnosci == null || dto.Kolejnosci.Count == 0) return BadRequest(new { message = "Brak danych" });
                var fotos = await _context.OfertyZdjecia.Where(f => f.IdOferta == id).ToListAsync();
                foreach (var k in dto.Kolejnosci)
                {
                    var foto = fotos.FirstOrDefault(f => f.IdOfertaZdjecie == k.IdOfertaZdjecie);
                    if (foto != null) foto.Kolejnosc = k.Kolejnosc;
                }
                await _context.SaveChangesAsync();
                return Ok(new { message = "Zmieniono kolejność" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Błąd podczas zmiany kolejności", error = ex.Message });
            }
        }

        #endregion

        #region Obsługa zgłoszeń

        /// <summary>
        /// Pobiera wszystkie zgłoszenia do moderacji
        /// </summary>
        [HttpGet("zgloszenia")]
        public async Task<IActionResult> PobierzZgloszenia()
        {
            try
            {
                var zgloszenia = await _context.Powiadomienia
                    // Zgłoszenia z różnymi wariantami pisowni
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

        /// <summary>
        /// Rozpatruje zgłoszenie i wysyła odpowiedź do zgłaszającego
        /// </summary>
        /// <param name="id">Identyfikator zgłoszenia</param>
        /// <param name="rozpatrzenieDto">Dane z odpowiedzią moderatora</param>
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

        /// <summary>
        /// Przekazuje zgłoszenie do administratorów do dalszego rozpatrzenia
        /// </summary>
        /// <param name="id">Identyfikator zgłoszenia</param>
        /// <param name="przekazanieDto">Dane z komentarzem moderatora</param>
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

                // Wyszukanie wszystkich administratorów w systemie
                var adminowie = await _userManager.GetUsersInRoleAsync("Admin");
                
                // Utworzenie powiadomień eskalacyjnych dla administratorów
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

                // Oznaczenie oryginalnego zgłoszenia jako rozpatrzone
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

        #region Metody pomocnicze

        /// <summary>
        /// Pobiera podstawowe statystyki dla panelu moderatora
        /// </summary>
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
