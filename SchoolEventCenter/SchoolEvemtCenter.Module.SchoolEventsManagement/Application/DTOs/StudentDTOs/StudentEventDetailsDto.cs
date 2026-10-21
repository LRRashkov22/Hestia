using SchoolEventCenter.Module.Data.Domain.Enums;

namespace SchoolEvemtCenter.Module.SchoolEventsManagement.Application.DTOs.StudentDTOs;

public class StudentEventDetailsDto
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DateTime StartsAt { get; set; }

    public DateTime EndsAt { get; set; }

    public string? Location { get; set; }

    public string? Url { get; set; }

    public string OrganizerName { get; set; } = string.Empty;

    public int Capacity { get; set; }

    public int Confirmed { get; set; }

    public int Waitlisted { get; set; }

    public RegistrationStatus? RegistrationStatus { get; set; }
}
