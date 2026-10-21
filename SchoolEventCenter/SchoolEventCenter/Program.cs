using SchoolEventCenter.Api.Extensions;
using SchoolEventCenter.Api.Helpers;
var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddEnvConfig();

builder.Services.AddApiServices(builder.Configuration);

var app = builder.Build();

ApplicationInitializer.Initialize(app);

app.UseApiMiddleware();

app.Run();
