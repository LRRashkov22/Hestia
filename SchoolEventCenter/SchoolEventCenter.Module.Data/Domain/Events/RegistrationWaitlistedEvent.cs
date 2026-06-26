namespace SchoolEventCenter.Module.Data.Domain.Events
{
    public sealed class RegistrationWaitlistedEvent : IDomainEvent
    {
        public Guid RegistrationId { get; init; }
        public Guid eventId { get; set; }
        public Guid userId { get; set; }
        public DateTime OccurredAt { get; set; }
        public int waitlistPosition { get; set; }
    }
}
