using SchoolEventCenter.Module.Data.Shared.Common;
using SchoolEventCenter.Module.Registrations.Application.DTOs;

namespace SchoolEventCenter.Module.Registrations.Application.Interface;

// Codex added notification API service contract - start
public interface INotificationQueryService
{
    Task<Result<List<NotificationDto>>> GetMyNotificationsAsync(Guid userId);

    Task<Result<int>> GetUnreadCountAsync(Guid userId);

    Task<Result<bool>> MarkAsReadAsync(Guid userId, Guid notificationId);

    Task<Result<bool>> MarkAllAsReadAsync(Guid userId);
}
// Codex added notification API service contract - end
