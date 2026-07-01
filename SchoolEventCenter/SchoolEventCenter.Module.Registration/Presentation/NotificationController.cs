using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using SchoolEventCenter.Module.Registrations.Application.Interface;

namespace SchoolEventCenter.Module.Registrations.Presentation;

[ApiController]
[Authorize]
[Route("api/notifications")]
public class NotificationController : ControllerBase
{
    private readonly INotificationQueryService notificationQuery;
    private readonly IHubContext<NotificationHub> notificationHub;

    public NotificationController(
        INotificationQueryService notificationQuery,
        IHubContext<NotificationHub> notificationHub)
    {
        this.notificationQuery = notificationQuery;
        this.notificationHub = notificationHub;
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

        await NotifyUnreadCountChanged(userId);

        return Ok(result.Value);
    }

    [HttpPost("read-all")]
    public async Task<ActionResult> MarkAllAsRead()
    {
        var userId = User.GetUserId();

        var result = await notificationQuery.MarkAllAsReadAsync(userId);

        if (!result.Success) return BadRequest(result.Error);

        await NotifyUnreadCountChanged(userId);

        return Ok(result.Value);
    }

    private async Task NotifyUnreadCountChanged(Guid userId)
    {
        var count = await notificationQuery.GetUnreadCountAsync(userId);
        if (!count.Success) return;

        await notificationHub.Clients
            .User(userId.ToString())
            .SendAsync("notificationsChanged", new { unreadCount = count.Value });
    }
}
