using SchoolEventCenter.Module.Data.Domain.Enums;
using SchoolEventCenter.Module.Data.Shared.Common;
using SchoolEventCenter.Module.Registrations.Application.DTOs;

namespace SchoolEventCenter.Module.Registrations.Application.Interface;

public interface IRegistrationQueryService
{
    Task<Result<List<OrganizerRegistrationDto>>> GetOrganizerRegistrationsAsync
   (Guid organizerId, RegistrationStatus status, string? search, Guid? eventId);
    Task<Result<List<StudentRegistrationDto>>> GetMyRegistrationsAsync(Guid userId);
    Task<Result<List<StudentUpcomingRegistrationDto>>> GetUpcomingRegistrationsAsync(Guid userId);
}


