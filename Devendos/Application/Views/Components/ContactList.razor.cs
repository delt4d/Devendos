using Devendos.Application.Models;
using Devendos.Application.Services;
using Microsoft.AspNetCore.Components;

namespace Devendos.Application.Views.Components;

public partial class ContactList : ComponentBase
{
    private readonly IContactsService _contactsService;
    private readonly ContactsFilter _contactsFilter;
    private List<ContactInfo> FilteredContacts => _contactsFilter.FilteredContacts;
    private bool _firstLoad;
    
    [Parameter] 
    public string SearchValue { get; set; } = string.Empty;

    [Parameter]
    public EventCallback<string> SearchValueChanged { get; set; }

    public ContactList(IContactsService contactsService)
    {
        _contactsService = contactsService;
        _contactsFilter = new ContactsFilter(StateHasChanged);
    }
    
    protected override async Task OnInitializedAsync()
    {
        await foreach (var item in _contactsService.GetContactsAsync())
        {
            _contactsFilter.Contacts.Add(item);
        }

        await _contactsFilter.UpdateFilteredContactsAsync(SearchValue);
        _firstLoad = true;
        StateHasChanged();
    }

    protected override async void OnParametersSet()
    {
        await _contactsFilter.UpdateFilteredContactsAsync(SearchValue);
    }
    
    private static IEnumerable<(int, ContactInfo)> GetContactsWithIndex(IEnumerable<ContactInfo> contacts)
    {
        var index = 0;
        
        foreach (var contact in contacts)
        {
            yield return (index++, contact);
        }
    }
    
    private static bool IsLastItem(int index, int totalLength) => index + 1 == totalLength;
}

internal class ContactsFilter(Action? onFilteredContacts)
{
    private bool _hadExactItem;
    private bool _hadSimilarItem;
    private bool _hadContainedItem;
    
    public List<ContactInfo> Contacts { get; set; } = [];
    public List<ContactInfo> FilteredContacts { get; } = [];

    public async Task UpdateFilteredContactsAsync(string searchText)
    {
        await Task.Run(() =>
        {
            FilteredContacts.Clear();

            foreach (var contact in Contacts)
            {
                if (string.IsNullOrWhiteSpace(searchText))
                {
                    FilteredContacts.Add(contact);
                    continue;
                }

                if (IsExact(contact.Name, searchText))
                {
                    if (_hadExactItem == false)
                    {
                        // Only accept exact items
                        FilteredContacts.Clear();
                        _hadExactItem = true;
                    }

                    FilteredContacts.Add(contact);
                    continue;
                }

                if (IsSimilar(contact.Name, searchText))
                {
                    if (_hadSimilarItem == false)
                    {
                        // Only accept similar items 
                        FilteredContacts.Clear();
                        _hadSimilarItem = true;
                    }

                    FilteredContacts.Add(contact);
                    continue;
                }

                if (IsContained(contact.Name, searchText))
                {
                    if (_hadContainedItem == false)
                    {
                        // Only accept contained items
                        FilteredContacts.Clear();
                        _hadContainedItem = true;
                    }

                    FilteredContacts.Add(contact);
                    continue;
                }

                if (HasWordContained(contact.Name, searchText))
                {
                    FilteredContacts.Add(contact);
                }
            }
        });
        
        onFilteredContacts?.Invoke();
    }

    private static bool IsExact(string s1, string s2) => 
        s1.Equals(s2, StringComparison.CurrentCultureIgnoreCase);
    
    private static bool IsSimilar(string s1, string s2) =>
        s1.Trim().Equals(s2, StringComparison.InvariantCultureIgnoreCase);
    
    private static bool IsContained(string s1, string s2) => 
        s1.Trim().Contains(s2, StringComparison.InvariantCultureIgnoreCase);
    
    private static bool HasWordContained(string s1, string s2) => 
        s1.Split(' ').Any(w => IsContained(w, s2));
}