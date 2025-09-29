using Azure;
using Azure.Identity;
using Azure.Search.Documents;
using Azure.Search.Documents.Indexes;
using Azure.Search.Documents.Indexes.Models;
using Azure.Search.Documents.Models;
using System.Diagnostics;
using TechPromo.Api.Search.Models;

namespace TechPromo.Api.Search.Services
{
    // Serwis Azure Search
    public class SerwisWyszukiwania : ISerwisWyszukiwania
    {
        private readonly SearchClient _searchClient;
        private readonly SearchIndexClient _indexClient;
        private readonly ILogger<SerwisWyszukiwania> _logger;
        private const string IndexName = "ofertas-index";

        public SerwisWyszukiwania(IConfiguration configuration, ILogger<SerwisWyszukiwania> logger)
        {
            _logger = logger;

            var searchEndpoint = configuration["AzureSearch:Endpoint"] 
                ?? throw new InvalidOperationException("AzureSearch:Endpoint not configured");

            var apiKey = configuration["AzureSearch:ApiKey"];
            
            if (!string.IsNullOrEmpty(apiKey))
            {
                // Klucz API użyty
                var credential = new AzureKeyCredential(apiKey);
                _searchClient = new SearchClient(new Uri(searchEndpoint), IndexName, credential);
                _indexClient = new SearchIndexClient(new Uri(searchEndpoint), credential);
            }
            else
            {
                // Fallback na DefaultCred
                var credential = new DefaultAzureCredential();
                _searchClient = new SearchClient(new Uri(searchEndpoint), IndexName, credential);
                _indexClient = new SearchIndexClient(new Uri(searchEndpoint), credential);
            }
        }

        public async Task<WynikWyszukiwania<ModelWyszukiwaniaOferty>> SearchOfertAsync(ZapytanieWyszukiwania query, CancellationToken cancellationToken = default)
        {
            try
            {
                var stopwatch = Stopwatch.StartNew();

                var searchOptions = new SearchOptions
                {
                    Size = Math.Min(query.PageSize, 50), // Max 50
                    Skip = query.Page * query.PageSize,
                    SearchMode = query.SearchMode,
                    QueryType = query.QueryType,
                    IncludeTotalCount = true
                };

                // Filtr
                if (!string.IsNullOrWhiteSpace(query.Filter))
                {
                    searchOptions.Filter = query.Filter;
                }

                // Sortowanie
                if (!string.IsNullOrWhiteSpace(query.OrderBy))
                {
                    searchOptions.OrderBy.Add(query.OrderBy);
                }

                // Facets
                if (query.Facets?.Any() == true)
                {
                    foreach (var facet in query.Facets)
                    {
                        searchOptions.Facets.Add(facet);
                    }
                }

                // Podkreślenia
                if (query.HighlightFields?.Any() == true)
                {
                    foreach (var field in query.HighlightFields)
                    {
                        searchOptions.HighlightFields.Add(field);
                    }
                }

                var searchText = string.IsNullOrWhiteSpace(query.SearchText) ? "*" : query.SearchText;
                var response = await _searchClient.SearchAsync<ModelWyszukiwaniaOferty>(searchText, searchOptions, cancellationToken);

                stopwatch.Stop();

                var result = new WynikWyszukiwania<ModelWyszukiwaniaOferty>
                {
                    TotalCount = response.Value.TotalCount ?? 0,
                    CurrentPage = query.Page,
                    PageSize = query.PageSize,
                    ExecutionTimeMs = stopwatch.Elapsed.TotalMilliseconds
                };

                // Mapuj wyniki
                await foreach (var searchResult in response.Value.GetResultsAsync())
                {
                    result.Items.Add(new ElementWyniku<ModelWyszukiwaniaOferty>
                    {
                        Document = searchResult.Document,
                        Score = searchResult.Score,
                        Highlights = searchResult.Highlights?.ToDictionary(h => h.Key, h => h.Value) ?? new()
                    });
                }

                // Mapuj facets
                if (response.Value.Facets != null)
                {
                    result.Facets = response.Value.Facets.ToDictionary(f => f.Key, f => f.Value);
                }

                _logger.LogInformation("Search executed in {ExecutionTime}ms, found {TotalCount} results", 
                    result.ExecutionTimeMs, result.TotalCount);

                return result;
            }
            catch (RequestFailedException ex)
            {
                _logger.LogError(ex, "Azure Search request failed: {ErrorCode} - {ErrorMessage}", ex.ErrorCode, ex.Message);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during search operation");
                throw;
            }
        }

        public async Task<WynikIndeksu> IndexOfertaAsync(ModelWyszukiwaniaOferty oferta, CancellationToken cancellationToken = default)
        {
            return await IndexOfertasBatchAsync(new[] { oferta }, cancellationToken);
        }

        public async Task<WynikIndeksu> IndexOfertasBatchAsync(IEnumerable<ModelWyszukiwaniaOferty> ofertas, CancellationToken cancellationToken = default)
        {
            try
            {
                var stopwatch = Stopwatch.StartNew();
                var documents = ofertas.Select(o => new IndexDocumentsAction<ModelWyszukiwaniaOferty>(IndexActionType.MergeOrUpload, o));
                
                var batch = IndexDocumentsBatch.Create(documents.ToArray());
                var response = await _searchClient.IndexDocumentsAsync(batch, cancellationToken: cancellationToken);

                stopwatch.Stop();

                var result = new WynikIndeksu
                {
                    Success = response.Value.Results.All(r => r.Succeeded),
                    SuccessCount = response.Value.Results.Count(r => r.Succeeded),
                    ErrorCount = response.Value.Results.Count(r => !r.Succeeded),
                    ExecutionTimeMs = stopwatch.Elapsed.TotalMilliseconds
                };

                // Błędy listuj
                foreach (var error in response.Value.Results.Where(r => !r.Succeeded))
                {
                    result.Errors.Add($"Document {error.Key}: {error.ErrorMessage}");
                }

                _logger.LogInformation("Indexed {SuccessCount} documents in {ExecutionTime}ms, {ErrorCount} errors", 
                    result.SuccessCount, result.ExecutionTimeMs, result.ErrorCount);

                if (result.ErrorCount > 0)
                {
                    _logger.LogWarning("Indexing errors: {Errors}", string.Join("; ", result.Errors));
                }

                return result;
            }
            catch (RequestFailedException ex)
            {
                _logger.LogError(ex, "Azure Search indexing request failed: {ErrorCode} - {ErrorMessage}", ex.ErrorCode, ex.Message);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during indexing operation");
                throw;
            }
        }

        public async Task<WynikIndeksu> DeleteOfertaAsync(int ofertaId, CancellationToken cancellationToken = default)
        {
            try
            {
                var stopwatch = Stopwatch.StartNew();
                var documentId = $"oferta_{ofertaId}";
                
                var batch = IndexDocumentsBatch.Delete("id", new[] { documentId });
                var response = await _searchClient.IndexDocumentsAsync(batch, cancellationToken: cancellationToken);

                stopwatch.Stop();

                var result = new WynikIndeksu
                {
                    Success = response.Value.Results.All(r => r.Succeeded),
                    SuccessCount = response.Value.Results.Count(r => r.Succeeded),
                    ErrorCount = response.Value.Results.Count(r => !r.Succeeded),
                    ExecutionTimeMs = stopwatch.Elapsed.TotalMilliseconds
                };

                foreach (var error in response.Value.Results.Where(r => !r.Succeeded))
                {
                    result.Errors.Add($"Document {error.Key}: {error.ErrorMessage}");
                }

                _logger.LogInformation("Deleted document {DocumentId} in {ExecutionTime}ms", 
                    documentId, result.ExecutionTimeMs);

                return result;
            }
            catch (RequestFailedException ex)
            {
                _logger.LogError(ex, "Azure Search delete request failed: {ErrorCode} - {ErrorMessage}", ex.ErrorCode, ex.Message);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during delete operation");
                throw;
            }
        }

        public async Task<WynikIndeksu> ClearIndexAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var stopwatch = Stopwatch.StartNew();
                
                // Pobierz ID
                var searchOptions = new SearchOptions
                {
                    Size = 1000,
                    Select = { "id" }
                };

                var allDocuments = new List<string>();
                var response = await _searchClient.SearchAsync<ModelWyszukiwaniaOferty>("*", searchOptions, cancellationToken);

                await foreach (var searchResult in response.Value.GetResultsAsync())
                {
                    allDocuments.Add(searchResult.Document.Id);
                }

                if (allDocuments.Count == 0)
                {
                    return new WynikIndeksu { Success = true, ExecutionTimeMs = stopwatch.Elapsed.TotalMilliseconds };
                }

                // Usuń wszystkie
                var batch = IndexDocumentsBatch.Delete("id", allDocuments);
                var deleteResponse = await _searchClient.IndexDocumentsAsync(batch, cancellationToken: cancellationToken);

                stopwatch.Stop();

                var result = new WynikIndeksu
                {
                    Success = deleteResponse.Value.Results.All(r => r.Succeeded),
                    SuccessCount = deleteResponse.Value.Results.Count(r => r.Succeeded),
                    ErrorCount = deleteResponse.Value.Results.Count(r => !r.Succeeded),
                    ExecutionTimeMs = stopwatch.Elapsed.TotalMilliseconds
                };

                _logger.LogInformation("Cleared index in {ExecutionTime}ms, deleted {SuccessCount} documents", 
                    result.ExecutionTimeMs, result.SuccessCount);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during index clearing");
                throw;
            }
        }

        public async Task<bool> IndexExistsAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                await _indexClient.GetIndexAsync(IndexName, cancellationToken);
                return true;
            }
            catch (RequestFailedException ex) when (ex.Status == 404)
            {
                return false;
            }
        }

        public async Task<bool> CreateIndexIfNotExistsAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                if (await IndexExistsAsync(cancellationToken))
                {
                    _logger.LogInformation("Index {IndexName} already exists", IndexName);
                    return true;
                }

                var index = new SearchIndex(IndexName)
                {
                    Fields = new FieldBuilder().Build(typeof(ModelWyszukiwaniaOferty))
                };

                // Suggester do autocomp
                index.Suggesters.Add(new SearchSuggester("sg-ofertas", "nazwa", "opis", "kategoria", "sklep", "tagi"));

                await _indexClient.CreateIndexAsync(index, cancellationToken);
                _logger.LogInformation("Created index {IndexName}", IndexName);
                return true;
            }
            catch (RequestFailedException ex)
            {
                _logger.LogError(ex, "Failed to create index {IndexName}: {ErrorCode} - {ErrorMessage}", 
                    IndexName, ex.ErrorCode, ex.Message);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating index {IndexName}", IndexName);
                return false;
            }
        }

        public async Task<StatystykiIndeksu> GetIndexStatisticsAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var stats = await _indexClient.GetIndexStatisticsAsync(IndexName, cancellationToken);
                
                return new StatystykiIndeksu
                {
                    DocumentCount = stats.Value.DocumentCount,
                    StorageSize = stats.Value.StorageSize
                };
            }
            catch (RequestFailedException ex)
            {
                _logger.LogError(ex, "Failed to get index statistics: {ErrorCode} - {ErrorMessage}", ex.ErrorCode, ex.Message);
                throw;
            }
        }

    // Sugestie autocomplet
        public async Task<List<string>> GetSuggestionsAsync(string partialQuery, int maxSuggestions = 5, CancellationToken cancellationToken = default)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(partialQuery))
                    return new List<string>();

                var suggestOptions = new SuggestOptions
                {
                    Size = Math.Min(maxSuggestions, 20), // Max 20
                    UseFuzzyMatching = true, // Fuzzy
                    Filter = "aktywna eq true and zatwierdzona eq true" // Tylko aktywne
                };

                // Suggester sg-ofertas
                var result = await _searchClient.SuggestAsync<ModelWyszukiwaniaOferty>(
                    partialQuery, "sg-ofertas", suggestOptions, cancellationToken);

                var suggestions = result.Value.Results
                    .Select(s => s.Text)
                    .Distinct()
                    .Take(maxSuggestions)
                    .ToList();

                _logger.LogInformation("Generated {Count} suggestions for query '{Query}'", 
                    suggestions.Count, partialQuery);

                return suggestions;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting suggestions for query '{Query}'", partialQuery);
                return new List<string>();
            }
        }
    }
}