using Devendos.Application.Models;

namespace Devendos.Application.Services;

public interface IContactsSearchService
{
    public IEnumerable<ContactInfo> Contacts { get; set;  }
    public IEnumerable<ContactInfo> FilteredContacts { get; }
    public void SetListener(Action onFilter);
    public void UpdateSearchText(string searchText);
}

public class ContactsSearchService : IContactsSearchService
{
    private bool _hadExactItem;
    private bool _hadSimilarItem;
    private bool _hadContainedItem;
    private Action? _onFilter;
    private IEnumerable<ContactInfo> _contacts = [];

    public IEnumerable<ContactInfo> Contacts
    {
        get => _contacts;
        set
        {
            _contacts = value;
            FilteredContacts = [];
        }
    }

    public IEnumerable<ContactInfo> FilteredContacts { get; private set; } = [];

    public void SetListener(Action onFilter)
    {
        _onFilter = onFilter;
    }

    public void UpdateSearchText(string searchText)
    {
        var filteredContacts = new List<ContactInfo>();

        foreach (var contact in Contacts)
        {
            if (string.IsNullOrWhiteSpace(searchText))
            {
                filteredContacts.Add(contact);
                continue;
            }

            if (IsExact(contact.Name, searchText))
            {
                if (_hadExactItem == false)
                {
                    // Only accept exact items
                    filteredContacts.Clear();
                    _hadExactItem = true;
                }

                filteredContacts.Add(contact);
                continue;
            }

            if (IsSimilar(contact.Name, searchText))
            {
                if (_hadSimilarItem == false)
                {
                    // Only accept similar items 
                    filteredContacts.Clear();
                    _hadSimilarItem = true;
                }

                filteredContacts.Add(contact);
                continue;
            }

            if (IsContained(contact.Name, searchText))
            {
                if (_hadContainedItem == false)
                {
                    // Only accept contained items
                    filteredContacts.Clear();
                    _hadContainedItem = true;
                }

                filteredContacts.Add(contact);
                continue;
            }

            if (HasWordContained(contact.Name, searchText))
            {
                filteredContacts.Add(contact);
            }
        }

        FilteredContacts = filteredContacts;
        _onFilter?.Invoke();
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
