using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TechPromo.Api.Models;

namespace TechPromo.Api.Data;

public class ApplicationDbContext : IdentityDbContext<Uzytkownik, IdentityRole<int>, int>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Aktywnosc> Aktywnosci { get; set; }
    public DbSet<Glos> Glosy { get; set; }
    public DbSet<Kategoria> Kategorie { get; set; }
    public DbSet<Komentarz> Komentarze { get; set; }
    public DbSet<Oferta> Oferty { get; set; }
    public DbSet<Odznaka> Odznaki { get; set; }
    public DbSet<Powiadomienie> Powiadomienia { get; set; }
    public DbSet<Uzytkownik_Odznaka> Uzytkownik_Odznaki { get; set; }
    public DbSet<Zgloszenie> Zgloszenia { get; set; }
}

