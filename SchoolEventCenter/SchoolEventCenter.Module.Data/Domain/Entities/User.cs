using SchoolEventCenter.Module.Data.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace SchoolEventCenter.Module.Data.Domain.Entities;

public class User
{
    public Guid Id { get; set; }

    public string Username { get; set; } = string.Empty;

    //[EmailAddress]
    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }

    public UserRole Role { get; set; }

    public DateTime CreatedAt { get; set; }


    // Organizer owns events

    public ICollection<SchoolEvent> OrganizedEvents { get; set; } = [];

    // Student registrations

    public ICollection<Registration> Registrations { get; set; } = [];

    public ICollection<Notification> Notifications { get; set; } = [];
}
