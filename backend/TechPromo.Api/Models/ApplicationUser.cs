using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;

namespace TechPromo.Api.Models
{
    public class ApplicationUser : IdentityUser
    {
        // Opcjonalna nazwa użytkownika wyświetlana w aplikacji
        public string? NazwaWyswietlana { get; set; }

        // Data rejestracji użytkownika
        public DateTime DataRejestracji { get; set; }

        // Liczba punktów zdobytych za aktywność lub oceny ofert
        public int Punkty { get; set; }

        public ICollection<Oferta> Oferty { get; set; } = new List<Oferta>();
        public ICollection<Komentarz> Komentarze { get; set; } = new List<Komentarz>();
        public ICollection<Glos> Glosy { get; set; } = new List<Glos>();
        public ICollection<Powiadomienie> Powiadomienia { get; set; } = new List<Powiadomienie>();
        public ICollection<Zgloszenie> Zgloszenia { get; set; } = new List<Zgloszenie>();
        public ICollection<UzytkownikOdznaka> UzytkownikOdznaki { get; set; } = new List<UzytkownikOdznaka>();
        public ICollection<Aktywnosc> Aktywnosci { get; set; } = new List<Aktywnosc>();
    }
}
