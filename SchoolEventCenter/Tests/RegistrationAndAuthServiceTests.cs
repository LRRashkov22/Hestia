using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Moq;
using SchoolEventCenter.Module.Data.Domain.Entities;
using SchoolEventCenter.Module.Data.Domain.Events;
using SchoolEventCenter.Module.Data.Domain.Enums;
using SchoolEventCenter.Module.Data.Options;
using SchoolEventCenter.Module.Data.Persistance;
using SchoolEventCenter.Module.Data.Shared;
using SchoolEventCenter.Module.Data.Shared.Common;
using SchoolEventCenter.Module.Registrations.Application.Service;
using ScoolEventCenter.Module.Identity.Application.DTOs;
using ScoolEventCenter.Module.Identity.Application.Services;
using Xunit;

namespace Tests;

public class RegistrationAndAuthServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly SECDbContext _context;
    private readonly RegistrationService _registrationService;
    private readonly AuthService _authService;

    public RegistrationAndAuthServiceTests()
    {
        _connection = new SqliteConnection("Filename=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<SECDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new SECDbContext(options);
        _context.Database.EnsureCreated();

        _registrationService = new RegistrationService(_context, new TestEventPublisher());

        var jwtOptions = new JwtOptions
        {
            Key = "super_secret_key_that_is_long_enough_for_hmac_sha512_validation_123456!",
            Issuer = "TestIssuer",
            Audience = "TestAudience"
        };
        var optionsMock = new Moq.Mock<IOptions<JwtOptions>>();
        optionsMock.Setup(o => o.Value).Returns(jwtOptions);
        _authService = new AuthService(_context, optionsMock.Object);
    }

    [Fact]
    public async Task RegisterAsync_ShouldConfirmRegistration_WhenCapacityIsAvailable()
    {
        var eventId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var organizerId = Guid.NewGuid();

        _context.Users.Add(new User
        {
            Id = userId,
            Username = "student",
            Email = "student@example.com",
            Role = UserRole.Student,
            CreatedAt = DateTime.UtcNow
        });

        _context.Users.Add(new User
        {
            Id = organizerId,
            Username = "organizer",
            Email = "organizer@example.com",
            Role = UserRole.Organizer,
            CreatedAt = DateTime.UtcNow
        });

        _context.SchoolEvents.Add(new SchoolEvent
        {
            Id = eventId,
            Title = "AI Workshop",
            Capacity = 1,
            Status = EventStatus.Published,
            EndsAt = DateTime.UtcNow.AddDays(1),
            OrganizerId = organizerId
        });
        await _context.SaveChangesAsync();

        var result = await _registrationService.RegisterAsync(eventId, userId);

        Assert.True(result.Success);
        Assert.Equal(RegistrationStatus.Confirmed, result.Value.Status);
        Assert.Null(result.Value.WaitlistPosition);
    }

    [Fact]
    public async Task RegisterAsync_ShouldPlaceOnWaitlist_WhenCapacityIsFull()
    {
        var eventId = Guid.NewGuid();
        var user1Id = Guid.NewGuid();
        var user2Id = Guid.NewGuid();
        var organizerId = Guid.NewGuid();

        _context.Users.AddRange(
            new User
            {
                Id = user1Id,
                Username = "student1",
                Email = "student1@example.com",
                Role = UserRole.Student,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = user2Id,
                Username = "student2",
                Email = "student2@example.com",
                Role = UserRole.Student,
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = organizerId,
                Username = "organizer",
                Email = "organizer@example.com",
                Role = UserRole.Organizer,
                CreatedAt = DateTime.UtcNow
            });

        _context.SchoolEvents.Add(new SchoolEvent
        {
            Id = eventId,
            Title = "AI Workshop",
            Capacity = 1,
            Status = EventStatus.Published,
            EndsAt = DateTime.UtcNow.AddDays(1),
            OrganizerId = organizerId
        });

        _context.Registrations.Add(new Registration
        {
            UserId = user1Id,
            SchoolEventId = eventId,
            Status = RegistrationStatus.Confirmed,
            RegisteredAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var result = await _registrationService.RegisterAsync(eventId, user2Id);

        Assert.True(result.Success);
        Assert.Equal(RegistrationStatus.Waitlisted, result.Value.Status);
        Assert.Equal(1, result.Value.WaitlistPosition);
    }

    [Fact]
    public async Task RegisterUser_ShouldCreateUser_WhenDetailsAreUnique()
    {
        var dto = new CreateUserDto { Username = "newuser", Email = "new@test.com", Password = "SecurePassword123" };

        var (user, error) = await _authService.RegisterUser(dto);

        Assert.Null(error);
        Assert.NotNull(user);
        Assert.Equal("newuser", user!.Username);
        Assert.Equal(UserRole.Student, user.Role);

        var dbUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        Assert.NotNull(dbUser);
    }

    [Fact]
    public async Task LoginAsync_ShouldReturnTokens_WhenCredentialsAreValid()
    {
        var registerDto = new CreateUserDto { Username = "loginuser", Email = "login@test.com", Password = "MyPassword!" };
        await _authService.RegisterUser(registerDto);

        var loginDto = new UserDto { Email = "login@test.com", Password = "MyPassword!" };

        var (tokenResponse, error) = await _authService.LoginAsync(loginDto);

        Assert.Null(error);
        Assert.NotNull(tokenResponse);
        Assert.False(string.IsNullOrEmpty(tokenResponse!.AccessToken));
        Assert.False(string.IsNullOrEmpty(tokenResponse.RefreshToken));
    }

    [Fact]
    public async Task Logout_ShouldClearTokens_WhenUserExists()
    {
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Username = "user",
            Email = "u@t.com",
            RefreshToken = "some-token",
            RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(1)
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        await _authService.Logout(userId);

        var updatedUser = await _context.Users.FindAsync(userId);
        Assert.NotNull(updatedUser);
        Assert.Null(updatedUser!.RefreshToken);
        Assert.Null(updatedUser.RefreshTokenExpiryTime);
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    private sealed class TestEventPublisher : IEventPublisher
    {
        public Task PublishAsync(IDomainEvent domainEvent) => Task.CompletedTask;
    }
}
