using Devendos.Application.Models;
using Microsoft.AspNetCore.Components;

namespace Devendos.Application.Views.Components;

public partial class ContactList : ComponentBase
{
    [Parameter]
    public required IEnumerable<ContactInfo> Contacts { get; set; }

    [Parameter]
    public Action<ContactInfo>? OnContactInfoChanged { get; set; }

    private IEnumerable<(bool, ContactInfo)> GetContacts()
    {
        var contactsCount = Contacts.Count();
        var index = 0;

        foreach (var contact in Contacts)
        {
            var isLastItem = ++index == contactsCount;
            yield return (isLastItem, contact);
        }
    }

    private void NotifyContactItemChanged(ContactInfo contact)
    {
        OnContactInfoChanged?.Invoke(contact);
    }
}