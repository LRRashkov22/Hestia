using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace SchoolEventCenter.Api.Services;

public sealed class NameIdentifierUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection)
    {
        return connection.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }
}
