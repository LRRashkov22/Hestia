using SchoolEventCenter.Module.Data.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolEventCenter.Module.Data.Domain.Entities;

public class SchoolEvent
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DateTime StartsAt { get; set; }

    public DateTime EndsAt { get; set; }

    public int Capacity { get; set; }

    public string? Location { get; set; }

    public string? Url { get; set; }

    public EventStatus Status { get; set; }

    public DateTime CreatedAt { get; set; }


    // Organizer

    public Guid OrganizerId { get; set; }

    public User Organizer { get; set; }


    // Registrations

    public ICollection<Registration> Registrations { get; set; } = [];
}
