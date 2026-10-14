using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Moq;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using TechPromo.Api.Model;
using TechPromo.Api.Services;
using Xunit;

namespace TechPromo.Testy.Jednostkowe
{
    /// <summary>
    /// Tests for JWT token generation service.
    /// Verifies token creation, claims and expiration.
    /// </summary>
    public class TestJwtService
    {
        private readonly Mock<UserManager<Uzytkownik>> _userManagerMock;
        private readonly IConfiguration _configuration;
        private readonly JwtService _jwtService;

        public TestJwtService()
        {
            // Mock UserManager
            var store = new Mock<IUserStore<Uzytkownik>>();
            _userManagerMock = new Mock<UserManager<Uzytkownik>>(
                store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

            // Test configuration
            var configValues = new Dictionary<string, string?>
            {
                {"Jwt:Key", "TestSecretKeyThatIsAtLeast32CharactersLong!"},
                {"Jwt:Issuer", "TechPromoTest"},
                {"Jwt:Audience", "TechPromoTestUsers"},
                {"Jwt:ExpirationMinutes", "60"}
            };

            _configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(configValues)
                .Build();

            _jwtService = new JwtService(_configuration, _userManagerMock.Object);
        }

        [Fact]
        public async Task GenerateToken_ValidUser_ReturnsToken()
        {
            // Arrange
            var user = new Uzytkownik
            {
                SecurityStamp = "UnitTestSessionStamp",
                Id = 1,
                UserName = "testuser",
                Email = "test@example.com",
                Punkty = 100,
                DataRejestracji = DateTime.UtcNow
            };

            _userManagerMock.Setup(x => x.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "Uzytkownik" });

            // Act
            var token = await _jwtService.GenerateTokenAsync(user);

            // Assert
            token.Should().NotBeNullOrEmpty();
            token.Split('.').Should().HaveCount(3); // JWT format: header.payload.signature
        }

        [Fact]
        public async Task GenerateToken_ContainsUserClaims()
        {
            // Arrange
            var user = new Uzytkownik
            {
                SecurityStamp = "UnitTestSessionStamp",
                Id = 123,
                UserName = "testuser",
                Email = "test@example.com",
                Punkty = 500,
                DataRejestracji = DateTime.UtcNow.AddDays(-30)
            };

            _userManagerMock.Setup(x => x.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "Uzytkownik" });

            // Act
            var token = await _jwtService.GenerateTokenAsync(user);
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            // Assert - JWT uses short claim type names
            jwtToken.Claims.Should().Contain(c => c.Type == "nameid" && c.Value == "123");
            jwtToken.Claims.Should().Contain(c => c.Type == "unique_name" && c.Value == "testuser");
            jwtToken.Claims.Should().Contain(c => c.Type == "email" && c.Value == "test@example.com");
            jwtToken.Claims.Should().Contain(c => c.Type == "punkty" && c.Value == "500");
        }

        [Fact]
        public async Task GenerateToken_AdminRole_ContainsAdminClaim()
        {
            // Arrange
            var admin = new Uzytkownik
            {
                SecurityStamp = "UnitTestSessionStamp",
                Id = 1,
                UserName = "admin",
                Email = "admin@techpromo.pl",
                Punkty = 0,
                DataRejestracji = DateTime.UtcNow
            };

            _userManagerMock.Setup(x => x.GetRolesAsync(admin))
                .ReturnsAsync(new List<string> { "Admin", "Moderator" });

            // Act
            var token = await _jwtService.GenerateTokenAsync(admin);
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            // Assert - JWT uses short claim type names
            jwtToken.Claims.Should().Contain(c => c.Type == "role" && c.Value == "Admin");
            jwtToken.Claims.Should().Contain(c => c.Type == "role" && c.Value == "Moderator");
        }

        [Fact]
        public async Task GenerateToken_HasValidExpiration()
        {
            // Arrange
            var user = new Uzytkownik
            {
                SecurityStamp = "UnitTestSessionStamp",
                Id = 1,
                UserName = "testuser",
                Email = "test@example.com",
                DataRejestracji = DateTime.UtcNow
            };

            _userManagerMock.Setup(x => x.GetRolesAsync(user))
                .ReturnsAsync(new List<string>());

            // Act
            var token = await _jwtService.GenerateTokenAsync(user);
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            // Assert - token expires in ~60 minutes
            var expiration = jwtToken.ValidTo;
            expiration.Should().BeAfter(DateTime.UtcNow.AddMinutes(59));
            expiration.Should().BeBefore(DateTime.UtcNow.AddMinutes(61));
        }

        [Fact]
        public async Task GenerateToken_HasCorrectIssuerAndAudience()
        {
            // Arrange
            var user = new Uzytkownik
            {
                SecurityStamp = "UnitTestSessionStamp",
                Id = 1,
                UserName = "testuser",
                Email = "test@example.com",
                DataRejestracji = DateTime.UtcNow
            };

            _userManagerMock.Setup(x => x.GetRolesAsync(user))
                .ReturnsAsync(new List<string>());

            // Act
            var token = await _jwtService.GenerateTokenAsync(user);
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            // Assert
            jwtToken.Issuer.Should().Be("TechPromoTest");
            jwtToken.Audiences.Should().Contain("TechPromoTestUsers");
        }
    }
}
