using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.Extensions.DependencyInjection;
using SchoolEventCenter.Module.Registrations.Application.Interface;
using SchoolEventCenter.Module.Registrations.Application.Service;
using SchoolEventCenter.Module.Registrations.Presentation;

namespace SchoolEventCenter.Module.Registrations;

public static class DependencyInjection
{
    public static IServiceCollection AddRegistrationModule(this IServiceCollection services)
    {

        services.AddControllers().PartManager.ApplicationParts
            .Add(new AssemblyPart(typeof(RegistrationController).Assembly));
        services.AddScoped<IRegistrationQueryService, RegistrationQueriesService>();
        services.AddScoped<IRegistrationService, RegistrationService>();
        // Codex added notification API DI registration - start
        services.AddScoped<INotificationQueryService, NotificationQueryService>();
        // Codex added notification API DI registration - end
        // services.AddValidatorsFromAssemblyContaining<SchoolEventDto>();
        return services;
    }

}
