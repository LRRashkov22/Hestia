using Microsoft.EntityFrameworkCore;
using SchoolEventCenter.Module.Data.Domain.Entities;
using SchoolEventCenter.Module.Data.Domain.Enums;
using SchoolEventCenter.Module.Data.Persistance;
using SchoolEventCenter.Module.Data.Shared.Common;
using System.Data;
namespace SchoolEventCenter.Module.Registrations.Application.Service;

public class RegistrationService
{
    private readonly SECDbContext context;
    public RegistrationService(SECDbContext context)
    {
        this.context = context;
    }

    public async Task<Result<Registration>> RegisterAsync(Guid eventId, Guid userId)
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
                return Result<Registration>.Fail("Event not found");

            var alreadyRegistered = await context
                .Set<Registration>()
                .AnyAsync(x =>
                    x.SchoolEventId == eventId &&
                    x.UserId == userId);

            if (alreadyRegistered)
                return Result<Registration>.Fail("Already registered");

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

            return Result<Registration>.Ok(registration);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
    public async Task<Result<Registration>> CancelRegistrationAsync(Guid eventId, Guid userId)
    {
        await using var transaction = await context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        try
        {
            var registration = await GetRegistrationAsync(eventId, userId);

            if (registration is null)
                return Result<Registration>.Fail("Registration not found");

            if (registration.Status == RegistrationStatus.Waitlisted)
            {
                await HandleWaitlistedCancellationAsync(registration);
            }
            else
            {
                await HandleConfirmedCancellationAsync(registration, eventId);
            }

            await context.SaveChangesAsync();

            await transaction.CommitAsync();

            return Result<Registration>.Ok(registration);
        }
        catch
        {
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

        foreach (var item in waitlisted)
        {
            item.WaitlistPosition--;
        }
    }

    private async Task HandleConfirmedCancellationAsync(Registration registration, Guid eventId)
    {
        context.Registrations.Remove(registration);

        await PromoteFirstWaitlistedAsync(eventId);

        await ReorderWaitlistAsync(eventId);
    }

    private async Task PromoteFirstWaitlistedAsync(Guid eventId)
    {
        var firstWaitlisted = await context
            .Set<Registration>()
            .Where(x =>
                x.SchoolEventId == eventId &&
                x.Status == RegistrationStatus.Waitlisted)
            .OrderBy(x =>
                x.WaitlistPosition)
            .FirstOrDefaultAsync();

        if (firstWaitlisted is null) return;

        firstWaitlisted.Status = RegistrationStatus.Confirmed;

        firstWaitlisted.WaitlistPosition = null;
    }

    private async Task ReorderWaitlistAsync(Guid eventId)
    {
        var waitlisted = await context
            .Set<Registration>()
            .Where(x =>
                x.SchoolEventId == eventId &&
                x.Status == RegistrationStatus.Waitlisted)
            .OrderBy(x =>
                x.WaitlistPosition)
            .ToListAsync();

        int position = 1;

        foreach (var item in waitlisted)
        {
            item.WaitlistPosition = position++;

        }
    }

}

