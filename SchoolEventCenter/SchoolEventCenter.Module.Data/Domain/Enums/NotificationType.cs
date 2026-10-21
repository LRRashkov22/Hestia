using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolEventCenter.Module.Data.Domain.Enums;

public enum NotificationType
{
    RegistrationConfirmed = 1,

    RegistrationWaitlisted = 2,

    WaitlistPromoted = 3,

    RegistrationCancelled = 4,

    EventCancelled = 5
}
