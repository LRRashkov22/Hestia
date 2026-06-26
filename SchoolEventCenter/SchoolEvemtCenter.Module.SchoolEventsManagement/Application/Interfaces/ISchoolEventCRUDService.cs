using SchoolEvemtCenter.Module.SchoolEventsManagement.Application.DTOs.OrganizerDTOs;
using SchoolEventCenter.Module.Data.Domain.Enums;
using SchoolEventCenter.Module.Data.Shared.Common;

namespace SchoolEvemtCenter.Module.SchoolEventsManagement.Application.Interfaces;

public interface ISchoolEventCRUDService
{
    Task<Result<Guid>> CreateSchoolEventAsync(SchoolEventDto request, Guid userId);
    Task<Result<bool>> UpdateSchoolEventAsync(Guid eventId, SchoolEventDto request);
    Task<Result<bool>> PublisSchoolEventAsync(Guid eventId);
    Task<Result<bool>> CancelSchoolEventAsync(Guid eventId);
    Task<Result<List<SchoolEventListDto>>> GetSchoolEventListAsync
        (Guid userid, EventStatus? status, string? search);
    Task<Result<SchoolEventDetailDto>> GetSchoolEventOnEditAsync(Guid eventid);

}
