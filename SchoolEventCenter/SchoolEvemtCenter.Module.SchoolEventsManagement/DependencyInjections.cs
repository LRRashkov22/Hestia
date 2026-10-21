using FluentValidation;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.Extensions.DependencyInjection;
using SchoolEvemtCenter.Module.SchoolEventsManagement.Application.DTOs.OrganizerDTOs;
using SchoolEvemtCenter.Module.SchoolEventsManagement.Application.Interfaces;
using SchoolEvemtCenter.Module.SchoolEventsManagement.Application.Service;
using SchoolEvemtCenter.Module.SchoolEventsManagement.Presentation;

namespace SchoolEvemtCenter.Module.SchoolEventsManagement;

public static class DependencyInjection
{
    public static IServiceCollection AddSchoolEventModule(this IServiceCollection services)
    {

        services.AddControllers().PartManager.ApplicationParts
            .Add(new AssemblyPart(typeof(SchoolEventController).Assembly));
        services.AddScoped<ISchoolEventCRUDService, SchoolEventCRUDService>();
        services.AddScoped<ISchoolEventQueryService, SchoolEventQueryService>();
        services.AddScoped<IStudentEventQueryService, StudentEventQueryService>();
        services.AddValidatorsFromAssemblyContaining<SchoolEventDto>();
        return services;
    }

}
