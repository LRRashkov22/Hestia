using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SchoolEventCenter.Module.Data.Persistance;
using SchoolEventCenter.Module.Registrations.Presentation;

namespace SchoolEventCenter.Api.Services;

public sealed class DatabaseNotificationRealtimeBridge : BackgroundService
{
    private readonly IServiceScopeFactory scopeFactory;
    private readonly IHubContext<NotificationHub> hubContext;
    private readonly Dictionary<Guid, UserNotificationState> knownStates = [];

    public DatabaseNotificationRealtimeBridge(
        IServiceScopeFactory scopeFactory,
        IHubContext<NotificationHub> hubContext)
    {
        this.scopeFactory = scopeFactory;
        this.hubContext = hubContext;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var initialized = false;

        while (!stoppingToken.IsCancellationRequested)
        {
            var states = await LoadStatesAsync(stoppingToken);

            foreach (var state in states)
            {
                var hasPrevious = knownStates.TryGetValue(state.UserId, out var previous);
                var changed = !hasPrevious ||
                    previous!.UnreadCount != state.UnreadCount ||
                    previous.LatestCreatedAt != state.LatestCreatedAt;

                knownStates[state.UserId] = state;

                if (initialized && changed)
                {
                    await hubContext.Clients
                        .User(state.UserId.ToString())
                        .SendAsync("notificationsChanged", new { unreadCount = state.UnreadCount }, stoppingToken);
                }
            }

            initialized = true;
            await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
        }
    }

    private async Task<List<UserNotificationState>> LoadStatesAsync(CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SECDbContext>();

        return await context.Notifications
            .AsNoTracking()
            .GroupBy(x => x.UserId)
            .Select(x => new UserNotificationState(
                x.Key,
                x.Count(notification => !notification.IsRead),
                x.Max(notification => notification.CreatedAt)))
            .ToListAsync(cancellationToken);
    }

    private sealed record UserNotificationState(Guid UserId, int UnreadCount, DateTime LatestCreatedAt);
}
