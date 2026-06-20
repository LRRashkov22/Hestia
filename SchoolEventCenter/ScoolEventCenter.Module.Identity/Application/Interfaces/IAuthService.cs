
using SchoolEventCenter.Module.Data.Domain.Entities;
using ScoolEventCenter.Module.Identity.Application.DTOs;

namespace ScoolEventCenter.Module.Identity.Application.Interfaces;

public interface IAuthService
{
    Task<(User?, string?)> RegisterUser(CreateUserDto request);
    Task<(TokenResponseDto?, string?)> LoginAsync(UserDto request);
    Task Logout(Guid userId);
    Task<TokenResponseDto?> RefreshTokensAsync(RefreshTokenRequestDto request);

}
