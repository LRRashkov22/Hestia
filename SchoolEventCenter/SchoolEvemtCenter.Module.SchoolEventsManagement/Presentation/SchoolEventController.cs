using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolEvemtCenter.Module.SchoolEventsManagement.Application.DTOs.OrganizerDTOs;
using SchoolEvemtCenter.Module.SchoolEventsManagement.Application.Interfaces;
using SchoolEventCenter.Module.Data.Domain.Enums;
using System.Security.Claims;
namespace SchoolEvemtCenter.Module.SchoolEventsManagement.Presentation;

[ApiController]
[Route("api/events")]
public class SchoolEventController : ControllerBase
{
    private readonly ISchoolEventCRUDService schoolEvent;
    private readonly ISchoolEventQueryService querySchoolEvent;
    private readonly IStudentEventQueryService studentQuerySchoolEvent;
    public SchoolEventController(
        ISchoolEventCRUDService schoolEvent,
        ISchoolEventQueryService querySchoolEvent,
        IStudentEventQueryService studentQuerySchoolEvent)
    {
        this.schoolEvent = schoolEvent;
        this.querySchoolEvent = querySchoolEvent;
        this.studentQuerySchoolEvent = studentQuerySchoolEvent;
    }

    [Authorize(Roles = "Organizer")]
    [HttpPost]
    public async Task<ActionResult> CreateEvent(SchoolEventDto request)
    {
        var userId = User.GetUserId();
        var result = await schoolEvent.CreateSchoolEventAsync(request, userId);
        if (!result.Success) return BadRequest(result.Error);
        return Ok(result.Value);
    }

    [Authorize(Roles = "Organizer")]
    [HttpPut("{eventId:guid}")]
    public async Task<ActionResult> UpdateEvent(Guid eventId, SchoolEventDto request)
    {
        var result = await schoolEvent.UpdateSchoolEventAsync(eventId, request);
        if (!result.Success) return BadRequest(result.Error);
        return Ok(result.Value);
    }


    [Authorize(Roles = "Organizer")]
    [HttpPost("{eventId:guid}/publish")]
    public async Task<ActionResult> PublishEvent(Guid eventId)
    {
        var result = await schoolEvent.PublisSchoolEventAsync(eventId);
        if (!result.Success) return BadRequest(result.Error);
        return Ok(result.Value);
    }

    [Authorize(Roles = "Organizer")]
    [HttpPost("{eventId:guid}/cancel")]
    public async Task<ActionResult> CancelEvent(Guid eventId)
    {
        var result = await schoolEvent.CancelSchoolEventAsync(eventId);
        if (!result.Success) return BadRequest(result.Error);
        return Ok(result.Value);
    }

    [Authorize(Roles = "Organizer")]
    [HttpGet]
    public async Task<ActionResult> GetEvents(
    [FromQuery] EventStatus? status,
    [FromQuery] string? search)
    {
        var userId = User.GetUserId();
        var result = await schoolEvent.GetSchoolEventListAsync(userId, status, search);
        if (!result.Success) return BadRequest(result.Error);
        return Ok(result.Value);
    }

    [Authorize(Roles = "Organizer")]
    [HttpGet("{eventId:guid}")]
    public async Task<ActionResult> GetEvent(Guid eventId)
    {
        var result = await schoolEvent.GetSchoolEventOnEditAsync(eventId);
        if (!result.Success) return NotFound(result.Error);
        return Ok(result.Value);
    }

    [Authorize(Roles = "Organizer")]
    [HttpGet("organizer/dashboard/cards")]
    public async Task<ActionResult> GetOrganizerDashboardCard()
    {
        var userId = User.GetUserId();
        var result = await querySchoolEvent.OrganizerDashboardCardInformation(userId);
        if (!result.Success) return NotFound(result.Error);
        return Ok(result.Value);
    }

    [Authorize(Roles = "Organizer")]
    [HttpGet("organizer/dashboard/events")]
    public async Task<ActionResult> GetOrganizerDashboardEvents()
    {
        var userId = User.GetUserId();
        var result = await querySchoolEvent.OrganizerDashboardEventsInformation(userId);
        if (!result.Success) return NotFound(result.Error);
        return Ok(result.Value);
    }

    [Authorize(Roles = "Student")]
    [HttpGet("student/dashboard/cards")]
    public async Task<ActionResult> GetStudentDashboardCard()
    {
        var userId = User.GetUserId();
        var result = await studentQuerySchoolEvent.GetStudentDashboardCardsAsync(userId);
        if (!result.Success) return NotFound(result.Error);
        return Ok(result.Value);
    }
    [Authorize(Roles = "Student")]
    [HttpGet("student/dashboard/upcoming/events")]
    public async Task<ActionResult> GetStudentDashboardEvents()
    {
        var userId = User.GetUserId();
        var result = await studentQuerySchoolEvent.GetUpcomingEventsAsync(userId);
        if (!result.Success) return NotFound(result.Error);
        return Ok(result.Value);
    }
    [Authorize(Roles = "Student")]
    [HttpGet("student/event/preview")]
    public async Task<ActionResult> GetStudentEvents()
    {
        var userId = User.GetUserId();
        var result = await studentQuerySchoolEvent.GetAvailableEventsAsync(userId);
        if (!result.Success) return NotFound(result.Error);
        return Ok(result.Value);
    }
    [Authorize(Roles = "Student")]
    [HttpGet("student/events/details/{eventId:guid}")]
    public async Task<ActionResult> GetStudentEventsDetails([FromRoute] Guid eventId)
    {
        var userId = User.GetUserId();
        var result = await studentQuerySchoolEvent.GetEventDetailsAsync(eventId, userId);
        if (!result.Success) return NotFound(result.Error);
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