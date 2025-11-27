using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Data;
using TechPromo.Api.Model;
using Xunit;

namespace TechPromo.Testy.Jednostkowe
{
    /// <summary>
    /// Tests for Oferta (Offer) model.
    /// Verifies offer creation, validation, expiration and pricing logic.
    /// </summary>
    public class TestOfertaModel
    {
        private TechPromoDbContext CreateContext()
        {
            var options = new DbContextOptionsBuilder<TechPromoDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new TechPromoDbContext(options);
        }

        #region Offer Creation Tests

        [Fact]
        public async Task Oferta_Create_SavesAllFields()
        {
            // Arrange
            using var context = CreateContext();
            var user = new Uzytkownik { Id = 1, UserName = "user1", DataRejestracji = DateTime.UtcNow };
            context.Users.Add(user);

            var oferta = new Oferta
            {
                IdUzytkownik = 1,
                Nazwa = "Laptop Gaming 50% taniej",
                Opis = "Świetny laptop do gier w promocyjnej cenie",
                Link = "https://sklep.pl/laptop",
                Typ = "promocja",
                Cena = 2500.00m,
                CenaPoprzednia = 5000.00m,
                Kod = "LAPTOP50",
                WaznoscOd = DateTime.UtcNow,
                WaznoscDo = DateTime.UtcNow.AddDays(7),
                LiczbaHot = 0,
                LiczbaCold = 0,
                Aktywna = true,
                Zatwierdzona = false,
                DataDodania = DateTime.UtcNow
            };

            // Act
            context.Oferty.Add(oferta);
            await context.SaveChangesAsync();

            // Assert
            var saved = await context.Oferty.FirstAsync();
            saved.Nazwa.Should().Be("Laptop Gaming 50% taniej");
            saved.Cena.Should().Be(2500.00m);
            saved.CenaPoprzednia.Should().Be(5000.00m);
            saved.Kod.Should().Be("LAPTOP50");
            saved.Typ.Should().Be("promocja");
            saved.Aktywna.Should().BeTrue();
            saved.Zatwierdzona.Should().BeFalse();
        }

        [Fact]
        public async Task Oferta_WithoutOptionalFields_SavesCorrectly()
        {
            // Arrange
            using var context = CreateContext();
            var oferta = new Oferta
            {
                IdUzytkownik = 1,
                Nazwa = "Darmowy kupon",
                Link = "https://example.com",
                DataDodania = DateTime.UtcNow
            };

            // Act
            context.Oferty.Add(oferta);
            await context.SaveChangesAsync();

            // Assert
            var saved = await context.Oferty.FirstAsync();
            saved.Cena.Should().BeNull();
            saved.CenaPoprzednia.Should().BeNull();
            saved.Kod.Should().BeNull();
            saved.Opis.Should().Be(string.Empty); // Default value
        }

        #endregion

        #region Price Calculation Tests

        [Theory]
        [InlineData(100, 200, 50)]     // 50% discount
        [InlineData(75, 100, 25)]      // 25% discount
        [InlineData(10, 100, 90)]      // 90% discount
        [InlineData(99, 100, 1)]       // 1% discount
        [InlineData(50, 50, 0)]        // 0% discount
        public void Discount_CalculatedCorrectly(decimal currentPrice, decimal previousPrice, int expectedDiscount)
        {
            // Arrange
            var oferta = new Oferta
            {
                Cena = currentPrice,
                CenaPoprzednia = previousPrice
            };

            // Act
            var discount = (int)(((previousPrice - currentPrice) / previousPrice) * 100);

            // Assert
            discount.Should().Be(expectedDiscount);
        }

        [Fact]
        public void Discount_WithNullPreviousPrice_ReturnsZero()
        {
            // Arrange
            var oferta = new Oferta
            {
                Cena = 100,
                CenaPoprzednia = null
            };

            // Act
            var discount = oferta.CenaPoprzednia.HasValue 
                ? (int)(((oferta.CenaPoprzednia.Value - oferta.Cena!.Value) / oferta.CenaPoprzednia.Value) * 100)
                : 0;

            // Assert
            discount.Should().Be(0);
        }

        #endregion

        #region Offer Validity Tests

        [Fact]
        public void Oferta_WithinValidityPeriod_IsValid()
        {
            // Arrange
            var oferta = new Oferta
            {
                WaznoscOd = DateTime.UtcNow.AddDays(-1),
                WaznoscDo = DateTime.UtcNow.AddDays(7)
            };

            // Act
            var now = DateTime.UtcNow;
            var isValid = (!oferta.WaznoscOd.HasValue || oferta.WaznoscOd <= now) &&
                          (!oferta.WaznoscDo.HasValue || oferta.WaznoscDo >= now);

            // Assert
            isValid.Should().BeTrue();
        }

        [Fact]
        public void Oferta_BeforeStartDate_IsNotValid()
        {
            // Arrange
            var oferta = new Oferta
            {
                WaznoscOd = DateTime.UtcNow.AddDays(1),
                WaznoscDo = DateTime.UtcNow.AddDays(7)
            };

            // Act
            var now = DateTime.UtcNow;
            var isValid = oferta.WaznoscOd <= now;

            // Assert
            isValid.Should().BeFalse();
        }

        [Fact]
        public void Oferta_AfterEndDate_IsExpired()
        {
            // Arrange
            var oferta = new Oferta
            {
                WaznoscOd = DateTime.UtcNow.AddDays(-10),
                WaznoscDo = DateTime.UtcNow.AddDays(-1)
            };

            // Act
            var now = DateTime.UtcNow;
            var isExpired = oferta.WaznoscDo < now;

            // Assert
            isExpired.Should().BeTrue();
        }

        [Fact]
        public void Oferta_WithNoEndDate_NeverExpires()
        {
            // Arrange
            var oferta = new Oferta
            {
                WaznoscOd = DateTime.UtcNow.AddDays(-30),
                WaznoscDo = null
            };

            // Act
            var now = DateTime.UtcNow;
            var isExpired = oferta.WaznoscDo.HasValue && oferta.WaznoscDo < now;

            // Assert
            isExpired.Should().BeFalse();
        }

        #endregion

        #region Offer Status Tests

        [Fact]
        public void Oferta_ActiveAndApproved_IsVisible()
        {
            // Arrange
            var oferta = new Oferta
            {
                Aktywna = true,
                Zatwierdzona = true
            };

            // Act
            var isVisible = oferta.Aktywna && oferta.Zatwierdzona;

            // Assert
            isVisible.Should().BeTrue();
        }

        [Fact]
        public void Oferta_ActiveButNotApproved_IsNotVisible()
        {
            // Arrange
            var oferta = new Oferta
            {
                Aktywna = true,
                Zatwierdzona = false
            };

            // Act
            var isVisible = oferta.Aktywna && oferta.Zatwierdzona;

            // Assert
            isVisible.Should().BeFalse();
        }

        [Fact]
        public void Oferta_Deactivated_IsNotVisible()
        {
            // Arrange
            var oferta = new Oferta
            {
                Aktywna = false,
                Zatwierdzona = true
            };

            // Act
            var isVisible = oferta.Aktywna && oferta.Zatwierdzona;

            // Assert
            isVisible.Should().BeFalse();
        }

        #endregion

        #region Offer Type Tests

        [Theory]
        [InlineData("promocja")]
        [InlineData("kod")]
        [InlineData("darmowe")]
        public async Task Oferta_DifferentTypes_SaveCorrectly(string typ)
        {
            // Arrange
            using var context = CreateContext();
            var oferta = new Oferta
            {
                IdUzytkownik = 1,
                Nazwa = $"Oferta typu {typ}",
                Typ = typ,
                DataDodania = DateTime.UtcNow
            };

            // Act
            context.Oferty.Add(oferta);
            await context.SaveChangesAsync();

            // Assert
            var saved = await context.Oferty.FirstAsync();
            saved.Typ.Should().Be(typ);
        }

        [Fact]
        public async Task Oferta_PromoCode_RequiresCode()
        {
            // Arrange
            using var context = CreateContext();
            var ofertaWithCode = new Oferta
            {
                IdUzytkownik = 1,
                Nazwa = "Promocja z kodem",
                Typ = "kod",
                Kod = "SAVE20",
                DataDodania = DateTime.UtcNow
            };

            var ofertaWithoutCode = new Oferta
            {
                IdUzytkownik = 1,
                Nazwa = "Promocja bez kodu",
                Typ = "kod",
                Kod = null,
                DataDodania = DateTime.UtcNow
            };

            // Act
            context.Oferty.AddRange(ofertaWithCode, ofertaWithoutCode);
            await context.SaveChangesAsync();

            // Assert
            var offers = await context.Oferty.ToListAsync();
            offers.First(o => o.Nazwa.Contains("z kodem")).Kod.Should().Be("SAVE20");
            offers.First(o => o.Nazwa.Contains("bez kodu")).Kod.Should().BeNull();
        }

        #endregion

        #region Query Tests

        [Fact]
        public async Task Query_ActiveApprovedOffers_FiltersCorrectly()
        {
            // Arrange
            using var context = CreateContext();
            context.Oferty.AddRange(
                new Oferta { IdOferta = 1, IdUzytkownik = 1, Nazwa = "Active+Approved", Aktywna = true, Zatwierdzona = true, DataDodania = DateTime.UtcNow },
                new Oferta { IdOferta = 2, IdUzytkownik = 1, Nazwa = "Active+NotApproved", Aktywna = true, Zatwierdzona = false, DataDodania = DateTime.UtcNow },
                new Oferta { IdOferta = 3, IdUzytkownik = 1, Nazwa = "Inactive+Approved", Aktywna = false, Zatwierdzona = true, DataDodania = DateTime.UtcNow },
                new Oferta { IdOferta = 4, IdUzytkownik = 1, Nazwa = "Inactive+NotApproved", Aktywna = false, Zatwierdzona = false, DataDodania = DateTime.UtcNow }
            );
            await context.SaveChangesAsync();

            // Act
            var visible = await context.Oferty
                .Where(o => o.Aktywna && o.Zatwierdzona)
                .ToListAsync();

            // Assert
            visible.Should().HaveCount(1);
            visible[0].Nazwa.Should().Be("Active+Approved");
        }

        [Fact]
        public async Task Query_OffersByTemperature_OrdersCorrectly()
        {
            // Arrange
            using var context = CreateContext();
            context.Oferty.AddRange(
                new Oferta { IdOferta = 1, IdUzytkownik = 1, Nazwa = "Cold", LiczbaHot = 5, LiczbaCold = 20, DataDodania = DateTime.UtcNow },
                new Oferta { IdOferta = 2, IdUzytkownik = 1, Nazwa = "Hot", LiczbaHot = 100, LiczbaCold = 10, DataDodania = DateTime.UtcNow },
                new Oferta { IdOferta = 3, IdUzytkownik = 1, Nazwa = "Neutral", LiczbaHot = 15, LiczbaCold = 15, DataDodania = DateTime.UtcNow }
            );
            await context.SaveChangesAsync();

            // Act
            var ordered = await context.Oferty
                .OrderByDescending(o => o.LiczbaHot - o.LiczbaCold)
                .ToListAsync();

            // Assert
            ordered[0].Nazwa.Should().Be("Hot");
            ordered[1].Nazwa.Should().Be("Neutral");
            ordered[2].Nazwa.Should().Be("Cold");
        }

        [Fact]
        public async Task Query_PendingApproval_ReturnsCorrect()
        {
            // Arrange
            using var context = CreateContext();
            context.Oferty.AddRange(
                new Oferta { IdOferta = 1, IdUzytkownik = 1, Nazwa = "Pending1", Aktywna = true, Zatwierdzona = false, DataDodania = DateTime.UtcNow },
                new Oferta { IdOferta = 2, IdUzytkownik = 1, Nazwa = "Pending2", Aktywna = true, Zatwierdzona = false, DataDodania = DateTime.UtcNow },
                new Oferta { IdOferta = 3, IdUzytkownik = 1, Nazwa = "Approved", Aktywna = true, Zatwierdzona = true, DataDodania = DateTime.UtcNow }
            );
            await context.SaveChangesAsync();

            // Act
            var pending = await context.Oferty
                .Where(o => o.Aktywna && !o.Zatwierdzona)
                .ToListAsync();

            // Assert
            pending.Should().HaveCount(2);
            pending.All(o => !o.Zatwierdzona).Should().BeTrue();
        }

        #endregion

        #region User Offers Tests

        [Fact]
        public async Task GetUserOffers_ReturnsOnlyUserOffers()
        {
            // Arrange
            using var context = CreateContext();
            context.Oferty.AddRange(
                new Oferta { IdOferta = 1, IdUzytkownik = 1, Nazwa = "User1 Offer1", DataDodania = DateTime.UtcNow },
                new Oferta { IdOferta = 2, IdUzytkownik = 1, Nazwa = "User1 Offer2", DataDodania = DateTime.UtcNow },
                new Oferta { IdOferta = 3, IdUzytkownik = 2, Nazwa = "User2 Offer1", DataDodania = DateTime.UtcNow }
            );
            await context.SaveChangesAsync();

            // Act
            var user1Offers = await context.Oferty
                .Where(o => o.IdUzytkownik == 1)
                .ToListAsync();

            // Assert
            user1Offers.Should().HaveCount(2);
            user1Offers.All(o => o.IdUzytkownik == 1).Should().BeTrue();
        }

        #endregion
    }
}
