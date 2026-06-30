using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolEventCenter.Module.Registrations.Application.Interface;

namespace SchoolEventCenter.Module.Registrations.Presentation;

// Codex added notification API controller - start
[ApiController]
[Authorize]
[Route("api/notifications")]
public class NotificationController : ControllerBase
{
    private readonly INotificationQueryService notificationQuery;

    public NotificationController(INotificationQueryService notificationQuery)
    {
        this.notificationQuery = notificationQuery;
    }

    [HttpGet]
    public async Task<ActionResult> GetMine()
    {
        var userId = User.GetUserId();

        var result = await notificationQuery.GetMyNotificationsAsync(userId);

        if (!result.Success) return BadRequest(result.Error);

        return Ok(result.Value);
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult> GetUnreadCount()
    {
        var userId = User.GetUserId();

        var result = await notificationQuery.GetUnreadCountAsync(userId);

        if (!result.Success) return BadRequest(result.Error);

        return Ok(result.Value);
    }

    [HttpPost("{notificationId:guid}/read")]
    public async Task<ActionResult> MarkAsRead(Guid notificationId)
    {
        var userId = User.GetUserId();

        var result = await notificationQuery.MarkAsReadAsync(userId, notificationId);

        if (!result.Success) return NotFound(result.Error);

        return Ok(result.Value);
    }

    [HttpPost("read-all")]
    public async Task<ActionResult> MarkAllAsRead()
    {
        var userId = User.GetUserId();

        var result = await notificationQuery.MarkAllAsReadAsync(userId);

        if (!result.Success) return BadRequest(result.Error);

        return Ok(result.Value);
    }
}
// Codex added notification API controller - end
