using SchoolEvemtCenter.Module.SchoolEventsManagement.Application.DTOs.StudentDTOs;
using SchoolEventCenter.Module.Data.Shared.Common;

namespace SchoolEvemtCenter.Module.SchoolEventsManagement.Application.Interfaces;

public interface IStudentEventQueryService
{
    Task<Result<StudentDashboardCardsDto>> GetStudentDashboardCardsAsync(Guid userId);
    Task<Result<List<StudentUpcomingEventDto>>> GetUpcomingEventsAsync(Guid userId);
    Task<Result<List<StudentEventPreviewDto>>> GetAvailableEventsAsync(Guid userId);
    Task<Result<StudentEventDetailsDto>> GetEventDetailsAsync(Guid eventId, Guid userId);
}
