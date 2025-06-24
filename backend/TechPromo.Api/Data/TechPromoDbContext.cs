using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Model;

namespace TechPromo.Api.Data
{
    public class TechPromoDbContext : IdentityDbContext<Uzytkownik, IdentityRole<int>, int>
    {
        public TechPromoDbContext(DbContextOptions<TechPromoDbContext> options)
            : base(options)
        {
        }

        public DbSet<Kategoria> Kategorie { get; set; }
        public DbSet<Oferta> Oferty { get; set; }
        public DbSet<OfertaZdjecie> OfertyZdjecia { get; set; }
        public DbSet<Tag> Tagi { get; set; }
        public DbSet<OfertaTag> OfertaTagi { get; set; }
        public DbSet<Komentarz> Komentarze { get; set; }
        public DbSet<Glos> Glosy { get; set; }
        public DbSet<Powiadomienie> Powiadomienia { get; set; }
        public DbSet<Aktywnosc> Aktywnosci { get; set; }
        public DbSet<Odznaka> Odznaki { get; set; }
        public DbSet<UzytkownikOdznaka> UzytkownikOdznaki { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

           
            modelBuilder.Entity<OfertaTag>()
                .HasKey(ot => new { ot.IdOferta, ot.IdTag });

            modelBuilder.Entity<UzytkownikOdznaka>()
                .HasKey(uo => new { uo.IdUzytkownik, uo.IdOdznaka });
        }
    }
}
