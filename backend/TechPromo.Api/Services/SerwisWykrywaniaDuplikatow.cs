using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Data;
using System.Text.RegularExpressions;

namespace TechPromo.Api.Services
{
    public class SerwisWykrywaniaDuplikatow : ISerwisWykrywaniaDuplikatow
    {
        private readonly TechPromoDbContext _context;
        private const double PROG_PODOBIENSTWA = 0.75; // 75% podobieństwa
        private const int DNI_DO_SPRAWDZENIA = 30; // Sprawdzaj duplikaty z ostatnich 30 dni

        public SerwisWykrywaniaDuplikatow(TechPromoDbContext context)
        {
            _context = context;
        }

        public async Task<WynikSprawdzaniaDuplikatow> SprawdzDuplikatyAsync(
            string nazwa, 
            string? link, 
            string? sklep, 
            decimal? cena)
        {
            var wynik = new WynikSprawdzaniaDuplikatow();
            var potencjalneDuplikaty = new List<DopasowanieDuplikatu>();

            // Data graniczna - sprawdzamy tylko ostatnie oferty
            var progCzasowy = DateTime.UtcNow.AddDays(-DNI_DO_SPRAWDZENIA);

            // Pobierz aktywne oferty z ostatnich 30 dni
            var ostatnieOferty = await _context.Oferty
                .Where(o => o.DataDodania >= progCzasowy && o.Aktywna)
                .Include(o => o.Uzytkownik)
                .Select(o => new
                {
                    o.IdOferta,
                    o.Nazwa,
                    o.Link,
                    Sklep = "", // Brak pola Sklep w modelu
                    o.Cena,
                    o.DataDodania,
                    Autor = o.Uzytkownik!.UserName ?? "Nieznany"
                })
                .ToListAsync();

            // 1. SPRAWDŹ DOKŁADNE DOPASOWANIE LINKU (najwyższy priorytet)
            if (!string.IsNullOrWhiteSpace(link))
            {
                var znormalizowanyLink = NormalizujUrl(link);
                
                foreach (var oferta in ostatnieOferty)
                {
                    if (!string.IsNullOrWhiteSpace(oferta.Link))
                    {
                        var znormalizowanyLinkOferty = NormalizujUrl(oferta.Link);
                        
                        if (znormalizowanyLink == znormalizowanyLinkOferty)
                        {
                            potencjalneDuplikaty.Add(new DopasowanieDuplikatu
                            {
                                OfertaId = oferta.IdOferta,
                                Tytul = oferta.Nazwa,
                                LinkDoOferty = oferta.Link,
                                Sklep = oferta.Sklep,
                                Cena = oferta.Cena,
                                DataDodania = oferta.DataDodania,
                                Autor = oferta.Autor,
                                WynikPodobienstwa = 1.0,
                                PowodDopasowania = "Identyczny link do oferty"
                            });
                        }
                    }
                }
            }

            // 2. SPRAWDŹ PODOBIEŃSTWO TYTUŁÓW (fuzzy matching)
            var znormalizowanaNazwa = NormalizujTekst(nazwa);
            
            foreach (var oferta in ostatnieOferty)
            {
                // Pomiń jeśli już znaleźliśmy jako duplikat po linku
                if (potencjalneDuplikaty.Any(d => d.OfertaId == oferta.IdOferta))
                    continue;

                var znormalizowanaNazwaOferty = NormalizujTekst(oferta.Nazwa);
                var podobienstwo = ObliczPodobienstwo(znormalizowanaNazwa, znormalizowanaNazwaOferty);

                // Jeśli tytuły są bardzo podobne
                if (podobienstwo >= PROG_PODOBIENSTWA)
                {
                    var dopasowanie = new DopasowanieDuplikatu
                    {
                        OfertaId = oferta.IdOferta,
                        Tytul = oferta.Nazwa,
                        LinkDoOferty = oferta.Link,
                        Sklep = oferta.Sklep,
                        Cena = oferta.Cena,
                        DataDodania = oferta.DataDodania,
                        Autor = oferta.Autor,
                        WynikPodobienstwa = podobienstwo,
                        PowodDopasowania = $"Podobny tytuł ({podobienstwo:P0})"
                    };

                    // Dodatkowe punkty jeśli sklep się zgadza
                    if (!string.IsNullOrWhiteSpace(sklep) && 
                        !string.IsNullOrWhiteSpace(oferta.Sklep) &&
                        sklep.Equals(oferta.Sklep, StringComparison.OrdinalIgnoreCase))
                    {
                        dopasowanie.WynikPodobienstwa += 0.1;
                        dopasowanie.PowodDopasowania += " + ten sam sklep";
                    }

                    // Dodatkowe punkty jeśli cena jest podobna (±10%)
                    if (cena.HasValue && oferta.Cena.HasValue && oferta.Cena.Value > 0)
                    {
                        var roznicaCen = Math.Abs(cena.Value - oferta.Cena.Value) / oferta.Cena.Value;
                        if (roznicaCen <= 0.1m)
                        {
                            dopasowanie.WynikPodobienstwa += 0.05;
                            dopasowanie.PowodDopasowania += " + podobna cena";
                        }
                    }

                    potencjalneDuplikaty.Add(dopasowanie);
                }
            }

            // Sortuj po wyniku podobieństwa (malejąco)
            wynik.PotencjalneDuplikaty = potencjalneDuplikaty
                .OrderByDescending(d => d.WynikPodobienstwa)
                .Take(5)
                .ToList();

            wynik.CzyPotencjalnyDuplikat = wynik.PotencjalneDuplikaty.Any();

            if (wynik.CzyPotencjalnyDuplikat)
            {
                var najlepszeDopasowanie = wynik.PotencjalneDuplikaty.First();
                if (najlepszeDopasowanie.WynikPodobienstwa >= 0.95)
                {
                    wynik.Wiadomosc = "Znaleziono prawdopodobny duplikat. Ta oferta może już istnieć.";
                }
                else
                {
                    wynik.Wiadomosc = "Znaleziono podobne oferty. Sprawdź czy Twoja oferta już nie istnieje.";
                }
            }
            else
            {
                wynik.Wiadomosc = "Nie znaleziono duplikatów.";
            }

            return wynik;
        }

        public async Task<List<PodobnaOfertaDto>> ZnajdzPodobneOfertyAsync(string nazwa, int maxWynikow = 5)
        {
            var znormalizowanaNazwa = NormalizujTekst(nazwa);
            var progCzasowy = DateTime.UtcNow.AddDays(-DNI_DO_SPRAWDZENIA);

            var ostatnieOferty = await _context.Oferty
                .Where(o => o.DataDodania >= progCzasowy && o.Aktywna)
                .Select(o => new
                {
                    o.IdOferta,
                    o.Nazwa,
                    Sklep = "",
                    o.Cena,
                    o.DataDodania,
                    GlosyZa = o.Glosy.Count(g => g.TypGlosu == "hot"),
                    GlosyPrzeciw = o.Glosy.Count(g => g.TypGlosu == "cold")
                })
                .ToListAsync();

            var podobneOferty = new List<PodobnaOfertaDto>();

            foreach (var oferta in ostatnieOferty)
            {
                var znormalizowanaNazwaOferty = NormalizujTekst(oferta.Nazwa);
                var podobienstwo = ObliczPodobienstwo(znormalizowanaNazwa, znormalizowanaNazwaOferty);

                if (podobienstwo >= 0.5) // Niższy próg dla sugestii
                {
                    podobneOferty.Add(new PodobnaOfertaDto
                    {
                        Id = oferta.IdOferta,
                        Tytul = oferta.Nazwa,
                        Sklep = oferta.Sklep,
                        Cena = oferta.Cena,
                        DataDodania = oferta.DataDodania,
                        GlosyZa = oferta.GlosyZa,
                        GlosyPrzeciw = oferta.GlosyPrzeciw,
                        WynikPodobienstwa = podobienstwo
                    });
                }
            }

            return podobneOferty
                .OrderByDescending(o => o.WynikPodobienstwa)
                .Take(maxWynikow)
                .ToList();
        }

        /// <summary>
        /// Normalizuje URL (usuwa parametry UTM, www, http/https)
        /// </summary>
        private string NormalizujUrl(string url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return string.Empty;

            try
            {
                var uri = new Uri(url.ToLower());
                var host = uri.Host.Replace("www.", "");
                var path = uri.AbsolutePath.TrimEnd('/');
                
                // Usuń parametry UTM i inne tracking params
                var query = uri.Query;
                if (!string.IsNullOrEmpty(query))
                {
                    var queryParams = System.Web.HttpUtility.ParseQueryString(query);
                    var cleanParams = new List<string>();
                    
                    foreach (string key in queryParams.Keys)
                    {
                        // Pomiń tracking parametry
                        if (!key.StartsWith("utm_") && 
                            !key.StartsWith("ref") && 
                            key != "fbclid" && 
                            key != "gclid")
                        {
                            cleanParams.Add($"{key}={queryParams[key]}");
                        }
                    }
                    
                    query = cleanParams.Any() ? "?" + string.Join("&", cleanParams) : "";
                }
                
                return $"{host}{path}{query}";
            }
            catch
            {
                return url.ToLower();
            }
        }

        /// <summary>
        /// Normalizuje tekst (lowercase, usuwa znaki specjalne, stopwords)
        /// </summary>
        private string NormalizujTekst(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return string.Empty;

            // Lowercase
            text = text.ToLower();

            // Usuń HTML tags
            text = Regex.Replace(text, "<.*?>", string.Empty);

            // Usuń znaki specjalne, zostaw tylko litery, cyfry i spacje
            text = Regex.Replace(text, @"[^\w\s]", " ");

            // Usuń wielokrotne spacje
            text = Regex.Replace(text, @"\s+", " ");

            // Usuń polskie stopwords
            var stopwords = new[] { "na", "z", "ze", "w", "do", "dla", "od", "o", "i", "a", "ale", "czy", "lub", "oraz", "jak", "po", "przy", "przez" };
            var words = text.Split(' ')
                .Where(w => w.Length > 2 && !stopwords.Contains(w))
                .ToArray();

            return string.Join(" ", words).Trim();
        }

        /// <summary>
        /// Oblicza podobieństwo między dwoma stringami (Levenshtein + Jaccard)
        /// </summary>
        private double ObliczPodobienstwo(string tekst1, string tekst2)
        {
            if (string.IsNullOrWhiteSpace(tekst1) || string.IsNullOrWhiteSpace(tekst2))
                return 0.0;

            // 1. Levenshtein Distance (dla całych stringów)
            var podobienstwoLevenshtein = 1.0 - (double)OdlegloscLevenshtein(tekst1, tekst2) / Math.Max(tekst1.Length, tekst2.Length);

            // 2. Jaccard Similarity (dla słów - lepszy dla długich tekstów)
            var slowa1 = tekst1.Split(' ').ToHashSet();
            var slowa2 = tekst2.Split(' ').ToHashSet();
            
            var czescWspolna = slowa1.Intersect(slowa2).Count();
            var suma = slowa1.Union(slowa2).Count();
            
            var podobienstwoJaccard = suma > 0 ? (double)czescWspolna / suma : 0.0;

            // Średnia ważona (Jaccard ma większą wagę dla dłuższych tekstów)
            return (podobienstwoLevenshtein * 0.4) + (podobienstwoJaccard * 0.6);
        }

        /// <summary>
        /// Odległość Levenshteina (edit distance)
        /// </summary>
        private int OdlegloscLevenshtein(string zrodlo, string cel)
        {
            if (string.IsNullOrEmpty(zrodlo))
                return cel?.Length ?? 0;

            if (string.IsNullOrEmpty(cel))
                return zrodlo.Length;

            var dlugoscZrodla = zrodlo.Length;
            var dlugoscCelu = cel.Length;
            var odleglosc = new int[dlugoscZrodla + 1, dlugoscCelu + 1];

            for (var i = 0; i <= dlugoscZrodla; i++)
                odleglosc[i, 0] = i;

            for (var j = 0; j <= dlugoscCelu; j++)
                odleglosc[0, j] = j;

            for (var i = 1; i <= dlugoscZrodla; i++)
            {
                for (var j = 1; j <= dlugoscCelu; j++)
                {
                    var koszt = cel[j - 1] == zrodlo[i - 1] ? 0 : 1;

                    odleglosc[i, j] = Math.Min(
                        Math.Min(odleglosc[i - 1, j] + 1, odleglosc[i, j - 1] + 1),
                        odleglosc[i - 1, j - 1] + koszt
                    );
                }
            }

            return odleglosc[dlugoscZrodla, dlugoscCelu];
        }
    }
}
