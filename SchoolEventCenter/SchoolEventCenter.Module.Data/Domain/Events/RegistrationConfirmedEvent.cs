namespace SchoolEventCenter.Module.Data.Domain.Events;

public sealed class RegistrationConfirmedEvent : IDomainEvent
{
    public Guid RegistrationId { get; init; }
    public Guid eventId { get; set; }
    public Guid userId { get; set; }
    public DateTime OccurredAt { get; set; }
}
