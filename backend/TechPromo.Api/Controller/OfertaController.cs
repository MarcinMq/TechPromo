using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Data;
using TechPromo.Api.Model;
using TechPromo.Api.DTO;
using TechPromo.Api.Services;
using TechPromo.Api.Search.Services;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;
using System.IO;

namespace TechPromo.Api.Controllers
{
    // Kontroler ofert
    [ApiController]
    [Route("api/[controller]")]
    [Route("[controller]")]
    public class OfertaController : ControllerBase
    {
        private readonly TechPromoDbContext _context;
        private readonly UserManager<Uzytkownik> _userManager;
        private readonly IBadgeService _badgeService;
        private readonly SerwisSync? _syncService;
        private readonly ISerwisWykrywaniaDuplikatow _serwisWykrywaniaDuplikatow;

        public OfertaController(
            TechPromoDbContext context, 
            UserManager<Uzytkownik> userManager, 
            IBadgeService badgeService,
            ISerwisWykrywaniaDuplikatow serwisWykrywaniaDuplikatow,
            SerwisSync? syncService = null)
        {
            _context = context;
            _userManager = userManager;
            _badgeService = badgeService;
            _syncService = syncService;
            _serwisWykrywaniaDuplikatow = serwisWykrywaniaDuplikatow;
        }

        #region Metody pomocnicze

        // ID bieżącego użytkownika
        private int GetCurrentUserId()
        {
            if (User.Identity?.IsAuthenticated != true) return 0;
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        // Synchronizuj ofertę z Azure Search - synchronicznie
        private async Task SyncOfertaToAzureSearch(int ofertaId)
        {
            if (_syncService != null)
            {
                await _syncService.SynchronizujOferteAsync(ofertaId);
            }
        }

        // Usuń ofertę z Azure Search - synchronicznie
        private async Task RemoveOfertaFromAzureSearch(int ofertaId)
        {
            if (_syncService != null)
            {
                await _syncService.UsunOferteZIndeksuAsync(ofertaId);
            }
        }

        // URL awatara użytkownika
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
                return null;
            }
        }

        private static (decimal? cena, decimal? cenaPoprzednia) ParsePrices(string? cenaString, string? cenaPoprzeniaString)
        {
            decimal? cena = null;
            decimal? cenaPoprzednia = null;

            if (!string.IsNullOrEmpty(cenaString))
            {
                if (decimal.TryParse(cenaString, System.Globalization.NumberStyles.Number, 
                    System.Globalization.CultureInfo.InvariantCulture, out var parsedCena))
                {
                    cena = parsedCena;
                }
                else if (decimal.TryParse(cenaString, out var parsedCenaLocal))
                {
                    cena = parsedCenaLocal;
                }
            }

            if (!string.IsNullOrEmpty(cenaPoprzeniaString))
            {
                if (decimal.TryParse(cenaPoprzeniaString, System.Globalization.NumberStyles.Number, 
                    System.Globalization.CultureInfo.InvariantCulture, out var parsedCenaPoprzednia))
                {
                    cenaPoprzednia = parsedCenaPoprzednia;
                }
                else if (decimal.TryParse(cenaPoprzeniaString, out var parsedCenaPoprzeniaLocal))
                {
                    cenaPoprzednia = parsedCenaPoprzeniaLocal;
                }
            }

            return (cena, cenaPoprzednia);
        }

        private static string ValidatePrices(decimal? cena, decimal? cenaPoprzednia)
        {
            // Cena może być 0 (za darmo) lub większa od 0
            if (cena.HasValue && cena < 0)
                return "Cena nie może być ujemna.";
                
            if (cenaPoprzednia.HasValue && cenaPoprzednia <= 0)
                return "Cena poprzednia musi być większa od 0.";
                
            // Sprawdź relację cen tylko jeśli cena promocyjna > 0 (nie dotyczy ofert za darmo)
            if (cena.HasValue && cena > 0 && cenaPoprzednia.HasValue && cena >= cenaPoprzednia)
                return "Cena promocyjna powinna być niższa niż cena poprzednia.";

            return string.Empty;
        }

        private static string NormalizeOfferType(string? typ)
        {
            return !string.IsNullOrEmpty(typ) && 
                   (typ.ToLower() == "kupon" || typ.ToLower() == "okazja") 
                   ? typ.ToLower() : "okazja";
        }

        private OfertaDto CreateOfertaDto(Oferta oferta, int currentUserId)
        {
            return new OfertaDto
            {
                Id = oferta.IdOferta,
                Tytul = oferta.Nazwa,
                Opis = oferta.Opis,
                Typ = oferta.Typ,
                Cena = oferta.Cena,
                CenaPoprzednia = oferta.CenaPoprzednia,
                Kod = oferta.Kod,
                Sklep = oferta.Link,
                Kategoria = oferta.Kategoria?.Nazwa ?? "Inne",
                Tagi = oferta.OfertaTagi.Select(ot => ot.Tag.Nazwa).ToList(),
                Autor = oferta.Uzytkownik.UserName ?? "Nieznany",
                DataUtworzenia = oferta.DataDodania.ToString("dd.MM.yyyy HH:mm"),
                WaznoscOd = oferta.WaznoscOd,
                WaznoscDo = oferta.WaznoscDo,
                Votes = new VotesDto { Hot = oferta.LiczbaHot, Cold = oferta.LiczbaCold },
                Komentarze = oferta.Komentarze.Count,
                UserVote = currentUserId != 0 ? oferta.Glosy.Where(g => g.IdUzytkownik == currentUserId).Select(g => g.TypGlosu).FirstOrDefault() : null,
                Zdjecia = oferta.Zdjecia.OrderBy(z => z.Kolejnosc).Select(z => z.UrlZdjecia).ToList(),
                AutorAvatarUrl = BuildAutorAvatarAbsoluteUrl(oferta.IdUzytkownik)
            };
        }

        private async Task<Kategoria> GetOrCreateCategory(string nazwaKategorii)
        {
            var raw = (nazwaKategorii ?? string.Empty).Trim();
            if (raw.Length == 0) raw = "Inne";
            var normalized = char.ToUpper(raw[0]) + (raw.Length > 1 ? raw.Substring(1) : string.Empty);
            var lower = raw.ToLower();

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

        private async Task AddTagsToOffer(int ofertaId, string tagiString)
        {
            var tagNames = tagiString.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(t => t.Trim())
                .Where(t => !string.IsNullOrEmpty(t) && t.Length <= 50)
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

                var existingConnection = await _context.OfertaTagi
                    .FirstOrDefaultAsync(ot => ot.IdOferta == ofertaId && ot.IdTag == tag.IdTag);
                    
                if (existingConnection == null)
                {
                    _context.OfertaTagi.Add(new OfertaTag { IdOferta = ofertaId, IdTag = tag.IdTag });
                }
            }
            await _context.SaveChangesAsync();
        }

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
                        WaznoscOd = o.WaznoscOd,
                        WaznoscDo = o.WaznoscDo,
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

        private FormDataModel ExtractFormData()
        {
            return new FormDataModel
            {
                Tytul = Request.Form["tytul"].ToString().Trim(),
                Opis = Request.Form["opis"].ToString().Trim(),
                Kategoria = Request.Form["kategoria"].ToString().Trim(),
                Typ = Request.Form["typ"].ToString().Trim(),
                CenaString = Request.Form["cena"].ToString(),
                CenaPoprzeniaString = Request.Form["cenaPoprzednia"].ToString(),
                Kod = Request.Form["kod"].ToString().Trim(),
                Sklep = Request.Form["sklep"].ToString().Trim(),
                Tagi = Request.Form["tagi"].ToString().Trim(),
                Zdjecia = Request.Form.Files.GetFiles("zdjecia").ToList()
            };
        }

        private static string ValidateFormData(FormDataModel data)
        {
            if (string.IsNullOrEmpty(data.Tytul))
                return "Tytuł jest wymagany.";
            if (string.IsNullOrEmpty(data.Opis))
                return "Opis jest wymagany.";
            if (string.IsNullOrEmpty(data.Kategoria))
                return "Kategoria jest wymagana.";

            if (data.Tytul.Length > 100) return "Tytuł nie może być dłuższy niż 100 znaków.";
            if (data.Opis.Length > 2000) return "Opis nie może być dłuższy niż 2000 znaków.";
            if (data.Kategoria.Length > 50) return "Kategoria nie może być dłuższa niż 50 znaków.";
            if (!string.IsNullOrEmpty(data.Sklep) && data.Sklep.Length > 300) return "Link nie może być dłuższy niż 300 znaków.";
            if (!string.IsNullOrEmpty(data.Kod) && data.Kod.Length > 50) return "Kod nie może być dłuższy niż 50 znaków.";
            if (!string.IsNullOrEmpty(data.Tagi) && data.Tagi.Length > 200) return "Tagi nie mogą być dłuższe niż 200 znaków.";

            return string.Empty;
        }

        private async Task<string> ProcessImageUploads(int ofertaId, List<IFormFile> zdjecia)
        {
            const int MAX_FILES = 5;
            const long MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
            var allowedExt = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp" };

            if (zdjecia.Count > MAX_FILES)
                return $"Maksymalnie {MAX_FILES} zdjęć.";

            var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "oferty");
            if (!Directory.Exists(uploadDir))
                Directory.CreateDirectory(uploadDir);

            int kolejnosc = 1;
            foreach (var file in zdjecia)
            {
                if (file.Length == 0) continue;
                if (file.Length > MAX_FILE_BYTES)
                    return $"Plik {file.FileName} jest za duży (limit 5MB).";

                var ext = Path.GetExtension(file.FileName);
                if (string.IsNullOrEmpty(ext) || !allowedExt.Contains(ext))
                    return $"Niedozwolony format pliku: {file.FileName}.";

                if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                    return $"Plik {file.FileName} nie jest obrazem.";

                var baseName = Path.GetFileNameWithoutExtension(file.FileName);
                var safeBase = new string(baseName.Where(char.IsLetterOrDigit).ToArray());
                if (string.IsNullOrWhiteSpace(safeBase)) safeBase = "img";
                var fileName = $"{Guid.NewGuid()}_{safeBase}{ext.ToLowerInvariant()}";
                var filePath = Path.Combine(uploadDir, fileName);

                using var stream = new FileStream(filePath, FileMode.Create);
                await file.CopyToAsync(stream);

                _context.OfertyZdjecia.Add(new OfertaZdjecie
                {
                    IdOferta = ofertaId,
                    UrlZdjecia = $"/uploads/oferty/{fileName}",
                    Kolejnosc = kolejnosc++
                });
            }
            
            await _context.SaveChangesAsync();
            return string.Empty;
        }

        #endregion

        #region Endpointy API

        // Lista ofert z filtrowaniem
        [HttpGet]
        public async Task<ActionResult<PagedResult<OfertaDto>>> GetOffers(
            [FromQuery] string? kategoria = null,
            [FromQuery] string? tag = null,
            [FromQuery] string? sortBy = "newest",
            [FromQuery] int skip = 0,
            [FromQuery] int take = 30)
        {
            if (take > 100) take = 100;
            
            var query = _context.Oferty
                .Where(o => o.Aktywna && o.Zatwierdzona)
                .Include(o => o.Uzytkownik)
                .Include(o => o.Kategoria)
                .Include(o => o.Zdjecia)
                .Include(o => o.OfertaTagi).ThenInclude(ot => ot.Tag)
                .Include(o => o.Glosy)
                .Include(o => o.Komentarze)
                .AsQueryable();

            // Filtrowanie
            if (!string.IsNullOrEmpty(kategoria))
            {
                var katLower = kategoria.ToLower();
                query = query.Where(o => o.Kategoria != null && o.Kategoria.Nazwa.ToLower() == katLower);
            }

            if (!string.IsNullOrEmpty(tag))
            {
                query = query.Where(o => o.OfertaTagi.Any(ot => ot.Tag.Nazwa.Contains(tag)));
            }

            // Sortowanie
            query = sortBy switch
            {
                "hot" => query.OrderByDescending(o => o.LiczbaHot - o.LiczbaCold),
                "price" => query.OrderBy(o => o.Cena ?? decimal.MaxValue),
                _ => query.OrderByDescending(o => o.DataDodania)
            };

            var userId = GetCurrentUserId();
            var total = await query.CountAsync();

            var offers = await query
                .Skip(skip)
                .Take(take)
                .ToListAsync();

            var result = new PagedResult<OfertaDto>
            {
                Items = offers.Select(o => CreateOfertaDto(o, userId)).ToList(),
                Total = total,
                Skip = skip,
                Take = take
            };

            return Ok(result);
        }

        // Szczegóły pojedynczej oferty
        [HttpGet("{id}")]
        public async Task<ActionResult<OfertaDto>> GetOffer(int id)
        {
            var userId = GetCurrentUserId();
            var bypassRoles = User.IsInRole("Admin") || User.IsInRole("Moderator");

            var oferta = await _context.Oferty
                .Where(o => o.IdOferta == id && (o.Aktywna && o.Zatwierdzona || bypassRoles || o.IdUzytkownik == userId))
                .Include(o => o.Uzytkownik)
                .Include(o => o.Kategoria)
                .Include(o => o.Zdjecia)
                .Include(o => o.OfertaTagi).ThenInclude(ot => ot.Tag)
                .Include(o => o.Glosy)
                .Include(o => o.Komentarze)
                .FirstOrDefaultAsync();

            if (oferta == null)
                return NotFound("Oferta nie została znaleziona.");

            var dto = CreateOfertaDto(oferta, userId);
            
            // Dodaj informację o statusie do nagłówka odpowiedzi
            if (!oferta.Zatwierdzona)
                Response.Headers["X-Draft"] = "true";

            return Ok(dto);
        }

        // Dodaj komentarz do oferty
        [HttpPost("{id}/komentarze")]
        [Authorize]
        public async Task<ActionResult<KomentarzDto>> AddComment(int id, [FromBody] CreateCommentRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Tresc))
                return BadRequest("Treść komentarza jest wymagana.");

            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            var oferta = await _context.Oferty.FirstOrDefaultAsync(o => o.IdOferta == id && o.Aktywna && o.Zatwierdzona);
            if (oferta == null)
                return NotFound("Oferta nie istnieje lub nie została zatwierdzona.");

            // Walidacja rodzica (opcjonalna)
            if (request.ParentId.HasValue)
            {
                var parent = await _context.Komentarze.FirstOrDefaultAsync(k => k.IdKomentarz == request.ParentId.Value);
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

            // Dodaj punkty użytkownikowi
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user != null)
            {
                user.Punkty += 2;
                await _userManager.UpdateAsync(user);
            }

            await _context.SaveChangesAsync();
            await _badgeService.EvaluateForUserAsync(userId);

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
                .Take(50)
                .ToListAsync();

            return Ok(tags);
        }

        // GET: api/oferta/{id}/komentarze
        [HttpGet("{id}/komentarze")]
        public async Task<ActionResult<PagedResult<KomentarzDto>>> GetOfferComments(
            int id,
            [FromQuery] int skip = 0,
            [FromQuery] int take = 20,
            [FromQuery] string sort = "newest")
        {
            if (take > 100) take = 100;
            
            var baseQuery = _context.Komentarze.Where(k => k.IdOferta == id);
            var total = await baseQuery.CountAsync();
            var userId = GetCurrentUserId();

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

            return Ok(new PagedResult<KomentarzDto>
            {
                Items = items,
                Total = total,
                Skip = skip,
                Take = take
            });
        }

        [HttpPost("komentarz/{id}/glos")]
        [Authorize]
        public async Task<ActionResult> VoteComment(int id, [FromBody] CommentVoteRequest request)
        {
            if (request == null || (request.Typ != "up" && request.Typ != "down"))
                return BadRequest("Nieprawidłowy typ głosu.");

            var userId = GetCurrentUserId();
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

        #endregion

        // POST: api/oferta/sprawdz-duplikaty
        [HttpPost("sprawdz-duplikaty")]
        [Authorize]
        public async Task<ActionResult<WynikSprawdzaniaDuplikatow>> SprawdzDuplikaty([FromBody] SprawdzDuplikatyRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Nazwa))
                {
                    return BadRequest("Nazwa oferty jest wymagana.");
                }

                var wynik = await _serwisWykrywaniaDuplikatow.SprawdzDuplikatyAsync(
                    nazwa: request.Nazwa,
                    link: request.Link,
                    sklep: null, // Brak pola sklep w modelu
                    cena: request.Cena
                );

                return Ok(wynik);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Błąd podczas sprawdzania duplikatów", details = ex.Message });
            }
        }

        // POST: api/oferta
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<OfertaDto>> CreateOffer([FromBody] CreateOfferRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                    return Unauthorized("Użytkownik nie jest zalogowany.");

                // Walidacja podstawowa
                if (string.IsNullOrWhiteSpace(request.Tytul))
                    return BadRequest("Tytuł jest wymagany.");
                if (string.IsNullOrWhiteSpace(request.Opis))
                    return BadRequest("Opis jest wymagany.");
                if (string.IsNullOrWhiteSpace(request.Kategoria))
                    return BadRequest("Kategoria jest wymagana.");

                // Walidacja cen
                var priceValidation = ValidatePrices(request.Cena, request.CenaPoprzednia);
                if (!string.IsNullOrEmpty(priceValidation))
                    return BadRequest(priceValidation);

                var typ = NormalizeOfferType(request.Typ);
                var kategoria = await GetOrCreateCategory(request.Kategoria);

                // Sprawdź czy użytkownik jest moderatorem/adminem
                var isModerator = User.IsInRole("Moderator");
                var isAdmin = User.IsInRole("Admin");

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
                    Zatwierdzona = isModerator || isAdmin, // Moderatorzy i admini mają auto-zatwierdzenie
                    LiczbaHot = 0,
                    LiczbaCold = 0
                };

                _context.Oferty.Add(oferta);
                await _context.SaveChangesAsync();

                if (!string.IsNullOrWhiteSpace(request.Tagi))
                {
                    await AddTagsToOffer(oferta.IdOferta, request.Tagi);
                }

                // Synchronizuj z Azure Search jeśli oferta jest zatwierdzona i aktywna
                if (oferta.Zatwierdzona && oferta.Aktywna)
                {
                    await SyncOfertaToAzureSearch(oferta.IdOferta);
                }

                var result = await CreateOfferResponse(oferta.IdOferta);
                return CreatedAtAction(nameof(GetOffer), new { id = oferta.IdOferta }, result);
            }
            catch (Exception ex)
            {
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

        // POST: api/oferta/upload
        [HttpPost("upload")]
        [Authorize]
        public async Task<ActionResult<OfertaDto>> CreateOfferWithFiles()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                    return Unauthorized("Użytkownik nie jest zalogowany.");

                // Pobranie danych z FormData
                var formData = ExtractFormData();
                
                // Walidacja podstawowa
                var validation = ValidateFormData(formData);
                if (!string.IsNullOrEmpty(validation))
                    return BadRequest(validation);

                // Parsowanie i walidacja cen
                var (cena, cenaPoprzednia) = ParsePrices(formData.CenaString, formData.CenaPoprzeniaString);
                var priceValidation = ValidatePrices(cena, cenaPoprzednia);
                if (!string.IsNullOrEmpty(priceValidation))
                    return BadRequest(priceValidation);

                var typ = NormalizeOfferType(formData.Typ);
                var kategoriaEntity = await GetOrCreateCategory(formData.Kategoria);

                // Sprawdź czy użytkownik jest moderatorem/adminem
                var isModerator = User.IsInRole("Moderator");
                var isAdmin = User.IsInRole("Admin");

                var oferta = new Oferta
                {
                    Nazwa = formData.Tytul,
                    Opis = formData.Opis,
                    Typ = typ,
                    Cena = cena,
                    CenaPoprzednia = cenaPoprzednia,
                    Kod = !string.IsNullOrEmpty(formData.Kod) ? formData.Kod : null,
                    Link = !string.IsNullOrEmpty(formData.Sklep) ? formData.Sklep : string.Empty,
                    IdKategoria = kategoriaEntity.IdKategoria,
                    IdUzytkownik = userId,
                    DataDodania = DateTime.UtcNow,
                    LiczbaHot = 0,
                    LiczbaCold = 0,
                    Aktywna = true,
                    Zatwierdzona = isModerator || isAdmin // Moderatorzy i admini mają auto-zatwierdzenie
                };

                _context.Oferty.Add(oferta);
                await _context.SaveChangesAsync();

                // Obsługa zdjęć
                if (formData.Zdjecia.Count > 0)
                {
                    var uploadResult = await ProcessImageUploads(oferta.IdOferta, formData.Zdjecia);
                    if (!string.IsNullOrEmpty(uploadResult))
                        return BadRequest(uploadResult);
                }

                // Obsługa tagów
                if (!string.IsNullOrEmpty(formData.Tagi))
                {
                    await AddTagsToOffer(oferta.IdOferta, formData.Tagi);
                }

                var result = await CreateOfferResponse(oferta.IdOferta);
                return result != null ? Ok(result) : BadRequest("Błąd podczas tworzenia odpowiedzi");

            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Błąd serwera: {ex.Message}");
            }
        }

        // PUT: api/oferta/{id}/upload - Edycja oferty z plikami
        [HttpPut("{id}/upload")]
        [Authorize]
        public async Task<ActionResult<OfertaDto>> UpdateOfferWithFiles(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0)
                    return Unauthorized("Użytkownik nie jest zalogowany.");

                // Sprawdź czy oferta istnieje
                var oferta = await _context.Oferty.FindAsync(id);
                if (oferta == null)
                    return NotFound("Oferta nie została znaleziona.");

                // Sprawdź uprawnienia
                var isOwner = oferta.IdUzytkownik == userId;
                var isModerator = User.IsInRole("Moderator");
                var isAdmin = User.IsInRole("Admin");

                if (!isOwner && !isModerator && !isAdmin)
                    return Forbid("Brak uprawnień do edycji tej oferty.");

                // Pobranie danych z FormData
                var formData = ExtractFormData();
                
                // Walidacja podstawowa
                var validation = ValidateFormData(formData);
                if (!string.IsNullOrEmpty(validation))
                    return BadRequest(validation);

                // Parsowanie i walidacja cen
                var (cena, cenaPoprzednia) = ParsePrices(formData.CenaString, formData.CenaPoprzeniaString);
                var priceValidation = ValidatePrices(cena, cenaPoprzednia);
                if (!string.IsNullOrEmpty(priceValidation))
                    return BadRequest(priceValidation);

                // Sprawdź czy kategoria istnieje lub utwórz nową
                var typ = NormalizeOfferType(formData.Typ);
                var kategoriaEntity = await GetOrCreateCategory(formData.Kategoria);

                // Aktualizuj ofertę
                oferta.Nazwa = formData.Tytul;
                oferta.Opis = formData.Opis;
                oferta.Typ = typ;
                oferta.Cena = cena;
                oferta.CenaPoprzednia = cenaPoprzednia;
                oferta.Kod = !string.IsNullOrEmpty(formData.Kod) ? formData.Kod : null;
                oferta.Link = !string.IsNullOrEmpty(formData.Sklep) ? formData.Sklep : string.Empty;
                oferta.IdKategoria = kategoriaEntity.IdKategoria;

                // Logika zatwierdzenia:
                // - Jeśli zwykły użytkownik edytuje swoją ofertę -> wymaga ponownej moderacji
                // - Jeśli moderator/admin edytuje jakąkolwiek ofertę -> nie wymaga zatwierdzenia
                if (isOwner && !isModerator && !isAdmin)
                {
                    // Zwykły użytkownik edytuje swoją ofertę - wymaga ponownej moderacji
                    oferta.Zatwierdzona = false;
                    oferta.Aktywna = true;
                }
                else
                {
                    // Moderator/Admin edytuje ofertę - nie wymaga zatwierdzenia
                    oferta.Zatwierdzona = true;
                    oferta.Aktywna = true;
                }

                await _context.SaveChangesAsync();

                // Obsługa zdjęć
                if (formData.Zdjecia.Count > 0)
                {
                    await ProcessImageUploads(oferta.IdOferta, formData.Zdjecia);
                }

                // Obsługa tagów
                if (!string.IsNullOrEmpty(formData.Tagi))
                {
                    // Usuń stare tagi
                    var stareTagi = await _context.OfertaTagi.Where(to => to.IdOferta == oferta.IdOferta).ToListAsync();
                    _context.OfertaTagi.RemoveRange(stareTagi);
                    await _context.SaveChangesAsync();

                    // Dodaj nowe tagi
                    await AddTagsToOffer(oferta.IdOferta, formData.Tagi);
                }

                var result = await CreateOfferResponse(oferta.IdOferta);
                return result != null ? Ok(result) : BadRequest("Błąd podczas tworzenia odpowiedzi");

            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Błąd serwera: {ex.Message}");
            }
        }
    }

    // DTO dla tworzenia ofert
    public class CreateOfferRequest
    {
        [Required(ErrorMessage = "Tytuł jest wymagany")]
        [StringLength(100, ErrorMessage = "Tytuł nie może być dłuższy niż 100 znaków")]
        public string Tytul { get; set; } = string.Empty;

        [Required(ErrorMessage = "Opis jest wymagany")]
        [StringLength(2000, ErrorMessage = "Opis nie może być dłuższy niż 2000 znaków")]
        public string Opis { get; set; } = string.Empty;

        [Range(0, 999999.99, ErrorMessage = "Cena nie może być ujemna")]
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

    public class FormDataModel
    {
        public string Tytul { get; set; } = string.Empty;
        public string Opis { get; set; } = string.Empty;
        public string Kategoria { get; set; } = string.Empty;
        public string Typ { get; set; } = string.Empty;
        public string CenaString { get; set; } = string.Empty;
        public string CenaPoprzeniaString { get; set; } = string.Empty;
        public string Kod { get; set; } = string.Empty;
        public string Sklep { get; set; } = string.Empty;
        public string Tagi { get; set; } = string.Empty;
        public List<IFormFile> Zdjecia { get; set; } = new();
    }
}
