using Microsoft.EntityFrameworkCore;
using SchoolEventCenter.Module.Data.Domain.Entities;
using SchoolEventCenter.Module.Data.Domain.Enums;
using SchoolEventCenter.Module.Data.Persistance;
using SchoolEventCenter.Module.Data.Shared.Common;
using SchoolEventCenter.Module.Registrations.Application.DTOs;
using SchoolEventCenter.Module.Registrations.Application.Interface;
using System.Data;
namespace SchoolEventCenter.Module.Registrations.Application.Service;

public class RegistrationQueriesService : IRegistrationQueryService
{
    private readonly SECDbContext context;
    public RegistrationQueriesService(SECDbContext context)
    {
        this.context = context;
    }

    //Get Registration Page Information (Confirmed/Waitlisted/Search/Filter(By Event Existing Events)) (ORGANIZER PAGE) 
    public async Task<Result<List<OrganizerRegistrationDto>>> GetOrganizerRegistrationsAsync
   (Guid organizerId, RegistrationStatus status, string? search, Guid? eventId)
    {
        var query = context
            .Set<Registration>()
            .AsNoTracking()
            .Where(x =>
                x.SchoolEvent.OrganizerId == organizerId &&
                x.Status == status);

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x =>
                x.User.Username.Contains(search) ||
                x.User.Email.Contains(search));
        }

        if (eventId.HasValue)
        {
            query = query.Where(x =>
                x.SchoolEventId == eventId.Value);
        }

        var registrations = await query
            .OrderBy(x => x.WaitlistPosition)
            .Select(x => new OrganizerRegistrationDto
            {
                Username = x.User.Username,
                Email = x.User.Email,
                EventTitle = x.SchoolEvent.Title,
                RegisteredAt = x.RegisteredAt,

                WaitlistPosition =
                    x.Status == RegistrationStatus.Waitlisted
                    ? x.WaitlistPosition
                    : null
            })
            .ToListAsync();

        return Result<List<OrganizerRegistrationDto>>.Ok(registrations);
    }

    public async Task<Result<List<StudentUpcomingRegistrationDto>>>
    GetUpcomingRegistrationsAsync(Guid userId)
    {
        var registrations = await context
            .Set<Registration>()
            .AsNoTracking()
            .Where(x =>
                x.UserId == userId &&
                x.SchoolEvent.Status == EventStatus.Published &&
                x.SchoolEvent.StartsAt > DateTime.UtcNow)
            .OrderBy(x => x.SchoolEvent.StartsAt)
            .Take(4)
            .Select(x => new StudentUpcomingRegistrationDto
            {
                EventId = x.SchoolEventId,
                Title = x.SchoolEvent.Title,
                StartsAt = x.SchoolEvent.StartsAt,
                RegistrationStatus = x.Status,
                WaitlistPosition =
                    x.Status == RegistrationStatus.Waitlisted
                    ? x.WaitlistPosition
                    : null
            })
            .ToListAsync();

        return Result<List<StudentUpcomingRegistrationDto>>.Ok(registrations);
    }

    public async Task<Result<List<StudentRegistrationDto>>> GetMyRegistrationsAsync(Guid userId)
    {
        var registrations = await context
            .Set<Registration>()
            .AsNoTracking()
            .Where(x =>
                x.UserId == userId)
            .OrderBy(x =>
                x.SchoolEvent.StartsAt)
            .Select(x => new StudentRegistrationDto
            {
                EventId = x.SchoolEventId,
                Title = x.SchoolEvent.Title,
                RegisteredAt = x.RegisteredAt,
                StartsAt = x.SchoolEvent.StartsAt,
                RegistrationStatus = x.Status,
                WaitlistPosition =
                    x.Status == RegistrationStatus.Waitlisted
                    ? x.WaitlistPosition
                    : null
            })
            .OrderByDescending(x => x.RegisteredAt)
            .ToListAsync();

        return Result<List<StudentRegistrationDto>>.Ok(registrations);
    }
}
