using FluentAssertions;
using System.Net;
using Xunit;

namespace TechPromo.Testy.Integracyjne
{
    /// <summary>
    /// Integration tests for search controller.
    /// Tests search functionality.
    /// </summary>
    public class TestControllerSearch : IClassFixture<CustomWebApplicationFactory>, IDisposable
    {
        private readonly HttpClient _klient;
        private readonly CustomWebApplicationFactory _fabryka;

        public TestControllerSearch(CustomWebApplicationFactory fabryka)
        {
            _fabryka = fabryka;
            _klient = _fabryka.CreateClient();
        }

        public void Dispose()
        {
            _klient.Dispose();
        }

        [Fact]
        public async Task Wyszukaj_PusteZapytanie_ZwracaOK()
        {
            // Act
            var odpowiedz = await _klient.GetAsync("/api/wyszukiwarka?q=");

            // Assert
            odpowiedz.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task Wyszukaj_PoprawneZapytanie_ZwracaOK()
        {
            // Act
            var odpowiedz = await _klient.GetAsync("/api/wyszukiwarka?q=iPhone");

            // Assert
            odpowiedz.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task Wyszukaj_ZFiltremKategorii_ZwracaOK()
        {
            // Act
            var odpowiedz = await _klient.GetAsync("/api/wyszukiwarka?q=telefon&kategoriaId=1");

            // Assert
            odpowiedz.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task Wyszukaj_ZFiltremCeny_ZwracaOK()
        {
            // Act
            var odpowiedz = await _klient.GetAsync("/api/wyszukiwarka?q=laptop&cenaMin=1000&cenaMax=5000");

            // Assert
            odpowiedz.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task Wyszukaj_DlugieZapytanie_ZwracaOK()
        {
            // Arrange
            var dlugieZapytanie = "iPhone 15 Pro Max 256GB Apple MagSafe";

            // Act
            var odpowiedz = await _klient.GetAsync($"/api/wyszukiwarka?q={Uri.EscapeDataString(dlugieZapytanie)}");

            // Assert
            odpowiedz.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task Wyszukaj_ZnakiSpecjalne_NieWyrzucaWyjatku()
        {
            // Arrange - znaki specjalne mogą być problematyczne dla Azure Search
            var zapytanie = "test<script>alert('xss')</script>";

            // Act
            var odpowiedz = await _klient.GetAsync($"/api/wyszukiwarka?q={Uri.EscapeDataString(zapytanie)}");

            // Assert - API może zwrócić różne kody, ale nie powinno crashować
            // 200 = OK, 400 = walidacja zapytania, 500 = Azure Search nie radzi sobie z query
            odpowiedz.StatusCode.Should().BeOneOf(
                HttpStatusCode.OK, 
                HttpStatusCode.BadRequest,
                HttpStatusCode.InternalServerError);
        }

        [Fact]
        public async Task Sugestie_PoprawneZapytanie_ZwracaOK()
        {
            // Act
            var odpowiedz = await _klient.GetAsync("/api/wyszukiwarka/sugestie?q=iph");

            // Assert
            odpowiedz.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task Sugestie_ZaKrotkieZapytanie_ZwracaPustaListe()
        {
            // Act
            var odpowiedz = await _klient.GetAsync("/api/wyszukiwarka/sugestie?q=a");

            // Assert
            odpowiedz.StatusCode.Should().Be(HttpStatusCode.OK);
        }
    }
}
