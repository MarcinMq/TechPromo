using System.ComponentModel.DataAnnotations;

// DTO: aktualizacja oferty (admin/mod)
namespace TechPromo.Api.DTO
{
    public class AktualizujOferteDto
    {
        [StringLength(100, ErrorMessage = "Tytuł nie może być dłuższy niż 100 znaków")]
        public string? Tytul { get; set; }
        
        [StringLength(2000, ErrorMessage = "Opis nie może być dłuższy niż 2000 znaków")]
        public string? Opis { get; set; }
        
        [Range(0, 999999.99, ErrorMessage = "Cena nie może być ujemna")]
        public decimal? Cena { get; set; }
        
        [Range(0.01, 999999.99, ErrorMessage = "Cena poprzednia musi być większa od 0")]
        public decimal? CenaPoprzednia { get; set; }
        
        [StringLength(50, ErrorMessage = "Kod nie może być dłuższy niż 50 znaków")]
        public string? Kod { get; set; }
        
        [StringLength(300, ErrorMessage = "Link nie może być dłuższy niż 300 znaków")]
        public string? Link { get; set; }
    }
}
