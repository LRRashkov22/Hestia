using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolEventCenter.Module.Data.Domain.Enums;
using SchoolEventCenter.Module.Registrations.Application.Interface;
using SchoolEventCenter.Module.Registrations.Application.Service;
using System.Security.Claims;

namespace SchoolEventCenter.Module.Registrations.Presentation;

[ApiController]
[Route("api")]
public class RegistrationController : ControllerBase
{
    private readonly RegistrationService registrationService;

    private readonly IRegistrationQueryService registrationQuery;

    public RegistrationController(
        RegistrationService registrationService,
        IRegistrationQueryService registrationQuery)
    {
        this.registrationService = registrationService;
        this.registrationQuery = registrationQuery;
    }

    [Authorize(Roles = "Student")]
    [HttpPost("events/{eventId:guid}/registrations")]
    public async Task<ActionResult> Register(Guid eventId)
    {
        var userId = User.GetUserId();

        var result = await registrationService
            .RegisterAsync(eventId, userId);

        if (!result.Success) return BadRequest(result.Error);

        return Ok(result.Value);
    }

    [Authorize(Roles = "Student")]
    [HttpDelete("events/{eventId:guid}/registrations")]
    public async Task<ActionResult> Cancel(Guid eventId)
    {
        var userId = User.GetUserId();

        var result = await registrationService
            .CancelRegistrationAsync(eventId, userId);

        if (!result.Success) return BadRequest(result.Error);

        return Ok(result.Value);
    }

    [Authorize(Roles = "Student")]
    [HttpGet("dashboard/upcoming")]
    public async Task<ActionResult> GetUpcoming()
    {
        var userId = User.GetUserId();

        var result = await registrationQuery.GetUpcomingRegistrationsAsync(userId);

        if (!result.Success)
            return BadRequest(result.Error);

        return Ok(result.Value);
    }

    [Authorize(Roles = "Student")]
    [HttpGet("me")]
    public async Task<ActionResult> GetMyRegistrations()
    {
        var userId = User.GetUserId();

        var result = await registrationQuery
            .GetMyRegistrationsAsync(userId);

        if (!result.Success) return BadRequest(result.Error);

        return Ok(result.Value);
    }

    [Authorize(Roles = "Organizer")]
    [HttpGet("organizer")]
    public async Task<ActionResult> GetOrganizerRegistrations(
        [FromQuery] RegistrationStatus status,
        [FromQuery] string? search,
        [FromQuery] Guid? eventId)
    {
        var organizerId = User.GetUserId();

        var result = await registrationQuery
            .GetOrganizerRegistrationsAsync(
                organizerId,
                status,
                search,
                eventId);

        if (!result.Success) return BadRequest(result.Error);

        return Ok(result.Value);
    }

}
public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        return Guid.Parse(user.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    }
}

