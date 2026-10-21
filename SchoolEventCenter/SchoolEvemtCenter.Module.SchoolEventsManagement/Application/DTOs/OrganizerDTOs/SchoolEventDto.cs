namespace SchoolEvemtCenter.Module.SchoolEventsManagement.Application.DTOs.OrganizerDTOs;

public class SchoolEventDto
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;
    // public EventStatus? Status { get; set; }
    public bool Publish { get; set; }
    public DateTime StartsAt { get; set; }

    public DateTime EndsAt { get; set; }

    public int Capacity { get; set; }

    public string? Location { get; set; }

    public string? Url { get; set; }

    // Organizer

    //public Guid? OrganizerId { get; set; }

    //public User? Organizer { get; set; }


    // Registrations

    // public ICollection<Registration> Registrations { get; set; } = [];
}
