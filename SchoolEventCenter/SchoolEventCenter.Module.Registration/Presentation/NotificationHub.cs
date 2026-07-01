using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace SchoolEventCenter.Module.Registrations.Presentation;

[Authorize]
public class NotificationHub : Hub
{
}
