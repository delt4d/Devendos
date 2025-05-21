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
    public required ContactInfo ContactInfo { get; set; }

    public bool Disabled { get; set; } = false;
    
    private async Task RemoveContactReminderDateAsync()
    {
        Disabled = true;
        StateHasChanged();
        
        await contactsService.RemoveContactReminderDateAsync(ContactInfo.Id);
        ContactInfo.ReminderDate = null;
        Disabled = false;
        StateHasChanged();
    }
    
    private async Task ShowDialogAsync()
    {
        var parameters = new DialogParameters<SetContactReminder> {
            {
                x => x.ContactInfo, 
                ContactInfo
            },
            {
                x => x.OnReminderDateSet,
                StateHasChanged
            }
        };
        
        await dialogService.ShowAsync<SetContactReminder>(null, parameters);
    }
}