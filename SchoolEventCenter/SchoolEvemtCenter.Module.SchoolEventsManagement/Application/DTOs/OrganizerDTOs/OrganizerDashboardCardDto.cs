namespace SchoolEvemtCenter.Module.SchoolEventsManagement.Application.DTOs.OrganizerDTOs;

public class OrganizerDashboardCardDto
{
    public int TotalEvents { get; set; }
    public int Published { get; set; }
    public int Drafts { get; set; }
    public int Cancelled { get; set; }
    public int Registrations { get; set; }
    public int Waitlisted { get; set; }

}
