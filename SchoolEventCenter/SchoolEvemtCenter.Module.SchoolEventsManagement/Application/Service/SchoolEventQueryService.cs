using Microsoft.EntityFrameworkCore;
using SchoolEvemtCenter.Module.SchoolEventsManagement.Application.DTOs.OrganizerDTOs;
using SchoolEvemtCenter.Module.SchoolEventsManagement.Application.Interfaces;
using SchoolEventCenter.Module.Data.Domain.Entities;
using SchoolEventCenter.Module.Data.Domain.Enums;
using SchoolEventCenter.Module.Data.Persistance;
using SchoolEventCenter.Module.Data.Shared.Common;

namespace SchoolEvemtCenter.Module.SchoolEventsManagement.Application.Service;


//This Service handle all get request for School events (organizer) only 

public class SchoolEventQueryService : ISchoolEventQueryService
{
    private readonly SECDbContext context;
    public SchoolEventQueryService(SECDbContext context)
    {
        this.context = context;
    }

    //Get Information For Cards In Organizer Dashboard page
    public async Task<Result<OrganizerDashboardCardDto>> OrganizerDashboardCardInformation(Guid userId)
    {
        var events = await context.Set<SchoolEvent>()
            .AsNoTracking()
            .Where(x => x.OrganizerId == userId)
            .ToListAsync();

        var confirmedRegistrations = await context.Set<Registration>()
            .AsNoTracking()
            .CountAsync(x =>
                x.SchoolEvent.OrganizerId == userId &&
                x.Status == RegistrationStatus.Confirmed);

        var waitlistedRegistrations = await context.Set<Registration>()
            .AsNoTracking()
            .CountAsync(x =>
                x.SchoolEvent.OrganizerId == userId &&
                x.Status == RegistrationStatus.Waitlisted);

        var Dashboard = new OrganizerDashboardCardDto
        {
            TotalEvents = events.Count(),
            Published = events.Count(x => x.Status == EventStatus.Published),
            Drafts = events.Count(x => x.Status == EventStatus.Draft),
            Cancelled = events.Count(x => x.Status == EventStatus.Cancelled),
            Registrations = confirmedRegistrations,
            Waitlisted = waitlistedRegistrations
        };
        return Result<OrganizerDashboardCardDto>.Ok(Dashboard);
    }

    //Get Information For Events Preview List In Organizer Dashboard page
    public async Task<Result<List<OrganizerDashboardEventsDto>>> OrganizerDashboardEventsInformation(Guid userId)
    {
        var events = await context.SchoolEvents
            .AsNoTracking()
            .Where(x => x.OrganizerId == userId)
            .OrderBy(x => x.StartsAt)
            .Select(x => new OrganizerDashboardEventsDto
            {
                Id = x.Id,
                Title = x.Title,
                Status = x.Status,
                ConfirmedRegistrations = x.Registrations
                    .Count(r => r.Status == RegistrationStatus.Confirmed),
                WaitlistedRegistrations = x.Registrations
                    .Count(r => r.Status == RegistrationStatus.Waitlisted),
                Capacity = x.Capacity,
                StartsAt = x.StartsAt
            })
            .ToListAsync();

        return Result<List<OrganizerDashboardEventsDto>>.Ok(events);
    }

}
