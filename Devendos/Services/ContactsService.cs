using Android.Content;
using Android.Provider;
using Devendos.Models;
using Communication = Microsoft.Maui.ApplicationModel.Communication;

namespace Devendos.Services;

public interface IContactsService
{
    public IAsyncEnumerable<ContactInfo> GetContactsAsync();
    public Task SaveContactAsync(ContactInfo contact);
}

public class ContactsService(IPermissionsService<Permissions.ContactsRead> readContactsPermission) : IContactsService
{
    public async IAsyncEnumerable<ContactInfo> GetContactsAsync()
    {
        var status = await readContactsPermission.RequestPermissions();
        
        if (status != PermissionStatus.Granted)
            yield break;
        
        foreach (var contact in await Communication.Contacts.Default.GetAllAsync())
            yield return new ContactInfo(
                contact.Id,
                contact.DisplayName,
                contact.Phones.Select(x => x.PhoneNumber).ToArray());
    }

    public Task SaveContactAsync(ContactInfo contact)
    {
        throw new NotImplementedException();
    }
}