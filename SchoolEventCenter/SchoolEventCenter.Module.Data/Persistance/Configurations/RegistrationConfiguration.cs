using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolEventCenter.Module.Data.Domain.Entities;

public class RegistrationConfiguration : IEntityTypeConfiguration<Registration>
{
    public void Configure(EntityTypeBuilder<Registration> entity)
    {
        entity.ToTable("Registrations");

        entity.HasKey(x => x.Id);


        entity.Property(x => x.Status)
            .HasConversion<int>();

        entity.Property(x => x.RegisteredAt)
            .IsRequired();

        entity.Property(x => x.WaitlistPosition);

        entity.Property(x => x.CancelledAt);

        entity.HasIndex(x => new
        {
            x.UserId,
            x.SchoolEventId
        });

        entity.HasIndex(x => new
        {
            x.SchoolEventId,
            x.Status
        });

        entity.HasIndex(x => new
        {
            x.SchoolEventId,
            x.RegisteredAt
        });
    }
}