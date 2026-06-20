using System;
using System.Collections.Generic;
using System.Data;
using System.Text;
using SchoolEventCenter.Module.Data.Domain.Enums;
namespace ScoolEventCenter.Module.Identity.Application.DTOs;

public class CreateUserDto
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
