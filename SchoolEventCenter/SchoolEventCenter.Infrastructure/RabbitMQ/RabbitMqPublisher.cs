using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using SchoolEventCenter.Module.Data.Domain.Events;
using SchoolEventCenter.Module.Data.Options;
using SchoolEventCenter.Module.Data.Shared;

namespace SchoolEventCenter.Infrastructure.RabbitMQ;

public class RabbitMqPublisher : IEventPublisher
{
    private readonly IConnection _connection;

    private readonly IModel _channel;
    public RabbitMqPublisher(IOptions<RabbitMqOptions> options)
    {
        var rabbitMq = options.Value;

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
            exchange: rabbitMq.ExchangeName,
            type: ExchangeType.Topic,
            durable: true,
            autoDelete: false);
    }
    public Task PublishAsync(IDomainEvent domainEvent)
    {
        throw new NotImplementedException();
    }
}
