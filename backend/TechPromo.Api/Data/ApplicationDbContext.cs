using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Models;

namespace TechPromo.Api.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Oferta> Oferty => Set<Oferta>();
        public DbSet<Kategoria> Kategorie => Set<Kategoria>();
        public DbSet<Komentarz> Komentarze => Set<Komentarz>();
        public DbSet<Glos> Glosy => Set<Glos>();
        public DbSet<Powiadomienie> Powiadomienia => Set<Powiadomienie>();
        public DbSet<Zgloszenie> Zgloszenia => Set<Zgloszenie>();
        public DbSet<Odznaka> Odznaki => Set<Odznaka>();
        public DbSet<UzytkownikOdznaka> UzytkownikOdznaki => Set<UzytkownikOdznaka>();
        public DbSet<Aktywnosc> Aktywnosci => Set<Aktywnosc>();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<UzytkownikOdznaka>()
                .HasKey(uo => new { uo.UzytkownikId, uo.OdznakaId });

            builder.Entity<Oferta>()
                .HasOne(o => o.Uzytkownik)
                .WithMany(u => u.Oferty)
                .HasForeignKey(o => o.UzytkownikId);

            builder.Entity<Oferta>()
                .HasOne(o => o.Kategoria)
                .WithMany(k => k.Oferty)
                .HasForeignKey(o => o.KategoriaId);

            builder.Entity<Komentarz>()
                .HasOne(k => k.Uzytkownik)
                .WithMany(u => u.Komentarze)
                .HasForeignKey(k => k.UzytkownikId);

            builder.Entity<Komentarz>()
                .HasOne(k => k.Oferta)
                .WithMany(o => o.Komentarze)
                .HasForeignKey(k => k.OfertaId);

            builder.Entity<Glos>()
                .HasOne(g => g.Uzytkownik)
                .WithMany(u => u.Glosy)
                .HasForeignKey(g => g.UzytkownikId);

            builder.Entity<Glos>()
                .HasOne(g => g.Oferta)
                .WithMany(o => o.Glosy)
                .HasForeignKey(g => g.OfertaId);

            builder.Entity<Powiadomienie>()
                .HasOne(p => p.Uzytkownik)
                .WithMany(u => u.Powiadomienia)
                .HasForeignKey(p => p.UzytkownikId);

            builder.Entity<Powiadomienie>()
                .HasOne(p => p.Oferta)
                .WithMany()
                .HasForeignKey(p => p.OfertaId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Powiadomienie>()
                .HasOne(p => p.Komentarz)
                .WithMany()
                .HasForeignKey(p => p.KomentarzId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Zgloszenie>()
                .HasOne(z => z.Uzytkownik)
                .WithMany(u => u.Zgloszenia)
                .HasForeignKey(z => z.UzytkownikId);

            builder.Entity<UzytkownikOdznaka>()
                .HasOne(uo => uo.Uzytkownik)
                .WithMany(u => u.UzytkownikOdznaki)
                .HasForeignKey(uo => uo.UzytkownikId);

            builder.Entity<UzytkownikOdznaka>()
                .HasOne(uo => uo.Odznaka)
                .WithMany(o => o.UzytkownikOdznaki)
                .HasForeignKey(uo => uo.OdznakaId);

            builder.Entity<Aktywnosc>()
                .HasOne(a => a.Uzytkownik)
                .WithMany(u => u.Aktywnosci)
                .HasForeignKey(a => a.UzytkownikId);
        }
    }
}
