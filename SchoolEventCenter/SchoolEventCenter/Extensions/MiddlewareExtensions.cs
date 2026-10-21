using Scalar.AspNetCore;
using SchoolEventCenter.Module.Registrations.Presentation;

namespace SchoolEventCenter.Api.Extensions;

public static class MiddlewareExtensions
{
    public static void UseApiMiddleware(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
            app.MapScalarApiReference();
        }
        app.UseHttpsRedirection();

        app.UseCors("CorsPolicy");

        app.UseAuthentication();
        app.UseAuthorization();

        app.MapControllers();
        app.MapHub<NotificationHub>("/hubs/notifications");
    }
}
