using SchoolEventCenter.Module.Data.Domain.Enums;

namespace SchoolEvemtCenter.Module.SchoolEventsManagement.Application.DTOs.OrganizerDTOs;

public class OrganizerDashboardEventsDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public EventStatus Status { get; set; }
    public int ConfirmedRegistrations { get; set; }
    public int WaitlistedRegistrations { get; set; }
    public int Capacity { get; set; }
    public DateTime StartsAt { get; set; }
}
