// DTO: komentarz (drzewo + głosy)
namespace TechPromo.Api.DTO
{
    public class KomentarzDto
    {
        public int Id { get; set; }
    public string Tresc { get; set; } = string.Empty;
    public string Oferta { get; set; } = string.Empty;
    public string Data { get; set; } = string.Empty;
    public string Autor { get; set; } = string.Empty;
    public int AutorId { get; set; }  // Dodane dla potrzeb avatara
    public int? ParentId { get; set; }
    public int Up { get; set; }
    public int Down { get; set; }
    public string? UserVote { get; set; }
    public string? AutorAvatarUrl { get; set; }
    }
}
