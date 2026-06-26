using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SchoolEventCenter.Infrastructure.RabbitMQ;
using SchoolEventCenter.Module.Data.Options;
using SchoolEventCenter.Module.Data.Shared;

namespace SchoolEventCenter.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<RabbitMqOptions>(configuration.GetSection("RabbitMq"));

        services.AddSingleton<IEventPublisher, RabbitMqPublisher>();

        return services;
    }
}
