using SchoolEventCenter.Module.Data.Shared.Common;
using SchoolEventCenter.Module.Registrations.Application.DTOs;
namespace SchoolEventCenter.Module.Registrations.Application.Interface;

public interface IRegistrationService
{
    Task<Result<RegistrationResponseDto>> RegisterAsync(Guid eventId, Guid userId);

    Task<Result<RegistrationResponseDto>> CancelRegistrationAsync(Guid eventId, Guid userId);

    //Task<Result<List<RegistrationListDto>>> GetMyRegistrationsAsync(Guid userId);

    // Task<Result<List<RegistrationListDto>>> GetWaitlistAsync(Guid eventId);
}
