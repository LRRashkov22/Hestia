using SchoolEventCenter.Module.Data.Domain.Enums;

namespace SchoolEventCenter.Module.Registrations.Application.DTOs;

// Codex added notification API DTO - start
public class NotificationDto
{
    public Guid Id { get; set; }

    public NotificationType Type { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? ReadAt { get; set; }
}
// Codex added notification API DTO - end
