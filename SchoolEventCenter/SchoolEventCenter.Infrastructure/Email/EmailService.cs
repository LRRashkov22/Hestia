using Microsoft.EntityFrameworkCore;
using SchoolEventCenter.Infrastructure.Email;
using SchoolEventCenter.Module.Data.Domain.Events;
using SchoolEventCenter.Module.Data.Persistance;
using SchoolEventCenter.Module.Data.Shared.Common;

namespace SchoolEventCenter.Infrastructure.Services;

public class EmailService
{
    private readonly IEmailSender emailSender;
    private readonly SECDbContext context;

    public EmailService(IEmailSender emailSender, SECDbContext context)
    {
        this.emailSender = emailSender;
        this.context = context;
    }

    public async Task SendRegistrationConfirmedAsync(
    RegistrationConfirmedEvent domainEvent)
    {
        var result = await GetRegistrationData(domainEvent.RegistrationId);
        if (!result.Success) return;
        var data = result.Value!;

        var subject = "Registration confirmed";

        var html = RegistrationConfirmedTemplate(data.EventTitle, data.StartsAt);

        await emailSender.SendAsync(
            data.Email,
            subject,
            html);
    }
    public async Task SendRegistrationWaitlistedAsync(
    RegistrationWaitlistedEvent domainEvent)
    {
        var result = await GetRegistrationData(domainEvent.RegistrationId);

        if (!result.Success)
            return;

        var data = result.Value!;

        var subject = "You have been added to the waiting list";

        var html = RegistrationWaitlistedTemplate(
            data.EventTitle,
            data.StartsAt,
            domainEvent.waitlistPosition);

        await emailSender.SendAsync(
            data.Email,
            subject,
            html);
    }
    public async Task SendWaitlistPromotedAsync(
    WaitlistPromotedEvent domainEvent)
    {
        var result = await GetRegistrationData(domainEvent.RegistrationId);

        if (!result.Success)
            return;

        var data = result.Value!;

        var subject = "A seat is now available";

        var html = WaitlistPromotedTemplate(
            data.EventTitle,
            data.StartsAt);

        await emailSender.SendAsync(
            data.Email,
            subject,
            html);
    }
    public async Task SendEventCancelledAsync(EventCancelledEvent domainEvent)
    {
        var users = await context.Registrations
        .Where(x => x.SchoolEventId == domainEvent.EventId)
        .Select(x => new
        {
            x.User.Email,
        })
        .ToListAsync();

        var eventTitle = await context.SchoolEvents.Where(x =>
        x.Id == domainEvent.EventId
        ).Select(t => t.Title)
        .FirstOrDefaultAsync();

        var subject = "Event you are registered was cancelled";

        var html = RegistrationCancelledTemplate(eventTitle!);

        foreach (var user in users)
        {
            await emailSender.SendAsync(
            user.Email,
            subject,
            html);
        }
    }

    //HELPERS
    private static string RegistrationConfirmedTemplate(string title, DateTime startsAt)
    {
        return $$"""
    <h2>Registration confirmed</h2>

    <p>
        You are successfully registered for
        <strong>{{title}}</strong>.
    </p>

    <p>
        Event starts on {{startsAt:dd.MM.yyyy HH:mm}}
    </p>
    """;
    }

    private static string RegistrationWaitlistedTemplate(
    string title,
    DateTime startsAt,
    int position)
    {
        return $$"""
    <h2>Waiting List</h2>

    <p>
        You have been added to the waiting list for
        <strong>{{title}}</strong>.
    </p>

    <p>
        Your current position:
        <strong>#{{position}}</strong>
    </p>

    <p>
        Event starts on
        <strong>{{startsAt:dd.MM.yyyy HH:mm}}</strong>.
    </p>
    """;
    }
    private static string WaitlistPromotedTemplate(
    string title,
    DateTime startsAt)
    {
        return $$"""
    <h2>Good news!</h2>

    <p>
        A seat became available.
    </p>

    <p>
        Your registration for
        <strong>{{title}}</strong>
        is now confirmed.
    </p>

    <p>
        Event starts on
        <strong>{{startsAt:dd.MM.yyyy HH:mm}}</strong>.
    </p>
    """;
    }
    private static string RegistrationCancelledTemplate(string eventTitle)
    {
        return $$"""
            <h2>Event Cancelled</h2>

            <p>
                Event 
                <strong>{{eventTitle}}</strong>.
                was cancelled
            </p>
            """;
    }
    private async Task<Result<RegistrationEmailData>> GetRegistrationData(Guid registrationId)
    {
        var data = await context.Registrations
           .Where(x => x.Id == registrationId)
           .Select(x => new
           {
               x.User.Email,
               x.SchoolEvent.Title,
               x.SchoolEvent.StartsAt
           })
           .FirstOrDefaultAsync();
        if (data is null)
            return Result<RegistrationEmailData>.Fail("Error");
        if (string.IsNullOrWhiteSpace(data.Email))
            return Result<RegistrationEmailData>.Fail("Email cannot be empty");
        var registrationData = new RegistrationEmailData
        {
            EventTitle = data.Title,
            Email = data.Email,
            StartsAt = data.StartsAt
        };
        return Result<RegistrationEmailData>.Ok(registrationData);
    }
}
