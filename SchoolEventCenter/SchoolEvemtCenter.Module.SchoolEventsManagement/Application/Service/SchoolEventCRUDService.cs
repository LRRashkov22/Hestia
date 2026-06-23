using Microsoft.EntityFrameworkCore;
using SchoolEvemtCenter.Module.SchoolEventsManagement.Application.DTOs.OrganizerDTOs;
using SchoolEvemtCenter.Module.SchoolEventsManagement.Application.Interfaces;
using SchoolEventCenter.Module.Data.Domain.Entities;
using SchoolEventCenter.Module.Data.Domain.Enums;
using SchoolEventCenter.Module.Data.Persistance;
using SchoolEventCenter.Module.Data.Shared.Common;
namespace SchoolEvemtCenter.Module.SchoolEventsManagement.Application.Service;

//This Service handle all CRUD request for School events (organizer) only 
public class SchoolEventCRUDService : ISchoolEventCRUDService
{
    private readonly SECDbContext context;
    public SchoolEventCRUDService(SECDbContext context)
    {
        this.context = context;
    }


    //Create_School_Event-------------------------------------------------------------
    public async Task<Result<SchoolEvent>> CreateSchoolEventAsync(SchoolEventDto request, Guid userId)
    {
        var organizer = await context.Set<User>().FirstOrDefaultAsync(x => x.Id == userId && x.Role == UserRole.Organizer);
        if (organizer is null) return Result<SchoolEvent>.Fail("User not found");
        var School_event = new SchoolEvent
        {
            Title = request.Title,
            Description = request.Description,
            StartsAt = request.StartsAt,
            EndsAt = request.EndsAt,
            Capacity = request.Capacity,
            Location = request.Location,
            Url = request.Url,
            Status = request.Publish ? EventStatus.Published : EventStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            OrganizerId = organizer.Id,
            //Registrations = request.Registrations,
        };
        context.SchoolEvents.Add(School_event);
        await context.SaveChangesAsync();
        return Result<SchoolEvent>.Ok(School_event);
    }
    //Create_School_Event-------------------------------------------------------------

    //Update_School_Event-------------------------------------------------------------
    public async Task<Result<SchoolEvent>> UpdateSchoolEventAsync(Guid eventId, SchoolEventDto request)
    {
        var schoolEvent = await context.SchoolEvents.FirstOrDefaultAsync(x => x.Id == eventId);

        if (schoolEvent is null) return Result<SchoolEvent>.Fail("Event not found");

        if (schoolEvent.Status != EventStatus.Draft) return Result<SchoolEvent>.Fail("Only draft events can be edited");

        schoolEvent.Title = request.Title;
        schoolEvent.Description = request.Description;
        schoolEvent.Capacity = request.Capacity;
        schoolEvent.StartsAt = request.StartsAt;
        schoolEvent.EndsAt = request.EndsAt;
        schoolEvent.Status = request.Publish ? EventStatus.Published : EventStatus.Draft;
        schoolEvent.Location = request.Location;
        schoolEvent.Url = request.Url;

        await context.SaveChangesAsync();
        return Result<SchoolEvent>.Ok(schoolEvent);
    }
    //Update_School_Event-------------------------------------------------------------

    //Publish_School_Event-------------------------------------------------------------
    public async Task<Result<SchoolEvent>> PublisSchoolEventAsync(Guid eventId)
    {
        var schoolEvent = await context.Set<SchoolEvent>().FirstOrDefaultAsync(x => x.Id == eventId);

        if (schoolEvent is null) return Result<SchoolEvent>.Fail("Event not found");

        if (schoolEvent.Status != EventStatus.Draft) return Result<SchoolEvent>.Fail("Only draft events can be published");

        schoolEvent.Status = EventStatus.Published;
        await context.SaveChangesAsync();
        return Result<SchoolEvent>.Ok(schoolEvent);
    }
    //Publish_School_Event-------------------------------------------------------------

    //Cancel_School_Event-------------------------------------------------------------
    public async Task<Result<SchoolEvent>> CancelSchoolEventAsync(Guid eventId)
    {
        var schoolEvent = await context.Set<SchoolEvent>().FirstOrDefaultAsync(x => x.Id == eventId);

        if (schoolEvent is null) return Result<SchoolEvent>.Fail("Event not found");

        schoolEvent.Status = EventStatus.Cancelled;
        await context.SaveChangesAsync();
        return Result<SchoolEvent>.Ok(schoolEvent);
    }
    //Cancel_School_Event-------------------------------------------------------------

    //Get_School_Events_List-------------------------------------------------------------
    public async Task<Result<List<SchoolEventListDto>>> GetSchoolEventListAsync
        (Guid userid, EventStatus? status, string? search)
    {
        var query = context.SchoolEvents
                .AsNoTracking()
                .Where(x =>
                x.OrganizerId == userid &&
                x.EndsAt > DateTime.UtcNow);

        if (status.HasValue)
        {
            query = query.Where(x => x.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim();
            query = query.Where(x =>
                x.Title.Contains(search) ||
                (x.Location != null &&
                x.Location.Contains(search)));
        }

        var events = await query
            .OrderBy(x => x.StartsAt)
            .Select(x => new SchoolEventListDto
            {
                Title = x.Title,
                Status = x.Status,
                Capacity = x.Capacity,
                Confirmed = x.Registrations
                    .Count(r =>
                        r.Status == RegistrationStatus.Confirmed),
                Waitlisted = x.Registrations
                    .Count(r =>
                        r.Status == RegistrationStatus.Waitlisted),
                StartsAt = x.StartsAt
            })
            .ToListAsync();

        return Result<List<SchoolEventListDto>>.Ok(events);
    }
    //Get_School_Events_List-------------------------------------------------------------

    //Get_School_Events_Details_On_Edit-------------------------------------------------------------
    public async Task<Result<SchoolEventDetailDto>> GetSchoolEventOnEditAsync(Guid eventid)
    {
        var _event = await context.SchoolEvents.Where(x =>
        x.Status == EventStatus.Draft &&
        x.Id == eventid
        ).Select(x => new SchoolEventDetailDto
        {
            Title = x.Title,
            Status = x.Status,
            Capacity = x.Capacity,
            Description = x.Description,
            StartsAt = x.StartsAt,
            EndsAt = x.EndsAt,
            Location = x.Location,
            Url = x.Url
        }).FirstOrDefaultAsync();

        if (_event is null) return Result<SchoolEventDetailDto>.Fail("Event not found");

        return Result<SchoolEventDetailDto>.Ok(_event);
    }
    //Get_School_Events_Details_On_Edit-------------------------------------------------------------



}
