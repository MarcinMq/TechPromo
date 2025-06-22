using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TechPromo.Api.Models;
using TechPromo.Api.Models.Dto;

namespace TechPromo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly UserManager<Uzytkownik> _userManager;

    public UsersController(UserManager<Uzytkownik> userManager)
    {
        _userManager = userManager;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public ActionResult<IEnumerable<UserDto>> GetUsers()
    {
        var users = _userManager.Users.Select(u => new UserDto
        {
            Id = u.Id,
            Email = u.Email!,
            NazwaUzytkownika = u.NazwaUzytkownika,
            Rola = u.Rola
        }).ToList();
        return Ok(users);
    }

    [HttpPut("{id}/role")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ChangeRole(int id, ChangeRoleDto dto)
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!);
        if (userId == id)
            return BadRequest("Nie mozna zmienic swojej roli");

        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null) return NotFound();

        var currentRoles = await _userManager.GetRolesAsync(user);
        await _userManager.RemoveFromRolesAsync(user, currentRoles);
        await _userManager.AddToRoleAsync(user, dto.Rola);
        user.Rola = dto.Rola;
        await _userManager.UpdateAsync(user);

        return NoContent();
    }
}
