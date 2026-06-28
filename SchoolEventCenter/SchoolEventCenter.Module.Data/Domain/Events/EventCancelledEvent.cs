namespace SchoolEventCenter.Module.Data.Domain.Events;

public sealed class EventCancelledEvent : IDomainEvent
{
    public Guid EventId { get; init; }
    public DateTime OccurredAt { get; init; }
    public string RoutingKey => "registration.cancelled";
}
