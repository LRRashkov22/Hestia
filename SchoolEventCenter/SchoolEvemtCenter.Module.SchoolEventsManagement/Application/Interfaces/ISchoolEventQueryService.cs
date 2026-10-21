using SchoolEvemtCenter.Module.SchoolEventsManagement.Application.DTOs.OrganizerDTOs;
using SchoolEventCenter.Module.Data.Shared.Common;

namespace SchoolEvemtCenter.Module.SchoolEventsManagement.Application.Interfaces;

public interface ISchoolEventQueryService
{
    Task<Result<OrganizerDashboardCardDto>> OrganizerDashboardCardInformation(Guid userId);

    Task<Result<List<OrganizerDashboardEventsDto>>> OrganizerDashboardEventsInformation(Guid userId);
}
