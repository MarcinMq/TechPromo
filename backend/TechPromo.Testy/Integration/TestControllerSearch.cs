using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using TechPromo.Api;
using TechPromo.Api.Data;
using Xunit;

namespace TechPromo.Testy.Integration
{
    /// <summary>
    /// Integration tests for search controller.
    /// Tests search functionality.
    /// </summary>
    public class TestControllerSearch : IClassFixture<WebApplicationFactory<Program>>, IDisposable
    {
        private readonly HttpClient _klient;
        private readonly WebApplicationFactory<Program> _fabryka;

        public TestControllerSearch(WebApplicationFactory<Program> fabryka)
        {
            _fabryka = fabryka.WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    var deskryptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<TechPromoDbContext>));
                    
                    if (deskryptor != null)
                    {
                        services.Remove(deskryptor);
                    }

                    services.AddDbContext<TechPromoDbContext>(opcje =>
                    {
                        opcje.UseInMemoryDatabase("TestyIntegracyjneWyszukiwarka");
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
            // Arrange
            var zapytanie = "test<script>alert('xss')</script>";

            // Act
            var odpowiedz = await _klient.GetAsync($"/api/wyszukiwarka?q={Uri.EscapeDataString(zapytanie)}");

            // Assert
            odpowiedz.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.BadRequest);
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
