using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TechPromo.Api.Dtos;
using TechPromo.Api.Models;

namespace TechPromo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<Uzytkownik> _userManager;
    private readonly SignInManager<Uzytkownik> _signInManager;

    public AuthController(UserManager<Uzytkownik> userManager, SignInManager<Uzytkownik> signInManager)
    {
        _userManager = userManager;
        _signInManager = signInManager;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = new Uzytkownik { UserName = dto.Email, Email = dto.Email };
        var result = await _userManager.CreateAsync(user, dto.Password);

        if (!result.Succeeded)
            return BadRequest(result.Errors);

        await _signInManager.SignInAsync(user, isPersistent: false);
        return Ok();
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _signInManager.PasswordSignInAsync(dto.Email, dto.Password, isPersistent: false, lockoutOnFailure: false);
        if (result.Succeeded)
            return Ok();

        return Unauthorized();
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return Ok();
    }
}
