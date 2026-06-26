using SchoolEventCenter.Module.Data.Domain.Enums;

namespace SchoolEventCenter.Module.Registrations.Application.DTOs;

public class StudentRegistrationDto
{
    public Guid EventId { get; set; }

    public string Title { get; set; } = string.Empty;

    public DateTime RegisteredAt { get; set; }

    public DateTime StartsAt { get; set; }

    public RegistrationStatus RegistrationStatus { get; set; }

    public int? WaitlistPosition { get; set; }
}
