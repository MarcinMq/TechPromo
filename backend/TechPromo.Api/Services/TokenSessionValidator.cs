using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using TechPromo.Api.Model;

namespace TechPromo.Api.Services;

public sealed class TokenSessionValidator(UserManager<Uzytkownik> users)
{
    public const string StampClaim = "session_stamp";

    public async Task<bool> IsValidAsync(ClaimsPrincipal principal)
    {
        var user = await users.GetUserAsync(principal);
        var stamp = principal.FindFirst(StampClaim)?.Value;
        // JWT signatures do not revoke sessions after password or role changes.
        if (user == null || string.IsNullOrEmpty(stamp)
            || stamp != user.SecurityStamp || await users.IsLockedOutAsync(user))
            return false;

        var currentRoles = await users.GetRolesAsync(user);
        return currentRoles.ToHashSet(StringComparer.Ordinal)
            .SetEquals(principal.FindAll(ClaimTypes.Role).Select(c => c.Value));
    }
}
