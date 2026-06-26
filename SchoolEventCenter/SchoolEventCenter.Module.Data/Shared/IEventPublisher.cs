using SchoolEventCenter.Module.Data.Domain.Events;

namespace SchoolEventCenter.Module.Data.Shared;

public interface IEventPublisher
{
    Task PublishAsync(IDomainEvent domainEvent);
}
