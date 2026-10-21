using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolEventCenter.Module.Data.Domain.Entities;

namespace SchoolEventCenter.Module.Data.Persistance.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> entity)
    {
        entity.ToTable("Users");

        entity.HasKey(x => x.Id);

        entity.Property(x => x.Username)
            .IsRequired()
            .HasMaxLength(50);

        entity.Property(x => x.Email)
            .IsRequired()
            .HasMaxLength(255);

        entity.Property(x => x.PasswordHash)
            .IsRequired();

        entity.Property(x => x.Role)
            .HasConversion<int>();

        entity.Property(x => x.CreatedAt)
            .IsRequired();


        entity.HasIndex(x => x.Username)
            .IsUnique();

        entity.HasIndex(x => x.Email)
            .IsUnique();


        // Organizer -> Events

        entity.HasMany(x => x.OrganizedEvents)
            .WithOne(x => x.Organizer)
            .HasForeignKey(x => x.OrganizerId)
            .OnDelete(DeleteBehavior.Restrict);


        // User -> Registrations

        entity.HasMany(x => x.Registrations)
            .WithOne(x => x.User)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);


        // User -> Notifications

        entity.HasMany(x => x.Notifications)
            .WithOne(x => x.User)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}