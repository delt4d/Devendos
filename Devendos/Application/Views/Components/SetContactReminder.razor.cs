using System.Globalization;
using Devendos.Application.Models;
using Devendos.Application.Services;
using Microsoft.AspNetCore.Components;
using MudBlazor;

namespace Devendos.Application.Views.Components;

public partial class SetContactReminder(IContactsService contactsService) : ComponentBase
{
    private static readonly CultureInfo PtBrCulture = new("pt-BR");
    
    [CascadingParameter]
    public required IMudDialogInstance MudDialog { get; set; }

    [Parameter] 
    public required ContactInfo ContactInfo { get; set; }
    
    [Parameter]
    public Action? OnReminderDateSet { get; set; }
    
    private async Task SaveReminderDateAsync()
    {
        await contactsService.SaveContactReminderDateAsync(
            ContactInfo.Id, 
            ContactInfo.ReminderDate);
        
        MudDialog.Close(DialogResult.Ok(true));

        OnReminderDateSet?.Invoke();
    }

    private void Cancel() => MudDialog.Cancel();
}