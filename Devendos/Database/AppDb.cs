using Devendos.Models;
using SQLite;

namespace Devendos.Database;

public interface IAppDb
{
    public Task SaveContactAsync(ContactInfoEntity data);
    public Task<List<ContactInfoEntity>> GetAllContactsAsync();
    public Task RemoveContactAsync(string id);
}

public class AppDb(ISQLiteAsyncConnection conn) : IAppDb
{
    private AsyncTableQuery<ContactInfoEntity> ContactInfoQuery => conn.Table<ContactInfoEntity>();
    
    private async Task InitAsync()
    {
        await conn.CreateTableAsync<ContactInfoEntity>();
    }

    public async Task SaveContactAsync(ContactInfoEntity data)
    {
        await InitAsync();
        await conn.InsertOrReplaceAsync(data);
    }

    public async Task<List<ContactInfoEntity>> GetAllContactsAsync()
    {
        await InitAsync();
        return await ContactInfoQuery.ToListAsync();
    }

    public async Task RemoveContactAsync(string id)
    {
        await InitAsync();
        var contactInfo = await ContactInfoQuery.FirstOrDefaultAsync(x => x.Id == id);
        if (contactInfo is null) return;
        await conn.DeleteAsync<ContactInfoEntity>(id);
    }
}