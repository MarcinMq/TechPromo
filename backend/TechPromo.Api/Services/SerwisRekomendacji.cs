using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Data;
using TechPromo.Api.DTO;
using TechPromo.Api.Model;

namespace TechPromo.Api.Services
{
    /// <summary>
    /// Hybrydowy serwis rekomendacji łączący Collaborative Filtering i Content-Based
    /// </summary>
    public class SerwisRekomendacji : ISerwisRekomendacji
    {
        private readonly TechPromoDbContext _context;
        private readonly ILogger<SerwisRekomendacji> _logger;

        // Wagi dla algorytmu hybrydowego
        private const double WAGA_COLLABORATIVE = 0.6;
        private const double WAGA_CONTENT_BASED = 0.4;

        public SerwisRekomendacji(TechPromoDbContext context, ILogger<SerwisRekomendacji> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Główna metoda - pobiera rekomendacje hybrydowe dla użytkownika
        /// </summary>
        public async Task<List<OfertaDto>> PobierzRekomendacjeAsync(int userId, int limit = 10)
        {
            try
            {
                // Pobierz oferty które użytkownik już widział (głosował)
                var widzianeOfertyIds = await _context.Glosy
                    .Where(g => g.IdUzytkownik == userId)
                    .Select(g => g.IdOferta)
                    .ToListAsync();

                // Pobierz rekomendacje z obu algorytmów
                var collaborativeResults = await CollaborativeFilteringAsync(userId, widzianeOfertyIds);
                var contentBasedResults = await ContentBasedAsync(userId, widzianeOfertyIds);

                // Połącz wyniki z wagami
                var mergedResults = MergeResults(collaborativeResults, contentBasedResults);

                // Pobierz szczegóły ofert dla top wyników
                var topOfertaIds = mergedResults
                    .OrderByDescending(r => r.Score)
                    .Take(limit)
                    .Select(r => r.OfertaId)
                    .ToList();

                var terazGlowna = DateTime.UtcNow;
                var oferty = await _context.Oferty
                    .Include(o => o.Uzytkownik)
                    .Include(o => o.Kategoria)
                    .Include(o => o.OfertaTagi).ThenInclude(ot => ot.Tag)
                    .Include(o => o.Zdjecia)
                    .Include(o => o.Komentarze)
                    .Include(o => o.Glosy)
                    .Where(o => topOfertaIds.Contains(o.IdOferta) && o.Aktywna && o.Zatwierdzona
                        && (!o.WaznoscDo.HasValue || o.WaznoscDo.Value > terazGlowna))
                    .ToListAsync();

                // Zachowaj kolejność według score
                var orderedOferty = topOfertaIds
                    .Select(id => oferty.FirstOrDefault(o => o.IdOferta == id))
                    .Where(o => o != null)
                    .Select(o => MapToDto(o!, userId))
                    .ToList();

                return orderedOferty;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Błąd podczas pobierania rekomendacji dla użytkownika {UserId}", userId);
                // Fallback - zwróć popularne oferty
                return await PobierzPopularneOfertyFallbackAsync(userId, limit);
            }
        }

        /// <summary>
        /// Collaborative Filtering - rekomendacje na podstawie podobnych użytkowników
        /// </summary>
        private async Task<List<RekomendacjaScore>> CollaborativeFilteringAsync(int userId, List<int> widzianeOfertyIds)
        {
            var results = new List<RekomendacjaScore>();

            // Pobierz głosy użytkownika (tylko hot)
            var mojeGlosyHotList = await _context.Glosy
                .Where(g => g.IdUzytkownik == userId && g.TypGlosu == "hot")
                .Select(g => g.IdOferta)
                .ToListAsync();
            var mojeGlosyHot = mojeGlosyHotList.ToHashSet();

            if (mojeGlosyHot.Count == 0)
                return results;

            // Znajdź użytkowników którzy głosowali na te same oferty
            var podobniUzytkownicy = await _context.Glosy
                .Where(g => mojeGlosyHot.Contains(g.IdOferta) && g.IdUzytkownik != userId && g.TypGlosu == "hot")
                .GroupBy(g => g.IdUzytkownik)
                .Select(g => new { UserId = g.Key, CommonCount = g.Count() })
                .OrderByDescending(x => x.CommonCount)
                .Take(20) // Top 20 podobnych użytkowników
                .ToListAsync();

            // Pobierz głosy wszystkich podobnych użytkowników jednym zapytaniem (zamiast N+1)
            var podobniIds = podobniUzytkownicy.Select(p => p.UserId).ToList();
            var wszystkieGlosyPodobnych = await _context.Glosy
                .Where(g => podobniIds.Contains(g.IdUzytkownik) && g.TypGlosu == "hot")
                .Select(g => new { g.IdUzytkownik, g.IdOferta })
                .ToListAsync();
            var glosyWgUzytkownika = wszystkieGlosyPodobnych
                .GroupBy(g => g.IdUzytkownik)
                .ToDictionary(g => g.Key, g => g.Select(x => x.IdOferta).ToHashSet());

            foreach (var podobny in podobniUzytkownicy)
            {
                var glosyPodobnego = glosyWgUzytkownika.GetValueOrDefault(podobny.UserId, new HashSet<int>());

                // Oblicz podobieństwo Jaccard
                var intersection = mojeGlosyHot.Intersect(glosyPodobnego).Count();
                var union = mojeGlosyHot.Union(glosyPodobnego).Count();
                var similarity = union > 0 ? (double)intersection / union : 0;

                // Dodaj oferty które podobny użytkownik lubi, a ja nie widziałem
                var noweOferty = glosyPodobnego.Except(widzianeOfertyIds);
                foreach (var ofertaId in noweOferty)
                {
                    var existing = results.FirstOrDefault(r => r.OfertaId == ofertaId);
                    if (existing != null)
                    {
                        existing.Score += similarity;
                    }
                    else
                    {
                        results.Add(new RekomendacjaScore { OfertaId = ofertaId, Score = similarity });
                    }
                }
            }

            return results;
        }

        /// <summary>
        /// Content-Based - rekomendacje na podstawie preferencji użytkownika
        /// </summary>
        private async Task<List<RekomendacjaScore>> ContentBasedAsync(int userId, List<int> widzianeOfertyIds)
        {
            var results = new List<RekomendacjaScore>();

            // Pobierz oferty które użytkownik lubi
            var lubianeOfertyIds = await _context.Glosy
                .Where(g => g.IdUzytkownik == userId && g.TypGlosu == "hot")
                .Select(g => g.IdOferta)
                .ToListAsync();

            if (lubianeOfertyIds.Count == 0)
                return results;

            // Pobierz szczegóły lubianych ofert
            var lubianeOferty = await _context.Oferty
                .Include(o => o.OfertaTagi).ThenInclude(ot => ot.Tag)
                .Where(o => lubianeOfertyIds.Contains(o.IdOferta))
                .ToListAsync();

            // Zbuduj profil użytkownika
            var ulubionykategorie = lubianeOferty
                .Where(o => o.IdKategoria.HasValue)
                .GroupBy(o => o.IdKategoria!.Value)
                .OrderByDescending(g => g.Count())
                .Take(5)
                .Select(g => g.Key)
                .ToHashSet();

            var ulubioneTagi = lubianeOferty
                .SelectMany(o => o.OfertaTagi.Select(ot => ot.IdTag))
                .GroupBy(t => t)
                .OrderByDescending(g => g.Count())
                .Take(10)
                .Select(g => g.Key)
                .ToHashSet();

            var sredniaCena = lubianeOferty
                .Where(o => o.Cena.HasValue)
                .Select(o => o.Cena!.Value)
                .DefaultIfEmpty(0)
                .Average();

            // Znajdź kandydatów (wyklucz widziane, wygasłe i własne oferty)
            var teraz = DateTime.UtcNow;
            var kandydaci = await _context.Oferty
                .Include(o => o.OfertaTagi)
                .Where(o => !widzianeOfertyIds.Contains(o.IdOferta) 
                    && o.Aktywna && o.Zatwierdzona
                    && o.IdUzytkownik != userId
                    && (!o.WaznoscDo.HasValue || o.WaznoscDo.Value > teraz))
                .ToListAsync();

            foreach (var oferta in kandydaci)
            {
                double score = 0;

                // Dopasowanie kategorii (0.4)
                if (oferta.IdKategoria.HasValue && ulubionykategorie.Contains(oferta.IdKategoria.Value))
                {
                    score += 0.4;
                }

                // Dopasowanie tagów (0.35)
                var wspólneTagi = oferta.OfertaTagi.Select(ot => ot.IdTag).Intersect(ulubioneTagi).Count();
                if (ulubioneTagi.Count > 0)
                {
                    score += 0.35 * ((double)wspólneTagi / ulubioneTagi.Count);
                }

                // Dopasowanie ceny (0.25) - im bliżej średniej, tym lepiej
                if (oferta.Cena.HasValue && sredniaCena > 0)
                {
                    var roznica = Math.Abs(oferta.Cena.Value - sredniaCena);
                    var maxRoznica = sredniaCena * 2; // Tolerancja 200%
                    var cenaScore = maxRoznica > 0 ? Math.Max(0, 1 - (double)(roznica / maxRoznica)) : 0;
                    score += 0.25 * cenaScore;
                }

                if (score > 0)
                {
                    results.Add(new RekomendacjaScore { OfertaId = oferta.IdOferta, Score = score });
                }
            }

            return results;
        }

        /// <summary>
        /// Łączy wyniki z obu algorytmów z wagami
        /// </summary>
        private List<RekomendacjaScore> MergeResults(
            List<RekomendacjaScore> collaborative, 
            List<RekomendacjaScore> contentBased)
        {
            var merged = new Dictionary<int, double>();

            // Normalizuj i dodaj wyniki Collaborative
            var maxCF = collaborative.Any() ? collaborative.Max(r => r.Score) : 1;
            foreach (var r in collaborative)
            {
                var normalized = maxCF > 0 ? r.Score / maxCF : 0;
                merged[r.OfertaId] = WAGA_COLLABORATIVE * normalized;
            }

            // Normalizuj i dodaj wyniki Content-Based
            var maxCB = contentBased.Any() ? contentBased.Max(r => r.Score) : 1;
            foreach (var r in contentBased)
            {
                var normalized = maxCB > 0 ? r.Score / maxCB : 0;
                if (merged.ContainsKey(r.OfertaId))
                {
                    merged[r.OfertaId] += WAGA_CONTENT_BASED * normalized;
                }
                else
                {
                    merged[r.OfertaId] = WAGA_CONTENT_BASED * normalized;
                }
            }

            return merged.Select(kv => new RekomendacjaScore { OfertaId = kv.Key, Score = kv.Value }).ToList();
        }

        /// <summary>
        /// Pobiera oferty podobne do podanej (dla sekcji "Podobne oferty")
        /// </summary>
        public async Task<List<OfertaDto>> PobierzPodobneOfertyAsync(int ofertaId, int limit = 5)
        {
            var oferta = await _context.Oferty
                .Include(o => o.OfertaTagi)
                .FirstOrDefaultAsync(o => o.IdOferta == ofertaId);

            if (oferta == null)
                return new List<OfertaDto>();

            var tagiIds = oferta.OfertaTagi.Select(ot => ot.IdTag).ToList();

            var teraz = DateTime.UtcNow;
            var podobne = await _context.Oferty
                .Include(o => o.Uzytkownik)
                .Include(o => o.Kategoria)
                .Include(o => o.OfertaTagi).ThenInclude(ot => ot.Tag)
                .Include(o => o.Zdjecia)
                .Include(o => o.Komentarze)
                .Include(o => o.Glosy)
                .Where(o => o.IdOferta != ofertaId && o.Aktywna && o.Zatwierdzona
                    && (!o.WaznoscDo.HasValue || o.WaznoscDo.Value > teraz))
                .Where(o => o.IdKategoria == oferta.IdKategoria || o.OfertaTagi.Any(ot => tagiIds.Contains(ot.IdTag)))
                .OrderByDescending(o => o.LiczbaHot - o.LiczbaCold)
                .Take(limit)
                .ToListAsync();

            return podobne.Select(o => MapToDto(o, 0)).ToList();
        }

        /// <summary>
        /// Fallback - popularne oferty gdy brak danych do rekomendacji
        /// </summary>
        private async Task<List<OfertaDto>> PobierzPopularneOfertyFallbackAsync(int userId, int limit)
        {
            var popularne = await _context.Oferty
                .Include(o => o.Uzytkownik)
                .Include(o => o.Kategoria)
                .Include(o => o.OfertaTagi).ThenInclude(ot => ot.Tag)
                .Include(o => o.Zdjecia)
                .Include(o => o.Komentarze)
                .Include(o => o.Glosy)
                .Where(o => o.Aktywna && o.Zatwierdzona)
                .OrderByDescending(o => o.LiczbaHot - o.LiczbaCold)
                .ThenByDescending(o => o.DataDodania)
                .Take(limit)
                .ToListAsync();

            return popularne.Select(o => MapToDto(o, userId)).ToList();
        }

        /// <summary>
        /// Mapuje Oferta na OfertaDto
        /// </summary>
        private OfertaDto MapToDto(Oferta oferta, int userId)
        {
            return new OfertaDto
            {
                Id = oferta.IdOferta,
                Tytul = oferta.Nazwa,
                Opis = oferta.Opis,
                Typ = oferta.Typ,
                Cena = oferta.Cena,
                CenaPoprzednia = oferta.CenaPoprzednia,
                Kod = oferta.Kod,
                Sklep = oferta.Link,
                Kategoria = oferta.Kategoria?.Nazwa ?? "Inne",
                Tagi = oferta.OfertaTagi.Select(ot => ot.Tag.Nazwa).ToList(),
                Autor = oferta.Uzytkownik.UserName ?? "Nieznany",
                DataUtworzenia = oferta.DataDodania.ToString("dd.MM.yyyy HH:mm"),
                WaznoscOd = oferta.WaznoscOd,
                WaznoscDo = oferta.WaznoscDo,
                Votes = new VotesDto { Hot = oferta.LiczbaHot, Cold = oferta.LiczbaCold },
                Komentarze = oferta.Komentarze.Count,
                UserVote = userId != 0 ? oferta.Glosy.Where(g => g.IdUzytkownik == userId).Select(g => g.TypGlosu).FirstOrDefault() : null,
                Zdjecia = oferta.Zdjecia.OrderBy(z => z.Kolejnosc).Select(z => z.UrlZdjecia).ToList(),
                ZatwierdzeniePrzezAI = oferta.ZatwierdzeniePrzezAI
            };
        }

        /// <summary>
        /// Klasa pomocnicza do przechowywania wyników z score
        /// </summary>
        private class RekomendacjaScore
        {
            public int OfertaId { get; set; }
            public double Score { get; set; }
        }
    }
}
