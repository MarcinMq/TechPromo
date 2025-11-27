using FluentAssertions;
using System.ComponentModel.DataAnnotations;
using TechPromo.Api.DTO;
using Xunit;

namespace TechPromo.Testy.Unit
{
    /// <summary>
    /// DTO validation tests.
    /// Tests input data validation.
    /// </summary>
    public class TestDtoValidation
    {
        private List<ValidationResult> WalidujModel(object model)
        {
            var wyniki = new List<ValidationResult>();
            var kontekst = new ValidationContext(model);
            Validator.TryValidateObject(model, kontekst, wyniki, true);
            return wyniki;
        }

        [Fact]
        public void UtworzOfertaDto_PoprawneDane_BrakBledow()
        {
            // Arrange
            var dto = new UtworzOfertaDto
            {
                Nazwa = "iPhone 15 Pro Max 256GB",
                Opis = "Najnowszy model iPhone z ekranem ProMotion 120Hz",
                Link = "https://apple.com/iphone-15-pro-max",
                Cena = 5999.99m,
                CenaPoprzednia = 6499.99m,
                KategoriaId = 1
            };

            // Act
            var bledy = WalidujModel(dto);

            // Assert
            bledy.Should().BeEmpty();
        }

        [Fact]
        public void UtworzOfertaDto_BrakNazwy_ZwracaBlad()
        {
            // Arrange
            var dto = new UtworzOfertaDto
            {
                Nazwa = "", // Pusta nazwa
                Opis = "Opis produktu",
                Link = "https://sklep.pl/produkt",
                KategoriaId = 1
            };

            // Act
            var bledy = WalidujModel(dto);

            // Assert
            bledy.Should().Contain(b => b.MemberNames.Contains("Nazwa"));
        }

        [Fact]
        public void UtworzOfertaDto_ZaKrotkaNazwa_ZwracaBlad()
        {
            // Arrange
            var dto = new UtworzOfertaDto
            {
                Nazwa = "AB", // Za krotka (min 3 znaki)
                Opis = "Opis produktu",
                Link = "https://sklep.pl/produkt",
                KategoriaId = 1
            };

            // Act
            var bledy = WalidujModel(dto);

            // Assert
            bledy.Should().NotBeEmpty();
        }

        [Fact]
        public void LoginDto_PoprawneDane_BrakBledow()
        {
            // Arrange
            var dto = new LoginDto
            {
                Email = "uzytkownik@example.com",
                Password = "MojeHaslo123!"
            };

            // Act
            var bledy = WalidujModel(dto);

            // Assert
            bledy.Should().BeEmpty();
        }

        [Fact]
        public void LoginDto_NiepoprawnyEmail_ZwracaBlad()
        {
            // Arrange
            var dto = new LoginDto
            {
                Email = "niepoprawny-email",
                Password = "Haslo123!"
            };

            // Act
            var bledy = WalidujModel(dto);

            // Assert
            bledy.Should().Contain(b => b.MemberNames.Contains("Email"));
        }

        [Fact]
        public void LoginDto_BrakHasla_ZwracaBlad()
        {
            // Arrange
            var dto = new LoginDto
            {
                Email = "user@test.pl",
                Password = "" // Brak hasla
            };

            // Act
            var bledy = WalidujModel(dto);

            // Assert
            bledy.Should().Contain(b => b.MemberNames.Contains("Password"));
        }

        [Fact]
        public void RegisterDto_PoprawneDane_BrakBledow()
        {
            // Arrange
            var dto = new RegisterDto
            {
                UserName = "NowyUzytkownik",
                Email = "nowy@example.com",
                Password = "SilneHaslo123!"
            };

            // Act
            var bledy = WalidujModel(dto);

            // Assert
            bledy.Should().BeEmpty();
        }

        [Fact]
        public void RegisterDto_ZaKrotkaNazwaUzytkownika_ZwracaBlad()
        {
            // Arrange
            var dto = new RegisterDto
            {
                UserName = "ab", // Za krotka
                Email = "user@test.pl",
                Password = "Haslo123!"
            };

            // Act
            var bledy = WalidujModel(dto);

            // Assert
            bledy.Should().NotBeEmpty();
        }

        [Fact]
        public void DodajKomentarzDto_PoprawneDane_BrakBledow()
        {
            // Arrange
            var dto = new DodajKomentarzDto
            {
                OfertaId = 1,
                Tresc = "To jest bardzo dobra oferta, polecam wszystkim!"
            };

            // Act
            var bledy = WalidujModel(dto);

            // Assert
            bledy.Should().BeEmpty();
        }

        [Fact]
        public void DodajKomentarzDto_PustaTresc_ZwracaBlad()
        {
            // Arrange
            var dto = new DodajKomentarzDto
            {
                OfertaId = 1,
                Tresc = "" // Pusta tresc
            };

            // Act
            var bledy = WalidujModel(dto);

            // Assert
            bledy.Should().Contain(b => b.MemberNames.Contains("Tresc"));
        }

        [Fact]
        public void ZglosDto_PoprawneDane_BrakBledow()
        {
            // Arrange
            var dto = new ZglosDto
            {
                Powod = "Ta oferta zawiera nieprawdziwe informacje o cenie"
            };

            // Act
            var bledy = WalidujModel(dto);

            // Assert
            bledy.Should().BeEmpty();
        }

        [Fact]
        public void ZglosDto_ZaKrotkiPowod_ZwracaBlad()
        {
            // Arrange
            var dto = new ZglosDto
            {
                Powod = "Zle" // Za krotki powod
            };

            // Act
            var bledy = WalidujModel(dto);

            // Assert
            bledy.Should().NotBeEmpty();
        }
    }
}
