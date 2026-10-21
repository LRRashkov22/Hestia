using Microsoft.EntityFrameworkCore;
using SchoolEventCenter.Module.Data.Domain.Entities;
using SchoolEventCenter.Module.Data.Domain.Events;
using SchoolEventCenter.Module.Data.Domain.Enums;
using SchoolEventCenter.Module.Data.Persistance;
using SchoolEventCenter.Module.Data.Shared;
using SchoolEventCenter.Module.Data.Shared.Common;
using SchoolEvemtCenter.Module.SchoolEventsManagement.Application.DTOs.OrganizerDTOs;
using SchoolEvemtCenter.Module.SchoolEventsManagement.Application.Service;
using Xunit;

namespace Tests;

public class SchoolEventCrudAndQueryTests
{
    private SECDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<SECDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new SECDbContext(options);
    }

    [Fact]
    public async Task CreateSchoolEventAsync_ShouldSuccess_WhenUserIsOrganizer()
    {
        await using var context = CreateContext();
        var organizerId = Guid.NewGuid();
        context.Users.Add(new User { Id = organizerId, Role = UserRole.Organizer, Username = "org" });
        await context.SaveChangesAsync();

        var service = new SchoolEventCRUDService(context, new TestEventPublisher());
        var dto = new SchoolEventDto
        {
            Title = "Fest",
            StartsAt = DateTime.UtcNow.AddDays(1),
            EndsAt = DateTime.UtcNow.AddDays(1).AddHours(2),
            Capacity = 10,
            Publish = false
        };

        var result = await service.CreateSchoolEventAsync(dto, organizerId);

        Assert.True(result.Success);
        var created = await context.SchoolEvents.FindAsync(result.Value);
        Assert.NotNull(created);
        Assert.Equal(EventStatus.Draft, created!.Status);
        Assert.Equal(organizerId, created.OrganizerId);
        Assert.Equal("Fest", created.Title);
    }

    [Fact]
    public async Task UpdateSchoolEventAsync_ShouldFail_WhenEventNotDraft()
    {
        await using var context = CreateContext();
        var eventId = Guid.NewGuid();
        context.SchoolEvents.Add(new SchoolEvent { Id = eventId, Title = "Old", Status = EventStatus.Published });
        await context.SaveChangesAsync();

        var service = new SchoolEventCRUDService(context, new TestEventPublisher());
        var dto = new SchoolEventDto { Title = "New" };

        var result = await service.UpdateSchoolEventAsync(eventId, dto);

        Assert.False(result.Success);
        Assert.Equal("Only draft events can be edited", result.Error);
    }

    [Fact]
    public async Task GetSchoolEventListAsync_ShouldFilterBySearchAndStatus()
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();

        var ev1 = new SchoolEvent
        {
            OrganizerId = userId,
            Title = "Math Exam",
            Location = "Room 101",
            EndsAt = DateTime.UtcNow.AddDays(1),
            StartsAt = DateTime.UtcNow.AddHours(5),
            Status = EventStatus.Published
        };

        var ev2 = new SchoolEvent
        {
            OrganizerId = userId,
            Title = "History",
            Location = "Room 102",
            EndsAt = DateTime.UtcNow.AddDays(1),
            StartsAt = DateTime.UtcNow.AddHours(6),
            Status = EventStatus.Draft
        };

        context.SchoolEvents.AddRange(ev1, ev2);
        await context.SaveChangesAsync();

        var service = new SchoolEventCRUDService(context, new TestEventPublisher());

        var result = await service.GetSchoolEventListAsync(userId, EventStatus.Published, "Math");

        Assert.True(result.Success);
        Assert.Single(result.Value);
        Assert.Equal("Math Exam", result.Value[0].Title);
    }

    [Fact]
    public async Task OrganizerDashboardCardInformation_ShouldCalculateCorrectTotals()
    {
        await using var context = CreateContext();
        var organizerId = Guid.NewGuid();

        var ev = new SchoolEvent { Id = Guid.NewGuid(), OrganizerId = organizerId, Status = EventStatus.Published };
        context.SchoolEvents.Add(ev);

        var reg1 = new Registration { SchoolEvent = ev, Status = RegistrationStatus.Confirmed, RegisteredAt = DateTime.UtcNow };
        var reg2 = new Registration { SchoolEvent = ev, Status = RegistrationStatus.Waitlisted, RegisteredAt = DateTime.UtcNow };
        context.Registrations.AddRange(reg1, reg2);
        await context.SaveChangesAsync();

        var service = new SchoolEventQueryService(context);
        var result = await service.OrganizerDashboardCardInformation(organizerId);

        Assert.True(result.Success);
        Assert.Equal(1, result.Value.TotalEvents);
        Assert.Equal(1, result.Value.Published);
        Assert.Equal(1, result.Value.Registrations);
        Assert.Equal(1, result.Value.Waitlisted);
    }

    private sealed class TestEventPublisher : IEventPublisher
    {
        public Task PublishAsync(IDomainEvent domainEvent) => Task.CompletedTask;
    }
}
