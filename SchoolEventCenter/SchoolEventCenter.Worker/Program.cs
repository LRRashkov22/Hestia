using Microsoft.Extensions.Options;
using SchoolEventCenter.Infrastructure;
using SchoolEventCenter.Infrastructure.Services;
using SchoolEventCenter.Module.Data;
using SchoolEventCenter.Module.Data.Options;
using SchoolEventCenter.Worker.Consumers;
using SchoolEventCenter.Worker.Extensions;

var builder = Host.CreateApplicationBuilder(args);
builder.Configuration.AddEnvConfig();
// Database
builder.Services.Configure<DatabaseOptions>(
    builder.Configuration.GetSection("ConnectionStrings"));

using (var provider = builder.Services.BuildServiceProvider())
{
    var dbOptions = provider.GetRequiredService<IOptions<DatabaseOptions>>();
    builder.Services.AddData(dbOptions);
}

builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<NotificationService>();

builder.Services.Configure<RabbitMqOptions>(
    builder.Configuration.GetSection("RabbitMq"));

builder.Services.AddHostedService<RegistrationConsumer>();

var host = builder.Build();
host.Run();
