// DTO: wynik stronicowany
namespace TechPromo.Api.DTO
{
    public class PagedResult<T>
    {
        public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();
        public int Total { get; set; }
        public int Skip { get; set; }
        public int Take { get; set; }
        public bool HasMore => Skip + ItemsCount < Total;
        public int ItemsCount => Items is ICollection<T> col ? col.Count : Items.Count();
    }
}
