using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolEventCenter.Module.Data.Options
{
    public class CorsOptions
    {
        public string PolicyName { get; set; } = string.Empty;

        public string[] AllowedOrigins { get; set; } = Array.Empty<string>();
    }
}
