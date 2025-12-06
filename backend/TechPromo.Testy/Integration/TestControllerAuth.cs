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
    /// Integration tests for authentication controller.
    /// Tests login and registration processes.
    /// </summary>
    public class TestControllerAuth : IClassFixture<WebApplicationFactory<Program>>, IDisposable
    {
        private readonly HttpClient _klient;
        private readonly WebApplicationFactory<Program> _fabryka;

        public TestControllerAuth(WebApplicationFactory<Program> fabryka)
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
                        opcje.UseInMemoryDatabase("TestyIntegracyjneAutoryzacja");
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
        public async Task Rejestracja_PoprawneDane_ZwracaOK()
        {
            // Arrange
            var daneRejestracji = new RegisterDto
            {
                Nick = $"TestowyUser_{Guid.NewGuid():N}",
                Email = $"test_{Guid.NewGuid():N}@example.com",
                Password = "SilneHaslo123!"
            };

            // Act
            var odpowiedz = await _klient.PostAsJsonAsync("/api/account/register", daneRejestracji);

            // Assert
            odpowiedz.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);
        }

        [Fact]
        public async Task Rejestracja_SlabeDane_ZwracaBadRequest()
        {
            // Arrange
            var daneRejestracji = new RegisterDto
            {
                Nick = "", // Pusta nazwa
                Email = "niepoprawny-email",
                Password = "123" // Za krotkie haslo
            };

            // Act
            var odpowiedz = await _klient.PostAsJsonAsync("/api/account/register", daneRejestracji);

            // Assert
            odpowiedz.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task Logowanie_NieistniejacyUzytkownik_ZwracaUnauthorized()
        {
            // Arrange
            var daneLogowania = new LoginDto
            {
                Email = "nieistniejacy@example.com",
                Password = "JakiesHaslo123!"
            };

            // Act
            var odpowiedz = await _klient.PostAsJsonAsync("/api/account/login", daneLogowania);

            // Assert
            odpowiedz.StatusCode.Should().BeOneOf(HttpStatusCode.Unauthorized, HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task Logowanie_ZleHaslo_ZwracaUnauthorized()
        {
            // Arrange - najpierw zarejestruj uzytkownika
            var unikalnyEmail = $"test_{Guid.NewGuid():N}@example.com";
            var daneRejestracji = new RegisterDto
            {
                Nick = $"User_{Guid.NewGuid():N}",
                Email = unikalnyEmail,
                Password = "PoprawneHaslo123!"
            };
            await _klient.PostAsJsonAsync("/api/account/register", daneRejestracji);

            // Act - logowanie z blednym haslem
            var daneLogowania = new LoginDto
            {
                Email = unikalnyEmail,
                Password = "ZleHaslo999!"
            };
            var odpowiedz = await _klient.PostAsJsonAsync("/api/account/login", daneLogowania);

            // Assert
            odpowiedz.StatusCode.Should().BeOneOf(HttpStatusCode.Unauthorized, HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task PobierzProfil_BezAutoryzacji_ZwracaUnauthorized()
        {
            // Act
            var odpowiedz = await _klient.GetAsync("/api/account/profil");

            // Assert
            odpowiedz.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }
    }
}
