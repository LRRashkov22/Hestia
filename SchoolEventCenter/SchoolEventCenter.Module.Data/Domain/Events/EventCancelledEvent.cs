namespace SchoolEventCenter.Module.Data.Domain.Events;

public sealed class EventCancelledEvent : IDomainEvent
{
    public Guid eventId { get; set; }
    public DateTime OccurredAt { get; set; }
}
