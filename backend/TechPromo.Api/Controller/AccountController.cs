using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using TechPromo.Api.Model;
using TechPromo.Api.DTO;
using TechPromo.Api.Data;
using TechPromo.Api.Services;

namespace TechPromo.Api.Controllers
{
    [ApiController]
    [Route("konto")]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<Uzytkownik> _userManager;
        private readonly SignInManager<Uzytkownik> _signInManager;
        private readonly TechPromoDbContext _context;
        private readonly IJwtService _jwtService;

        public AccountController(UserManager<Uzytkownik> userManager, SignInManager<Uzytkownik> signInManager, TechPromoDbContext context, IJwtService jwtService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _context = context;
            _jwtService = jwtService;
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
                // Nadaję nową rolę użytkownika (Admin dodaję ręcznie w bazie)
                await _userManager.AddToRoleAsync(user, "Uzytkownik");
                
                // Tworzę token JWT dla nowego użytkownika - od razu go loguję
                var token = await _jwtService.GenerateTokenAsync(user);
                var roles = await _userManager.GetRolesAsync(user);
                
                // Zwracam wszystkie dane potrzebne frontend-owi
                var loginResponse = new LoginResponseDto
                {
                    Token = token,                              // Główny token do autoryzacji
                    Nick = user.UserName ?? string.Empty,      // Nick do wyświetlenia
                    Email = user.Email ?? string.Empty,        // Email użytkownika
                    Rola = roles.FirstOrDefault() ?? "Uzytkownik", // Rola (Admin/Uzytkownik)
                    Punkty = user.Punkty,                      // Punkty w grze
                    ExpiresAt = DateTime.UtcNow.AddMinutes(60) // Kiedy token wygaśnie
                };
                
                return Ok(loginResponse);
            }
            return BadRequest(result.Errors);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Szukam użytkownika po emailu
            var user = await _userManager.FindByEmailAsync(loginDto.Email);
            if (user == null)
                return Unauthorized("Niepoprawne dane logowania.");

            // Sprawdzam hasło - używam CheckPasswordAsync zamiast SignInManager (bo JWT nie potrzebuje sesji)
            var result = await _userManager.CheckPasswordAsync(user, loginDto.Password);
            if (result)
            {
                // Hasło się zgadza - tworzę token JWT
                var token = await _jwtService.GenerateTokenAsync(user);
                var roles = await _userManager.GetRolesAsync(user);
                
                // Pakuję wszystkie dane dla frontend-u
                var loginResponse = new LoginResponseDto
                {
                    Token = token,                              // Token do zapisania w localStorage
                    Nick = user.UserName ?? string.Empty,      // Nick do wyświetlenia w UI
                    Email = user.Email ?? string.Empty,        // Email użytkownika
                    Rola = roles.FirstOrDefault() ?? "Uzytkownik", // Rola decyduje o dostępie do panelu admin
                    Punkty = user.Punkty,                      // Punkty do wyświetlenia
                    ExpiresAt = DateTime.UtcNow.AddMinutes(60) // Frontend wie kiedy token wygaśnie
                };
                
                return Ok(loginResponse);
            }
            return Unauthorized("Niepoprawne dane logowania.");
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            // W JWT logout robi frontend - po prostu usuwa token z localStorage
            // Backend nie musi nic robić bo token i tak wygaśnie za 60 minut
            return Ok(new { message = "Wylogowano. Frontend powinien usunąć token z przeglądarki." });
        }

        [HttpGet("profil")]
        [Authorize] // Ten atrybut sprawdza token JWT automatycznie
        public async Task<IActionResult> Profil()
        {
            if (User.Identity?.IsAuthenticated != true)
                return Unauthorized("Użytkownik nie jest uwierzytelniony");

            // Pobieram dane zalogowanego użytkownika z tokenu JWT
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized("Nie znaleziono użytkownika");

            var roles = await _userManager.GetRolesAsync(user);

            // Pobieram wszystkie odznaki tego użytkownika z bazy
            var uzytkownikOdznaki = await _context.UzytkownikOdznaki
                .Include(uo => uo.Odznaka)
                .Where(uo => uo.IdUzytkownik == user.Id)
                .ToListAsync();

            // Mapuję na DTO żeby frontend dostał czyste dane
            var odznakaList = uzytkownikOdznaki.Select(uo => new OdznakaDto
            {
                idOdznaka = uo.Odznaka.IdOdznaka,
                nazwa = uo.Odznaka.Nazwa,
                opis = uo.Odznaka.Opis ?? string.Empty,
                ikona = uo.Odznaka.Ikona ?? string.Empty,
                dataPrzyznania = uo.DataPrzyznania.ToString("yyyy-MM-dd")
            }).ToList();

            // Zwracam kompletny profil użytkownika
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

        public class UpdateProfilDto
        {
            public string? Nick { get; set; }
            public string? Email { get; set; }
            public string? HasloAktualne { get; set; }
            public string? HasloNowe { get; set; }
        }

        [HttpPut("profil")]
        [Authorize]
        public async Task<IActionResult> UpdateProfil([FromBody] UpdateProfilDto dto)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            bool changed = false;
            if (!string.IsNullOrWhiteSpace(dto.Nick) && dto.Nick != user.UserName)
            {
                user.UserName = dto.Nick.Trim();
                changed = true;
            }
            if (!string.IsNullOrWhiteSpace(dto.Email) && dto.Email != user.Email)
            {
                user.Email = dto.Email.Trim();
                changed = true;
            }

            if (!string.IsNullOrWhiteSpace(dto.HasloNowe))
            {
                if (string.IsNullOrWhiteSpace(dto.HasloAktualne))
                    return BadRequest("Aktualne hasło jest wymagane do zmiany hasła.");
                var passResult = await _userManager.ChangePasswordAsync(user, dto.HasloAktualne, dto.HasloNowe);
                if (!passResult.Succeeded)
                    return BadRequest(passResult.Errors);
            }

            if (changed)
            {
                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded) return BadRequest(result.Errors);
            }

            // Odśwież token jeśli zmieniono nick/email
            var roles = await _userManager.GetRolesAsync(user);
            var token = await _jwtService.GenerateTokenAsync(user);
            return Ok(new {
                message = "Profil zaktualizowany",
                token,
                nick = user.UserName,
                email = user.Email,
                rola = roles.FirstOrDefault() ?? "Uzytkownik",
                punkty = user.Punkty
            });
        }
    }
}
