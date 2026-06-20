using Microsoft.AspNetCore.Identity;
using SchoolEventCenter.Module.Data.Domain.Entities;
using SchoolEventCenter.Module.Data.Domain.Enums;
using SchoolEventCenter.Module.Data.Persistance;
using System.Data;

namespace SchoolEventCenter.Api.Helpers;

public class ApplicationInitializer
{
    public static void Initialize(WebApplication app)
    {
        InitializeIdentityRoles(app);
    }
    private static void InitializeIdentityRoles(WebApplication app)
    {
        using (var scope = app.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SECDbContext>();

            if (!context.Users.Any(u => u.Role == UserRole.Organizer))
            {
                var admin = new User
                {
                    Username = "admin",
                    Email = "admin@gmail.com",
                    Role = UserRole.Organizer,
                };

                admin.PasswordHash = new PasswordHasher<User>()
                    .HashPassword(admin, "admin");

                context.Users.Add(admin);
                context.SaveChanges();
            }
        }
    }
}
