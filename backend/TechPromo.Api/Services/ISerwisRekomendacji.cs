using TechPromo.Api.DTO;

namespace TechPromo.Api.Services
{
    /// <summary>
    /// Interfejs serwisu rekomendacji hybrydowych
    /// </summary>
    public interface ISerwisRekomendacji
    {
        /// <summary>
        /// Pobiera rekomendacje dla użytkownika (hybrydowe: CF + Content-Based)
        /// </summary>
        Task<List<OfertaDto>> PobierzRekomendacjeAsync(int userId, int limit = 10);
        
        /// <summary>
        /// Pobiera oferty podobne do podanej (Content-Based)
        /// </summary>
        Task<List<OfertaDto>> PobierzPodobneOfertyAsync(int ofertaId, int limit = 5);
    }
}
