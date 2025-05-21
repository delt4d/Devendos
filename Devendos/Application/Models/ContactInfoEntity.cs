namespace Devendos.Application.Models;

public class ContactInfoEntity
{
    [SQLite.PrimaryKey]
    public string Id { get; set; } = string.Empty;
    
    [SQLite.NotNull]
    public DateTime ReminderDate { get; set; }
}