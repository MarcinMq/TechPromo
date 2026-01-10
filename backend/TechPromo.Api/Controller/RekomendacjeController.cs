using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TechPromo.Api.DTO;
using TechPromo.Api.Services;

namespace TechPromo.Api.Controllers
{
    /// <summary>
    /// Kontroler rekomendacji - hybrydowy system rekomendacji
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class RekomendacjeController : ControllerBase
    {
        private readonly ISerwisRekomendacji _serwisRekomendacji;
        private readonly ILogger<RekomendacjeController> _logger;

        public RekomendacjeController(
            ISerwisRekomendacji serwisRekomendacji,
            ILogger<RekomendacjeController> logger)
        {
            _serwisRekomendacji = serwisRekomendacji;
            _logger = logger;
        }

        /// <summary>
        /// Pobiera rekomendacje dla zalogowanego użytkownika
        /// </summary>
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<List<OfertaDto>>> PobierzRekomendacje([FromQuery] int limit = 10)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized("Nie można zidentyfikować użytkownika");
                }

                var rekomendacje = await _serwisRekomendacji.PobierzRekomendacjeAsync(userId, limit);
                
                _logger.LogInformation("Pobrano {Count} rekomendacji dla użytkownika {UserId}", rekomendacje.Count, userId);
                
                return Ok(rekomendacje);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Błąd podczas pobierania rekomendacji");
                return StatusCode(500, "Wystąpił błąd podczas pobierania rekomendacji");
            }
        }

        /// <summary>
        /// Pobiera oferty podobne do podanej (dla niezalogowanych też)
        /// </summary>
        [HttpGet("podobne/{ofertaId}")]
        public async Task<ActionResult<List<OfertaDto>>> PobierzPodobne(int ofertaId, [FromQuery] int limit = 5)
        {
            try
            {
                var podobne = await _serwisRekomendacji.PobierzPodobneOfertyAsync(ofertaId, limit);
                return Ok(podobne);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Błąd podczas pobierania podobnych ofert dla oferty {OfertaId}", ofertaId);
                return StatusCode(500, "Wystąpił błąd podczas pobierania podobnych ofert");
            }
        }
    }
}
