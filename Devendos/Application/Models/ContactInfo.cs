namespace Devendos.Application.Models;

public class ContactInfo(string id, string name, string[] phones, DateTime? reminderDate)
{
    public string Id { get; } = id;
    public string Name { get; } = name;
    public string[] Phones { get; } = phones;
    public DateTime? ReminderDate { get; set; } = reminderDate;

    public ContactInfo(ContactInfo contactInfo) : 
        this(contactInfo.Id, contactInfo.Name, contactInfo.Phones, contactInfo.ReminderDate)
    {
    }
}