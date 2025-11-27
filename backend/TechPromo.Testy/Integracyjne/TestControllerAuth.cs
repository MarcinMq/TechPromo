using FluentAssertions;
using System.Net;
using System.Net.Http.Json;
using TechPromo.Api.DTO;
using Xunit;

namespace TechPromo.Testy.Integracyjne
{
    /// <summary>
    /// Integration tests for authentication controller.
    /// Tests login and registration processes.
    /// </summary>
    public class TestControllerAuth : IClassFixture<CustomWebApplicationFactory>, IDisposable
    {
        private readonly HttpClient _klient;
        private readonly CustomWebApplicationFactory _fabryka;

        public TestControllerAuth(CustomWebApplicationFactory fabryka)
        {
            _fabryka = fabryka;
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
                Nick = $"TestowyUser_{Guid.NewGuid():N}".Substring(0, 20),
                Email = $"test_{Guid.NewGuid():N}@example.com",
                Password = "SilneHaslo123!"
            };

            // Act
            var odpowiedz = await _klient.PostAsJsonAsync("/konto/register", daneRejestracji);

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
            var odpowiedz = await _klient.PostAsJsonAsync("/konto/register", daneRejestracji);

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
            var odpowiedz = await _klient.PostAsJsonAsync("/konto/login", daneLogowania);

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
                Nick = $"User_{Guid.NewGuid():N}".Substring(0, 15),
                Email = unikalnyEmail,
                Password = "PoprawneHaslo123!"
            };
            await _klient.PostAsJsonAsync("/konto/register", daneRejestracji);

            // Act - logowanie z blednym haslem
            var daneLogowania = new LoginDto
            {
                Email = unikalnyEmail,
                Password = "ZleHaslo999!"
            };
            var odpowiedz = await _klient.PostAsJsonAsync("/konto/login", daneLogowania);

            // Assert
            odpowiedz.StatusCode.Should().BeOneOf(HttpStatusCode.Unauthorized, HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task PobierzProfil_BezAutoryzacji_ZwracaUnauthorized()
        {
            // Act
            var odpowiedz = await _klient.GetAsync("/konto/profil");

            // Assert
            odpowiedz.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }
    }
}
