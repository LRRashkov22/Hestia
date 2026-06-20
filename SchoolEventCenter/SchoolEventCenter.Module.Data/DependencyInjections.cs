using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;
using SchoolEventCenter.Module.Data.Persistance;
using SchoolEventCenter.Module.Data.Options;


namespace SchoolEventCenter.Module.Data
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddData(this IServiceCollection services, IOptions<DatabaseOptions> config)
        {
            DatabaseOptions dbConfig = config.Value;

            services.AddDbContext<SECDbContext>(options =>
                options.UseNpgsql(dbConfig.DefaultConnection));

            return services;

        }

    }
}
