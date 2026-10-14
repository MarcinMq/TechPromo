using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TechPromo.Api.Services;

namespace TechPromo.Api.Controllers
{
    [ApiController]
    [Route("test")]
    [Authorize(Roles = "Admin")]
    public class TestController : ControllerBase
    {
        private readonly ISerwisModeracjiTresci _serwisModeracji;

        public TestController(ISerwisModeracjiTresci serwisModeracji)
        {
            _serwisModeracji = serwisModeracji;
        }

        [HttpGet("public")]
        public IActionResult PublicEndpoint()
        {
            return Ok(new { message = "To jest publiczny endpoint - nie wymaga autoryzacji", timestamp = DateTime.UtcNow });
        }

        /// <summary>
        /// Endpoint do testowania moderacji treści (Azure Content Safety + Blocklist).
        /// </summary>
        [HttpPost("moderacja")]
        public async Task<IActionResult> TestujModeracje([FromBody] TestModeracjiDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Tekst))
            {
                return BadRequest(new { error = "Tekst jest wymagany" });
            }

            var wynik = await _serwisModeracji.ModerujTekstAsync(dto.Tekst);

            return Ok(new 
            {
                tekst = dto.Tekst,
                czyBezpieczny = wynik.CzyBezpieczny,
                czyZablokowany = wynik.CzyZablokowany,
                naruszonKategorie = wynik.NaruszonKategorie,
                znalezioneSlowa = wynik.ZnalezioneSlowa,
                komunikatDlaUzytkownika = wynik.KomunikatDlaUzytkownika,
                timestamp = DateTime.UtcNow
            });
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

    public class TestModeracjiDto
    {
        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.MaxLength(10000)]
        public string Tekst { get; set; } = string.Empty;
    }
}
