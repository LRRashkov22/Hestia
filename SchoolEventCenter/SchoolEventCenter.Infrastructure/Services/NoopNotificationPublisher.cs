using System;
using System.Threading.Tasks;

namespace SchoolEventCenter.Infrastructure.Services
{
    public class NoopNotificationPublisher : INotificationPublisher
    {
        public Task NotifyUserCreatedAsync(Guid userId, object payload)
        {
            return Task.CompletedTask;
        }

        public Task NotifyUnreadCountChangedAsync(Guid userId, int unreadCount)
        {
            return Task.CompletedTask;
        }
    }
}
