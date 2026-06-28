using SchoolEventCenter.Module.Data.Domain.Enums;

namespace SchoolEventCenter.Module.Registrations.Application.DTOs;

public class RegistrationResponseDto
{
    public Guid RegistrationId { get; set; }

    public RegistrationStatus Status { get; set; }

    public int? WaitlistPosition { get; set; }
}
