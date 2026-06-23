using SchoolEventCenter.Module.Data.Domain.Entities;
using SchoolEventCenter.Module.Data.Domain.Enums;

namespace SchoolEvemtCenter.Module.SchoolEventsManagement.Application.DTOs.OrganizerDTOs;

public class SchoolEventListDto
{
    public string Title { get; set; } = string.Empty;
    public EventStatus Status { get; set; }
    public int Capacity { get; set; }
    public DateTime StartsAt { get; set; }
    public int Confirmed { get; set; }
    public int Waitlisted { get; set; }
}
