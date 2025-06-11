using Devendos.Application.Models;
using Devendos.Application.Services;
using Microsoft.AspNetCore.Components;

namespace Devendos.Application.Views.Components;

public partial class ContactListSearch(IContactsSearchService searchService) : ComponentBase
{
    private readonly IContactsSearchService _searchService = searchService;
    private bool _firstLoad;

    [Parameter] 
    public string SearchValue { get; set; } = string.Empty;
    
    [Parameter]
    public EventCallback<string> SearchValueChanged { get; set; }

    [Parameter]
    public IEnumerable<ContactInfo> Contacts { get; set; } = [];

    [Parameter]
    public EventCallback<IEnumerable<ContactInfo>> ContactsChanged { get; set; }

    protected override Task OnInitializedAsync()
    {
        _searchService.SetListener(() => StateHasChanged());
        _firstLoad = true;

        StateHasChanged();

        return Task.CompletedTask;
    }

    protected override void OnParametersSet()
    {
        _searchService.Contacts = Contacts;
        _searchService.UpdateSearchText(SearchValue);
    }
}
