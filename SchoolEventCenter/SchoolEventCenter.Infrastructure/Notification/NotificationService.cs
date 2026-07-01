using Microsoft.EntityFrameworkCore;
using SchoolEventCenter.Module.Data.Domain.Entities;
using SchoolEventCenter.Module.Data.Domain.Enums;
using SchoolEventCenter.Module.Data.Domain.Events;
using SchoolEventCenter.Module.Data.Persistance;
using System.Text.RegularExpressions;

namespace SchoolEventCenter.Infrastructure.Services;

public class NotificationService
{
    private readonly SECDbContext context;
    private readonly INotificationPublisher publisher;

    public NotificationService(SECDbContext context, INotificationPublisher publisher)
    {
        this.context = context;
        this.publisher = publisher;
    }

    public async Task CreateRegistrationConfirmedAsync(RegistrationConfirmedEvent domainEvent)
    {
        var details = await GetEventNotificationDetailsAsync(domainEvent.EventId, domainEvent.userId);

        var notifications = new List<Notification>
        {
            CreateNotification(
            domainEvent.userId,
            NotificationType.RegistrationConfirmed,
            "Registration confirmed",
                $"Your registration for {details.EventTitle} has been confirmed.")
        };

        AddOrganizerNotification(
            notifications,
            details.OrganizerId,
            domainEvent.userId,
            NotificationType.RegistrationConfirmed,
            "New confirmed registration",
            $"{details.StudentName} registered for {details.EventTitle}.");

        await SaveAsync(notifications);
        await NotifyCreatedAndCount(notifications.Select(x => x.UserId));
    }

    public async Task CreateRegistrationWaitlistedAsync(RegistrationWaitlistedEvent domainEvent)
    {
        var details = await GetEventNotificationDetailsAsync(domainEvent.EventId, domainEvent.userId);

        var notifications = new List<Notification>
        {
            CreateNotification(
            domainEvent.userId,
            NotificationType.RegistrationWaitlisted,
            "Added to waiting list",
                $"You have been added to the waiting list for {details.EventTitle}. Position: {domainEvent.waitlistPosition}.")
        };

        AddOrganizerNotification(
            notifications,
            details.OrganizerId,
            domainEvent.userId,
            NotificationType.RegistrationWaitlisted,
            "New waitlist registration",
            $"{details.StudentName} joined the waitlist for {details.EventTitle}.");

        await SaveAsync(notifications);
        await NotifyCreatedAndCount(notifications.Select(x => x.UserId));
    }

    public async Task CreateWaitlistPromotedAsync(WaitlistPromotedEvent domainEvent)
    {
        var details = await GetEventNotificationDetailsAsync(domainEvent.EventId, domainEvent.userId);

        var notifications = new List<Notification>
        {
            CreateNotification(
            domainEvent.userId,
            NotificationType.WaitlistPromoted,
            "Registration confirmed",
                $"A seat became available for {details.EventTitle}, and your registration has been confirmed.")
        };

        AddOrganizerNotification(
            notifications,
            details.OrganizerId,
            domainEvent.userId,
            NotificationType.WaitlistPromoted,
            "Waitlist promoted",
            $"{details.StudentName} was promoted from the waitlist for {details.EventTitle}.");

        await SaveAsync(notifications);
        await NotifyCreatedAndCount(notifications.Select(x => x.UserId));
    }

    public async Task CreateRegistrationCancelledAsync(RegistrationCancelledEvent domainEvent)
    {
        var details = await GetEventNotificationDetailsAsync(domainEvent.EventId, domainEvent.userId);

        var notifications = new List<Notification>
        {
            CreateNotification(
            domainEvent.userId,
            NotificationType.RegistrationCancelled,
            "Registration cancelled",
                $"Your registration for {details.EventTitle} was cancelled.")
        };

        AddOrganizerNotification(
            notifications,
            details.OrganizerId,
            domainEvent.userId,
            NotificationType.RegistrationCancelled,
            "Registration cancelled",
            $"{details.StudentName} cancelled their registration for {details.EventTitle}.");

        await SaveAsync(notifications);
        await NotifyCreatedAndCount(notifications.Select(x => x.UserId));
    }

    public async Task CreateEventCancelledAsync(EventCancelledEvent domainEvent)
    {
        var eventTitle = await GetEventTitleAsync(domainEvent.EventId);

        var userIds = await context.Registrations
            .AsNoTracking()
            .Where(x => x.SchoolEventId == domainEvent.EventId)
            .Select(x => x.UserId)
            .Distinct()
            .ToListAsync();

        var notifications = userIds
            .Select(userId => CreateNotification(
                userId,
                NotificationType.EventCancelled,
                "Event cancelled",
                $"{eventTitle} has been cancelled."))
            .ToList();

        await SaveAsync(notifications);

        // Notify each affected user
        foreach (var id in userIds)
        {
            await NotifyCreatedAndCount(id);
        }
    }

    private static void AddOrganizerNotification(
        List<Notification> notifications,
        Guid organizerId,
        Guid studentId,
        NotificationType type,
        string title,
        string message)
    {
        if (organizerId == Guid.Empty || organizerId == studentId)
            return;

        notifications.Add(CreateNotification(organizerId, type, title, message));
    }

    private static Notification CreateNotification(
        Guid userId,
        NotificationType type,
        string title,
        string message)
    {
        // sanitize message: remove stray leading numeric tokens (e.g. accidental sequence numbers)
        if (!string.IsNullOrWhiteSpace(message))
        {
            message = Regex.Replace(message, "^\\s*\\d+\\s*", "");
        }

        return new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Message = message,
            CreatedAt = DateTime.UtcNow
        };
    }

    private async Task SaveAsync(Notification notification)
    {
        context.Notifications.Add(notification);
        await context.SaveChangesAsync();
    }

    private async Task SaveAsync(IReadOnlyCollection<Notification> notifications)
    {
        if (notifications.Count == 0)
            return;

        context.Notifications.AddRange(notifications);
        await context.SaveChangesAsync();
    }

    private async Task NotifyCreatedAndCount(Guid userId)
    {
        try
        {
            var last = await context.Notifications
                .AsNoTracking()
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync();

            if (last != null)
            {
                await publisher.NotifyUserCreatedAsync(userId, new
                {
                    id = last.Id,
                    type = last.Type.ToString(),
                    title = last.Title,
                    message = last.Message,
                    createdAt = last.CreatedAt
                });
            }

            var count = await context.Notifications
                .AsNoTracking()
                .CountAsync(x => x.UserId == userId && !x.IsRead);

            await publisher.NotifyUnreadCountChangedAsync(userId, count);
        }
        catch
        {
            // best-effort notify; swallow errors to avoid breaking flows
        }
    }

    private async Task NotifyCreatedAndCount(IEnumerable<Guid> userIds)
    {
        foreach (var userId in userIds.Distinct())
        {
            await NotifyCreatedAndCount(userId);
        }
    }

    private async Task<string> GetEventTitleAsync(Guid eventId)
    {
        return await context.SchoolEvents
            .AsNoTracking()
            .Where(x => x.Id == eventId)
            .Select(x => x.Title)
            .FirstOrDefaultAsync() ?? "the event";
    }

    private async Task<EventNotificationDetails> GetEventNotificationDetailsAsync(Guid eventId, Guid studentId)
    {
        var eventInfo = await context.SchoolEvents
            .AsNoTracking()
            .Where(x => x.Id == eventId)
            .Select(x => new
            {
                x.Title,
                x.OrganizerId
            })
            .FirstOrDefaultAsync();

        var studentName = await context.Users
            .AsNoTracking()
            .Where(x => x.Id == studentId)
            .Select(x => x.Username)
            .FirstOrDefaultAsync();

        return new EventNotificationDetails(
            eventInfo?.Title ?? "the event",
            eventInfo?.OrganizerId ?? Guid.Empty,
            string.IsNullOrWhiteSpace(studentName) ? "A student" : studentName);
    }

    private sealed record EventNotificationDetails(string EventTitle, Guid OrganizerId, string StudentName);
}
