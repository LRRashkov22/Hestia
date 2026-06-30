using Microsoft.EntityFrameworkCore;
using SchoolEventCenter.Module.Data.Domain.Entities;
using SchoolEventCenter.Module.Data.Persistance;
using SchoolEventCenter.Module.Data.Shared.Common;
using SchoolEventCenter.Module.Registrations.Application.DTOs;
using SchoolEventCenter.Module.Registrations.Application.Interface;

namespace SchoolEventCenter.Module.Registrations.Application.Service;

// Codex added notification API service implementation - start
public class NotificationQueryService : INotificationQueryService
{
    private readonly SECDbContext context;

    public NotificationQueryService(SECDbContext context)
    {
        this.context = context;
    }

    public async Task<Result<List<NotificationDto>>> GetMyNotificationsAsync(Guid userId)
    {
        var notifications = await context.Set<Notification>()
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new NotificationDto
            {
                Id = x.Id,
                Type = x.Type,
                Title = x.Title,
                Message = x.Message,
                IsRead = x.IsRead,
                CreatedAt = x.CreatedAt,
                ReadAt = x.ReadAt
            })
            .ToListAsync();

        return Result<List<NotificationDto>>.Ok(notifications);
    }

    public async Task<Result<int>> GetUnreadCountAsync(Guid userId)
    {
        var count = await context.Set<Notification>()
            .AsNoTracking()
            .CountAsync(x => x.UserId == userId && !x.IsRead);

        return Result<int>.Ok(count);
    }

    public async Task<Result<bool>> MarkAsReadAsync(Guid userId, Guid notificationId)
    {
        var notification = await context.Set<Notification>()
            .FirstOrDefaultAsync(x => x.Id == notificationId && x.UserId == userId);

        if (notification is null)
            return Result<bool>.Fail("Notification not found");

        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;

        await context.SaveChangesAsync();

        return Result<bool>.Ok(true);
    }

    public async Task<Result<bool>> MarkAllAsReadAsync(Guid userId)
    {
        var notifications = await context.Set<Notification>()
            .Where(x => x.UserId == userId && !x.IsRead)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
        }

        await context.SaveChangesAsync();

        return Result<bool>.Ok(true);
    }
}
// Codex added notification API service implementation - end
