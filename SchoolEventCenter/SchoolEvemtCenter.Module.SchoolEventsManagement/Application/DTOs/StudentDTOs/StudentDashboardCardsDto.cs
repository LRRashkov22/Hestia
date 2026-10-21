namespace SchoolEvemtCenter.Module.SchoolEventsManagement.Application.DTOs.StudentDTOs;

public class StudentDashboardCardsDto
{
    public int TotalEvents { get; set; }

    public int Registered { get; set; }

    public int Waitlisted { get; set; }

    public int Notifications { get; set; }
}
