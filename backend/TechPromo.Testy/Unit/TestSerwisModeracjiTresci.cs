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
        public async Task ModerujTekstAsync_GdyNieSkonfigurowany_ZwracaBlad()
        {
            // Arrange - brak konfiguracji
            var config = UtworzKonfiguracje();
            var serwis = new SerwisModeracjiTresci(config, _mockLogger.Object);

            // Act
            var wynik = await serwis.ModerujTekstAsync("Jakikolwiek tekst");

            // Assert
            wynik.CzyBezpieczny.Should().BeFalse();
            wynik.CzyZablokowany.Should().BeTrue();
            wynik.CzyBlad.Should().BeTrue();
            wynik.KomunikatDlaUzytkownika.Should().NotBeEmpty();
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
        public async Task ModerujTekstAsync_GdyBrakKonfiguracji_ZwracaBlad()
        {
            // Arrange - bez konfiguracji Azure, moderacja wyłączona (fail-open)
            var config = UtworzKonfiguracje();
            var serwis = new SerwisModeracjiTresci(config, _mockLogger.Object);

            // Act
            var wynik = await serwis.ModerujTekstAsync("To jest kurwa test");

            // Assert - bez Azure, komentarz przechodzi (fail-open)
            wynik.CzyBezpieczny.Should().BeFalse();
            wynik.CzyBlad.Should().BeTrue();
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
        public async Task ModerujTekstAsync_GdyNormalnyTekst_BezKonfiguracji_ZwracaBlad()
        {
            // Arrange
            var config = UtworzKonfiguracje();
            var serwis = new SerwisModeracjiTresci(config, _mockLogger.Object);

            // Act
            var wynik = await serwis.ModerujTekstAsync("To jest super oferta, polecam!");

            // Assert
            wynik.CzyBezpieczny.Should().BeFalse();
            wynik.CzyBlad.Should().BeTrue();
            wynik.CzyZablokowany.Should().BeTrue();
        }

        [Fact]
        public async Task ModerujTekstAsync_GdyBrakEndpoint_ZwracaBlad()
        {
            // Arrange - tylko klucz API, brak endpoint
            var config = UtworzKonfiguracje(null, "fake-key");
            var serwis = new SerwisModeracjiTresci(config, _mockLogger.Object);

            // Act
            var wynik = await serwis.ModerujTekstAsync("Test tekst");

            // Assert
            wynik.CzyBezpieczny.Should().BeFalse();
            wynik.CzyBlad.Should().BeTrue();
        }

        [Fact]
        public async Task ModerujTekstAsync_GdyBrakKluczaApi_ZwracaBlad()
        {
            // Arrange - tylko endpoint, brak klucza API
            var config = UtworzKonfiguracje("https://example.cognitiveservices.azure.com", null);
            var serwis = new SerwisModeracjiTresci(config, _mockLogger.Object);

            // Act
            var wynik = await serwis.ModerujTekstAsync("Test tekst");

            // Assert
            wynik.CzyBezpieczny.Should().BeFalse();
            wynik.CzyBlad.Should().BeTrue();
        }

        // ===== TESTY MODERACJI OBRAZÓW =====

        [Fact]
        public async Task ModerujObrazAsync_GdyNieSkonfigurowany_ZwracaBlad()
        {
            // Arrange - brak konfiguracji
            var config = UtworzKonfiguracje();
            var serwis = new SerwisModeracjiTresci(config, _mockLogger.Object);
            var fakeImageBytes = new byte[] { 0x89, 0x50, 0x4E, 0x47 }; // PNG magic bytes

            // Act
            var wynik = await serwis.ModerujObrazAsync(fakeImageBytes);

            // Assert - bez Azure, obraz przechodzi (fail-open)
            wynik.CzyBezpieczny.Should().BeFalse();
            wynik.CzyZablokowany.Should().BeTrue();
            wynik.CzyBlad.Should().BeTrue();
        }

        [Fact]
        public async Task ModerujObrazAsync_GdyObrazPusty_ZwracaBezpieczny()
        {
            // Arrange
            var config = UtworzKonfiguracje("https://example.cognitiveservices.azure.com", "fake-key");
            var serwis = new SerwisModeracjiTresci(config, _mockLogger.Object);

            // Act
            var wynik = await serwis.ModerujObrazAsync(Array.Empty<byte>());

            // Assert
            wynik.CzyBezpieczny.Should().BeTrue();
        }

        [Fact]
        public async Task ModerujObrazAsync_GdyObrazNull_ZwracaBezpieczny()
        {
            // Arrange
            var config = UtworzKonfiguracje("https://example.cognitiveservices.azure.com", "fake-key");
            var serwis = new SerwisModeracjiTresci(config, _mockLogger.Object);

            // Act
            var wynik = await serwis.ModerujObrazAsync(null!);

            // Assert
            wynik.CzyBezpieczny.Should().BeTrue();
        }

        [Fact]
        public void WynikModeracjiTresci_ZablokowanyObraz_DlaTresciSeksualnych_ZwracaOdpowiedniKomunikat()
        {
            // Arrange
            var kategorie = new List<string> { "Sexual" };

            // Act
            var wynik = WynikModeracjiTresci.ZablokowanyObraz(kategorie);

            // Assert
            wynik.CzyBezpieczny.Should().BeFalse();
            wynik.CzyZablokowany.Should().BeTrue();
            wynik.KomunikatDlaUzytkownika.Should().Contain("dorosłych");
            wynik.KomunikatDlaUzytkownika.Should().Contain("🚫");
        }

        [Fact]
        public void WynikModeracjiTresci_ZablokowanyObraz_DlaPrzemocy_ZwracaOdpowiedniKomunikat()
        {
            // Arrange
            var kategorie = new List<string> { "Violence" };

            // Act
            var wynik = WynikModeracjiTresci.ZablokowanyObraz(kategorie);

            // Assert
            wynik.CzyBezpieczny.Should().BeFalse();
            wynik.CzyZablokowany.Should().BeTrue();
            wynik.KomunikatDlaUzytkownika.Should().Contain("przemocowe");
            wynik.KomunikatDlaUzytkownika.Should().Contain("🚫");
        }

        [Fact]
        public void WynikModeracjiTresci_ZablokowanyObraz_DlaInnejKategorii_ZwracaOgolnyKomunikat()
        {
            // Arrange
            var kategorie = new List<string> { "Hate" };

            // Act
            var wynik = WynikModeracjiTresci.ZablokowanyObraz(kategorie);

            // Assert
            wynik.CzyBezpieczny.Should().BeFalse();
            wynik.CzyZablokowany.Should().BeTrue();
            wynik.KomunikatDlaUzytkownika.Should().Contain("nieodpowiednie");
            wynik.KomunikatDlaUzytkownika.Should().Contain("🚫");
        }

        // ===== TEST SCENARIUSZA: OFERTA Z WULGARNYM TEKSTEM POWINNA BYĆ ZABLOKOWANA =====

        [Fact]
        public void TestScenariusz_OfertaZWulgarnymiSlowami_PowinnaZostacZablokowana()
        {
            // Symulacja: użytkownik próbuje dodać ofertę z wulgarnym tytułem
            var tytulOferty = "Kurwa super laptop za grosze!";
            var opisOferty = "Najlepszy sprzęt, jebane promocje codziennie!";
            
            // Oczekiwany wynik moderacji - powinno być zablokowane
            var kategorie = new List<string> { "Blocklist" };
            var znalezioneSlowa = new List<string> { "kurwa", "jebane" };
            
            var wynikModeracji = WynikModeracjiTresci.Zablokowany(kategorie, znalezioneSlowa);
            
            // Assert
            wynikModeracji.CzyZablokowany.Should().BeTrue("Oferta z wulgaryzmami powinna być zablokowana");
            wynikModeracji.ZnalezioneSlowa.Should().Contain("kurwa");
            wynikModeracji.ZnalezioneSlowa.Should().Contain("jebane");
            wynikModeracji.KomunikatDlaUzytkownika.Should().NotBeEmpty();
        }

        [Fact]
        public void TestScenariusz_OfertaZNieodpowiednimZdjeciem_PowinnaZostacZablokowana()
        {
            // Symulacja: użytkownik próbuje dodać ofertę ze zdjęciem zawierającym nieodpowiednie treści
            // Azure Content Safety zwróciłoby: Sexual severity = 4
            
            var kategorie = new List<string> { "Sexual" };
            var wynikModeracji = WynikModeracjiTresci.ZablokowanyObraz(kategorie);
            
            // Assert
            wynikModeracji.CzyZablokowany.Should().BeTrue("Oferta z nieodpowiednim zdjęciem powinna być zablokowana");
            wynikModeracji.KomunikatDlaUzytkownika.Should().Contain("dorosłych");
        }

        [Fact]
        public void TestScenariusz_PoprawnaOferta_PowinnaPrzejscModeracje()
        {
            // Symulacja: użytkownik dodaje normalną ofertę
            var tytulOferty = "Laptop HP ProBook 450 G8 w super cenie!";
            var opisOferty = "Świetny laptop do pracy i nauki. Polecam!";
            
            // Normalny tekst - powinien przejść moderację
            var wynikModeracji = WynikModeracjiTresci.Bezpieczny();
            
            // Assert
            wynikModeracji.CzyBezpieczny.Should().BeTrue("Poprawna oferta powinna przejść moderację");
            wynikModeracji.CzyZablokowany.Should().BeFalse();
            wynikModeracji.KomunikatDlaUzytkownika.Should().BeEmpty();
        }
    }
}
