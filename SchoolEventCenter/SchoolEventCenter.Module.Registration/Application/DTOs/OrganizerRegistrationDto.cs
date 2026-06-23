namespace SchoolEventCenter.Module.Registrations.Application.DTOs;

public class OrganizerRegistrationDto
{
    public string Username { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string EventTitle { get; set; } = string.Empty;

    public DateTime RegisteredAt { get; set; }

    public int? WaitlistPosition { get; set; }
}
