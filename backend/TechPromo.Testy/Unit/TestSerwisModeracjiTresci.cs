using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using TechPromo.Api.Services;
using Xunit;

namespace TechPromo.Testy.Unit
{
    /// <summary>
    /// Testy jednostkowe dla serwisu moderacji treści (Azure Content Safety).
    /// </summary>
    public class TestSerwisModeracjiTresci
    {
        private readonly Mock<ILogger<SerwisModeracjiTresci>> _mockLogger;

        public TestSerwisModeracjiTresci()
        {
            _mockLogger = new Mock<ILogger<SerwisModeracjiTresci>>();
        }

        private IConfiguration UtworzKonfiguracje(string? endpoint = null, string? apiKey = null)
        {
            var ustawienia = new Dictionary<string, string?>
            {
                { "ContentSafety:Endpoint", endpoint },
                { "ContentSafety:ApiKey", apiKey }
            };

            return new ConfigurationBuilder()
                .AddInMemoryCollection(ustawienia)
                .Build();
        }

        [Fact]
        public async Task ModerujTekstAsync_GdyNieSkonfigurowany_ZwracaBezpieczny()
        {
            // Arrange - brak konfiguracji
            var config = UtworzKonfiguracje();
            var serwis = new SerwisModeracjiTresci(config, _mockLogger.Object);

            // Act
            var wynik = await serwis.ModerujTekstAsync("Jakikolwiek tekst");

            // Assert
            wynik.CzyBezpieczny.Should().BeTrue();
            wynik.CzyZablokowany.Should().BeFalse();
            wynik.KomunikatDlaUzytkownika.Should().BeEmpty();
        }

        [Fact]
        public async Task ModerujTekstAsync_GdyTekstPusty_ZwracaBezpieczny()
        {
            // Arrange
            var config = UtworzKonfiguracje("https://example.cognitiveservices.azure.com", "fake-key");
            var serwis = new SerwisModeracjiTresci(config, _mockLogger.Object);

            // Act
            var wynik = await serwis.ModerujTekstAsync("");

            // Assert
            wynik.CzyBezpieczny.Should().BeTrue();
            wynik.CzyZablokowany.Should().BeFalse();
        }

        [Fact]
        public async Task ModerujTekstAsync_GdyTekstNull_ZwracaBezpieczny()
        {
            // Arrange
            var config = UtworzKonfiguracje("https://example.cognitiveservices.azure.com", "fake-key");
            var serwis = new SerwisModeracjiTresci(config, _mockLogger.Object);

            // Act
            var wynik = await serwis.ModerujTekstAsync(null!);

            // Assert
            wynik.CzyBezpieczny.Should().BeTrue();
            wynik.CzyZablokowany.Should().BeFalse();
        }

        [Fact]
        public async Task ModerujTekstAsync_GdyTekstSameSpacje_ZwracaBezpieczny()
        {
            // Arrange
            var config = UtworzKonfiguracje("https://example.cognitiveservices.azure.com", "fake-key");
            var serwis = new SerwisModeracjiTresci(config, _mockLogger.Object);

            // Act
            var wynik = await serwis.ModerujTekstAsync("   ");

            // Assert
            wynik.CzyBezpieczny.Should().BeTrue();
        }

        [Fact]
        public void WynikModeracjiTresci_Bezpieczny_ZwracaPoprawnwWartosci()
        {
            // Act
            var wynik = WynikModeracjiTresci.Bezpieczny();

            // Assert
            wynik.CzyBezpieczny.Should().BeTrue();
            wynik.CzyZablokowany.Should().BeFalse();
            wynik.NaruszonKategorie.Should().BeEmpty();
            wynik.KomunikatDlaUzytkownika.Should().BeEmpty();
        }

        [Fact]
        public void WynikModeracjiTresci_Zablokowany_ZwracaPoprawneWartosci()
        {
            // Arrange
            var kategorie = new List<string> { "Hate", "Violence" };

            // Act
            var wynik = WynikModeracjiTresci.Zablokowany(kategorie, null);

            // Assert
            wynik.CzyBezpieczny.Should().BeFalse();
            wynik.CzyZablokowany.Should().BeTrue();
            wynik.NaruszonKategorie.Should().Contain("Hate");
            wynik.NaruszonKategorie.Should().Contain("Violence");
            wynik.KomunikatDlaUzytkownika.Should().NotBeEmpty();
        }

        [Fact]
        public void WynikModeracjiTresci_Zablokowany_DlaNienawisci_ZwracaOdpowiedniKomunikat()
        {
            // Arrange
            var kategorie = new List<string> { "Hate" };

            // Act
            var wynik = WynikModeracjiTresci.Zablokowany(kategorie, null);

            // Assert
            wynik.KomunikatDlaUzytkownika.Should().NotBeEmpty();
            // Sprawdzamy czy zawiera emoji lub słowa kluczowe
            (wynik.KomunikatDlaUzytkownika.Contains("🚫") || 
             wynik.KomunikatDlaUzytkownika.Contains("⚠️") || 
             wynik.KomunikatDlaUzytkownika.Contains("🛑") ||
             wynik.KomunikatDlaUzytkownika.Contains("😔") ||
             wynik.KomunikatDlaUzytkownika.Contains("🤝")).Should().BeTrue();
        }

        [Fact]
        public void WynikModeracjiTresci_Zablokowany_DlaPrzemocy_ZwracaOdpowiedniKomunikat()
        {
            // Arrange
            var kategorie = new List<string> { "Violence" };

            // Act
            var wynik = WynikModeracjiTresci.Zablokowany(kategorie, null);

            // Assert
            wynik.KomunikatDlaUzytkownika.Should().NotBeEmpty();
        }

        [Fact]
        public void WynikModeracjiTresci_Zablokowany_DlaSamookaleczenia_ZwracaKomunikatWsparcia()
        {
            // Arrange
            var kategorie = new List<string> { "SelfHarm" };

            // Act
            var wynik = WynikModeracjiTresci.Zablokowany(kategorie, null);

            // Assert
            wynik.KomunikatDlaUzytkownika.Should().NotBeEmpty();
            // Sprawdzamy czy zawiera numer telefonu zaufania lub wspierający komunikat
            (wynik.KomunikatDlaUzytkownika.Contains("116 123") || 
             wynik.KomunikatDlaUzytkownika.Contains("💙") ||
             wynik.KomunikatDlaUzytkownika.Contains("🤗")).Should().BeTrue();
        }

        [Fact]
        public void WynikModeracjiTresci_Zablokowany_DlaPolskichWulgaryzmow_ZwracaOdpowiedniKomunikat()
        {
            // Arrange
            var kategorie = new List<string> { "PolskieWulgaryzmy" };
            var slowa = new List<string> { "kurwa" };

            // Act
            var wynik = WynikModeracjiTresci.Zablokowany(kategorie, slowa);

            // Assert
            wynik.CzyBezpieczny.Should().BeFalse();
            wynik.CzyZablokowany.Should().BeTrue();
            wynik.KomunikatDlaUzytkownika.Should().NotBeEmpty();
            wynik.ZnalezioneSlowa.Should().Contain("kurwa");
            // Sprawdzamy czy zawiera emoji lub słowa kluczowe
            (wynik.KomunikatDlaUzytkownika.Contains("wulgar") || 
             wynik.KomunikatDlaUzytkownika.Contains("🚫") ||
             wynik.KomunikatDlaUzytkownika.Contains("⚠️")).Should().BeTrue();
        }

        // Testy dla Azure Blocklist - bez konfiguracji Azure, moderacja jest wyłączona (fail-open)
        // Te testy weryfikują zachowanie WynikModeracjiTresci, nie samego serwisu z Azure
        
        [Fact]
        public async Task ModerujTekstAsync_GdyBrakKonfiguracji_NieBlokujeWulgaryzmow()
        {
            // Arrange - bez konfiguracji Azure, moderacja wyłączona (fail-open)
            var config = UtworzKonfiguracje();
            var serwis = new SerwisModeracjiTresci(config, _mockLogger.Object);

            // Act
            var wynik = await serwis.ModerujTekstAsync("To jest kurwa test");

            // Assert - bez Azure, komentarz przechodzi (fail-open)
            wynik.CzyBezpieczny.Should().BeTrue();
        }

        [Fact]
        public void WynikModeracjiTresci_Zablokowany_DlaBlocklist_ZwracaOdpowiedniKomunikat()
        {
            // Arrange - Blocklist to kategoria dla Azure Custom Blocklist
            var kategorie = new List<string> { "Blocklist" };
            var slowa = new List<string> { "kurwa" };

            // Act
            var wynik = WynikModeracjiTresci.Zablokowany(kategorie, slowa);

            // Assert
            wynik.CzyBezpieczny.Should().BeFalse();
            wynik.CzyZablokowany.Should().BeTrue();
            wynik.KomunikatDlaUzytkownika.Should().NotBeEmpty();
            wynik.ZnalezioneSlowa.Should().Contain("kurwa");
            // Sprawdzamy czy zawiera emoji (komunikaty używają emoji)
            (wynik.KomunikatDlaUzytkownika.Contains("🚫") || 
             wynik.KomunikatDlaUzytkownika.Contains("⚠️") ||
             wynik.KomunikatDlaUzytkownika.Contains("🛑") ||
             wynik.KomunikatDlaUzytkownika.Contains("😔") ||
             wynik.KomunikatDlaUzytkownika.Contains("🤝")).Should().BeTrue();
        }

        [Fact]
        public async Task ModerujTekstAsync_GdyNormalnyTekst_BezKonfiguracji_NieBlokuje()
        {
            // Arrange
            var config = UtworzKonfiguracje();
            var serwis = new SerwisModeracjiTresci(config, _mockLogger.Object);

            // Act
            var wynik = await serwis.ModerujTekstAsync("To jest super oferta, polecam!");

            // Assert
            wynik.CzyBezpieczny.Should().BeTrue();
            wynik.CzyZablokowany.Should().BeFalse();
        }

        [Fact]
        public async Task ModerujTekstAsync_GdyBrakEndpoint_ZwracaBezpieczny()
        {
            // Arrange - tylko klucz API, brak endpoint
            var config = UtworzKonfiguracje(null, "fake-key");
            var serwis = new SerwisModeracjiTresci(config, _mockLogger.Object);

            // Act
            var wynik = await serwis.ModerujTekstAsync("Test tekst");

            // Assert
            wynik.CzyBezpieczny.Should().BeTrue();
        }

        [Fact]
        public async Task ModerujTekstAsync_GdyBrakKluczaApi_ZwracaBezpieczny()
        {
            // Arrange - tylko endpoint, brak klucza API
            var config = UtworzKonfiguracje("https://example.cognitiveservices.azure.com", null);
            var serwis = new SerwisModeracjiTresci(config, _mockLogger.Object);

            // Act
            var wynik = await serwis.ModerujTekstAsync("Test tekst");

            // Assert
            wynik.CzyBezpieczny.Should().BeTrue();
        }
    }
}
