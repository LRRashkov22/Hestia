using Microsoft.Extensions.Options;
using Resend;
using SchoolEventCenter.Module.Data.Options;

namespace SchoolEventCenter.Infrastructure.Email;

public class ResendEmailSender : IEmailSender
{
    private readonly IResend client;
    private readonly EmailOptions options;
    private readonly string fromEmail;
    private readonly string fromName;
    public ResendEmailSender(IOptions<EmailOptions> options, IResend client)
    {

        this.client = client;
        this.options = options.Value;
        fromEmail = this.options.FromEmail;
        fromName = this.options.FromName;
    }
    public async Task SendAsync(string to, string subject, string html)
    {
        var message = new EmailMessage
        {
            From = $"{fromName} <{fromEmail}>",
            Subject = subject,
            HtmlBody = html
        };
        message.To.Add(to);
        await client.EmailSendAsync(message);

    }
}
