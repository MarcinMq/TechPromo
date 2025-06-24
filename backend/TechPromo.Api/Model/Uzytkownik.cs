using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TechPromo.Api.Model
{
    public class Uzytkownik : IdentityUser<int>
    {
        public DateTime DataRejestracji { get; set; } = DateTime.UtcNow;

        public int Punkty { get; set; } = 0;

       
        public ICollection<Oferta> Oferty { get; set; }
        public ICollection<Komentarz> Komentarze { get; set; }
        public ICollection<Glos> Glosy { get; set; }
        public ICollection<Powiadomienie> Powiadomienia { get; set; }
        public ICollection<Aktywnosc> Aktywnosci { get; set; }
        public ICollection<UzytkownikOdznaka> UzytkownikOdznaki { get; set; }

        public Uzytkownik()
        {
            Oferty = new HashSet<Oferta>();
            Komentarze = new HashSet<Komentarz>();
            Glosy = new HashSet<Glos>();
            Powiadomienia = new HashSet<Powiadomienie>();
            Aktywnosci = new HashSet<Aktywnosc>();
            UzytkownikOdznaki = new HashSet<UzytkownikOdznaka>();
        }
    }
}
