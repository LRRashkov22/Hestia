using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SchoolEventCenter.Module.Data.Domain.Entities;
using SchoolEventCenter.Module.Data.Domain.Enums;
using SchoolEventCenter.Module.Data.Options;
using SchoolEventCenter.Module.Data.Persistance;
using ScoolEventCenter.Module.Identity.Application.DTOs;
using ScoolEventCenter.Module.Identity.Application.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
namespace ScoolEventCenter.Module.Identity.Application.Services;

public class AuthService : IAuthService
{
    public readonly SECDbContext context;
    public readonly JwtOptions configuration;
    public AuthService(SECDbContext context, IOptions<JwtOptions> configuration)
    {
        this.context = context;
        this.configuration = configuration.Value;
    }
    //Register-----------------------------------------------------------------------------------------
    public async Task<(User?, string?)> RegisterUser(CreateUserDto request)
    {
        if (await context.Users.AnyAsync(u => u.Username == request.Username
        || u.Email == request.Email
        )) return (null, "User already exists");
        var user = new User();
        var hashedPassword = new PasswordHasher<User>().HashPassword(user, request.Password);
        user.Username = request.Username;
        user.Email = request.Email;
        user.PasswordHash = hashedPassword;
        user.CreatedAt = DateTime.UtcNow;
        user.Role = UserRole.Student;
        context.Users.Add(user);
        await context.SaveChangesAsync();
        return (user, null);
    }
    //Register-----------------------------------------------------------------------------------------

    //Login--------------------------------------------------------------------------------------------
    public async Task<(TokenResponseDto?, string?)> LoginAsync(UserDto request)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user is null) return (null, "User not found");
        if (new PasswordHasher<User>().VerifyHashedPassword(user, user.PasswordHash, request.Password)
            == PasswordVerificationResult.Failed) return (null, "User not found");
        await context.SaveChangesAsync();
        return (await CreateTokenResponse(user), null);
    }
    //Login--------------------------------------------------------------------------------------------

    //Change Password----------------------------------------------------------------------------------
    public async Task<(TokenResponseDto? tokenRespone, string? error)> ChangePassword(ChangePasswordDto request, Guid userid)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == userid);
        if (user is null) return (null, "User not found");
        if (new PasswordHasher<User>().VerifyHashedPassword(user, user.PasswordHash, request.Password) == PasswordVerificationResult.Failed)
            return (null, "Current password is incorrect");

        if (string.IsNullOrEmpty(request.NewPassword) ||
           request.NewPassword.Length < 8 ||
           request.NewPassword.Length > 30 ||
           !request.NewPassword.Any(char.IsUpper) ||
           !request.NewPassword.Any(char.IsLower) ||
           !request.NewPassword.Any(char.IsDigit) ||
           !request.NewPassword.Any(ch => !char.IsLetterOrDigit(ch)))
            return (null, "Password:" +
                 "\n must be at least 8 characters long" +
                 "\n must be maximum 30 characters long" +
                 "\n must contain at least one uppercase, lowercase letter, digit and special character");
        user.PasswordHash = new PasswordHasher<User>().HashPassword(user, request.NewPassword);
        await context.SaveChangesAsync();

        return (await CreateTokenResponse(user), null);

    }
    //---------------------------------------------------------------------------------------

    public async Task Logout(Guid userId)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user != null)
        {
            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;
            await context.SaveChangesAsync();
        }
    }

    //Token_Response-----------------------------------------------------------------------------------
    private async Task<TokenResponseDto?> CreateTokenResponse(User user)
    {
        return new TokenResponseDto
        {
            AccessToken = CreateToken(user),
            RefreshToken = await GenerateAndSaveRefreshTokenAsync(user)
        };
    }
    //Token_Response-----------------------------------------------------------------------------------

    //Create_Access_Token------------------------------------------------------------------------------
    private string CreateToken(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512);
        var tokenDescriptor = new JwtSecurityToken(
            issuer: configuration.Issuer,
            audience: configuration.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: creds
);
        return new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);

    }
    //Create_Access_Token------------------------------------------------------------------------------

    //Create_And_Save_Refresh_Token--------------------------------------------------------------------
    private async Task<string> GenerateAndSaveRefreshTokenAsync(User user)
    {
        var refreshToken = GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await context.SaveChangesAsync();
        return refreshToken;
    }
    //Create_And_Save_Refresh_Token--------------------------------------------------------------------

    //Create_Refresh_Token-----------------------------------------------------------------------------
    private string GenerateRefreshToken()
    {
        var randomBytes = RandomNumberGenerator.GetBytes(32);

        var token = Convert.ToBase64String(randomBytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
        return token;
    }
    //Create_Refresh_Token-----------------------------------------------------------------------------

    //Refresh_TokenS-----------------------------------------------------------------------------------
    public async Task<TokenResponseDto?> RefreshTokensAsync(RefreshTokenRequestDto request)
    {
        var user = await ValidateRefreshTokenAsync(request.UserId, request.RefreshToken);
        if (user is null) return null;

        return await CreateTokenResponse(user);
    }
    //Refresh_TokenS-----------------------------------------------------------------------------------

    //Validate_Refresh_Token---------------------------------------------------------------------------
    private async Task<User?> ValidateRefreshTokenAsync(Guid userId, string refreshToken)
    {
        var user = await context.Users.FindAsync(userId);
        if (user is null || user.RefreshToken != refreshToken
            || user.RefreshTokenExpiryTime <= DateTime.UtcNow) return null;
        return user;
    }
    //Validate_Refresh_Token---------------------------------------------------------------------------

}
