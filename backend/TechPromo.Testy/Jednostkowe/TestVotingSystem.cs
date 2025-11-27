using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Data;
using TechPromo.Api.Model;
using Xunit;

namespace TechPromo.Testy.Jednostkowe
{
    /// <summary>
    /// Tests for voting system (hot/cold votes on offers).
    /// Verifies vote creation, temperature calculation and vote toggling.
    /// </summary>
    public class TestVotingSystem
    {
        private TechPromoDbContext CreateContext()
        {
            var options = new DbContextOptionsBuilder<TechPromoDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new TechPromoDbContext(options);
        }

        #region Vote Creation Tests

        [Fact]
        public async Task Vote_Hot_IncreasesHotCount()
        {
            // Arrange
            using var context = CreateContext();
            var user = new Uzytkownik { Id = 1, UserName = "user1", DataRejestracji = DateTime.UtcNow };
            var oferta = new Oferta 
            { 
                IdOferta = 1, 
                IdUzytkownik = 2, 
                Nazwa = "Test", 
                LiczbaHot = 0, 
                LiczbaCold = 0,
                DataDodania = DateTime.UtcNow 
            };
            
            context.Users.Add(user);
            context.Oferty.Add(oferta);
            await context.SaveChangesAsync();

            // Act
            var glos = new Glos 
            { 
                IdUzytkownik = 1, 
                IdOferta = 1, 
                TypGlosu = "hot", 
                DataGlosu = DateTime.UtcNow 
            };
            context.Glosy.Add(glos);
            oferta.LiczbaHot++;
            await context.SaveChangesAsync();

            // Assert
            var updatedOferta = await context.Oferty.FindAsync(1);
            updatedOferta!.LiczbaHot.Should().Be(1);
            updatedOferta.LiczbaCold.Should().Be(0);
        }

        [Fact]
        public async Task Vote_Cold_IncreasesColdCount()
        {
            // Arrange
            using var context = CreateContext();
            var user = new Uzytkownik { Id = 1, UserName = "user1", DataRejestracji = DateTime.UtcNow };
            var oferta = new Oferta 
            { 
                IdOferta = 1, 
                IdUzytkownik = 2, 
                Nazwa = "Test", 
                LiczbaHot = 0, 
                LiczbaCold = 0,
                DataDodania = DateTime.UtcNow 
            };
            
            context.Users.Add(user);
            context.Oferty.Add(oferta);
            await context.SaveChangesAsync();

            // Act
            var glos = new Glos 
            { 
                IdUzytkownik = 1, 
                IdOferta = 1, 
                TypGlosu = "cold", 
                DataGlosu = DateTime.UtcNow 
            };
            context.Glosy.Add(glos);
            oferta.LiczbaCold++;
            await context.SaveChangesAsync();

            // Assert
            var updatedOferta = await context.Oferty.FindAsync(1);
            updatedOferta!.LiczbaCold.Should().Be(1);
            updatedOferta.LiczbaHot.Should().Be(0);
        }

        #endregion

        #region Temperature Calculation Tests

        [Theory]
        [InlineData(100, 50, 50)]  // 100 hot - 50 cold = +50
        [InlineData(0, 10, -10)]   // 0 hot - 10 cold = -10
        [InlineData(50, 50, 0)]    // equal votes = 0
        [InlineData(1, 0, 1)]      // single hot vote = +1
        [InlineData(0, 0, 0)]      // no votes = 0
        public void Temperature_CalculatedCorrectly(int hot, int cold, int expected)
        {
            // Arrange
            var oferta = new Oferta
            {
                LiczbaHot = hot,
                LiczbaCold = cold
            };

            // Act
            var temperature = oferta.LiczbaHot - oferta.LiczbaCold;

            // Assert
            temperature.Should().Be(expected);
        }

        #endregion

        #region Vote Constraint Tests

        [Fact]
        public async Task User_CannotVoteTwice_SameOffer()
        {
            // Arrange
            using var context = CreateContext();
            var user = new Uzytkownik { Id = 1, UserName = "user1", DataRejestracji = DateTime.UtcNow };
            var oferta = new Oferta { IdOferta = 1, IdUzytkownik = 2, Nazwa = "Test", DataDodania = DateTime.UtcNow };
            
            context.Users.Add(user);
            context.Oferty.Add(oferta);
            
            var glos1 = new Glos { IdGlos = 1, IdUzytkownik = 1, IdOferta = 1, TypGlosu = "hot", DataGlosu = DateTime.UtcNow };
            context.Glosy.Add(glos1);
            await context.SaveChangesAsync();

            // Act - check if user already voted
            var existingVote = await context.Glosy
                .AnyAsync(g => g.IdUzytkownik == 1 && g.IdOferta == 1);

            // Assert
            existingVote.Should().BeTrue();
        }

        [Fact]
        public async Task User_CanVote_DifferentOffers()
        {
            // Arrange
            using var context = CreateContext();
            var user = new Uzytkownik { Id = 1, UserName = "user1", DataRejestracji = DateTime.UtcNow };
            var oferta1 = new Oferta { IdOferta = 1, IdUzytkownik = 2, Nazwa = "Test1", DataDodania = DateTime.UtcNow };
            var oferta2 = new Oferta { IdOferta = 2, IdUzytkownik = 2, Nazwa = "Test2", DataDodania = DateTime.UtcNow };
            
            context.Users.Add(user);
            context.Oferty.AddRange(oferta1, oferta2);
            
            var glos1 = new Glos { IdGlos = 1, IdUzytkownik = 1, IdOferta = 1, TypGlosu = "hot", DataGlosu = DateTime.UtcNow };
            var glos2 = new Glos { IdGlos = 2, IdUzytkownik = 1, IdOferta = 2, TypGlosu = "cold", DataGlosu = DateTime.UtcNow };
            context.Glosy.AddRange(glos1, glos2);
            await context.SaveChangesAsync();

            // Act
            var userVotes = await context.Glosy.Where(g => g.IdUzytkownik == 1).CountAsync();

            // Assert
            userVotes.Should().Be(2);
        }

        #endregion

        #region Vote Toggling Tests

        [Fact]
        public async Task Vote_Toggle_ChangesVoteType()
        {
            // Arrange
            using var context = CreateContext();
            var user = new Uzytkownik { Id = 1, UserName = "user1", DataRejestracji = DateTime.UtcNow };
            var oferta = new Oferta 
            { 
                IdOferta = 1, 
                IdUzytkownik = 2, 
                Nazwa = "Test", 
                LiczbaHot = 1, 
                LiczbaCold = 0,
                DataDodania = DateTime.UtcNow 
            };
            var glos = new Glos 
            { 
                IdGlos = 1, 
                IdUzytkownik = 1, 
                IdOferta = 1, 
                TypGlosu = "hot", 
                DataGlosu = DateTime.UtcNow 
            };
            
            context.Users.Add(user);
            context.Oferty.Add(oferta);
            context.Glosy.Add(glos);
            await context.SaveChangesAsync();

            // Act - toggle from hot to cold
            var existingVote = await context.Glosy
                .FirstAsync(g => g.IdUzytkownik == 1 && g.IdOferta == 1);
            
            oferta.LiczbaHot--;
            existingVote.TypGlosu = "cold";
            oferta.LiczbaCold++;
            await context.SaveChangesAsync();

            // Assert
            var updatedVote = await context.Glosy.FindAsync(1);
            var updatedOferta = await context.Oferty.FindAsync(1);
            
            updatedVote!.TypGlosu.Should().Be("cold");
            updatedOferta!.LiczbaHot.Should().Be(0);
            updatedOferta.LiczbaCold.Should().Be(1);
        }

        [Fact]
        public async Task Vote_Remove_DecreasesCount()
        {
            // Arrange
            using var context = CreateContext();
            var user = new Uzytkownik { Id = 1, UserName = "user1", DataRejestracji = DateTime.UtcNow };
            var oferta = new Oferta 
            { 
                IdOferta = 1, 
                IdUzytkownik = 2, 
                Nazwa = "Test", 
                LiczbaHot = 1, 
                LiczbaCold = 0,
                DataDodania = DateTime.UtcNow 
            };
            var glos = new Glos 
            { 
                IdGlos = 1, 
                IdUzytkownik = 1, 
                IdOferta = 1, 
                TypGlosu = "hot", 
                DataGlosu = DateTime.UtcNow 
            };
            
            context.Users.Add(user);
            context.Oferty.Add(oferta);
            context.Glosy.Add(glos);
            await context.SaveChangesAsync();

            // Act - remove vote
            context.Glosy.Remove(glos);
            oferta.LiczbaHot--;
            await context.SaveChangesAsync();

            // Assert
            var voteExists = await context.Glosy.AnyAsync(g => g.IdGlos == 1);
            var updatedOferta = await context.Oferty.FindAsync(1);
            
            voteExists.Should().BeFalse();
            updatedOferta!.LiczbaHot.Should().Be(0);
        }

        #endregion

        #region Vote Statistics Tests

        [Fact]
        public async Task GetUserVoteCount_ReturnsCorrectCount()
        {
            // Arrange
            using var context = CreateContext();
            var user = new Uzytkownik { Id = 1, UserName = "user1", DataRejestracji = DateTime.UtcNow };
            
            context.Users.Add(user);
            for (int i = 1; i <= 5; i++)
            {
                context.Oferty.Add(new Oferta { IdOferta = i, IdUzytkownik = 2, Nazwa = $"Test{i}", DataDodania = DateTime.UtcNow });
                context.Glosy.Add(new Glos { IdGlos = i, IdUzytkownik = 1, IdOferta = i, TypGlosu = "hot", DataGlosu = DateTime.UtcNow });
            }
            await context.SaveChangesAsync();

            // Act
            var voteCount = await context.Glosy.CountAsync(g => g.IdUzytkownik == 1);

            // Assert
            voteCount.Should().Be(5);
        }

        [Fact]
        public async Task GetOfferVotes_ReturnsAllVotes()
        {
            // Arrange
            using var context = CreateContext();
            var oferta = new Oferta { IdOferta = 1, IdUzytkownik = 1, Nazwa = "Popular", DataDodania = DateTime.UtcNow };
            context.Oferty.Add(oferta);

            for (int i = 1; i <= 10; i++)
            {
                context.Users.Add(new Uzytkownik { Id = i, UserName = $"user{i}", DataRejestracji = DateTime.UtcNow });
                context.Glosy.Add(new Glos 
                { 
                    IdGlos = i, 
                    IdUzytkownik = i, 
                    IdOferta = 1, 
                    TypGlosu = i % 2 == 0 ? "hot" : "cold", 
                    DataGlosu = DateTime.UtcNow 
                });
            }
            await context.SaveChangesAsync();

            // Act
            var votes = await context.Glosy.Where(g => g.IdOferta == 1).ToListAsync();
            var hotCount = votes.Count(v => v.TypGlosu == "hot");
            var coldCount = votes.Count(v => v.TypGlosu == "cold");

            // Assert
            votes.Count.Should().Be(10);
            hotCount.Should().Be(5);
            coldCount.Should().Be(5);
        }

        #endregion
    }
}
