using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Data;
using TechPromo.Api.Model;
using TechPromo.Api.Services;
using Xunit;

namespace TechPromo.Testy.Jednostkowe
{
    /// <summary>
    /// Tests for badge/achievement system service.
    /// Verifies badge assignment logic based on user activity.
    /// Note: BadgeService searches badges by Nazwa or Opis containing badge code.
    /// </summary>
    public class TestBadgeService
    {
        private TechPromoDbContext CreateContext()
        {
            var options = new DbContextOptionsBuilder<TechPromoDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new TechPromoDbContext(options);
        }

        [Fact]
        public async Task EvaluateForUser_FirstDeal_AssignsBadge()
        {
            // Arrange
            using var context = CreateContext();
            var service = new BadgeService(context);

            var user = new Uzytkownik { Id = 1, UserName = "user1", DataRejestracji = DateTime.UtcNow };
            // BadgeService looks for badge by Nazwa == "first_deal" or Opis == "first_deal"
            var odznaka = new Odznaka { IdOdznaka = 1, Nazwa = "first_deal", Opis = "Pierwsza oferta", Ikona = "🎉" };
            
            context.Users.Add(user);
            context.Odznaki.Add(odznaka);

            var oferta = new Oferta 
            { 
                IdOferta = 1, 
                IdUzytkownik = 1, 
                Nazwa = "Testowa oferta",
                Aktywna = true,
                Zatwierdzona = true,
                DataDodania = DateTime.UtcNow
            };
            context.Oferty.Add(oferta);
            await context.SaveChangesAsync();

            // Act
            await service.EvaluateForUserAsync(user.Id);

            // Assert
            var przyznane = await context.UzytkownikOdznaki
                .FirstOrDefaultAsync(uo => uo.IdUzytkownik == user.Id && uo.IdOdznaka == odznaka.IdOdznaka);
            przyznane.Should().NotBeNull();
        }

        [Fact]
        public async Task EvaluateForUser_FiveDeals_AssignsBadge()
        {
            // Arrange
            using var context = CreateContext();
            var service = new BadgeService(context);

            var user = new Uzytkownik { Id = 1, UserName = "user1", DataRejestracji = DateTime.UtcNow };
            var odznaka = new Odznaka { IdOdznaka = 1, Nazwa = "deals_5", Opis = "5 ofert", Ikona = "⭐" };
            
            context.Users.Add(user);
            context.Odznaki.Add(odznaka);

            // Add 5 approved offers
            for (int i = 1; i <= 5; i++)
            {
                context.Oferty.Add(new Oferta 
                { 
                    IdOferta = i, 
                    IdUzytkownik = 1, 
                    Nazwa = $"Oferta {i}",
                    Aktywna = true,
                    Zatwierdzona = true,
                    DataDodania = DateTime.UtcNow
                });
            }
            await context.SaveChangesAsync();

            // Act
            await service.EvaluateForUserAsync(user.Id);

            // Assert
            var przyznane = await context.UzytkownikOdznaki
                .FirstOrDefaultAsync(uo => uo.IdUzytkownik == user.Id && uo.IdOdznaka == odznaka.IdOdznaka);
            przyznane.Should().NotBeNull();
        }

        [Fact]
        public async Task EvaluateForUser_FirstVote_AssignsBadge()
        {
            // Arrange
            using var context = CreateContext();
            var service = new BadgeService(context);

            var user = new Uzytkownik { Id = 1, UserName = "user1", DataRejestracji = DateTime.UtcNow };
            var otherUser = new Uzytkownik { Id = 2, UserName = "other", DataRejestracji = DateTime.UtcNow };
            var odznaka = new Odznaka { IdOdznaka = 1, Nazwa = "first_vote", Opis = "Pierwszy głos", Ikona = "👍" };
            
            context.Users.Add(user);
            context.Users.Add(otherUser);
            context.Odznaki.Add(odznaka);

            var oferta = new Oferta { IdOferta = 1, IdUzytkownik = 2, Nazwa = "Inna oferta", DataDodania = DateTime.UtcNow };
            context.Oferty.Add(oferta);

            var glos = new Glos { IdGlos = 1, IdUzytkownik = 1, IdOferta = 1, TypGlosu = "hot", DataGlosu = DateTime.UtcNow };
            context.Glosy.Add(glos);
            await context.SaveChangesAsync();

            // Act
            await service.EvaluateForUserAsync(user.Id);

            // Assert
            var przyznane = await context.UzytkownikOdznaki
                .FirstOrDefaultAsync(uo => uo.IdUzytkownik == user.Id && uo.IdOdznaka == odznaka.IdOdznaka);
            przyznane.Should().NotBeNull();
        }

        [Fact]
        public async Task EvaluateForUser_Hot50_AssignsBadge()
        {
            // Arrange
            using var context = CreateContext();
            var service = new BadgeService(context);

            var user = new Uzytkownik { Id = 1, UserName = "user1", DataRejestracji = DateTime.UtcNow };
            var odznaka = new Odznaka { IdOdznaka = 1, Nazwa = "hot_50", Opis = "Gorąca oferta", Ikona = "🔥" };
            
            context.Users.Add(user);
            context.Odznaki.Add(odznaka);

            // Offer with temp >= 50 (LiczbaHot - LiczbaCold >= 50)
            var oferta = new Oferta 
            { 
                IdOferta = 1, 
                IdUzytkownik = 1, 
                Nazwa = "Super oferta",
                LiczbaHot = 60,
                LiczbaCold = 5,
                Aktywna = true,
                Zatwierdzona = true,
                DataDodania = DateTime.UtcNow
            };
            context.Oferty.Add(oferta);
            await context.SaveChangesAsync();

            // Act
            await service.EvaluateForUserAsync(user.Id);

            // Assert
            var przyznane = await context.UzytkownikOdznaki
                .FirstOrDefaultAsync(uo => uo.IdUzytkownik == user.Id && uo.IdOdznaka == odznaka.IdOdznaka);
            przyznane.Should().NotBeNull();
        }

        [Fact]
        public async Task EvaluateForUser_Comments10_AssignsBadge()
        {
            // Arrange
            using var context = CreateContext();
            var service = new BadgeService(context);

            var user = new Uzytkownik { Id = 1, UserName = "user1", DataRejestracji = DateTime.UtcNow };
            var otherUser = new Uzytkownik { Id = 2, UserName = "other", DataRejestracji = DateTime.UtcNow };
            var odznaka = new Odznaka { IdOdznaka = 1, Nazwa = "comments_10", Opis = "Komentator", Ikona = "💬" };
            
            context.Users.Add(user);
            context.Users.Add(otherUser);
            context.Odznaki.Add(odznaka);

            var oferta = new Oferta { IdOferta = 1, IdUzytkownik = 2, Nazwa = "Oferta", DataDodania = DateTime.UtcNow };
            context.Oferty.Add(oferta);

            // Add 10 comments (min 3 characters required by service)
            for (int i = 1; i <= 10; i++)
            {
                context.Komentarze.Add(new Komentarz 
                { 
                    IdKomentarz = i, 
                    IdUzytkownik = 1, 
                    IdOferta = 1, 
                    Tresc = $"Komentarz numer {i}",
                    DataDodania = DateTime.UtcNow
                });
            }
            await context.SaveChangesAsync();

            // Act
            await service.EvaluateForUserAsync(user.Id);

            // Assert
            var przyznane = await context.UzytkownikOdznaki
                .FirstOrDefaultAsync(uo => uo.IdUzytkownik == user.Id && uo.IdOdznaka == odznaka.IdOdznaka);
            przyznane.Should().NotBeNull();
        }

        [Fact]
        public async Task EvaluateForUser_NoCriteriaMet_NoBadgesAssigned()
        {
            // Arrange
            using var context = CreateContext();
            var service = new BadgeService(context);

            var user = new Uzytkownik { Id = 1, UserName = "newuser", DataRejestracji = DateTime.UtcNow };
            var odznaka = new Odznaka { IdOdznaka = 1, Nazwa = "first_deal", Opis = "Pierwsza oferta", Ikona = "🎉" };
            
            context.Users.Add(user);
            context.Odznaki.Add(odznaka);
            await context.SaveChangesAsync();

            // Act - user has no offers, comments, votes
            await service.EvaluateForUserAsync(user.Id);

            // Assert
            var przyznane = await context.UzytkownikOdznaki.AnyAsync(uo => uo.IdUzytkownik == user.Id);
            przyznane.Should().BeFalse();
        }

        [Fact]
        public async Task EvaluateForUser_AlreadyHasBadge_DoesNotDuplicate()
        {
            // Arrange
            using var context = CreateContext();
            var service = new BadgeService(context);

            var user = new Uzytkownik { Id = 1, UserName = "user1", DataRejestracji = DateTime.UtcNow };
            var odznaka = new Odznaka { IdOdznaka = 1, Nazwa = "first_deal", Opis = "Pierwsza oferta", Ikona = "🎉" };
            
            context.Users.Add(user);
            context.Odznaki.Add(odznaka);

            var oferta = new Oferta 
            { 
                IdOferta = 1, 
                IdUzytkownik = 1, 
                Nazwa = "Testowa oferta",
                Aktywna = true,
                Zatwierdzona = true,
                DataDodania = DateTime.UtcNow
            };
            context.Oferty.Add(oferta);

            // Already assigned badge
            context.UzytkownikOdznaki.Add(new UzytkownikOdznaka 
            { 
                IdUzytkownik = 1, 
                IdOdznaka = 1, 
                DataPrzyznania = DateTime.UtcNow.AddDays(-1) 
            });
            await context.SaveChangesAsync();

            // Act
            await service.EvaluateForUserAsync(user.Id);

            // Assert
            var count = await context.UzytkownikOdznaki
                .CountAsync(uo => uo.IdUzytkownik == user.Id && uo.IdOdznaka == odznaka.IdOdznaka);
            count.Should().Be(1); // Should not duplicate
        }

        [Fact]
        public async Task EvaluateForUser_InactiveOffer_DoesNotCountForBadge()
        {
            // Arrange
            using var context = CreateContext();
            var service = new BadgeService(context);

            var user = new Uzytkownik { Id = 1, UserName = "user1", DataRejestracji = DateTime.UtcNow };
            var odznaka = new Odznaka { IdOdznaka = 1, Nazwa = "first_deal", Opis = "Pierwsza oferta", Ikona = "🎉" };
            
            context.Users.Add(user);
            context.Odznaki.Add(odznaka);

            // Inactive offer should not count
            var oferta = new Oferta 
            { 
                IdOferta = 1, 
                IdUzytkownik = 1, 
                Nazwa = "Nieaktywna oferta",
                Aktywna = false,  // inactive
                Zatwierdzona = true,
                DataDodania = DateTime.UtcNow
            };
            context.Oferty.Add(oferta);
            await context.SaveChangesAsync();

            // Act
            await service.EvaluateForUserAsync(user.Id);

            // Assert
            var przyznane = await context.UzytkownikOdznaki.AnyAsync(uo => uo.IdUzytkownik == user.Id);
            przyznane.Should().BeFalse();
        }

        [Fact]
        public async Task EvaluateForUser_NotApprovedOffer_DoesNotCountForBadge()
        {
            // Arrange
            using var context = CreateContext();
            var service = new BadgeService(context);

            var user = new Uzytkownik { Id = 1, UserName = "user1", DataRejestracji = DateTime.UtcNow };
            var odznaka = new Odznaka { IdOdznaka = 1, Nazwa = "first_deal", Opis = "Pierwsza oferta", Ikona = "🎉" };
            
            context.Users.Add(user);
            context.Odznaki.Add(odznaka);

            // Unapproved offer should not count
            var oferta = new Oferta 
            { 
                IdOferta = 1, 
                IdUzytkownik = 1, 
                Nazwa = "Niezatwierdzona oferta",
                Aktywna = true,
                Zatwierdzona = false,  // not approved
                DataDodania = DateTime.UtcNow
            };
            context.Oferty.Add(oferta);
            await context.SaveChangesAsync();

            // Act
            await service.EvaluateForUserAsync(user.Id);

            // Assert
            var przyznane = await context.UzytkownikOdznaki.AnyAsync(uo => uo.IdUzytkownik == user.Id);
            przyznane.Should().BeFalse();
        }
    }
}
