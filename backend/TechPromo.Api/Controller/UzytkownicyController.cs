using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Data;
using TechPromo.Api.DTO;

namespace TechPromo.Api.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class UzytkownicyController : ControllerBase
    {
        private readonly TechPromoDbContext _context;

        public UzytkownicyController(TechPromoDbContext context)
        {
            _context = context;
        }

        // GET: api/uzytkownicy (debug - lista wszystkich użytkowników)
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> GetUzytkownicy()
        {
            var users = await _context.Users
                .Select(u => new { u.Id, u.UserName, u.Email })
                .Take(20)
                .ToListAsync();
            return Ok(users);
        }

        // GET: api/uzytkownicy/{nick}
        [HttpGet("{nick}")]
        public async Task<ActionResult<PublicznyProfilDto>> GetPublicznyProfil(string nick)
        {
            var user = await _context.Users
                .Include(u => u.UzytkownikOdznaki)
                    .ThenInclude(uo => uo.Odznaka)
                .FirstOrDefaultAsync(u => u.UserName!.ToLower() == nick.ToLower());

            if (user == null)
            {
                return NotFound(new { message = "Użytkownik nie znaleziony" });
            }

            // Avatar URL
            string? avatarUrl = null;
            var webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var profilesDir = Path.Combine(webRoot, "uploads", "profiles");
            Directory.CreateDirectory(profilesDir);
            var existing = Directory.GetFiles(profilesDir, $"user_{user.Id}.*").FirstOrDefault();
            if (existing != null)
            {
                var fileName = Path.GetFileName(existing);
                avatarUrl = $"{Request.Scheme}://{Request.Host}/uploads/profiles/{fileName}";
            }

            // Odznaki
            var odznaki = user.UzytkownikOdznaki
                .Select(uo => new OdznakaDto
                {
                    idOdznaka = uo.Odznaka.IdOdznaka,
                    nazwa = uo.Odznaka.Nazwa,
                    opis = uo.Odznaka.Opis,
                    ikona = uo.Odznaka.Ikona,
                    dataPrzyznania = uo.DataPrzyznania.ToString("dd.MM.yyyy HH:mm")
                })
                .OrderByDescending(o => o.dataPrzyznania)
                .ToList();

            // Ostatnie komentarze (publiczne - tylko z zatwierdzonych ofert)
            var ostatnieKomentarze = await _context.Komentarze
                .Where(k => k.IdUzytkownik == user.Id && k.Oferta != null && k.Oferta.Zatwierdzona)
                .OrderByDescending(k => k.DataDodania)
                .Take(10)
                .Select(k => new AktywnoscDto
                {
                    Id = k.IdKomentarz,
                    Typ = "komentarz",
                    Opis = k.Tresc.Length > 100 ? k.Tresc.Substring(0, 100) + "..." : k.Tresc,
                    Data = k.DataDodania.ToString("dd.MM.yyyy HH:mm")
                })
                .ToListAsync();

            // Dodane oferty (tylko zatwierdzone)
            var dodaneOferty = await _context.Oferty
                .Where(o => o.IdUzytkownik == user.Id && o.Zatwierdzona)
                .OrderByDescending(o => o.DataDodania)
                .Take(10)
                .Select(o => new OfertaDto
                {
                    Id = o.IdOferta,
                    Tytul = o.Nazwa,
                    Opis = o.Opis,
                    Cena = o.Cena,
                    CenaPoprzednia = o.CenaPoprzednia,
                    Kategoria = o.Kategoria != null ? o.Kategoria.Nazwa : "Brak kategorii",
                    Sklep = o.Link,
                    Typ = o.Typ.ToString(),
                    DataUtworzenia = o.DataDodania.ToString("dd.MM.yyyy HH:mm"),
                    WaznoscOd = o.WaznoscOd,
                    WaznoscDo = o.WaznoscDo,
                    Votes = new VotesDto
                    {
                        Hot = o.LiczbaHot,
                        Cold = o.LiczbaCold
                    },
                    Komentarze = o.Komentarze.Count(k => k.Status == "aktywny"),
                    Autor = user.UserName ?? "Anonim",
                    AutorAvatarUrl = avatarUrl
                })
                .ToListAsync();

            // Statystyki
            var liczbaKomentarzy = await _context.Komentarze
                .CountAsync(k => k.IdUzytkownik == user.Id && k.Oferta != null && k.Oferta.Zatwierdzona);
            
            var liczbaDodanychOfert = await _context.Oferty
                .CountAsync(o => o.IdUzytkownik == user.Id && o.Zatwierdzona);
            
            var liczbaGlosow = await _context.Glosy
                .CountAsync(g => g.IdUzytkownik == user.Id);

            var profil = new PublicznyProfilDto
            {
                IdUzytkownik = user.Id,
                Nick = user.UserName ?? "Anonim",
                AvatarUrl = avatarUrl,
                Punkty = user.Punkty,
                DataRejestracji = user.DataRejestracji.ToString("dd.MM.yyyy"),
                Odznaki = odznaki,
                OstatnieKomentarze = ostatnieKomentarze,
                DodaneOferty = dodaneOferty,
                LiczbaKomentarzy = liczbaKomentarzy,
                LiczbaDodanychOfert = liczbaDodanychOfert,
                LiczbaGlosow = liczbaGlosow
            };

            return Ok(profil);
        }
    }
}
