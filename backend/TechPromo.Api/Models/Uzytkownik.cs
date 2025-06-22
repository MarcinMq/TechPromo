using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Models;

public class Uzytkownik : IdentityUser<int>
{
    // Właściwości odziedziczone z IdentityUser: Id, UserName, Email, PasswordHash, etc.
    
    // Pola dodatkowe
    public DateTime data_rejestracji { get; set; } = DateTime.UtcNow;
    public int punkty { get; set; }

    // Właściwości nawigacyjne
    public virtual ICollection<Oferta> Oferty { get; set; } = new List<Oferta>();
    public virtual ICollection<Komentarz> Komentarze { get; set; } = new List<Komentarz>();
    public virtual ICollection<Glos> Glosy { get; set; } = new List<Glos>();
    public virtual ICollection<Zgloszenie> Zgloszenia { get; set; } = new List<Zgloszenie>();
    public virtual ICollection<Aktywnosc> Aktywnosci { get; set; } = new List<Aktywnosc>();
    public virtual ICollection<Powiadomienie> Powiadomienia { get; set; } = new List<Powiadomienie>();
    public virtual ICollection<Uzytkownik_Odznaka> Uzytkownik_Odznaki { get; set; } = new List<Uzytkownik_Odznaka>();
}