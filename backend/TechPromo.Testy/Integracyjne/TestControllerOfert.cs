using FluentAssertions;
using System.Net;
using System.Net.Http.Json;
using TechPromo.Api.DTO;
using Xunit;

namespace TechPromo.Testy.Integracyjne
{
    /// <summary>
    /// Integration tests for offers controller.
    /// Tests API endpoints using real HTTP server.
    /// </summary>
    public class TestControllerOfert : IClassFixture<CustomWebApplicationFactory>, IDisposable
    {
        private readonly HttpClient _klient;
        private readonly CustomWebApplicationFactory _fabryka;

        public TestControllerOfert(CustomWebApplicationFactory fabryka)
        {
            _fabryka = fabryka;
            _klient = _fabryka.CreateClient();
        }

        public void Dispose()
        {
            _klient.Dispose();
        }

        [Fact]
        public async Task PobierzOferty_ZwracaOK()
        {
            // Act
            var odpowiedz = await _klient.GetAsync("/api/oferta");

            // Assert
            odpowiedz.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task PobierzOferte_NieistniejaceId_ZwracaNotFound()
        {
            // Act
            var odpowiedz = await _klient.GetAsync("/api/oferta/99999");

            // Assert
            odpowiedz.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }

        [Fact]
        public async Task DodajOferte_BezAutoryzacji_ZwracaUnauthorized()
        {
            // Arrange
            var nowaOferta = new UtworzOfertaDto
            {
                Tytul = "Testowa oferta",
                Opis = "Opis testowej oferty",
                Sklep = "https://sklep.pl/produkt",
                Kategoria = "Elektronika"
            };

            // Act
            var odpowiedz = await _klient.PostAsJsonAsync("/api/oferta", nowaOferta);

            // Assert
            odpowiedz.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task SprawdzDuplikaty_BezAutoryzacji_ZwracaUnauthorized()
        {
            // Arrange
            var zapytanie = new SprawdzDuplikatyRequest
            {
                Nazwa = "iPhone 15 Pro Max",
                Link = "https://apple.com/iphone",
                Cena = 5999.99m
            };

            // Act
            var odpowiedz = await _klient.PostAsJsonAsync("/api/oferta/sprawdz-duplikaty", zapytanie);

            // Assert - endpoint wymaga autoryzacji
            odpowiedz.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task PobierzOferty_ZPaginacja_ZwracaPoprawnaStrukture()
        {
            // Act
            var odpowiedz = await _klient.GetAsync("/api/oferta?strona=1&rozmiarStrony=10");

            // Assert
            odpowiedz.StatusCode.Should().Be(HttpStatusCode.OK);
            var zawartosc = await odpowiedz.Content.ReadAsStringAsync();
            zawartosc.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public async Task PobierzOferty_ZFiltrowaniemKategorii_ZwracaOK()
        {
            // Act
            var odpowiedz = await _klient.GetAsync("/api/oferta?kategoriaId=1");

            // Assert
            odpowiedz.StatusCode.Should().Be(HttpStatusCode.OK);
        }
    }
}
