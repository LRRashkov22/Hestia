using FluentValidation;
using SchoolEvemtCenter.Module.SchoolEventsManagement.Application.DTOs.OrganizerDTOs;
namespace SchoolEvemtCenter.Module.SchoolEventsManagement.Application.Validators;

public class SchoolEventDtoValidator : AbstractValidator<SchoolEventDto>
{
    public SchoolEventDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .MinimumLength(2)
            .MaximumLength(100);

        RuleFor(x => x.Description)
            .NotEmpty()
            .MinimumLength(10)
            .MaximumLength(2000);

        RuleFor(x => x.Capacity)
            .GreaterThan(0)
            .LessThanOrEqualTo(10000);

        RuleFor(x => x.StartsAt)
            .NotEmpty();

        RuleFor(x => x.EndsAt)
            .NotEmpty();

        RuleFor(x => x)
            .Must(x => x.EndsAt > x.StartsAt)
            .WithMessage(
                "End date must be after start date"
            );

        RuleFor(x => x.StartsAt)
            .Must(x => x > DateTime.UtcNow)
            .WithMessage(
                "Start date must be in the future"
            );

        RuleFor(x => x.Location)
            .MaximumLength(255);

        RuleFor(x => x.Url)
            .MaximumLength(500)
            .Must(BeValidUrl)
            .When(x => !string.IsNullOrWhiteSpace(x.Url))
            .WithMessage(
                "Invalid URL format"
            );
    }

    private bool BeValidUrl(string? url)
    {
        return Uri.TryCreate(
            url,
            UriKind.Absolute,
            out _
        );
    }
}