using Microsoft.AspNetCore.Identity;
using TechPromo.Api.DTOs;
using TechPromo.Api.ViewModels;

namespace TechPromo.Api.Services
{
    public interface IAuthService
    {
        Task<ResponseViewModel> RegisterAsync(RegisterDto model);
        Task<JwtResponseViewModel> LoginAsync(LoginDto model);
        Task<ResponseViewModel> AddRoleAsync(AddRoleDto model);
    }
}