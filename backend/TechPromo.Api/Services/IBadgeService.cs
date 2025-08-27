using System.Threading;
using System.Threading.Tasks;

namespace TechPromo.Api.Services
{
    public interface IBadgeService
    {
        Task EvaluateForUserAsync(int userId, CancellationToken ct = default);
    }
}
