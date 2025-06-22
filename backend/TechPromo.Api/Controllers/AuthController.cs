using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TechPromo.Api.Models;
using TechPromo.Api.Models.Dto;
using TechPromo.Api.Services;

namespace TechPromo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<Uzytkownik> _userManager;
    private readonly JwtService _jwtService;

    public AuthController(UserManager<Uzytkownik> userManager, JwtService jwtService)
    {
        _userManager = userManager;
        _jwtService = jwtService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var user = new Uzytkownik
        {
            UserName = dto.Email,
            Email = dto.Email,
            NazwaUzytkownika = dto.NazwaUzytkownika,
            DataRejestracji = DateTime.UtcNow,
            Rola = "Uzytkownik"
        };
        user.Haslo = _userManager.PasswordHasher.HashPassword(user, dto.Password);

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded) return BadRequest(result.Errors);

        await _userManager.AddToRoleAsync(user, "Uzytkownik");
        return Ok();
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null) return Unauthorized();

        var valid = await _userManager.CheckPasswordAsync(user, dto.Password);
        if (!valid) return Unauthorized();

        var roles = await _userManager.GetRolesAsync(user);
        var token = _jwtService.GenerateToken(user, roles);

        return Ok(new { token, role = roles.FirstOrDefault() });
    }
}
