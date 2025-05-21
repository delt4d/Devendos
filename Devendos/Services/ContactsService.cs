using Devendos.Database;
using Devendos.Models;
using Communication = Microsoft.Maui.ApplicationModel.Communication;

namespace Devendos.Services;

public interface IContactsService
{
    public IAsyncEnumerable<ContactInfo> GetContactsAsync();
    public Task SaveContactReminderDateAsync(string contactId, DateTime? reminderDate);
    public Task RemoveContactReminderDateAsync(string contactId);
}

public class ContactsService(
    IPermissionsService<Permissions.ContactsRead> readContactsPermission,
    IAppDb db) : IContactsService
{
    public async IAsyncEnumerable<ContactInfo> GetContactsAsync()
    {
        var status = await readContactsPermission.RequestPermissions();

        if (status != PermissionStatus.Granted)
            yield break;
        
        var contactsWithReminder = await db.GetAllContactsAsync();
        
        foreach (var contact in await Communication.Contacts.Default.GetAllAsync())
        {
            var contactInfo = contactsWithReminder.FirstOrDefault(x => x.Id == contact.Id);
            
            yield return new ContactInfo(
                contact.Id,
                contact.DisplayName,
                contact.Phones.Select(x => x.PhoneNumber).ToArray(),
                contactInfo?.ReminderDate);
        }
    }

    public async Task SaveContactReminderDateAsync(string contactId, DateTime? reminderDate)
    {
        if (reminderDate is null)
            throw new Exception("Reminder date cannot be null");

        await db.SaveContactAsync(new ContactInfoEntity
        {
            Id = contactId,
            ReminderDate = (DateTime)reminderDate,
        });
    }

    public async Task RemoveContactReminderDateAsync(string contactId)
    {
        await db.RemoveContactAsync(contactId);
    }
}