using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using TechPromo.Api.Model;

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
        public async Task<IActionResult> Register(
            [FromForm] string nick,
            [FromForm] string email,
            [FromForm] string password)
        {
            var user = new Uzytkownik
            {
                UserName = nick,
                Email = email,
                EmailConfirmed = true,
                DataRejestracji = System.DateTime.UtcNow,
                Punkty = 0
            };
            var result = await _userManager.CreateAsync(user, password);
            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(user, "Uzytkownik");
                await _signInManager.SignInAsync(user, isPersistent: false);
                return Ok("Zarejestrowano i zalogowano użytkownika.");
            }
            return BadRequest(result.Errors);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(
            [FromForm] string email,
            [FromForm] string password)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
                return Unauthorized("Niepoprawne dane logowania.");

            var result = await _signInManager.PasswordSignInAsync(user.UserName, password, false, false);
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
            if (!User.Identity.IsAuthenticated)
                return Unauthorized();

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new
            {
                nick = user.UserName,
                email = user.Email,
                rola = roles.FirstOrDefault() ?? "Brak",
                punkty = user.Punkty,
                dataRejestracji = user.DataRejestracji.ToString("yyyy-MM-dd")
                
            });
        }
    }
}
