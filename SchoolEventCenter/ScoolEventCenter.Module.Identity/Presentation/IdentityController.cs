using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ScoolEventCenter.Module.Identity.Application.DTOs;
using ScoolEventCenter.Module.Identity.Application.Interfaces;
using System.Security.Claims;
namespace ScoolEventCenter.Module.Identity.Presentation;

[ApiController]
[Route("api/identity")]
public class IdentityController : ControllerBase
{
    private readonly IAuthService AuthService;

    public IdentityController(IAuthService AuthService)
    {
        this.AuthService = AuthService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<TokenResponseDto>> login(UserDto request)
    {
        var (result, error) = await AuthService.LoginAsync(request);
        if (error != null) return BadRequest(error);
        return Ok(result);
    }


    [HttpPost("refresh-token")]
    public async Task<ActionResult<TokenResponseDto>> RefreshToken(RefreshTokenRequestDto requestDto)
    {
        var result = await AuthService.RefreshTokensAsync(requestDto);
        if (result is null) return Unauthorized("Invalid refresh token");
        return Ok(result);
    }

    [HttpPost("create-user")]
    public async Task<ActionResult> CreateUser(CreateUserDto request)
    {
        var result = await AuthService.RegisterUser(request);
        return NoContent();
    }


    [Authorize]
    [HttpPost("change-password")]
    public async Task<ActionResult<TokenResponseDto>> ChangePassword(ChangePasswordDto request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var (result, error) = await AuthService.ChangePassword(request, userId);
        if (error != null) return BadRequest(error);
        return Ok(result);
    }


    [Authorize(Roles = "Organizer, Student")]
    [HttpPost("logout")]
    public async Task<ActionResult> Logout()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        await AuthService.Logout(userId);
        return NoContent();
    }

    [Authorize(Roles = "Organizer")]
    [HttpGet("Admin-only")]
    public IActionResult AdminOnlyEndpoint()
    {
        return Ok("You are Admin.");
    }
}