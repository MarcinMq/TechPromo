namespace TechPromo.Api.Search.Models
{
    /// <summary>
    /// Operacje na indeksie Azure AI Search
    /// </summary>
    public enum OperacjaIndeksu
    {
        /// <summary>
        /// Dodaj dokument (jeśli istnieje, wywali błąd)
        /// </summary>
        Upload,

        /// <summary>
        /// Dodaj lub zaktualizuj dokument
        /// </summary>
        Merge,

        /// <summary>
        /// Dodaj lub zamień dokument całkowicie
        /// </summary>
        MergeOrUpload,

        /// <summary>
        /// Usuń dokument
        /// </summary>
        Delete
    }

    /// <summary>
    /// Dokument do operacji na indeksie
    /// </summary>
    /// <typeparam name="T">Typ dokumentu</typeparam>
    public class DokumentIndeksu<T>
    {
        /// <summary>
        /// Dokument do operacji
        /// </summary>
        public T Document { get; set; } = default!;

        /// <summary>
        /// Typ operacji do wykonania
        /// </summary>
        public OperacjaIndeksu Operation { get; set; } = OperacjaIndeksu.MergeOrUpload;
    }

    /// <summary>
    /// Wynik operacji na indeksie
    /// </summary>
    public class WynikIndeksu
    {
        /// <summary>
        /// Czy operacja się powiodła
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// Liczba pomyślnie przetworzonych dokumentów
        /// </summary>
        public int SuccessCount { get; set; }

        /// <summary>
        /// Liczba dokumentów z błędami
        /// </summary>
        public int ErrorCount { get; set; }

        /// <summary>
        /// Lista błędów (jeśli wystąpiły)
        /// </summary>
        public List<string> Errors { get; set; } = new();

        /// <summary>
        /// Czas wykonania operacji w milisekundach
        /// </summary>
        public double ExecutionTimeMs { get; set; }
    }
}