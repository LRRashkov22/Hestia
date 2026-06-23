using SchoolEventCenter.Module.Data.Domain.Enums;

namespace SchoolEvemtCenter.Module.SchoolEventsManagement.Application.DTOs.StudentDTOs;

public class StudentUpcomingEventDto
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public DateTime StartsAt { get; set; }

    public DateTime EndsAt { get; set; }

    public string? Location { get; set; }

    public int Confirmed { get; set; }

    public int Capacity { get; set; }

    public RegistrationStatus? RegistrationStatus { get; set; }
}
