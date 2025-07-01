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

namespace TechPromo.Api.Controllers
{
    [ApiController]
    [Route("admin")]
    [Authorize(Roles = "Admin")] // Tylko administratorzy mogą używać tych endpointów
    public class AdminController : ControllerBase
    {
        private readonly UserManager<Uzytkownik> _userManager;
        private readonly TechPromoDbContext _context;

        public AdminController(UserManager<Uzytkownik> userManager, TechPromoDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        [HttpPost("przyznaj-odznake")]
        public async Task<IActionResult> PrzyznajOdznakeUzytkownikowi([FromBody] PrzyznajOdznakaDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Sprawdź czy użytkownik istnieje
            var user = await _userManager.FindByIdAsync(dto.IdUzytkownik.ToString());
            if (user == null)
                return NotFound("Nie znaleziono użytkownika");

            // Sprawdź czy odznaka istnieje
            var odznaka = await _context.Odznaki.FindAsync(dto.IdOdznaka);
            if (odznaka == null)
                return NotFound("Nie znaleziono odznaki");

            // Sprawdź czy użytkownik już ma tę odznakę
            var juzMaOdznake = await _context.UzytkownikOdznaki
                .AnyAsync(uo => uo.IdUzytkownik == dto.IdUzytkownik && uo.IdOdznaka == dto.IdOdznaka);

            if (juzMaOdznake)
                return BadRequest("Użytkownik już posiada tę odznakę");

            // Przyznaj odznakę
            var uzytkownikOdznaka = new UzytkownikOdznaka
            {
                IdUzytkownik = dto.IdUzytkownik,
                IdOdznaka = dto.IdOdznaka,
                DataPrzyznania = DateTime.UtcNow
            };

            _context.UzytkownikOdznaki.Add(uzytkownikOdznaka);
            await _context.SaveChangesAsync();

            return Ok($"Odznaka '{odznaka.Nazwa}' została przyznana użytkownikowi '{user.UserName}'");
        }

        [HttpDelete("usun-odznake")]
        public async Task<IActionResult> UsunOdznakeUzytkownikowi([FromBody] PrzyznajOdznakaDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Sprawdź czy użytkownik ma tę odznakę
            var uzytkownikOdznaka = await _context.UzytkownikOdznaki
                .Include(uo => uo.Uzytkownik)
                .Include(uo => uo.Odznaka)
                .FirstOrDefaultAsync(uo => uo.IdUzytkownik == dto.IdUzytkownik && uo.IdOdznaka == dto.IdOdznaka);

            if (uzytkownikOdznaka == null)
                return NotFound("Użytkownik nie posiada tej odznaki");

            _context.UzytkownikOdznaki.Remove(uzytkownikOdznaka);
            await _context.SaveChangesAsync();

            return Ok($"Odznaka '{uzytkownikOdznaka.Odznaka.Nazwa}' została odebrana użytkownikowi '{uzytkownikOdznaka.Uzytkownik.UserName}'");
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
        public async Task<IActionResult> PobierzWszystkichUzytkownikow()
        {
            var uzytkownicy = await _context.Users
                .Select(u => new {
                    id = u.Id,
                    nick = u.UserName,
                    email = u.Email,
                    punkty = u.Punkty,
                    dataRejestracji = u.DataRejestracji.ToString("yyyy-MM-dd"),
                    emailConfirmed = u.EmailConfirmed
                })
                .ToListAsync();

            return Ok(uzytkownicy);
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

            // Usuń wszystkie przyznane odznaki tego typu
            var uzytkownikOdznaki = await _context.UzytkownikOdznaki
                .Where(uo => uo.IdOdznaka == id)
                .ToListAsync();

            _context.UzytkownikOdznaki.RemoveRange(uzytkownikOdznaki);
            _context.Odznaki.Remove(odznaka);
            await _context.SaveChangesAsync();

            return Ok($"Odznaka '{odznaka.Nazwa}' została usunięta");
        }

        [HttpPut("uzytkownik/{id}/punkty")]
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
    }
}
