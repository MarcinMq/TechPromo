using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Data;
using TechPromo.Api.DTO;
using System.Security.Claims;

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
                    Cena = o.Cena,
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
                    Cena = o.Cena,
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
    }
}
