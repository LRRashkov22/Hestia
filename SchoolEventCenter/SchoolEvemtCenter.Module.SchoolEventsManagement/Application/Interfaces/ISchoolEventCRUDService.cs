using SchoolEvemtCenter.Module.SchoolEventsManagement.Application.DTOs.OrganizerDTOs;
using SchoolEventCenter.Module.Data.Domain.Entities;
using SchoolEventCenter.Module.Data.Domain.Enums;
using SchoolEventCenter.Module.Data.Shared.Common;

namespace SchoolEvemtCenter.Module.SchoolEventsManagement.Application.Interfaces;

public interface ISchoolEventCRUDService
{
    Task<Result<SchoolEvent>> CreateSchoolEventAsync(SchoolEventDto request, Guid userId);
    Task<Result<SchoolEvent>> UpdateSchoolEventAsync(Guid eventId, SchoolEventDto request);
    Task<Result<SchoolEvent>> PublisSchoolEventAsync(Guid eventId);
    Task<Result<SchoolEvent>> CancelSchoolEventAsync(Guid eventId);
    Task<Result<List<SchoolEventListDto>>> GetSchoolEventListAsync
        (Guid userid, EventStatus? status, string? search);
    Task<Result<SchoolEventDetailDto>> GetSchoolEventOnEditAsync(Guid eventid);

}
