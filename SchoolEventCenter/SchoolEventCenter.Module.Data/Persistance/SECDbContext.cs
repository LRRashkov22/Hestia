using Microsoft.EntityFrameworkCore;
using SchoolEventCenter.Module.Data.Domain.Entities;

namespace SchoolEventCenter.Module.Data.Persistance;

public class SECDbContext : DbContext
{
    public SECDbContext(DbContextOptions<SECDbContext> options) : base(options) { }
    public DbSet<User> Users => Set<User>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Registration> Registrations => Set<Registration>();
    public DbSet<SchoolEvent> SchoolEvents => Set<SchoolEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(SECDbContext).Assembly);
    }

}
