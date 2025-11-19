namespace TechPromo.Api.DTO
{
    /// <summary>
    /// Request do sprawdzania duplikatów ofert
    /// </summary>
    public class SprawdzDuplikatyRequest
    {
        /// <summary>
        /// Nazwa oferty do sprawdzenia
        /// </summary>
        public string Nazwa { get; set; } = string.Empty;

        /// <summary>
        /// Link do oferty (opcjonalny)
        /// </summary>
        public string? Link { get; set; }

        /// <summary>
        /// Cena oferty (opcjonalna)
        /// </summary>
        public decimal? Cena { get; set; }
    }
}
