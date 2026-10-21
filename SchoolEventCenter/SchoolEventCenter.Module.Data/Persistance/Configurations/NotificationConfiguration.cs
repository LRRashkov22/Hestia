using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolEventCenter.Module.Data.Domain.Entities;

public class NotificationConfiguration :  IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> entity)
    {
        entity.ToTable("Notifications");

        entity.HasKey(x => x.Id);


        entity.Property(x => x.Type)
            .HasConversion<int>();

        entity.Property(x => x.Title)
            .IsRequired()
            .HasMaxLength(150);

        entity.Property(x => x.Message)
            .IsRequired()
            .HasMaxLength(1000);

        entity.Property(x => x.IsRead)
            .HasDefaultValue(false);

        entity.Property(x => x.CreatedAt)
            .IsRequired();

        entity.Property(x => x.ReadAt);


        entity.HasIndex(x => x.UserId);

        entity.HasIndex(x => x.CreatedAt);
    }
}