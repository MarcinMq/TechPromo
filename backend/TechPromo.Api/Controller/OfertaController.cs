using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Data;
using TechPromo.Api.Model;
using TechPromo.Api.DTO;
using TechPromo.Api.Services;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;
using System.IO;

namespace TechPromo.Api.Controllers
{
    // Oferty: listowanie, szczegóły, tworzenie, komentarze, głosy.
    [ApiController]
    [Route("api/[controller]")]
    public class OfertaController : ControllerBase
    {
        private readonly TechPromoDbContext _context; // EF Core kontekst
        private readonly UserManager<Uzytkownik> _userManager;
        private readonly IBadgeService _badgeService;

        public OfertaController(TechPromoDbContext context, UserManager<Uzytkownik> userManager, IBadgeService badgeService)
        {
            _context = context;
            _userManager = userManager;
            _badgeService = badgeService;
        }

        // Buduje absolutny URL avatara autora jeśli istnieje plik user_{id}.ext w wwwroot/uploads/profiles
        private string? BuildAutorAvatarAbsoluteUrl(int autorId)
        {
            try
            {
                var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "profiles");
                if (!Directory.Exists(uploadDir)) return null;
                var existing = Directory.GetFiles(uploadDir, $"user_{autorId}.*").FirstOrDefault();
                if (existing == null) return null;
                var fileName = Path.GetFileName(existing);
                var baseUrl = $"{Request.Scheme}://{Request.Host}";
                return baseUrl + "/uploads/profiles/" + fileName;
            }
            catch
            {
                // Ignoruj błąd – brak avatara
                return null;
            }
        }

        // GET: api/oferta
        [HttpGet]
    // Lista ofert z filtrem kategorii / tagu, sortem i paginacją
    public async Task<ActionResult<PagedResult<OfertaDto>>> GetOffers(
            [FromQuery] string? kategoria = null,
            [FromQuery] string? tag = null,
            [FromQuery] string? sortBy = "newest",
            [FromQuery] int skip = 0,
            [FromQuery] int take = 30)
        {
            if (take > 100) take = 100; // limit bezpieczeństwa
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
                var katLower = kategoria.ToLower();
                query = query.Where(o => o.Kategoria != null && o.Kategoria.Nazwa.ToLower() == katLower);
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

            var total = await query.CountAsync();

            var offersRaw = await query
                .Skip(skip)
                .Take(take)
                .Select(o => new 
                {
                    AutorId = o.IdUzytkownik,
                    Dto = new OfertaDto
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
                        UserVote = userId != 0 ? o.Glosy.Where(g => g.IdUzytkownik == userId).Select(g => g.TypGlosu).FirstOrDefault() : null,
                        Zdjecia = o.Zdjecia.OrderBy(z => z.Kolejnosc).Select(z => z.UrlZdjecia).ToList()
                    }
                })
                .ToListAsync();

            var offers = offersRaw.Select(x => {
                x.Dto.AutorAvatarUrl = BuildAutorAvatarAbsoluteUrl(x.AutorId);
                return x.Dto;
            }).ToList();

            var result = new PagedResult<OfertaDto>
            {
                Items = offers,
                Total = total,
                Skip = skip,
                Take = take
            };
            return Ok(result);
        }

        // GET: api/oferta/{id}
        [HttpGet("{id}")]
    // Szczegóły jednej oferty
    public async Task<ActionResult<OfertaDto>> GetOffer(int id)
        {
            var userId = 0;
            if (User.Identity?.IsAuthenticated == true)
            {
                userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            }

            var offerRaw = await _context.Oferty
                .Where(o => o.IdOferta == id && o.Aktywna && o.Zatwierdzona)
                .Include(o => o.Uzytkownik)
                .Include(o => o.Kategoria)
                .Include(o => o.Zdjecia)
                .Include(o => o.OfertaTagi).ThenInclude(ot => ot.Tag)
                .Include(o => o.Glosy)
                .Include(o => o.Komentarze)
                .Select(o => new 
                {
                    AutorId = o.IdUzytkownik,
                    Dto = new OfertaDto
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
                        UserVote = userId != 0 ? o.Glosy.Where(g => g.IdUzytkownik == userId).Select(g => g.TypGlosu).FirstOrDefault() : null, 
                        Zdjecia = o.Zdjecia.OrderBy(z => z.Kolejnosc).Select(z => z.UrlZdjecia).ToList()
                    }
                })
                .FirstOrDefaultAsync();

            OfertaDto? offer = null;
            if (offerRaw != null)
            {
                offer = offerRaw.Dto;
                offer.AutorAvatarUrl = BuildAutorAvatarAbsoluteUrl(offerRaw.AutorId);
            }

            if (offer == null)
            {
                // Fallback: jeśli użytkownik to właściciel / moderator / admin pokaż także niezatwierdzoną / nieaktywną ofertę
                var bypassRoles = User.IsInRole("Admin") || User.IsInRole("Moderator");
                if (userId != 0 || bypassRoles)
                {
                    var raw = await _context.Oferty
                        .Where(o => o.IdOferta == id)
                        .Include(o => o.Uzytkownik)
                        .Include(o => o.Kategoria)
                        .Include(o => o.Zdjecia)
                        .Include(o => o.OfertaTagi).ThenInclude(ot => ot.Tag)
                        .Include(o => o.Glosy)
                        .Include(o => o.Komentarze)
                        .FirstOrDefaultAsync();

                    if (raw != null && (bypassRoles || raw.IdUzytkownik == userId))
                    {
                        var dto = new OfertaDto
                        {
                            Id = raw.IdOferta,
                            Tytul = raw.Nazwa,
                            Opis = raw.Opis,
                            Typ = raw.Typ,
                            Cena = raw.Cena,
                            CenaPoprzednia = raw.CenaPoprzednia,
                            Kod = raw.Kod,
                            Sklep = raw.Link,
                            Kategoria = raw.Kategoria != null ? raw.Kategoria.Nazwa : "Inne",
                            Tagi = raw.OfertaTagi.Select(ot => ot.Tag.Nazwa).ToList(),
                            Autor = raw.Uzytkownik.UserName ?? "Nieznany",
                            DataUtworzenia = raw.DataDodania.ToString("dd.MM.yyyy HH:mm"),
                            Votes = new VotesDto { Hot = raw.LiczbaHot, Cold = raw.LiczbaCold },
                            Komentarze = raw.Komentarze.Count,
                            UserVote = userId != 0 ? raw.Glosy.Where(g => g.IdUzytkownik == userId).Select(g => g.TypGlosu).FirstOrDefault() : null,
                            Zdjecia = raw.Zdjecia.OrderBy(z => z.Kolejnosc).Select(z => z.UrlZdjecia).ToList()
                        };
                        dto.AutorAvatarUrl = BuildAutorAvatarAbsoluteUrl(raw.IdUzytkownik);
                        // Oznacz w nagłówku że to draft (opcjonalne do debug)
                        Response.Headers["X-Draft"] = "true";
                        return Ok(dto);
                    }
                }
                return NotFound("Oferta nie została znaleziona.");
            }

            return Ok(offer);
        }

        // POST: api/oferta/{id}/komentarze - dodanie komentarza do oferty
        [HttpPost("{id}/komentarze")]
        [Authorize]
        // Dodanie komentarza lub odpowiedzi
    public async Task<ActionResult<KomentarzDto>> AddComment(int id, [FromBody] CreateCommentRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Tresc))
                return BadRequest("Treść komentarza jest wymagana.");

            var oferta = await _context.Oferty.FirstOrDefaultAsync(o => o.IdOferta == id && o.Aktywna && o.Zatwierdzona);
            if (oferta == null)
                return NotFound("Oferta nie istnieje lub nie została zatwierdzona.");

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0)
                return Unauthorized();

            // walidacja rodzica (opcjonalna)
            Komentarz? parent = null;
            if (request.ParentId.HasValue)
            {
                parent = await _context.Komentarze.FirstOrDefaultAsync(k => k.IdKomentarz == request.ParentId.Value);
                if (parent == null || parent.IdOferta != oferta.IdOferta)
                    return BadRequest("Nieprawidłowy parentId.");
            }

            var komentarz = new Komentarz
            {
                IdOferta = oferta.IdOferta,
                IdUzytkownik = userId,
                Tresc = request.Tresc.Trim(),
                DataDodania = DateTime.UtcNow,
                Status = "aktywny",
                ParentId = request.ParentId
            };

            _context.Komentarze.Add(komentarz);

            // Dodaj punkty użytkownikowi za komentarz
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user != null)
            {
                user.Punkty += 2;
                await _userManager.UpdateAsync(user);
            }

            await _context.SaveChangesAsync();

            // Automatycznie przelicz odznaki po dodaniu komentarza
            await _badgeService.EvaluateForUserAsync(userId);

            // Możemy w razie potrzeby zaktualizować licznik komentarzy w ofercie (jeśli będzie kolumna cache) – pomijam.

            var result = await _context.Komentarze
                .Where(k => k.IdKomentarz == komentarz.IdKomentarz)
                .Include(k => k.Uzytkownik)
                .Select(k => new KomentarzDto
                {
                    Id = k.IdKomentarz,
                    Tresc = k.Tresc,
                    Autor = k.Uzytkownik != null ? (k.Uzytkownik.UserName ?? "Nieznany") : "Nieznany",
                    Data = k.DataDodania.ToString("dd.MM.yyyy HH:mm"),
                    Oferta = string.Empty,
                    ParentId = k.ParentId,
                    Up = k.LiczbaUp,
                    Down = k.LiczbaDown,
                    UserVote = null
                }).FirstOrDefaultAsync();

            return Created($"/api/oferta/{id}/komentarze/{komentarz.IdKomentarz}", result);
        }

        // GET: api/oferta/kategorie
        [HttpGet("kategorie")]
    // Lista nazw kategorii
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
    // Lista tagów (max 50)
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
    // Komentarze z paginacją i sortowaniem
    public async Task<ActionResult<PagedResult<KomentarzDto>>> GetOfferComments(
            int id,
            [FromQuery] int skip = 0,
            [FromQuery] int take = 20,
            [FromQuery] string sort = "newest")
        {
            if (take > 100) take = 100;
            var baseQuery = _context.Komentarze.Where(k => k.IdOferta == id);
            var total = await baseQuery.CountAsync();

            var userId = 0;
            if (User.Identity?.IsAuthenticated == true)
            {
                userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            }

            IQueryable<Komentarz> query = baseQuery.Include(k => k.Uzytkownik);
            query = sort switch
            {
                "oldest" => query.OrderBy(k => k.DataDodania),
                "helpful" => query.OrderByDescending(k => (k.LiczbaUp - k.LiczbaDown)).ThenByDescending(k => k.DataDodania),
                "best" => query.OrderByDescending(k => k.LiczbaUp).ThenByDescending(k => (k.LiczbaUp - k.LiczbaDown)).ThenByDescending(k => k.DataDodania),
                _ => query.OrderByDescending(k => k.DataDodania)
            };

            var items = await query
                .Skip(skip)
                .Take(take)
                .Select(k => new KomentarzDto
                {
                    Id = k.IdKomentarz,
                    Tresc = k.Tresc,
                    Autor = k.Uzytkownik != null ? (k.Uzytkownik.UserName ?? "Nieznany") : "Nieznany",
                    Data = k.DataDodania.ToString("dd.MM.yyyy HH:mm"),
                    Oferta = "",
                    ParentId = k.ParentId,
                    Up = k.LiczbaUp,
                    Down = k.LiczbaDown,
                    UserVote = userId != 0 ? _context.KomentarzGlosy.Where(g => g.IdKomentarz == k.IdKomentarz && g.IdUzytkownik == userId).Select(g => g.TypGlosu).FirstOrDefault() : null
                })
                .ToListAsync();

            var result = new PagedResult<KomentarzDto>
            {
                Items = items,
                Total = total,
                Skip = skip,
                Take = take
            };
            return Ok(result);
        }

        [HttpPost("komentarz/{id}/glos")]
        [Authorize]
    // Głosowanie na komentarz (toggle)
    public async Task<ActionResult> VoteComment(int id, [FromBody] CommentVoteRequest request)
        {
            if (request == null || (request.Typ != "up" && request.Typ != "down"))
                return BadRequest("Nieprawidłowy typ głosu.");

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var komentarz = await _context.Komentarze.FirstOrDefaultAsync(k => k.IdKomentarz == id);
            if (komentarz == null) return NotFound("Komentarz nie znaleziony.");

            var existing = await _context.KomentarzGlosy.FirstOrDefaultAsync(g => g.IdKomentarz == id && g.IdUzytkownik == userId);
            if (existing != null)
            {
                if (existing.TypGlosu == "up") komentarz.LiczbaUp--; else komentarz.LiczbaDown--;
                _context.KomentarzGlosy.Remove(existing);
                if (existing.TypGlosu == request.Typ)
                {
                    await _context.SaveChangesAsync();
                    return Ok(new { komentarz.IdKomentarz, komentarz.LiczbaUp, komentarz.LiczbaDown, userVote = (string?)null });
                }
            }

            var vote = new KomentarzGlos { IdKomentarz = id, IdUzytkownik = userId, TypGlosu = request.Typ, DataGlosu = DateTime.UtcNow };
            _context.KomentarzGlosy.Add(vote);
            if (request.Typ == "up") komentarz.LiczbaUp++; else komentarz.LiczbaDown++;
            await _context.SaveChangesAsync();
            return Ok(new { komentarz.IdKomentarz, komentarz.LiczbaUp, komentarz.LiczbaDown, userVote = request.Typ });
        }

        // POST: api/oferta - Główny endpoint do tworzenia ofert
        [HttpPost]
        [Authorize]
    // Tworzenie nowej oferty
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

                // 3.5. Walidacja cen
                if (request.Cena.HasValue && request.Cena <= 0)
                    return BadRequest("Cena musi być większa od 0.");
                    
                if (request.CenaPoprzednia.HasValue && request.CenaPoprzednia <= 0)
                    return BadRequest("Cena poprzednia musi być większa od 0.");
                    
                if (request.Cena.HasValue && request.CenaPoprzednia.HasValue && request.Cena >= request.CenaPoprzednia)
                    return BadRequest("Cena promocyjna powinna być niższa niż cena poprzednia.");

                // 4. Obsługa kategorii (znajdź lub utwórz)
                var kategoria = await GetOrCreateCategory(request.Kategoria);

                // 5. Tworzenie oferty
                var oferta = new Oferta
                {
                    Nazwa = request.Tytul.Trim(),
                    Typ = typ,
                    Opis = request.Opis.Trim(),
                    Cena = request.Cena,
                    CenaPoprzednia = request.CenaPoprzednia,
                    Kod = !string.IsNullOrEmpty(request.Kod) ? request.Kod.Trim() : null,
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
    // Tworzenie kuponu (alias)
    public async Task<ActionResult<OfertaDto>> CreateCoupon([FromBody] CreateOfferRequest request)
        {
            request.Typ = "kupon";
            return await CreateOffer(request);
        }

        // Metoda pomocnicza - znajdź lub utwórz kategorię
    // Szukanie lub tworzenie kategorii
        private async Task<Kategoria> GetOrCreateCategory(string nazwaKategorii)
        {
            var raw = (nazwaKategorii ?? string.Empty).Trim();
            if (raw.Length == 0) raw = "Inne";
            // Normalizacja: pierwsza litera wielka, reszta jak była (prosto)
            var normalized = char.ToUpper(raw[0]) + (raw.Length > 1 ? raw.Substring(1) : string.Empty);
            var lower = raw.ToLower();

            // Szukam case-insensitive
            var kategoria = await _context.Kategorie
                .FirstOrDefaultAsync(k => k.Nazwa.ToLower() == lower);

            if (kategoria == null)
            {
                kategoria = new Kategoria
                {
                    Nazwa = normalized,
                    Opis = $"Kategoria {normalized}"
                };
                _context.Kategorie.Add(kategoria);
                await _context.SaveChangesAsync();
            }
            return kategoria;
        }

        // Metoda pomocnicza - dodawanie tagów
    // Dodawanie tagów do oferty
    private async Task AddTagsToOffer(int ofertaId, string tagiString)
        {
            var tagNames = tagiString.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(t => t.Trim())
                .Where(t => !string.IsNullOrEmpty(t))
                .Where(t => t.Length <= 50)
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
            var data = await _context.Oferty
                .Where(o => o.IdOferta == ofertaId)
                .Include(o => o.Uzytkownik)
                .Include(o => o.Kategoria)
                .Include(o => o.Zdjecia)
                .Include(o => o.OfertaTagi).ThenInclude(ot => ot.Tag)
                .Select(o => new
                {
                    AutorId = o.IdUzytkownik,
                    Dto = new OfertaDto
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
                        Zdjecia = o.Zdjecia.OrderBy(z => z.Kolejnosc).Select(z => z.UrlZdjecia).ToList()
                    }
                })
                .FirstOrDefaultAsync();

            if (data == null) return null;
            var dto = data.Dto;
            dto.AutorAvatarUrl = BuildAutorAvatarAbsoluteUrl(data.AutorId);
            return dto;
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

                // Dodatkowa walidacja długości (symetria z CreateOfferRequest)
                if (tytul.Length > 100) return BadRequest("Tytuł nie może być dłuższy niż 100 znaków.");
                if (opis.Length > 2000) return BadRequest("Opis nie może być dłuższy niż 2000 znaków.");
                if (kategoria.Length > 50) return BadRequest("Kategoria nie może być dłuższa niż 50 znaków.");
                if (!string.IsNullOrEmpty(sklep) && sklep.Length > 300) return BadRequest("Link nie może być dłuższy niż 300 znaków.");
                if (!string.IsNullOrEmpty(kod) && kod.Length > 50) return BadRequest("Kod nie może być dłuższy niż 50 znaków.");
                if (!string.IsNullOrEmpty(tagi) && tagi.Length > 200) return BadRequest("Tagi nie mogą być dłuższe niż 200 znaków.");

                // 4. Parsowanie cen - użycie kultury niezmiennej dla bezpiecznego parsowania
                decimal? cena = null;
                decimal? cenaPoprzednia = null;
                
                if (!string.IsNullOrEmpty(cenaString))
                {
                    // Próbuj z kulturą niezmienną (kropka jako separator dziesiętny)
                    if (decimal.TryParse(cenaString, System.Globalization.NumberStyles.Number, 
                        System.Globalization.CultureInfo.InvariantCulture, out var parsedCena))
                    {
                        cena = parsedCena;
                    }
                    // Jeśli nie, próbuj z kulturą lokalną (przecinek jako separator)
                    else if (decimal.TryParse(cenaString, out var parsedCenaLocal))
                    {
                        cena = parsedCenaLocal;
                    }
                }
                    
                if (!string.IsNullOrEmpty(cenaPoprzeniaString))
                {
                    // Próbuj z kulturą niezmienną (kropka jako separator dziesiętny)
                    if (decimal.TryParse(cenaPoprzeniaString, System.Globalization.NumberStyles.Number, 
                        System.Globalization.CultureInfo.InvariantCulture, out var parsedCenaPoprzednia))
                    {
                        cenaPoprzednia = parsedCenaPoprzednia;
                    }
                    // Jeśli nie, próbuj z kulturą lokalną (przecinek jako separator)
                    else if (decimal.TryParse(cenaPoprzeniaString, out var parsedCenaPoprzeniaLocal))
                    {
                        cenaPoprzednia = parsedCenaPoprzeniaLocal;
                    }
                }

                // 5. Normalizacja typu
                typ = !string.IsNullOrEmpty(typ) && 
                     (typ.ToLower() == "kupon" || typ.ToLower() == "okazja") 
                     ? typ.ToLower() : "okazja";

                // 6. Walidacja cen (dodatkowa sprawdzenie logiki)
                if (cena.HasValue && cena <= 0)
                    return BadRequest("Cena musi być większa od 0.");
                    
                if (cenaPoprzednia.HasValue && cenaPoprzednia <= 0)
                    return BadRequest("Cena poprzednia musi być większa od 0.");
                    
                if (cena.HasValue && cenaPoprzednia.HasValue && cena >= cenaPoprzednia)
                    return BadRequest("Cena promocyjna powinna być niższa niż cena poprzednia.");

                // 7. Obsługa kategorii
                var kategoriaEntity = await GetOrCreateCategory(kategoria);

                // 8. Tworzenie oferty
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
                    DataDodania = DateTime.UtcNow,
                    LiczbaHot = 0,
                    LiczbaCold = 0,
                    Aktywna = true,
                    Zatwierdzona = false
                };

                _context.Oferty.Add(oferta);
                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateException dbEx)
                {
                    var inner = dbEx.InnerException?.Message;
                    return StatusCode(500, $"Błąd bazy danych (etap: oferta) : {dbEx.Message}{(inner != null ? " | Szczegóły: " + inner : string.Empty)}");
                }

                // 9. Obsługa zdjęć (walidacja podstawowa)
                if (zdjecia.Count > 0)
                {
                    const int MAX_FILES = 5;
                    const long MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
                    var allowedExt = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp" };

                    if (zdjecia.Count > MAX_FILES)
                        return BadRequest($"Maksymalnie {MAX_FILES} zdjęć.");

                    var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "oferty");
                    if (!Directory.Exists(uploadDir))
                        Directory.CreateDirectory(uploadDir);

                    int kolejnosc = 1;
                    foreach (var file in zdjecia)
                    {
                        if (file.Length == 0) continue;
                        if (file.Length > MAX_FILE_BYTES)
                            return BadRequest($"Plik {file.FileName} jest za duży (limit 5MB).");

                        var ext = Path.GetExtension(file.FileName);
                        if (string.IsNullOrEmpty(ext) || !allowedExt.Contains(ext))
                            return BadRequest($"Niedozwolony format pliku: {file.FileName}.");

                        // Opcjonalne sprawdzenie MIME (najprostsza weryfikacja)
                        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                            return BadRequest($"Plik {file.FileName} nie jest obrazem.");

                        var baseName = Path.GetFileNameWithoutExtension(file.FileName);
                        // Sanitizacja – tylko litery/cyfry
                        var safeBase = new string(baseName.Where(char.IsLetterOrDigit).ToArray());
                        if (string.IsNullOrWhiteSpace(safeBase)) safeBase = "img";
                        var fileName = $"{Guid.NewGuid()}_{safeBase}{ext.ToLowerInvariant()}";
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
                    try
                    {
                        await _context.SaveChangesAsync();
                    }
                    catch (DbUpdateException dbEx)
                    {
                        var inner = dbEx.InnerException?.Message;
                        return StatusCode(500, $"Błąd bazy danych (etap: zdjęcia) : {dbEx.Message}{(inner != null ? " | Szczegóły: " + inner : string.Empty)}");
                    }
                }

                // 10. Obsługa tagów
                if (!string.IsNullOrEmpty(tagi))
                {
                    try
                    {
                        await AddTagsToOffer(oferta.IdOferta, tagi);
                    }
                    catch (DbUpdateException dbEx)
                    {
                        var inner = dbEx.InnerException?.Message;
                        return StatusCode(500, $"Błąd bazy danych (etap: tagi) : {dbEx.Message}{(inner != null ? " | Szczegóły: " + inner : string.Empty)}");
                    }
                }

                // 11. Zwracanie wyniku
                var result = await CreateOfferResponse(oferta.IdOferta);
                return result != null ? Ok(result) : BadRequest("Błąd podczas tworzenia odpowiedzi");

            }
            catch (DbUpdateException dbEx)
            {
                var inner = dbEx.InnerException?.Message;
                return StatusCode(500, $"Błąd bazy danych: {dbEx.Message}{(inner != null ? " | Szczegóły: " + inner : string.Empty)}");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Błąd serwera: {ex.Message}{(ex.InnerException != null ? " | Szczegóły: " + ex.InnerException.Message : string.Empty)}");
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

        [Range(0.01, 999999.99, ErrorMessage = "Cena poprzednia musi być większa od 0")]
        public decimal? CenaPoprzednia { get; set; }

        [Required(ErrorMessage = "Kategoria jest wymagana")]
        [StringLength(50, ErrorMessage = "Nazwa kategorii nie może być dłuższa niż 50 znaków")]
        public string Kategoria { get; set; } = string.Empty;

    [StringLength(300, ErrorMessage = "Link nie może być dłuższy niż 300 znaków")]
        public string? Sklep { get; set; }

        [StringLength(50, ErrorMessage = "Kod nie może być dłuższy niż 50 znaków")]
        public string? Kod { get; set; }

        [StringLength(200, ErrorMessage = "Tagi nie mogą być dłuższe niż 200 znaków")]
        public string? Tagi { get; set; }

        [RegularExpression("^(okazja|kupon)$", ErrorMessage = "Typ musi być 'okazja' lub 'kupon'")]
        public string Typ { get; set; } = "okazja";
    }

    public class CreateCommentRequest
    {
        [Required]
        [StringLength(2000, ErrorMessage = "Komentarz nie może być dłuższy niż 2000 znaków")]
        public string Tresc { get; set; } = string.Empty;
    public int? ParentId { get; set; }
    }

    public class CommentVoteRequest
    {
        [Required]
        [RegularExpression("^(up|down)$", ErrorMessage = "Typ musi być 'up' lub 'down'")]
        public string Typ { get; set; } = "up";
    }
}
