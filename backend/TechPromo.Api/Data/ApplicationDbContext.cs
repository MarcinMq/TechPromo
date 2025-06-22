using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Models;

namespace TechPromo.Api.Data
{
    public class ApplicationDbContext : IdentityDbContext<Uzytkownik>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Oferta> Oferty { get; set; }
        public DbSet<Kategoria> Kategorie { get; set; }
        public DbSet<Komentarz> Komentarze { get; set; }
        public DbSet<Glos> Glosy { get; set; }
        public DbSet<Powiadomienie> Powiadomienia { get; set; }
        public DbSet<Aktywnosc> Aktywnosci { get; set; }
        public DbSet<Zgloszenie> Zgloszenia { get; set; }
        public DbSet<Odznaka> Odznaki { get; set; }
        public DbSet<UzytkownikOdznaka> UzytkownikOdznaki { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Konfiguracja klucza złożonego dla UzytkownikOdznaka
            modelBuilder.Entity<UzytkownikOdznaka>()
                .HasKey(uo => new { uo.id_uzytkownik, uo.id_odznaka });

            // Relacje Uzytkownik - Oferta (1:N)
            modelBuilder.Entity<Oferta>()
                .HasOne(o => o.Uzytkownik)
                .WithMany(u => u.Oferty)
                .HasForeignKey(o => o.id_uzytkownik)
                .OnDelete(DeleteBehavior.Restrict);

            // Relacje Kategoria - Oferta (1:N)
            modelBuilder.Entity<Oferta>()
                .HasOne(o => o.Kategoria)
                .WithMany(k => k.Oferty)
                .HasForeignKey(o => o.id_kategoria)
                .OnDelete(DeleteBehavior.Restrict);

            // Relacje Uzytkownik - Komentarz (1:N)
            modelBuilder.Entity<Komentarz>()
                .HasOne(k => k.Uzytkownik)
                .WithMany(u => u.Komentarze)
                .HasForeignKey(k => k.id_uzytkownik)
                .OnDelete(DeleteBehavior.Restrict);

            // Relacje Oferta - Komentarz (1:N)
            modelBuilder.Entity<Komentarz>()
                .HasOne(k => k.Oferta)
                .WithMany(o => o.Komentarze)
                .HasForeignKey(k => k.id_oferta)
                .OnDelete(DeleteBehavior.Cascade);

            // Relacje Uzytkownik - Glos (1:N)
            modelBuilder.Entity<Glos>()
                .HasOne(g => g.Uzytkownik)
                .WithMany(u => u.Glosy)
                .HasForeignKey(g => g.id_uzytkownik)
                .OnDelete(DeleteBehavior.Restrict);

            // Relacje Oferta - Glos (1:N)
            modelBuilder.Entity<Glos>()
                .HasOne(g => g.Oferta)
                .WithMany(o => o.Glosy)
                .HasForeignKey(g => g.id_oferta)
                .OnDelete(DeleteBehavior.Cascade);

            // Relacje Uzytkownik - Powiadomienie (1:N)
            modelBuilder.Entity<Powiadomienie>()
                .HasOne(p => p.Uzytkownik)
                .WithMany(u => u.Powiadomienia)
                .HasForeignKey(p => p.id_uzytkownik)
                .OnDelete(DeleteBehavior.Cascade);

            // Opcjonalne relacje dla Powiadomienie
            modelBuilder.Entity<Powiadomienie>()
                .HasOne(p => p.Oferta)
                .WithMany()
                .HasForeignKey(p => p.id_oferta)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Powiadomienie>()
                .HasOne(p => p.Komentarz)
                .WithMany()
                .HasForeignKey(p => p.id_komentarz)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            // Relacje Uzytkownik - Aktywnosc (1:N)
            modelBuilder.Entity<Aktywnosc>()
                .HasOne(a => a.Uzytkownik)
                .WithMany(u => u.Aktywnosci)
                .HasForeignKey(a => a.id_uzytkownik)
                .OnDelete(DeleteBehavior.Cascade);

            // Relacje Uzytkownik - Zgloszenie (1:N)
            modelBuilder.Entity<Zgloszenie>()
                .HasOne(z => z.Uzytkownik)
                .WithMany(u => u.Zgloszenia)
                .HasForeignKey(z => z.id_uzytkownik)
                .OnDelete(DeleteBehavior.Restrict);

            // Relacje dla tabeli łączącej UzytkownikOdznaka
            modelBuilder.Entity<UzytkownikOdznaka>()
                .HasOne(uo => uo.Uzytkownik)
                .WithMany(u => u.Odznaki)
                .HasForeignKey(uo => uo.id_uzytkownik)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UzytkownikOdznaka>()
                .HasOne(uo => uo.Odznaka)
                .WithMany(o => o.Uzytkownicy)
                .HasForeignKey(uo => uo.id_odznaka)
                .OnDelete(DeleteBehavior.Cascade);

            // Konfiguracja nazw tabel w bazie danych
            modelBuilder.Entity<Uzytkownik>().ToTable("uzytkownicy");
            modelBuilder.Entity<Oferta>().ToTable("oferty");
            modelBuilder.Entity<Kategoria>().ToTable("kategorie");
            modelBuilder.Entity<Komentarz>().ToTable("komentarze");
            modelBuilder.Entity<Glos>().ToTable("glosy");
            modelBuilder.Entity<Powiadomienie>().ToTable("powiadomienia");
            modelBuilder.Entity<Aktywnosc>().ToTable("aktywnosci");
            modelBuilder.Entity<Zgloszenie>().ToTable("zgloszenia");
            modelBuilder.Entity<Odznaka>().ToTable("odznaki");
            modelBuilder.Entity<UzytkownikOdznaka>().ToTable("uzytkownik_odznaki");
            
            // Konfiguracja indeksów
            modelBuilder.Entity<Oferta>()
                .HasIndex(o => o.id_kategoria);
                
            modelBuilder.Entity<Oferta>()
                .HasIndex(o => o.id_uzytkownik);
                
            modelBuilder.Entity<Glos>()
                .HasIndex(g => new { g.id_uzytkownik, g.id_oferta })
                .IsUnique(); // Użytkownik może zagłosować tylko raz na ofertę
                
            modelBuilder.Entity<Komentarz>()
                .HasIndex(k => k.id_oferta);
        }
    }
}
