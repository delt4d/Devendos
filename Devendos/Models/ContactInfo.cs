namespace Devendos.Models;

public class ContactInfo(string id, string name, string[] phones)
{
    public string Id { get; } = id;
    public string Name { get; } = name;
    public string[] Phones { get; } = phones;
    public DateTime? ReminderData { get; set; } = null;
}