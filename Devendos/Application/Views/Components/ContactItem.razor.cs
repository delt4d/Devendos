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

    private bool IsLoading { get; set; }

    private DialogParameters<SetContactReminder> DialogParams => new()
    {
        {
            x => x.ContactInfo,
            ContactInfo
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
        
        await contactsService.RemoveContactReminderDateAsync(ContactInfo.Id);
        ContactInfo.ReminderDate = null;
        IsLoading = false;
        StateHasChanged();
    }
    
    private async Task ShowDialogAsync()
    {
        await dialogService.ShowAsync<SetContactReminder>(null, DialogParams);
    }
}