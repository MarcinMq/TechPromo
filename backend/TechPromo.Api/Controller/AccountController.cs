// Konto: rejestracja, logowanie, profil
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using System.IO;
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
    private readonly IBadgeService _badgeService;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        public AccountController(UserManager<Uzytkownik> userManager, SignInManager<Uzytkownik> signInManager, TechPromoDbContext context, IJwtService jwtService, IBadgeService badgeService, IEmailService emailService, IConfiguration configuration)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _context = context;
            _jwtService = jwtService;
            _badgeService = badgeService;
            _emailService = emailService;
            _configuration = configuration;
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

            // Wyznacz avatarUrl jeśli istnieje zapisany plik w wwwroot/uploads/profiles
            string? avatarUrl = null;
            try
            {
                var webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                var profilesDir = Path.Combine(webRoot, "uploads", "profiles");
                Directory.CreateDirectory(profilesDir);
                var existing = Directory.GetFiles(profilesDir, $"user_{user.Id}.*").FirstOrDefault();
                if (existing != null)
                {
                    var fileName = Path.GetFileName(existing);
                    avatarUrl = $"{Request.Scheme}://{Request.Host}/uploads/profiles/{fileName}";
                }
            }
            catch { /* pomiń błąd wykrywania avatara */ }

            // Zwracam kompletny profil użytkownika
            var profilResponse = new ProfilResponseDto
            {
                nick = user.UserName ?? string.Empty,
                email = user.Email ?? string.Empty,
                rola = roles.FirstOrDefault() ?? "Brak",
                punkty = user.Punkty,
                dataRejestracji = user.DataRejestracji.ToString("yyyy-MM-dd"),
                avatarUrl = avatarUrl,
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

        // POST: /konto/profil/avatar - upload avatara użytkownika (FormData: avatar)
        [HttpPost("profil/avatar")]
        [Authorize]
        public async Task<IActionResult> UploadAvatar([FromForm(Name = "avatar")] IFormFile? avatar)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            if (avatar == null || avatar.Length == 0)
                return BadRequest("Brak pliku do przesłania");

            // Walidacja typu pliku
            var allowedExt = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var ext = Path.GetExtension(avatar.FileName).ToLowerInvariant();
            if (!allowedExt.Contains(ext))
                return BadRequest("Nieobsługiwany format. Dozwolone: jpg, jpeg, png, webp");

            // Limit rozmiaru (np. 5MB)
            const long maxSize = 5L * 1024 * 1024;
            if (avatar.Length > maxSize)
                return BadRequest("Plik jest zbyt duży (max 5MB)");

            var webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var profilesDir = Path.Combine(webRoot, "uploads", "profiles");
            Directory.CreateDirectory(profilesDir);

            // Usuń stare avatary tego użytkownika
            foreach (var old in Directory.GetFiles(profilesDir, $"user_{user.Id}.*"))
            {
                try { System.IO.File.Delete(old); } catch { }
            }

            var fileName = $"user_{user.Id}{ext}";
            var filePath = Path.Combine(profilesDir, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await avatar.CopyToAsync(stream);
            }

            var url = $"{Request.Scheme}://{Request.Host}/uploads/profiles/{fileName}";
            // Oceń odznaki (avatar_set)
            await _badgeService.EvaluateForUserAsync(user.Id);
            return Ok(new { avatarUrl = url });
        }

        // POST: /konto/zapomniane-haslo - wysyła email z linkiem resetowania
        [HttpPost("zapomniane-haslo")]
        public async Task<IActionResult> ZapomnianeHaslo([FromBody] ZapomnianeHasloDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(dto.Email);
            
            // ZAWSZE zwracaj sukces (security best practice - nie ujawniaj czy email istnieje)
            // Jeśli email nie istnieje, po prostu nic nie wysyłaj
            if (user == null)
            {
                return Ok(new { message = "Jeśli podany email istnieje w systemie, wyślemy link do resetowania hasła." });
            }

            // Generuj token resetowania hasła (ASP.NET Identity ma to wbudowane)
            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);

            // Zakoduj token do URL (zawiera znaki specjalne)
            var encodedToken = Uri.EscapeDataString(resetToken);

            // Pobierz FrontendUrl z konfiguracji
            var frontendUrl = _configuration["EmailSettings:FrontendUrl"] ?? "http://localhost:5174";
            
            // Zbuduj link resetowania (frontend będzie obsługiwał tę stronę)
            var resetUrl = $"{frontendUrl}/resetuj-haslo?token={encodedToken}&email={Uri.EscapeDataString(user.Email ?? "")}";

            // Wyślij email
            var emailSent = await _emailService.WyslijEmailResetowaniaHaslaAsync(user.Email ?? "", resetUrl);

            if (!emailSent)
            {
                // Loguj błąd, ale nie ujawniaj użytkownikowi że wysyłka się nie powiodła
                Console.WriteLine($"⚠️ Nie udało się wysłać emaila resetowania hasła do {user.Email}");
            }

            return Ok(new { message = "Jeśli podany email istnieje w systemie, wyślemy link do resetowania hasła." });
        }

        // POST: /konto/resetuj-haslo - resetuje hasło używając tokenu z emaila
        [HttpPost("resetuj-haslo")]
        public async Task<IActionResult> ResetujHaslo([FromBody] ResetujHasloDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
                return BadRequest(new { message = "Nieprawidłowy token resetowania." });

            // Zresetuj hasło używając tokenu
            var result = await _userManager.ResetPasswordAsync(user, dto.Token, dto.NoweHaslo);

            if (!result.Succeeded)
            {
                var errors = result.Errors.Select(e => e.Description).ToList();
                return BadRequest(new { message = "Nie udało się zresetować hasła.", errors });
            }

            return Ok(new { message = "Hasło zostało pomyślnie zresetowane. Możesz się teraz zalogować." });
        }
    }
}
