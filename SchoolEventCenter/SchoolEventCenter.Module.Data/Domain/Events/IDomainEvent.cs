namespace SchoolEventCenter.Module.Data.Domain.Events;

public interface IDomainEvent
{
    Guid EventId { get; }
    DateTime OccurredAt { get; }
    string RoutingKey { get; }
}
