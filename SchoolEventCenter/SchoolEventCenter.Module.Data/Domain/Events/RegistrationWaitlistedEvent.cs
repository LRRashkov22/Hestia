namespace SchoolEventCenter.Module.Data.Domain.Events
{
    public sealed class RegistrationWaitlistedEvent : IDomainEvent
    {
        public Guid RegistrationId { get; init; }
        public Guid EventId { get; init; }
        public Guid userId { get; init; }
        public DateTime OccurredAt { get; init; }
        public int waitlistPosition { get; init; }
        public string RoutingKey => "registration.waitlisted";
    }
}
