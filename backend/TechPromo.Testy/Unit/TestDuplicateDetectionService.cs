using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Data;
using TechPromo.Api.Model;
using TechPromo.Api.Services;
using Xunit;

namespace TechPromo.Testy.Unit
{
    /// <summary>
    /// Unit tests for duplicate detection service.
    /// Tests similarity algorithms, URL and text normalization.
    /// </summary>
    public class TestDuplicateDetectionService : IDisposable
    {
        private readonly TechPromoDbContext _context;
        private readonly SerwisWykrywaniaDuplikatow _serwis;

        public TestDuplicateDetectionService()
        {
            var opcje = new DbContextOptionsBuilder<TechPromoDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new TechPromoDbContext(opcje);
            _serwis = new SerwisWykrywaniaDuplikatow(_context);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        private async Task<Uzytkownik> DodajTestowegoUzytkownikaAsync(string userName)
        {
            var uzytkownik = new Uzytkownik 
            { 
                UserName = userName,
                Email = $"{userName}@test.pl",
                NormalizedUserName = userName.ToUpper(),
                NormalizedEmail = $"{userName}@test.pl".ToUpper()
            };
            await _context.Users.AddAsync(uzytkownik);
            await _context.SaveChangesAsync();
            return uzytkownik;
        }

        [Fact]
        public async Task SprawdzDuplikaty_IdentycznyLink_ZwracaDuplikat()
        {
            // Arrange - Przygotowanie
            var uzytkownik = await DodajTestowegoUzytkownikaAsync("testowy_uzytkownik");

            var istniejacaOferta = new Oferta
            {
                Nazwa = "iPhone 15 Pro Max 256GB",
                Link = "https://www.mediaexpert.pl/telefony/iphone-15-pro-max",
                Cena = 5999.99m,
                Opis = "Najnowszy iPhone",
                Aktywna = true,
                DataDodania = DateTime.UtcNow,
                IdUzytkownik = uzytkownik.Id
            };
            await _context.Oferty.AddAsync(istniejacaOferta);
            await _context.SaveChangesAsync();

            // Act - Dzialanie
            var wynik = await _serwis.SprawdzDuplikatyAsync(
                nazwa: "Nowy iPhone 15",
                link: "https://www.mediaexpert.pl/telefony/iphone-15-pro-max",
                sklep: null,
                cena: 5999.99m
            );

            // Assert - Sprawdzenie
            wynik.CzyPotencjalnyDuplikat.Should().BeTrue();
            wynik.PotencjalneDuplikaty.Should().HaveCount(1);
            wynik.PotencjalneDuplikaty.First().WynikPodobienstwa.Should().Be(1.0);
            wynik.PotencjalneDuplikaty.First().PowodDopasowania.Should().Contain("Identyczny link");
        }

        [Fact]
        public async Task SprawdzDuplikaty_LinkZParametramiUTM_ZwracaDuplikat()
        {
            // Arrange
            var uzytkownik = await DodajTestowegoUzytkownikaAsync("user1");

            var oferta = new Oferta
            {
                Nazwa = "Samsung Galaxy S24",
                Link = "https://euro.com.pl/samsung-s24",
                Cena = 3999.00m,
                Opis = "Opis",
                Aktywna = true,
                DataDodania = DateTime.UtcNow,
                IdUzytkownik = uzytkownik.Id
            };
            await _context.Oferty.AddAsync(oferta);
            await _context.SaveChangesAsync();

            // Act - Link z parametrami UTM
            var wynik = await _serwis.SprawdzDuplikatyAsync(
                nazwa: "Samsung S24",
                link: "https://euro.com.pl/samsung-s24?utm_source=google&utm_medium=cpc&fbclid=abc123",
                sklep: null,
                cena: 3999.00m
            );

            // Assert - Powinien wykryc duplikat mimo roznych parametrow UTM
            wynik.CzyPotencjalnyDuplikat.Should().BeTrue();
            wynik.PotencjalneDuplikaty.First().WynikPodobienstwa.Should().Be(1.0);
        }

        [Fact]
        public async Task SprawdzDuplikaty_LinkZWWW_ZwracaDuplikat()
        {
            // Arrange
            var uzytkownik = await DodajTestowegoUzytkownikaAsync("user2");

            var oferta = new Oferta
            {
                Nazwa = "MacBook Pro M3",
                Link = "https://apple.pl/macbook-pro",
                Cena = 9999.00m,
                Opis = "Opis",
                Aktywna = true,
                DataDodania = DateTime.UtcNow,
                IdUzytkownik = uzytkownik.Id
            };
            await _context.Oferty.AddAsync(oferta);
            await _context.SaveChangesAsync();

            // Act - Link z www
            var wynik = await _serwis.SprawdzDuplikatyAsync(
                nazwa: "MacBook",
                link: "https://www.apple.pl/macbook-pro",
                sklep: null,
                cena: 9999.00m
            );

            // Assert
            wynik.CzyPotencjalnyDuplikat.Should().BeTrue();
        }

        [Fact]
        public async Task SprawdzDuplikaty_PodobnyTytul_ZwracaDuplikat()
        {
            // Arrange
            var uzytkownik = await DodajTestowegoUzytkownikaAsync("user3");

            var oferta = new Oferta
            {
                Nazwa = "PlayStation 5 Slim Digital Edition 1TB Biala",
                Link = "https://mediamarkt.pl/ps5-slim",
                Cena = 1999.00m,
                Opis = "Opis",
                Aktywna = true,
                DataDodania = DateTime.UtcNow,
                IdUzytkownik = uzytkownik.Id
            };
            await _context.Oferty.AddAsync(oferta);
            await _context.SaveChangesAsync();

            // Act - Bardzo podobny tytul
            var wynik = await _serwis.SprawdzDuplikatyAsync(
                nazwa: "PlayStation 5 Slim 1TB Digital Edition Biala",
                link: "https://inne-sklep.pl/ps5",
                sklep: null,
                cena: 2099.00m
            );

            // Assert
            wynik.CzyPotencjalnyDuplikat.Should().BeTrue();
            wynik.PotencjalneDuplikaty.First().WynikPodobienstwa.Should().BeGreaterThanOrEqualTo(0.75);
        }

        [Fact]
        public async Task SprawdzDuplikaty_ZupelnieInnyProdukt_NieZwracaDuplikatu()
        {
            // Arrange
            var uzytkownik = await DodajTestowegoUzytkownikaAsync("user4");

            var oferta = new Oferta
            {
                Nazwa = "Lodowka Samsung 380L NoFrost",
                Link = "https://rtv.pl/lodowka",
                Cena = 2499.00m,
                Opis = "Opis",
                Aktywna = true,
                DataDodania = DateTime.UtcNow,
                IdUzytkownik = uzytkownik.Id
            };
            await _context.Oferty.AddAsync(oferta);
            await _context.SaveChangesAsync();

            // Act - Zupelnie inny produkt
            var wynik = await _serwis.SprawdzDuplikatyAsync(
                nazwa: "Telewizor LG OLED 55 cali 4K",
                link: "https://mediamarkt.pl/lg-oled",
                sklep: null,
                cena: 3999.00m
            );

            // Assert
            wynik.CzyPotencjalnyDuplikat.Should().BeFalse();
            wynik.PotencjalneDuplikaty.Should().BeEmpty();
        }

        [Fact]
        public async Task SprawdzDuplikaty_OfertaStarsza30Dni_NieZwracaDuplikatu()
        {
            // Arrange
            var uzytkownik = await DodajTestowegoUzytkownikaAsync("user5");

            var staraOferta = new Oferta
            {
                Nazwa = "Xbox Series X 1TB",
                Link = "https://sklep.pl/xbox",
                Cena = 2199.00m,
                Opis = "Opis",
                Aktywna = true,
                DataDodania = DateTime.UtcNow.AddDays(-35), // Starsza niz 30 dni
                IdUzytkownik = uzytkownik.Id
            };
            await _context.Oferty.AddAsync(staraOferta);
            await _context.SaveChangesAsync();

            // Act
            var wynik = await _serwis.SprawdzDuplikatyAsync(
                nazwa: "Xbox Series X 1TB",
                link: "https://sklep.pl/xbox",
                sklep: null,
                cena: 2199.00m
            );

            // Assert - Nie powinien wykryc starej oferty
            wynik.CzyPotencjalnyDuplikat.Should().BeFalse();
        }

        [Fact]
        public async Task SprawdzDuplikaty_OfertaNieaktywna_NieZwracaDuplikatu()
        {
            // Arrange
            var uzytkownik = await DodajTestowegoUzytkownikaAsync("user6");

            var nieaktywnaOferta = new Oferta
            {
                Nazwa = "Nintendo Switch OLED",
                Link = "https://sklep.pl/switch",
                Cena = 1499.00m,
                Opis = "Opis",
                Aktywna = false, // Nieaktywna
                DataDodania = DateTime.UtcNow,
                IdUzytkownik = uzytkownik.Id
            };
            await _context.Oferty.AddAsync(nieaktywnaOferta);
            await _context.SaveChangesAsync();

            // Act
            var wynik = await _serwis.SprawdzDuplikatyAsync(
                nazwa: "Nintendo Switch OLED",
                link: "https://sklep.pl/switch",
                sklep: null,
                cena: 1499.00m
            );

            // Assert
            wynik.CzyPotencjalnyDuplikat.Should().BeFalse();
        }

        [Fact]
        public async Task SprawdzDuplikaty_PustyLink_NieWyrzucaWyjatku()
        {
            // Act
            var wynik = await _serwis.SprawdzDuplikatyAsync(
                nazwa: "Produkt testowy",
                link: "",
                sklep: null,
                cena: null
            );

            // Assert
            wynik.Should().NotBeNull();
            wynik.CzyPotencjalnyDuplikat.Should().BeFalse();
        }

        [Fact]
        public async Task SprawdzDuplikaty_NullLink_NieWyrzucaWyjatku()
        {
            // Act
            var wynik = await _serwis.SprawdzDuplikatyAsync(
                nazwa: "Produkt testowy",
                link: null,
                sklep: null,
                cena: null
            );

            // Assert
            wynik.Should().NotBeNull();
        }
    }
}
