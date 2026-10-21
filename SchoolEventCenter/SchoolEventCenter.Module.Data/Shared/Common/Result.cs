using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolEventCenter.Module.Data.Shared.Common;

public class Result<T>
{
    public bool Success { get; init; }

    public string? Error { get; init; }

    public T? Value { get; init; }

    public static Result<T> Ok(T value)
    {
        return new Result<T>
        {
            Success = true,
            Value = value
        };
    }

    public static Result<T> Fail(string error)
    {
        return new Result<T>
        {
            Success = false,
            Error = error
        };
    }
}
