using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Data;
using TechPromo.Api.Model;
using Xunit;

namespace TechPromo.Testy.Jednostkowe
{
    /// <summary>
    /// Tests for Uzytkownik (User) model and user-related functionality.
    /// Verifies user creation, points system, and activity tracking.
    /// </summary>
    public class TestUzytkownikModel
    {
        private TechPromoDbContext CreateContext()
        {
            var options = new DbContextOptionsBuilder<TechPromoDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new TechPromoDbContext(options);
        }

        #region User Creation Tests

        [Fact]
        public async Task Uzytkownik_Create_SavesCorrectly()
        {
            // Arrange
            using var context = CreateContext();
            var user = new Uzytkownik
            {
                UserName = "testuser",
                Email = "test@example.com",
                Punkty = 0,
                DataRejestracji = DateTime.UtcNow
            };

            // Act
            context.Users.Add(user);
            await context.SaveChangesAsync();

            // Assert
            var saved = await context.Users.FirstAsync();
            saved.UserName.Should().Be("testuser");
            saved.Email.Should().Be("test@example.com");
            saved.Punkty.Should().Be(0);
        }

        [Fact]
        public async Task Uzytkownik_WithInitialPoints_SavesCorrectly()
        {
            // Arrange
            using var context = CreateContext();
            var user = new Uzytkownik
            {
                UserName = "newuser",
                Email = "new@example.com",
                Punkty = 100, // Starting bonus
                DataRejestracji = DateTime.UtcNow
            };

            // Act
            context.Users.Add(user);
            await context.SaveChangesAsync();

            // Assert
            var saved = await context.Users.FirstAsync();
            saved.Punkty.Should().Be(100);
        }

        #endregion

        #region Points System Tests

        [Fact]
        public async Task Points_AddPoints_IncreasesTotal()
        {
            // Arrange
            using var context = CreateContext();
            var user = new Uzytkownik
            {
                Id = 1,
                UserName = "user1",
                Punkty = 50,
                DataRejestracji = DateTime.UtcNow
            };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            // Act
            user.Punkty += 25;
            await context.SaveChangesAsync();

            // Assert
            var updated = await context.Users.FindAsync(1);
            updated!.Punkty.Should().Be(75);
        }

        [Fact]
        public async Task Points_SubtractPoints_DecreasesTotal()
        {
            // Arrange
            using var context = CreateContext();
            var user = new Uzytkownik
            {
                Id = 1,
                UserName = "user1",
                Punkty = 100,
                DataRejestracji = DateTime.UtcNow
            };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            // Act
            user.Punkty -= 30;
            await context.SaveChangesAsync();

            // Assert
            var updated = await context.Users.FindAsync(1);
            updated!.Punkty.Should().Be(70);
        }

        [Theory]
        [InlineData(10)]  // add offer
        [InlineData(5)]   // comment
        [InlineData(1)]   // vote
        [InlineData(50)]  // featured offer
        public async Task Points_DifferentActions_AddCorrectAmount(int pointsToAdd)
        {
            // Arrange
            using var context = CreateContext();
            var user = new Uzytkownik
            {
                Id = 1,
                UserName = "user1",
                Punkty = 0,
                DataRejestracji = DateTime.UtcNow
            };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            // Act
            user.Punkty += pointsToAdd;
            await context.SaveChangesAsync();

            // Assert
            var updated = await context.Users.FindAsync(1);
            updated!.Punkty.Should().Be(pointsToAdd);
        }

        #endregion

        #region User Activity Statistics Tests

        [Fact]
        public async Task UserStats_OfferCount_ReturnsCorrect()
        {
            // Arrange
            using var context = CreateContext();
            var user = new Uzytkownik { Id = 1, UserName = "user1", DataRejestracji = DateTime.UtcNow };
            context.Users.Add(user);

            for (int i = 1; i <= 5; i++)
            {
                context.Oferty.Add(new Oferta
                {
                    IdOferta = i,
                    IdUzytkownik = 1,
                    Nazwa = $"Offer {i}",
                    Aktywna = true,
                    DataDodania = DateTime.UtcNow
                });
            }
            await context.SaveChangesAsync();

            // Act
            var offerCount = await context.Oferty.CountAsync(o => o.IdUzytkownik == 1);

            // Assert
            offerCount.Should().Be(5);
        }

        [Fact]
        public async Task UserStats_CommentCount_ReturnsCorrect()
        {
            // Arrange
            using var context = CreateContext();
            var user = new Uzytkownik { Id = 1, UserName = "user1", DataRejestracji = DateTime.UtcNow };
            var oferta = new Oferta { IdOferta = 1, IdUzytkownik = 2, Nazwa = "Test", DataDodania = DateTime.UtcNow };
            
            context.Users.Add(user);
            context.Oferty.Add(oferta);

            for (int i = 1; i <= 8; i++)
            {
                context.Komentarze.Add(new Komentarz
                {
                    IdKomentarz = i,
                    IdUzytkownik = 1,
                    IdOferta = 1,
                    Tresc = $"Comment {i}",
                    DataDodania = DateTime.UtcNow
                });
            }
            await context.SaveChangesAsync();

            // Act
            var commentCount = await context.Komentarze.CountAsync(k => k.IdUzytkownik == 1);

            // Assert
            commentCount.Should().Be(8);
        }

        [Fact]
        public async Task UserStats_VoteCount_ReturnsCorrect()
        {
            // Arrange
            using var context = CreateContext();
            var user = new Uzytkownik { Id = 1, UserName = "user1", DataRejestracji = DateTime.UtcNow };
            context.Users.Add(user);

            for (int i = 1; i <= 3; i++)
            {
                context.Oferty.Add(new Oferta { IdOferta = i, IdUzytkownik = 2, Nazwa = $"Offer {i}", DataDodania = DateTime.UtcNow });
                context.Glosy.Add(new Glos
                {
                    IdGlos = i,
                    IdUzytkownik = 1,
                    IdOferta = i,
                    TypGlosu = "hot",
                    DataGlosu = DateTime.UtcNow
                });
            }
            await context.SaveChangesAsync();

            // Act
            var voteCount = await context.Glosy.CountAsync(g => g.IdUzytkownik == 1);

            // Assert
            voteCount.Should().Be(3);
        }

        #endregion

        #region Registration Date Tests

        [Fact]
        public async Task RegistrationDate_SetCorrectly()
        {
            // Arrange
            using var context = CreateContext();
            var registrationDate = DateTime.UtcNow;
            var user = new Uzytkownik
            {
                UserName = "newuser",
                DataRejestracji = registrationDate
            };

            // Act
            context.Users.Add(user);
            await context.SaveChangesAsync();

            // Assert
            var saved = await context.Users.FirstAsync();
            saved.DataRejestracji.Should().BeCloseTo(registrationDate, TimeSpan.FromSeconds(1));
        }

        [Fact]
        public void AccountAge_CalculatedCorrectly()
        {
            // Arrange
            var registrationDate = DateTime.UtcNow.AddDays(-30);
            var user = new Uzytkownik
            {
                DataRejestracji = registrationDate
            };

            // Act
            var accountAge = DateTime.UtcNow - user.DataRejestracji;

            // Assert
            accountAge.Days.Should().BeGreaterThanOrEqualTo(30);
        }

        #endregion

        #region User Ranking Tests

        [Fact]
        public async Task UserRanking_ByPoints_OrdersCorrectly()
        {
            // Arrange
            using var context = CreateContext();
            context.Users.AddRange(
                new Uzytkownik { Id = 1, UserName = "low", Punkty = 10, DataRejestracji = DateTime.UtcNow },
                new Uzytkownik { Id = 2, UserName = "high", Punkty = 1000, DataRejestracji = DateTime.UtcNow },
                new Uzytkownik { Id = 3, UserName = "medium", Punkty = 500, DataRejestracji = DateTime.UtcNow }
            );
            await context.SaveChangesAsync();

            // Act
            var ranking = await context.Users
                .OrderByDescending(u => u.Punkty)
                .ToListAsync();

            // Assert
            ranking[0].UserName.Should().Be("high");
            ranking[1].UserName.Should().Be("medium");
            ranking[2].UserName.Should().Be("low");
        }

        [Fact]
        public async Task TopUsers_ReturnsLimitedResults()
        {
            // Arrange
            using var context = CreateContext();
            for (int i = 1; i <= 20; i++)
            {
                context.Users.Add(new Uzytkownik
                {
                    Id = i,
                    UserName = $"user{i}",
                    Punkty = i * 10,
                    DataRejestracji = DateTime.UtcNow
                });
            }
            await context.SaveChangesAsync();

            // Act
            var top10 = await context.Users
                .OrderByDescending(u => u.Punkty)
                .Take(10)
                .ToListAsync();

            // Assert
            top10.Should().HaveCount(10);
            top10.First().Punkty.Should().Be(200);
            top10.Last().Punkty.Should().Be(110);
        }

        #endregion

        #region Badge Assignment Tests

        [Fact]
        public async Task UserBadges_AssignedCorrectly()
        {
            // Arrange
            using var context = CreateContext();
            var user = new Uzytkownik { Id = 1, UserName = "user1", DataRejestracji = DateTime.UtcNow };
            var badge1 = new Odznaka { IdOdznaka = 1, Nazwa = "first_deal", Opis = "First offer", Ikona = "🏆" };
            var badge2 = new Odznaka { IdOdznaka = 2, Nazwa = "first_vote", Opis = "First vote", Ikona = "⭐" };
            
            context.Users.Add(user);
            context.Odznaki.AddRange(badge1, badge2);

            context.UzytkownikOdznaki.AddRange(
                new UzytkownikOdznaka { IdUzytkownik = 1, IdOdznaka = 1, DataPrzyznania = DateTime.UtcNow },
                new UzytkownikOdznaka { IdUzytkownik = 1, IdOdznaka = 2, DataPrzyznania = DateTime.UtcNow }
            );
            await context.SaveChangesAsync();

            // Act
            var userBadges = await context.UzytkownikOdznaki
                .Where(uo => uo.IdUzytkownik == 1)
                .ToListAsync();

            // Assert
            userBadges.Should().HaveCount(2);
        }

        [Fact]
        public async Task UserBadges_OrderedByDate()
        {
            // Arrange
            using var context = CreateContext();
            var user = new Uzytkownik { Id = 1, UserName = "user1", DataRejestracji = DateTime.UtcNow };
            var badge1 = new Odznaka { IdOdznaka = 1, Nazwa = "badge1", Opis = "Badge 1", Ikona = "🥇" };
            var badge2 = new Odznaka { IdOdznaka = 2, Nazwa = "badge2", Opis = "Badge 2", Ikona = "🥈" };
            
            context.Users.Add(user);
            context.Odznaki.AddRange(badge1, badge2);

            context.UzytkownikOdznaki.AddRange(
                new UzytkownikOdznaka { IdUzytkownik = 1, IdOdznaka = 1, DataPrzyznania = DateTime.UtcNow.AddDays(-7) },
                new UzytkownikOdznaka { IdUzytkownik = 1, IdOdznaka = 2, DataPrzyznania = DateTime.UtcNow }
            );
            await context.SaveChangesAsync();

            // Act
            var userBadges = await context.UzytkownikOdznaki
                .Where(uo => uo.IdUzytkownik == 1)
                .OrderByDescending(uo => uo.DataPrzyznania)
                .ToListAsync();

            // Assert
            userBadges[0].IdOdznaka.Should().Be(2); // Most recent
            userBadges[1].IdOdznaka.Should().Be(1);
        }

        #endregion
    }
}
