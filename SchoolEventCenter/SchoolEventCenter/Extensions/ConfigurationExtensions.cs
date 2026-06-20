using Microsoft.Extensions.Configuration;
namespace SchoolEventCenter.Api.Extensions;

public static class CollectionExtensions
{
    public static IConfigurationBuilder AddEnvConfig(this IConfigurationBuilder configuration)
    {
        var currentDir = new DirectoryInfo(Directory.GetCurrentDirectory());
        Console.WriteLine($"[ENV INFO] Starting search from: {currentDir.FullName}");

        int countDir = 0;
        bool fileFound = false;

        while (currentDir != null && countDir < 5)
        {
            var files = currentDir.GetFiles("*.env*"); // Simpler match pattern

            if (files.Any())
            {
                var file = files.First();

                Console.WriteLine($"[ENV SUCCESS] Found and loading env file: {file.FullName}");
                DotNetEnv.Env.Load(file.FullName);

                fileFound = true;

                break;
            }

            currentDir = currentDir.Parent;
            countDir++;
        }

        if (!fileFound)
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("[ENV WARNING] No .env file was discovered in the directory tree loop!");
            Console.ResetColor();
        }

        // Sync with System Environment Variables
        configuration.AddEnvironmentVariables();

        return configuration;
    }
}
