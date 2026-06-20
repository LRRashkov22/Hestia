using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SchoolEventCenter.Module.Data;
using SchoolEventCenter.Module.Data.Options;
using ScoolEventCenter.Module.Identity;
using System.Text;
namespace SchoolEventCenter.Api.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddApiServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddControllers();
            services.AddOpenApi();
            services.AddSignalR();

            services.ConfigureDatabase(configuration);
            services.ConfigureJwtAuthentication(configuration);
            services.ConfigureCorsPolicies(configuration);

            //Fluet Validation declared inside every Module
            services.AddFluentValidationAutoValidation();

            services.ConfigureApplicationModules();

            return services;
        }

        private static void ConfigureApplicationModules(this IServiceCollection services)
        {
            services.AddIdentityModule();
        }

        //------------------------------------------------------------------------------------

        private static void ConfigureDatabase(this IServiceCollection services, IConfiguration configuration)
        {
            // Register the section so components can inject IOptions<DatabaseOptions> via DI
            services.Configure<DatabaseOptions>(configuration.GetSection("ConnectionStrings"));

            // Build a temporary service provider to resolve the IOptions container immediately
            using var serviceProvider = services.BuildServiceProvider();
            var dbOptionsAccessor = serviceProvider.GetRequiredService<IOptions<DatabaseOptions>>();

            // Validation check against the underlying values inside the resolved wrapper
            if (dbOptionsAccessor.Value == null || string.IsNullOrEmpty(dbOptionsAccessor.Value.DefaultConnection))
            {
                throw new InvalidOperationException("Startup Failure: Database connection string is missing inside IOptions configuration wrapper.");
            }

            services.AddData(dbOptionsAccessor);
        }

        private static void ConfigureJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
        {
            var section = configuration.GetSection("JwtSettings");

            // Register the section so components can inject IOptions<JwtOptions>
            services.Configure<JwtOptions>(section);

            // Extract values directly for the JwtBearer middleware setup
            var jwtOptions = section.Get<JwtOptions>() ?? new JwtOptions();

            if (string.IsNullOrEmpty(jwtOptions.Key))
            {
                throw new InvalidOperationException("Startup Failure: 'JwtSettings:Key' environment variable is missing or empty.");
            }

            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = jwtOptions.Issuer,
                        ValidAudience = jwtOptions.Audience,
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(jwtOptions.Key))
                    };

                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            var accessToken =
                                context.Request.Query["access_token"];

                            var path = context.HttpContext.Request.Path;

                            if (!string.IsNullOrEmpty(accessToken) &&
                                path.StartsWithSegments("/hubs/notifications"))
                            {
                                context.Token = accessToken;
                            }

                            return Task.CompletedTask;
                        }
                    };
                });
        }

        private static void ConfigureCorsPolicies(this IServiceCollection services, IConfiguration configuration)
        {
            var section = configuration.GetSection("CorsSettings");

            // Register the section so components can inject IOptions<CorsOptions>
            services.Configure<Module.Data.Options.CorsOptions>(section);

            var corsOptions = section.Get<Module.Data.Options.CorsOptions>() ?? new Module.Data.Options.CorsOptions();
            string policyName = string.IsNullOrEmpty(corsOptions.PolicyName) ? "CorsPolicy" : corsOptions.PolicyName;

            services.AddCors(options =>
            {
                options.AddPolicy(policyName, policy =>
                {
                    if (corsOptions.AllowedOrigins != null && corsOptions.AllowedOrigins.Length > 0)
                    {
                        policy.WithOrigins(corsOptions.AllowedOrigins);
                    }
                    else
                    {
                        policy.WithOrigins("http://localhost:5173");
                    }

                    policy.AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                });
            });
        }
    }
}
