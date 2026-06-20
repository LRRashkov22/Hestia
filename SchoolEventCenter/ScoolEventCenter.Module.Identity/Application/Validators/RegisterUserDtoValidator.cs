using FluentValidation;
using ScoolEventCenter.Module.Identity.Application.DTOs;
namespace ScoolEventCenter.Module.Identity.Application.Validators
{
    public class RegisterUserDtoValidator : AbstractValidator<CreateUserDto>
    {
        public RegisterUserDtoValidator()
        {
            RuleFor(x => x.Username)
                .NotEmpty()
                .MinimumLength(3)
                .MaximumLength(20)
                .Matches("^[a-zA-Z]+$")
                .WithMessage(
                    "Username can contain only letters"
                );

            RuleFor(x => x.Email)
                .NotEmpty()
                .EmailAddress()
                .MaximumLength(255);

            RuleFor(x => x.Password)
                .NotEmpty()
                .MinimumLength(8)
                .MaximumLength(30)
                .Matches("[A-Z]")
                .WithMessage(
                    "Password must contain uppercase letter"
                )

                .Matches("[a-z]")
                .WithMessage(
                    "Password must contain lowercase letter"
                )

                .Matches("[0-9]")
                .WithMessage(
                    "Password must contain digit"
                )

                .Matches("[^a-zA-Z0-9]")
                .WithMessage(
                    "Password must contain special character"
                );
        }
    }
}
