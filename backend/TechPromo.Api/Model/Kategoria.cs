using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TechPromo.Api.Model
{
public class Kategoria
{
    [Key]
    public int IdKategoria { get; set; }

    [Required]
    [MaxLength(50)]
    public string Nazwa { get; set; }

    public string Opis { get; set; }

    public ICollection<Oferta> Oferty { get; set; }
}
}