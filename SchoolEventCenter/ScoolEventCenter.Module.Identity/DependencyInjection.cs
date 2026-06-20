using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using SchoolEventCenter.Module.Data.Options;
using SchoolEventCenter.Module.Data.Persistance;
using ScoolEventCenter.Module.Identity.Application.Interfaces;
using ScoolEventCenter.Module.Identity.Application.Services;
using ScoolEventCenter.Module.Identity.Application.Validators;
using ScoolEventCenter.Module.Identity.Presentation;

namespace ScoolEventCenter.Module.Identity;

public static class DependencyInjection
{
    public static IServiceCollection AddIdentityModule(this IServiceCollection services)
    {

        services.AddControllers().PartManager.ApplicationParts
            .Add(new AssemblyPart(typeof(IdentityController).Assembly));
        services.AddScoped<IAuthService, AuthService>();
        services.AddValidatorsFromAssemblyContaining<RegisterUserDtoValidator>();
        return services;
    }

}
