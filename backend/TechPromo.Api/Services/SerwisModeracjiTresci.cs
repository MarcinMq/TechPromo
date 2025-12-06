using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace TechPromo.Api.Services
{
    /// <summary>
    /// Serwis do moderacji treści używający Azure Content Safety API z Custom Blocklists.
    /// Wykrywa wulgarne, obraźliwe i nieodpowiednie treści w komentarzach.
    /// </summary>
    public interface ISerwisModeracjiTresci
    {
        /// <summary>
        /// Sprawdza czy tekst zawiera nieodpowiednie treści.
        /// </summary>
        /// <param name="text">Tekst do sprawdzenia</param>
        /// <returns>Wynik moderacji z informacją czy treść jest bezpieczna</returns>
        Task<WynikModeracjiTresci> ModerujTekstAsync(string text);

        /// <summary>
        /// Inicjalizuje blocklist z polskimi wulgaryzmami w Azure Content Safety.
        /// Wywoływane automatycznie przy starcie aplikacji.
        /// </summary>
        Task InicjalizujBlocklistAsync();
    }

    public class SerwisModeracjiTresci : ISerwisModeracjiTresci
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<SerwisModeracjiTresci> _logger;
        private readonly string _endpoint;
        private readonly string _apiKey;
        private readonly bool _isConfigured;
        private bool _blocklistInitialized = false;

        // Nazwa blocklist w Azure
        private const string BLOCKLIST_NAME = "PolskieWulgaryzmy";

        // Progi dla kategorii (0-6, gdzie wyższy = bardziej problematyczne)
        private const int HATE_THRESHOLD = 2;
        private const int VIOLENCE_THRESHOLD = 2;
        private const int SELF_HARM_THRESHOLD = 2;
        private const int SEXUAL_THRESHOLD = 2;

        // Lista polskich wulgaryzmów do dodania do Azure Blocklist
        private static readonly string[] PolskieWulgaryzmy = new[]
        {
            // Podstawowe wulgaryzmy
            "kurwa", "kurwe", "kurwy", "kurwo", "kurwą", "kurwę",
            "chuj", "chuja", "chuje", "chujem", "chujowy", "chujowa",
            "pierdol", "pierdolę", "pierdoli", "pierdolić", "pierdolony", "pierdolona", "spierdolić", "spierdolaj", "spierdalaj", "odpierdol", "wypierdol", "wpierdol", "napierdolić", "zapierdolić",
            "jebać", "jebac", "jebie", "jebany", "jebana", "jebane", "jebnij", "zajebisty", "zajebista", "zjebać", "zjebany", "pojebany", "pojebana", "wyjebać", "najebany",
            "kutas", "kutasa", "kutasy",
            "cipa", "cipy", "cipę",
            "pizda", "pizdy", "pizdę", "pizdo",
            "dupa", "dupę", "dupy", "dupsko", "dupek",
            "srać", "srac", "gówno", "gowno", "gówniane",
            "skurwiel", "skurwysyn", "skurwysyna", "skurwysynu",
            "suka", "suki", "suko",
            "dziwka", "dziwki", "dziwko",
            "cwel", "cwela", "cwelu",
            "pedał", "pedal", "pedała", "pedale",
            "ciota", "cioty", "cioto",
            "debil", "debila", "debilu", "debilka",
            "idiota", "idioty", "idioto", "idiotka",
            "kretyn", "kretyna", "kretynka",
            "wkurwiony", "wkurwiona", "wkurwiać", "wkurwić", "nakurwić", "zakurwić",
            "huj", "huja", "huje",
            // Rasizm i dyskryminacja  
            "czarnuch", "czarnucha", "czarnuchy"
        };

        public SerwisModeracjiTresci(IConfiguration configuration, ILogger<SerwisModeracjiTresci> logger)
        {
            _logger = logger;
            _httpClient = new HttpClient();

            _endpoint = configuration["ContentSafety:Endpoint"] ?? "";
            _apiKey = configuration["ContentSafety:ApiKey"] ?? "";

            _isConfigured = !string.IsNullOrEmpty(_endpoint) && !string.IsNullOrEmpty(_apiKey);

            if (_isConfigured)
            {
                _httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", _apiKey);
                _logger.LogInformation("SerwisModeracjiTresci skonfigurowany z endpoint: {Endpoint}", _endpoint);
            }
            else
            {
                _logger.LogWarning("SerwisModeracjiTresci nie jest skonfigurowany. Moderacja treści wyłączona.");
            }
        }

        /// <summary>
        /// Inicjalizuje blocklist z polskimi wulgaryzmami w Azure Content Safety.
        /// </summary>
        public async Task InicjalizujBlocklistAsync()
        {
            if (!_isConfigured || _blocklistInitialized)
                return;

            try
            {
                // 1. Utwórz lub zaktualizuj blocklist
                await UtworzBlocklistAsync();

                // 2. Dodaj słowa do blocklist
                await DodajSlowaDoBlocklistAsync();

                _blocklistInitialized = true;
                _logger.LogInformation("Blocklist '{BlocklistName}' zainicjalizowany z {Count} słowami", 
                    BLOCKLIST_NAME, PolskieWulgaryzmy.Length);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Błąd podczas inicjalizacji blocklist");
            }
        }

        private async Task UtworzBlocklistAsync()
        {
            var url = $"{_endpoint.TrimEnd('/')}/contentsafety/text/blocklists/{BLOCKLIST_NAME}?api-version=2024-09-01";

            var requestBody = new
            {
                blocklistName = BLOCKLIST_NAME,
                description = "Lista polskich wulgaryzmów i obraźliwych słów"
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // PATCH - tworzy lub aktualizuje
            var request = new HttpRequestMessage(new HttpMethod("PATCH"), url)
            {
                Content = content
            };

            var response = await _httpClient.SendAsync(request);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Blocklist '{BlocklistName}' utworzony/zaktualizowany", BLOCKLIST_NAME);
            }
            else
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Nie udało się utworzyć blocklist: {Error}", error);
            }
        }

        private async Task DodajSlowaDoBlocklistAsync()
        {
            var url = $"{_endpoint.TrimEnd('/')}/contentsafety/text/blocklists/{BLOCKLIST_NAME}:addOrUpdateBlocklistItems?api-version=2024-09-01";

            // Azure przyjmuje max 100 słów na raz
            var batches = PolskieWulgaryzmy
                .Select((word, index) => new { word, index })
                .GroupBy(x => x.index / 100)
                .Select(g => g.Select(x => x.word).ToArray());

            foreach (var batch in batches)
            {
                var requestBody = new
                {
                    blocklistItems = batch.Select(word => new
                    {
                        description = $"Polskie słowo: {word}",
                        text = word
                    }).ToArray()
                };

                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(url, content);

                if (!response.IsSuccessStatusCode)
                {
                    var error = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("Nie udało się dodać słów do blocklist: {Error}", error);
                }
            }
        }

        public async Task<WynikModeracjiTresci> ModerujTekstAsync(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return WynikModeracjiTresci.Bezpieczny();
            }

            if (!_isConfigured)
            {
                _logger.LogDebug("Azure Content Safety nie skonfigurowany - moderacja wyłączona");
                return WynikModeracjiTresci.Bezpieczny();
            }

            // Upewnij się, że blocklist jest zainicjalizowany
            if (!_blocklistInitialized)
            {
                await InicjalizujBlocklistAsync();
            }

            try
            {
                var requestBody = new
                {
                    text = text,
                    categories = new[] { "Hate", "Violence", "SelfHarm", "Sexual" },
                    blocklistNames = new[] { BLOCKLIST_NAME },
                    haltOnBlocklistHit = true,
                    outputType = "FourSeverityLevels"
                };

                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var url = $"{_endpoint.TrimEnd('/')}/contentsafety/text:analyze?api-version=2024-09-01";
                var response = await _httpClient.PostAsync(url, content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Błąd Azure Content Safety API: {StatusCode} - {Error}", 
                        response.StatusCode, errorContent);
                    
                    // W przypadku błędu API, przepuść treść (fail-open)
                    return WynikModeracjiTresci.Bezpieczny();
                }

                var responseJson = await response.Content.ReadAsStringAsync();
                _logger.LogDebug("Odpowiedź Azure Content Safety: {Response}", responseJson);
                
                var result = JsonSerializer.Deserialize<OdpowiedzContentSafety>(responseJson);

                if (result == null)
                {
                    return WynikModeracjiTresci.Bezpieczny();
                }

                // Sprawdź czy trafiono w blocklist
                if (result.BlocklistsMatch != null && result.BlocklistsMatch.Count > 0)
                {
                    var zablokowaneslowa = result.BlocklistsMatch
                        .Select(b => b.BlocklistItemText)
                        .Where(s => !string.IsNullOrEmpty(s))
                        .Distinct()
                        .ToList();

                    _logger.LogWarning("Wykryto słowa z blocklist: {Words}", string.Join(", ", zablokowaneslowa));
                    
                    return WynikModeracjiTresci.Zablokowany(
                        new List<string> { "Blocklist" }, 
                        zablokowaneslowa!
                    );
                }

                // Sprawdź kategorie
                if (result.CategoriesAnalysis != null)
                {
                    var violations = new List<string>();

                    foreach (var category in result.CategoriesAnalysis)
                    {
                        var threshold = category.Category switch
                        {
                            "Hate" => HATE_THRESHOLD,
                            "Violence" => VIOLENCE_THRESHOLD,
                            "SelfHarm" => SELF_HARM_THRESHOLD,
                            "Sexual" => SEXUAL_THRESHOLD,
                            _ => 2
                        };

                        if (category.Severity >= threshold)
                        {
                            violations.Add(category.Category);
                            _logger.LogWarning("Wykryto nieodpowiednią treść: {Category} (poziom: {Severity})", 
                                category.Category, category.Severity);
                        }
                    }

                    if (violations.Count > 0)
                    {
                        return WynikModeracjiTresci.Zablokowany(violations, null);
                    }
                }

                return WynikModeracjiTresci.Bezpieczny();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Wyjątek podczas moderacji treści");
                return WynikModeracjiTresci.Bezpieczny();
            }
        }
    }

    /// <summary>
    /// Wynik moderacji treści.
    /// </summary>
    public class WynikModeracjiTresci
    {
        public bool CzyBezpieczny { get; set; }
        public bool CzyZablokowany => !CzyBezpieczny;
        public List<string> NaruszonKategorie { get; set; } = new();
        public List<string> ZnalezioneSlowa { get; set; } = new();
        public string KomunikatDlaUzytkownika { get; set; } = string.Empty;

        public static WynikModeracjiTresci Bezpieczny()
        {
            return new WynikModeracjiTresci
            {
                CzyBezpieczny = true,
                KomunikatDlaUzytkownika = string.Empty
            };
        }

        public static WynikModeracjiTresci Zablokowany(List<string> kategorie, List<string>? znalezioneSlowa)
        {
            var wynik = new WynikModeracjiTresci
            {
                CzyBezpieczny = false,
                NaruszonKategorie = kategorie,
                ZnalezioneSlowa = znalezioneSlowa ?? new List<string>()
            };

            // Generuj przyjazny komunikat dla użytkownika
            wynik.KomunikatDlaUzytkownika = GenerujKomunikat(kategorie);
            return wynik;
        }

        private static string GenerujKomunikat(List<string> kategorie)
        {
            // Blocklist z polskimi wulgaryzmami
            if (kategorie.Contains("Blocklist") || kategorie.Contains("PolskieWulgaryzmy"))
            {
                return LosowyKomunikat(KomunikatyPolskieWulgaryzmy);
            }
            // Różne komunikaty w zależności od kategorii
            if (kategorie.Contains("Hate"))
            {
                return LosowyKomunikat(KomunikatyNienawisc);
            }
            if (kategorie.Contains("Violence"))
            {
                return LosowyKomunikat(KomunikatyPrzemoc);
            }
            if (kategorie.Contains("Sexual"))
            {
                return LosowyKomunikat(KomunikatySeksualne);
            }
            if (kategorie.Contains("SelfHarm"))
            {
                return LosowyKomunikat(KomunikatySamookaleczenie);
            }

            return LosowyKomunikat(KomunikatyOgolne);
        }

        private static string LosowyKomunikat(string[] komunikaty)
        {
            var random = new Random();
            return komunikaty[random.Next(komunikaty.Length)];
        }

        // Komunikaty dla różnych kategorii naruszeń
        private static readonly string[] KomunikatyPolskieWulgaryzmy = new[]
        {
            "🚫 Ups! Twój komentarz zawiera wulgaryzmy. Zachowaj kulturę wypowiedzi! 😊",
            "⚠️ Hej! Twój komentarz został zablokowany - nie używaj wulgaryzmów.",
            "🛑 Komentarz zawiera nieodpowiednie słowa i nie może zostać opublikowany.",
            "😔 Prosimy o kulturalną dyskusję - wulgaryzmy są niedozwolone.",
            "🤝 Dbamy o przyjazną atmosferę. Twój komentarz zawierał wulgaryzmy.",
            "🚫 Wulgaryzmy nie są dozwolone. Napisz to w bardziej kulturalny sposób!",
            "⚠️ Twój komentarz zawiera niedozwolone słowa. Spróbuj ponownie bez wulgaryzmów."
        };

        private static readonly string[] KomunikatyNienawisc = new[]
        {
            "🚫 Ups! Twój komentarz zawiera nieodpowiednie słowa. Bądźmy dla siebie mili! 😊",
            "⚠️ Hej, szanujmy się nawzajem! Twój komentarz został zablokowany ze względu na obraźliwe treści.",
            "🛑 Twój komentarz nie został opublikowany. Prosimy o kulturalną dyskusję.",
            "😔 Komentarz zawiera słowa, które mogą ranić innych. Spróbuj napisać to inaczej!",
            "🤝 Dbamy o przyjazną atmosferę. Twój komentarz zawierał nieodpowiednie treści."
        };

        private static readonly string[] KomunikatyPrzemoc = new[]
        {
            "🚫 Komentarz zawiera treści przemocowe i nie może zostać opublikowany.",
            "⚠️ Prosimy o nieużywanie języka sugerującego przemoc.",
            "🛑 Twój komentarz został zablokowany. Zachęcamy do spokojnej dyskusji."
        };

        private static readonly string[] KomunikatySeksualne = new[]
        {
            "🚫 Komentarz zawiera nieodpowiednie treści dla dorosłych.",
            "⚠️ Prosimy o zachowanie kultury w komentarzach.",
            "🛑 Ten komentarz nie może zostać opublikowany ze względu na treści dla dorosłych."
        };

        private static readonly string[] KomunikatySamookaleczenie = new[]
        {
            "💙 Jeśli potrzebujesz pomocy, skontaktuj się z Telefonem Zaufania: 116 123",
            "🤗 Pamiętaj, że zawsze możesz porozmawiać z kimś bliskim. Twój komentarz nie został opublikowany."
        };

        private static readonly string[] KomunikatyOgolne = new[]
        {
            "🚫 Twój komentarz został zablokowany ze względu na nieodpowiednie treści.",
            "⚠️ Prosimy o stosowanie kultury słowa w komentarzach.",
            "🛑 Ten komentarz narusza regulamin serwisu i nie może zostać opublikowany.",
            "😊 Bądźmy mili! Twój komentarz zawierał nieodpowiednie słowa.",
            "🤔 Hmm, coś poszło nie tak. Sprawdź czy Twój komentarz nie zawiera wulgaryzmów."
        };
    }

    // Klasy do deserializacji odpowiedzi z Azure Content Safety API
    internal class OdpowiedzContentSafety
    {
        [JsonPropertyName("categoriesAnalysis")]
        public List<AnalizaKategorii>? CategoriesAnalysis { get; set; }

        [JsonPropertyName("blocklistsMatch")]
        public List<BlocklistMatch>? BlocklistsMatch { get; set; }
    }

    internal class AnalizaKategorii
    {
        [JsonPropertyName("category")]
        public string Category { get; set; } = string.Empty;

        [JsonPropertyName("severity")]
        public int Severity { get; set; }
    }

    internal class BlocklistMatch
    {
        [JsonPropertyName("blocklistName")]
        public string BlocklistName { get; set; } = string.Empty;

        [JsonPropertyName("blocklistItemId")]
        public string BlocklistItemId { get; set; } = string.Empty;

        [JsonPropertyName("blocklistItemText")]
        public string BlocklistItemText { get; set; } = string.Empty;
    }
}
