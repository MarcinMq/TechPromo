using TechPromo.Api.Search.Services;
using TechPromo.Api.Data;
using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Model;

namespace TechPromo.Api.Search.Services
{
    // Serwis synchronizacji z Azure AI Search
    public class SearchSyncService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<SearchSyncService> _logger;
        private readonly TimeSpan _syncInterval = TimeSpan.FromMinutes(30); // Synchronizacja co 30 minut

        public SearchSyncService(IServiceProvider serviceProvider, ILogger<SearchSyncService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Search sync service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await SyncOffersToSearchAsync(stoppingToken);
                    await Task.Delay(_syncInterval, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("Search sync service is stopping");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred during search synchronization");
                    // Poczekaj krócej po błędzie przed następną próbą
                    await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                }
            }

            _logger.LogInformation("Search sync service stopped");
        }

        private async Task SyncOffersToSearchAsync(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var searchService = scope.ServiceProvider.GetRequiredService<ISerwisWyszukiwania>();
            var mapper = scope.ServiceProvider.GetRequiredService<IMapperWyszukiwaniaOfert>();
            var dbContext = scope.ServiceProvider.GetRequiredService<TechPromoDbContext>();

            try
            {
                _logger.LogInformation("Starting search synchronization");

                // Sprawdź czy indeks istnieje, jeśli nie - utwórz
                var indexExists = await searchService.IndexExistsAsync(cancellationToken);
                if (!indexExists)
                {
                    _logger.LogWarning("Search index does not exist, creating...");
                    var created = await searchService.CreateIndexIfNotExistsAsync(cancellationToken);
                    if (!created)
                    {
                        _logger.LogError("Failed to create search index");
                        return;
                    }
                    _logger.LogInformation("Search index created successfully");
                }

                // Pobierz wszystkie aktywne oferty z bazy danych
                var ofertas = await mapper.GetAllActiveOfertasForSearchAsync(cancellationToken);
                
                if (ofertas.Count == 0)
                {
                    _logger.LogInformation("No active offers found for synchronization");
                    return;
                }

                // Synchronizuj z indeksem (batch operation)
                var result = await searchService.IndexOfertasBatchAsync(ofertas, cancellationToken);

                if (result.Success)
                {
                    _logger.LogInformation("Search synchronization completed successfully: {SuccessCount} offers indexed in {Time}ms",
                        result.SuccessCount, result.ExecutionTimeMs);
                }
                else
                {
                    _logger.LogWarning("Search synchronization completed with errors: {SuccessCount} success, {ErrorCount} errors in {Time}ms. Errors: {Errors}",
                        result.SuccessCount, result.ErrorCount, result.ExecutionTimeMs, string.Join("; ", result.Errors));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during search synchronization");
                throw;
            }
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Search sync service is stopping...");
            await base.StopAsync(cancellationToken);
        }
    }

    // Interface ręcznej synchronizacji ofert
    public interface ISearchSyncManager
    {
        // Synchronizuj konkretną ofertę
        Task<bool> SyncOfertaAsync(int ofertaId, CancellationToken cancellationToken = default);

        // Usuń ofertę z indeksu
        Task<bool> RemoveOfertaAsync(int ofertaId, CancellationToken cancellationToken = default);

        // Pełna synchronizacja wszystkich ofert
        Task<bool> FullSyncAsync(CancellationToken cancellationToken = default);
    }

    // Manager synchronizacji
    public class SearchSyncManager : ISearchSyncManager
    {
        private readonly ISerwisWyszukiwania _searchService;
        private readonly IMapperWyszukiwaniaOfert _mapper;
        private readonly ILogger<SearchSyncManager> _logger;

        public SearchSyncManager(ISerwisWyszukiwania searchService, IMapperWyszukiwaniaOfert mapper, ILogger<SearchSyncManager> logger)
        {
            _searchService = searchService;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<bool> SyncOfertaAsync(int ofertaId, CancellationToken cancellationToken = default)
        {
            try
            {
                var oferta = await _mapper.GetOfertaForSearchAsync(ofertaId, cancellationToken);
                if (oferta == null)
                {
                    _logger.LogWarning("Offer {OfertaId} not found, cannot sync to search", ofertaId);
                    return false;
                }

                var result = await _searchService.IndexOfertaAsync(oferta, cancellationToken);
                
                if (result.Success)
                {
                    _logger.LogInformation("Offer {OfertaId} synced to search successfully", ofertaId);
                    return true;
                }
                else
                {
                    _logger.LogWarning("Failed to sync offer {OfertaId} to search: {Errors}", 
                        ofertaId, string.Join("; ", result.Errors));
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing offer {OfertaId} to search", ofertaId);
                return false;
            }
        }

        public async Task<bool> RemoveOfertaAsync(int ofertaId, CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _searchService.DeleteOfertaAsync(ofertaId, cancellationToken);
                
                if (result.Success)
                {
                    _logger.LogInformation("Offer {OfertaId} removed from search successfully", ofertaId);
                    return true;
                }
                else
                {
                    _logger.LogWarning("Failed to remove offer {OfertaId} from search: {Errors}", 
                        ofertaId, string.Join("; ", result.Errors));
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing offer {OfertaId} from search", ofertaId);
                return false;
            }
        }

        public async Task<bool> FullSyncAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Starting full search synchronization");

                var ofertas = await _mapper.GetAllActiveOfertasForSearchAsync(cancellationToken);
                var result = await _searchService.IndexOfertasBatchAsync(ofertas, cancellationToken);

                if (result.Success)
                {
                    _logger.LogInformation("Full search sync completed: {SuccessCount} offers synced", result.SuccessCount);
                    return true;
                }
                else
                {
                    _logger.LogWarning("Full search sync completed with errors: {SuccessCount} success, {ErrorCount} errors", 
                        result.SuccessCount, result.ErrorCount);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during full search synchronization");
                return false;
            }
        }
    }
}