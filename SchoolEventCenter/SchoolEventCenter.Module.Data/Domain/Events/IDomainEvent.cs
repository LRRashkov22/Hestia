namespace SchoolEventCenter.Module.Data.Domain.Events;

public interface IDomainEvent
{
    Guid eventId { get; set; }
    DateTime OccurredAt { get; set; }
}
