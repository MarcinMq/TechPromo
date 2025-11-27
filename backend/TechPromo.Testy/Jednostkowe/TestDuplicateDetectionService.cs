using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Data;
using TechPromo.Api.Model;
using TechPromo.Api.Services;
using Xunit;

namespace TechPromo.Testy.Jednostkowe
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
                Id = 1,
                UserName = "testowy_uzytkownik",
                Email = "test@test.pl",
                DataRejestracji = DateTime.UtcNow
            };
            await _context.Users.AddAsync(uzytkownik);

            var istniejacaOferta = new Oferta
            {
                IdOferta = 1,
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
            var uzytkownik = new Uzytkownik 
            { 
                Id = 1,
                UserName = "user1",
                Email = "user1@test.pl",
                DataRejestracji = DateTime.UtcNow
            };
            await _context.Users.AddAsync(uzytkownik);

            var oferta = new Oferta
            {
                IdOferta = 1,
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

            // Link z parametrami UTM powinien być wykryty jako ten sam
            var wynik = await _serwis.SprawdzDuplikatyAsync(
                nazwa: "Samsung S24",
                link: "https://euro.com.pl/samsung-s24?utm_source=newsletter&utm_medium=email",
                sklep: null,
                cena: 3999.00m
            );

            // Assert
            wynik.CzyPotencjalnyDuplikat.Should().BeTrue();
        }

        [Fact]
        public async Task SprawdzDuplikaty_PodobnaNazwa_ZwracaDuplikat()
        {
            // Arrange
            var uzytkownik = new Uzytkownik 
            { 
                Id = 1,
                UserName = "user1",
                Email = "user1@test.pl",
                DataRejestracji = DateTime.UtcNow
            };
            await _context.Users.AddAsync(uzytkownik);

            var oferta = new Oferta
            {
                IdOferta = 1,
                Nazwa = "PlayStation 5 Slim 1TB + Kontroler DualSense",
                Link = "https://mediamarkt.pl/ps5-slim",
                Cena = 2499.00m,
                Opis = "PS5 Slim",
                Aktywna = true,
                DataDodania = DateTime.UtcNow,
                IdUzytkownik = uzytkownik.Id
            };
            await _context.Oferty.AddAsync(oferta);
            await _context.SaveChangesAsync();

            // Bardzo podobna nazwa, inny link
            var wynik = await _serwis.SprawdzDuplikatyAsync(
                nazwa: "PlayStation 5 Slim 1TB z kontrolerem DualSense",
                link: "https://neonet.pl/playstation-5-slim",
                sklep: null,
                cena: 2499.00m
            );

            // Assert
            wynik.CzyPotencjalnyDuplikat.Should().BeTrue();
            wynik.PotencjalneDuplikaty.First().WynikPodobienstwa.Should().BeGreaterThanOrEqualTo(0.7);
        }

        [Fact]
        public async Task SprawdzDuplikaty_RozneProdukty_NieZwracaDuplikatu()
        {
            // Arrange
            var uzytkownik = new Uzytkownik 
            { 
                Id = 1,
                UserName = "user1",
                Email = "user1@test.pl",
                DataRejestracji = DateTime.UtcNow
            };
            await _context.Users.AddAsync(uzytkownik);

            var oferta = new Oferta
            {
                IdOferta = 1,
                Nazwa = "Telewizor Samsung OLED 55 cali",
                Link = "https://sklep.pl/tv-samsung",
                Cena = 3999.00m,
                Opis = "Telewizor",
                Aktywna = true,
                DataDodania = DateTime.UtcNow,
                IdUzytkownik = uzytkownik.Id
            };
            await _context.Oferty.AddAsync(oferta);
            await _context.SaveChangesAsync();

            // Zupełnie inny produkt
            var wynik = await _serwis.SprawdzDuplikatyAsync(
                nazwa: "Laptop Dell Inspiron 15",
                link: "https://inny-sklep.pl/laptop-dell",
                sklep: null,
                cena: 2999.00m
            );

            // Assert
            wynik.CzyPotencjalnyDuplikat.Should().BeFalse();
        }

        [Fact]
        public async Task SprawdzDuplikaty_NegatywnaOferta_Ignorowana()
        {
            // Arrange
            var uzytkownik = new Uzytkownik 
            { 
                Id = 1,
                UserName = "user1",
                Email = "user1@test.pl",
                DataRejestracji = DateTime.UtcNow
            };
            await _context.Users.AddAsync(uzytkownik);

            var ofertaNeaktywna = new Oferta
            {
                IdOferta = 1,
                Nazwa = "Produkt testowy",
                Link = "https://test.pl/produkt",
                Cena = 100.00m,
                Opis = "Test",
                Aktywna = false, // nieaktywna
                DataDodania = DateTime.UtcNow,
                IdUzytkownik = uzytkownik.Id
            };
            await _context.Oferty.AddAsync(ofertaNeaktywna);
            await _context.SaveChangesAsync();

            // Ten sam link ale oferta jest nieaktywna
            var wynik = await _serwis.SprawdzDuplikatyAsync(
                nazwa: "Produkt testowy",
                link: "https://test.pl/produkt",
                sklep: null,
                cena: 100.00m
            );

            // Assert - nieaktywna oferta nie powinna być duplikatem
            wynik.CzyPotencjalnyDuplikat.Should().BeFalse();
        }

        [Fact]
        public async Task SprawdzDuplikaty_PustaLista_NieZwracaDuplikatu()
        {
            // Arrange - pusta baza danych

            // Act
            var wynik = await _serwis.SprawdzDuplikatyAsync(
                nazwa: "Nowy produkt",
                link: "https://sklep.pl/nowy",
                sklep: null,
                cena: 199.99m
            );

            // Assert
            wynik.CzyPotencjalnyDuplikat.Should().BeFalse();
            wynik.PotencjalneDuplikaty.Should().BeEmpty();
        }

        [Fact]
        public async Task SprawdzDuplikaty_TaSamaCenaBrakPodobienstwa_NieZwracaDuplikatu()
        {
            // Arrange
            var uzytkownik = new Uzytkownik 
            { 
                Id = 1,
                UserName = "user1",
                Email = "user1@test.pl",
                DataRejestracji = DateTime.UtcNow
            };
            await _context.Users.AddAsync(uzytkownik);

            var oferta = new Oferta
            {
                IdOferta = 1,
                Nazwa = "Książka fantasy",
                Link = "https://empik.pl/ksiazka-1",
                Cena = 29.99m,
                Opis = "Książka",
                Aktywna = true,
                DataDodania = DateTime.UtcNow,
                IdUzytkownik = uzytkownik.Id
            };
            await _context.Oferty.AddAsync(oferta);
            await _context.SaveChangesAsync();

            // Ta sama cena ale zupełnie inny produkt
            var wynik = await _serwis.SprawdzDuplikatyAsync(
                nazwa: "Koszulka sportowa Nike",
                link: "https://zalando.pl/koszulka",
                sklep: null,
                cena: 29.99m
            );

            // Assert - sama cena to za mało
            wynik.CzyPotencjalnyDuplikat.Should().BeFalse();
        }

        [Theory]
        [InlineData("https://sklep.pl/produkt", "https://SKLEP.PL/PRODUKT")]
        [InlineData("http://sklep.pl/produkt", "https://sklep.pl/produkt")]
        [InlineData("https://www.sklep.pl/produkt", "https://sklep.pl/produkt")]
        public async Task NormalizujLink_RoznePisownie_Dopasowane(string link1, string link2)
        {
            // Ten test sprawdza czy normalizacja linków działa poprawnie
            var uzytkownik = new Uzytkownik 
            { 
                Id = 1,
                UserName = "user1",
                DataRejestracji = DateTime.UtcNow
            };
            await _context.Users.AddAsync(uzytkownik);

            var oferta = new Oferta
            {
                IdOferta = 1,
                Nazwa = "Produkt",
                Link = link1,
                Opis = "Opis",
                Aktywna = true,
                DataDodania = DateTime.UtcNow,
                IdUzytkownik = uzytkownik.Id
            };
            await _context.Oferty.AddAsync(oferta);
            await _context.SaveChangesAsync();

            var wynik = await _serwis.SprawdzDuplikatyAsync(
                nazwa: "Produkt",
                link: link2,
                sklep: null,
                cena: null
            );

            wynik.CzyPotencjalnyDuplikat.Should().BeTrue();
        }
    }
}
