using System.Collections.Generic;       
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TechPromo.Api.Model;
public class Odznaka
    {
        [Key]
        public int IdOdznaka { get; set; }

        [Required]
        [MaxLength(50)]
        public string Nazwa { get; set; }

        public string Opis { get; set; }
        public string Ikona { get; set; }

        public ICollection<UzytkownikOdznaka> UzytkownikOdznaki { get; set; }
    }