using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;

namespace TechPromo.Api.Models
{
    public class Uzytkownik : IdentityUser
    {
        public string nazwa_uzytkownika { get; set; }
        public DateTime data_rejestracji { get; set; }
        public string rola { get; set; }
        public int punkty { get; set; }

        // Navigation properties
        public virtual ICollection<Oferta> Oferty { get; set; } = new List<Oferta>();
        public virtual ICollection<Komentarz> Komentarze { get; set; } = new List<Komentarz>();
        public virtual ICollection<Glos> Glosy { get; set; } = new List<Glos>();
        public virtual ICollection<Aktywnosc> Aktywnosci { get; set; } = new List<Aktywnosc>();
        public virtual ICollection<Zgloszenie> Zgloszenia { get; set; } = new List<Zgloszenie>();
        public virtual ICollection<Powiadomienie> Powiadomienia { get; set; } = new List<Powiadomienie>();
        public virtual ICollection<UzytkownikOdznaka> Odznaki { get; set; } = new List<UzytkownikOdznaka>();
    }
}