using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Data;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;
using System;
using TechPromo.Api.Model;

namespace TechPromo.Api.Services
{
    public class BadgeService : IBadgeService
    {
        private readonly TechPromoDbContext _context;

        public BadgeService(TechPromoDbContext context)
        {
            _context = context;
        }

        public async Task EvaluateForUserAsync(int userId, CancellationToken ct = default)
        {
            // Pobierz metryki użytkownika
            var dealsCount = await _context.Oferty
                .Where(o => o.IdUzytkownik == userId && o.Aktywna && o.Zatwierdzona)
                .CountAsync(ct);

            var maxTemp = await _context.Oferty
                .Where(o => o.IdUzytkownik == userId && o.Aktywna && o.Zatwierdzona)
                .Select(o => (int?)(o.LiczbaHot - o.LiczbaCold))
                .MaxAsync(ct) ?? 0;

            var commentsCount = await _context.Komentarze
                .Where(k => k.IdUzytkownik == userId && k.Tresc.Length >= 3)
                .CountAsync(ct);

            var gaveVotes = await _context.Glosy
                .Where(g => g.IdUzytkownik == userId)
                .CountAsync(ct);

            // Sprawdź avatar (plik w wwwroot/uploads/profiles/user_{id}.*)
            bool hasAvatar = false;
            try
            {
                var webRoot = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "wwwroot");
                var profilesDir = System.IO.Path.Combine(webRoot, "uploads", "profiles");
                System.IO.Directory.CreateDirectory(profilesDir);
                hasAvatar = System.IO.Directory.GetFiles(profilesDir, $"user_{userId}.*").Any();
            }
            catch { }

            // Przyznaj odznaki wg kodów
            await GrantIf(userId, "first_deal", dealsCount >= 1, ct);
            await GrantIf(userId, "deals_5", dealsCount >= 5, ct);
            await GrantIf(userId, "hot_50", maxTemp >= 50, ct);
            await GrantIf(userId, "comments_10", commentsCount >= 10, ct);
            await GrantIf(userId, "first_vote", gaveVotes >= 1, ct);
            await GrantIf(userId, "avatar_set", hasAvatar, ct);
        }

        private async Task GrantIf(int userId, string badgeCode, bool condition, CancellationToken ct)
        {
            if (!condition) return;

            var badge = await _context.Odznaki.FirstOrDefaultAsync(o => o.Nazwa == badgeCode || o.Opis == badgeCode, ct);
            if (badge == null) return; // brak w seed

            var hasIt = await _context.UzytkownikOdznaki.AnyAsync(uo => uo.IdUzytkownik == userId && uo.IdOdznaka == badge.IdOdznaka, ct);
            if (hasIt) return;

            _context.UzytkownikOdznaki.Add(new UzytkownikOdznaka
            {
                IdUzytkownik = userId,
                IdOdznaka = badge.IdOdznaka,
                DataPrzyznania = DateTime.UtcNow
            });
            await _context.SaveChangesAsync(ct);
        }
    }
}
