using Microsoft.AspNetCore.Mvc;
using TechPromo.Api.Search.Models;
using TechPromo.Api.Search.Services;
using Microsoft.AspNetCore.Authorization;
using Azure.Search.Documents.Models;

namespace TechPromo.Api.Controllers
{
    /// <summary>
    /// Kontroler do obsługi wyszukiwania ofert za pomocą Azure AI Search
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class WyszukiwarkaController : ControllerBase
    {
        private readonly ISerwisWyszukiwania _searchService;
        private readonly IMapperWyszukiwaniaOfert _mapper;
        private readonly ILogger<WyszukiwarkaController> _logger;

        public WyszukiwarkaController(ISerwisWyszukiwania searchService, IMapperWyszukiwaniaOfert mapper, ILogger<WyszukiwarkaController> logger)
        {
            _searchService = searchService;
            _mapper = mapper;
            _logger = logger;
        }

        /// <summary>
        /// Wyszukaj oferty
        /// </summary>
        /// <param name="q">Tekst do wyszukania</param>
        /// <param name="filter">Filtr OData (np. "kategoria eq 'Elektronika'")</param>
        /// <param name="sort">Sortowanie (np. "cena asc", "dataDodania desc")</param>
        /// <param name="page">Numer strony (zaczyna od 0)</param>
        /// <param name="size">Rozmiar strony (maksymalnie 50)</param>
        /// <param name="facets">Facets do grupowania (kategoria,sklep,typ)</param>
        /// <param name="highlight">Pola do podkreślenia (nazwa,opis)</param>
        /// <returns>Wyniki wyszukiwania</returns>
        [HttpGet]
        public async Task<ActionResult<WynikWyszukiwania<ModelWyszukiwaniaOferty>>> Search(
            [FromQuery] string? q = null,
            [FromQuery] string? filter = null,
            [FromQuery] string? sort = null,
            [FromQuery] int page = 0,
            [FromQuery] int size = 20,
            [FromQuery] string? facets = null,
            [FromQuery] string? highlight = null)
        {
            try
            {
                // Walidacja parametrów
                if (page < 0) page = 0;
                if (size <= 0 || size > 50) size = 20;

                var query = new ZapytanieWyszukiwania
                {
                    SearchText = q,
                    Filter = filter,
                    OrderBy = sort,
                    Page = page,
                    PageSize = size,
                    SearchMode = SearchMode.Any,
                    QueryType = SearchQueryType.Simple
                };

                // Parsuj facets
                if (!string.IsNullOrWhiteSpace(facets))
                {
                    query.Facets = facets.Split(',').Select(f => f.Trim()).ToList();
                }

                // Parsuj pola do podkreślenia
                if (!string.IsNullOrWhiteSpace(highlight))
                {
                    query.HighlightFields = highlight.Split(',').Select(f => f.Trim()).ToList();
                }

                var result = await _searchService.SearchOfertAsync(query);
                
                _logger.LogInformation("Search completed: query='{Query}', results={Count}, time={Time}ms", 
                    q ?? "*", result.TotalCount, result.ExecutionTimeMs);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during search operation");
                return StatusCode(500, new { error = "Wystąpił błąd podczas wyszukiwania" });
            }
        }

        /// <summary>
        /// Wyszukiwanie zaawansowane z pełnymi opcjami
        /// </summary>
        /// <param name="request">Parametry wyszukiwania</param>
        /// <returns>Wyniki wyszukiwania</returns>
        [HttpPost("advanced")]
        public async Task<ActionResult<WynikWyszukiwania<ModelWyszukiwaniaOferty>>> AdvancedSearch([FromBody] ZapytanieWyszukiwania request)
        {
            try
            {
                // Walidacja
                if (request.Page < 0) request.Page = 0;
                if (request.PageSize <= 0 || request.PageSize > 50) request.PageSize = 20;

                var result = await _searchService.SearchOfertAsync(request);
                
                _logger.LogInformation("Advanced search completed: query='{Query}', results={Count}, time={Time}ms", 
                    request.SearchText ?? "*", result.TotalCount, result.ExecutionTimeMs);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during advanced search operation");
                return StatusCode(500, new { error = "Wystąpił błąd podczas wyszukiwania zaawansowanego" });
            }
        }

        /// <summary>
        /// Reindeksuj ofertę (wymaga autoryzacji)
        /// </summary>
        /// <param name="ofertaId">ID oferty do reindeksacji</param>
        /// <returns>Wynik operacji</returns>
        [HttpPost("reindex/{ofertaId}")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<ActionResult<WynikIndeksu>> ReindexOferta(int ofertaId)
        {
            try
            {
                var ofertaModel = await _mapper.GetOfertaForSearchAsync(ofertaId);
                if (ofertaModel == null)
                {
                    return NotFound(new { error = $"Oferta o ID {ofertaId} nie została znaleziona" });
                }

                var result = await _searchService.IndexOfertaAsync(ofertaModel);
                
                _logger.LogInformation("Reindexed offer {OfertaId}: success={Success}, time={Time}ms", 
                    ofertaId, result.Success, result.ExecutionTimeMs);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during offer reindexing: {OfertaId}", ofertaId);
                return StatusCode(500, new { error = "Wystąpił błąd podczas reindeksacji oferty" });
            }
        }

        /// <summary>
        /// Usuń ofertę z indeksu (wymaga autoryzacji)
        /// </summary>
        /// <param name="ofertaId">ID oferty do usunięcia</param>
        /// <returns>Wynik operacji</returns>
        [HttpDelete("index/{ofertaId}")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<ActionResult<WynikIndeksu>> DeleteFromIndex(int ofertaId)
        {
            try
            {
                var result = await _searchService.DeleteOfertaAsync(ofertaId);
                
                _logger.LogInformation("Deleted offer {OfertaId} from index: success={Success}, time={Time}ms", 
                    ofertaId, result.Success, result.ExecutionTimeMs);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during offer deletion from index: {OfertaId}", ofertaId);
                return StatusCode(500, new { error = "Wystąpił błąd podczas usuwania oferty z indeksu" });
            }
        }

        /// <summary>
        /// Reindeksuj wszystkie oferty (wymaga autoryzacji administratora)
        /// </summary>
        /// <returns>Wynik operacji</returns>
        [HttpPost("reindex-all")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<WynikIndeksu>> ReindexAll()
        {
            try
            {
                _logger.LogInformation("Starting full reindexing of all offers");

                var ofertas = await _mapper.GetAllActiveOfertasForSearchAsync();
                var result = await _searchService.IndexOfertasBatchAsync(ofertas);
                
                _logger.LogInformation("Full reindexing completed: indexed={Success}, errors={Errors}, time={Time}ms", 
                    result.SuccessCount, result.ErrorCount, result.ExecutionTimeMs);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during full reindexing");
                return StatusCode(500, new { error = "Wystąpił błąd podczas pełnej reindeksacji" });
            }
        }

        /// <summary>
        /// Pobierz statystyki indeksu (wymaga autoryzacji)
        /// </summary>
        /// <returns>Statystyki indeksu</returns>
        [HttpGet("statistics")]
        [Authorize(Roles = "Admin,Moderator")]
        public async Task<ActionResult<StatystykiIndeksu>> GetStatistics()
        {
            try
            {
                var stats = await _searchService.GetIndexStatisticsAsync();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting index statistics");
                return StatusCode(500, new { error = "Wystąpił błąd podczas pobierania statystyk" });
            }
        }

        /// <summary>
        /// Sprawdź status indeksu
        /// </summary>
        /// <returns>Status indeksu</returns>
        [HttpGet("status")]
        public async Task<ActionResult> GetIndexStatus()
        {
            try
            {
                var exists = await _searchService.IndexExistsAsync();
                if (!exists)
                {
                    return Ok(new { exists = false, message = "Indeks nie istnieje" });
                }

                var stats = await _searchService.GetIndexStatisticsAsync();
                return Ok(new 
                { 
                    exists = true, 
                    documentCount = stats.DocumentCount,
                    storageSize = stats.StorageSize,
                    lastModified = stats.LastModified
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while checking index status");
                return StatusCode(500, new { error = "Wystąpił błąd podczas sprawdzania statusu indeksu" });
            }
        }

        /// <summary>
        /// Utwórz indeks jeśli nie istnieje (wymaga autoryzacji administratora)
        /// </summary>
        /// <returns>Wynik operacji</returns>
        [HttpPost("create-index")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> CreateIndex()
        {
            try
            {
                var created = await _searchService.CreateIndexIfNotExistsAsync();
                if (created)
                {
                    return Ok(new { message = "Indeks został utworzony pomyślnie" });
                }
                else
                {
                    return BadRequest(new { error = "Nie udało się utworzyć indeksu" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating index");
                return StatusCode(500, new { error = "Wystąpił błąd podczas tworzenia indeksu" });
            }
        }

        /// <summary>
        /// Pobierz sugestie (autouzupełnianie) - funkcjonalność do przyszłej implementacji
        /// </summary>
        /// <param name="term">Fragment tekstu</param>
        /// <returns>Lista sugestii</returns>
        [HttpGet("suggest")]
        public async Task<ActionResult<List<string>>> GetSuggestions([FromQuery] string term)
        {
            // Placeholder - Azure AI Search ma wbudowane sugestie, ale wymagają dodatkowej konfiguracji
            await Task.CompletedTask;
            return Ok(new List<string>());
        }
    }
}