using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolEventCenter.Module.Data.Domain.Entities;

public class SchoolEventConfiguration : IEntityTypeConfiguration<SchoolEvent>
{
    public void Configure(EntityTypeBuilder<SchoolEvent> entity)
    {
        entity.ToTable("SchoolEvents");

        entity.HasKey(x => x.Id);


        entity.Property(x => x.Title)
            .IsRequired()
            .HasMaxLength(150);

        entity.Property(x => x.Description)
            .IsRequired()
            .HasMaxLength(1000);

        entity.Property(x => x.Location)
            .HasMaxLength(250);

        entity.Property(x => x.Url)
            .HasMaxLength(500);

        entity.Property(x => x.Capacity)
            .IsRequired();

        entity.Property(x => x.Status)
            .HasConversion<int>();

        entity.Property(x => x.StartsAt)
            .IsRequired();

        entity.Property(x => x.EndsAt)
            .IsRequired();

        entity.Property(x => x.CreatedAt)
            .IsRequired();


        entity.HasMany(x => x.Registrations)
            .WithOne(x => x.SchoolEvent)
            .HasForeignKey(x => x.SchoolEventId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}