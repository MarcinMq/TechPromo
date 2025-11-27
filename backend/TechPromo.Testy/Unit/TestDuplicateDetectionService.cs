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

        [Fact]
        public async Task SprawdzDuplikaty_IdentycznyLink_ZwracaDuplikat()
        {
            // Arrange - Przygotowanie
            var uzytkownik = new Uzytkownik 
            { 
                IdUzytkownik = Guid.NewGuid(),
                UserName = "testowy_uzytkownik",
                Email = "test@test.pl",
                PasswordHash = "hash123"
            };
            await _context.Uzytkownicy.AddAsync(uzytkownik);

            var istniejacaOferta = new Oferta
            {
                IdOferta = 1,
                Nazwa = "iPhone 15 Pro Max 256GB",
                Link = "https://www.mediaexpert.pl/telefony/iphone-15-pro-max",
                Cena = 5999.99m,
                Opis = "Najnowszy iPhone",
                Aktywna = true,
                DataDodania = DateTime.UtcNow,
                UzytkownikId = uzytkownik.IdUzytkownik
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
            var uzytkownik = new Uzytkownik 
            { 
                IdUzytkownik = Guid.NewGuid(),
                UserName = "user1",
                Email = "user1@test.pl",
                PasswordHash = "hash"
            };
            await _context.Uzytkownicy.AddAsync(uzytkownik);

            var oferta = new Oferta
            {
                IdOferta = 1,
                Nazwa = "Samsung Galaxy S24",
                Link = "https://euro.com.pl/samsung-s24",
                Cena = 3999.00m,
                Opis = "Opis",
                Aktywna = true,
                DataDodania = DateTime.UtcNow,
                UzytkownikId = uzytkownik.IdUzytkownik
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
            var uzytkownik = new Uzytkownik 
            { 
                IdUzytkownik = Guid.NewGuid(),
                UserName = "user2",
                Email = "user2@test.pl",
                PasswordHash = "hash"
            };
            await _context.Uzytkownicy.AddAsync(uzytkownik);

            var oferta = new Oferta
            {
                IdOferta = 1,
                Nazwa = "MacBook Pro M3",
                Link = "https://apple.pl/macbook-pro",
                Cena = 9999.00m,
                Opis = "Opis",
                Aktywna = true,
                DataDodania = DateTime.UtcNow,
                UzytkownikId = uzytkownik.IdUzytkownik
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
            var uzytkownik = new Uzytkownik 
            { 
                IdUzytkownik = Guid.NewGuid(),
                UserName = "user3",
                Email = "user3@test.pl",
                PasswordHash = "hash"
            };
            await _context.Uzytkownicy.AddAsync(uzytkownik);

            var oferta = new Oferta
            {
                IdOferta = 1,
                Nazwa = "PlayStation 5 Slim Digital Edition 1TB Biala",
                Link = "https://mediamarkt.pl/ps5-slim",
                Cena = 1999.00m,
                Opis = "Opis",
                Aktywna = true,
                DataDodania = DateTime.UtcNow,
                UzytkownikId = uzytkownik.IdUzytkownik
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
            wynik.PotencjalneDuplikaty.First().WynikPodobienstwa.Should().BeGreaterOrEqualTo(0.75);
        }

        [Fact]
        public async Task SprawdzDuplikaty_ZupelnieInnyProdukt_NieZwracaDuplikatu()
        {
            // Arrange
            var uzytkownik = new Uzytkownik 
            { 
                IdUzytkownik = Guid.NewGuid(),
                UserName = "user4",
                Email = "user4@test.pl",
                PasswordHash = "hash"
            };
            await _context.Uzytkownicy.AddAsync(uzytkownik);

            var oferta = new Oferta
            {
                IdOferta = 1,
                Nazwa = "Lodowka Samsung 380L NoFrost",
                Link = "https://rtv.pl/lodowka",
                Cena = 2499.00m,
                Opis = "Opis",
                Aktywna = true,
                DataDodania = DateTime.UtcNow,
                UzytkownikId = uzytkownik.IdUzytkownik
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
            var uzytkownik = new Uzytkownik 
            { 
                IdUzytkownik = Guid.NewGuid(),
                UserName = "user5",
                Email = "user5@test.pl",
                PasswordHash = "hash"
            };
            await _context.Uzytkownicy.AddAsync(uzytkownik);

            var staraOferta = new Oferta
            {
                IdOferta = 1,
                Nazwa = "Xbox Series X 1TB",
                Link = "https://sklep.pl/xbox",
                Cena = 2199.00m,
                Opis = "Opis",
                Aktywna = true,
                DataDodania = DateTime.UtcNow.AddDays(-35), // Starsza niz 30 dni
                UzytkownikId = uzytkownik.IdUzytkownik
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
            var uzytkownik = new Uzytkownik 
            { 
                IdUzytkownik = Guid.NewGuid(),
                UserName = "user6",
                Email = "user6@test.pl",
                PasswordHash = "hash"
            };
            await _context.Uzytkownicy.AddAsync(uzytkownik);

            var nieaktywnaOferta = new Oferta
            {
                IdOferta = 1,
                Nazwa = "Nintendo Switch OLED",
                Link = "https://sklep.pl/switch",
                Cena = 1499.00m,
                Opis = "Opis",
                Aktywna = false, // Nieaktywna
                DataDodania = DateTime.UtcNow,
                UzytkownikId = uzytkownik.IdUzytkownik
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
