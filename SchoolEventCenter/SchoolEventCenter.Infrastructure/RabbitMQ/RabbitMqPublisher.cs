using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using SchoolEventCenter.Module.Data.Domain.Events;
using SchoolEventCenter.Module.Data.Options;
using SchoolEventCenter.Module.Data.Shared;
using System.Text;
using System.Text.Json;
namespace SchoolEventCenter.Infrastructure.RabbitMQ;

public class RabbitMqPublisher : IEventPublisher, IDisposable
{
    private readonly IConnection _connection;
    private readonly string _exchangeName;
    private readonly IModel _channel;
    public RabbitMqPublisher(IOptions<RabbitMqOptions> options)
    {
        var rabbitMq = options.Value;
        _exchangeName = rabbitMq.ExchangeName;
        var factory = new ConnectionFactory
        {
            HostName = rabbitMq.HostName,
            Port = rabbitMq.Port,
            UserName = rabbitMq.UserName,
            Password = rabbitMq.Password,
        };

        _connection = factory.CreateConnection();

        _channel = _connection.CreateModel();

        _channel.ExchangeDeclare(
            exchange: _exchangeName,
            type: ExchangeType.Topic,
            durable: true,
            autoDelete: false);
    }
    public Task PublishAsync(IDomainEvent domainEvent)
    {
        var json = JsonSerializer.Serialize(
                                    domainEvent,
                                    domainEvent.GetType());
        Console.WriteLine(json);
        var body = Encoding.UTF8.GetBytes(json);
        _channel.BasicPublish(
        exchange: _exchangeName,
        routingKey: domainEvent.RoutingKey,
        basicProperties: null,
        body: body);
        return Task.CompletedTask;
    }
    public void Dispose()
    {
        _channel?.Dispose();
        _connection?.Dispose();
    }
}
