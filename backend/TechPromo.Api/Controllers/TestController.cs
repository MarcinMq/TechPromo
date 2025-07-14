using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace TechPromo.Api.Controllers
{
    [ApiController]
    [Route("test")]
    public class TestController : ControllerBase
    {
        [HttpGet("public")]
        public IActionResult PublicEndpoint()
        {
            return Ok(new { message = "To jest publiczny endpoint - nie wymaga autoryzacji", timestamp = DateTime.UtcNow });
        }

        [HttpGet("protected")]
        [Authorize]
        public IActionResult ProtectedEndpoint()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userName = User.FindFirst(ClaimTypes.Name)?.Value;
            var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var punkty = User.FindFirst("punkty")?.Value;

            return Ok(new
            {
                message = "To jest chroniony endpoint - wymaga autoryzacji JWT",
                user = new
                {
                    id = userId,
                    name = userName,
                    email = userEmail,
                    role = userRole,
                    punkty = punkty
                },
                timestamp = DateTime.UtcNow
            });
        }

        [HttpGet("admin-only")]
        [Authorize(Roles = "Admin")]
        public IActionResult AdminOnlyEndpoint()
        {
            return Ok(new { message = "To jest endpoint tylko dla administratorów", timestamp = DateTime.UtcNow });
        }

        [HttpGet("user-only")]
        [Authorize(Roles = "Uzytkownik")]
        public IActionResult UserOnlyEndpoint()
        {
            return Ok(new { message = "To jest endpoint tylko dla użytkowników", timestamp = DateTime.UtcNow });
        }
    }
}
