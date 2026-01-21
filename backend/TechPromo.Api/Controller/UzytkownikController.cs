using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Data;
using TechPromo.Api.DTO;
using TechPromo.Api.Model;
using TechPromo.Api.Services;
using TechPromo.Api.Search.Services;
using System.Security.Claims;

namespace TechPromo.Api.Controllers
{
    // Kontroler użytkowników
    [ApiController]
    [Route("api/[controller]")]
    [Route("[controller]")]
    [Authorize]
    public class UzytkownikController : ControllerBase
    {
        private readonly TechPromoDbContext _context;
        private readonly UserManager<Uzytkownik> _userManager;
        private readonly IWebHostEnvironment _environment;
        private readonly IBadgeService _badgeService;
        private readonly ISerwisModeracjiTresci _serwisModeracji;
        private readonly SerwisSync? _syncService;

        public UzytkownikController(
            TechPromoDbContext context, 
            UserManager<Uzytkownik> userManager, 
            IWebHostEnvironment environment, 
            IBadgeService badgeService,
            ISerwisModeracjiTresci serwisModeracji,
            SerwisSync? syncService = null)
        {
            _context = context;
            _userManager = userManager;
            _environment = environment;
            _badgeService = badgeService;
            _serwisModeracji = serwisModeracji;
            _syncService = syncService;
        }

        // GET: api/uzytkownik/aktywnosc (stronicowane)
        [HttpGet("aktywnosc")]
        public async Task<ActionResult<PagedResult<AktywnoscDto>>> GetUserActivity([FromQuery] int skip = 0, [FromQuery] int take = 12)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0) return Unauthorized("Nieprawidłowy użytkownik");
            if (take > 100) take = 100;

            var activities = new List<AktywnoscDto>();

            try 
            {
                var now = DateTime.UtcNow;

                // 1. Oferty użytkownika
                var userOffers = await _context.Oferty
                    .Where(o => o.IdUzytkownik == userId)
                    .OrderByDescending(o => o.DataDodania)
                    .Select(o => new AktywnoscDto
                    {
                        Id = o.IdOferta,
                        Typ = "oferta",
                        Opis = $"Opublikował okazję",
                        Data = FormatTimeAgo(o.DataDodania, now),
                        Punkty = 10
                    })
                    .ToListAsync();
                activities.AddRange(userOffers);

                // 2. Komentarze użytkownika
                var userComments = await _context.Komentarze
                    .Where(k => k.IdUzytkownik == userId)
                    .Include(k => k.Oferta)
                    .OrderByDescending(k => k.DataDodania)
                    .Select(k => new AktywnoscDto
                    {
                        Id = k.IdKomentarz,
                        Typ = "komentarz",
                        Opis = $"Skomentował okazję",
                        Data = FormatTimeAgo(k.DataDodania, now),
                        Punkty = 2
                    })
                    .ToListAsync();
                activities.AddRange(userComments);

                // 3. Głosy użytkownika
                var userVotes = await _context.Glosy
                    .Where(g => g.IdUzytkownik == userId)
                    .Include(g => g.Oferta)
                    .OrderByDescending(g => g.DataGlosu)
                    .Select(g => new AktywnoscDto
                    {
                        Id = g.IdGlos,
                        Typ = "glos",
                        Opis = g.TypGlosu == "hot" ? "Polubił okazję" : "Nie polubił okazji",
                        Data = FormatTimeAgo(g.DataGlosu, now),
                        Punkty = 1
                    })
                    .ToListAsync();
                activities.AddRange(userVotes);

                // 4. Odznaki użytkownika
                var userBadges = await _context.UzytkownikOdznaki
                    .Where(uo => uo.IdUzytkownik == userId)
                    .Include(uo => uo.Odznaka)
                    .OrderByDescending(uo => uo.DataPrzyznania)
                    .Select(uo => new AktywnoscDto
                    {
                        Id = uo.IdOdznaka,
                        Typ = "odznaka",
                        Opis = $"Otrzymał odznakę: {uo.Odznaka.Nazwa}",
                        Data = FormatTimeAgo(uo.DataPrzyznania, now),
                        Punkty = 50
                    })
                    .ToListAsync();
                activities.AddRange(userBadges);

                // Sortuj wszystkie aktywności po czasie (najnowsze pierwsze)
                var sortedActivities = activities
                    .OrderByDescending(a => GetDateFromFormatted(a.Data))
                    .Skip(skip)
                    .Take(take)
                    .ToList();

                var result = new PagedResult<AktywnoscDto>
                {
                    Items = sortedActivities,
                    Total = activities.Count,
                    Skip = skip,
                    Take = take
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Błąd pobierania aktywności: {ex.Message}");
            }
        }

        // Pomocnicza metoda formatująca czas  - "5 godzin temu"
        private static string FormatTimeAgo(DateTime dateTime, DateTime now)
        {
            var timeSpan = now - dateTime;
            
            if (timeSpan.TotalMinutes < 1)
                return "przed chwilą";
            else if (timeSpan.TotalMinutes < 60)
                return $"{(int)timeSpan.TotalMinutes} {GetMinutesSuffix((int)timeSpan.TotalMinutes)} temu";
            else if (timeSpan.TotalHours < 24)
                return $"{(int)timeSpan.TotalHours} {GetHoursSuffix((int)timeSpan.TotalHours)} temu";
            else if (timeSpan.TotalDays < 30)
                return $"{(int)timeSpan.TotalDays} {GetDaysSuffix((int)timeSpan.TotalDays)} temu";
            else
                return dateTime.ToString("dd.MM.yyyy");
        }

        private static string GetMinutesSuffix(int minutes)
        {
            if (minutes == 1) return "minutę";
            if (minutes < 5) return "minuty";
            return "minut";
        }

        private static string GetHoursSuffix(int hours)
        {
            if (hours == 1) return "godzinę";
            if (hours < 5) return "godziny";
            return "godzin";
        }

        private static string GetDaysSuffix(int days)
        {
            if (days == 1) return "dzień";
            return "dni";
        }

        private static DateTime GetDateFromFormatted(string formattedDate)
        {
            // Dla sortowania - próbuj sparsować albo zwróć min value
            if (DateTime.TryParse(formattedDate, out var date)) return date;
            
            // Jeśli to format "X godzin temu", zwróć przybliżoną datę
            if (formattedDate.Contains("godzin") || formattedDate.Contains("godzinę") || formattedDate.Contains("godziny"))
            {
                var hoursStr = formattedDate.Split(' ')[0];
                if (int.TryParse(hoursStr, out var hours))
                    return DateTime.UtcNow.AddHours(-hours);
            }
            
            if (formattedDate.Contains("minut") || formattedDate.Contains("minutę") || formattedDate.Contains("minuty"))
            {
                var minutesStr = formattedDate.Split(' ')[0];
                if (int.TryParse(minutesStr, out var minutes))
                    return DateTime.UtcNow.AddMinutes(-minutes);
            }

            if (formattedDate.Contains("dni") || formattedDate.Contains("dzień"))
            {
                var daysStr = formattedDate.Split(' ')[0];
                if (int.TryParse(daysStr, out var days))
                    return DateTime.UtcNow.AddDays(-days);
            }
            
            return DateTime.MinValue;
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

        // GET: api/uzytkownik/komentarze (stronicowane)
        [HttpGet("komentarze")]
        public async Task<ActionResult<PagedResult<KomentarzDto>>> GetUserComments([FromQuery] int skip = 0, [FromQuery] int take = 12)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (take > 100) take = 100;
            var baseQuery = _context.Komentarze
                .Where(k => k.IdUzytkownik == userId)
                .Include(k => k.Oferta)
                .Include(k => k.Uzytkownik)
                .OrderByDescending(k => k.DataDodania)
                .AsQueryable();

            var total = await baseQuery.CountAsync();
            var pageItems = await baseQuery
                .Skip(skip)
                .Take(take)
                .Select(k => new KomentarzDto
                {
                    Id = k.IdKomentarz,
                    Tresc = k.Tresc,
                    Oferta = k.Oferta != null ? k.Oferta.Nazwa : string.Empty,
                    Data = k.DataDodania.ToString("dd.MM.yyyy HH:mm"),
                    Autor = k.Uzytkownik != null ? (k.Uzytkownik.UserName ?? "Nieznany") : "Nieznany",
                    ParentId = k.ParentId,
                    Up = k.LiczbaUp,
                    Down = k.LiczbaDown,
                    UserVote = null
                })
                .ToListAsync();

            var result = new PagedResult<KomentarzDto>
            {
                Items = pageItems,
                Total = total,
                Skip = skip,
                Take = take
            };
            return Ok(result);
        }

        // GET: api/uzytkownik/oferty (stronicowane)
        [HttpGet("oferty")]
        public async Task<ActionResult<PagedResult<OfertaDto>>> GetUserOffers(
            [FromQuery] string? kategoria = null,
            [FromQuery] string? tag = null,
            [FromQuery] string? sortBy = "newest",
            [FromQuery] int skip = 0,
            [FromQuery] int take = 12)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (take > 100) take = 100; // górny limit bezpieczeństwa
            
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
                "price" => query.OrderBy(o => o.Cena ?? decimal.MaxValue),
                "newest" => query.OrderByDescending(o => o.DataDodania),
                "oldest" => query.OrderBy(o => o.DataDodania),
                _ => query.OrderByDescending(o => o.DataDodania)
            };

            var total = await query.CountAsync();

            var offers = await query
                .Skip(skip)
                .Take(take)
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
                    WaznoscOd = o.WaznoscOd,
                    WaznoscDo = o.WaznoscDo,
                    Votes = new VotesDto { Hot = o.LiczbaHot, Cold = o.LiczbaCold },
                    Komentarze = o.Komentarze.Count,
                    Zdjecia = o.Zdjecia.OrderBy(z => z.Kolejnosc).Select(z => z.UrlZdjecia).ToList()
                })
                .ToListAsync();

            var result = new PagedResult<OfertaDto>
            {
                Items = offers,
                Total = total,
                Skip = skip,
                Take = take
            };
            return Ok(result);
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
                WaznoscOd = o.WaznoscOd,
                WaznoscDo = o.WaznoscDo,
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

            // 1. Walidacja AI - Tekst
            var contentCheck = await _serwisModeracji.ModerujTekstAsync($"{dto.Tytul} {dto.Opis}");
            if (!contentCheck.CzyBezpieczny)
            {
                return BadRequest(new { message = contentCheck.KomunikatDlaUzytkownika, details = contentCheck.NaruszonKategorie });
            }

            // 2. Walidacja AI - Zdjęcia (jeśli są)
            if (dto.Zdjecia != null && dto.Zdjecia.Any())
            {
                foreach (var file in dto.Zdjecia)
                {
                    if (file.Length > 0)
                    {
                        using var ms = new MemoryStream();
                        await file.CopyToAsync(ms);
                        var imageCheck = await _serwisModeracji.ModerujObrazAsync(ms.ToArray());
                        if (!imageCheck.CzyBezpieczny)
                        {
                            return BadRequest(new { message = imageCheck.KomunikatDlaUzytkownika });
                        }
                    }
                }
            }

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
                WaznoscOd = dto.WaznoscOd,
                WaznoscDo = dto.WaznoscDo,
                Zatwierdzona = true, // Automatyczne zatwierdzenie po pozytywnej weryfikacji AI
                Aktywna = true,
                ZatwierdzeniePrzezAI = true
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

            // Odznaki (first_deal, deals_5)
            await _badgeService.EvaluateForUserAsync(userId);

            // Synchronizacja z Azure AI Search
            if (_syncService != null)
            {
                await _syncService.SynchronizujOferteAsync(oferta.IdOferta);
            }

            return Ok("Oferta została dodana pomyślnie.");
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

            try
            {
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
                
                // Odznaki (first_vote, hot_50 może po moderacji temperatury – ale policzymy tu i tak)
                await _badgeService.EvaluateForUserAsync(userId);

                // Powiadomienie dla autora oferty o głosie HOT (tylko jeśli to nowy głos, nie zmiana)
                if ((existingVote == null || existingVote.TypGlosu != dto.Typ) && dto.Typ == "hot" && oferta.IdUzytkownik != userId)
                {
                    var voter = await _userManager.FindByIdAsync(userId.ToString());
                    var voterName = voter?.UserName ?? "Ktoś";
                    
                    var powiadomienie = new Powiadomienie
                    {
                        IdUzytkownik = oferta.IdUzytkownik,
                        Typ = "Głos",
                        Tresc = $"{voterName} polubił(a) Twoją ofertę \"{(oferta.Nazwa.Length > 30 ? oferta.Nazwa.Substring(0, 30) + "..." : oferta.Nazwa)}\"",
                        DataUtworzenia = DateTime.UtcNow,
                        IdOferta = oferta.IdOferta,
                        Przeczytane = false
                    };
                    _context.Powiadomienia.Add(powiadomienie);
                    await _context.SaveChangesAsync();
                }
                
                return Ok("Głos został zapisany.");
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("duplicate key") == true)
            {
                // Race condition - ktoś już dodał głos w międzyczasie
                return Conflict("Już zagłosowałeś na tę ofertę.");
            }
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

            Komentarz? parent = null;
            if (dto.ParentId.HasValue)
            {
                parent = await _context.Komentarze.FirstOrDefaultAsync(k => k.IdKomentarz == dto.ParentId.Value);
                if (parent == null || parent.IdOferta != id)
                    return BadRequest("Nieprawidłowy parentId.");
            }
            var komentarz = new Komentarz
            {
                IdOferta = id,
                IdUzytkownik = userId,
                Tresc = dto.Tresc.Trim(),
                DataDodania = DateTime.UtcNow,
                ParentId = dto.ParentId,
                Status = "aktywny"
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
            
            // Powiadomienie dla autora oferty o nowym komentarzu (jeśli to nie autor)
            if (oferta.IdUzytkownik != userId)
            {
                var commenterName = user?.UserName ?? "Ktoś";
                var powiadomienie = new Powiadomienie
                {
                    IdUzytkownik = oferta.IdUzytkownik,
                    Typ = "Komentarz",
                    Tresc = $"{commenterName} skomentował(a) Twoją ofertę \"{(oferta.Nazwa.Length > 30 ? oferta.Nazwa.Substring(0, 30) + "..." : oferta.Nazwa)}\"",
                    DataUtworzenia = DateTime.UtcNow,
                    IdOferta = oferta.IdOferta,
                    IdKomentarz = komentarz.IdKomentarz,
                    Przeczytane = false
                };
                _context.Powiadomienia.Add(powiadomienie);
                await _context.SaveChangesAsync();
            }
            
            // Odznaki (comments_10)
            await _badgeService.EvaluateForUserAsync(userId);
            return Ok("Komentarz został dodany.");
        }

        // DELETE: api/uzytkownik/komentarz/{id} - Usuń własny komentarz
        [HttpDelete("komentarz/{id}")]
        [Authorize]
        public async Task<ActionResult> DeleteOwnComment(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0) return Unauthorized("Brak użytkownika");

            var komentarz = await _context.Komentarze.FirstOrDefaultAsync(k => k.IdKomentarz == id);
            if (komentarz == null) return NotFound("Komentarz nie istnieje");

            // Sprawdź czy to własny komentarz
            if (komentarz.IdUzytkownik != userId)
                return Forbid("Możesz usuwać tylko własne komentarze");

            // Usuń powiązane głosy
            var glosy = _context.KomentarzGlosy.Where(g => g.IdKomentarz == id);
            _context.KomentarzGlosy.RemoveRange(glosy);

            // Usuń powiązane powiadomienia
            var powiadomienia = _context.Powiadomienia.Where(p => p.IdKomentarz == id);
            _context.Powiadomienia.RemoveRange(powiadomienia);

            // Usuń odpowiedzi do tego komentarza (rekurencyjnie można by, ale na razie proste)
            var odpowiedzi = _context.Komentarze.Where(k => k.ParentId == id);
            foreach (var odp in odpowiedzi)
            {
                odp.ParentId = null; // Odpinamy od rodzica
            }

            _context.Komentarze.Remove(komentarz);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Komentarz został usunięty" });
        }

        // POST: api/uzytkownik/zgloszenie
        [HttpPost("zgloszenie")]
        public async Task<ActionResult> ReportContent([FromBody] ZglosDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0) return Unauthorized("Brak użytkownika");
            if (string.IsNullOrWhiteSpace(dto.Typ) || string.IsNullOrWhiteSpace(dto.Powod)) return BadRequest("Nieprawidłowe dane zgłoszenia");

            // Normalizuj typ (offer/comment)
            var typLower = dto.Typ.Trim().ToLower();
            if (typLower != "offer" && typLower != "comment") return BadRequest("Nieobsługiwany typ zgłoszenia");

            // Sprawdź czy obiekt istnieje
            Oferta? oferta = null; Komentarz? komentarz = null;
            if (typLower == "offer")
            {
                oferta = await _context.Oferty.FindAsync(dto.IdTresci);
                if (oferta == null) return NotFound("Oferta nie istnieje");
            }
            else // comment
            {
                komentarz = await _context.Komentarze.FindAsync(dto.IdTresci);
                if (komentarz == null) return NotFound("Komentarz nie istnieje");
            }

            // Zabezpieczenie: maks 200 znaków (walidacja w DTO, ale przytnij)
            var powod = dto.Powod.Trim();
            if (powod.Length > 200) powod = powod.Substring(0, 200);

            // Pobierz wszystkich moderatorów i adminów
            var moderatorzy = await _userManager.GetUsersInRoleAsync("Moderator");
            var admini = await _userManager.GetUsersInRoleAsync("Admin");
            var moderatorzyIAdmini = moderatorzy.Concat(admini).Select(u => u.Id).Distinct().ToList();

            // Utwórz powiadomienia dla wszystkich moderatorów/adminów
            var trescZgloszenia = typLower == "comment"
                ? $"Nowe zgłoszenie komentarza #{komentarz!.IdKomentarz}: {powod}"
                : $"Nowe zgłoszenie oferty #{oferta!.IdOferta}: {powod}";

            foreach (var modId in moderatorzyIAdmini)
            {
                var powiadomienie = new Powiadomienie
                {
                    IdUzytkownik = modId,
                    Typ = "Zgłoszenie",
                    Tresc = trescZgloszenia,
                    DataUtworzenia = DateTime.UtcNow,
                    IdKomentarz = komentarz?.IdKomentarz,
                    IdOferta = oferta != null ? oferta.IdOferta : komentarz?.IdOferta,
                    Przeczytane = false
                };
                _context.Powiadomienia.Add(powiadomienie);
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Zgłoszenie zostało przesłane do moderacji." });
        }

        // PUT: api/uzytkownik/oferta/{id}
        [HttpPut("oferta/{id}")]
        public async Task<ActionResult> UpdateOwnOffer(int id, [FromBody] AktualizujOferteDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            // Pobierz ofertę niezależnie od właściciela
            var oferta = await _context.Oferty.FirstOrDefaultAsync(o => o.IdOferta == id);
            if (oferta == null) return NotFound("Oferta nie znaleziona.");

            var isOwner = oferta.IdUzytkownik == userId;
            var isAdmin = User.IsInRole("Admin");
            var isModerator = User.IsInRole("Moderator");

            if (!isOwner && !isAdmin && !isModerator)
            {
                return Forbid();
            }

            // Walidacja cen przed aktualizacją
            // Cena może być 0 (za darmo) lub większa od 0
            if (dto.Cena.HasValue && dto.Cena < 0)
                return BadRequest("Cena nie może być ujemna.");
                
            if (dto.CenaPoprzednia.HasValue && dto.CenaPoprzednia <= 0)
                return BadRequest("Cena poprzednia musi być większa od 0.");
                
            // Sprawdź relację cen tylko jeśli cena promocyjna > 0 (nie dotyczy ofert za darmo)
            if (dto.Cena.HasValue && dto.Cena > 0 && dto.CenaPoprzednia.HasValue && dto.Cena >= dto.CenaPoprzednia)
                return BadRequest("Cena promocyjna powinna być niższa niż cena poprzednia.");

            // Aktualizacja pól
            Console.WriteLine($"[DEBUG UpdateOwnOffer] Otrzymano: Tytul={dto.Tytul}, Opis={(dto.Opis?.Length > 20 ? dto.Opis?.Substring(0,20) + "..." : dto.Opis)}, Cena={dto.Cena}, Tagi={dto.Tagi?.Count ?? 0}");
            
            // Pola wymagane - aktualizuj tylko jeśli niepuste
            if (!string.IsNullOrWhiteSpace(dto.Tytul)) oferta.Nazwa = dto.Tytul.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Opis)) oferta.Opis = dto.Opis.Trim();
            
            // Pola opcjonalne - aktualizuj ZAWSZE gdy są w requescie (pozwala na wyczyszczenie)
            if (dto.Cena.HasValue) oferta.Cena = dto.Cena;
            if (dto.CenaPoprzednia.HasValue) oferta.CenaPoprzednia = dto.CenaPoprzednia;
            
            // Kod i Link - aktualizuj nawet jeśli puste (pozwala usunąć)
            if (dto.Kod != null) oferta.Kod = string.IsNullOrWhiteSpace(dto.Kod) ? null : dto.Kod.Trim();
            if (dto.Link != null) oferta.Link = string.IsNullOrWhiteSpace(dto.Link) ? null : dto.Link.Trim();
            
            // Aktualizacja kategorii
            if (!string.IsNullOrWhiteSpace(dto.Kategoria))
            {
                var kategoria = await _context.Kategorie.FirstOrDefaultAsync(k => k.Nazwa == dto.Kategoria);
                if (kategoria == null)
                {
                    // Jeśli kategoria nie istnieje, utwórz ją (jak w CreateOffer)
                    kategoria = new Kategoria { Nazwa = dto.Kategoria };
                    _context.Kategorie.Add(kategoria);
                    await _context.SaveChangesAsync();
                }
                
                if (kategoria != null)
                {
                    oferta.IdKategoria = kategoria.IdKategoria;
                }
            }
            
            // Aktualizacja dat ważności - konwersja do UTC dla PostgreSQL
            if (dto.WaznoscOd.HasValue)
            {
                oferta.WaznoscOd = DateTime.SpecifyKind(dto.WaznoscOd.Value, DateTimeKind.Utc);
            }
            else
            {
                oferta.WaznoscOd = null;
            }
            
            if (dto.WaznoscDo.HasValue)
            {
                oferta.WaznoscDo = DateTime.SpecifyKind(dto.WaznoscDo.Value, DateTimeKind.Utc);
            }
            else
            {
                oferta.WaznoscDo = null;
            }
            
            Console.WriteLine($"[DEBUG UpdateOwnOffer] Po aktualizacji: Nazwa={oferta.Nazwa}, Cena={oferta.Cena}, Kategoria={oferta.IdKategoria}");
            
            // Aktualizacja tagów - jeśli pole Tagi zostało przesłane (nie null)
            if (dto.Tagi != null)
            {
                // Usuń stare tagi
                var stareTagi = await _context.OfertaTagi.Where(ot => ot.IdOferta == id).ToListAsync();
                _context.OfertaTagi.RemoveRange(stareTagi);
                
                // Dodaj nowe tagi (jeśli są)
                foreach (var tagNazwa in dto.Tagi.Take(10)) // max 10 tagów
                {
                    var trimmedTag = tagNazwa.Trim().ToLower();
                    if (string.IsNullOrWhiteSpace(trimmedTag)) continue;
                    
                    var tag = await _context.Tagi.FirstOrDefaultAsync(t => t.Nazwa == trimmedTag);
                    if (tag == null)
                    {
                        tag = new Tag { Nazwa = trimmedTag };
                        _context.Tagi.Add(tag);
                        await _context.SaveChangesAsync();
                    }
                    
                    _context.OfertaTagi.Add(new OfertaTag { IdOferta = id, IdTag = tag.IdTag });
                }
            }
            
            // Logika zatwierdzenia:
            // - Jeśli zwykły użytkownik edytuje swoją ofertę -> wymaga ponownej moderacji
            // - Jeśli moderator/admin edytuje jakąkolwiek ofertę -> nie wymaga zatwierdzenia
            
            if (isOwner && !isModerator && !isAdmin)
            {
                // Moderacja AI tekstu po edycji
                Console.WriteLine($"[DEBUG] User edit - running AI moderation for offer {id}");
                var contentCheck = await _serwisModeracji.ModerujTekstAsync($"{oferta.Nazwa} {oferta.Opis}");
                Console.WriteLine($"[DEBUG] AI moderation result: CzyBezpieczny={contentCheck.CzyBezpieczny}");
                
                if (!contentCheck.CzyBezpieczny)
                {
                    Console.WriteLine($"[DEBUG] AI moderation BLOCKED: {contentCheck.KomunikatDlaUzytkownika}");
                    return BadRequest(new { message = contentCheck.KomunikatDlaUzytkownika, details = contentCheck.NaruszonKategorie });
                }

                oferta.Zatwierdzona = true; // Auto-approve
                oferta.Aktywna = true;
                oferta.ZatwierdzeniePrzezAI = true;
                Console.WriteLine($"[DEBUG] User edit approved by AI, saving changes...");
            }
            else
            {
                // Moderator/Admin edytuje ofertę - nie wymaga zatwierdzenia
                oferta.Zatwierdzona = true;
                oferta.Aktywna = true;
            }

            await _context.SaveChangesAsync();
            
            if (_syncService != null)
            {
                await _syncService.SynchronizujOferteAsync(oferta.IdOferta);
            }

            if (isOwner && !isModerator && !isAdmin)
            {
                return Ok("Oferta została zaktualizowana.");
            }
            return Ok("Oferta zaktualizowana przez moderatora / administratora.");
        }

        // POST: api/uzytkownik/oferta/{id}/zdjecia - dodanie zdjęć do własnej oferty (FormData: zdjecia)
        [HttpPost("oferta/{id}/zdjecia")]
        public async Task<ActionResult> UploadOfferImages(int id, [FromForm(Name = "zdjecia")] List<IFormFile> zdjecia)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var oferta = await _context.Oferty.Include(o => o.Zdjecia).FirstOrDefaultAsync(o => o.IdOferta == id && o.IdUzytkownik == userId);
            if (oferta == null) return NotFound("Oferta nie istnieje lub brak uprawnień.");

            if ((zdjecia == null || zdjecia.Count == 0) && Request.Form?.Files?.Count > 0)
            {
                zdjecia = Request.Form.Files.GetFiles("zdjecia").ToList();
                if (zdjecia.Count == 0) zdjecia = Request.Form.Files.ToList();
            }
            if (zdjecia == null || zdjecia.Count == 0) return BadRequest("Brak plików w polu 'zdjecia'.");

            var uploadsPath = Path.Combine(_environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "oferty");
            Directory.CreateDirectory(uploadsPath);

            int startOrder = oferta.Zdjecia?.Any() == true ? oferta.Zdjecia.Max(z => z.Kolejnosc) : 0;
            int added = 0;
            foreach (var file in zdjecia)
            {
                if (file.Length == 0) continue;
                if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase)) continue;
                if (file.Length > 5 * 1024 * 1024) return BadRequest($"Plik {file.FileName} >5MB");

                // Moderacja AI
                try
                {
                    using var ms = new MemoryStream();
                    await file.CopyToAsync(ms);
                    var imageBytes = ms.ToArray();
                    var imageCheck = await _serwisModeracji.ModerujObrazAsync(imageBytes);
                    if (!imageCheck.CzyBezpieczny)
                    {
                         return BadRequest(new { message = $"Zdjęcie {file.FileName} odrzucone: {imageCheck.KomunikatDlaUzytkownika}" });
                    }
                    
                    var ext = Path.GetExtension(file.FileName);
                    var name = $"{id}_{DateTime.UtcNow.Ticks}_{Guid.NewGuid()}{ext}";
                    var path = Path.Combine(uploadsPath, name);
                    
                    await System.IO.File.WriteAllBytesAsync(path, imageBytes);
    
                    _context.OfertyZdjecia.Add(new OfertaZdjecie
                    {
                        IdOferta = id,
                        UrlZdjecia = $"/uploads/oferty/{name}",
                        Kolejnosc = ++startOrder
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[AI ERROR] Błąd moderacji zdjęcia {file.FileName}: {ex.Message}");
                    // W przypadku błędu AI - odrzucamy dla bezpieczenstwa, czy przepuszczamy? 
                    // Użytkownik ma problem z zapisem. Jeśli AI leży, to użytkownik nie może dodać zdjęcia.
                    // Przepuśćmy warunkowo lub zwróćmy błąd 500. 
                    // Zwróćmy błąd żeby wiedział co jest grane
                    throw; 
                }
                added++;
            }
            await _context.SaveChangesAsync();
            
            if (_syncService != null && added > 0)
            {
                 await _syncService.SynchronizujOferteAsync(id);
            }

            var urls = await _context.OfertyZdjecia.Where(z => z.IdOferta == id).OrderBy(z => z.Kolejnosc).Select(z => z.UrlZdjecia).ToListAsync();
            return Ok(new { message = $"Dodano {added} plik(ów)", zdjecia = urls });
        }

        // DELETE: api/uzytkownik/oferta/{id} - usuń własną ofertę
        [HttpDelete("oferta/{id}")]
        public async Task<ActionResult> DeleteOwnOffer(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var oferta = await _context.Oferty
                .Include(o => o.Zdjecia)
                .Include(o => o.Komentarze)
                .FirstOrDefaultAsync(o => o.IdOferta == id && o.IdUzytkownik == userId);
            if (oferta == null) return NotFound("Oferta nie znaleziona lub brak uprawnień.");

            // Usuń powiązane głosy
            var glosy = _context.Glosy.Where(g => g.IdOferta == id);
            _context.Glosy.RemoveRange(glosy);
            // Usuń komentarze
            if (oferta.Komentarze.Any()) _context.Komentarze.RemoveRange(oferta.Komentarze);
            // Usuń powiązania tagów
            var tagi = _context.OfertaTagi.Where(t => t.IdOferta == id);
            _context.OfertaTagi.RemoveRange(tagi);
            // Usuń powiadomienia związane z ofertą (opcjonalnie)
            var powiadomienia = _context.Powiadomienia.Where(p => p.IdOferta == id);
            _context.Powiadomienia.RemoveRange(powiadomienia);
            // Usuń zdjęcia z dysku
            if (oferta.Zdjecia.Any())
            {
                foreach (var z in oferta.Zdjecia)
                {
                    // Ścieżka fizyczna
                    var physical = Path.Combine(_environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), z.UrlZdjecia.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                    if (System.IO.File.Exists(physical))
                    {
                        try { System.IO.File.Delete(physical); } catch { /* ignoruj */ }
                    }
                }
                _context.OfertyZdjecia.RemoveRange(oferta.Zdjecia);
            }

            _context.Oferty.Remove(oferta);
            await _context.SaveChangesAsync();
            return Ok("Oferta została usunięta.");
        }

        // GET: api/uzytkownik/oferta/{id}/zdjecia - lista zdjęć (id, url, kolejnosc)
        [HttpGet("oferta/{id}/zdjecia")]
        public async Task<ActionResult> GetOfferImages(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var owns = await _context.Oferty.AnyAsync(o => o.IdOferta == id && o.IdUzytkownik == userId);
            if (!owns) return NotFound("Oferta nie istnieje lub brak uprawnień.");
            var list = await _context.OfertyZdjecia
                .Where(z => z.IdOferta == id)
                .OrderBy(z => z.Kolejnosc)
                .Select(z => new { z.IdOfertaZdjecie, z.UrlZdjecia, z.Kolejnosc })
                .ToListAsync();
            return Ok(list);
        }

        // DELETE: api/uzytkownik/oferta/{id}/zdjecie/{fotoId}
        [HttpDelete("oferta/{id}/zdjecie/{fotoId}")]
        public async Task<ActionResult> DeleteOfferImage(int id, int fotoId)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var oferta = await _context.Oferty
                .Include(o => o.Zdjecia)
                .FirstOrDefaultAsync(o => o.IdOferta == id && o.IdUzytkownik == userId);
            if (oferta == null) return NotFound("Oferta nie istnieje lub brak uprawnień.");
            var foto = oferta.Zdjecia.FirstOrDefault(f => f.IdOfertaZdjecie == fotoId);
            if (foto == null) return NotFound("Zdjęcie nie znalezione.");
            var physical = Path.Combine(_environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), foto.UrlZdjecia.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
            if (System.IO.File.Exists(physical))
            {
                try { System.IO.File.Delete(physical); } catch { }
            }
            _context.OfertyZdjecia.Remove(foto);
            await _context.SaveChangesAsync();
            return Ok("Zdjęcie usunięte.");
        }

        // PUT: api/uzytkownik/oferta/{id}/zdjecia/kolejnosc
        [HttpPut("oferta/{id}/zdjecia/kolejnosc")]
        public async Task<ActionResult> ReorderOfferImages(int id, [FromBody] ZmienKolejnoscZdjecDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var oferta = await _context.Oferty.Include(o => o.Zdjecia).FirstOrDefaultAsync(o => o.IdOferta == id && o.IdUzytkownik == userId);
            if (oferta == null) return NotFound("Oferta nie istnieje lub brak uprawnień.");
            if (dto?.Kolejnosci == null || dto.Kolejnosci.Count == 0) return BadRequest("Brak danych.");
            var ids = oferta.Zdjecia.Select(z => z.IdOfertaZdjecie).ToHashSet();
            foreach (var k in dto.Kolejnosci)
            {
                if (!ids.Contains(k.IdOfertaZdjecie)) continue; // ignoruj obce
                var foto = oferta.Zdjecia.First(z => z.IdOfertaZdjecie == k.IdOfertaZdjecie);
                foto.Kolejnosc = k.Kolejnosc;
            }
            await _context.SaveChangesAsync();
            return Ok("Kolejność zapisana.");
        }

        // POST: api/uzytkownik/zapisane/{id} - Zapisz ofertę
        [HttpPost("zapisane/{id}")]
        public async Task<ActionResult> SaveOffer(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0) return Unauthorized("Nieprawidłowy użytkownik");

            // Sprawdź czy oferta istnieje
            var oferta = await _context.Oferty.FindAsync(id);
            if (oferta == null) return NotFound("Oferta nie została znaleziona");

            // Sprawdź czy już nie jest zapisana
            var exists = await _context.ZapisaneOferty
                .AnyAsync(zo => zo.IdUzytkownik == userId && zo.IdOferta == id);
            
            if (exists) return BadRequest("Oferta już jest zapisana");

            // Zapisz ofertę
            _context.ZapisaneOferty.Add(new ZapisanaOferta
            {
                IdUzytkownik = userId,
                IdOferta = id,
                DataZapisania = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return Ok("Oferta została zapisana");
        }

        // DELETE: api/uzytkownik/zapisane/{id} - Usuń z zapisanych
        [HttpDelete("zapisane/{id}")]
        public async Task<ActionResult> UnsaveOffer(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0) return Unauthorized("Nieprawidłowy użytkownik");

            var zapisana = await _context.ZapisaneOferty
                .FirstOrDefaultAsync(zo => zo.IdUzytkownik == userId && zo.IdOferta == id);
            
            if (zapisana == null) return NotFound("Oferta nie była zapisana");

            _context.ZapisaneOferty.Remove(zapisana);
            await _context.SaveChangesAsync();
            return Ok("Oferta została usunięta z zapisanych");
        }

        // GET: api/uzytkownik/zapisane - Lista zapisanych ofert
        [HttpGet("zapisane")]
        public async Task<ActionResult<PagedResult<OfertaDto>>> GetSavedOffers(
            [FromQuery] int skip = 0,
            [FromQuery] int take = 12)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0) return Unauthorized("Nieprawidłowy użytkownik");
            if (take > 100) take = 100;

            var query = _context.ZapisaneOferty
                .Where(zo => zo.IdUzytkownik == userId)
                .Include(zo => zo.Oferta)
                    .ThenInclude(o => o.Uzytkownik)
                .Include(zo => zo.Oferta)
                    .ThenInclude(o => o.Kategoria)
                .Include(zo => zo.Oferta)
                    .ThenInclude(o => o.Zdjecia)
                .Include(zo => zo.Oferta)
                    .ThenInclude(o => o.OfertaTagi)
                        .ThenInclude(ot => ot.Tag)
                .Include(zo => zo.Oferta)
                    .ThenInclude(o => o.Glosy)
                .Include(zo => zo.Oferta)
                    .ThenInclude(o => o.Komentarze)
                .OrderByDescending(zo => zo.DataZapisania);

            var total = await query.CountAsync();
            var items = await query
                .Skip(skip)
                .Take(take)
                .Select(zo => new OfertaDto
                {
                    Id = zo.Oferta.IdOferta,
                    Tytul = zo.Oferta.Nazwa,
                    Opis = zo.Oferta.Opis,
                    Typ = zo.Oferta.Typ,
                    Cena = zo.Oferta.Cena,
                    CenaPoprzednia = zo.Oferta.CenaPoprzednia,
                    Kod = zo.Oferta.Kod,
                    Sklep = zo.Oferta.Link,
                    Kategoria = zo.Oferta.Kategoria != null ? zo.Oferta.Kategoria.Nazwa : "Inne",
                    Tagi = zo.Oferta.OfertaTagi.Select(ot => ot.Tag.Nazwa).ToList(),
                    Autor = zo.Oferta.Uzytkownik.UserName ?? "Nieznany",
                    DataUtworzenia = zo.Oferta.DataDodania.ToString("dd.MM.yyyy HH:mm"),
                    WaznoscOd = zo.Oferta.WaznoscOd,
                    WaznoscDo = zo.Oferta.WaznoscDo,
                    Votes = new VotesDto { Hot = zo.Oferta.LiczbaHot, Cold = zo.Oferta.LiczbaCold },
                    Komentarze = zo.Oferta.Komentarze.Count,
                    Zdjecia = zo.Oferta.Zdjecia.OrderBy(z => z.Kolejnosc).Select(z => z.UrlZdjecia).ToList()
                })
                .ToListAsync();

            return Ok(new PagedResult<OfertaDto>
            {
                Items = items,
                Total = total,
                Skip = skip,
                Take = take
            });
        }

        // ==================== POWIADOMIENIA ====================

        // GET: api/uzytkownik/powiadomienia
        [HttpGet("powiadomienia")]
        public async Task<ActionResult<List<PowiadomienieDto>>> GetPowiadomienia([FromQuery] int limit = 20)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0) return Unauthorized("Nieprawidłowy użytkownik");

            var powiadomienia = await _context.Powiadomienia
                .Where(p => p.IdUzytkownik == userId)
                .OrderByDescending(p => p.DataUtworzenia)
                .Take(limit)
                .Select(p => new PowiadomienieDto
                {
                    Id = p.IdPowiadomienie,
                    Typ = p.Typ,
                    Tresc = p.Tresc,
                    DataUtworzenia = p.DataUtworzenia,
                    Przeczytane = p.Przeczytane,
                    IdOferta = p.IdOferta,
                    IdKomentarz = p.IdKomentarz
                })
                .ToListAsync();

            return Ok(powiadomienia);
        }

        // GET: api/uzytkownik/powiadomienia/nieprzeczytane/liczba
        [HttpGet("powiadomienia/nieprzeczytane/liczba")]
        public async Task<ActionResult<int>> GetLiczbaNieprzeczytanych()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0) return Unauthorized("Nieprawidłowy użytkownik");

            var count = await _context.Powiadomienia
                .CountAsync(p => p.IdUzytkownik == userId && !p.Przeczytane);

            return Ok(count);
        }

        // PUT: api/uzytkownik/powiadomienia/{id}/przeczytane
        [HttpPut("powiadomienia/{id}/przeczytane")]
        public async Task<IActionResult> OznaczJakoPrzeczytane(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0) return Unauthorized("Nieprawidłowy użytkownik");

            var powiadomienie = await _context.Powiadomienia
                .FirstOrDefaultAsync(p => p.IdPowiadomienie == id && p.IdUzytkownik == userId);

            if (powiadomienie == null)
                return NotFound("Powiadomienie nie istnieje");

            powiadomienie.Przeczytane = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Oznaczono jako przeczytane" });
        }

        // PUT: api/uzytkownik/powiadomienia/przeczytaj-wszystkie
        [HttpPut("powiadomienia/przeczytaj-wszystkie")]
        public async Task<IActionResult> OznaczWszystkieJakoPrzeczytane()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0) return Unauthorized("Nieprawidłowy użytkownik");

            var nieprzeczytane = await _context.Powiadomienia
                .Where(p => p.IdUzytkownik == userId && !p.Przeczytane && p.Typ != "Zgłoszenie")
                .ToListAsync();

            foreach (var p in nieprzeczytane)
            {
                p.Przeczytane = true;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Oznaczono {nieprzeczytane.Count} powiadomień jako przeczytane" });
        }
    }
}
