using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using SchoolEventCenter.Infrastructure.Services;
using SchoolEventCenter.Module.Data.Domain.Events;
using SchoolEventCenter.Module.Data.Options;
using System.Text;
using System.Text.Json;
namespace SchoolEventCenter.Worker.Consumers;

public class RegistrationConsumer : BackgroundService
{
    private readonly IServiceScopeFactory scopeFactory;
    private readonly RabbitMqOptions options;

    private IConnection? connection;

    private RabbitMQ.Client.IModel? channel;
    public RegistrationConsumer(
    IOptions<RabbitMqOptions> options,
    IServiceScopeFactory scopeFactory)
    {
        this.options = options.Value;
        this.scopeFactory = scopeFactory;
    }
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var factory = new ConnectionFactory
        {
            HostName = options.HostName,
            Port = options.Port,
            UserName = options.UserName,
            Password = options.Password
        };
        Console.WriteLine($"Host={options.HostName}");
        Console.WriteLine($"Port={options.Port}");
        Console.WriteLine($"User={options.UserName}");
        Console.WriteLine($"Exchange={options.ExchangeName}");
        connection = factory.CreateConnection();
        channel = connection.CreateModel();
        channel.ExchangeDeclare(
        exchange: options.ExchangeName,
        type: ExchangeType.Topic,
        durable: true,
        autoDelete: false);
        channel.QueueDeclare(
        queue: "registration.queue",
        durable: true,
        exclusive: false,
        autoDelete: false,
        arguments: null);
        channel.QueueBind(
        queue: "registration.queue",
        exchange: options.ExchangeName,
        routingKey: "registration.*");
        // Event cancellation uses the same worker queue as registration notifications.
        channel.QueueBind(
        queue: "registration.queue",
        exchange: options.ExchangeName,
        routingKey: "event.*");
        var consumer = new EventingBasicConsumer(channel);
        consumer.Received += HandleMessageAsync;

        channel.BasicConsume(
            queue: "registration.queue",
            autoAck: false,
            consumer: consumer);

        await Task.Delay(Timeout.Infinite, stoppingToken);
    }

    private async void HandleMessageAsync(object? sender, BasicDeliverEventArgs args)
    {
        using var scope = scopeFactory.CreateScope();

        var emailService =
            scope.ServiceProvider.GetRequiredService<EmailService>();
        var notificationService =
            scope.ServiceProvider.GetRequiredService<NotificationService>();

        try
        {
            var body = args.Body.ToArray();

            var json = Encoding.UTF8.GetString(body);
            Console.WriteLine("==================================");
            Console.WriteLine($"RoutingKey = {args.RoutingKey}");
            Console.WriteLine(json);
            Console.WriteLine("==================================");
            Console.WriteLine(json);
            switch (args.RoutingKey)
            {
                case "registration.confirmed":
                    await HandleRegistrationConfirmedAsync(json, emailService, notificationService);
                    break;

                case "registration.waitlisted":
                    await HandleRegistrationWaitlistedAsync(json, emailService, notificationService);
                    break;

                case "registration.promoted":
                    await HandleWaitlistPromotedAsync(json, emailService, notificationService);
                    break;

                case "registration.cancelled":
                    await HandleRegistrationCancelledAsync(json, notificationService);
                    break;

                case "event.cancelled":
                    await HandleEventCancelledAsync(json, emailService, notificationService);
                    break;
            }

            channel!.BasicAck(args.DeliveryTag, false);
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex);

            channel!.BasicNack(
                args.DeliveryTag,
                false,
                false);
        }
    }


    private async Task HandleRegistrationConfirmedAsync(
        string json,
        EmailService emailService,
        NotificationService notificationService)
    {
        Console.WriteLine("Received:");
        Console.WriteLine(json);
        var domainEvent =
            JsonSerializer.Deserialize<RegistrationConfirmedEvent>(json);
        Console.WriteLine($"RegistrationId = {domainEvent?.RegistrationId}");
        Console.WriteLine($"EventId = {domainEvent?.EventId}");
        Console.WriteLine($"UserId = {domainEvent?.userId}");
        if (domainEvent is null)
            return;

        await notificationService.CreateRegistrationConfirmedAsync(domainEvent);
        await SendEmailBestEffortAsync(() => emailService.SendRegistrationConfirmedAsync(domainEvent));
    }

    private async Task HandleRegistrationWaitlistedAsync(
        string json,
        EmailService emailService,
        NotificationService notificationService)
    {
        var domainEvent =
            JsonSerializer.Deserialize<RegistrationWaitlistedEvent>(json);

        if (domainEvent is null)
            return;

        await notificationService.CreateRegistrationWaitlistedAsync(domainEvent);
        await SendEmailBestEffortAsync(() => emailService.SendRegistrationWaitlistedAsync(domainEvent));
    }

    private async Task HandleWaitlistPromotedAsync(
        string json,
        EmailService emailService,
        NotificationService notificationService)
    {
        var domainEvent =
            JsonSerializer.Deserialize<WaitlistPromotedEvent>(json);

        if (domainEvent is null)
            return;

        await notificationService.CreateWaitlistPromotedAsync(domainEvent);
        await SendEmailBestEffortAsync(() => emailService.SendWaitlistPromotedAsync(domainEvent));
    }

    private static async Task HandleRegistrationCancelledAsync(
        string json,
        NotificationService notificationService)
    {
        var domainEvent =
            JsonSerializer.Deserialize<RegistrationCancelledEvent>(json);

        if (domainEvent is null)
            return;

        await notificationService.CreateRegistrationCancelledAsync(domainEvent);
    }

    private async Task HandleEventCancelledAsync(
        string json,
        EmailService emailService,
        NotificationService notificationService)
    {
        var domainEvent =
            JsonSerializer.Deserialize<EventCancelledEvent>(json);

        if (domainEvent is null)
            return;

        await notificationService.CreateEventCancelledAsync(domainEvent);
        await SendEmailBestEffortAsync(() => emailService.SendEventCancelledAsync(domainEvent));
    }

    private static async Task SendEmailBestEffortAsync(Func<Task> sendEmail)
    {
        try
        {
            await sendEmail();
        }
        catch (Exception ex)
        {
            Console.WriteLine("Email delivery failed, notification was kept.");
            Console.WriteLine(ex);
        }
    }

    public override void Dispose()
    {
        channel?.Dispose();
        connection?.Dispose();

        base.Dispose();
    }
}
