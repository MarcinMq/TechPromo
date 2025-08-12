using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TechPromo.Api.Model;
public class Komentarz
    {
        [Key]
        public int IdKomentarz { get; set; }

        [ForeignKey("Uzytkownik")]
    public int IdUzytkownik { get; set; }
    public Uzytkownik? Uzytkownik { get; set; }

        [ForeignKey("Oferta")]
    public int IdOferta { get; set; }
    public Oferta? Oferta { get; set; }

        [Required]
    public required string Tresc { get; set; }

        public DateTime DataDodania { get; set; } = DateTime.UtcNow;

        [MaxLength(20)]
        public string Status { get; set; } = "aktywny";

    public ICollection<Powiadomienie> Powiadomienia { get; set; } = new List<Powiadomienie>();
    // Threading
    public int? ParentId { get; set; }
    [ForeignKey("ParentId")] public Komentarz? Parent { get; set; }
    public ICollection<Komentarz> Replies { get; set; } = new List<Komentarz>();
    // Voting
    public int LiczbaUp { get; set; } = 0;
    public int LiczbaDown { get; set; } = 0;
    }