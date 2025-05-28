using Devendos.Application.Models;
using Devendos.Application.Services;
using Microsoft.AspNetCore.Components;
using MudBlazor;

namespace Devendos.Application.Views.Components;

public partial class ContactItem(
    IContactsService contactsService,
    IDialogService dialogService) : ComponentBase
{
    [Parameter]
    public required ContactInfo Contact { get; set; }
    
    [Parameter]
    public EventCallback<ContactInfo> ContactInfoChanged { get; set; }

    private bool IsLoading { get; set; }

    private DialogParameters<ContactReminderDialog> DialogParams => new()
    {
        {
            x => x.ContactInfo,
            Contact
        },
        {
            x => x.OnReminderDateSet,
            StateHasChanged
        }
    };
    
    private async Task RemoveContactReminderDateAsync()
    {
        IsLoading = true;
        StateHasChanged();
        
        await contactsService.RemoveContactReminderDateAsync(Contact.Id);
        Contact.ReminderDate = null;
        IsLoading = false;
        StateHasChanged();
    }
    
    private async Task ShowDialogAsync()
    {
        await dialogService.ShowAsync<ContactReminderDialog>(null, DialogParams);
    }
}