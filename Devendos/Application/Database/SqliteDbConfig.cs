namespace Devendos.Application.Database;

public static class SqliteDbConfig
{
    private const string DatabaseFilename = "devendos.db3";
    
    public static readonly SQLite.SQLiteOpenFlags Flags =
        SQLite.SQLiteOpenFlags.ReadWrite |
        SQLite.SQLiteOpenFlags.Create |
        SQLite.SQLiteOpenFlags.SharedCache;
    
    public static string DatabasePath => Path.Combine(FileSystem.AppDataDirectory, DatabaseFilename);
}