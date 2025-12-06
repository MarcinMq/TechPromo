using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;
using TechPromo.Api;
using TechPromo.Api.Data;
using TechPromo.Api.DTO;
using Xunit;

namespace TechPromo.Testy.Integration
{
    /// <summary>
    /// Integration tests for offers controller.
    /// Tests API endpoints using real HTTP server.
    /// </summary>
    public class TestControllerOfert : IClassFixture<WebApplicationFactory<Program>>, IDisposable
    {
        private readonly HttpClient _klient;
        private readonly WebApplicationFactory<Program> _fabryka;

        public TestControllerOfert(WebApplicationFactory<Program> fabryka)
        {
            _fabryka = fabryka.WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Usun prawdziwy DbContext
                    var deskryptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<TechPromoDbContext>));
                    
                    if (deskryptor != null)
                    {
                        services.Remove(deskryptor);
                    }

                    // Dodaj testowy DbContext in-memory
                    services.AddDbContext<TechPromoDbContext>(opcje =>
                    {
                        opcje.UseInMemoryDatabase("TestyIntegracyjneOferty");
                    });
                });
            });

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
        public async Task SprawdzDuplikaty_PoprawneDane_ZwracaOK()
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

            // Assert
            odpowiedz.StatusCode.Should().Be(HttpStatusCode.OK);
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
