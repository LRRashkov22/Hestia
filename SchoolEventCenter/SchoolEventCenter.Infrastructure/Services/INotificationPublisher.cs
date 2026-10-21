using System;
using System.Threading.Tasks;

namespace SchoolEventCenter.Infrastructure.Services
{
    public interface INotificationPublisher
    {
        Task NotifyUserCreatedAsync(Guid userId, object payload);
        Task NotifyUnreadCountChangedAsync(Guid userId, int unreadCount);
    }
}
