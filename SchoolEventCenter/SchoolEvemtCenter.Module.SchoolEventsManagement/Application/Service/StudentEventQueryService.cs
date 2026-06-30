using Microsoft.EntityFrameworkCore;
using SchoolEvemtCenter.Module.SchoolEventsManagement.Application.DTOs.StudentDTOs;
using SchoolEvemtCenter.Module.SchoolEventsManagement.Application.Interfaces;
using SchoolEventCenter.Module.Data.Domain.Enums;
using SchoolEventCenter.Module.Data.Persistance;
using SchoolEventCenter.Module.Data.Shared.Common;


namespace SchoolEvemtCenter.Module.SchoolEventsManagement.Application.Service;
//This Service handle all get request for School events (student) only 
public class StudentEventQueryService : IStudentEventQueryService
{
    private readonly SECDbContext context;
    public StudentEventQueryService(SECDbContext context)
    {
        this.context = context;
    }
    //Get Cards Information For Student Dashboard Page
    public async Task<Result<StudentDashboardCardsDto>> GetStudentDashboardCardsAsync(Guid userId)
    {
        var totalEvents = await context.SchoolEvents
            .CountAsync(x =>
                x.Status == EventStatus.Published &&
                x.EndsAt > DateTime.UtcNow);

        var registered = await context.Registrations
            .CountAsync(x =>
                x.UserId == userId &&
                x.Status == RegistrationStatus.Confirmed);

        var waitlisted = await context.Registrations
            .CountAsync(x =>
                x.UserId == userId &&
                x.Status == RegistrationStatus.Waitlisted);

        // Codex added real student unread notification count - start
        var notifications = await context.Notifications
            .CountAsync(x =>
                x.UserId == userId &&
                !x.IsRead);
        // Codex added real student unread notification count - end

        var dashboard = new StudentDashboardCardsDto
        {
            TotalEvents = totalEvents,
            Registered = registered,
            Waitlisted = waitlisted,
            Notifications = notifications
        };

        return Result<StudentDashboardCardsDto>.Ok(dashboard);
    }

    //Get Upcoming Events In Student Dashboard Page
    public async Task<Result<List<StudentUpcomingEventDto>>> GetUpcomingEventsAsync(Guid userId)
    {
        var events = await context.SchoolEvents
            .AsNoTracking()
            .Where(x =>
                x.Status == EventStatus.Published &&
                x.EndsAt > DateTime.UtcNow)
            .OrderBy(x => x.StartsAt)
            .Take(5)
            .Select(x => new StudentUpcomingEventDto
            {
                Id = x.Id,
                Title = x.Title,
                StartsAt = x.StartsAt,
                EndsAt = x.EndsAt,
                Location = x.Location,
                Confirmed = x.Registrations
                    .Count(r => r.Status == RegistrationStatus.Confirmed),
                Capacity = x.Capacity,
                RegistrationStatus = x.Registrations
                    .Where(r => r.UserId == userId)
                    .Select(r => (RegistrationStatus?)r.Status)
                    .FirstOrDefault()
            })
            .ToListAsync();

        return Result<List<StudentUpcomingEventDto>>.Ok(events);
    }

    //Get all Available Events PREVIEW (CARDS)
    public async Task<Result<List<StudentEventPreviewDto>>> GetAvailableEventsAsync(Guid userId)
    {
        var events = await context.SchoolEvents
        .AsNoTracking()
        .Where(x =>
            x.Status == EventStatus.Published &&
            x.EndsAt > DateTime.UtcNow)
        .OrderBy(x => x.StartsAt)
        .Select(x => new StudentEventPreviewDto
        {
            Id = x.Id,
            Title = x.Title,
            Description = x.Description,
            StartsAt = x.StartsAt,
            EndsAt = x.EndsAt,
            Location = x.Location,
            Capacity = x.Capacity,

            Confirmed = x.Registrations.Count(r => r.Status == RegistrationStatus.Confirmed),

            Waitlisted = x.Registrations.Count(r => r.Status == RegistrationStatus.Waitlisted),

            SeatsLeft = x.Capacity - x.Registrations.Count(r => r.Status == RegistrationStatus.Confirmed),

            FillPercentage = x.Capacity == 0 ? 0 : x.Registrations
            .Count(r => r.Status == RegistrationStatus.Confirmed) * 100 / x.Capacity,

            RegistrationStatus = x.Registrations
                .Where(r => r.UserId == userId)
                .Select(r => (RegistrationStatus?)r.Status)
                .FirstOrDefault()

        }).ToListAsync();
        return Result<List<StudentEventPreviewDto>>.Ok(events);
    }

    //Get Event By Id Detailed Information
    public async Task<Result<StudentEventDetailsDto>> GetEventDetailsAsync(Guid eventId, Guid userId)
    {
        var eventDetails = await context.SchoolEvents
            .AsNoTracking()
            .Where(x =>
                x.Id == eventId &&
                x.Status == EventStatus.Published)
            .Select(x => new StudentEventDetailsDto
            {
                Id = x.Id,
                Title = x.Title,
                Description = x.Description,
                StartsAt = x.StartsAt,
                EndsAt = x.EndsAt,
                Location = x.Location,
                Url = x.Url,
                OrganizerName = x.Organizer!.Username,
                Capacity = x.Capacity,

                Confirmed = x.Registrations
                    .Count(r =>
                        r.Status == RegistrationStatus.Confirmed),

                Waitlisted = x.Registrations
                    .Count(r =>
                        r.Status == RegistrationStatus.Waitlisted),

                RegistrationStatus = x.Registrations
                    .Where(r => r.UserId == userId)
                    .Select(r => (RegistrationStatus?)r.Status)
                    .FirstOrDefault()
            })
            .FirstOrDefaultAsync();

        if (eventDetails is null) return Result<StudentEventDetailsDto>.Fail("Event not found");

        return Result<StudentEventDetailsDto>.Ok(eventDetails);
    }
}
