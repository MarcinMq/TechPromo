using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TechPromo.Api.Models;

[Table("Uzytkownik_Odznaka")]
[PrimaryKey(nameof(id_uzytkownik), nameof(id_odznaka))]
public class Uzytkownik_Odznaka
{
    public int id_uzytkownik { get; set; }
    public int id_odznaka { get; set; }

    public DateTime data_przyznania { get; set; } = DateTime.UtcNow;

    // Właściwości nawigacyjne
    [ForeignKey("id_uzytkownik")]
    public virtual Uzytkownik Uzytkownik { get; set; }
    
    [ForeignKey("id_odznaka")]
    public virtual Odznaka Odznaka { get; set; }
}
