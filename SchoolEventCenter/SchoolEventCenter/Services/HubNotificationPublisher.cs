using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using SchoolEventCenter.Infrastructure.Services;
using SchoolEventCenter.Module.Registrations.Presentation;

namespace SchoolEventCenter.Api.Services
{
    public class HubNotificationPublisher : INotificationPublisher
    {
        private readonly IHubContext<NotificationHub> hubContext;

        public HubNotificationPublisher(IHubContext<NotificationHub> hubContext)
        {
            this.hubContext = hubContext;
        }

        public Task NotifyUserCreatedAsync(Guid userId, object payload)
        {
            return hubContext.Clients.User(userId.ToString()).SendAsync("notificationCreated", payload);
        }

        public Task NotifyUnreadCountChangedAsync(Guid userId, int unreadCount)
        {
            return hubContext.Clients.User(userId.ToString()).SendAsync("notificationsChanged", new { unreadCount });
        }
    }
}
