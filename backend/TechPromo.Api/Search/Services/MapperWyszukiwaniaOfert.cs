using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Data;
using TechPromo.Api.Model;
using TechPromo.Api.Search.Models;

namespace TechPromo.Api.Search.Services
{
    public interface IMapperWyszukiwaniaOfert
    {
        ModelWyszukiwaniaOferty MapToSearchModel(Oferta oferta);
        Task<List<ModelWyszukiwaniaOferty>> GetAllActiveOfertasForSearchAsync(CancellationToken cancellationToken = default);
        Task<ModelWyszukiwaniaOferty?> GetOfertaForSearchAsync(int ofertaId, CancellationToken cancellationToken = default);
    }

    public class MapperWyszukiwaniaOfert : IMapperWyszukiwaniaOfert
    {
        private readonly TechPromoDbContext _context;
        private readonly ILogger<MapperWyszukiwaniaOfert> _logger;

        public MapperWyszukiwaniaOfert(TechPromoDbContext context, ILogger<MapperWyszukiwaniaOfert> logger)
        {
            _context = context;
            _logger = logger;
        }

        public ModelWyszukiwaniaOferty MapToSearchModel(Oferta oferta)
        {
            return new ModelWyszukiwaniaOferty
            {
                Id = $"oferta_{oferta.IdOferta}",
                OfertaId = oferta.IdOferta,
                Nazwa = oferta.Nazwa ?? string.Empty,
                Opis = oferta.Opis ?? string.Empty,
                Kategoria = oferta.Kategoria?.Nazwa ?? string.Empty,
                Sklep = "Sklep",
                Autor = oferta.Uzytkownik?.UserName ?? string.Empty,
                Cena = (double?)oferta.Cena,
                CenaPoprzednia = (double?)oferta.CenaPoprzednia,
                Typ = oferta.Typ ?? string.Empty,
                DataDodania = oferta.DataDodania,
                LiczbaHot = oferta.LiczbaHot,
                LiczbaCold = oferta.LiczbaCold,
                WynikPopularnosci = oferta.LiczbaHot - oferta.LiczbaCold,
                Aktywna = oferta.Aktywna,
                Zatwierdzona = oferta.Zatwierdzona,
                Tagi = new List<string>(),
                Link = oferta.Link ?? string.Empty,
                Kod = oferta.Kod
            };
        }

        public async Task<List<ModelWyszukiwaniaOferty>> GetAllActiveOfertasForSearchAsync(CancellationToken cancellationToken = default)
        {
            var ofertas = await _context.Oferty
                .Where(o => o.Aktywna && o.Zatwierdzona)
                .Include(o => o.Kategoria)
                .Include(o => o.Uzytkownik)
                .ToListAsync(cancellationToken);

            return ofertas.Select(MapToSearchModel).ToList();
        }

        public async Task<ModelWyszukiwaniaOferty?> GetOfertaForSearchAsync(int ofertaId, CancellationToken cancellationToken = default)
        {
            var oferta = await _context.Oferty
                .Where(o => o.IdOferta == ofertaId)
                .Include(o => o.Kategoria)
                .Include(o => o.Uzytkownik)
                .FirstOrDefaultAsync(cancellationToken);

            return oferta == null ? null : MapToSearchModel(oferta);
        }
    }
}
