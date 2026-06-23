using SchoolEventCenter.Module.Data.Domain.Enums;
namespace SchoolEvemtCenter.Module.SchoolEventsManagement.Application.DTOs.OrganizerDTOs;

public class SchoolEventStatusDto
{
    public Guid Id { get; set; }
    public EventStatus Status { get; set; }
}
