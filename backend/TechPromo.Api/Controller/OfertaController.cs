using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Data;
using TechPromo.Api.DTO;
using TechPromo.Api.Model;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace TechPromo.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OfertaController : ControllerBase
    {
        private readonly TechPromoDbContext _context;

        public OfertaController(TechPromoDbContext context)
        {
            _context = context;
        }

        // GET: api/oferta
        [HttpGet]
        public async Task<ActionResult<IEnumerable<OfertaDto>>> GetOffers(
            [FromQuery] string? kategoria = null,
            [FromQuery] string? tag = null,
            [FromQuery] string? sortBy = "newest")
        {
            var query = _context.Oferty
                .Where(o => o.Aktywna && o.Zatwierdzona)
                .Include(o => o.Uzytkownik)
                .Include(o => o.Kategoria)
                .Include(o => o.Zdjecia)
                .Include(o => o.OfertaTagi).ThenInclude(ot => ot.Tag)
                .Include(o => o.Glosy)
                .Include(o => o.Komentarze)
                .AsQueryable();

            // Filtrowanie po kategorii
            if (!string.IsNullOrEmpty(kategoria))
            {
                query = query.Where(o => o.Kategoria != null && o.Kategoria.Nazwa == kategoria);
            }

            // Filtrowanie po tagu
            if (!string.IsNullOrEmpty(tag))
            {
                query = query.Where(o => o.OfertaTagi.Any(ot => ot.Tag.Nazwa.Contains(tag)));
            }

            // Sortowanie
            query = sortBy switch
            {
                "hot" => query.OrderByDescending(o => o.LiczbaHot - o.LiczbaCold),
                "price" => query.OrderBy(o => o.Cena ?? decimal.MaxValue),
                "newest" or _ => query.OrderByDescending(o => o.DataDodania)
            };

            var userId = 0;
            if (User.Identity?.IsAuthenticated == true)
            {
                userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            }

            var offers = await query
                .Take(50) // Ograniczenie do 50 ofert
                .Select(o => new OfertaDto
                {
                    Id = o.IdOferta,
                    Tytul = o.Nazwa,
                    Opis = o.Opis,
                    Typ = o.Typ,
                    Cena = o.Cena,
                    CenaPoprzednia = o.CenaPoprzednia,
                    Kod = o.Kod,
                    Sklep = o.Link, // Tymczasowo używamy Link jako sklep
                    Kategoria = o.Kategoria != null ? o.Kategoria.Nazwa : "Inne",
                    Tagi = o.OfertaTagi.Select(ot => ot.Tag.Nazwa).ToList(),
                    Autor = o.Uzytkownik.UserName ?? "Nieznany",
                    DataUtworzenia = o.DataDodania.ToString("dd.MM.yyyy HH:mm"),
                    Votes = new VotesDto { Hot = o.LiczbaHot, Cold = o.LiczbaCold },
                    Komentarze = o.Komentarze.Count,
                    UserVote = null, // Will be set after ToList
                    Zdjecia = o.Zdjecia.OrderBy(z => z.Kolejnosc).Select(z => z.UrlZdjecia).ToList()
                })
                .ToListAsync();

            return Ok(offers);
        }

        // GET: api/oferta/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<OfertaDto>> GetOffer(int id)
        {
            var userId = 0;
            if (User.Identity?.IsAuthenticated == true)
            {
                userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            }

            var offer = await _context.Oferty
                .Where(o => o.IdOferta == id && o.Aktywna && o.Zatwierdzona)
                .Include(o => o.Uzytkownik)
                .Include(o => o.Kategoria)
                .Include(o => o.Zdjecia)
                .Include(o => o.OfertaTagi).ThenInclude(ot => ot.Tag)
                .Include(o => o.Glosy)
                .Include(o => o.Komentarze)
                .Select(o => new OfertaDto
                {
                    Id = o.IdOferta,
                    Tytul = o.Nazwa,
                    Opis = o.Opis,
                    Typ = o.Typ,
                    Cena = o.Cena,
                    CenaPoprzednia = o.CenaPoprzednia,
                    Kod = o.Kod,
                    Sklep = o.Link,
                    Kategoria = o.Kategoria != null ? o.Kategoria.Nazwa : "Inne",
                    Tagi = o.OfertaTagi.Select(ot => ot.Tag.Nazwa).ToList(),
                    Autor = o.Uzytkownik.UserName ?? "Nieznany",
                    DataUtworzenia = o.DataDodania.ToString("dd.MM.yyyy HH:mm"),
                    Votes = new VotesDto { Hot = o.LiczbaHot, Cold = o.LiczbaCold },
                    Komentarze = o.Komentarze.Count,
                    UserVote = null, 
                    Zdjecia = o.Zdjecia.OrderBy(z => z.Kolejnosc).Select(z => z.UrlZdjecia).ToList()
                })
                .FirstOrDefaultAsync();

            if (offer == null)
            {
                return NotFound("Oferta nie została znaleziona.");
            }

            return Ok(offer);
        }

        // GET: api/oferta/kategorie
        [HttpGet("kategorie")]
        public async Task<ActionResult<IEnumerable<string>>> GetCategories()
        {
            var categories = await _context.Kategorie
                .Select(k => k.Nazwa)
                .OrderBy(n => n)
                .ToListAsync();

            return Ok(categories);
        }

        // GET: api/oferta/tagi
        [HttpGet("tagi")]
        public async Task<ActionResult<IEnumerable<string>>> GetTags()
        {
            var tags = await _context.Tagi
                .Select(t => t.Nazwa)
                .OrderBy(n => n)
                .Take(50) // Ograniczenie do 50 najpopularniejszych tagów
                .ToListAsync();

            return Ok(tags);
        }

        // GET: api/oferta/{id}/komentarze
        [HttpGet("{id}/komentarze")]
        public async Task<ActionResult<IEnumerable<KomentarzDto>>> GetOfferComments(int id)
        {
            var comments = await _context.Komentarze
                .Where(k => k.IdOferta == id)
                .Include(k => k.Uzytkownik)
                .OrderByDescending(k => k.DataDodania)
                .Select(k => new KomentarzDto
                {
                    Id = k.IdKomentarz,
                    Tresc = k.Tresc,
                    Autor = k.Uzytkownik != null ? (k.Uzytkownik.UserName ?? "Nieznany") : "Nieznany",
                    Data = k.DataDodania.ToString("dd.MM.yyyy HH:mm"),
                    Oferta = "" // Nie potrzebujemy nazwy oferty w tym kontekście
                })
                .ToListAsync();

            return Ok(comments);
        }

        // POST: api/oferta - Główny endpoint do tworzenia ofert
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<OfertaDto>> CreateOffer([FromBody] CreateOfferRequest request)
        {
            try
            {
                // 1. Walidacja użytkownika
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                if (userId == 0)
                {
                    return Unauthorized("Użytkownik nie jest zalogowany.");
                }

                // 2. Walidacja danych wejściowych
                if (string.IsNullOrWhiteSpace(request.Tytul))
                    return BadRequest("Tytuł jest wymagany.");
                
                if (string.IsNullOrWhiteSpace(request.Opis))
                    return BadRequest("Opis jest wymagany.");
                    
                if (string.IsNullOrWhiteSpace(request.Kategoria))
                    return BadRequest("Kategoria jest wymagana.");

                // 3. Normalizacja typu oferty
                var typ = !string.IsNullOrEmpty(request.Typ) && 
                         (request.Typ.ToLower() == "kupon" || request.Typ.ToLower() == "okazja") 
                         ? request.Typ.ToLower() : "okazja";

                // 4. Obsługa kategorii (znajdź lub utwórz)
                var kategoria = await GetOrCreateCategory(request.Kategoria);

                // 5. Tworzenie oferty
                var oferta = new Oferta
                {
                    Nazwa = request.Tytul.Trim(),
                    Typ = typ,
                    Opis = request.Opis.Trim(),
                    Cena = request.Cena,
                    Link = !string.IsNullOrEmpty(request.Sklep) ? request.Sklep.Trim() : string.Empty,
                    IdKategoria = kategoria.IdKategoria,
                    IdUzytkownik = userId,
                    DataDodania = DateTime.UtcNow,
                    Aktywna = true,
                    Zatwierdzona = false, // Wymaga moderacji
                    LiczbaHot = 0,
                    LiczbaCold = 0
                };

                _context.Oferty.Add(oferta);
                await _context.SaveChangesAsync();

                // 6. Obsługa tagów
                if (!string.IsNullOrWhiteSpace(request.Tagi))
                {
                    await AddTagsToOffer(oferta.IdOferta, request.Tagi);
                }

                // 7. Zwracanie odpowiedzi
                var result = await CreateOfferResponse(oferta.IdOferta);
                return CreatedAtAction(nameof(GetOffer), new { id = oferta.IdOferta }, result);
            }
            catch (Exception ex)
            {
                // Log błędu w produkcji
                return BadRequest($"Wystąpił błąd podczas tworzenia oferty: {ex.Message}");
            }
        }

        // POST: api/oferta/kupon - Alias dla kuponów
        [HttpPost("kupon")]
        [Authorize]
        public async Task<ActionResult<OfertaDto>> CreateCoupon([FromBody] CreateOfferRequest request)
        {
            request.Typ = "kupon";
            return await CreateOffer(request);
        }

        // Metoda pomocnicza - znajdź lub utwórz kategorię
        private async Task<Kategoria> GetOrCreateCategory(string nazwaKategorii)
        {
            var kategoria = await _context.Kategorie
                .FirstOrDefaultAsync(k => k.Nazwa == nazwaKategorii);
                
            if (kategoria == null)
            {
                kategoria = new Kategoria 
                { 
                    Nazwa = nazwaKategorii,
                    Opis = $"Kategoria {nazwaKategorii}" // Dodaję domyślny opis
                };
                _context.Kategorie.Add(kategoria);
                await _context.SaveChangesAsync();
            }
            
            return kategoria;
        }

        // Metoda pomocnicza - dodawanie tagów
        private async Task AddTagsToOffer(int ofertaId, string tagiString)
        {
            var tagNames = tagiString.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(t => t.Trim())
                .Where(t => !string.IsNullOrEmpty(t))
                .Distinct()
                .ToList();

            foreach (var tagName in tagNames)
            {
                var tag = await _context.Tagi.FirstOrDefaultAsync(t => t.Nazwa == tagName);
                if (tag == null)
                {
                    tag = new Tag { Nazwa = tagName };
                    _context.Tagi.Add(tag);
                    await _context.SaveChangesAsync();
                }

                // Sprawdź czy powiązanie już istnieje
                var existingConnection = await _context.OfertaTagi
                    .FirstOrDefaultAsync(ot => ot.IdOferta == ofertaId && ot.IdTag == tag.IdTag);
                    
                if (existingConnection == null)
                {
                    var ofertaTag = new OfertaTag
                    {
                        IdOferta = ofertaId,
                        IdTag = tag.IdTag
                    };
                    _context.OfertaTagi.Add(ofertaTag);
                }
            }
            await _context.SaveChangesAsync();
        }

        // Metoda pomocnicza - tworzenie odpowiedzi
        private async Task<OfertaDto?> CreateOfferResponse(int ofertaId)
        {
            return await _context.Oferty
                .Where(o => o.IdOferta == ofertaId)
                .Include(o => o.Uzytkownik)
                .Include(o => o.Kategoria)
                .Include(o => o.OfertaTagi).ThenInclude(ot => ot.Tag)
                .Select(o => new OfertaDto
                {
                    Id = o.IdOferta,
                    Tytul = o.Nazwa,
                    Opis = o.Opis,
                    Typ = o.Typ,
                    Cena = o.Cena,
                    CenaPoprzednia = o.CenaPoprzednia,
                    Kod = o.Kod,
                    Sklep = o.Link,
                    Kategoria = o.Kategoria != null ? o.Kategoria.Nazwa : "Inne",
                    Tagi = o.OfertaTagi.Select(ot => ot.Tag.Nazwa).ToList(),
                    Autor = o.Uzytkownik.UserName ?? "Nieznany",
                    DataUtworzenia = o.DataDodania.ToString("dd.MM.yyyy HH:mm"),
                    Votes = new VotesDto { Hot = o.LiczbaHot, Cold = o.LiczbaCold },
                    Komentarze = 0,
                    UserVote = null,
                    Zdjecia = new List<string>()
                })
                .FirstOrDefaultAsync();
        }

        // POST: api/oferta/upload - Endpoint z obsługą FormData i plików
        [HttpPost("upload")]
        [Authorize]
        public async Task<ActionResult<OfertaDto>> CreateOfferWithFiles()
        {
            try
            {
                // 1. Walidacja użytkownika
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                if (userId == 0)
                {
                    return Unauthorized("Użytkownik nie jest zalogowany.");
                }

                // 2. Pobranie danych z FormData
                var tytul = Request.Form["tytul"].ToString().Trim();
                var opis = Request.Form["opis"].ToString().Trim();
                var kategoria = Request.Form["kategoria"].ToString().Trim();
                var typ = Request.Form["typ"].ToString().Trim();
                
                // Opcjonalne pola
                var cenaString = Request.Form["cena"].ToString();
                var cenaPoprzeniaString = Request.Form["cenaPoprzednia"].ToString();
                var kod = Request.Form["kod"].ToString().Trim();
                var sklep = Request.Form["sklep"].ToString().Trim();
                var tagi = Request.Form["tagi"].ToString().Trim();
                var zdjecia = Request.Form.Files.GetFiles("zdjecia");

                // 3. Walidacja podstawowa
                if (string.IsNullOrEmpty(tytul))
                    return BadRequest("Tytuł jest wymagany.");
                
                if (string.IsNullOrEmpty(opis))
                    return BadRequest("Opis jest wymagany.");
                    
                if (string.IsNullOrEmpty(kategoria))
                    return BadRequest("Kategoria jest wymagana.");

                // 4. Parsowanie cen
                decimal? cena = null;
                decimal? cenaPoprzednia = null;
                
                if (!string.IsNullOrEmpty(cenaString) && decimal.TryParse(cenaString, out var parsedCena))
                    cena = parsedCena;
                    
                if (!string.IsNullOrEmpty(cenaPoprzeniaString) && decimal.TryParse(cenaPoprzeniaString, out var parsedCenaPoprzednia))
                    cenaPoprzednia = parsedCenaPoprzednia;

                // 5. Normalizacja typu
                typ = !string.IsNullOrEmpty(typ) && 
                     (typ.ToLower() == "kupon" || typ.ToLower() == "okazja") 
                     ? typ.ToLower() : "okazja";

                // 6. Obsługa kategorii
                var kategoriaEntity = await GetOrCreateCategory(kategoria);

                // 7. Tworzenie oferty
                var oferta = new Oferta
                {
                    Nazwa = tytul,
                    Opis = opis,
                    Typ = typ,
                    Cena = cena,
                    CenaPoprzednia = cenaPoprzednia,
                    Kod = !string.IsNullOrEmpty(kod) ? kod : null,
                    Link = !string.IsNullOrEmpty(sklep) ? sklep : string.Empty,
                    IdKategoria = kategoriaEntity.IdKategoria,
                    IdUzytkownik = userId,
                    DataDodania = DateTime.Now,
                    LiczbaHot = 0,
                    LiczbaCold = 0,
                    Aktywna = true,
                    Zatwierdzona = false
                };

                _context.Oferty.Add(oferta);
                await _context.SaveChangesAsync();

                // 8. Obsługa zdjęć
                if (zdjecia.Count > 0)
                {
                    var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "oferty");
                    if (!Directory.Exists(uploadDir))
                        Directory.CreateDirectory(uploadDir);

                    int kolejnosc = 1;
                    foreach (var file in zdjecia)
                    {
                        if (file.Length > 0)
                        {
                            var fileName = $"{Guid.NewGuid()}_{file.FileName}";
                            var filePath = Path.Combine(uploadDir, fileName);
                            
                            using (var stream = new FileStream(filePath, FileMode.Create))
                            {
                                await file.CopyToAsync(stream);
                            }

                            var zdjecie = new OfertaZdjecie
                            {
                                IdOferta = oferta.IdOferta,
                                UrlZdjecia = $"/uploads/oferty/{fileName}",
                                Kolejnosc = kolejnosc++
                            };
                            _context.OfertyZdjecia.Add(zdjecie);
                        }
                    }
                    await _context.SaveChangesAsync();
                }

                // 9. Obsługa tagów
                if (!string.IsNullOrEmpty(tagi))
                {
                    await AddTagsToOffer(oferta.IdOferta, tagi);
                }

                // 10. Zwracanie wyniku
                var result = await CreateOfferResponse(oferta.IdOferta);
                return result != null ? Ok(result) : BadRequest("Błąd podczas tworzenia odpowiedzi");

            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Błąd serwera: {ex.Message}");
            }
        }
    }

    /// <summary>
    /// DTO dla tworzenia nowych ofert - używane do walidacji i przesyłania danych
    /// </summary>
    public class CreateOfferRequest
    {
        [Required(ErrorMessage = "Tytuł jest wymagany")]
        [StringLength(100, ErrorMessage = "Tytuł nie może być dłuższy niż 100 znaków")]
        public string Tytul { get; set; } = string.Empty;

        [Required(ErrorMessage = "Opis jest wymagany")]
        [StringLength(2000, ErrorMessage = "Opis nie może być dłuższy niż 2000 znaków")]
        public string Opis { get; set; } = string.Empty;

        [Range(0.01, 999999.99, ErrorMessage = "Cena musi być większa od 0")]
        public decimal? Cena { get; set; }

        [Required(ErrorMessage = "Kategoria jest wymagana")]
        [StringLength(50, ErrorMessage = "Nazwa kategorii nie może być dłuższa niż 50 znaków")]
        public string Kategoria { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "Nazwa sklepu nie może być dłuższa niż 100 znaków")]
        public string? Sklep { get; set; }

        [StringLength(200, ErrorMessage = "Tagi nie mogą być dłuższe niż 200 znaków")]
        public string? Tagi { get; set; }

        [RegularExpression("^(okazja|kupon)$", ErrorMessage = "Typ musi być 'okazja' lub 'kupon'")]
        public string Typ { get; set; } = "okazja";
    }
}
