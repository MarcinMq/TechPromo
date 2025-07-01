using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Threading.Tasks;
using TechPromo.Api.Model;
using TechPromo.Api.DTO;

namespace TechPromo.Api.Controllers
{
    [ApiController]
    [Route("konto")]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<Uzytkownik> _userManager;
        private readonly SignInManager<Uzytkownik> _signInManager;

        public AccountController(UserManager<Uzytkownik> userManager, SignInManager<Uzytkownik> signInManager)
        {
            _userManager = userManager;
            _signInManager = signInManager;
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

            var profilResponse = new ProfilResponseDto
            {
                nick = user.UserName ?? string.Empty,
                email = user.Email ?? string.Empty,
                rola = roles.FirstOrDefault() ?? "Brak",
                punkty = user.Punkty,
                dataRejestracji = user.DataRejestracji.ToString("yyyy-MM-dd")
            };

            return Ok(profilResponse);
        }
    }
}
