using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using SchoolEventCenter.Module.Data.Domain.Entities;
using SchoolEventCenter.Module.Data.Domain.Enums;
using SchoolEventCenter.Module.Data.Domain.Events;
using SchoolEventCenter.Module.Data.Persistance;
using SchoolEventCenter.Module.Data.Shared;
using SchoolEventCenter.Module.Registrations.Application.Service;
using SchoolEventCenter.Infrastructure.Services;

namespace Tests;

public class EventDrivenNotificationTests
{
    [Fact]
    public async Task RegisterAsync_PublishesConfirmedEvent_AndDoesNotCreateNotificationInApi()
    {
        await using var context = CreateContext();
        var publisher = new CapturingEventPublisher();
        var studentId = Guid.NewGuid();
        var organizerId = Guid.NewGuid();
        var eventId = Guid.NewGuid();

        context.Users.Add(new User
        {
            Id = studentId,
            Email = "student@example.com",
            Username = "Student",
            Role = UserRole.Student,
            CreatedAt = DateTime.UtcNow
        });

        context.Users.Add(new User
        {
            Id = organizerId,
            Email = "organizer@example.com",
            Username = "Organizer",
            Role = UserRole.Organizer,
            CreatedAt = DateTime.UtcNow
        });

        context.SchoolEvents.Add(new SchoolEvent
        {
            Id = eventId,
            Title = "Math club",
            Description = "Weekly math club",
            Capacity = 1,
            StartsAt = DateTime.UtcNow.AddDays(1),
            EndsAt = DateTime.UtcNow.AddDays(1).AddHours(1),
            Status = EventStatus.Published,
            CreatedAt = DateTime.UtcNow,
            OrganizerId = organizerId
        });

        await context.SaveChangesAsync();

        var service = new RegistrationService(context, publisher);
        var result = await service.RegisterAsync(eventId, studentId);

        Assert.True(result.Success);
        Assert.IsType<RegistrationConfirmedEvent>(publisher.Published.Single());
        Assert.Empty(context.Notifications);
    }

    [Fact]
    public async Task NotificationService_CreatesPersistentLogFromRegistrationEvent()
    {
        await using var context = CreateContext();
        var studentId = Guid.NewGuid();
        var organizerId = Guid.NewGuid();
        var eventId = Guid.NewGuid();

        context.Users.Add(new User
        {
            Id = studentId,
            Email = "student@example.com",
            Username = "Student",
            Role = UserRole.Student,
            CreatedAt = DateTime.UtcNow
        });

        context.Users.Add(new User
        {
            Id = organizerId,
            Email = "organizer@example.com",
            Username = "Organizer",
            Role = UserRole.Organizer,
            CreatedAt = DateTime.UtcNow
        });

        context.SchoolEvents.Add(new SchoolEvent
        {
            Id = eventId,
            Title = "Science workshop",
            Description = "Lab work",
            Capacity = 2,
            StartsAt = DateTime.UtcNow.AddDays(1),
            EndsAt = DateTime.UtcNow.AddDays(1).AddHours(1),
            Status = EventStatus.Published,
            CreatedAt = DateTime.UtcNow,
            OrganizerId = organizerId
        });

        await context.SaveChangesAsync();

        var publisher = new CapturingNotificationPublisher();
        var service = new NotificationService(context, publisher);
        await service.CreateRegistrationConfirmedAsync(new RegistrationConfirmedEvent
        {
            RegistrationId = Guid.NewGuid(),
            EventId = eventId,
            userId = studentId,
            OccurredAt = DateTime.UtcNow
        });

        var notifications = await context.Notifications
            .OrderBy(x => x.UserId == studentId ? 0 : 1)
            .ToListAsync();

        Assert.Equal(2, notifications.Count);
        Assert.Contains(notifications, x =>
            x.UserId == studentId &&
            x.Type == NotificationType.RegistrationConfirmed &&
            x.Message.Contains("Science workshop"));
        Assert.Contains(notifications, x =>
            x.UserId == organizerId &&
            x.Title == "New confirmed registration" &&
            x.Message.Contains("Student registered for Science workshop"));
        Assert.Contains(studentId, publisher.NotifiedUsers);
        Assert.Contains(organizerId, publisher.NotifiedUsers);
    }

    private static SECDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<SECDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(x => x.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new SECDbContext(options);
    }

    private sealed class CapturingEventPublisher : IEventPublisher
    {
        public List<IDomainEvent> Published { get; } = [];

        public Task PublishAsync(IDomainEvent domainEvent)
        {
            Published.Add(domainEvent);
            return Task.CompletedTask;
        }
    }

    private sealed class CapturingNotificationPublisher : INotificationPublisher
    {
        public List<Guid> NotifiedUsers { get; } = [];

        public Task NotifyUserCreatedAsync(Guid userId, object payload)
        {
            NotifiedUsers.Add(userId);
            return Task.CompletedTask;
        }

        public Task NotifyUnreadCountChangedAsync(Guid userId, int unreadCount)
        {
            NotifiedUsers.Add(userId);
            return Task.CompletedTask;
        }
    }
}
