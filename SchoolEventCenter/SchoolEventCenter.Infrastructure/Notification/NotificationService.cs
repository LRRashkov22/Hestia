using Microsoft.EntityFrameworkCore;
using SchoolEventCenter.Module.Data.Domain.Entities;
using SchoolEventCenter.Module.Data.Domain.Enums;
using SchoolEventCenter.Module.Data.Domain.Events;
using SchoolEventCenter.Module.Data.Persistance;

namespace SchoolEventCenter.Infrastructure.Services;

public class NotificationService
{
    private readonly SECDbContext context;

    public NotificationService(SECDbContext context)
    {
        this.context = context;
    }

    public async Task CreateRegistrationConfirmedAsync(
        RegistrationConfirmedEvent domainEvent)
    {
        var notification = new Notification
        {
            UserId = domainEvent.userId,
            Type = NotificationType.RegistrationConfirmed,
            Title = "Registration confirmed",
            Message = "Your registration has been confirmed.",
            CreatedAt = DateTime.UtcNow
        };

        context.Notifications.Add(notification);
        Console.WriteLine($"UserId from event = {domainEvent.userId}");
        var exists = await context.Users
        .AnyAsync(x => x.Id == domainEvent.userId);

        Console.WriteLine($"User exists = {exists}");
        await context.SaveChangesAsync();
    }

    public async Task CreateRegistrationWaitlistedAsync(
        RegistrationWaitlistedEvent domainEvent)
    {
        var notification = new Notification
        {
            UserId = domainEvent.userId,
            Type = NotificationType.RegistrationWaitlisted,
            Title = "Added to waiting list",
            Message =
                $"You have been added to the waiting list. Position: {domainEvent.waitlistPosition}.",
            CreatedAt = DateTime.UtcNow
        };

        context.Notifications.Add(notification);

        await context.SaveChangesAsync();
    }

    public async Task CreateWaitlistPromotedAsync(
        WaitlistPromotedEvent domainEvent)
    {
        var notification = new Notification
        {
            UserId = domainEvent.userId,
            Type = NotificationType.WaitlistPromoted,
            Title = "Registration confirmed",
            Message = "A seat became available and your registration has been confirmed.",
            CreatedAt = DateTime.UtcNow
        };

        context.Notifications.Add(notification);

        await context.SaveChangesAsync();
    }

    public async Task CreateEventCancelledAsync(
        EventCancelledEvent domainEvent)
    {
        var registrations = await context.Registrations
            .Where(x => x.SchoolEventId == domainEvent.EventId)
            .Select(x => x.UserId)
            .ToListAsync();

        foreach (var userId in registrations)
        {
            context.Notifications.Add(new Notification
            {
                UserId = userId,
                Type = NotificationType.EventCancelled,
                Title = "Event cancelled",
                Message = "An event you registered for has been cancelled.",
                CreatedAt = DateTime.UtcNow
            });
        }

        await context.SaveChangesAsync();
    }
}