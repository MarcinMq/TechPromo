using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Data;
using TechPromo.Api.DTO;
using TechPromo.Api.Model;
using System.Security.Claims;

namespace TechPromo.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UzytkownikController : ControllerBase
    {
        private readonly TechPromoDbContext _context;
        private readonly UserManager<Uzytkownik> _userManager;
        private readonly IWebHostEnvironment _environment;

        public UzytkownikController(TechPromoDbContext context, UserManager<Uzytkownik> userManager, IWebHostEnvironment environment)
        {
            _context = context;
            _userManager = userManager;
            _environment = environment;
        }

        // GET: api/uzytkownik/aktywnosc
        [HttpGet("aktywnosc")]
        public async Task<ActionResult<IEnumerable<AktywnoscDto>>> GetUserActivity()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            var activities = new List<AktywnoscDto>();

            // Dodane oferty
            var offers = await _context.Oferty
                .Where(o => o.IdUzytkownik == userId)
                .OrderByDescending(o => o.DataDodania)
                .Take(20)
                .Select(o => new AktywnoscDto
                {
                    Id = o.IdOferta,
                    Typ = "oferta",
                    Opis = $"Dodałeś ofertę: {o.Nazwa}",
                    Data = o.DataDodania.ToString("dd.MM.yyyy HH:mm"),
                    Punkty = 10
                })
                .ToListAsync();

            activities.AddRange(offers);

            // Komentarze
            var comments = await _context.Komentarze
                .Where(k => k.IdUzytkownik == userId)
                .OrderByDescending(k => k.DataDodania)
                .Take(20)
                .Include(k => k.Oferta)
                .Select(k => new AktywnoscDto
                {
                    Id = k.IdKomentarz,
                    Typ = "komentarz",
                    Opis = $"Skomentowałeś ofertę: {k.Oferta.Nazwa}",
                    Data = k.DataDodania.ToString("dd.MM.yyyy HH:mm"),
                    Punkty = 2
                })
                .ToListAsync();

            activities.AddRange(comments);

            // Głosy
            var votes = await _context.Glosy
                .Where(g => g.IdUzytkownik == userId)
                .OrderByDescending(g => g.DataGlosu)
                .Take(20)
                .Include(g => g.Oferta)
                .Select(g => new AktywnoscDto
                {
                    Id = g.IdGlos,
                    Typ = "glos",
                    Opis = $"Zagłosowałeś '{g.TypGlosu}' na ofertę: {g.Oferta.Nazwa}",
                    Data = g.DataGlosu.ToString("dd.MM.yyyy HH:mm"),
                    Punkty = 1
                })
                .ToListAsync();

            activities.AddRange(votes);

            // Odznaki
            var badges = await _context.UzytkownikOdznaki
                .Where(uo => uo.IdUzytkownik == userId)
                .OrderByDescending(uo => uo.DataPrzyznania)
                .Include(uo => uo.Odznaka)
                .Select(uo => new AktywnoscDto
                {
                    Id = uo.IdOdznaka,
                    Typ = "odznaka",
                    Opis = $"Otrzymałeś odznakę: {uo.Odznaka.Nazwa}",
                    Data = uo.DataPrzyznania.ToString("dd.MM.yyyy HH:mm"),
                    Punkty = 50
                })
                .ToListAsync();

            activities.AddRange(badges);

            return Ok(activities.OrderByDescending(a => DateTime.Parse(a.Data)).Take(50));
        }

        // GET: api/uzytkownik/odznaki
        [HttpGet("odznaki")]
        public async Task<ActionResult<IEnumerable<OdznakaDto>>> GetUserBadges()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            var badges = await _context.UzytkownikOdznaki
                .Where(uo => uo.IdUzytkownik == userId)
                .Include(uo => uo.Odznaka)
                .Select(uo => new OdznakaDto
                {
                    idOdznaka = uo.Odznaka.IdOdznaka,
                    nazwa = uo.Odznaka.Nazwa,
                    opis = uo.Odznaka.Opis,
                    ikona = uo.Odznaka.Ikona,
                    dataPrzyznania = uo.DataPrzyznania.ToString("dd.MM.yyyy")
                })
                .OrderByDescending(o => DateTime.Parse(o.dataPrzyznania))
                .ToListAsync();

            return Ok(badges);
        }

        // GET: api/uzytkownik/komentarze
        [HttpGet("komentarze")]
        public async Task<ActionResult<IEnumerable<KomentarzDto>>> GetUserComments()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            var comments = await _context.Komentarze
                .Where(k => k.IdUzytkownik == userId)
                .Include(k => k.Oferta)
                .Include(k => k.Uzytkownik)
                .OrderByDescending(k => k.DataDodania)
                .Select(k => new KomentarzDto
                {
                    Id = k.IdKomentarz,
                    Tresc = k.Tresc,
                    Oferta = k.Oferta.Nazwa,
                    Data = k.DataDodania.ToString("dd.MM.yyyy HH:mm"),
                    Autor = k.Uzytkownik.UserName ?? "Nieznany" // Używamy UserName zamiast Nick
                })
                .ToListAsync();

            return Ok(comments);
        }

        // GET: api/uzytkownik/oferty
        [HttpGet("oferty")]
        public async Task<ActionResult<IEnumerable<OfertaDto>>> GetUserOffers(
            [FromQuery] string? kategoria = null,
            [FromQuery] string? tag = null,
            [FromQuery] string? sortBy = "newest")
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            var query = _context.Oferty
                .Where(o => o.IdUzytkownik == userId)
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
                "cold" => query.OrderBy(o => o.LiczbaHot - o.LiczbaCold),
                "comments" => query.OrderByDescending(o => o.Komentarze.Count),
                "newest" => query.OrderByDescending(o => o.DataDodania),
                "oldest" => query.OrderBy(o => o.DataDodania),
                _ => query.OrderByDescending(o => o.DataDodania)
            };

            var offers = await query
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
                    Zdjecia = o.Zdjecia.OrderBy(z => z.Kolejnosc).Select(z => z.UrlZdjecia).ToList()
                })
                .ToListAsync();

            return Ok(offers);
        }

        // GET: api/uzytkownik/oferta/{id}  (pojedyncza oferta właściciela do edycji)
        [HttpGet("oferta/{id}")]
        public async Task<ActionResult<OfertaDto>> GetOwnOffer(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var o = await _context.Oferty
                .Include(x => x.Kategoria)
                .Include(x => x.Zdjecia)
                .Include(x => x.OfertaTagi).ThenInclude(ot => ot.Tag)
                .FirstOrDefaultAsync(x => x.IdOferta == id && x.IdUzytkownik == userId);
            if (o == null) return NotFound();
            var dto = new OfertaDto
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
                Tagi = o.OfertaTagi.Select(t => t.Tag.Nazwa).ToList(),
                Autor = User.Identity?.Name ?? "Ty",
                DataUtworzenia = o.DataDodania.ToString("dd.MM.yyyy HH:mm"),
                Votes = new VotesDto { Hot = o.LiczbaHot, Cold = o.LiczbaCold },
                Komentarze = o.Komentarze.Count,
                Zdjecia = o.Zdjecia.OrderBy(z => z.Kolejnosc).Select(z => z.UrlZdjecia).ToList()
            };
            return Ok(dto);
        }

        // POST: api/uzytkownik/oferta
        [HttpPost("oferta")]
        public async Task<ActionResult> CreateOffer([FromForm] UtworzOfertaDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            // Znajdź lub utwórz kategorię
            var kategoria = await _context.Kategorie
                .FirstOrDefaultAsync(k => k.Nazwa == dto.Kategoria);
            
            if (kategoria == null)
            {
                kategoria = new Kategoria { Nazwa = dto.Kategoria };
                _context.Kategorie.Add(kategoria);
                await _context.SaveChangesAsync();
            }

            var oferta = new Oferta
            {
                Nazwa = dto.Tytul,
                Opis = dto.Opis,
                Cena = dto.Cena,
                Link = dto.Sklep, // Tymczasowo używamy Link jako sklep
                IdUzytkownik = userId,
                IdKategoria = kategoria.IdKategoria,
                DataDodania = DateTime.UtcNow,
                Zatwierdzona = false,
                Aktywna = true
            };

            _context.Oferty.Add(oferta);
            await _context.SaveChangesAsync();

            // Dodaj zdjęcia jeśli zostały przesłane
            if (dto.Zdjecia != null && dto.Zdjecia.Any())
            {
                var uploadsPath = Path.Combine(_environment.WebRootPath, "uploads", "oferty");
                Directory.CreateDirectory(uploadsPath);

                for (int i = 0; i < dto.Zdjecia.Count; i++)
                {
                    var file = dto.Zdjecia[i];
                    if (file.Length > 0)
                    {
                        var fileName = $"{oferta.IdOferta}_{i}_{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                        var filePath = Path.Combine(uploadsPath, fileName);

                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }

                        var zdjecie = new OfertaZdjecie
                        {
                            IdOferta = oferta.IdOferta,
                            UrlZdjecia = $"/uploads/oferty/{fileName}",
                            Kolejnosc = i + 1
                        };

                        _context.OfertyZdjecia.Add(zdjecie);
                    }
                }
            }

            // Dodaj tagi
            if (!string.IsNullOrEmpty(dto.Tagi))
            {
                var tagNames = dto.Tagi.Split(',')
                    .Select(t => t.Trim())
                    .Where(t => !string.IsNullOrEmpty(t))
                    .Distinct();

                foreach (var tagName in tagNames)
                {
                    var tag = await _context.Tagi.FirstOrDefaultAsync(t => t.Nazwa == tagName);
                    if (tag == null)
                    {
                        tag = new Tag { Nazwa = tagName };
                        _context.Tagi.Add(tag);
                        await _context.SaveChangesAsync();
                    }

                    var ofertaTag = new OfertaTag
                    {
                        IdOferta = oferta.IdOferta,
                        IdTag = tag.IdTag
                    };

                    _context.OfertaTagi.Add(ofertaTag);
                }
            }

            await _context.SaveChangesAsync();

            // Dodaj punkty użytkownikowi za dodanie oferty
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user != null)
            {
                user.Punkty += 10;
                await _userManager.UpdateAsync(user);
            }

            return Ok("Oferta została dodana pomyślnie i oczekuje na moderację.");
        }

        // POST: api/uzytkownik/oferta/{id}/glos
        [HttpPost("oferta/{id}/glos")]
        [Authorize]
        public async Task<ActionResult> VoteOffer(int id, [FromBody] GlosDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var oferta = await _context.Oferty.FindAsync(id);
            if (oferta == null)
            {
                return NotFound("Oferta nie została znaleziona.");
            }

            // Sprawdź czy użytkownik już głosował
            var existingVote = await _context.Glosy
                .FirstOrDefaultAsync(g => g.IdOferta == id && g.IdUzytkownik == userId);

            if (existingVote != null)
            {
                // Usuń poprzedni głos
                if (existingVote.TypGlosu == "hot")
                    oferta.LiczbaHot--;
                else
                    oferta.LiczbaCold--;

                _context.Glosy.Remove(existingVote);
            }

            // Dodaj nowy głos jeśli różni się od poprzedniego
            if (existingVote == null || existingVote.TypGlosu != dto.Typ)
            {
                var newVote = new Glos
                {
                    IdOferta = id,
                    IdUzytkownik = userId,
                    TypGlosu = dto.Typ,
                    DataGlosu = DateTime.UtcNow
                };

                _context.Glosy.Add(newVote);

                if (dto.Typ == "hot")
                    oferta.LiczbaHot++;
                else
                    oferta.LiczbaCold++;

                // Dodaj punkt użytkownikowi za głosowanie
                var user = await _userManager.FindByIdAsync(userId.ToString());
                if (user != null)
                {
                    user.Punkty += 1;
                    await _userManager.UpdateAsync(user);
                }
            }

            await _context.SaveChangesAsync();
            return Ok("Głos został zapisany.");
        }

        // POST: api/uzytkownik/oferta/{id}/komentarz
        [HttpPost("oferta/{id}/komentarz")]
        public async Task<ActionResult> AddComment(int id, [FromBody] DodajKomentarzDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var oferta = await _context.Oferty.FindAsync(id);
            if (oferta == null)
            {
                return NotFound("Oferta nie została znaleziona.");
            }

            var komentarz = new Komentarz
            {
                IdOferta = id,
                IdUzytkownik = userId,
                Tresc = dto.Tresc,
                DataDodania = DateTime.UtcNow
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
            return Ok("Komentarz został dodany.");
        }

        // POST: api/uzytkownik/zgloszenie
        [HttpPost("zgloszenie")]
        public ActionResult ReportContent([FromBody] ZglosDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            // TODO: Dodaj model Zgloszenie i implementuj zgłaszanie treści
            // Na razie zwróć sukces
            return Ok("Zgłoszenie zostało przesłane do moderacji.");
        }

        // PUT: api/uzytkownik/oferta/{id}
        [HttpPut("oferta/{id}")]
        public async Task<ActionResult> UpdateOwnOffer(int id, [FromBody] AktualizujOferteDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var oferta = await _context.Oferty.FirstOrDefaultAsync(o => o.IdOferta == id && o.IdUzytkownik == userId);
            if (oferta == null) return NotFound("Oferta nie znaleziona lub brak uprawnień.");

            if (!string.IsNullOrWhiteSpace(dto.Tytul)) oferta.Nazwa = dto.Tytul.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Opis)) oferta.Opis = dto.Opis.Trim();
            if (dto.Cena.HasValue) oferta.Cena = dto.Cena;
            if (dto.CenaPoprzednia.HasValue) oferta.CenaPoprzednia = dto.CenaPoprzednia;
            if (!string.IsNullOrWhiteSpace(dto.Kod)) oferta.Kod = dto.Kod.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Link)) oferta.Link = dto.Link.Trim();

            // Reset akceptacji po edycji przez zwykłego użytkownika
            oferta.Zatwierdzona = false;
            oferta.Aktywna = true;

            await _context.SaveChangesAsync();
            return Ok("Oferta zaktualizowana – oczekuje ponownej moderacji.");
        }
    }
}
