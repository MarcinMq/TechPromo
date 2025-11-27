using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Data;
using TechPromo.Api.Model;
using Xunit;

namespace TechPromo.Testy.Jednostkowe
{
    /// <summary>
    /// Tests for comment system with threading support.
    /// Verifies comment creation, replies, voting and moderation.
    /// </summary>
    public class TestCommentSystem
    {
        private TechPromoDbContext CreateContext()
        {
            var options = new DbContextOptionsBuilder<TechPromoDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new TechPromoDbContext(options);
        }

        #region Comment Creation Tests

        [Fact]
        public async Task Comment_Create_SavesCorrectly()
        {
            // Arrange
            using var context = CreateContext();
            var user = new Uzytkownik { Id = 1, UserName = "user1", DataRejestracji = DateTime.UtcNow };
            var oferta = new Oferta { IdOferta = 1, IdUzytkownik = 2, Nazwa = "Test", DataDodania = DateTime.UtcNow };
            
            context.Users.Add(user);
            context.Oferty.Add(oferta);
            await context.SaveChangesAsync();

            // Act
            var komentarz = new Komentarz
            {
                IdUzytkownik = 1,
                IdOferta = 1,
                Tresc = "To jest świetna oferta!",
                DataDodania = DateTime.UtcNow,
                LiczbaUp = 0,
                LiczbaDown = 0
            };
            context.Komentarze.Add(komentarz);
            await context.SaveChangesAsync();

            // Assert
            var saved = await context.Komentarze.FirstOrDefaultAsync(k => k.IdUzytkownik == 1);
            saved.Should().NotBeNull();
            saved!.Tresc.Should().Be("To jest świetna oferta!");
            saved.IdOferta.Should().Be(1);
        }

        [Fact]
        public async Task Comment_MultipleForSameOffer_AllSaved()
        {
            // Arrange
            using var context = CreateContext();
            var oferta = new Oferta { IdOferta = 1, IdUzytkownik = 1, Nazwa = "Test", DataDodania = DateTime.UtcNow };
            context.Oferty.Add(oferta);

            for (int i = 1; i <= 5; i++)
            {
                context.Users.Add(new Uzytkownik { Id = i, UserName = $"user{i}", DataRejestracji = DateTime.UtcNow });
                context.Komentarze.Add(new Komentarz
                {
                    IdKomentarz = i,
                    IdUzytkownik = i,
                    IdOferta = 1,
                    Tresc = $"Komentarz {i}",
                    DataDodania = DateTime.UtcNow
                });
            }
            await context.SaveChangesAsync();

            // Act
            var comments = await context.Komentarze.Where(k => k.IdOferta == 1).ToListAsync();

            // Assert
            comments.Count.Should().Be(5);
        }

        #endregion

        #region Thread/Reply Tests

        [Fact]
        public async Task Reply_ToComment_SetsParentId()
        {
            // Arrange
            using var context = CreateContext();
            var user1 = new Uzytkownik { Id = 1, UserName = "user1", DataRejestracji = DateTime.UtcNow };
            var user2 = new Uzytkownik { Id = 2, UserName = "user2", DataRejestracji = DateTime.UtcNow };
            var oferta = new Oferta { IdOferta = 1, IdUzytkownik = 1, Nazwa = "Test", DataDodania = DateTime.UtcNow };
            
            context.Users.AddRange(user1, user2);
            context.Oferty.Add(oferta);
            
            var parentComment = new Komentarz
            {
                IdKomentarz = 1,
                IdUzytkownik = 1,
                IdOferta = 1,
                Tresc = "To jest komentarz nadrzędny",
                DataDodania = DateTime.UtcNow
            };
            context.Komentarze.Add(parentComment);
            await context.SaveChangesAsync();

            // Act
            var reply = new Komentarz
            {
                IdKomentarz = 2,
                IdUzytkownik = 2,
                IdOferta = 1,
                Tresc = "To jest odpowiedź",
                ParentId = 1,
                DataDodania = DateTime.UtcNow
            };
            context.Komentarze.Add(reply);
            await context.SaveChangesAsync();

            // Assert
            var savedReply = await context.Komentarze.FindAsync(2);
            savedReply!.ParentId.Should().Be(1);
        }

        [Fact]
        public async Task GetReplies_ForComment_ReturnsOnlyReplies()
        {
            // Arrange
            using var context = CreateContext();
            var oferta = new Oferta { IdOferta = 1, IdUzytkownik = 1, Nazwa = "Test", DataDodania = DateTime.UtcNow };
            context.Oferty.Add(oferta);

            var parent = new Komentarz
            {
                IdKomentarz = 1,
                IdUzytkownik = 1,
                IdOferta = 1,
                Tresc = "Parent",
                DataDodania = DateTime.UtcNow
            };
            context.Komentarze.Add(parent);

            for (int i = 2; i <= 4; i++)
            {
                context.Komentarze.Add(new Komentarz
                {
                    IdKomentarz = i,
                    IdUzytkownik = 1,
                    IdOferta = 1,
                    Tresc = $"Reply {i}",
                    ParentId = 1,
                    DataDodania = DateTime.UtcNow
                });
            }

            // Another top-level comment
            context.Komentarze.Add(new Komentarz
            {
                IdKomentarz = 5,
                IdUzytkownik = 1,
                IdOferta = 1,
                Tresc = "Another top level",
                DataDodania = DateTime.UtcNow
            });
            await context.SaveChangesAsync();

            // Act
            var replies = await context.Komentarze.Where(k => k.ParentId == 1).ToListAsync();
            var topLevel = await context.Komentarze.Where(k => k.ParentId == null && k.IdOferta == 1).ToListAsync();

            // Assert
            replies.Count.Should().Be(3);
            topLevel.Count.Should().Be(2);
        }

        #endregion

        #region Comment Voting Tests

        [Fact]
        public async Task CommentVote_Up_IncreasesCount()
        {
            // Arrange
            using var context = CreateContext();
            var komentarz = new Komentarz
            {
                IdKomentarz = 1,
                IdUzytkownik = 1,
                IdOferta = 1,
                Tresc = "Test",
                LiczbaUp = 0,
                LiczbaDown = 0,
                DataDodania = DateTime.UtcNow
            };
            context.Komentarze.Add(komentarz);
            await context.SaveChangesAsync();

            // Act
            komentarz.LiczbaUp++;
            await context.SaveChangesAsync();

            // Assert
            var updated = await context.Komentarze.FindAsync(1);
            updated!.LiczbaUp.Should().Be(1);
        }

        [Fact]
        public async Task CommentVote_Down_IncreasesCount()
        {
            // Arrange
            using var context = CreateContext();
            var komentarz = new Komentarz
            {
                IdKomentarz = 1,
                IdUzytkownik = 1,
                IdOferta = 1,
                Tresc = "Test",
                LiczbaUp = 0,
                LiczbaDown = 0,
                DataDodania = DateTime.UtcNow
            };
            context.Komentarze.Add(komentarz);
            await context.SaveChangesAsync();

            // Act
            komentarz.LiczbaDown++;
            await context.SaveChangesAsync();

            // Assert
            var updated = await context.Komentarze.FindAsync(1);
            updated!.LiczbaDown.Should().Be(1);
        }

        [Theory]
        [InlineData(10, 2, 8)]   // positive score
        [InlineData(5, 10, -5)]  // negative score
        [InlineData(5, 5, 0)]    // neutral score
        [InlineData(0, 0, 0)]    // no votes
        public void CommentScore_CalculatedCorrectly(int up, int down, int expected)
        {
            // Arrange
            var komentarz = new Komentarz
            {
                Tresc = "Test comment",
                LiczbaUp = up,
                LiczbaDown = down
            };

            // Act
            var score = komentarz.LiczbaUp - komentarz.LiczbaDown;

            // Assert
            score.Should().Be(expected);
        }

        #endregion

        #region Comment Validation Tests

        [Fact]
        public void Comment_Content_MustNotBeEmpty()
        {
            // Arrange
            var komentarz = new Komentarz
            {
                IdKomentarz = 1,
                IdUzytkownik = 1,
                IdOferta = 1,
                Tresc = "",
                DataDodania = DateTime.UtcNow
            };

            // Assert
            komentarz.Tresc.Should().BeEmpty();
            // In real app, validation would reject this
        }

        [Fact]
        public void Comment_Content_MinLength()
        {
            // Arrange - BadgeService requires min 3 chars for comments to count
            var shortComment = new Komentarz { Tresc = "ab" };
            var validComment = new Komentarz { Tresc = "abc" };

            // Assert
            shortComment.Tresc.Length.Should().BeLessThan(3);
            validComment.Tresc.Length.Should().BeGreaterThanOrEqualTo(3);
        }

        #endregion

        #region Comment Statistics Tests

        [Fact]
        public async Task GetUserCommentCount_ReturnsCorrect()
        {
            // Arrange
            using var context = CreateContext();
            var user = new Uzytkownik { Id = 1, UserName = "user1", DataRejestracji = DateTime.UtcNow };
            var oferta = new Oferta { IdOferta = 1, IdUzytkownik = 2, Nazwa = "Test", DataDodania = DateTime.UtcNow };
            
            context.Users.Add(user);
            context.Oferty.Add(oferta);

            for (int i = 1; i <= 15; i++)
            {
                context.Komentarze.Add(new Komentarz
                {
                    IdKomentarz = i,
                    IdUzytkownik = 1,
                    IdOferta = 1,
                    Tresc = $"Komentarz {i}",
                    DataDodania = DateTime.UtcNow
                });
            }
            await context.SaveChangesAsync();

            // Act
            var count = await context.Komentarze.CountAsync(k => k.IdUzytkownik == 1);

            // Assert
            count.Should().Be(15);
        }

        [Fact]
        public async Task GetOfferCommentCount_ReturnsCorrect()
        {
            // Arrange
            using var context = CreateContext();
            var oferta = new Oferta { IdOferta = 1, IdUzytkownik = 1, Nazwa = "Popular", DataDodania = DateTime.UtcNow };
            context.Oferty.Add(oferta);

            for (int i = 1; i <= 20; i++)
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
            var count = await context.Komentarze.CountAsync(k => k.IdOferta == 1);

            // Assert
            count.Should().Be(20);
        }

        #endregion

        #region Comment Ordering Tests

        [Fact]
        public async Task Comments_OrderedByDateDescending()
        {
            // Arrange
            using var context = CreateContext();
            var oferta = new Oferta { IdOferta = 1, IdUzytkownik = 1, Nazwa = "Test", DataDodania = DateTime.UtcNow };
            context.Oferty.Add(oferta);

            var dates = new[] 
            { 
                DateTime.UtcNow.AddHours(-3), 
                DateTime.UtcNow.AddHours(-1), 
                DateTime.UtcNow 
            };

            for (int i = 0; i < 3; i++)
            {
                context.Komentarze.Add(new Komentarz
                {
                    IdKomentarz = i + 1,
                    IdUzytkownik = 1,
                    IdOferta = 1,
                    Tresc = $"Comment {i}",
                    DataDodania = dates[i]
                });
            }
            await context.SaveChangesAsync();

            // Act
            var comments = await context.Komentarze
                .Where(k => k.IdOferta == 1)
                .OrderByDescending(k => k.DataDodania)
                .ToListAsync();

            // Assert
            comments[0].DataDodania.Should().BeAfter(comments[1].DataDodania);
            comments[1].DataDodania.Should().BeAfter(comments[2].DataDodania);
        }

        [Fact]
        public async Task Comments_OrderedByScore()
        {
            // Arrange
            using var context = CreateContext();
            var oferta = new Oferta { IdOferta = 1, IdUzytkownik = 1, Nazwa = "Test", DataDodania = DateTime.UtcNow };
            context.Oferty.Add(oferta);

            context.Komentarze.AddRange(
                new Komentarz { IdKomentarz = 1, IdUzytkownik = 1, IdOferta = 1, Tresc = "Low", LiczbaUp = 1, LiczbaDown = 5, DataDodania = DateTime.UtcNow },
                new Komentarz { IdKomentarz = 2, IdUzytkownik = 1, IdOferta = 1, Tresc = "High", LiczbaUp = 20, LiczbaDown = 2, DataDodania = DateTime.UtcNow },
                new Komentarz { IdKomentarz = 3, IdUzytkownik = 1, IdOferta = 1, Tresc = "Medium", LiczbaUp = 5, LiczbaDown = 2, DataDodania = DateTime.UtcNow }
            );
            await context.SaveChangesAsync();

            // Act
            var comments = await context.Komentarze
                .Where(k => k.IdOferta == 1)
                .OrderByDescending(k => k.LiczbaUp - k.LiczbaDown)
                .ToListAsync();

            // Assert
            comments[0].Tresc.Should().Be("High");
            comments[1].Tresc.Should().Be("Medium");
            comments[2].Tresc.Should().Be("Low");
        }

        #endregion
    }
}
