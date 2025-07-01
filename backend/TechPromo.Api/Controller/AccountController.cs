using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using TechPromo.Api.Model;
using TechPromo.Api.DTO;
using TechPromo.Api.Data;

namespace TechPromo.Api.Controllers
{
    [ApiController]
    [Route("konto")]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<Uzytkownik> _userManager;
        private readonly SignInManager<Uzytkownik> _signInManager;
        private readonly TechPromoDbContext _context;

        public AccountController(UserManager<Uzytkownik> userManager, SignInManager<Uzytkownik> signInManager, TechPromoDbContext context)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _context = context;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = new Uzytkownik
            {
                UserName = registerDto.Nick,
                Email = registerDto.Email,
                EmailConfirmed = true,
                DataRejestracji = System.DateTime.UtcNow,
                Punkty = 0
            };
            var result = await _userManager.CreateAsync(user, registerDto.Password);
            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(user, "Uzytkownik");
                await _signInManager.SignInAsync(user, isPersistent: false);
                return Ok("Zarejestrowano i zalogowano użytkownika.");
            }
            return BadRequest(result.Errors);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(loginDto.Email);
            if (user == null)
                return Unauthorized("Niepoprawne dane logowania.");

            var result = await _signInManager.PasswordSignInAsync(user.UserName ?? string.Empty, loginDto.Password, false, false);
            if (result.Succeeded)
            {
                return Ok("Zalogowano poprawnie.");
            }
            return Unauthorized("Niepoprawne dane logowania.");
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return Ok("Wylogowano.");
        }

        [HttpGet("profil")]
        public async Task<IActionResult> Profil()
        {
            if (User.Identity?.IsAuthenticated != true)
                return Unauthorized("Użytkownik nie jest uwierzytelniony");

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized("Nie znaleziono użytkownika");

            var roles = await _userManager.GetRolesAsync(user);

            // Pobierz odznaki użytkownika
            var uzytkownikOdznaki = await _context.UzytkownikOdznaki
                .Include(uo => uo.Odznaka)
                .Where(uo => uo.IdUzytkownik == user.Id)
                .ToListAsync();

            var odznakaList = uzytkownikOdznaki.Select(uo => new OdznakaDto
            {
                idOdznaka = uo.Odznaka.IdOdznaka,
                nazwa = uo.Odznaka.Nazwa,
                opis = uo.Odznaka.Opis ?? string.Empty,
                ikona = uo.Odznaka.Ikona ?? string.Empty,
                dataPrzyznania = uo.DataPrzyznania.ToString("yyyy-MM-dd")
            }).ToList();

            var profilResponse = new ProfilResponseDto
            {
                nick = user.UserName ?? string.Empty,
                email = user.Email ?? string.Empty,
                rola = roles.FirstOrDefault() ?? "Brak",
                punkty = user.Punkty,
                dataRejestracji = user.DataRejestracji.ToString("yyyy-MM-dd"),
                odznaki = odznakaList
            };

            return Ok(profilResponse);
        }
    }
}
