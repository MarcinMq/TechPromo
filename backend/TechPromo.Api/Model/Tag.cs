using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TechPromo.Api.Model;
 public class Tag
    {
        [Key]
        public int IdTag { get; set; }

        [Required]
        [MaxLength(50)]
        public string Nazwa { get; set; }

        public ICollection<OfertaTag> OfertaTagi { get; set; }
    }