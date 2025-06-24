using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;
using TechPromo.Api.Model;
public class OfertaTag
    {
        [ForeignKey("Oferta")]
        public int IdOferta { get; set; }
        public Oferta Oferta { get; set; }

        [ForeignKey("Tag")]
        public int IdTag { get; set; }
        public Tag Tag { get; set; }
    }
