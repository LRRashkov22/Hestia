namespace SchoolEventCenter.Infrastructure.Email;

public sealed class RegistrationEmailData
{
    public string Email { get; init; } = "";
    public string EventTitle { get; init; } = "";
    public DateTime StartsAt { get; init; }
}


