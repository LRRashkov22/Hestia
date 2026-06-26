using SchoolEventCenter.Module.Data.Domain.Entities;
using SchoolEventCenter.Module.Data.Shared.Common;
namespace SchoolEventCenter.Module.Registrations.Application.Interface;

public interface IRegistrationService
{
    Task<Result<Registration>> RegisterAsync(Guid eventId, Guid userId);

    Task<Result<Registration>> CancelRegistrationAsync(Guid eventId, Guid userId);

    //Task<Result<List<RegistrationListDto>>> GetMyRegistrationsAsync(Guid userId);

    // Task<Result<List<RegistrationListDto>>> GetWaitlistAsync(Guid eventId);
}
