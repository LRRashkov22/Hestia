using Microsoft.EntityFrameworkCore;
using SchoolEventCenter.Module.Data.Domain.Entities;
using SchoolEventCenter.Module.Data.Domain.Enums;
using SchoolEventCenter.Module.Data.Domain.Events;
using SchoolEventCenter.Module.Data.Persistance;
using SchoolEventCenter.Module.Data.Shared;
using SchoolEventCenter.Module.Data.Shared.Common;
using SchoolEventCenter.Module.Registrations.Application.DTOs;
using SchoolEventCenter.Module.Registrations.Application.Interface;
using System.Data;
namespace SchoolEventCenter.Module.Registrations.Application.Service;

public class RegistrationService : IRegistrationService
{
    private readonly SECDbContext context;
    private readonly IEventPublisher eventPublisher;

    public RegistrationService(SECDbContext context, IEventPublisher eventPublisher)
    {
        this.context = context;
        this.eventPublisher = eventPublisher;
    }

    public async Task<Result<RegistrationResponseDto>> RegisterAsync(Guid eventId, Guid userId)
    {
        await using var transaction = await context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable);

        try
        {
            var schoolEvent = await context
                .Set<SchoolEvent>()
                .FirstOrDefaultAsync(x =>
                    x.Id == eventId &&
                    x.Status == EventStatus.Published &&
                    x.EndsAt > DateTime.UtcNow);

            if (schoolEvent is null)
                return Result<RegistrationResponseDto>.Fail("Event not found");

            var alreadyRegistered = await context
                .Set<Registration>()
                .AnyAsync(x =>
                    x.SchoolEventId == eventId &&
                    x.UserId == userId);

            if (alreadyRegistered)
                return Result<RegistrationResponseDto>.Fail("Already registered");

            var confirmedCount = await context
                .Set<Registration>()
                .CountAsync(x =>
                    x.SchoolEventId == eventId &&
                    x.Status == RegistrationStatus.Confirmed);

            RegistrationStatus status;

            int? waitlistPosition = null;

            if (confirmedCount < schoolEvent.Capacity)
            {
                status = RegistrationStatus.Confirmed;
            }
            else
            {
                status = RegistrationStatus.Waitlisted;

                waitlistPosition = await context
                    .Set<Registration>()
                    .CountAsync(x =>
                        x.SchoolEventId == eventId &&
                        x.Status == RegistrationStatus.Waitlisted) + 1;
            }

            var registration = new Registration
            {
                UserId = userId,
                SchoolEventId = eventId,
                RegisteredAt = DateTime.UtcNow,
                Status = status,
                WaitlistPosition = waitlistPosition
            };

            context.Registrations.Add(registration);

            await context.SaveChangesAsync();

            await transaction.CommitAsync();
            Console.WriteLine("Publishing RegistrationConfirmedEvent");
            if (status == RegistrationStatus.Confirmed)
            {
                Console.WriteLine("Publishing RegistrationConfirmedEvent");
                Console.WriteLine($"Registration.UserId = {registration.UserId}");
                await eventPublisher.PublishAsync(
                    new RegistrationConfirmedEvent
                    {
                        RegistrationId = registration.Id,
                        EventId = registration.SchoolEventId,
                        userId = registration.UserId,
                        OccurredAt = registration.RegisteredAt
                    });
                Console.WriteLine("Published RegistrationConfirmedEvent");
            }
            else
            {
                await eventPublisher.PublishAsync(
                    new RegistrationWaitlistedEvent
                    {
                        RegistrationId = registration.Id,
                        EventId = registration.SchoolEventId,
                        userId = registration.UserId,
                        waitlistPosition = registration.WaitlistPosition!.Value,
                        OccurredAt = registration.RegisteredAt
                    });
            }


            return Result<RegistrationResponseDto>.Ok(
                new RegistrationResponseDto
                {
                    RegistrationId = registration.Id,
                    Status = registration.Status,
                    WaitlistPosition = registration.WaitlistPosition
                });
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex);
            await transaction.RollbackAsync();
            throw;
        }
    }
    public async Task<Result<RegistrationResponseDto>> CancelRegistrationAsync(Guid eventId, Guid userId)
    {
        await using var transaction = await context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        try
        {
            var registration = await GetRegistrationAsync(eventId, userId);

            if (registration is null)
                return Result<RegistrationResponseDto>.Fail("Registration not found");

            var cancelledRegistrationId = registration.Id;

            Registration? promotedRegistration = null;

            if (registration.Status == RegistrationStatus.Waitlisted)
            {
                await HandleWaitlistedCancellationAsync(registration);
            }
            else
            {
                promotedRegistration = await HandleConfirmedCancellationAsync(registration, eventId);
            }
            foreach (var e in context.ChangeTracker.Entries<Registration>())
            {
                Console.WriteLine(
                    $"Entity={e.Entity.Id}");
                Console.WriteLine(
                    $"State={e.State}");
                Console.WriteLine(
                    $"Status={e.Entity.Status}");
                Console.WriteLine(
                    $"Position={e.Entity.WaitlistPosition}");
            }

            await context.SaveChangesAsync();

            await transaction.CommitAsync();

            await eventPublisher.PublishAsync(
                new RegistrationCancelledEvent
                {
                    RegistrationId = cancelledRegistrationId,
                    EventId = eventId,
                    userId = userId,
                    OccurredAt = DateTime.UtcNow
                });

            if (promotedRegistration is not null)
            {
                await eventPublisher.PublishAsync(
                    new WaitlistPromotedEvent
                    {
                        RegistrationId = promotedRegistration.Id,
                        EventId = promotedRegistration.SchoolEventId,
                        userId = promotedRegistration.UserId,
                        OccurredAt = DateTime.UtcNow,
                    });
            }

            return Result<RegistrationResponseDto>.Ok(
                new RegistrationResponseDto
                {
                    RegistrationId = registration.Id,
                    Status = registration.Status,
                    WaitlistPosition = registration.WaitlistPosition
                });
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex);
            await transaction.RollbackAsync();

            throw;
        }
    }

    //HELPERS
    private async Task<Registration?> GetRegistrationAsync(Guid eventId, Guid userId)
    {
        return await context
            .Set<Registration>()
            .FirstOrDefaultAsync(x =>
                x.UserId == userId &&
                x.SchoolEventId == eventId);
    }


    private async Task HandleWaitlistedCancellationAsync(Registration registration)
    {
        context.Registrations.Remove(registration);

        var waitlisted = await context
            .Set<Registration>()
            .Where(x =>
                x.SchoolEventId == registration.SchoolEventId &&
                x.Status == RegistrationStatus.Waitlisted &&
                x.WaitlistPosition > registration.WaitlistPosition)
            .OrderBy(x => x.WaitlistPosition)
            .ToListAsync();


        Console.WriteLine("WAITLIST");

        foreach (var r in waitlisted)
        {
            Console.WriteLine(
                $"Id={r.Id} Status={r.Status} Position={r.WaitlistPosition}");
        }


        foreach (var item in waitlisted)
        {
            item.WaitlistPosition--;
        }
    }

    private async Task<Registration?> HandleConfirmedCancellationAsync(Registration registration, Guid eventId)
    {
        context.Registrations.Remove(registration);

        var promoted = await PromoteFirstWaitlistedAsync(eventId);

        if (promoted is not null)
        {
            await ReorderWaitlistAsync(eventId, promoted.Id);
        }
        return promoted;
    }

    private async Task<Registration?> PromoteFirstWaitlistedAsync(Guid eventId)
    {
        var firstWaitlisted = await context.Registrations
            .Where(x =>
                x.SchoolEventId == eventId &&
                x.Status == RegistrationStatus.Waitlisted)
            .OrderBy(x => x.WaitlistPosition)
            .FirstOrDefaultAsync();

        if (firstWaitlisted is null)
            return null;

        firstWaitlisted.Status = RegistrationStatus.Confirmed;
        firstWaitlisted.WaitlistPosition = null;

        return firstWaitlisted;
    }

    private async Task ReorderWaitlistAsync(Guid eventId, Guid promotedId)
    {
        var waitlisted = await context.Registrations
            .Where(x =>
                x.SchoolEventId == eventId &&
                x.Status == RegistrationStatus.Waitlisted &&
                x.Id != promotedId)
            .OrderBy(x => x.WaitlistPosition)
            .ToListAsync();

        int position = 1;

        foreach (var item in waitlisted)
        {
            item.WaitlistPosition = position++;
        }
    }

}

