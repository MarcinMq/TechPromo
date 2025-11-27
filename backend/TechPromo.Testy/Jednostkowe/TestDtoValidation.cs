using FluentAssertions;
using System.ComponentModel.DataAnnotations;
using TechPromo.Api.DTO;
using Xunit;

namespace TechPromo.Testy.Jednostkowe
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
                Tytul = "iPhone 15 Pro Max 256GB",
                Opis = "Najnowszy model iPhone z ekranem ProMotion 120Hz",
                Sklep = "https://apple.com/iphone-15-pro-max",
                Cena = 5999.99m,
                CenaPoprzednia = 6499.99m,
                Kategoria = "Elektronika"
            };

            // Act
            var bledy = WalidujModel(dto);

            // Assert
            bledy.Should().BeEmpty();
        }

        [Fact]
        public void UtworzOfertaDto_BrakTytulu_ZwracaBlad()
        {
            // Arrange
            var dto = new UtworzOfertaDto
            {
                Tytul = "", // Pusty tytul
                Opis = "Opis produktu",
                Sklep = "https://sklep.pl/produkt",
                Kategoria = "Elektronika"
            };

            // Act
            var bledy = WalidujModel(dto);

            // Assert
            bledy.Should().Contain(b => b.MemberNames.Contains("Tytul"));
        }

        [Fact]
        public void UtworzOfertaDto_BrakOpisu_ZwracaBlad()
        {
            // Arrange
            var dto = new UtworzOfertaDto
            {
                Tytul = "Produkt testowy",
                Opis = "", // Pusty opis
                Sklep = "https://sklep.pl/produkt",
                Kategoria = "Elektronika"
            };

            // Act
            var bledy = WalidujModel(dto);

            // Assert
            bledy.Should().Contain(b => b.MemberNames.Contains("Opis"));
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
                Nick = "NowyUzytkownik",
                Email = "nowy@example.com",
                Password = "SilneHaslo123!"
            };

            // Act
            var bledy = WalidujModel(dto);

            // Assert
            bledy.Should().BeEmpty();
        }

        [Fact]
        public void RegisterDto_BrakNicku_ZwracaBlad()
        {
            // Arrange
            var dto = new RegisterDto
            {
                Nick = "", // Brak nicku
                Email = "user@test.pl",
                Password = "Haslo123!"
            };

            // Act
            var bledy = WalidujModel(dto);

            // Assert
            bledy.Should().Contain(b => b.MemberNames.Contains("Nick"));
        }

        [Fact]
        public void DodajKomentarzDto_PoprawneDane_BrakBledow()
        {
            // Arrange
            var dto = new DodajKomentarzDto
            {
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
                Powod = "Ta oferta zawiera nieprawdziwe informacje o cenie",
                Typ = "offer"
            };

            // Act
            var bledy = WalidujModel(dto);

            // Assert
            bledy.Should().BeEmpty();
        }

        [Fact]
        public void ZglosDto_ZaDlugiPowod_ZwracaBlad()
        {
            // Arrange
            var dto = new ZglosDto
            {
                Powod = new string('x', 201), // Za dlugi powod (>200 znakow)
                Typ = "offer",
                IdTresci = 1
            };

            // Act
            var bledy = WalidujModel(dto);

            // Assert
            bledy.Should().Contain(b => b.MemberNames.Contains("Powod"));
        }

        [Fact]
        public void ZglosDto_BrakPowodu_ZwracaBlad()
        {
            // Arrange
            var dto = new ZglosDto
            {
                Powod = "", // Brak powodu
                Typ = "offer",
                IdTresci = 1
            };

            // Act
            var bledy = WalidujModel(dto);

            // Assert
            bledy.Should().Contain(b => b.MemberNames.Contains("Powod"));
        }
    }
}
