using System.ComponentModel.DataAnnotations;

namespace TechPromo.Api.DTO
{
    public class ZglosDto
    {
        [Required]
        public string Typ { get; set; } // offer, comment

        [Required]
        public int IdTresci { get; set; }

        [Required]
        [MaxLength(200, ErrorMessage = "Powód nie może być dłuższy niż 200 znaków")]
        public string Powod { get; set; }
    }
}
