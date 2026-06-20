using SchoolEventCenter.Module.Data.Domain.Enums;

namespace SchoolEventCenter.Module.Data.Domain.Entities
{
    public class Registration
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public User User { get; set; }


        public Guid SchoolEventId { get; set; }

        public SchoolEvent SchoolEvent { get; set; }


        public RegistrationStatus Status { get; set; }

        public DateTime RegisteredAt { get; set; }

        public int? WaitlistPosition { get; set; }

        public DateTime? CancelledAt { get; set; }
    }
}
