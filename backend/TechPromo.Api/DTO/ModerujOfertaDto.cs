namespace TechPromo.Api.DTO
{
    public class ModerujOfertaDto
    {
        public bool Aktywna { get; set; } = true;
        public string? NowyTytul { get; set; }
        public string? NowyOpis { get; set; }
        public string? Powod { get; set; }
    }

    public class ZmienRoleDto
    {
        public string NowaRola { get; set; } = string.Empty;
    }
}
