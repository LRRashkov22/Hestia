using SchoolEventCenter.Module.Data.Domain.Enums;

namespace SchoolEvemtCenter.Module.SchoolEventsManagement.Application.DTOs.OrganizerDTOs;

public class SchoolEventDetailDto
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DateTime StartsAt { get; set; }

    public DateTime EndsAt { get; set; }

    public int Capacity { get; set; }

    public string? Location { get; set; }

    public string? Url { get; set; }

    public EventStatus Status { get; set; }
}
