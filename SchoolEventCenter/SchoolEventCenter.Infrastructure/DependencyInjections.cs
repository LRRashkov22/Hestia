using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Resend;
using SchoolEventCenter.Infrastructure.Email;
using SchoolEventCenter.Infrastructure.RabbitMQ;
using SchoolEventCenter.Infrastructure.Services;
using SchoolEventCenter.Module.Data.Options;
using SchoolEventCenter.Module.Data.Shared;

namespace SchoolEventCenter.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<RabbitMqOptions>(configuration.GetSection("RabbitMq"));
        services.Configure<EmailOptions>(configuration.GetSection("Email"));

        services.AddHttpClient();
        services.AddResend(options =>
        {
            options.ApiToken = configuration["Email:ApiKey"]!;
        });

        services.AddSingleton<IEventPublisher, RabbitMqPublisher>();
        services.AddScoped<IEmailSender, ResendEmailSender>();
        services.AddScoped<NotificationService>();
        // Default noop publisher - API will override with hub-backed publisher
        services.AddSingleton<SchoolEventCenter.Infrastructure.Services.INotificationPublisher, SchoolEventCenter.Infrastructure.Services.NoopNotificationPublisher>();

        return services;
    }
}
